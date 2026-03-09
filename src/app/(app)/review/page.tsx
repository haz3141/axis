import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeTaskAction,
  reopenTaskAction,
  toggleOccurrenceAction,
} from "@/features/tasks/actions";
import { TaskActionNotice } from "@/features/tasks/components/task-action-notice";
import { PriorityBadge } from "@/features/tasks/components/priority-badge";
import { TaskTaxonomyBadges } from "@/features/tasks/components/task-taxonomy-badges";
import { getReviewData } from "@/features/tasks/data";
import { formatLongDate, formatShortDate } from "@/features/tasks/lib/dates";

export const dynamic = "force-dynamic";

type ReviewPageProps = {
  searchParams: Promise<{
    notice?: string;
    undo?: string;
  }>;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const review = await getReviewData();
  const returnTo = "/review";

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname="/review" searchParams={params} />

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Review</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Week of {formatLongDate(review.weekStart)}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Look back at what closed, which routines were followed through, and what still needs
              attention before the week rolls forward.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/">Open today</Link>
            </Button>
            <Button asChild>
              <Link href="/calendar">Open calendar</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Closed one-time", review.stats.completedOneTime],
            ["Recurring wins", review.stats.recurringCompletions],
            ["Overdue still open", review.stats.overdueOpen],
            ["Missed routines", review.stats.missedRecurring],
          ].map(([label, value]) => (
            <Card key={label} className="gap-4">
              <CardHeader className="gap-1">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-3xl">{value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Completed this week</CardTitle>
            <CardDescription>
              One-time tasks closed between {formatShortDate(review.weekStart)} and{" "}
              {formatShortDate(review.today)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {review.completedTasks.length ? (
              review.completedTasks.map((task) => (
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
                      <TaskTaxonomyBadges
                        projectName={task.projectName}
                        tagNames={task.tagNames}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.completedAt
                        ? `Completed ${formatShortDate(task.completedAt.slice(0, 10))}`
                        : "Completed this week"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/tasks/${task.id}`}>Details</Link>
                    </Button>
                    <form action={reopenTaskAction.bind(null, task.id, returnTo)}>
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
                  No one-time tasks have been closed yet this week.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring follow-through</CardTitle>
            <CardDescription>
              Routines with logged completions this week so far.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {review.recurringWins.length ? (
              review.recurringWins.map((entry) => (
                <div key={entry.task.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/tasks/${entry.task.id}`} className="font-medium hover:underline">
                      {entry.task.title}
                    </Link>
                    <PriorityBadge priority={entry.task.priority} />
                    <TaskTaxonomyBadges
                      projectName={entry.task.projectName}
                      tagNames={entry.task.tagNames}
                    />
                    <Badge variant="secondary">
                      {entry.completedCount} completion{entry.completedCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {entry.task.nextDue
                      ? `Next due ${formatShortDate(entry.task.nextDue)}`
                      : entry.task.recurrenceSummary ?? "Recurring task"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.completedDates.slice(0, 4).map((dateKey) => (
                      <Badge key={dateKey} variant="outline">
                        {formatShortDate(dateKey)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6">
                <p className="text-sm text-muted-foreground">
                  No recurring completions are logged yet this week.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>
            Overdue one-time tasks and recurring occurrences that were projected this week but are
            still open.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {review.attentionItems.length ? (
            review.attentionItems.map((item) => (
              <div
                key={item.key}
                className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/tasks/${item.taskId}`} className="font-medium hover:underline">
                      {item.title}
                    </Link>
                    <PriorityBadge priority={item.priority} />
                    <TaskTaxonomyBadges
                      projectName={item.projectName}
                      tagNames={item.tagNames}
                    />
                    {item.isRecurring ? <Badge variant="outline">Recurring</Badge> : null}
                    <Badge variant="outline">{formatShortDate(item.scheduledFor)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.recurrenceSummary ?? "One-time task"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/tasks/${item.taskId}#edit-task`}>Edit</Link>
                  </Button>
                  <form
                    action={
                      item.isRecurring
                        ? toggleOccurrenceAction.bind(
                            null,
                            item.taskId,
                            item.scheduledFor,
                            item.completed,
                            returnTo
                          )
                        : completeTaskAction.bind(null, item.taskId, returnTo)
                    }
                  >
                    <Button type="submit">{item.isRecurring ? "Log completion" : "Complete"}</Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-6">
              <p className="text-sm text-muted-foreground">
                Nothing is overdue and no recurring occurrences were missed this week.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
