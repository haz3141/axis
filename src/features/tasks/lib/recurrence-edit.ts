import { addDays, compareDateKeys, todayKey } from "@/features/tasks/lib/dates";
import { parseDaysOfWeek, projectOccurrences, serializeDaysOfWeek } from "@/features/tasks/lib/recurrence";
import type { RecurrenceDraft } from "@/features/tasks/types";
import type { RecurrenceRuleRecord } from "@/lib/db/schema";

export type RecurrenceHistoryChoice = "keep-history" | "reset-history";
export type RecurrenceUpdateStrategy =
  | "update-in-place"
  | "reset-history"
  | "fork-task"
  | "missing-choice";

export type RecurrenceEditBaseline = {
  dueDate: string | null;
  recurrence: RecurrenceDraft | null;
  occurrenceCount: number;
};

function normalizeRecurrenceDraft(recurrence: RecurrenceDraft | null) {
  if (!recurrence) {
    return null;
  }

  return {
    frequency: recurrence.frequency,
    interval: recurrence.interval,
    daysOfWeek: [...recurrence.daysOfWeek].sort((left, right) => left - right),
    dayOfMonth: recurrence.dayOfMonth,
    endsOn: recurrence.endsOn,
  };
}

function recurrenceShape(recurrence: RecurrenceDraft) {
  return {
    frequency: recurrence.frequency,
    interval: recurrence.interval,
    daysOfWeek: serializeDaysOfWeek(recurrence.daysOfWeek),
    dayOfMonth: recurrence.dayOfMonth,
    endsOn: recurrence.endsOn,
  };
}

export function recurrenceDraftFromRule(rule: RecurrenceRuleRecord | null): RecurrenceDraft | null {
  if (!rule) {
    return null;
  }

  return {
    frequency: rule.frequency,
    interval: rule.interval,
    daysOfWeek: parseDaysOfWeek(rule.daysOfWeek),
    dayOfMonth: rule.dayOfMonth,
    endsOn: rule.endsOn,
  };
}

export function hasRecurrenceHistoryRisk(
  baseline: RecurrenceEditBaseline,
  nextValues: Pick<RecurrenceEditBaseline, "dueDate" | "recurrence">
) {
  if (!baseline.recurrence || baseline.occurrenceCount === 0) {
    return false;
  }

  if (baseline.dueDate !== nextValues.dueDate) {
    return true;
  }

  return (
    JSON.stringify(normalizeRecurrenceDraft(baseline.recurrence)) !==
    JSON.stringify(normalizeRecurrenceDraft(nextValues.recurrence))
  );
}

export function resolveRecurrenceUpdateStrategy(
  baseline: RecurrenceEditBaseline,
  nextValues: Pick<RecurrenceEditBaseline, "dueDate" | "recurrence">,
  choice: RecurrenceHistoryChoice | null
): RecurrenceUpdateStrategy {
  if (!hasRecurrenceHistoryRisk(baseline, nextValues)) {
    return "update-in-place";
  }

  if (choice === "reset-history") {
    return "reset-history";
  }

  if (choice === "keep-history") {
    return "fork-task";
  }

  return "missing-choice";
}

export function readRecurrenceHistoryChoice(formData: FormData): RecurrenceHistoryChoice | null {
  const value = formData.get("recurrenceHistoryAction")?.toString();

  if (value === "keep-history" || value === "reset-history") {
    return value;
  }

  return null;
}

export function recurrencePreviewDates(
  dueDate: string | null,
  recurrence: RecurrenceDraft | null,
  limit = 4,
  start = todayKey()
) {
  if (!dueDate || !recurrence) {
    return [];
  }

  const previewStart = compareDateKeys(start, dueDate) > 0 ? start : dueDate;
  return projectOccurrences(
    dueDate,
    recurrenceShape(recurrence),
    previewStart,
    addDays(previewStart, 180)
  ).slice(0, limit);
}
