import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  projects,
  recurrenceRules,
  tags,
  taskTags,
  taskOccurrenceLogs,
  tasks,
  type HouseholdMemberRecord,
  type ProjectRecord,
  type RecurrenceRuleRecord,
  type TagRecord,
  type TaskTagRecord,
  type TaskOccurrenceLogRecord,
  type TaskRecord,
} from "@/lib/db/schema";
import { ensureProfile, getHouseholdMembers, getProfile } from "@/features/profile/data";
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
  projectOccurrences,
  serializeDaysOfWeek,
  type RecurrenceRuleShape,
} from "@/features/tasks/lib/recurrence";
import { buildNameKey, mergeTaskTagNames, normalizeName } from "@/features/tasks/lib/organization";
import { getTaskExecutionState, getTaskNextDue } from "@/features/tasks/lib/execution";
import { compareAgendaItemsByFocus } from "@/features/tasks/lib/focus";
import { buildReviewSnapshot } from "@/features/tasks/lib/review";
import type { AgendaItem, DisplayTask, QuickAddDraft, TaskInput } from "@/features/tasks/types";

export type TaskWithRelations = TaskRecord & {
  assignee: HouseholdMemberRecord | null;
  project: ProjectRecord | null;
  recurrenceRule: RecurrenceRuleRecord | null;
  taskTags: Array<TaskTagRecord & { tag: TagRecord }>;
  occurrenceLogs: TaskOccurrenceLogRecord[];
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

function taskTagNames(task: TaskWithRelations) {
  const realTagNames = task.taskTags
    .map((taskTag) => taskTag.tag.name)
    .sort((left, right) => left.localeCompare(right));

  return mergeTaskTagNames(realTagNames, task.category);
}

function taskProjectName(task: TaskWithRelations) {
  return task.project?.name ?? null;
}

async function loadOrganizationOptions(profileId: string) {
  const [projectRows, tagRows] = await Promise.all([
    db.query.projects.findMany({
      where: eq(projects.profileId, profileId),
      orderBy: (_, { asc }) => [asc(projects.name)],
    }),
    db.query.tags.findMany({
      where: eq(tags.profileId, profileId),
      orderBy: (_, { asc }) => [asc(tags.name)],
    }),
  ]);

  return {
    projects: projectRows.map((project) => project.name),
    tags: tagRows.map((tag) => tag.name),
  };
}

function taskTagSuggestions(taskRows: TaskWithRelations[], tagNames: string[]) {
  const mergedTagNames = [
    ...tagNames,
    ...taskRows.map((task) => task.category).filter(Boolean) as string[],
  ];

  const deduped = new Map<string, string>();

  for (const tagName of mergedTagNames) {
    const normalized = normalizeName(tagName);

    if (!normalized) {
      continue;
    }

    const nameKey = buildNameKey(normalized);

    if (!deduped.has(nameKey)) {
      deduped.set(nameKey, normalized);
    }
  }

  return [...deduped.values()].sort((left, right) => left.localeCompare(right));
}

async function resolveProjectId(profileId: string, projectName: string | null) {
  if (!projectName) {
    return null;
  }

  const normalizedProjectName = normalizeName(projectName);
  const nameKey = buildNameKey(normalizedProjectName);
  const existingProject = await db.query.projects.findFirst({
    where: (_, { and, eq }) =>
      and(eq(projects.profileId, profileId), eq(projects.nameKey, nameKey)),
  });

  if (existingProject) {
    return existingProject.id;
  }

  const projectId = crypto.randomUUID();
  await db.insert(projects).values({
    id: projectId,
    profileId,
    name: normalizedProjectName,
    nameKey,
  });

  return projectId;
}

async function replaceTaskTags(profileId: string, taskId: string, tagNames: string[]) {
  const normalizedTagNames = taskNames(tagNames);
  const existingTags = await db.query.tags.findMany({
    where: eq(tags.profileId, profileId),
  });
  const tagsByKey = new Map(existingTags.map((tag) => [tag.nameKey, tag] as const));
  const nextTagIds: string[] = [];

  for (const tagName of normalizedTagNames) {
    const nameKey = buildNameKey(tagName);
    const existingTag = tagsByKey.get(nameKey);

    if (existingTag) {
      nextTagIds.push(existingTag.id);
      continue;
    }

    const tagId = crypto.randomUUID();
    const tagRecord = {
      id: tagId,
      profileId,
      name: tagName,
      nameKey,
    };

    await db.insert(tags).values(tagRecord);
    tagsByKey.set(nameKey, { ...tagRecord, createdAt: "", updatedAt: "" });
    nextTagIds.push(tagId);
  }

  await db.delete(taskTags).where(eq(taskTags.taskId, taskId));

  if (nextTagIds.length) {
    await db.insert(taskTags).values(
      nextTagIds.map((tagId) => ({
        id: crypto.randomUUID(),
        taskId,
        tagId,
      }))
    );
  }
}

function taskNames(tagNames: string[]) {
  const deduped = new Map<string, string>();

  for (const tagName of tagNames) {
    const normalized = normalizeName(tagName);

    if (!normalized) {
      continue;
    }

    const nameKey = buildNameKey(normalized);

    if (!deduped.has(nameKey)) {
      deduped.set(nameKey, normalized);
    }
  }

  return [...deduped.values()];
}

function toDisplayTask(task: TaskWithRelations): DisplayTask {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    status: task.status,
    priority: task.priority,
    legacyCategory: task.category,
    projectName: taskProjectName(task),
    tagNames: taskTagNames(task),
    assigneeName: task.assignee?.name ?? null,
    assigneeMemberId: task.assigneeMemberId,
    isRecurring: isRecurringTask(task),
    recurrenceSummary: describeRecurrence(task.recurrenceRule, task.dueDate),
    nextDue: getTaskNextDue(task),
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
    assigneeMemberId: task.assigneeMemberId,
    priority: task.priority,
    projectName: taskProjectName(task),
    tagNames: taskTagNames(task),
    legacyCategory: task.category,
    notes: task.notes,
    completed: task.recurrenceRule
      ? occurrenceCompleted(task, scheduledFor)
      : task.status === "completed",
    isRecurring: Boolean(task.recurrenceRule),
    recurrenceSummary: describeRecurrence(task.recurrenceRule, task.dueDate),
  };
}

