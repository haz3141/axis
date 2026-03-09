import assert from "node:assert/strict";
import test from "node:test";
import { parseQuickAddInput } from "./parse";

const context = {
  members: [
    { id: "maya", name: "Maya" },
    { id: "ezra", name: "Ezra" },
  ],
  categories: ["home", "errands"],
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
  assert.equal(draft.category, "home");
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
  const [draft] = parseQuickAddInput("Water plants every weekday", context);

  assert.ok(draft);
  assert.equal(draft.title, "Water plants");
  assert.equal(draft.dueDate, null);
  assert.equal(draft.recurrence?.frequency, "weekly");
  assert.deepEqual(draft.ambiguities, ["Recurring phrases need a clear anchor date."]);
});
