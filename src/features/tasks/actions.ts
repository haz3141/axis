"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { taskOccurrenceLogs, tasks } from "@/lib/db/schema";
import { revalidateAppPaths } from "@/lib/revalidate";
import { parseTaskFormData } from "@/features/tasks/lib/form";
import { createQuickAddTasks, getTaskDetail, saveTaskInput } from "@/features/tasks/data";
import type { QuickAddDraft } from "@/features/tasks/types";

export async function createTaskAction(formData: FormData) {
  const taskId = await saveTaskInput(parseTaskFormData(formData));
  revalidateAppPaths(taskId);
  redirect(`/tasks/${taskId}`);
}

export async function updateTaskAction(taskId: string, formData: FormData) {
  const { task } = await getTaskDetail(taskId);

  if (!task) {
    redirect("/tasks");
  }

  await saveTaskInput(parseTaskFormData(formData), task);
  revalidateAppPaths(taskId);
  redirect(`/tasks/${taskId}`);
}

export async function deleteTaskAction(taskId: string) {
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
  redirect("/tasks");
}

export async function archiveTaskAction(taskId: string) {
  await db
    .update(tasks)
    .set({
      status: "archived",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
}

export async function restoreTaskAction(taskId: string) {
  await db
    .update(tasks)
    .set({
      status: "active",
      updatedAt: new Date().toISOString(),
      completedAt: null,
    })
    .where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
}

export async function completeTaskAction(taskId: string) {
  await db
    .update(tasks)
    .set({
      status: "completed",
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
}

export async function reopenTaskAction(taskId: string) {
  await db
    .update(tasks)
    .set({
      status: "active",
      completedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, taskId));
  revalidateAppPaths(taskId);
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

export async function createQuickAddTasksAction(formData: FormData) {
  const payload = formData.get("drafts")?.toString() ?? "[]";
  const parsedDrafts = JSON.parse(payload) as QuickAddDraft[];

  if (!parsedDrafts.length || parsedDrafts.some((draft) => draft.ambiguities.length > 0)) {
    redirect("/quick-add");
  }

  await createQuickAddTasks(parsedDrafts);
  revalidateAppPaths();
  redirect("/tasks");
}
