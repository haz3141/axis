"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import {
  recurrenceRules,
  taskActionUndos,
  taskOccurrenceLogs,
  taskTags,
  tasks,
  type RecurrenceRuleRecord,
  type TaskActionUndoRecord,
  type TaskOccurrenceLogRecord,
  type TaskTagRecord,
  type TaskRecord,
} from "@/lib/db/schema";
import { quickAddSuccessPath } from "@/features/quick-add/capture";
import { revalidateAppPaths } from "@/lib/revalidate";
import { buildTaskNoticeHref } from "@/features/tasks/lib/notices";
import {
  isTaskFormValidationError,
  parseTaskFormData,
  type TaskFormErrorCode,
} from "@/features/tasks/lib/form";
import {
  createQuickAddTasks,
  getTaskWithRelations,
  saveTaskInput,
} from "@/features/tasks/data";
import {
  readRecurrenceHistoryChoice,
  recurrenceDraftFromRule,
  resolveRecurrenceUpdateStrategy,
} from "@/features/tasks/lib/recurrence-edit";
import type { QuickAddDraft, TaskStatus } from "@/features/tasks/types";
import type { TaskWithRelations } from "@/features/tasks/data";

type TaskDeleteSnapshot = {
  task: TaskRecord;
  recurrenceRule: RecurrenceRuleRecord | null;
  taskTags: TaskTagRecord[];
  occurrenceLogs: TaskOccurrenceLogRecord[];
};

type TaskStatusUndoPayload = {
  previousStatus: TaskStatus;
  previousCompletedAt: string | null;
};

type TaskUndoPayloadMap = {
  complete: TaskStatusUndoPayload;
  archive: TaskStatusUndoPayload;
  restore: TaskStatusUndoPayload;
  reopen: TaskStatusUndoPayload;
  delete: {
    snapshot: TaskDeleteSnapshot;
  };
};

type TaskUndoKind = keyof TaskUndoPayloadMap;

async function createTaskUndo<K extends TaskUndoKind>(
  taskId: string,
  kind: K,
  payload: TaskUndoPayloadMap[K]
) {
  const undoId = crypto.randomUUID();

  await db.insert(taskActionUndos).values({
    id: undoId,
    taskId,
    kind,
    payload: JSON.stringify(payload),
  });

  return undoId;
}

function taskRecordSnapshot(task: TaskWithRelations): TaskRecord {
  const {
    assignee,
    occurrenceLogs,
    project,
    recurrenceRule,
    taskTags,
    ...taskRecord
  } = task;

  void assignee;
  void occurrenceLogs;
  void project;
  void recurrenceRule;
  void taskTags;

  return taskRecord;
}

function parseTaskUndoPayload<K extends TaskUndoKind>(
  undo: Pick<TaskActionUndoRecord, "payload">,
  kind: K
) {
  void kind;
  return JSON.parse(undo.payload) as TaskUndoPayloadMap[K];
}

function redirectWithTaskNotice(
  returnTo: string,
  notice: Parameters<typeof buildTaskNoticeHref>[1],
  undoId?: string
): never {
  redirect(buildTaskNoticeHref(returnTo, notice, undoId));
}

function taskFormErrorHref(path: string, error: TaskFormErrorCode) {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.delete("notice");
  params.delete("undo");
  params.delete("confirm");
  params.set("error", error);
  const nextSearch = params.toString();
  return nextSearch ? `${pathname}?${nextSearch}` : pathname;
}

function readTaskReturnTo(formData: FormData, fallback: string) {
  const returnTo = formData.get("returnTo")?.toString().trim();
  return returnTo || fallback;
}

function redirectWithTaskFormError(
  returnTo: string,
  error: TaskFormErrorCode
): never {
  redirect(taskFormErrorHref(returnTo, error));
}

