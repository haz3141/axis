import assert from "node:assert/strict";
import test from "node:test";
import { getTaskExecutionState, getTaskNextDue } from "@/features/tasks/lib/execution";

test("getTaskNextDue skips logged recurring occurrences", () => {
  const task = {
    dueDate: "2026-03-03",
    status: "active" as const,
    recurrenceRule: {
      id: "rule-1",
      taskId: "task-1",
      frequency: "weekly" as const,
      interval: 1,
      daysOfWeek: JSON.stringify([2, 4]),
      dayOfMonth: null,
      endsOn: null,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    occurrenceLogs: [{ scheduledFor: "2026-03-03" }, { scheduledFor: "2026-03-05" }],
  };

  assert.equal(getTaskNextDue(task, "2026-03-06"), "2026-03-10");
});

test("getTaskExecutionState reports recent history and upcoming projected dates", () => {
  const task = {
    dueDate: "2026-03-03",
    status: "active" as const,
    recurrenceRule: {
      id: "rule-2",
      taskId: "task-2",
      frequency: "weekly" as const,
      interval: 1,
      daysOfWeek: JSON.stringify([2, 4]),
      dayOfMonth: null,
      endsOn: null,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    occurrenceLogs: [
      { scheduledFor: "2026-03-05" },
      { scheduledFor: "2026-03-03" },
    ],
  };

  assert.deepStrictEqual(getTaskExecutionState(task, "2026-03-06"), {
    nextDue: "2026-03-10",
    lastCompletedOccurrence: "2026-03-05",
    recentOccurrenceDates: ["2026-03-05", "2026-03-03"],
    upcomingOccurrenceDates: ["2026-03-10", "2026-03-12", "2026-03-17", "2026-03-19"],
  });
});

test("getTaskExecutionState keeps one-time tasks simple", () => {
  const task = {
    dueDate: "2026-03-09",
    status: "active" as const,
    recurrenceRule: null,
    occurrenceLogs: [],
  };

  assert.deepStrictEqual(getTaskExecutionState(task, "2026-03-06"), {
    nextDue: "2026-03-09",
    lastCompletedOccurrence: null,
    recentOccurrenceDates: [],
    upcomingOccurrenceDates: [],
  });
});
