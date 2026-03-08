import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  recurrenceRules,
  taskOccurrenceLogs,
  tasks,
  type HouseholdMemberRecord,
  type RecurrenceRuleRecord,
  type TaskOccurrenceLogRecord,
  type TaskRecord,
} from "@/lib/db/schema";
import { getHouseholdMembers, getOrCreateProfile } from "@/features/profile/data";
import {
  addDays,
  buildMonthGrid,
  compareDateKeys,
  formatLongDate,
  formatMonthLabel,
  todayKey,
} from "@/features/tasks/lib/dates";
import {
  describeRecurrence,
  nextOccurrence,
  projectOccurrences,
  serializeDaysOfWeek,
  type RecurrenceRuleShape,
} from "@/features/tasks/lib/recurrence";
import type { QuickAddDraft, TaskInput } from "@/features/tasks/types";

export type TaskWithRelations = TaskRecord & {
  assignee: HouseholdMemberRecord | null;
  recurrenceRule: RecurrenceRuleRecord | null;
  occurrenceLogs: TaskOccurrenceLogRecord[];
};

export type DisplayTask = {
  id: string;
  title: string;
  dueDate: string | null;
  status: TaskRecord["status"];
  priority: TaskRecord["priority"];
  category: string | null;
  assigneeName: string | null;
  assigneeMemberId: string | null;
  isRecurring: boolean;
  recurrenceSummary: string | null;
  nextDue: string | null;
  notes: string | null;
  completedAt: string | null;
};

export type AgendaItem = {
  key: string;
  taskId: string;
  title: string;
  scheduledFor: string;
  assigneeName: string | null;
  priority: TaskRecord["priority"];
  category: string | null;
  completed: boolean;
  isRecurring: boolean;
  recurrenceSummary: string | null;
};

function recurrenceShape(rule: RecurrenceRuleRecord): RecurrenceRuleShape {
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    daysOfWeek: rule.daysOfWeek,
    dayOfMonth: rule.dayOfMonth,
    endsOn: rule.endsOn,
  };
}

function isRecurringTask(task: TaskWithRelations) {
  return Boolean(task.recurrenceRule);
}

function uniqueCategories(taskRows: TaskWithRelations[]) {
  return [...new Set(taskRows.map((task) => task.category).filter(Boolean) as string[])].sort(
    (left, right) => left.localeCompare(right)
  );
}

function taskNextDue(task: TaskWithRelations, start = todayKey()) {
  if (!task.recurrenceRule) {
    return task.dueDate;
  }

  if (!task.dueDate || task.status === "archived") {
    return null;
  }

  return nextOccurrence(task.dueDate, recurrenceShape(task.recurrenceRule), start);
}

function toDisplayTask(task: TaskWithRelations): DisplayTask {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    status: task.status,
    priority: task.priority,
    category: task.category,
    assigneeName: task.assignee?.name ?? null,
    assigneeMemberId: task.assigneeMemberId,
    isRecurring: isRecurringTask(task),
    recurrenceSummary: describeRecurrence(task.recurrenceRule, task.dueDate),
    nextDue: taskNextDue(task),
    notes: task.notes,
    completedAt: task.completedAt,
  };
}

function occurrenceCompleted(task: TaskWithRelations, scheduledFor: string) {
  return task.occurrenceLogs.some((log) => log.scheduledFor === scheduledFor);
}

function agendaItem(task: TaskWithRelations, scheduledFor: string): AgendaItem {
  return {
    key: `${task.id}:${scheduledFor}`,
    taskId: task.id,
    title: task.title,
    scheduledFor,
    assigneeName: task.assignee?.name ?? null,
    priority: task.priority,
    category: task.category,
    completed: task.recurrenceRule
      ? occurrenceCompleted(task, scheduledFor)
      : task.status === "completed",
    isRecurring: Boolean(task.recurrenceRule),
    recurrenceSummary: describeRecurrence(task.recurrenceRule, task.dueDate),
  };
}

async function loadTasks() {
  const profile = await getOrCreateProfile();
  const taskRows = await db.query.tasks.findMany({
    where: eq(tasks.profileId, profile.id),
    with: {
      assignee: true,
      recurrenceRule: true,
      occurrenceLogs: {
        orderBy: (_, { desc }) => [desc(taskOccurrenceLogs.scheduledFor)],
      },
    },
    orderBy: (_, { asc }) => [asc(tasks.status), asc(tasks.dueDate), asc(tasks.title)],
  });

  return {
    profile,
    tasks: taskRows,
  };
}

