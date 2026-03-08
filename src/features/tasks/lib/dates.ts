const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate()
  )}`;
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function compareDateKeys(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

export function addDays(dateKey: string, amount: number) {
  const nextDate = parseDateKey(dateKey);
  nextDate.setDate(nextDate.getDate() + amount);
  return formatDateKey(nextDate);
}

export function addMonths(dateKey: string, amount: number) {
  const nextDate = parseDateKey(dateKey);
  nextDate.setMonth(nextDate.getMonth() + amount, 1);
  return formatDateKey(nextDate);
}

export function dateDifferenceInDays(start: string, end: string) {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  const difference = endDate.getTime() - startDate.getTime();
  return Math.round(difference / 86_400_000);
}

export function daysInMonth(dateKey: string) {
  const date = parseDateKey(dateKey);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getMonthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

export function firstDayOfMonth(monthKey: string) {
  return `${monthKey}-01`;
}

export function todayKey() {
  return formatDateKey(new Date());
}

export function startOfWeek(dateKey: string) {
  const date = parseDateKey(dateKey);
  return addDays(dateKey, -date.getDay());
}

export function buildMonthGrid(monthKey: string) {
  const first = firstDayOfMonth(monthKey);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, index) => {
    const key = addDays(gridStart, index);
    return {
      key,
      inMonth: getMonthKey(key) === monthKey,
    };
  });

  return Array.from({ length: 6 }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7)
  );
}

export function enumerateDates(start: string, end: string) {
  const values: string[] = [];
  let cursor = start;

  while (compareDateKeys(cursor, end) <= 0) {
    values.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return values;
}

export function formatShortDate(dateKey: string) {
  return shortDateFormatter.format(parseDateKey(dateKey));
}

export function formatLongDate(dateKey: string) {
  return longDateFormatter.format(parseDateKey(dateKey));
}

export function formatMonthLabel(monthKey: string) {
  return monthFormatter.format(parseDateKey(firstDayOfMonth(monthKey)));
}

export function getWeekdayLabels() {
  return Array.from({ length: 7 }, (_, index) =>
    weekdayFormatter.format(new Date(2024, 0, index + 7))
  );
}

export function isWithinRange(dateKey: string, start: string, end: string) {
  return compareDateKeys(dateKey, start) >= 0 && compareDateKeys(dateKey, end) <= 0;
}
