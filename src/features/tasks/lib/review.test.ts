import assert from "node:assert/strict";
import test from "node:test";
import { buildReviewSnapshot, reviewWeekRange } from "./review";

test("reviewWeekRange starts on Sunday and spans one week", () => {
  assert.deepStrictEqual(reviewWeekRange("2026-03-11"), {
    weekStart: "2026-03-08",
    weekEnd: "2026-03-14",
  });
});

test("buildReviewSnapshot separates completed work, recurring wins, and missed routines", () => {
  const snapshot = buildReviewSnapshot(
    [
      {
        id: "done-task",
        status: "completed",
        dueDate: "2026-03-09",
        completedAt: "2026-03-10T10:00:00.000Z",
        recurrenceRule: null,
        occurrenceLogs: [],
      },
      {
        id: "overdue-task",
        status: "active",
        dueDate: "2026-03-08",
        completedAt: null,
        recurrenceRule: null,
        occurrenceLogs: [],
      },
      {
        id: "routine-win",
        status: "active",
        dueDate: "2026-03-08",
        completedAt: null,
        recurrenceRule: {
          frequency: "daily",
          interval: 1,
          daysOfWeek: null,
          dayOfMonth: null,
          endsOn: null,
        },
        occurrenceLogs: [
          { scheduledFor: "2026-03-08" },
          { scheduledFor: "2026-03-10" },
        ],
      },
      {
        id: "routine-miss",
        status: "active",
        dueDate: "2026-03-09",
        completedAt: null,
        recurrenceRule: {
          frequency: "weekly",
          interval: 1,
          daysOfWeek: JSON.stringify([1, 3]),
          dayOfMonth: null,
          endsOn: null,
        },
        occurrenceLogs: [{ scheduledFor: "2026-03-09" }],
      },
    ],
    "2026-03-11"
  );

  assert.deepStrictEqual(snapshot.completedTaskIds, ["done-task"]);
  assert.deepStrictEqual(snapshot.overdueTaskIds, ["overdue-task"]);
  assert.deepStrictEqual(snapshot.recurringCompletionTaskIds, ["routine-win", "routine-miss"]);
  assert.deepStrictEqual(snapshot.recurringCompletionDatesByTaskId["routine-win"], [
    "2026-03-10",
    "2026-03-08",
  ]);
  assert.deepStrictEqual(snapshot.missedRecurringOccurrences, [
    { taskId: "routine-win", scheduledFor: "2026-03-09" },
    { taskId: "routine-miss", scheduledFor: "2026-03-11" },
    { taskId: "routine-win", scheduledFor: "2026-03-11" },
  ]);
});
