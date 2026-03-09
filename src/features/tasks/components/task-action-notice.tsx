import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { undoTaskAction } from "@/features/tasks/actions";
import {
  clearTaskNoticeHref,
  pathFromSearchParams,
  readTaskNotice,
  taskNoticeCopy,
  type TaskSearchParamValue,
} from "@/features/tasks/lib/notices";

type TaskActionNoticeProps = {
  pathname: string;
  searchParams: Record<string, TaskSearchParamValue>;
};

export function TaskActionNotice({
  pathname,
  searchParams,
}: TaskActionNoticeProps) {
  const notice = readTaskNotice(searchParams);

  if (!notice) {
    return null;
  }

  const currentPath = pathFromSearchParams(pathname, searchParams);
  const dismissHref = clearTaskNoticeHref(currentPath);

  return (
    <Card className="border-emerald-300 bg-emerald-50/60" role="status" aria-live="polite">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-emerald-900">{taskNoticeCopy(notice.notice)}</p>

        <div className="flex gap-2">
          {notice.undoId ? (
            <form action={undoTaskAction.bind(null, notice.undoId, dismissHref)}>
              <Button type="submit" size="sm">
                Undo
              </Button>
            </form>
          ) : null}

          <Button asChild variant="outline" size="sm">
            <Link href={dismissHref}>Dismiss</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