async function upsertRecurrence(taskId: string, recurrence: TaskInput["recurrence"]) {
  if (!recurrence) {
    await db.delete(recurrenceRules).where(eq(recurrenceRules.taskId, taskId));
    return;
  }

  const existingRule = await db.query.recurrenceRules.findFirst({
    where: eq(recurrenceRules.taskId, taskId),
  });

  const values = {
    taskId,
    frequency: recurrence.frequency,
    interval: recurrence.interval,
    daysOfWeek: serializeDaysOfWeek(recurrence.daysOfWeek),
    dayOfMonth: recurrence.dayOfMonth,
    endsOn: recurrence.endsOn,
    updatedAt: new Date().toISOString(),
  };

  if (existingRule) {
    await db.update(recurrenceRules).set(values).where(eq(recurrenceRules.id, existingRule.id));
    return;
  }

  await db.insert(recurrenceRules).values({
    id: crypto.randomUUID(),
    ...values,
  });
}

export async function saveTaskInput(
  input: TaskInput,
  existingTask?: TaskRecord | null
) {
  const profile = await getOrCreateProfile();
  const taskId = existingTask?.id ?? crypto.randomUUID();
  const isRecurring = Boolean(input.recurrence);
  const nextStatus =
    existingTask?.status === "archived"
      ? "archived"
      : isRecurring
        ? "active"
        : existingTask?.status ?? "active";

  const nextCompletedAt = isRecurring ? null : existingTask?.completedAt ?? null;
  const nextValues = {
    profileId: profile.id,
    title: input.title,
    notes: input.notes,
    dueDate: input.dueDate,
    priority: input.priority,
    category: input.category,
    assigneeMemberId: input.assigneeMemberId,
    status: nextStatus,
    completedAt: nextCompletedAt,
    updatedAt: new Date().toISOString(),
  } satisfies Partial<TaskRecord>;

  if (existingTask) {
    await db.update(tasks).set(nextValues).where(eq(tasks.id, taskId));
  } else {
    await db.insert(tasks).values({
      id: taskId,
      ...nextValues,
    });
  }

  await upsertRecurrence(taskId, input.recurrence);

  return taskId;
}

export async function createQuickAddTasks(drafts: QuickAddDraft[]) {
  for (const draft of drafts) {
    await saveTaskInput({
      title: draft.title,
      notes: null,
      dueDate: draft.dueDate,
      priority: draft.priority,
      category: draft.category,
      assigneeMemberId: draft.assigneeMemberId,
      recurrence: draft.recurrence,
    });
  }
}

export async function getTasksPageData() {
  const [{ tasks: taskRows }, members] = await Promise.all([
    loadTasks(),
    getHouseholdMembers(),
  ]);

  return {
    members,
    categories: uniqueCategories(taskRows),
    tasks: taskRows.map(toDisplayTask),
  };
}

export async function getTaskDetail(taskId: string) {
  const [{ tasks: taskRows }, members] = await Promise.all([
    loadTasks(),
    getHouseholdMembers(),
  ]);
  const task = taskRows.find((candidate) => candidate.id === taskId) ?? null;

  return {
    task,
    members,
    categories: uniqueCategories(taskRows),
  };
}

