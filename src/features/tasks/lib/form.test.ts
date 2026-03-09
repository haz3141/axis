import assert from "node:assert/strict";
import test from "node:test";
import { parseTaskFormData } from "./form";

test("parseTaskFormData normalizes optional fields and recurrence inputs", () => {
  const formData = new FormData();
  formData.set("title", "  Prep lunches  ");
  formData.set("notes", "  Pack fruit  ");
  formData.set("dueDate", "2026-03-12");
  formData.set("priority", "high");
  formData.set("category", "  home  ");
  formData.set("assigneeMemberId", "maya");
  formData.set("isRecurring", "on");
  formData.set("recurrenceFrequency", "weekly");
  formData.set("recurrenceInterval", "2");
  formData.append("recurrenceDaysOfWeek", "1");
  formData.append("recurrenceDaysOfWeek", "4");
  formData.set("recurrenceEndsOn", "2026-04-30");

  assert.deepEqual(parseTaskFormData(formData), {
    title: "Prep lunches",
    notes: "Pack fruit",
    dueDate: "2026-03-12",
    priority: "high",
    category: "home",
    assigneeMemberId: "maya",
    recurrence: {
      frequency: "weekly",
      interval: 2,
      daysOfWeek: [1, 4],
      dayOfMonth: null,
      endsOn: "2026-04-30",
    },
  });
});

test("parseTaskFormData requires an anchor date for recurring tasks", () => {
  const formData = new FormData();
  formData.set("title", "Laundry");
  formData.set("isRecurring", "on");

  assert.throws(() => parseTaskFormData(formData), {
    message: "Recurring tasks require a due date.",
  });
});
