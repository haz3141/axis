"use client";

import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatLongDate } from "@/features/tasks/lib/dates";
import {
  taskFormErrorCopy,
  type TaskFormErrorCode,
} from "@/features/tasks/lib/form";
import {
  hasRecurrenceHistoryRisk,
  recurrencePreviewDates,
  type RecurrenceEditBaseline,
} from "@/features/tasks/lib/recurrence-edit";
import type { RecurrenceDraft, TaskPriority } from "@/features/tasks/types";
import { cn } from "@/lib/utils";

type TaskFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  members: Array<{
    id: string;
    name: string;
  }>;
  projects: string[];
  tags: string[];
  initialValues?: {
    title: string;
    notes: string | null;
    dueDate: string | null;
    priority: TaskPriority | null;
    projectName: string | null;
    tagNames: string[];
    assigneeMemberId: string | null;
    recurrence: RecurrenceDraft | null;
  };
  recurrenceHistory?: RecurrenceEditBaseline | null;
  returnTo?: string;
  formErrorCode?: TaskFormErrorCode | null;
};

const weekdayOptions = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function weekdayFromDateKey(dateKey: string | null) {
  if (!dateKey) {
    return null;
  }

  return new Date(`${dateKey}T12:00:00`).getDay();
}

function monthlyDayFromDateKey(dateKey: string | null) {
  if (!dateKey) {
    return "";
  }

  return String(Number(dateKey.split("-")[2] ?? ""));
}

