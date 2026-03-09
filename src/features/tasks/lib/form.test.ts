import assert from "node:assert/strict";
import test from "node:test";
import {
  parseTaskFormData,
  taskFormErrorCopy,
  TaskFormValidationError,
} from "./form";

test("parseTaskFormData normalizes optional fields and recurrence inputs", () => {
  const formData = new FormData();
  formData.set("title", "  Prep lunches  ");
  formData.set("notes", "  Pack fruit  ");
  formData.set("dueDate", "2026-03-12");
  formData.set("priority", "high");
  formData.set("projectName", "  Home reset  ");
  formData.set("tagNames", "  home, errands  ");
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
    projectName: "Home reset",
    tagNames: ["errands", "home"],
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

  assert.throws(() => parseTaskFormData(formData), (error) => {
    assert.ok(error instanceof TaskFormValidationError);
    assert.equal(error.code, "recurrence-anchor-required");
    assert.equal(error.message, taskFormErrorCopy("recurrence-anchor-required"));
    return true;
  });
});

test("parseTaskFormData rejects invalid recurrence ranges", () => {
  const formData = new FormData();
  formData.set("title", "Water plants");
  formData.set("dueDate", "2026-03-12");
  formData.set("isRecurring", "on");
  formData.set("recurrenceFrequency", "monthly");
  formData.set("recurrenceDayOfMonth", "32");

  assert.throws(() => parseTaskFormData(formData), (error) => {
    assert.ok(error instanceof TaskFormValidationError);
    assert.equal(error.code, "recurrence-day-of-month-invalid");
    return true;
  });
});

test("parseTaskFormData requires recurrence end dates to stay on or after the anchor", () => {
  const formData = new FormData();
  formData.set("title", "Read with kids");
  formData.set("dueDate", "2026-03-12");
  formData.set("isRecurring", "on");
  formData.set("recurrenceEndsOn", "2026-03-01");

  assert.throws(() => parseTaskFormData(formData), (error) => {
    assert.ok(error instanceof TaskFormValidationError);
    assert.equal(error.code, "recurrence-ends-before-anchor");
    return true;
  });
});
