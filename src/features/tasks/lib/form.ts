import { compareDateKeys } from "@/features/tasks/lib/dates";
import type {
  RecurrenceDraft,
  RecurrenceFrequency,
  TaskInput,
  TaskPriority,
} from "@/features/tasks/types";
import {
  RECURRENCE_FREQUENCIES,
  TASK_PRIORITIES,
} from "@/features/tasks/types";
import { parseTagInput } from "@/features/tasks/lib/organization";

export const TASK_FORM_ERROR_CODES = [
  "title-required",
  "invalid-due-date",
  "recurrence-anchor-required",
  "recurrence-frequency-invalid",
  "recurrence-interval-invalid",
  "recurrence-day-of-month-invalid",
  "recurrence-ends-on-invalid",
  "recurrence-ends-before-anchor",
  "recurrence-history-choice-required",
] as const;

export type TaskFormErrorCode = (typeof TASK_FORM_ERROR_CODES)[number];

export class TaskFormValidationError extends Error {
  code: TaskFormErrorCode;

  constructor(code: TaskFormErrorCode) {
    super(taskFormErrorCopy(code));
    this.name = "TaskFormValidationError";
    this.code = code;
    Object.setPrototypeOf(this, TaskFormValidationError.prototype);
  }
}

export function isTaskFormValidationError(
  error: unknown
): error is TaskFormValidationError {
  return error instanceof TaskFormValidationError;
}

export function parseTaskFormErrorCode(
  value: string | null | undefined
): TaskFormErrorCode | null {
  if (TASK_FORM_ERROR_CODES.includes(value as TaskFormErrorCode)) {
    return value as TaskFormErrorCode;
  }

  return null;
}

export function taskFormErrorCopy(code: TaskFormErrorCode) {
  switch (code) {
    case "title-required":
      return "Task title is required.";
    case "invalid-due-date":
      return "Choose a valid due date.";
    case "recurrence-anchor-required":
      return "Recurring tasks require a due date anchor.";
    case "recurrence-frequency-invalid":
      return "Choose a valid recurrence frequency.";
    case "recurrence-interval-invalid":
      return "Recurrence interval must be at least 1.";
    case "recurrence-day-of-month-invalid":
      return "Day of month must be between 1 and 31.";
    case "recurrence-ends-on-invalid":
      return "Choose a valid recurrence end date.";
    case "recurrence-ends-before-anchor":
      return "Recurrence end date must be on or after the due date anchor.";
    case "recurrence-history-choice-required":
      return "Choose how to handle existing recurrence history before saving.";
  }
}

function optionalText(value: FormDataEntryValue | null) {
  const trimmedValue = value?.toString().trim();
  return trimmedValue ? trimmedValue : null;
}

function optionalDate(
  value: FormDataEntryValue | null,
  errorCode: TaskFormErrorCode
) {
  const dateValue = optionalText(value);

  if (!dateValue) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    throw new TaskFormValidationError(errorCode);
  }

  return dateValue;
}

function optionalPriority(value: FormDataEntryValue | null): TaskPriority | null {
  const priority = value?.toString();
  return TASK_PRIORITIES.includes(priority as TaskPriority)
    ? (priority as TaskPriority)
    : null;
}

function parseRecurrence(formData: FormData, dueDate: string | null): RecurrenceDraft | null {
  if (formData.get("isRecurring") !== "on") {
    return null;
  }

  if (!dueDate) {
    throw new TaskFormValidationError("recurrence-anchor-required");
  }

  const frequencyValue = formData.get("recurrenceFrequency")?.toString() ?? "daily";

  if (!RECURRENCE_FREQUENCIES.includes(frequencyValue as RecurrenceFrequency)) {
    throw new TaskFormValidationError("recurrence-frequency-invalid");
  }

  const frequency = frequencyValue as RecurrenceFrequency;
  const interval = Number(formData.get("recurrenceInterval")?.toString() ?? "1");

  if (!Number.isInteger(interval) || interval < 1) {
    throw new TaskFormValidationError("recurrence-interval-invalid");
  }

  const dayOfMonthValue = optionalText(formData.get("recurrenceDayOfMonth"));
  const dayOfMonth = dayOfMonthValue ? Number(dayOfMonthValue) : null;

  if (dayOfMonth !== null && (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)) {
    throw new TaskFormValidationError("recurrence-day-of-month-invalid");
  }

  const endsOn = optionalDate(formData.get("recurrenceEndsOn"), "recurrence-ends-on-invalid");

  if (endsOn && compareDateKeys(endsOn, dueDate) < 0) {
    throw new TaskFormValidationError("recurrence-ends-before-anchor");
  }

  return {
    frequency,
    interval,
    daysOfWeek:
      frequency === "weekly"
        ? formData
            .getAll("recurrenceDaysOfWeek")
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
        : [],
    dayOfMonth: frequency === "monthly" ? dayOfMonth : null,
    endsOn,
  };
}

export function parseTaskFormData(formData: FormData): TaskInput {
  const title = formData.get("title")?.toString().trim();

  if (!title) {
    throw new TaskFormValidationError("title-required");
  }

  const dueDate = optionalDate(formData.get("dueDate"), "invalid-due-date");
  const recurrence = parseRecurrence(formData, dueDate);

  return {
    title,
    notes: optionalText(formData.get("notes")),
    dueDate,
    priority: optionalPriority(formData.get("priority")),
    projectName: optionalText(formData.get("projectName")),
    tagNames: parseTagInput(formData.get("tagNames")?.toString()),
    assigneeMemberId: optionalText(formData.get("assigneeMemberId")),
    recurrence,
  };
}
