import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
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
import { getDashboardData } from "@/features/tasks/data";
import { formatShortDate } from "@/features/tasks/lib/dates";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    notice?: string;
    undo?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const dashboard = await getDashboardData();

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname="/" searchParams={resolvedSearchParams} />

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Today</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              {dashboard.todayLabel}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Finish what is due, clear overdue work, and keep future planning in Upcoming instead of mixing it into today.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/tasks">Review inbox</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/review">Weekly review</Link>
            </Button>
            <Button asChild>
              <Link href="/upcoming">Open upcoming</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Due today", dashboard.stats.dueToday],
            ["Overdue", dashboard.stats.overdue],
            ["Completed this week", dashboard.stats.completedThisWeek],
            ["Active recurring", dashboard.stats.activeRecurring],
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

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Due today</CardTitle>
            <CardDescription>
              Active one-time tasks and recurring routines scheduled for today.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard.todayItems.length ? (
              dashboard.todayItems.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/tasks/${item.taskId}`}
                        className="font-medium hover:underline"
                      >
                        {item.title}
                      </Link>
                      <PriorityBadge priority={item.priority} />
                      <TaskTaxonomyBadges
                        projectName={item.projectName}
                        tagNames={item.tagNames}
                      />
                      {item.isRecurring ? <Badge variant="outline">Recurring</Badge> : null}
                      {item.assigneeName ? (
                        <Badge variant="secondary">{item.assigneeName}</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.recurrenceSummary ?? "One-time task"}
                    </p>
                  </div>

                  <form
                    action={
                      item.isRecurring
                        ? toggleOccurrenceAction.bind(
                            null,
                            item.taskId,
                            item.scheduledFor,
                            item.completed,
                            "/"
                          )
                        : item.completed
                          ? reopenTaskAction.bind(null, item.taskId, "/")
                          : completeTaskAction.bind(null, item.taskId, "/")
                    }
                  >
                    <div className="flex gap-2">
                      <Button asChild variant="outline">
                        <Link href={`/tasks/${item.taskId}#edit-task`}>Edit</Link>
                      </Button>
                      <Button type="submit" variant={item.completed ? "outline" : "default"}>
                        {item.completed ? "Undo" : "Complete"}
                      </Button>
                    </div>
                  </form>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6">
                <p className="text-sm text-muted-foreground">
                  Nothing is scheduled for today. Capture something with <span className="font-medium">q</span> or review the inbox for unscheduled work.
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

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overdue</CardTitle>
              <CardDescription>
                One-time tasks that slipped past their scheduled date.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.overdueItems.length ? (
                dashboard.overdueItems.map((item) => (
                  <div key={item.key} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/tasks/${item.taskId}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <PriorityBadge priority={item.priority} />
                      <TaskTaxonomyBadges
                        projectName={item.projectName}
                        tagNames={item.tagNames}
                      />
                      <Badge variant="outline">{formatShortDate(item.scheduledFor)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.assigneeName ? `Assigned to ${item.assigneeName}` : "Owned by you"}
                    </p>
                    <div className="mt-3">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tasks/${item.taskId}#edit-task`}>Edit task</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No overdue one-time tasks.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coming up</CardTitle>
              <CardDescription>
                A short preview of future-dated work. Open Upcoming for the full list.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.upcomingItems.length ? (
                dashboard.upcomingItems.slice(0, 6).map((item) => (
                  <div key={item.key} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Link href={`/tasks/${item.taskId}`} className="font-medium hover:underline">
                          {item.title}
                        </Link>
                        <div className="flex flex-wrap gap-2">
                          <TaskTaxonomyBadges
                            projectName={item.projectName}
                            tagNames={item.tagNames}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.recurrenceSummary ?? "One-time task"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <PriorityBadge priority={item.priority} />
                        <Badge variant="outline">{formatShortDate(item.scheduledFor)}</Badge>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/tasks/${item.taskId}#edit-task`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No future-dated tasks are scheduled in the next week.
                </p>
              )}

              <Button asChild variant="ghost" className="justify-between">
                <Link href="/upcoming">
                  Open upcoming
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
