"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  daysInMonth,
  formatDateKey,
  formatLongDate,
  getMonthKey,
  parseDateKey,
  startOfWeek,
} from "@/features/tasks/lib/dates";
import { cn } from "@/lib/utils";

type CalendarGridProps = {
  monthKey: string;
  selectedDay: string;
  today: string;
  weeks: Array<
    Array<{
      key: string;
      inMonth: boolean;
    }>
  >;
  openCountsByDate: Record<string, number>;
};

function shiftMonthKeepingDay(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
  const nextDay = Math.min(date.getDate(), daysInMonth(formatDateKey(nextMonthDate)));
  nextMonthDate.setDate(nextDay);
  return formatDateKey(nextMonthDate);
}

function dayHref(dateKey: string) {
  return `/calendar?month=${getMonthKey(dateKey)}&day=${dateKey}`;
}

function dayLabel(dateKey: string, count: number, isSelected: boolean, isToday: boolean) {
  const parts = [formatLongDate(dateKey)];

  if (count) {
    parts.push(`${count} open ${count === 1 ? "task" : "tasks"}`);
  } else {
    parts.push("No open tasks");
  }

  if (isToday) {
    parts.push("Today");
  }

  if (isSelected) {
    parts.push("Selected");
  }

  return parts.join(", ");
}

export function CalendarGrid({
  monthKey,
  selectedDay,
  today,
  weeks,
  openCountsByDate,
}: CalendarGridProps) {
  const router = useRouter();
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    buttonRefs.current.get(selectedDay)?.focus();
  }, [selectedDay]);

  function moveSelection(nextDay: string) {
    router.push(dayHref(nextDay));
  }

  function onDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveSelection(addDays(day, 1));
        return;
      case "ArrowLeft":
        event.preventDefault();
        moveSelection(addDays(day, -1));
        return;
      case "ArrowDown":
        event.preventDefault();
        moveSelection(addDays(day, 7));
        return;
      case "ArrowUp":
        event.preventDefault();
        moveSelection(addDays(day, -7));
        return;
      case "Home":
        event.preventDefault();
        moveSelection(startOfWeek(day));
        return;
      case "End":
        event.preventDefault();
        moveSelection(addDays(startOfWeek(day), 6));
        return;
      case "PageDown":
        event.preventDefault();
        moveSelection(shiftMonthKeepingDay(day, 1));
        return;
      case "PageUp":
        event.preventDefault();
        moveSelection(shiftMonthKeepingDay(day, -1));
        return;
      default:
        return;
    }
  }

  return (
    <div className="grid gap-3">
      <p id="calendar-grid-help" className="text-sm text-muted-foreground">
        Use arrow keys to move day selection. Home and End jump across the week. Page Up and
        Page Down change month while keeping the day aligned when possible.
      </p>

      <div role="grid" aria-describedby="calendar-grid-help" aria-label={`Calendar for ${monthKey}`}>
        <div className="grid gap-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} role="row" className="grid grid-cols-7 gap-2">
              {week.map((cell) => {
                const openCount = openCountsByDate[cell.key] ?? 0;
                const isSelected = cell.key === selectedDay;
                const isToday = cell.key === today;

                return (
                  <div key={cell.key} role="gridcell" aria-selected={isSelected}>
                    <button
                      ref={(node) => {
                        if (node) {
                          buttonRefs.current.set(cell.key, node);
                        } else {
                          buttonRefs.current.delete(cell.key);
                        }
                      }}
                      type="button"
                      tabIndex={isSelected ? 0 : -1}
                      aria-pressed={isSelected}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={dayLabel(cell.key, openCount, isSelected, isToday)}
                      className={cn(
                        "min-h-28 w-full rounded-2xl border p-3 text-left transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        isSelected
                          ? "border-primary bg-primary/8 shadow-sm"
                          : cell.inMonth
                            ? "bg-card hover:bg-muted/30"
                            : "bg-muted/30 text-muted-foreground",
                        isToday && !isSelected ? "border-primary/40" : undefined
                      )}
                      onClick={() => moveSelection(cell.key)}
                      onKeyDown={(event) => onDayKeyDown(event, cell.key)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cell.key.slice(-2)}</span>
                          {isToday ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              Today
                            </span>
                          ) : null}
                        </div>
                        {openCount ? (
                          <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
                            {openCount}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                        {isSelected ? (
                          <span className="font-medium text-foreground">Selected day</span>
                        ) : (
                          <span>{cell.inMonth ? "Open the day agenda" : "Open overflow day"}</span>
                        )}
                        <span>{openCount ? `${openCount} open item${openCount === 1 ? "" : "s"}` : "No open items"}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
