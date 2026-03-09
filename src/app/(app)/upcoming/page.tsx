import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskActionNotice } from "@/features/tasks/components/task-action-notice";
import { TaskFilterForm } from "@/features/tasks/components/task-filter-form";
import { PriorityBadge } from "@/features/tasks/components/priority-badge";
import { TaskTaxonomyBadges } from "@/features/tasks/components/task-taxonomy-badges";
import { getUpcomingData } from "@/features/tasks/data";
import { formatLongDate, formatShortDate } from "@/features/tasks/lib/dates";
import {
  buildFilterHref,
  filterAgendaItems,
  normalizeUpcomingView,
  readTaskFilterState,
} from "@/features/tasks/lib/filters";

export const dynamic = "force-dynamic";

type UpcomingPageProps = {
  searchParams: Promise<{
    view?: string;
    q?: string;
    project?: string;
    tag?: string;
    priority?: string;
    assignee?: string;
    notice?: string;
    undo?: string;
  }>;
};

const viewCopy = {
  all: {
    title: "Upcoming",
    description: "Future-dated one-time tasks and projected recurring work through the current planning window.",
  },
  "one-time": {
    title: "Upcoming one-time work",
    description: "Future one-off tasks that need planning without recurring routines mixed in.",
  },
  recurring: {
    title: "Upcoming recurring work",
    description: "Projected recurring routines that are coming next.",
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

export default async function UpcomingPage({ searchParams }: UpcomingPageProps) {
  const resolvedSearchParams = await searchParams;
  const upcoming = await getUpcomingData();
  const filters = readTaskFilterState(resolvedSearchParams, normalizeUpcomingView);
  const filteredItems = filterAgendaItems(upcoming.items, filters);
  const filtersApplied = hasActiveFilters(filters);
  const filteredOneTimeCount = filteredItems.filter((item) => !item.isRecurring).length;
  const filteredRecurringCount = filteredItems.filter((item) => item.isRecurring).length;
  const clearHref = buildFilterHref("/upcoming", {
    ...filters,
    q: "",
    project: "",
    tag: "",
    priority: "",
    assignee: "",
  });

  return (
    <div className="grid gap-6">
      <TaskActionNotice pathname="/upcoming" searchParams={resolvedSearchParams} />

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Focus workspace</p>
            <h2 className="text-3xl font-semibold tracking-tight">{viewCopy[filters.view].title}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {viewCopy[filters.view].description} Through {formatLongDate(upcoming.projectionEnd)}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/tasks">Open inbox</Link>
            </Button>
            <Button asChild>
              <Link href="/calendar">Open calendar</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All", filteredItems.length],
            ["one-time", "One-time", filteredOneTimeCount],
            ["recurring", "Recurring", filteredRecurringCount],
          ].map(([value, label, count]) => (
            <Button
              key={value}
              asChild
              variant={filters.view === value ? "default" : "outline"}
              size="sm"
            >
              <Link
                href={buildFilterHref("/upcoming", {
                  ...filters,
                  view: value as typeof filters.view,
                })}
              >
                {label}
                <Badge variant={filters.view === value ? "secondary" : "outline"}>{count}</Badge>
              </Link>
            </Button>
          ))}
        </div>

        <TaskFilterForm
          clearHref={clearHref}
          filters={filters}
          members={upcoming.members}
          pathname="/upcoming"
          projects={upcoming.projects}
          tags={upcoming.tags}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="gap-4">
            <CardHeader className="gap-1">
              <CardDescription>Future one-time tasks</CardDescription>
              <CardTitle className="text-3xl">{filteredOneTimeCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="gap-4">
            <CardHeader className="gap-1">
              <CardDescription>Recurring occurrences</CardDescription>
              <CardTitle className="text-3xl">{filteredRecurringCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Future-dated work</CardTitle>
          <CardDescription>
            Review what is coming next without mixing it into Today.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <div
                key={item.key}
                className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/tasks/${item.taskId}`} className="font-medium hover:underline">
                      {item.title}
                    </Link>
                    <PriorityBadge priority={item.priority} />
                    <TaskTaxonomyBadges
                      projectName={item.projectName}
                      tagNames={item.tagNames}
                    />
                    {item.isRecurring ? <Badge variant="outline">Recurring</Badge> : null}
                    {item.assigneeName ? <Badge variant="secondary">{item.assigneeName}</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.recurrenceSummary ?? "One-time task"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline">{formatShortDate(item.scheduledFor)}</Badge>
                  <Button asChild variant="outline">
                    <Link href={`/tasks/${item.taskId}#edit-task`}>
                      Edit
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-6">
              <p className="text-sm text-muted-foreground">
                {filtersApplied
                  ? "No upcoming work matches the current filters."
                  : "Nothing is queued in the next 30 days. Capture something new or plan from the inbox."}
              </p>
              <div className="mt-4 flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/tasks">Open inbox</Link>
                </Button>
                <Button asChild>
                  <Link href="/quick-add">Batch quick add</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
