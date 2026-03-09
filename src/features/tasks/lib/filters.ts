import type { AgendaItem, DisplayTask, TaskPriority } from "@/features/tasks/types";
import {
  includesOrganizationMatch,
  mergeLegacyCategoryIntoTags,
  normalizeOrganizationName,
  organizationLookupKey,
} from "@/features/tasks/lib/organization";

export const UPCOMING_VIEWS = ["all", "one-time", "recurring"] as const;

export type UpcomingView = (typeof UPCOMING_VIEWS)[number];

export type TaskFilterSearchParamValue = string | string[] | undefined;

export type TaskFilterState<V extends string> = {
  view: V;
  q: string;
  project: string;
  tag: string;
  priority: TaskPriority | "";
  assignee: string;
};

type FilterableTask = Pick<
  DisplayTask,
  | "title"
  | "notes"
  | "priority"
  | "assigneeMemberId"
  | "assigneeName"
  | "projectName"
  | "tagNames"
  | "legacyCategory"
>;

type FilterableAgendaItem = Pick<
  AgendaItem,
  | "title"
  | "notes"
  | "priority"
  | "assigneeMemberId"
  | "assigneeName"
  | "projectName"
  | "tagNames"
  | "legacyCategory"
  | "isRecurring"
>;

function firstValue(value: TaskFilterSearchParamValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalizePriority(value: string): TaskPriority | "" {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "";
}

export function normalizeUpcomingView(value: string | null | undefined): UpcomingView {
  if (UPCOMING_VIEWS.includes(value as UpcomingView)) {
    return value as UpcomingView;
  }

  return "all";
}

export function readTaskFilterState<V extends string>(
  searchParams: Record<string, TaskFilterSearchParamValue>,
  normalizeView: (value: string | undefined) => V
): TaskFilterState<V> {
  return {
    view: normalizeView(firstValue(searchParams.view) || undefined),
    q: normalizeOrganizationName(firstValue(searchParams.q)),
    project: normalizeOrganizationName(firstValue(searchParams.project)),
    tag: normalizeOrganizationName(firstValue(searchParams.tag)),
    priority: normalizePriority(firstValue(searchParams.priority)),
    assignee: firstValue(searchParams.assignee),
  };
}

export function buildFilterHref<V extends string>(
  pathname: string,
  filters: TaskFilterState<V>
) {
  const params = new URLSearchParams();

  if (filters.view) {
    params.set("view", filters.view);
  }

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.project) {
    params.set("project", filters.project);
  }

  if (filters.tag) {
    params.set("tag", filters.tag);
  }

  if (filters.priority) {
    params.set("priority", filters.priority);
  }

  if (filters.assignee) {
    params.set("assignee", filters.assignee);
  }

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function hasTaskFilters<V extends string>(filters: TaskFilterState<V>) {
  return Boolean(
    filters.q || filters.project || filters.tag || filters.priority || filters.assignee
  );
}

function matchesSharedFilters(
  item: FilterableTask | FilterableAgendaItem,
  filters: Pick<TaskFilterState<string>, "q" | "project" | "tag" | "priority" | "assignee">
) {
  if (filters.priority && item.priority !== filters.priority) {
    return false;
  }

  if (filters.assignee === "mine" && item.assigneeMemberId) {
    return false;
  }

  if (
    filters.assignee &&
    filters.assignee !== "mine" &&
    item.assigneeMemberId !== filters.assignee
  ) {
    return false;
  }

  if (
    filters.project &&
    organizationLookupKey(item.projectName) !== organizationLookupKey(filters.project)
  ) {
    return false;
  }

  const effectiveTags = mergeLegacyCategoryIntoTags(item.tagNames, item.legacyCategory);

  if (
    filters.tag &&
    !effectiveTags.some(
      (tagName) => organizationLookupKey(tagName) === organizationLookupKey(filters.tag)
    )
  ) {
    return false;
  }

  if (!filters.q) {
    return true;
  }

  const searchValue = [
    item.title,
    item.notes ?? "",
    item.assigneeName ?? "",
    item.projectName ?? "",
    ...effectiveTags,
  ].join(" ");

  return includesOrganizationMatch(searchValue, filters.q);
}

export function filterDisplayTasks<V extends string>(
  tasks: DisplayTask[],
  filters: TaskFilterState<V>
) {
  return tasks.filter((task) => matchesSharedFilters(task, filters));
}

export function filterAgendaItems(
  items: AgendaItem[],
  filters: TaskFilterState<UpcomingView>
) {
  return items.filter((item) => {
    if (filters.view === "one-time" && item.isRecurring) {
      return false;
    }

    if (filters.view === "recurring" && !item.isRecurring) {
      return false;
    }

    return matchesSharedFilters(item, filters);
  });
}
