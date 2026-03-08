"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RecurrenceDraft, TaskPriority } from "@/features/tasks/types";
import { cn } from "@/lib/utils";

type TaskFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  members: Array<{
    id: string;
    name: string;
  }>;
  categories: string[];
  initialValues?: {
    title: string;
    notes: string | null;
    dueDate: string | null;
    priority: TaskPriority | null;
    category: string | null;
    assigneeMemberId: string | null;
    recurrence: RecurrenceDraft | null;
  };
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

export function TaskForm({
  action,
  submitLabel,
  members,
  categories,
  initialValues,
}: TaskFormProps) {
  const [isRecurring, setIsRecurring] = useState(Boolean(initialValues?.recurrence));
  const [frequency, setFrequency] = useState<RecurrenceDraft["frequency"]>(
    initialValues?.recurrence?.frequency ?? "daily"
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialValues?.recurrence?.daysOfWeek ?? []
  );

  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
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
            defaultValue={initialValues?.dueDate ?? ""}
          />
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
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            list="task-categories"
            defaultValue={initialValues?.category ?? ""}
            placeholder="Home, school, errands"
          />
          <datalist id="task-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
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
            <div className="grid gap-4 md:grid-cols-[1fr_140px]">
              <div className="grid gap-2">
                <Label htmlFor="recurrenceFrequency">Frequency</Label>
                <select
                  id="recurrenceFrequency"
                  name="recurrenceFrequency"
                  className={selectClassName}
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
                  defaultValue={initialValues?.recurrence?.interval ?? 1}
                />
              </div>
            </div>

            {frequency === "weekly" ? (
              <div className="grid gap-2">
                <Label>Weekdays</Label>
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
                                ? [...current, option.value].sort()
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
              </div>
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
                  defaultValue={initialValues?.recurrence?.dayOfMonth ?? ""}
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
                defaultValue={initialValues?.recurrence?.endsOn ?? ""}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
