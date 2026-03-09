import assert from "node:assert/strict";
import test from "node:test";
import {
  hasRecurrenceHistoryRisk,
  recurrenceDraftFromRule,
  recurrencePreviewDates,
  resolveRecurrenceUpdateStrategy,
} from "@/features/tasks/lib/recurrence-edit";

test("recurrenceDraftFromRule converts stored rules back into form drafts", () => {
  assert.deepStrictEqual(
    recurrenceDraftFromRule({
      id: "rule-1",
      taskId: "task-1",
      frequency: "weekly",
      interval: 2,
      daysOfWeek: JSON.stringify([1, 3]),
      dayOfMonth: null,
      endsOn: "2026-05-01",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    }),
    {
      frequency: "weekly",
      interval: 2,
      daysOfWeek: [1, 3],
      dayOfMonth: null,
      endsOn: "2026-05-01",
    }
  );
});

test("hasRecurrenceHistoryRisk detects anchor and rule-shape changes", () => {
  const baseline = {
    dueDate: "2026-03-10",
    recurrence: {
      frequency: "weekly" as const,
      interval: 1,
      daysOfWeek: [2, 4],
      dayOfMonth: null,
      endsOn: null,
    },
    occurrenceCount: 3,
  };

  assert.equal(
    hasRecurrenceHistoryRisk(baseline, {
      dueDate: "2026-03-10",
      recurrence: {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: [2, 4],
        dayOfMonth: null,
        endsOn: null,
      },
    }),
    false
  );

  assert.equal(
    hasRecurrenceHistoryRisk(baseline, {
      dueDate: "2026-03-11",
      recurrence: baseline.recurrence,
    }),
    true
  );
});

test("resolveRecurrenceUpdateStrategy requires an explicit history choice", () => {
  const baseline = {
    dueDate: "2026-03-10",
    recurrence: {
      frequency: "weekly" as const,
      interval: 1,
      daysOfWeek: [2, 4],
      dayOfMonth: null,
      endsOn: null,
    },
    occurrenceCount: 2,
  };
  const nextValues = {
    dueDate: "2026-03-10",
    recurrence: {
      frequency: "weekly" as const,
      interval: 2,
      daysOfWeek: [2, 4],
      dayOfMonth: null,
      endsOn: null,
    },
  };

  assert.equal(resolveRecurrenceUpdateStrategy(baseline, nextValues, null), "missing-choice");
  assert.equal(
    resolveRecurrenceUpdateStrategy(baseline, nextValues, "keep-history"),
    "fork-task"
  );
  assert.equal(
    resolveRecurrenceUpdateStrategy(baseline, nextValues, "reset-history"),
    "reset-history"
  );
});

test("recurrencePreviewDates projects the next few dates from the current rule", () => {
  assert.deepStrictEqual(
    recurrencePreviewDates(
      "2026-03-10",
      {
        frequency: "weekly",
        interval: 1,
        daysOfWeek: [2, 4],
        dayOfMonth: null,
        endsOn: null,
      },
      4,
      "2026-03-09"
    ),
    ["2026-03-10", "2026-03-12", "2026-03-17", "2026-03-19"]
  );
});
