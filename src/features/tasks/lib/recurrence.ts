import {
  addMonths,
  addDays,
  compareDateKeys,
  dateDifferenceInDays,
  daysInMonth,
  enumerateDates,
  firstDayOfMonth,
  parseDateKey,
  startOfWeek,
} from "@/features/tasks/lib/dates";
import type { RecurrenceDraft } from "@/features/tasks/types";

export type RecurrenceRuleShape = {
  frequency: RecurrenceDraft["frequency"];
  interval: number;
  daysOfWeek: string | null;
  dayOfMonth: number | null;
  endsOn: string | null;
};

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

export function serializeDaysOfWeek(daysOfWeek: number[]) {
  return daysOfWeek.length ? JSON.stringify([...new Set(daysOfWeek)].sort()) : null;
}

export function parseDaysOfWeek(daysOfWeek: string | null) {
  if (!daysOfWeek) {
    return [];
  }

  try {
    const parsed = JSON.parse(daysOfWeek) as number[];
    return parsed.filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  } catch {
    return [];
  }
}

export function describeRecurrence(
  rule: RecurrenceRuleShape | RecurrenceDraft | null,
  dueDate: string | null
) {
  if (!rule || !dueDate) {
    return null;
  }

  if (rule.frequency === "daily") {
    return rule.interval === 1 ? "Daily" : `Every ${rule.interval} days`;
  }

  if (rule.frequency === "weekly") {
    const daysOfWeek =
      Array.isArray(rule.daysOfWeek) && rule.daysOfWeek.length
        ? rule.daysOfWeek
        : typeof rule.daysOfWeek === "string"
          ? parseDaysOfWeek(rule.daysOfWeek)
          : [parseDateKey(dueDate).getDay()];
    const summary = daysOfWeek
      .map((value) => weekdayFormatter.format(new Date(2024, 0, value + 7)))
      .join(", ");

    return rule.interval === 1
      ? `Weekly on ${summary}`
      : `Every ${rule.interval} weeks on ${summary}`;
  }

  const monthlyDay =
    ("dayOfMonth" in rule ? rule.dayOfMonth : null) ??
    Number(dueDate.split("-")[2]);

  return rule.interval === 1
    ? `Monthly on day ${monthlyDay}`
    : `Every ${rule.interval} months on day ${monthlyDay}`;
}

function occursWeekly(
  anchorDate: string,
  candidateDate: string,
  interval: number,
  daysOfWeek: number[]
) {
  const candidateWeekday = parseDateKey(candidateDate).getDay();
  const selectedDays = daysOfWeek.length
    ? daysOfWeek
    : [parseDateKey(anchorDate).getDay()];

  if (!selectedDays.includes(candidateWeekday)) {
    return false;
  }

  const startWeek = startOfWeek(anchorDate);
  const candidateWeek = startOfWeek(candidateDate);
  const weekDelta = dateDifferenceInDays(startWeek, candidateWeek) / 7;

  return weekDelta >= 0 && weekDelta % interval === 0;
}

function occursMonthly(
  anchorDate: string,
  candidateDate: string,
  interval: number,
  dayOfMonth: number | null
) {
  const anchor = parseDateKey(anchorDate);
  const candidate = parseDateKey(candidateDate);
  const monthsApart =
    (candidate.getFullYear() - anchor.getFullYear()) * 12 +
    (candidate.getMonth() - anchor.getMonth());

  if (monthsApart < 0 || monthsApart % interval !== 0) {
    return false;
  }

  const targetDay = dayOfMonth ?? anchor.getDate();
  const clampedDay = Math.min(targetDay, daysInMonth(candidateDate));

  return candidate.getDate() === clampedDay;
}

export function occursOnDate(
  anchorDate: string,
  rule: RecurrenceRuleShape,
  candidateDate: string
) {
  if (compareDateKeys(candidateDate, anchorDate) < 0) {
    return false;
  }

  if (rule.endsOn && compareDateKeys(candidateDate, rule.endsOn) > 0) {
    return false;
  }

  if (rule.frequency === "daily") {
    const dayDelta = dateDifferenceInDays(anchorDate, candidateDate);
    return dayDelta >= 0 && dayDelta % rule.interval === 0;
  }

  if (rule.frequency === "weekly") {
    return occursWeekly(
      anchorDate,
      candidateDate,
      rule.interval,
      parseDaysOfWeek(rule.daysOfWeek)
    );
  }

  return occursMonthly(anchorDate, candidateDate, rule.interval, rule.dayOfMonth);
}

export function projectOccurrences(
  anchorDate: string,
  rule: RecurrenceRuleShape,
  start: string,
  end: string
) {
  const firstDate = compareDateKeys(start, anchorDate) < 0 ? anchorDate : start;
  return enumerateDates(firstDate, end).filter((candidateDate) =>
    occursOnDate(anchorDate, rule, candidateDate)
  );
}

export function nextOccurrence(
  anchorDate: string,
  rule: RecurrenceRuleShape,
  start: string,
  maxDays = 90
) {
  const end = addDays(start, maxDays);
  return projectOccurrences(anchorDate, rule, start, end)[0] ?? null;
}

export function defaultMonthlyDay(dateKey: string) {
  return parseDateKey(dateKey).getDate();
}

export function defaultWeekday(dateKey: string) {
  return parseDateKey(dateKey).getDay();
}

export function monthRange(monthKey: string) {
  const start = firstDayOfMonth(monthKey);
  const end = addDays(addMonths(start, 1), -1);
  return { start, end };
}
