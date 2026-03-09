import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  archiveTaskAction,
  completeTaskAction,
  deleteTaskAction,
  reopenTaskAction,
  restoreTaskAction,
  updateTaskAction,
} from "@/features/tasks/actions";
import { PriorityBadge } from "@/features/tasks/components/priority-badge";
import { TaskActionNotice } from "@/features/tasks/components/task-action-notice";
import { TaskTaxonomyBadges } from "@/features/tasks/components/task-taxonomy-badges";
import { TaskForm } from "@/features/tasks/components/task-form";
import { getTaskDetail } from "@/features/tasks/data";
import { formatLongDate } from "@/features/tasks/lib/dates";
import { parseTaskFormErrorCode } from "@/features/tasks/lib/form";
import { mergeTaskTagNames } from "@/features/tasks/lib/organization";
import { recurrenceDraftFromRule } from "@/features/tasks/lib/recurrence-edit";
import {
  buildTaskConfirmHref,
  clearTaskConfirmHref,
  clearTaskFormErrorHref,
  clearTaskNoticeHref,
  pathFromSearchParams,
  readTaskConfirm,
} from "@/features/tasks/lib/notices";
import { describeRecurrence } from "@/features/tasks/lib/recurrence";

export const dynamic = "force-dynamic";

type TaskDetailPageProps = {
  params: Promise<{
    taskId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    undo?: string;
    confirm?: string;
    error?: string;
  }>;
};

