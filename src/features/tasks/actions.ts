"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import {
  recurrenceRules,
  taskActionUndos,
  taskOccurrenceLogs,
  tasks,
  type RecurrenceRuleRecord,
  type TaskActionUndoRecord,
  type TaskOccurrenceLogRecord,
  type TaskRecord,
} from "@/lib/db/schema";
import { quickAddSuccessPath } from "@/features/quick-add/capture";
import { revalidateAppPaths } from "@/lib/revalidate";
import { buildTaskNoticeHref } from "@/features/tasks/lib/notices";
import { parseTaskFormData } from "@/features/tasks/lib/form";
import {
  createQuickAddTasks,
  getTaskDetail,
  getTaskWithRelations,
  saveTaskInput,
} from "@/features/tasks/data";
import type { QuickAddDraft, TaskStatus } from "@/features/tasks/types";
import type { TaskWithRelations } from "@/features/tasks/data";

type TaskDeleteSnapshot = {
  task: TaskRecord;
  recurrenceRule: RecurrenceRuleRecord | null;
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
  const { assignee, occurrenceLogs, recurrenceRule, ...taskRecord } = task;

  void assignee;
  void occurrenceLogs;
  void recurrenceRule;

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

export async function createTaskAction(formData: FormData) {
  const taskId = await saveTaskInput(parseTaskFormData(formData));
  revalidateAppPaths(taskId);
  redirectWithTaskNotice(`/tasks/${taskId}`, "task-created");
}

export async function updateTaskAction(taskId: string, formData: FormData) {
  const { task } = await getTaskDetail(taskId);

  if (!task) {
    redirect("/tasks");
  }

  await saveTaskInput(parseTaskFormData(formData), task);
  revalidateAppPaths(taskId);
  redirectWithTaskNotice(`/tasks/${taskId}`, "task-saved");
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

export async function toggleOccurrenceAction(taskId: string, scheduledFor: string, completed: boolean) {
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
