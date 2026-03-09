import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeTaskAction,
  reopenTaskAction,
  toggleOccurrenceAction,
} from "@/features/tasks/actions";
import { TaskActionNotice } from "@/features/tasks/components/task-action-notice";
import { CalendarGrid } from "@/features/tasks/components/calendar-grid";
import { PriorityBadge } from "@/features/tasks/components/priority-badge";
import { TaskTaxonomyBadges } from "@/features/tasks/components/task-taxonomy-badges";
import { getCalendarData } from "@/features/tasks/data";
import {
  addMonths,
  buildMonthGrid,
  formatLongDate,
  formatMonthLabel,
  formatShortDate,
  getMonthKey,
  getWeekdayLabels,
  todayKey,
} from "@/features/tasks/lib/dates";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams: Promise<{
    month?: string;
    day?: string;
    notice?: string;
    undo?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const today = todayKey();
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "")
    ? (params.month as string)
    : getMonthKey(today);
  const monthGrid = buildMonthGrid(month);
  const visibleDays = new Set(monthGrid.flat().map((cell) => cell.key));
  const requestedDay = /^\d{4}-\d{2}-\d{2}$/.test(params.day ?? "")
    ? (params.day as string)
    : getMonthKey(today) === month
      ? today
      : `${month}-01`;
  const selectedDay = visibleDays.has(requestedDay)
    ? requestedDay
    : getMonthKey(today) === month && visibleDays.has(today)
      ? today
      : monthGrid.flat().find((cell) => cell.inMonth)?.key ?? monthGrid[0][0]?.key ?? `${month}-01`;
  const calendar = await getCalendarData(month, selectedDay);
  const previousMonth = getMonthKey(addMonths(`${month}-01`, -1));
  const nextMonth = getMonthKey(addMonths(`${month}-01`, 1));
  const returnTo = `/calendar?month=${calendar.monthKey}&day=${calendar.selectedDay}`;
  const openCountsByDate = Object.fromEntries(
    [...calendar.itemsByDate.entries()].map(([dateKey, items]) => [
      dateKey,
      items.filter((item) => !item.completed).length,
    ])
  );

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname="/calendar" searchParams={params} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>{calendar.monthLabel}</CardTitle>
                <CardDescription>
                  Month view for one-time due dates and recurring projections.
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="outline" size="icon">
                  <Link
                    href={`/calendar?month=${previousMonth}&day=${previousMonth}-01`}
                    aria-label={`Go to ${formatMonthLabel(previousMonth)}`}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="icon">
                  <Link
                    href={`/calendar?month=${nextMonth}&day=${nextMonth}-01`}
                    aria-label={`Go to ${formatMonthLabel(nextMonth)}`}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-7 gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {getWeekdayLabels().map((label) => (
                <div key={label} className="px-2 py-1">
                  {label}
                </div>
              ))}
            </div>
            <CalendarGrid
              monthKey={calendar.monthKey}
              selectedDay={calendar.selectedDay}
              today={today}
              weeks={calendar.weeks}
              openCountsByDate={openCountsByDate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{formatLongDate(calendar.selectedDay)}</CardTitle>
            <CardDescription>
              Agenda for the selected day. The month grid shows open counts; completed recurring
              occurrences stay visible here as context.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {calendar.agenda.length ? (
              calendar.agenda.map((item) => (
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
                    {item.isRecurring ? <Badge variant="outline">Recurring</Badge> : null}
                    {item.completed ? <Badge variant="secondary">Completed</Badge> : null}
                    {item.assigneeName ? (
                      <Badge variant="secondary">{item.assigneeName}</Badge>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.recurrenceSummary ?? `Scheduled for ${formatShortDate(item.scheduledFor)}`}
                  </p>

                  <div className="mt-3 flex gap-2">
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
                          : item.completed
                            ? reopenTaskAction.bind(null, item.taskId, returnTo)
                            : completeTaskAction.bind(null, item.taskId, returnTo)
                      }
                    >
                      <Button type="submit" variant={item.completed ? "outline" : "default"}>
                        {item.completed ? "Undo" : "Complete"}
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nothing is scheduled for this day.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
