import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeTaskAction,
  createTaskAction,
  reopenTaskAction,
} from "@/features/tasks/actions";
import { TaskForm } from "@/features/tasks/components/task-form";
import { getTasksPageData } from "@/features/tasks/data";
import { formatShortDate } from "@/features/tasks/lib/dates";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { categories, members, tasks } = await getTasksPageData();
  const activeTasks = tasks.filter((task) => task.status === "active");
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const archivedTasks = tasks.filter((task) => task.status === "archived");

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Manual entry for one-time tasks and recurring routines.
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

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Active tasks</CardTitle>
            <CardDescription>
              Current work across one-time tasks and active recurring habits.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {activeTasks.length ? (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                        {task.title}
                      </Link>
                      {task.isRecurring ? (
                        <Badge variant="outline">{task.recurrenceSummary}</Badge>
                      ) : null}
                      {task.assigneeName ? (
                        <Badge variant="secondary">{task.assigneeName}</Badge>
                      ) : null}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {task.isRecurring
                        ? task.nextDue
                          ? `Next due ${formatShortDate(task.nextDue)}`
                          : "Recurring task"
                        : task.dueDate
                          ? `Due ${formatShortDate(task.dueDate)}`
                          : "No due date"}
                    </p>
                  </div>

                  {!task.isRecurring ? (
                    <form action={completeTaskAction.bind(null, task.id)}>
                      <Button type="submit">Complete</Button>
                    </form>
                  ) : (
                    <Button asChild variant="outline">
                      <Link href={`/tasks/${task.id}`}>Open details</Link>
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No active tasks yet. Use the form above or the quick-add flow.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Closed one-time tasks.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {completedTasks.length ? (
                completedTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                          {task.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {task.completedAt
                            ? `Completed ${formatShortDate(task.completedAt.slice(0, 10))}`
                            : "Completed"}
                        </p>
                      </div>
                      <form action={reopenTaskAction.bind(null, task.id)}>
                        <Button type="submit" variant="outline">
                          Reopen
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Completed one-time tasks will appear here.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archived</CardTitle>
              <CardDescription>Retired recurring tasks and old items.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {archivedTasks.length ? (
                archivedTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border p-4">
                    <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                      {task.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.recurrenceSummary ?? "Archived task"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No archived tasks yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
