export const TASK_NOTICE_KEYS = [
  "task-created",
  "task-saved",
  "task-completed",
  "task-archived",
  "task-reopened",
  "task-restored",
  "task-deleted",
  "task-undo-applied",
] as const;

export type TaskNoticeKey = (typeof TASK_NOTICE_KEYS)[number];
export type TaskConfirmKey = "archive" | "delete";
export type TaskSearchParamValue = string | string[] | undefined;

function firstValue(value: TaskSearchParamValue) {
  return Array.isArray(value) ? value[0] ?? undefined : value;
}

export function pathFromSearchParams(
  pathname: string,
  searchParams: Record<string, TaskSearchParamValue>
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
      continue;
    }

    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function updatePathSearchParams(
  path: string,
  mutate: (params: URLSearchParams) => void
) {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  mutate(params);
  const nextSearch = params.toString();
  return nextSearch ? `${pathname}?${nextSearch}` : pathname;
}

export function buildTaskNoticeHref(
  path: string,
  notice: TaskNoticeKey,
  undoId?: string
) {
  return updatePathSearchParams(path, (params) => {
    params.delete("confirm");
    params.set("notice", notice);

    if (undoId) {
      params.set("undo", undoId);
    } else {
      params.delete("undo");
    }
  });
}

export function clearTaskNoticeHref(path: string) {
  return updatePathSearchParams(path, (params) => {
    params.delete("notice");
    params.delete("undo");
  });
}

export function buildTaskConfirmHref(path: string, confirm: TaskConfirmKey) {
  return updatePathSearchParams(path, (params) => {
    params.delete("notice");
    params.delete("undo");
    params.set("confirm", confirm);
  });
}

export function clearTaskConfirmHref(path: string) {
  return updatePathSearchParams(path, (params) => {
    params.delete("confirm");
  });
}

export function readTaskNotice(
  searchParams: Record<string, TaskSearchParamValue>
) {
  const notice = firstValue(searchParams.notice);

  if (!notice || !TASK_NOTICE_KEYS.includes(notice as TaskNoticeKey)) {
    return null;
  }

  return {
    notice: notice as TaskNoticeKey,
    undoId: firstValue(searchParams.undo) ?? null,
  };
}

export function readTaskConfirm(
  searchParams: Record<string, TaskSearchParamValue>
) {
  const confirm = firstValue(searchParams.confirm);

  if (confirm === "archive" || confirm === "delete") {
    return confirm;
  }

  return null;
}

export function taskNoticeCopy(notice: TaskNoticeKey) {
  switch (notice) {
    case "task-created":
      return "Task created.";
    case "task-saved":
      return "Task saved.";
    case "task-completed":
      return "Task completed.";
    case "task-archived":
      return "Task archived.";
    case "task-reopened":
      return "Task reopened.";
    case "task-restored":
      return "Task restored.";
    case "task-deleted":
      return "Task deleted.";
    case "task-undo-applied":
      return "Last change undone.";
  }
}
