import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFilterHref,
  filterAgendaItems,
  filterDisplayTasks,
  normalizeUpcomingView,
  readTaskFilterState,
} from "@/features/tasks/lib/filters";

test("readTaskFilterState normalizes query params", () => {
  const filters = readTaskFilterState(
    {
      view: "recurring",
      q: "  kitchen ",
      project: "Home",
      tag: "Errands",
      priority: "high",
      assignee: "maya",
    },
    normalizeUpcomingView
  );

  assert.deepStrictEqual(filters, {
    view: "recurring",
    q: "kitchen",
    project: "Home",
    tag: "Errands",
    priority: "high",
    assignee: "maya",
  });
});

test("filterDisplayTasks matches project tag priority assignee and legacy category", () => {
  const tasks = [
    {
      id: "task-1",
      title: "Clean kitchen",
      dueDate: null,
      status: "active" as const,
      priority: "high" as const,
      legacyCategory: "Home",
      projectName: "House reset",
      tagNames: ["Errands"],
      assigneeName: "Maya",
      assigneeMemberId: "maya",
      isRecurring: false,
      recurrenceSummary: null,
      nextDue: null,
      notes: "Deep clean pantry too",
      completedAt: null,
    },
    {
      id: "task-2",
      title: "Pay tuition",
      dueDate: null,
      status: "active" as const,
      priority: "medium" as const,
      legacyCategory: null,
      projectName: null,
      tagNames: ["School"],
      assigneeName: null,
      assigneeMemberId: null,
      isRecurring: false,
      recurrenceSummary: null,
      nextDue: null,
      notes: null,
      completedAt: null,
    },
  ];

  assert.deepStrictEqual(
    filterDisplayTasks(tasks, {
      view: "inbox",
      q: "pantry",
      project: "house reset",
      tag: "home",
      priority: "high",
      assignee: "maya",
    }).map((task) => task.id),
    ["task-1"]
  );
});

test("filterAgendaItems respects upcoming view filters", () => {
  const items = [
    {
      key: "1",
      taskId: "task-1",
      title: "Clean kitchen",
      scheduledFor: "2026-03-12",
      assigneeName: "Maya",
      assigneeMemberId: "maya",
      priority: "high" as const,
      projectName: "House reset",
      tagNames: ["Home"],
      legacyCategory: null,
      notes: null,
      completed: false,
      isRecurring: true,
      recurrenceSummary: "Weekly on Thu",
    },
    {
      key: "2",
      taskId: "task-2",
      title: "File taxes",
      scheduledFor: "2026-03-15",
      assigneeName: null,
      assigneeMemberId: null,
      priority: "medium" as const,
      projectName: null,
      tagNames: ["Finance"],
      legacyCategory: null,
      notes: null,
      completed: false,
      isRecurring: false,
      recurrenceSummary: null,
    },
  ];

  assert.deepStrictEqual(
    filterAgendaItems(items, {
      view: "recurring",
      q: "",
      project: "",
      tag: "",
      priority: "",
      assignee: "",
    }).map((item) => item.taskId),
    ["task-1"]
  );
});

test("buildFilterHref omits empty values", () => {
  assert.equal(
    buildFilterHref("/upcoming", {
      view: "all",
      q: "",
      project: "House reset",
      tag: "",
      priority: "",
      assignee: "",
    }),
    "/upcoming?view=all&project=House+reset"
  );
});