export async function createTaskAction(formData: FormData) {
  const returnTo = readTaskReturnTo(formData, "/tasks");
  let taskId: string;

  try {
    taskId = await saveTaskInput(parseTaskFormData(formData));
  } catch (error) {
    if (isTaskFormValidationError(error)) {
      redirectWithTaskFormError(returnTo, error.code);
    }

    throw error;
  }

  revalidateAppPaths(taskId);
  redirectWithTaskNotice(`/tasks/${taskId}`, "task-created");
}

export async function updateTaskAction(taskId: string, formData: FormData) {
  const task = await getTaskWithRelations(taskId);

  if (!task) {
    redirect("/tasks");
  }

  const returnTo = readTaskReturnTo(formData, `/tasks/${taskId}`);
  const baseline = {
    dueDate: task.dueDate,
    recurrence: recurrenceDraftFromRule(task.recurrenceRule),
    occurrenceCount: task.occurrenceLogs.length,
  };
  let input: ReturnType<typeof parseTaskFormData>;
  let strategy: ReturnType<typeof resolveRecurrenceUpdateStrategy>;

  try {
    input = parseTaskFormData(formData);
    strategy = resolveRecurrenceUpdateStrategy(
      baseline,
      {
        dueDate: input.dueDate,
        recurrence: input.recurrence,
      },
      readRecurrenceHistoryChoice(formData)
    );
  } catch (error) {
    if (isTaskFormValidationError(error)) {
      redirectWithTaskFormError(returnTo, error.code);
    }

    throw error;
  }

  switch (strategy) {
    case "update-in-place": {
      await saveTaskInput(input, task);
      revalidateAppPaths(taskId);
      redirectWithTaskNotice(`/tasks/${taskId}`, "task-saved");
    }
    case "reset-history": {
      await saveTaskInput(input, task);
      await db.delete(taskOccurrenceLogs).where(eq(taskOccurrenceLogs.taskId, taskId));
      revalidateAppPaths(taskId);
      redirectWithTaskNotice(`/tasks/${taskId}`, "task-history-reset");
    }
    case "fork-task": {
      const newTaskId = await saveTaskInput(input);

      await db
        .update(tasks)
        .set({
          status: "archived",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tasks.id, taskId));

      revalidateAppPaths(taskId);
      revalidateAppPaths(newTaskId);
      redirectWithTaskNotice(`/tasks/${newTaskId}`, "task-recurrence-forked");
    }
    case "missing-choice":
      redirectWithTaskFormError(returnTo, "recurrence-history-choice-required");
  }
}

export async function deleteTaskAction(taskId: string, returnTo: string) {
  const task = await getTaskWithRelations(taskId);

  if (!task) {
    redirect(returnTo);
  }

  const undoId = await createTaskUndo(taskId, "delete", {
    snapshot: {
      task: taskRecordSnapshot(task),
      recurrenceRule: task.recurrenceRule,
      taskTags: task.taskTags.map(({ tag: _tag, ...taskTag }) => {
        void _tag;
        return taskTag;
      }),
      occurrenceLogs: task.occurrenceLogs,
    },
  });

  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
  redirectWithTaskNotice(returnTo, "task-deleted", undoId);
}