export async function getDashboardData() {
  const { tasks: taskRows } = await loadTasks();
  const today = todayKey();
  const upcomingEnd = addDays(today, 7);
  const activeTaskRows = taskRows.filter((task) => task.status === "active");
  const oneTimeTasks = activeTaskRows.filter((task) => !task.recurrenceRule);
  const recurringTasks = activeTaskRows.filter((task) => Boolean(task.recurrenceRule));

  const todayItems = [
    ...oneTimeTasks
      .filter((task) => task.dueDate === today)
      .map((task) => agendaItem(task, today)),
    ...recurringTasks.flatMap((task) =>
      task.dueDate && task.recurrenceRule
        ? projectOccurrences(task.dueDate, recurrenceShape(task.recurrenceRule), today, today).map(
            (scheduledFor) => agendaItem(task, scheduledFor)
          )
        : []
    ),
  ].sort((left, right) => left.title.localeCompare(right.title));

  const overdueItems = oneTimeTasks
    .filter((task) => task.dueDate && compareDateKeys(task.dueDate, today) < 0)
    .map((task) => agendaItem(task, task.dueDate!))
    .sort((left, right) => compareDateKeys(left.scheduledFor, right.scheduledFor));

  const upcomingItems = [
    ...oneTimeTasks
      .filter(
        (task) =>
          task.dueDate &&
          compareDateKeys(task.dueDate, today) > 0 &&
          compareDateKeys(task.dueDate, upcomingEnd) <= 0
      )
      .map((task) => agendaItem(task, task.dueDate!)),
    ...recurringTasks.flatMap((task) =>
      task.dueDate && task.recurrenceRule
        ? projectOccurrences(task.dueDate, recurrenceShape(task.recurrenceRule), addDays(today, 1), upcomingEnd).map(
            (scheduledFor) => agendaItem(task, scheduledFor)
          )
        : []
    ),
  ].sort((left, right) => compareDateKeys(left.scheduledFor, right.scheduledFor));

  const weekStart = addDays(today, -new Date(`${today}T12:00:00`).getDay());
  const completedOneTime = taskRows.filter(
    (task) =>
      !task.recurrenceRule &&
      task.completedAt &&
      compareDateKeys(task.completedAt.slice(0, 10), weekStart) >= 0
  ).length;
  const completedRecurring = taskRows.reduce((count, task) => {
    if (!task.recurrenceRule) {
      return count;
    }

    return (
      count +
      task.occurrenceLogs.filter((log) => compareDateKeys(log.scheduledFor, weekStart) >= 0).length
    );
  }, 0);

  return {
    todayLabel: formatLongDate(today),
    todayItems,
    overdueItems,
    upcomingItems,
    stats: {
      dueToday: todayItems.length,
      overdue: overdueItems.length,
      completedThisWeek: completedOneTime + completedRecurring,
      activeRecurring: recurringTasks.length,
    },
  };
}

export async function getSharedData() {
  const [{ tasks: taskRows }, members] = await Promise.all([
    loadTasks(),
    getHouseholdMembers(),
  ]);
  const activeTasks = taskRows.filter((task) => task.status === "active");

  const groups = [
    {
      id: "mine",
      label: "Mine",
      tasks: activeTasks.filter((task) => !task.assigneeMemberId),
    },
    ...members.map((member) => ({
      id: member.id,
      label: member.name,
      tasks: activeTasks.filter((task) => task.assigneeMemberId === member.id),
    })),
  ].map((group) => ({
    ...group,
    tasks: group.tasks.map(toDisplayTask),
  }));

  return {
    groups,
  };
}

export async function getCalendarData(monthKey: string, selectedDay: string) {
  const { tasks: taskRows } = await loadTasks();
  const weeks = buildMonthGrid(monthKey);
  const rangeStart = weeks[0][0]?.key ?? `${monthKey}-01`;
  const rangeEnd = weeks.at(-1)?.at(-1)?.key ?? addDays(rangeStart, 41);
  const itemsByDate = new Map<string, AgendaItem[]>();

  for (const task of taskRows) {
    if (task.status === "archived") {
      continue;
    }

    if (task.recurrenceRule && task.dueDate) {
      for (const occurrence of projectOccurrences(
        task.dueDate,
        recurrenceShape(task.recurrenceRule),
        rangeStart,
        rangeEnd
      )) {
        const nextItems = itemsByDate.get(occurrence) ?? [];
        nextItems.push(agendaItem(task, occurrence));
        itemsByDate.set(occurrence, nextItems);
      }

      continue;
    }

    if (task.dueDate && compareDateKeys(task.dueDate, rangeStart) >= 0 && compareDateKeys(task.dueDate, rangeEnd) <= 0) {
      const nextItems = itemsByDate.get(task.dueDate) ?? [];
      nextItems.push(agendaItem(task, task.dueDate));
      itemsByDate.set(task.dueDate, nextItems);
    }
  }

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    selectedDay,
    weeks,
    itemsByDate,
    agenda: (itemsByDate.get(selectedDay) ?? []).sort((left, right) =>
      left.title.localeCompare(right.title)
    ),
  };
}

export async function getQuickAddReferenceData() {
  const [{ tasks: taskRows }, members] = await Promise.all([
    loadTasks(),
    getHouseholdMembers(),
  ]);

  return {
    members,
    categories: uniqueCategories(taskRows),
  };
}
