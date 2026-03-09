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
import { getCalendarData } from "@/features/tasks/data";
import {
  addMonths,
  formatLongDate,
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
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "")
    ? (params.month as string)
    : getMonthKey(todayKey());
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(params.day ?? "")
    ? (params.day as string)
    : getMonthKey(todayKey()) === month
      ? todayKey()
      : `${month}-01`;
  const calendar = await getCalendarData(month, selectedDay);
  const previousMonth = getMonthKey(addMonths(`${month}-01`, -1));
  const nextMonth = getMonthKey(addMonths(`${month}-01`, 1));
  const returnTo = `/calendar?month=${calendar.monthKey}&day=${calendar.selectedDay}`;

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
                  <Link href={`/calendar?month=${previousMonth}&day=${previousMonth}-01`}>
                    <ChevronLeftIcon className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="icon">
                  <Link href={`/calendar?month=${nextMonth}&day=${nextMonth}-01`}>
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

            {calendar.weeks.map((week, index) => (
              <div key={index} className="grid grid-cols-7 gap-2">
                {week.map((cell) => {
                  const dayItems = calendar.itemsByDate.get(cell.key) ?? [];
                  const isSelected = cell.key === calendar.selectedDay;
                  return (
                    <Link
                      key={cell.key}
                      href={`/calendar?month=${calendar.monthKey}&day=${cell.key}`}
                      className={`min-h-28 rounded-2xl border p-3 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : cell.inMonth
                            ? "bg-card hover:bg-muted/30"
                            : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{cell.key.slice(-2)}</span>
                        {dayItems.length ? (
                          <Badge variant="outline">{dayItems.length}</Badge>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-1">
                        {dayItems.slice(0, 3).map((item) => (
                          <span key={item.key} className="truncate text-xs text-muted-foreground">
                            {item.title}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{formatLongDate(calendar.selectedDay)}</CardTitle>
            <CardDescription>Agenda for the selected day.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {calendar.agenda.length ? (
              calendar.agenda.map((item) => (
                <div key={item.key} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/tasks/${item.taskId}`} className="font-medium hover:underline">
                      {item.title}
                    </Link>
                    {item.isRecurring ? <Badge variant="outline">Recurring</Badge> : null}
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
                              item.completed
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
