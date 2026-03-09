import assert from "node:assert/strict";
import test from "node:test";
import {
  compareAgendaItemsByFocus,
  normalizeTaskListView,
  selectArchivedTasks,
  selectCompletedTasks,
  selectInboxTasks,
  selectUpcomingTasks,
} from "./focus";
import type { AgendaItem, DisplayTask } from "@/features/tasks/types";

const tasks: DisplayTask[] = [
  {
    id: "inbox-low",
    title: "Collect receipts",
    status: "active",
    priority: "low",
    category: null,
    assigneeName: null,
    assigneeMemberId: null,
    dueDate: null,
    recurrenceSummary: null,
    nextDue: null,
    notes: null,
    isRecurring: false,
    completedAt: null,
  },
  {
    id: "inbox-high",
    title: "Reply to landlord",
    status: "active",
    priority: "high",
    category: null,
    assigneeName: null,
    assigneeMemberId: null,
    dueDate: null,
    recurrenceSummary: null,
    nextDue: null,
    notes: null,
    isRecurring: false,
    completedAt: null,
  },
  {
    id: "future-recurring",
    title: "Laundry",
    status: "active",
    priority: "medium",
    category: null,
    assigneeName: null,
    assigneeMemberId: null,
    dueDate: "2026-03-10",
    recurrenceSummary: "Every week",
    nextDue: "2026-03-15",
    notes: null,
    isRecurring: true,
    completedAt: null,
  },
  {
    id: "future-once",
    title: "Dentist",
    status: "active",
    priority: "high",
    category: null,
    assigneeName: null,
    assigneeMemberId: null,
    dueDate: "2026-03-11",
    recurrenceSummary: null,
    nextDue: "2026-03-11",
    notes: null,
    isRecurring: false,
    completedAt: null,
  },
  {
    id: "today-task",
    title: "Call back",
    status: "active",
    priority: "medium",
    category: null,
    assigneeName: null,
    assigneeMemberId: null,
    dueDate: "2026-03-09",
    recurrenceSummary: null,
    nextDue: "2026-03-09",
    notes: null,
    isRecurring: false,
    completedAt: null,
  },
  {
    id: "done-task",
    title: "Book sitter",
    status: "completed",
    priority: null,
    category: null,
    assigneeName: null,
    assigneeMemberId: null,
    dueDate: "2026-03-08",
    recurrenceSummary: null,
    nextDue: "2026-03-08",
    notes: null,
    isRecurring: false,
    completedAt: "2026-03-09T10:30:00.000Z",
  },
  {
    id: "archived-task",
    title: "Old routine",
    status: "archived",
    priority: null,
    category: null,
    assigneeName: null,
    assigneeMemberId: null,
    dueDate: "2026-02-01",
    recurrenceSummary: "Every week",
    nextDue: null,
    notes: null,
    isRecurring: true,
    completedAt: null,
  },
];

test("normalizeTaskListView falls back to inbox", () => {
  assert.equal(normalizeTaskListView(undefined), "inbox");
  assert.equal(normalizeTaskListView("completed"), "completed");
  assert.equal(normalizeTaskListView("random"), "inbox");
});

test("selectInboxTasks keeps unscheduled active one-time tasks and sorts by priority", () => {
  assert.deepEqual(
    selectInboxTasks(tasks).map((task) => task.id),
    ["inbox-high", "inbox-low"]
  );
});

test("selectUpcomingTasks keeps only future active tasks and sorts by priority then date", () => {
  assert.deepEqual(
    selectUpcomingTasks(tasks, "2026-03-09").map((task) => task.id),
    ["future-once", "future-recurring"]
  );
});

test("completed and archived selectors separate closed work", () => {
  assert.deepEqual(selectCompletedTasks(tasks).map((task) => task.id), ["done-task"]);
  assert.deepEqual(selectArchivedTasks(tasks).map((task) => task.id), ["archived-task"]);
});

test("sortAgendaItems surfaces priority before alphabetical order", () => {
  const items: AgendaItem[] = [
    {
      key: "medium",
      taskId: "medium",
      title: "Laundry",
      priority: "medium",
      category: null,
      assigneeName: null,
      completed: false,
      isRecurring: false,
      recurrenceSummary: null,
      scheduledFor: "2026-03-10",
    },
    {
      key: "high",
      taskId: "high",
      title: "Pay rent",
      priority: "high",
      category: null,
      assigneeName: null,
      completed: false,
      isRecurring: false,
      recurrenceSummary: null,
      scheduledFor: "2026-03-10",
    },
    {
      key: "low",
      taskId: "low",
      title: "Vacuum",
      priority: "low",
      category: null,
      assigneeName: null,
      completed: false,
      isRecurring: false,
      recurrenceSummary: null,
      scheduledFor: "2026-03-10",
    },
  ];

  assert.deepEqual(
    [...items].sort(compareAgendaItemsByFocus).map((item) => item.key),
    ["high", "medium", "low"]
  );
});
