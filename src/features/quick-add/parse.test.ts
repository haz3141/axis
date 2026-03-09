import assert from "node:assert/strict";
import test from "node:test";
import { parseQuickAddInput, RECURRENCE_ANCHOR_MESSAGE } from "./parse";

const context = {
  members: [
    { id: "maya", name: "Maya" },
    { id: "ezra", name: "Ezra" },
  ],
  tags: ["home", "errands"],
};

test("parseQuickAddInput extracts deterministic task fields and cleans the title", () => {
  const [draft] = parseQuickAddInput(
    "Laundry March 14 2026 every weekday for Maya #home urgent",
    context
  );

  assert.ok(draft);
  assert.equal(draft.title, "Laundry");
  assert.equal(draft.dueDate, "2026-03-14");
  assert.equal(draft.priority, "high");
  assert.deepStrictEqual(draft.tagNames, ["home"]);
  assert.equal(draft.projectName, null);
  assert.equal(draft.assigneeMemberId, "maya");
  assert.equal(draft.assigneeLabel, "Maya");
  assert.deepEqual(draft.recurrence, {
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [1, 2, 3, 4, 5],
    dayOfMonth: null,
    endsOn: null,
  });
  assert.deepEqual(draft.ambiguities, []);
});

test("parseQuickAddInput keeps recurrence ambiguous when no anchor date is present", () => {
  const [draft] = parseQuickAddInput("Water plants every 3 days", context);

  assert.ok(draft);
  assert.equal(draft.title, "Water plants");
  assert.equal(draft.dueDate, null);
  assert.deepEqual(draft.recurrence, {
    frequency: "daily",
    interval: 3,
    daysOfWeek: [],
    dayOfMonth: null,
    endsOn: null,
  });
  assert.deepEqual(draft.ambiguities, [RECURRENCE_ANCHOR_MESSAGE]);
});

test("parseQuickAddInput supports explicit week intervals with multi-weekday phrases", () => {
  const [draft] = parseQuickAddInput(
    "Plan meals March 18 2026 every 2 weeks on Monday and Wednesday",
    context
  );

  assert.ok(draft);
  assert.equal(draft.title, "Plan meals");
  assert.equal(draft.dueDate, "2026-03-18");
  assert.deepEqual(draft.recurrence, {
    frequency: "weekly",
    interval: 2,
    daysOfWeek: [1, 3],
    dayOfMonth: null,
    endsOn: null,
  });
});

test("parseQuickAddInput supports explicit month intervals", () => {
  const [draft] = parseQuickAddInput(
    "Review budget March 18 2026 every 2 months on the 18th",
    context
  );

  assert.ok(draft);
  assert.equal(draft.title, "Review budget");
  assert.equal(draft.dueDate, "2026-03-18");
  assert.deepEqual(draft.recurrence, {
    frequency: "monthly",
    interval: 2,
    daysOfWeek: [],
    dayOfMonth: 18,
    endsOn: null,
  });
});
