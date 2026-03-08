import type { TaskInput, TaskPriority } from "@/features/tasks/types";
import { TASK_PRIORITIES } from "@/features/tasks/types";

function optionalText(value: FormDataEntryValue | null) {
  const trimmedValue = value?.toString().trim();
  return trimmedValue ? trimmedValue : null;
}

function optionalPriority(value: FormDataEntryValue | null): TaskPriority | null {
  const priority = value?.toString();
  return TASK_PRIORITIES.includes(priority as TaskPriority)
    ? (priority as TaskPriority)
    : null;
}

export function parseTaskFormData(formData: FormData): TaskInput {
  const title = formData.get("title")?.toString().trim();

  if (!title) {
    throw new Error("Task title is required.");
  }

  const dueDate = optionalText(formData.get("dueDate"));
  const isRecurring = formData.get("isRecurring") === "on";

  if (isRecurring && !dueDate) {
    throw new Error("Recurring tasks require a due date.");
  }

  const recurrence = isRecurring
    ? {
        frequency: (formData.get("recurrenceFrequency")?.toString() ??
          "daily") as "daily" | "weekly" | "monthly",
        interval: Math.max(
          Number(formData.get("recurrenceInterval")?.toString() ?? "1") || 1,
          1
        ),
        daysOfWeek: formData
          .getAll("recurrenceDaysOfWeek")
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6),
        dayOfMonth: formData.get("recurrenceDayOfMonth")
          ? Number(formData.get("recurrenceDayOfMonth"))
          : null,
        endsOn: optionalText(formData.get("recurrenceEndsOn")),
      }
    : null;

  return {
    title,
    notes: optionalText(formData.get("notes")),
    dueDate,
    priority: optionalPriority(formData.get("priority")),
    category: optionalText(formData.get("category")),
    assigneeMemberId: optionalText(formData.get("assigneeMemberId")),
    recurrence,
  };
}
