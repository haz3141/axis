import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/features/tasks/types";

const priorityCopy: Record<Exclude<TaskPriority, null>, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityClasses: Record<Exclude<TaskPriority, null>, string> = {
  high: "border-rose-300 text-rose-700",
  medium: "border-amber-300 text-amber-700",
  low: "border-sky-300 text-sky-700",
};

export function PriorityBadge({ priority }: { priority: TaskPriority | null }) {
  if (!priority) {
    return null;
  }

  return (
    <Badge variant="outline" className={priorityClasses[priority]}>
      {priorityCopy[priority]}
    </Badge>
  );
}