export function TaskForm({
  action,
  submitLabel,
  members,
  projects,
  tags,
  initialValues,
  recurrenceHistory = null,
  returnTo,
  formErrorCode = null,
}: TaskFormProps) {
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? "");
  const [isRecurring, setIsRecurring] = useState(Boolean(initialValues?.recurrence));
  const [frequency, setFrequency] = useState<RecurrenceDraft["frequency"]>(
    initialValues?.recurrence?.frequency ?? "daily"
  );
  const [intervalInput, setIntervalInput] = useState(
    String(initialValues?.recurrence?.interval ?? 1)
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialValues?.recurrence?.daysOfWeek ?? []
  );
  const [dayOfMonthInput, setDayOfMonthInput] = useState(
    initialValues?.recurrence?.dayOfMonth ? String(initialValues.recurrence.dayOfMonth) : ""
  );
  const [endsOn, setEndsOn] = useState(initialValues?.recurrence?.endsOn ?? "");
  const [historyAction, setHistoryAction] = useState("");
  const deferredDueDate = useDeferredValue(dueDate);

  const interval = Math.max(Number(intervalInput) || 1, 1);
  const dayOfMonth =
    frequency === "monthly" && dayOfMonthInput ? Math.max(Number(dayOfMonthInput) || 1, 1) : null;
  const currentRecurrence = isRecurring
    ? {
        frequency,
        interval,
        daysOfWeek: selectedDays,
        dayOfMonth,
        endsOn: endsOn || null,
      }
    : null;
  const previewDates = recurrencePreviewDates(deferredDueDate || null, currentRecurrence);
  const recurrenceRisk = recurrenceHistory
    ? hasRecurrenceHistoryRisk(recurrenceHistory, {
        dueDate: dueDate || null,
        recurrence: currentRecurrence,
      })
    : false;
  const formErrorMessage = formErrorCode ? taskFormErrorCopy(formErrorCode) : null;
  const dueDateError =
    formErrorCode === "invalid-due-date" ||
    formErrorCode === "recurrence-anchor-required" ||
    formErrorCode === "recurrence-ends-before-anchor";
  const recurrenceEndsOnError = formErrorCode === "recurrence-ends-on-invalid";
  const recurrenceError =
    formErrorCode === "recurrence-frequency-invalid" ||
    formErrorCode === "recurrence-interval-invalid" ||
    formErrorCode === "recurrence-day-of-month-invalid" ||
    recurrenceEndsOnError;
  const recurrenceHistoryError = formErrorCode === "recurrence-history-choice-required";

  return (
    <form action={action} className="grid gap-6">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {formErrorMessage ? (
        <div
          className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          {formErrorMessage}
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          aria-invalid={formErrorCode === "title-required"}
          defaultValue={initialValues?.title ?? ""}
          placeholder="Pay utilities, clean the kitchen, prep lunches"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            value={dueDate}
            aria-invalid={dueDateError}
            aria-describedby={cn(
              "task-due-date-help",
              dueDateError ? "task-due-date-error" : undefined
            )}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <p id="task-due-date-help" className="text-sm text-muted-foreground">
            Recurring tasks use this date as the anchor for future projections.
          </p>
          {dueDateError ? (
            <p id="task-due-date-error" className="text-sm text-destructive">
              {taskFormErrorCopy(formErrorCode!)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            className={selectClassName}
            defaultValue={initialValues?.priority ?? ""}
          >
            <option value="">No priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="assigneeMemberId">Assigned to</Label>
          <select
            id="assigneeMemberId"
            name="assigneeMemberId"
            className={selectClassName}
            defaultValue={initialValues?.assigneeMemberId ?? ""}
          >
            <option value="">Mine</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="projectName">Project</Label>
          <Input
            id="projectName"
            name="projectName"
            list="task-projects"
            defaultValue={initialValues?.projectName ?? ""}
            placeholder="Home reset, School launch, Weekend prep"
          />
          <datalist id="task-projects">
            {projects.map((projectName) => (
              <option key={projectName} value={projectName} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tagNames">Tags</Label>
        <Input
          id="tagNames"
          name="tagNames"
          list="task-tags"
          defaultValue={initialValues?.tagNames.join(", ") ?? ""}
          placeholder="errands, admin, morning"
        />
        <datalist id="task-tags">
          {tags.map((tagName) => (
            <option key={tagName} value={tagName} />
          ))}
        </datalist>
        <p className="text-sm text-muted-foreground">
          Separate multiple tags with commas. Existing tags autocomplete, and new tags are created on save.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={initialValues?.notes ?? ""}
          placeholder="Optional details, checklist context, or handoff notes"
        />
      </div>

      <div className="rounded-2xl border bg-muted/30 p-4">
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            name="isRecurring"
            checked={isRecurring}
            onChange={(event) => setIsRecurring(event.target.checked)}
            className="size-4 rounded border-border"
          />
          Recurring task / habit
        </label>

        {isRecurring ? (
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label>Quick presets</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFrequency("daily");
                    setIntervalInput("1");
                    setSelectedDays([]);
                    setDayOfMonthInput("");
                  }}
                >
                  Daily
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFrequency("weekly");
                    setIntervalInput("1");
                    setSelectedDays([1, 2, 3, 4, 5]);
                    setDayOfMonthInput("");
                  }}
                >
                  Weekdays
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFrequency("weekly");
                    setIntervalInput("1");
                    const weekday = weekdayFromDateKey(dueDate);
                    setSelectedDays(weekday === null ? [] : [weekday]);
                    setDayOfMonthInput("");
                  }}
                >
                  Weekly
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFrequency("monthly");
                    setIntervalInput("1");
                    setSelectedDays([]);
                    setDayOfMonthInput(monthlyDayFromDateKey(dueDate));
                  }}
                >
                  Monthly
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_140px]">
              <div className="grid gap-2">
                <Label htmlFor="recurrenceFrequency">Frequency</Label>
                <select
                  id="recurrenceFrequency"
                  name="recurrenceFrequency"
                  className={selectClassName}
                  aria-invalid={formErrorCode === "recurrence-frequency-invalid"}
                  value={frequency}
                  onChange={(event) =>
                    setFrequency(event.target.value as RecurrenceDraft["frequency"])
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recurrenceInterval">Interval</Label>
                <Input
                  id="recurrenceInterval"
                  name="recurrenceInterval"
                  type="number"
                  min={1}
                  value={intervalInput}
                  aria-invalid={formErrorCode === "recurrence-interval-invalid"}
                  onChange={(event) => setIntervalInput(event.target.value)}
                />
              </div>
            </div>

            {frequency === "weekly" ? (
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">Weekdays</legend>
                <div className="flex flex-wrap gap-2">
                  {weekdayOptions.map((option) => {
                    const selected = selectedDays.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm",
                          selected ? "border-primary bg-primary/10 text-foreground" : "border-border"
                        )}
                      >
                        <input
                          type="checkbox"
                          name="recurrenceDaysOfWeek"
                          value={option.value}
                          checked={selected}
                          onChange={(event) =>
                            setSelectedDays((current) =>
                              event.target.checked
                                ? [...current, option.value].sort((left, right) => left - right)
                                : current.filter((value) => value !== option.value)
                            )
                          }
                          className="size-4"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Leave weekdays blank to use the due date weekday as the repeating anchor.
                </p>
              </fieldset>
            ) : null}

            {frequency === "monthly" ? (
              <div className="grid gap-2 md:max-w-56">
                <Label htmlFor="recurrenceDayOfMonth">Day of month</Label>
                <Input
                  id="recurrenceDayOfMonth"
                  name="recurrenceDayOfMonth"
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonthInput}
                  aria-invalid={formErrorCode === "recurrence-day-of-month-invalid"}
                  onChange={(event) => setDayOfMonthInput(event.target.value)}
                  placeholder="Use due date if blank"
                />
              </div>
            ) : null}

            <div className="grid gap-2 md:max-w-64">
              <Label htmlFor="recurrenceEndsOn">Ends on</Label>
              <Input
                id="recurrenceEndsOn"
                name="recurrenceEndsOn"
                type="date"
                value={endsOn}
                aria-invalid={recurrenceEndsOnError}
                onChange={(event) => setEndsOn(event.target.value)}
              />
            </div>

            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm font-medium">Next occurrences</p>
              {previewDates.length ? (
                <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
                  {previewDates.map((dateKey) => (
                    <li key={dateKey}>{formatLongDate(dateKey)}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a due date to preview future recurring dates.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {recurrenceHistory?.occurrenceCount ? (
          recurrenceRisk ? (
            <fieldset
              className="mt-4 grid gap-3 rounded-2xl border border-amber-300 bg-amber-50/60 p-4"
              aria-describedby={recurrenceHistoryError ? "task-recurrence-history-error" : undefined}
            >
              <legend className="text-sm font-medium text-amber-950">
                Recurrence history decision
              </legend>
              <p className="text-sm text-amber-950">
                This task already has {recurrenceHistory.occurrenceCount} logged occurrence
                {recurrenceHistory.occurrenceCount === 1 ? "" : "s"}.
              </p>
              <p className="text-sm text-amber-900">
                {!isRecurring
                  ? "Turning recurrence off would reinterpret that history. Choose whether to preserve the old recurring record separately or reset this task in place."
                  : "Changing the anchor date or rule shape would reinterpret that history. Choose whether to preserve the old history separately or reset it on this task."}
              </p>
              <div className="grid gap-3">
                <label className="rounded-2xl border border-amber-200 bg-background p-3 text-sm">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="recurrenceHistoryAction"
                      value="keep-history"
                      checked={historyAction === "keep-history"}
                      onChange={(event) => setHistoryAction(event.target.value)}
                      required={recurrenceRisk}
                      aria-describedby={recurrenceHistoryError ? "task-recurrence-history-error" : undefined}
                      className="mt-0.5 size-4"
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        Keep history and start the new schedule as a new task
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        The current task is archived as the historical record, and the updated
                        schedule continues on a new active task.
                      </p>
                    </div>
                  </div>
                </label>

                <label className="rounded-2xl border border-amber-200 bg-background p-3 text-sm">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="recurrenceHistoryAction"
                      value="reset-history"
                      checked={historyAction === "reset-history"}
                      onChange={(event) => setHistoryAction(event.target.value)}
                      required={recurrenceRisk}
                      aria-describedby={recurrenceHistoryError ? "task-recurrence-history-error" : undefined}
                      className="mt-0.5 size-4"
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        Reset occurrence history on this task
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Apply the new schedule in place and clear the logged occurrences so the
                        task starts fresh under the new semantics.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              {recurrenceHistoryError ? (
                <p id="task-recurrence-history-error" className="text-sm text-destructive">
                  {taskFormErrorCopy(formErrorCode!)}
                </p>
              ) : null}
            </fieldset>
          ) : (
            <div className="mt-4 rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
              {recurrenceHistory.occurrenceCount} logged occurrence
              {recurrenceHistory.occurrenceCount === 1 ? "" : "s"} will stay attached to this
              task as long as the anchor date and rule shape stay the same.
            </div>
          )
        ) : null}

        {recurrenceError && !dueDateError && !recurrenceHistoryError ? (
          <p className="mt-4 text-sm text-destructive">{taskFormErrorCopy(formErrorCode!)}</p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