export default async function TaskDetailPage({
  params,
  searchParams,
}: TaskDetailPageProps) {
  const { taskId } = await params;
  const resolvedSearchParams = await searchParams;
  const { members, projects, tags, task, executionState } = await getTaskDetail(taskId);

  if (!task || !executionState) {
    notFound();
  }

  const pathname = `/tasks/${task.id}`;
  const currentPath = pathFromSearchParams(pathname, resolvedSearchParams);
  const returnTo = clearTaskFormErrorHref(clearTaskConfirmHref(clearTaskNoticeHref(currentPath)));
  const confirm = readTaskConfirm(resolvedSearchParams);
  const formErrorCode = parseTaskFormErrorCode(resolvedSearchParams.error);

  const updateAction = updateTaskAction.bind(null, task.id);
  const deleteAction = deleteTaskAction.bind(null, task.id, "/tasks");
  const archiveAction = archiveTaskAction.bind(null, task.id, returnTo);
  const restoreAction = restoreTaskAction.bind(null, task.id, returnTo);
  const completeAction = completeTaskAction.bind(null, task.id, returnTo);
  const reopenAction = reopenTaskAction.bind(null, task.id, returnTo);
  const recurrenceSummary = describeRecurrence(task.recurrenceRule, task.dueDate);
  const taskTagNames = mergeTaskTagNames(
    task.taskTags.map((taskTag) => taskTag.tag.name),
    task.category
  );

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname={pathname} searchParams={resolvedSearchParams} />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{task.status}</Badge>
                <PriorityBadge priority={task.priority} />
                {task.recurrenceRule ? <Badge variant="outline">Recurring</Badge> : null}
                {task.assignee?.name ? (
                  <Badge variant="outline">{task.assignee.name}</Badge>
                ) : (
                  <Badge variant="outline">Mine</Badge>
                )}
                <TaskTaxonomyBadges
                  projectName={task.project?.name ?? null}
                  tagNames={taskTagNames}
                />
              </div>
              <div className="space-y-2">
                <CardTitle>{task.title}</CardTitle>
                <CardDescription>
                  Quick actions come first so you can finish, archive, or recover the task without digging through the edit form.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Due date
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {task.dueDate ? formatLongDate(task.dueDate) : "Unscheduled"}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next due
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {executionState.nextDue ? formatLongDate(executionState.nextDue) : "No upcoming date"}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recurrence
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {recurrenceSummary ?? "One-time task"}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Last completed occurrence
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {executionState.lastCompletedOccurrence
                      ? formatLongDate(executionState.lastCompletedOccurrence)
                      : "None logged yet"}
                  </p>
                </div>
              </div>

              {task.notes ? (
                <div className="rounded-2xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{task.notes}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {!task.recurrenceRule ? (
                  task.status === "completed" ? (
                    <form action={reopenAction}>
                      <Button type="submit" variant="outline">
                        Reopen task
                      </Button>
                    </form>
                  ) : (
                    <form action={completeAction}>
                      <Button type="submit">Mark complete</Button>
                    </form>
                  )
                ) : null}

                {task.status === "archived" ? (
                  <form action={restoreAction}>
                    <Button type="submit" variant="outline">
                      Restore task
                    </Button>
                  </form>
                ) : (
                  <Button asChild variant="outline">
                    <Link href={buildTaskConfirmHref(returnTo, "archive")}>Archive task</Link>
                  </Button>
                )}

                <Button asChild variant="outline">
                  <Link href="#edit-task">Edit details</Link>
                </Button>

                <Button asChild variant="outline">
                  <Link href={buildTaskConfirmHref(returnTo, "delete")}>Delete task</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution context</CardTitle>
              <CardDescription>
                The task page should explain how completion works before you edit it.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Upcoming dates
                </p>
                {executionState.upcomingOccurrenceDates.length ? (
                  <ul className="mt-2 grid gap-2 text-sm">
                    {executionState.upcomingOccurrenceDates.map((dateKey) => (
                      <li key={dateKey}>{formatLongDate(dateKey)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.recurrenceRule
                      ? "No additional future occurrences are currently projected."
                      : "One-time tasks do not project future occurrences."}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  History
                </p>
                {executionState.recentOccurrenceDates.length ? (
                  <ul className="mt-2 grid gap-2 text-sm">
                    {executionState.recentOccurrenceDates.map((dateKey) => (
                      <li key={dateKey}>{formatLongDate(dateKey)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No occurrence history has been logged yet.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border p-4 md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  {task.recurrenceRule
                    ? "Recurring tasks keep the due date as the anchor. Completing an occurrence records that scheduled date and does not rewrite earlier history."
                    : "One-time tasks switch between active and completed. Archive removes the task from focus views without deleting it."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>
                Archive keeps the task for later. Delete removes the task and any recurrence history, but the redirect notice allows a one-step undo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {confirm === "archive" && task.status !== "archived" ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4">
                  <p className="text-sm text-amber-900">
                    Archive this task? It will leave Today, Inbox, and Upcoming until you restore it.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <form action={archiveAction}>
                      <Button type="submit" variant="outline">
                        Confirm archive
                      </Button>
                    </form>
                    <Button asChild variant="ghost">
                      <Link href={returnTo}>Cancel</Link>
                    </Button>
                  </div>
                </div>
              ) : null}

              {confirm === "delete" ? (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
                  <p className="text-sm text-foreground">
                    Delete this task permanently? This removes the task row, recurrence rule, and occurrence history.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <form action={deleteAction}>
                      <Button type="submit" variant="destructive">
                        Delete permanently
                      </Button>
                    </form>
                    <Button asChild variant="ghost">
                      <Link href={returnTo}>Cancel</Link>
                    </Button>
                  </div>
                </div>
              ) : null}

              {confirm ? null : (
                <p className="text-sm text-muted-foreground">
                  Use the archive and delete buttons above to open a confirmation step before destructive changes run.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card id="edit-task">
          <CardHeader>
            <CardTitle>Edit details</CardTitle>
            <CardDescription>
              Update scheduling, project, tags, assignment, notes, and recurrence settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskForm
              action={updateAction}
              submitLabel="Save changes"
              members={members}
              projects={projects}
              tags={tags}
              returnTo={returnTo}
              formErrorCode={formErrorCode}
              recurrenceHistory={{
                dueDate: task.dueDate,
                recurrence: recurrenceDraftFromRule(task.recurrenceRule),
                occurrenceCount: task.occurrenceLogs.length,
              }}
              initialValues={{
                title: task.title,
                notes: task.notes,
                dueDate: task.dueDate,
                priority: task.priority,
                projectName: task.project?.name ?? null,
                tagNames: taskTagNames,
                assigneeMemberId: task.assigneeMemberId,
                recurrence: recurrenceDraftFromRule(task.recurrenceRule),
              }}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
