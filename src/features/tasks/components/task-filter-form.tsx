import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaskFilterState } from "@/features/tasks/lib/filters";

type TaskFilterFormProps<V extends string> = {
  canClear?: boolean;
  clearHref: string;
  filters: TaskFilterState<V>;
  members: Array<{
    id: string;
    name: string;
  }>;
  pathname: string;
  projects: string[];
  tags: string[];
  viewOptions?: Array<{
    label: string;
    value: V;
  }>;
};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function TaskFilterForm<V extends string>({
  canClear,
  clearHref,
  filters,
  members,
  pathname,
  projects,
  tags,
  viewOptions,
}: TaskFilterFormProps<V>) {
  return (
    <form action={pathname} className="grid gap-4 rounded-2xl border bg-muted/20 p-4">
      {viewOptions ? (
        <div className="grid gap-2 md:max-w-xs">
          <Label htmlFor={`${pathname}-view`}>View</Label>
          <select
            id={`${pathname}-view`}
            name="view"
            className={selectClassName}
            defaultValue={filters.view}
          >
            {viewOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="view" value={filters.view} />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="grid gap-2 xl:col-span-2">
          <Label htmlFor={`${pathname}-q`}>Search</Label>
          <Input
            id={`${pathname}-q`}
            name="q"
            defaultValue={filters.q}
            placeholder="Search title, notes, project, tags"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${pathname}-project`}>Project</Label>
          <select
            id={`${pathname}-project`}
            name="project"
            className={selectClassName}
            defaultValue={filters.project}
          >
            <option value="">All projects</option>
            {projects.map((projectName) => (
              <option key={projectName} value={projectName}>
                {projectName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${pathname}-tag`}>Tag</Label>
          <select
            id={`${pathname}-tag`}
            name="tag"
            className={selectClassName}
            defaultValue={filters.tag}
          >
            <option value="">All tags</option>
            {tags.map((tagName) => (
              <option key={tagName} value={tagName}>
                {tagName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`${pathname}-priority`}>Priority</Label>
          <select
            id={`${pathname}-priority`}
            name="priority"
            className={selectClassName}
            defaultValue={filters.priority}
          >
            <option value="">Any priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="grid gap-2 md:max-w-xs">
          <Label htmlFor={`${pathname}-assignee`}>Assignee</Label>
          <select
            id={`${pathname}-assignee`}
            name="assignee"
            className={selectClassName}
            defaultValue={filters.assignee}
          >
            <option value="">Anyone</option>
            <option value="mine">Mine</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Button type="submit">Apply filters</Button>
          {canClear === false ? null : (
            <Button asChild variant="outline">
              <Link href={clearHref}>Clear</Link>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
