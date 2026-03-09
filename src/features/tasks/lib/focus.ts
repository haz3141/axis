import { compareDateKeys } from "./dates";
import type { AgendaItem, DisplayTask, TaskPriority } from "@/features/tasks/types";

export const TASK_LIST_VIEWS = ["inbox", "completed", "archived"] as const;

export type TaskListView = (typeof TASK_LIST_VIEWS)[number];

function priorityRank(priority: TaskPriority | null) {
  switch (priority) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
    default:
      return 3;
  }
}

function comparePriority(left: TaskPriority | null, right: TaskPriority | null) {
  return priorityRank(left) - priorityRank(right);
}

function compareOptionalDates(left: string | null, right: string | null) {
  if (left && right) {
    return compareDateKeys(left, right);
  }

  if (left) {
    return -1;
  }

  if (right) {
    return 1;
  }

  return 0;
}

function compareOptionalDatesDesc(left: string | null, right: string | null) {
  return compareOptionalDates(right, left);
}

export function normalizeTaskListView(value: string | null | undefined): TaskListView {
  if (TASK_LIST_VIEWS.includes(value as TaskListView)) {
    return value as TaskListView;
  }

  return "inbox";
}

export function compareAgendaItemsByFocus(left: AgendaItem, right: AgendaItem) {
  return (
    compareDateKeys(left.scheduledFor, right.scheduledFor) ||
    comparePriority(left.priority, right.priority) ||
    left.title.localeCompare(right.title)
  );
}

export function compareDisplayTasksByFocus(left: DisplayTask, right: DisplayTask) {
  return (
    comparePriority(left.priority, right.priority) ||
    compareOptionalDates(left.nextDue ?? left.dueDate, right.nextDue ?? right.dueDate) ||
    left.title.localeCompare(right.title)
  );
}

export function selectInboxTasks(tasks: DisplayTask[]) {
  return tasks
    .filter((task) => task.status === "active" && !task.isRecurring && !task.dueDate)
    .sort(compareDisplayTasksByFocus);
}

export function selectUpcomingTasks(tasks: DisplayTask[], today: string) {
  return tasks
    .filter(
      (task) =>
        task.status === "active" &&
        Boolean(task.nextDue) &&
        compareDateKeys(task.nextDue!, today) > 0
    )
    .sort(compareDisplayTasksByFocus);
}

export function selectCompletedTasks(tasks: DisplayTask[]) {
  return [...tasks]
    .filter((task) => task.status === "completed")
    .sort(
      (left, right) =>
        compareOptionalDatesDesc(
          left.completedAt?.slice(0, 10) ?? null,
          right.completedAt?.slice(0, 10) ?? null
        ) || compareDisplayTasksByFocus(left, right)
    );
}

export function selectArchivedTasks(tasks: DisplayTask[]) {
  return [...tasks]
    .filter((task) => task.status === "archived")
    .sort(compareDisplayTasksByFocus);
}

export function groupAgendaItemsByDate(items: AgendaItem[]) {
  const groups: Array<{
    date: string;
    items: AgendaItem[];
  }> = [];

  for (const item of [...items].sort(compareAgendaItemsByFocus)) {
    const currentGroup = groups.at(-1);

    if (!currentGroup || currentGroup.date !== item.scheduledFor) {
      groups.push({
        date: item.scheduledFor,
        items: [item],
      });
      continue;
    }

    currentGroup.items.push(item);
  }

  return groups;
}
