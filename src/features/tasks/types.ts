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
  projectName: string | null;
  tagNames: string[];
  assigneeMemberId: string | null;
  recurrence: RecurrenceDraft | null;
};

export type QuickAddDraft = {
  sourceText: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority | null;
  projectName: string | null;
  tagNames: string[];
  assigneeMemberId: string | null;
  assigneeLabel: string | null;
  recurrence: RecurrenceDraft | null;
  ambiguities: string[];
};

export type DisplayTask = {
  id: string;
  title: string;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  legacyCategory: string | null;
  projectName: string | null;
  tagNames: string[];
  assigneeName: string | null;
  assigneeMemberId: string | null;
  isRecurring: boolean;
  recurrenceSummary: string | null;
  nextDue: string | null;
  notes: string | null;
  completedAt: string | null;
};

export type AgendaItem = {
  key: string;
  taskId: string;
  title: string;
  scheduledFor: string;
  assigneeName: string | null;
  assigneeMemberId: string | null;
  priority: TaskPriority | null;
  projectName: string | null;
  tagNames: string[];
  legacyCategory: string | null;
  notes: string | null;
  completed: boolean;
  isRecurring: boolean;
  recurrenceSummary: string | null;
};
