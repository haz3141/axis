import assert from "node:assert/strict";
import test from "node:test";
import {
  describeRecurrence,
  nextOccurrence,
  projectOccurrences,
} from "./recurrence";

test("describeRecurrence summarizes weekly and interval-based rules", () => {
  assert.equal(
    describeRecurrence(
      {
        frequency: "weekly",
        interval: 2,
        daysOfWeek: [1, 3, 5],
        dayOfMonth: null,
        endsOn: null,
      },
      "2026-03-02"
    ),
    "Every 2 weeks on Mon, Wed, Fri"
  );
});

test("projectOccurrences and nextOccurrence respect intervals and completed logs", () => {
  const rule = {
    frequency: "weekly" as const,
    interval: 1,
    daysOfWeek: JSON.stringify([1, 3]),
    dayOfMonth: null,
    endsOn: null,
  };

  assert.deepEqual(
    projectOccurrences("2026-03-02", rule, "2026-03-01", "2026-03-11"),
    ["2026-03-02", "2026-03-04", "2026-03-09", "2026-03-11"]
  );

  assert.equal(
    nextOccurrence("2026-03-02", rule, "2026-03-03", 14, new Set(["2026-03-04"])),
    "2026-03-09"
  );
});
