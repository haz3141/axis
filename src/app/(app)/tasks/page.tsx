import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeTaskAction,
  createTaskAction,
  reopenTaskAction,
  restoreTaskAction,
} from "@/features/tasks/actions";
import { TaskActionNotice } from "@/features/tasks/components/task-action-notice";
import { TaskFilterForm } from "@/features/tasks/components/task-filter-form";
import { TaskForm } from "@/features/tasks/components/task-form";
import { PriorityBadge } from "@/features/tasks/components/priority-badge";
import { TaskTaxonomyBadges } from "@/features/tasks/components/task-taxonomy-badges";
import { getTasksPageData } from "@/features/tasks/data";
import { formatShortDate } from "@/features/tasks/lib/dates";
import {
  buildFilterHref,
  filterDisplayTasks,
  readTaskFilterState,
} from "@/features/tasks/lib/filters";
import { parseTaskFormErrorCode } from "@/features/tasks/lib/form";
import {
  normalizeTaskListView,
  selectArchivedTasks,
  selectCompletedTasks,
  selectInboxTasks,
} from "@/features/tasks/lib/focus";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams: Promise<{
    view?: string;
    q?: string;
    project?: string;
    tag?: string;
    priority?: string;
    assignee?: string;
    notice?: string;
    undo?: string;
    error?: string;
  }>;
};

const viewCopy = {
  inbox: {
    title: "Inbox",
    description: "Unscheduled active tasks that still need a plan.",
  },
  completed: {
    title: "Completed",
    description: "Closed one-time tasks you may want to review or reopen.",
  },
  archived: {
    title: "Archived",
    description: "Retired tasks and recurring routines kept out of the active loop.",
  },
} as const;

function hasActiveFilters(filters: {
  q: string;
  project: string;
  tag: string;
  priority: string;
  assignee: string;
}) {
  return Boolean(
    filters.q || filters.project || filters.tag || filters.priority || filters.assignee
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const { members, projects, tags, tasks } = await getTasksPageData();
  const filters = readTaskFilterState(params, normalizeTaskListView);
  const formErrorCode = parseTaskFormErrorCode(params.error);
  const view = filters.view;
  const filteredInboxTasks = filterDisplayTasks(selectInboxTasks(tasks), filters);
  const filteredCompletedTasks = filterDisplayTasks(selectCompletedTasks(tasks), filters);
  const filteredArchivedTasks = filterDisplayTasks(selectArchivedTasks(tasks), filters);
  const filtersApplied = hasActiveFilters(filters);
  const clearHref = buildFilterHref("/tasks", {
    ...filters,
    q: "",
    project: "",
    tag: "",
    priority: "",
    assignee: "",
  });

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname="/tasks" searchParams={params} />

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Focus workspace</p>
            <h2 className="text-3xl font-semibold tracking-tight">{viewCopy[view].title}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{viewCopy[view].description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/quick-add">Batch quick add</Link>
            </Button>
            <Button asChild>
              <Link href="/upcoming">Open upcoming</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["inbox", "Inbox", filteredInboxTasks.length],
            ["completed", "Completed", filteredCompletedTasks.length],
            ["archived", "Archived", filteredArchivedTasks.length],
          ].map(([value, label, count]) => (
            <Button
              key={value}
              asChild
              variant={view === value ? "default" : "outline"}
              size="sm"
            >
              <Link href={buildFilterHref("/tasks", { ...filters, view: value as typeof view })}>
                {label}
                <Badge variant={view === value ? "secondary" : "outline"}>{count}</Badge>
              </Link>
            </Button>
          ))}
        </div>

        <TaskFilterForm
          clearHref={clearHref}
          filters={filters}
          members={members}
          pathname="/tasks"
          projects={projects}
          tags={tags}
        />
      </section>

      {view === "inbox" ? (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Unscheduled active tasks</CardTitle>
              <CardDescription>
                Capture first, then schedule what belongs in Today or Upcoming.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {filteredInboxTasks.length ? (
                filteredInboxTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                          {task.title}
                        </Link>
                        <PriorityBadge priority={task.priority} />
                        <TaskTaxonomyBadges
                          projectName={task.projectName}
                          tagNames={task.tagNames}
                        />
                        {task.assigneeName ? (
                          <Badge variant="secondary">{task.assigneeName}</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.notes ? task.notes : "No schedule yet. Add a date when you know where it belongs."}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild variant="outline">
                        <Link href={`/tasks/${task.id}#edit-task`}>Edit</Link>
                      </Button>
                      <form action={completeTaskAction.bind(null, task.id, buildFilterHref("/tasks", filters))}>
                        <Button type="submit">Complete</Button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6">
                  <p className="text-sm text-muted-foreground">
                    {filtersApplied
                      ? "No inbox tasks match the current filters."
                      : "Inbox is clear. Use q to capture quickly or add a task manually."}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Button asChild variant="outline">
                      <Link href="/quick-add">Batch quick add</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/upcoming">Review upcoming</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual task entry</CardTitle>
              <CardDescription>
                Use the full form when you already know the schedule, assignee, project, tags, or recurrence rule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskForm
                action={createTaskAction}
                submitLabel="Create task"
                members={members}
                projects={projects}
                tags={tags}
                returnTo={buildFilterHref("/tasks", filters)}
                formErrorCode={formErrorCode}
              />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {view === "completed" ? (
        <Card>
          <CardHeader>
            <CardTitle>Completed tasks</CardTitle>
            <CardDescription>Recently closed one-time tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {filteredCompletedTasks.length ? (
              filteredCompletedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                        {task.title}
                      </Link>
                      <PriorityBadge priority={task.priority} />
                      <TaskTaxonomyBadges
                        projectName={task.projectName}
                        tagNames={task.tagNames}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.completedAt
                        ? `Completed ${formatShortDate(task.completedAt.slice(0, 10))}`
                        : "Completed"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/tasks/${task.id}#edit-task`}>Edit</Link>
                    </Button>
                    <form
                      action={reopenTaskAction.bind(
                        null,
                        task.id,
                        buildFilterHref("/tasks", { ...filters, view: "completed" })
                      )}
                    >
                      <Button type="submit" variant="outline">
                        Reopen
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6">
                <p className="text-sm text-muted-foreground">
                  {filtersApplied
                    ? "No completed tasks match the current filters."
                    : "Nothing is completed yet. Today and Inbox will surface work that is still active."}
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link href="/tasks">Back to inbox</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {view === "archived" ? (
        <Card>
          <CardHeader>
            <CardTitle>Archived tasks</CardTitle>
            <CardDescription>Retired work kept for context, not for daily focus.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {filteredArchivedTasks.length ? (
              filteredArchivedTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                      {task.title}
                    </Link>
                    <PriorityBadge priority={task.priority} />
                    <TaskTaxonomyBadges
                      projectName={task.projectName}
                      tagNames={task.tagNames}
                    />
                    {task.recurrenceSummary ? (
                      <Badge variant="outline">{task.recurrenceSummary}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.nextDue ? `Last projected for ${formatShortDate(task.nextDue)}` : "Archived task"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/tasks/${task.id}#edit-task`}>Edit task</Link>
                    </Button>
                    <form
                      action={restoreTaskAction.bind(
                        null,
                        task.id,
                        buildFilterHref("/tasks", { ...filters, view: "archived" })
                      )}
                    >
                      <Button type="submit" size="sm">
                        Restore
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6">
                <p className="text-sm text-muted-foreground">
                  {filtersApplied ? "No archived tasks match the current filters." : "No archived tasks yet."}
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link href="/tasks">Back to inbox</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
