export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = "active" | "completed" | "archived";
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export type RecurrenceDraft = {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  endsOn: string | null;
};

export type TaskInput = {
  title: string;
  notes: string | null;
  dueDate: string | null;
  priority: TaskPriority | null;
  category: string | null;
  assigneeMemberId: string | null;
  recurrence: RecurrenceDraft | null;
};

export type QuickAddDraft = {
  sourceText: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority | null;
  category: string | null;
  assigneeMemberId: string | null;
  assigneeLabel: string | null;
  recurrence: RecurrenceDraft | null;
  ambiguities: string[];
};
