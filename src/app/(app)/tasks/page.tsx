import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeTaskAction,
  createTaskAction,
  reopenTaskAction,
  restoreTaskAction,
} from "@/features/tasks/actions";
import { TaskActionNotice } from "@/features/tasks/components/task-action-notice";
import { TaskForm } from "@/features/tasks/components/task-form";
import { PriorityBadge } from "@/features/tasks/components/priority-badge";
import { getTasksPageData } from "@/features/tasks/data";
import { formatShortDate } from "@/features/tasks/lib/dates";
import {
  normalizeTaskListView,
  selectArchivedTasks,
  selectCompletedTasks,
  selectInboxTasks,
} from "@/features/tasks/lib/focus";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams: Promise<{
    view?: string;
    notice?: string;
    undo?: string;
  }>;
};

const viewCopy = {
  inbox: {
    title: "Inbox",
    description: "Unscheduled active tasks that still need a plan.",
  },
  completed: {
    title: "Completed",
    description: "Closed one-time tasks you may want to review or reopen.",
  },
  archived: {
    title: "Archived",
    description: "Retired tasks and recurring routines kept out of the active loop.",
  },
} as const;

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const { categories, members, tasks } = await getTasksPageData();
  const view = normalizeTaskListView(params.view);
  const inboxTasks = selectInboxTasks(tasks);
  const completedTasks = selectCompletedTasks(tasks);
  const archivedTasks = selectArchivedTasks(tasks);

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname="/tasks" searchParams={params} />

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Focus workspace</p>
            <h2 className="text-3xl font-semibold tracking-tight">{viewCopy[view].title}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{viewCopy[view].description}</p>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/quick-add">Batch quick add</Link>
            </Button>
            <Button asChild>
              <Link href="/upcoming">Open upcoming</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["inbox", "Inbox", inboxTasks.length],
            ["completed", "Completed", completedTasks.length],
            ["archived", "Archived", archivedTasks.length],
          ].map(([value, label, count]) => {
            const href = value === "inbox" ? "/tasks" : `/tasks?view=${value}`;

            return (
              <Button
                key={value}
                asChild
                variant={view === value ? "default" : "outline"}
                size="sm"
              >
                <Link href={href}>
                  {label}
                  <Badge variant={view === value ? "secondary" : "outline"}>{count}</Badge>
                </Link>
              </Button>
            );
          })}
        </div>
      </section>

      {view === "inbox" ? (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Unscheduled active tasks</CardTitle>
              <CardDescription>
                Capture first, then schedule what belongs in Today or Upcoming.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {inboxTasks.length ? (
                inboxTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                          {task.title}
                        </Link>
                        <PriorityBadge priority={task.priority} />
                        {task.assigneeName ? (
                          <Badge variant="secondary">{task.assigneeName}</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.notes ? task.notes : "No schedule yet. Add a date when you know where it belongs."}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild variant="outline">
                        <Link href={`/tasks/${task.id}#edit-task`}>Edit</Link>
                      </Button>
                      <form action={completeTaskAction.bind(null, task.id, "/tasks")}>
                        <Button type="submit">Complete</Button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6">
                  <p className="text-sm text-muted-foreground">
                    Inbox is clear. Use <span className="font-medium">q</span> to capture quickly or add a task manually.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button asChild variant="outline">
                      <Link href="/quick-add">Batch quick add</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/upcoming">Review upcoming</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual task entry</CardTitle>
              <CardDescription>
                Use the full form when you already know the schedule, assignee, or recurrence rule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskForm
                action={createTaskAction}
                submitLabel="Create task"
                members={members}
                categories={categories}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {view === "completed" ? (
        <Card>
          <CardHeader>
            <CardTitle>Completed tasks</CardTitle>
            <CardDescription>Recently closed one-time tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {completedTasks.length ? (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                        {task.title}
                      </Link>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.completedAt
                        ? `Completed ${formatShortDate(task.completedAt.slice(0, 10))}`
                        : "Completed"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/tasks/${task.id}#edit-task`}>Edit</Link>
                    </Button>
                    <form action={reopenTaskAction.bind(null, task.id, "/tasks?view=completed")}>
                      <Button type="submit" variant="outline">
                        Reopen
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6">
                <p className="text-sm text-muted-foreground">
                  Nothing is completed yet. Today and Inbox will surface work that is still active.
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link href="/tasks">Back to inbox</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {view === "archived" ? (
        <Card>
          <CardHeader>
            <CardTitle>Archived tasks</CardTitle>
            <CardDescription>Retired work kept for context, not for daily focus.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {archivedTasks.length ? (
              archivedTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                      {task.title}
                    </Link>
                    <PriorityBadge priority={task.priority} />
                    {task.recurrenceSummary ? (
                      <Badge variant="outline">{task.recurrenceSummary}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.nextDue ? `Last projected for ${formatShortDate(task.nextDue)}` : "Archived task"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/tasks/${task.id}#edit-task`}>Edit task</Link>
                    </Button>
                    <form action={restoreTaskAction.bind(null, task.id, "/tasks?view=archived")}>
                      <Button type="submit" size="sm">
                        Restore
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6">
                <p className="text-sm text-muted-foreground">No archived tasks yet.</p>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link href="/tasks">Back to inbox</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
