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
import { getDashboardData } from "@/features/tasks/data";
import { formatShortDate } from "@/features/tasks/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Today</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              {dashboard.todayLabel}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Keep the day simple: finish what is due, clear the overdue pile,
              and capture new tasks before they scatter.
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/tasks">Manual task entry</Link>
            </Button>
            <Button asChild>
              <Link href="/quick-add">Open quick add</Link>
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

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Due today</CardTitle>
            <CardDescription>
              One-time tasks and recurring routines scheduled for today.
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
                      {item.isRecurring ? (
                        <Badge variant="outline">Recurring</Badge>
                      ) : null}
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
                            item.completed
                          )
                        : item.completed
                          ? reopenTaskAction.bind(null, item.taskId)
                          : completeTaskAction.bind(null, item.taskId)
                    }
                  >
                    <Button type="submit" variant={item.completed ? "outline" : "default"}>
                      {item.completed ? "Undo" : "Complete"}
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing is scheduled for today yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overdue</CardTitle>
              <CardDescription>Unfinished one-time tasks that slipped past their date.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.overdueItems.length ? (
                dashboard.overdueItems.map((item) => (
                  <div key={item.key} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/tasks/${item.taskId}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <Badge variant="outline">{formatShortDate(item.scheduledFor)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.assigneeName ? `Assigned to ${item.assigneeName}` : "Owned by you"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No overdue one-time tasks.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming week</CardTitle>
              <CardDescription>
                The next seven days of due dates and projected recurring work.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {dashboard.upcomingItems.length ? (
                dashboard.upcomingItems.map((item) => (
                  <div key={item.key} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <Link href={`/tasks/${item.taskId}`} className="font-medium hover:underline">
                          {item.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {item.recurrenceSummary ?? "One-time task"}
                        </p>
                      </div>
                      <Badge variant="outline">{formatShortDate(item.scheduledFor)}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming tasks in the next week.</p>
              )}

              <Button asChild variant="ghost" className="justify-between">
                <Link href="/calendar">
                  Open calendar
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
