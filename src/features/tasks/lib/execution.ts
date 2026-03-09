import type { RecurrenceRuleRecord, TaskOccurrenceLogRecord, TaskRecord } from "@/lib/db/schema";
import { addDays, todayKey } from "@/features/tasks/lib/dates";
import {
  nextOccurrence,
  projectOccurrences,
  type RecurrenceRuleShape,
} from "@/features/tasks/lib/recurrence";

type TaskExecutionInput = Pick<TaskRecord, "dueDate" | "status"> & {
  recurrenceRule: RecurrenceRuleRecord | null;
  occurrenceLogs: Pick<TaskOccurrenceLogRecord, "scheduledFor">[];
};

export type TaskExecutionState = {
  nextDue: string | null;
  lastCompletedOccurrence: string | null;
  recentOccurrenceDates: string[];
  upcomingOccurrenceDates: string[];
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

export function getTaskNextDue(task: TaskExecutionInput, start = todayKey()) {
  if (!task.recurrenceRule) {
    return task.dueDate;
  }

  if (!task.dueDate || task.status === "archived") {
    return null;
  }

  return nextOccurrence(
    task.dueDate,
    recurrenceShape(task.recurrenceRule),
    start,
    365,
    new Set(task.occurrenceLogs.map((log) => log.scheduledFor))
  );
}

export function getTaskExecutionState(
  task: TaskExecutionInput,
  start = todayKey()
): TaskExecutionState {
  const nextDue = getTaskNextDue(task, start);

  if (!task.recurrenceRule || !task.dueDate) {
    return {
      nextDue,
      lastCompletedOccurrence: null,
      recentOccurrenceDates: [],
      upcomingOccurrenceDates: [],
    };
  }

  const completedDates = new Set(task.occurrenceLogs.map((log) => log.scheduledFor));
  const projectedDates = projectOccurrences(
    task.dueDate,
    recurrenceShape(task.recurrenceRule),
    start,
    addDays(start, 60)
  );

  return {
    nextDue,
    lastCompletedOccurrence: task.occurrenceLogs[0]?.scheduledFor ?? null,
    recentOccurrenceDates: task.occurrenceLogs.map((log) => log.scheduledFor).slice(0, 6),
    upcomingOccurrenceDates: projectedDates
      .filter((dateKey) => !completedDates.has(dateKey))
      .slice(0, 4),
  };
}
