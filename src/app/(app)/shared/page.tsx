import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeTaskAction,
  reopenTaskAction,
} from "@/features/tasks/actions";
import { TaskActionNotice } from "@/features/tasks/components/task-action-notice";
import { getSharedData } from "@/features/tasks/data";
import { formatShortDate } from "@/features/tasks/lib/dates";

export const dynamic = "force-dynamic";

type SharedPageProps = {
  searchParams: Promise<{
    notice?: string;
    undo?: string;
  }>;
};

export default async function SharedPage({ searchParams }: SharedPageProps) {
  const params = await searchParams;
  const sharedData = await getSharedData();
  const returnTo = "/shared";

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname="/shared" searchParams={params} />

      <Card>
        <CardHeader>
          <CardTitle>Shared / assigned</CardTitle>
          <CardDescription>
            Group active tasks by owner and household assignment.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {sharedData.groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.label}</CardTitle>
              <CardDescription>
                {group.tasks.length} active task{group.tasks.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {group.tasks.length ? (
                group.tasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                        {task.title}
                      </Link>
                      {task.isRecurring ? (
                        <Badge variant="outline">{task.recurrenceSummary}</Badge>
                      ) : null}
                      {task.category ? (
                        <Badge variant="outline">#{task.category}</Badge>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {task.isRecurring
                        ? task.nextDue
                          ? `Next due ${formatShortDate(task.nextDue)}`
                          : "Recurring"
                        : task.dueDate
                          ? `Due ${formatShortDate(task.dueDate)}`
                          : "No due date"}
                    </p>

                    {!task.isRecurring ? (
                      <div className="mt-3 flex gap-2">
                        <Button asChild variant="outline">
                          <Link href={`/tasks/${task.id}#edit-task`}>Edit</Link>
                        </Button>
                        <form
                          action={
                            task.status === "completed"
                              ? reopenTaskAction.bind(null, task.id, returnTo)
                              : completeTaskAction.bind(null, task.id, returnTo)
                          }
                        >
                          <Button type="submit" variant="outline">
                            {task.status === "completed" ? "Reopen" : "Complete"}
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active tasks assigned here yet.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