export async function archiveTaskAction(taskId: string, returnTo: string) {
  const task = await getTaskWithRelations(taskId);

  if (!task) {
    redirect(returnTo);
  }

  const undoId = await createTaskUndo(taskId, "archive", {
    previousStatus: task.status,
    previousCompletedAt: task.completedAt,
  });

  await db
    .update(tasks)
    .set({
      status: "archived",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
  redirectWithTaskNotice(returnTo, "task-archived", undoId);
}

export async function restoreTaskAction(taskId: string, returnTo: string) {
  const task = await getTaskWithRelations(taskId);

  if (!task) {
    redirect(returnTo);
  }

  const undoId = await createTaskUndo(taskId, "restore", {
    previousStatus: task.status,
    previousCompletedAt: task.completedAt,
  });

  await db
    .update(tasks)
    .set({
      status: "active",
      updatedAt: new Date().toISOString(),
      completedAt: null,
    })
    .where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
  redirectWithTaskNotice(returnTo, "task-restored", undoId);
}

export async function completeTaskAction(taskId: string, returnTo: string) {
  const task = await getTaskWithRelations(taskId);

  if (!task) {
    redirect(returnTo);
  }

  const undoId = await createTaskUndo(taskId, "complete", {
    previousStatus: task.status,
    previousCompletedAt: task.completedAt,
  });

  await db
    .update(tasks)
    .set({
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
  redirectWithTaskNotice(returnTo, "task-completed", undoId);
}

export async function reopenTaskAction(taskId: string, returnTo: string) {
  const task = await getTaskWithRelations(taskId);

  if (!task) {
    redirect(returnTo);
  }

  const undoId = await createTaskUndo(taskId, "reopen", {
    previousStatus: task.status,
    previousCompletedAt: task.completedAt,
  });

  await db
    .update(tasks)
    .set({
      status: "active",
      completedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
  redirectWithTaskNotice(returnTo, "task-reopened", undoId);
}

export async function toggleOccurrenceAction(
  taskId: string,
  scheduledFor: string,
  completed: boolean,
  returnTo: string
) {
  if (completed) {
    await db
      .delete(taskOccurrenceLogs)
      .where(
        and(
          eq(taskOccurrenceLogs.taskId, taskId),
          eq(taskOccurrenceLogs.scheduledFor, scheduledFor)
        )
      );
  } else {
    await db
      .insert(taskOccurrenceLogs)
      .values({
        id: crypto.randomUUID(),
        taskId,
        scheduledFor,
      })
      .onConflictDoNothing({
        target: [taskOccurrenceLogs.taskId, taskOccurrenceLogs.scheduledFor],
      });
  }

  revalidateAppPaths(taskId);
  redirectWithTaskNotice(
    returnTo,
    completed ? "task-occurrence-reopened" : "task-occurrence-completed"
  );
}

export async function undoTaskAction(undoId: string, returnTo: string) {
  const undo = await db.query.taskActionUndos.findFirst({
    where: eq(taskActionUndos.id, undoId),
  });

  if (!undo) {
    redirectWithTaskNotice(returnTo, "task-undo-applied");
  }

  const now = new Date().toISOString();

  switch (undo.kind) {
    case "complete":
    case "archive":
    case "restore":
    case "reopen": {
      const payload = parseTaskUndoPayload(undo, undo.kind) as TaskStatusUndoPayload;

      await db
        .update(tasks)
        .set({
          status: payload.previousStatus,
          completedAt: payload.previousCompletedAt,
          updatedAt: now,
        })
        .where(eq(tasks.id, undo.taskId));
      break;
    }
    case "delete": {
      const payload = parseTaskUndoPayload(undo, "delete");

      await db.transaction(async (tx) => {
        await tx.insert(tasks).values(payload.snapshot.task);

        if (payload.snapshot.recurrenceRule) {
          await tx.insert(recurrenceRules).values(payload.snapshot.recurrenceRule);
        }

        if (payload.snapshot.taskTags.length) {
          await tx.insert(taskTags).values(payload.snapshot.taskTags);
        }

        if (payload.snapshot.occurrenceLogs.length) {
          await tx.insert(taskOccurrenceLogs).values(payload.snapshot.occurrenceLogs);
        }
      });
      break;
    }
  }

  await db.delete(taskActionUndos).where(eq(taskActionUndos.id, undoId));
  revalidateAppPaths(undo.taskId);
  redirectWithTaskNotice(returnTo, "task-undo-applied");
}

export async function createQuickAddTasksAction(formData: FormData) {
  const payload = formData.get("drafts")?.toString() ?? "[]";
  const parsedDrafts = JSON.parse(payload) as QuickAddDraft[];

  if (!parsedDrafts.length || parsedDrafts.some((draft) => draft.ambiguities.length > 0)) {
    redirect("/quick-add");
  }

  await createQuickAddTasks(parsedDrafts);
  revalidateAppPaths();
  redirect(quickAddSuccessPath(parsedDrafts));
}