function buildUpcomingItems(
  taskRows: TaskWithRelations[],
  start: string,
  end: string
) {
  const activeTaskRows = taskRows.filter((task) => task.status === "active");
  const oneTimeItems = activeTaskRows
    .filter((task) => !task.recurrenceRule)
    .filter(
      (task) =>
        task.dueDate &&
        compareDateKeys(task.dueDate, start) >= 0 &&
        compareDateKeys(task.dueDate, end) <= 0
    )
    .map((task) => agendaItem(task, task.dueDate!));

  const recurringItems = activeTaskRows
    .filter((task) => Boolean(task.recurrenceRule && task.dueDate))
    .flatMap((task) =>
      projectOccurrences(
        task.dueDate!,
        recurrenceShape(task.recurrenceRule!),
        start,
        end
      ).map((scheduledFor) => agendaItem(task, scheduledFor))
    );

  return [...oneTimeItems, ...recurringItems].sort(compareAgendaItemsByFocus);
}

async function loadTasks() {
  const profile = await getProfile();

  if (!profile) {
    return {
      profile: null,
      tasks: [],
    };
  }

  const taskRows = await db.query.tasks.findMany({
    where: eq(tasks.profileId, profile.id),
    with: {
      assignee: true,
      project: true,
      recurrenceRule: true,
      taskTags: {
        with: {
          tag: true,
        },
      },
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

export async function getTaskWithRelations(taskId: string) {
  return db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      assignee: true,
      project: true,
      recurrenceRule: true,
      taskTags: {
        with: {
          tag: true,
        },
      },
      occurrenceLogs: {
        orderBy: (_, { desc }) => [desc(taskOccurrenceLogs.scheduledFor)],
      },
    },
  });
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
  const profile = await ensureProfile();
  const taskId = existingTask?.id ?? crypto.randomUUID();
  const isRecurring = Boolean(input.recurrence);
  const projectId = await resolveProjectId(profile.id, input.projectName);
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
    projectId,
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
  await replaceTaskTags(profile.id, taskId, input.tagNames);

  return taskId;
}

export async function createQuickAddTasks(drafts: QuickAddDraft[]) {
  for (const draft of drafts) {
    await saveTaskInput({
      title: draft.title,
      notes: null,
      dueDate: draft.dueDate,
      priority: draft.priority,
      projectName: draft.projectName,
      tagNames: draft.tagNames,
      assigneeMemberId: draft.assigneeMemberId,
      recurrence: draft.recurrence,
    });
  }
}

export async function getTasksPageData() {
  const [{ profile, tasks: taskRows }, members] = await Promise.all([loadTasks(), getHouseholdMembers()]);
  const organizationOptions = profile
    ? await loadOrganizationOptions(profile.id)
    : { projects: [], tags: [] };

  return {
    members,
    projects: organizationOptions.projects,
    tags: taskTagSuggestions(taskRows, organizationOptions.tags),
    tasks: taskRows.map(toDisplayTask),
  };
}

export async function getTaskDetail(taskId: string) {
  const [{ profile, tasks: taskRows }, members, task] = await Promise.all([
    loadTasks(),
    getHouseholdMembers(),
    getTaskWithRelations(taskId),
  ]);
  const organizationOptions = profile
    ? await loadOrganizationOptions(profile.id)
    : { projects: [], tags: [] };

  return {
    task,
    members,
    projects: organizationOptions.projects,
    tags: taskTagSuggestions(taskRows, organizationOptions.tags),
    executionState: task ? getTaskExecutionState(task) : null,
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
  ].sort(compareAgendaItemsByFocus);

  const overdueItems = oneTimeTasks
    .filter((task) => task.dueDate && compareDateKeys(task.dueDate, today) < 0)
    .map((task) => agendaItem(task, task.dueDate!))
    .sort(compareAgendaItemsByFocus);

  const upcomingItems = buildUpcomingItems(taskRows, addDays(today, 1), upcomingEnd).filter(
    (item) => !item.completed
  );

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

export async function getUpcomingData() {
  const { profile, tasks: taskRows } = await loadTasks();
  const today = todayKey();
  const projectionEnd = addDays(today, 30);
  const [members, organizationOptions] = await Promise.all([
    getHouseholdMembers(),
    profile ? loadOrganizationOptions(profile.id) : Promise.resolve({ projects: [], tags: [] }),
  ]);
  const oneTimeItems = taskRows
    .filter((task) => task.status === "active" && !task.recurrenceRule)
    .filter((task) => task.dueDate && compareDateKeys(task.dueDate, today) > 0)
    .map((task) => agendaItem(task, task.dueDate!))
    .sort(compareAgendaItemsByFocus);
  const recurringItems = buildUpcomingItems(taskRows, addDays(today, 1), projectionEnd).filter(
    (item) => item.isRecurring && !item.completed
  );

  return {
    projectionEnd,
    members,
    projects: organizationOptions.projects,
    tags: taskTagSuggestions(taskRows, organizationOptions.tags),
    items: [...oneTimeItems, ...recurringItems].sort(compareAgendaItemsByFocus),
    stats: {
      oneTime: oneTimeItems.length,
      recurring: recurringItems.length,
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

export async function getReviewData() {
  const { tasks: taskRows } = await loadTasks();
  const today = todayKey();
  const snapshot = buildReviewSnapshot(
    taskRows.map((task) => ({
      id: task.id,
      status: task.status,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      recurrenceRule: task.recurrenceRule ? recurrenceShape(task.recurrenceRule) : null,
      occurrenceLogs: task.occurrenceLogs.map((log) => ({
        scheduledFor: log.scheduledFor,
      })),
    })),
    today
  );
  const tasksById = new Map(taskRows.map((task) => [task.id, task] as const));
  const completedTasks = snapshot.completedTaskIds.flatMap((taskId) => {
    const task = tasksById.get(taskId);

    return task ? [toDisplayTask(task)] : [];
  });
  const recurringWins = snapshot.recurringCompletionTaskIds.flatMap((taskId) => {
    const task = tasksById.get(taskId);

    if (!task) {
      return [];
    }

    return [
      {
        task: toDisplayTask(task),
        completedCount: snapshot.recurringCompletionDatesByTaskId[taskId]?.length ?? 0,
        completedDates: snapshot.recurringCompletionDatesByTaskId[taskId] ?? [],
      },
    ];
  });
  const overdueItems = snapshot.overdueTaskIds.flatMap((taskId) => {
    const task = tasksById.get(taskId);

    return task?.dueDate ? [agendaItem(task, task.dueDate)] : [];
  });
  const missedRecurringItems = snapshot.missedRecurringOccurrences.flatMap((entry) => {
    const task = tasksById.get(entry.taskId);

    if (!task) {
      return [];
    }

    return [agendaItem(task, entry.scheduledFor)];
  });

  return {
    today,
    weekStart: snapshot.weekStart,
    weekEnd: snapshot.weekEnd,
    completedTasks,
    recurringWins,
    attentionItems: [...overdueItems, ...missedRecurringItems].sort(compareAgendaItemsByFocus),
    stats: {
      completedOneTime: completedTasks.length,
      recurringCompletions: recurringWins.reduce(
        (count, entry) => count + entry.completedCount,
        0
      ),
      overdueOpen: overdueItems.length,
      missedRecurring: missedRecurringItems.length,
    },
  };
}

export async function getCalendarData(monthKey: string, selectedDay: string) {
  const { tasks: taskRows } = await loadTasks();
  const weeks = buildMonthGrid(monthKey);
  const rangeStart = weeks[0][0]?.key ?? `${monthKey}-01`;
  const rangeEnd = weeks.at(-1)?.at(-1)?.key ?? addDays(rangeStart, 41);
  const itemsByDate = new Map<string, AgendaItem[]>();

  for (const task of taskRows) {
    if (task.status !== "active") {
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
      compareAgendaItemsByFocus(left, right)
    ),
  };
}

export async function getQuickAddReferenceData() {
  const [{ profile, tasks: taskRows }, members] = await Promise.all([
    loadTasks(),
    getHouseholdMembers(),
  ]);
  const organizationOptions = profile
    ? await loadOrganizationOptions(profile.id)
    : { projects: [], tags: [] };

  return {
    members,
    tags: taskTagSuggestions(taskRows, organizationOptions.tags),
  };
}
