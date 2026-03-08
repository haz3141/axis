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
import { TaskForm } from "@/features/tasks/components/task-form";
import { getTaskDetail } from "@/features/tasks/data";
import { parseDaysOfWeek } from "@/features/tasks/lib/recurrence";

export const dynamic = "force-dynamic";

type TaskDetailPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  const { categories, members, task } = await getTaskDetail(taskId);

  if (!task) {
    notFound();
  }

  const updateAction = updateTaskAction.bind(null, task.id);
  const deleteAction = deleteTaskAction.bind(null, task.id);
  const archiveAction = archiveTaskAction.bind(null, task.id);
  const restoreAction = restoreTaskAction.bind(null, task.id);
  const completeAction = completeTaskAction.bind(null, task.id);
  const reopenAction = reopenTaskAction.bind(null, task.id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{task.status}</Badge>
            {task.recurrenceRule ? (
              <Badge variant="outline">Recurring</Badge>
            ) : null}
            {task.assignee?.name ? (
              <Badge variant="outline">{task.assignee.name}</Badge>
            ) : (
              <Badge variant="outline">Mine</Badge>
            )}
          </div>
          <CardTitle>Edit task</CardTitle>
          <CardDescription>
            Update scheduling, category, assignment, and recurring behavior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm
            action={updateAction}
            submitLabel="Save changes"
            members={members}
            categories={categories}
            initialValues={{
              title: task.title,
              notes: task.notes,
              dueDate: task.dueDate,
              priority: task.priority,
              category: task.category,
              assigneeMemberId: task.assigneeMemberId,
              recurrence: task.recurrenceRule
                ? {
                    frequency: task.recurrenceRule.frequency,
                    interval: task.recurrenceRule.interval,
                    daysOfWeek: parseDaysOfWeek(task.recurrenceRule.daysOfWeek),
                    dayOfMonth: task.recurrenceRule.dayOfMonth,
                    endsOn: task.recurrenceRule.endsOn,
                  }
                : null,
            }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task state</CardTitle>
            <CardDescription>
              One-time tasks can be completed here. Recurring completion happens on Today or Calendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
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
            ) : (
              <p className="text-sm text-muted-foreground">
                Recurring tasks stay active. Use daily or calendar views to log each occurrence.
              </p>
            )}

            {task.status === "archived" ? (
              <form action={restoreAction}>
                <Button type="submit" variant="outline">
                  Restore task
                </Button>
              </form>
            ) : (
              <form action={archiveAction}>
                <Button type="submit" variant="outline">
                  Archive task
                </Button>
              </form>
            )}

            <form action={deleteAction}>
              <Button type="submit" variant="destructive">
                Delete task
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Quick context for how this task behaves in MVP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Assignments use the household roster only. There is no auth or permission layer yet.</p>
            <p>Recurring schedules use the due date as the anchor date.</p>
            <p>Calendar and Today project recurring occurrences instead of creating separate future task rows.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
