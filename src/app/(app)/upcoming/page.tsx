import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskActionNotice } from "@/features/tasks/components/task-action-notice";
import { PriorityBadge } from "@/features/tasks/components/priority-badge";
import { getUpcomingData } from "@/features/tasks/data";
import { formatLongDate, formatShortDate } from "@/features/tasks/lib/dates";

export const dynamic = "force-dynamic";

type UpcomingPageProps = {
  searchParams: Promise<{
    notice?: string;
    undo?: string;
  }>;
};

export default async function UpcomingPage({ searchParams }: UpcomingPageProps) {
  const resolvedSearchParams = await searchParams;
  const upcoming = await getUpcomingData();

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname="/upcoming" searchParams={resolvedSearchParams} />

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Focus workspace</p>
            <h2 className="text-3xl font-semibold tracking-tight">Upcoming</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Future-dated one-time tasks and projected recurring work through{" "}
              {formatLongDate(upcoming.projectionEnd)}.
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/tasks">Open inbox</Link>
            </Button>
            <Button asChild>
              <Link href="/calendar">Open calendar</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="gap-4">
            <CardHeader className="gap-1">
              <CardDescription>Future one-time tasks</CardDescription>
              <CardTitle className="text-3xl">{upcoming.stats.oneTime}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="gap-4">
            <CardHeader className="gap-1">
              <CardDescription>Recurring occurrences</CardDescription>
              <CardTitle className="text-3xl">{upcoming.stats.recurring}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Future-dated work</CardTitle>
          <CardDescription>
            Review what is coming next without mixing it into Today.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {upcoming.items.length ? (
            upcoming.items.map((item) => (
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
                    {item.isRecurring ? <Badge variant="outline">Recurring</Badge> : null}
                    {item.assigneeName ? <Badge variant="secondary">{item.assigneeName}</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.recurrenceSummary ?? "One-time task"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline">{formatShortDate(item.scheduledFor)}</Badge>
                  <Button asChild variant="outline">
                    <Link href={`/tasks/${item.taskId}#edit-task`}>
                      Edit
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-6">
              <p className="text-sm text-muted-foreground">
                Nothing is queued in the next 30 days. Capture something new or plan from the inbox.
              </p>
              <div className="mt-4 flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/tasks">Open inbox</Link>
                </Button>
                <Button asChild>
                  <Link href="/quick-add">Batch quick add</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
