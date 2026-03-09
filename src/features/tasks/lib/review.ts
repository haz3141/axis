import { addDays, compareDateKeys } from "@/features/tasks/lib/dates";
import { projectOccurrences, type RecurrenceRuleShape } from "@/features/tasks/lib/recurrence";
import type { TaskStatus } from "@/features/tasks/types";

type ReviewTaskCandidate = {
  id: string;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  recurrenceRule: RecurrenceRuleShape | null;
  occurrenceLogs: Array<{
    scheduledFor: string;
  }>;
};

export type ReviewSnapshot = {
  weekStart: string;
  weekEnd: string;
  completedTaskIds: string[];
  overdueTaskIds: string[];
  recurringCompletionDatesByTaskId: Record<string, string[]>;
  recurringCompletionTaskIds: string[];
  missedRecurringOccurrences: Array<{
    taskId: string;
    scheduledFor: string;
  }>;
};

export function reviewWeekRange(today: string) {
  const weekStart = addDays(today, -new Date(`${today}T12:00:00`).getDay());

  return {
    weekStart,
    weekEnd: addDays(weekStart, 6),
  };
}

export function buildReviewSnapshot(
  tasks: ReviewTaskCandidate[],
  today: string
): ReviewSnapshot {
  const { weekStart, weekEnd } = reviewWeekRange(today);
  const completedTaskIds = tasks
    .filter(
      (task) =>
        !task.recurrenceRule &&
        Boolean(task.completedAt) &&
        compareDateKeys(task.completedAt!.slice(0, 10), weekStart) >= 0 &&
        compareDateKeys(task.completedAt!.slice(0, 10), today) <= 0
    )
    .sort((left, right) =>
      compareDateKeys(right.completedAt!.slice(0, 10), left.completedAt!.slice(0, 10))
    )
    .map((task) => task.id);
  const overdueTaskIds = tasks
    .filter(
      (task) =>
        !task.recurrenceRule &&
        task.status === "active" &&
        Boolean(task.dueDate) &&
        compareDateKeys(task.dueDate!, today) < 0
    )
    .sort((left, right) => compareDateKeys(left.dueDate!, right.dueDate!))
    .map((task) => task.id);
  const recurringCompletionEntries = tasks
    .filter((task) => Boolean(task.recurrenceRule))
    .map((task) => ({
      taskId: task.id,
      completionDates: task.occurrenceLogs
        .map((log) => log.scheduledFor)
        .filter(
          (scheduledFor) =>
            compareDateKeys(scheduledFor, weekStart) >= 0 &&
            compareDateKeys(scheduledFor, today) <= 0
        )
        .sort((left, right) => compareDateKeys(right, left)),
    }))
    .filter((entry) => entry.completionDates.length > 0)
    .sort((left, right) => {
      if (right.completionDates.length !== left.completionDates.length) {
        return right.completionDates.length - left.completionDates.length;
      }

      return left.taskId.localeCompare(right.taskId);
    });
  const recurringCompletionDatesByTaskId = Object.fromEntries(
    recurringCompletionEntries.map((entry) => [entry.taskId, entry.completionDates])
  );
  const recurringCompletionTaskIds = recurringCompletionEntries.map((entry) => entry.taskId);
  const missedRecurringOccurrences = tasks
    .filter(
      (task) =>
        task.status === "active" && Boolean(task.recurrenceRule) && Boolean(task.dueDate)
    )
    .flatMap((task) => {
      const completedDates = new Set(task.occurrenceLogs.map((log) => log.scheduledFor));

      return projectOccurrences(task.dueDate!, task.recurrenceRule!, weekStart, today)
        .filter((scheduledFor) => !completedDates.has(scheduledFor))
        .map((scheduledFor) => ({
          taskId: task.id,
          scheduledFor,
        }));
    })
    .sort((left, right) => {
      const dateOrder = compareDateKeys(left.scheduledFor, right.scheduledFor);

      if (dateOrder !== 0) {
        return dateOrder;
      }

      return left.taskId.localeCompare(right.taskId);
    });

  return {
    weekStart,
    weekEnd,
    completedTaskIds,
    overdueTaskIds,
    recurringCompletionDatesByTaskId,
    recurringCompletionTaskIds,
    missedRecurringOccurrences,
  };
}
