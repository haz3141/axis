import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuickAddTasksAction } from "@/features/tasks/actions";
import { getQuickAddReferenceData } from "@/features/tasks/data";
import { QuickAddWorkspace } from "@/features/quick-add/quick-add-workspace";

export const dynamic = "force-dynamic";

type QuickAddPageProps = {
  searchParams: Promise<{
    input?: string;
  }>;
};

export default async function QuickAddPage({ searchParams }: QuickAddPageProps) {
  const params = await searchParams;
  const { members, tags } = await getQuickAddReferenceData();
  const initialInput = params.input?.toString() ?? "";

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Natural-language quick add</CardTitle>
          <CardDescription>
            Parse multiple task lines into structured drafts, then confirm before creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickAddWorkspace
            key={initialInput}
            members={members.map((member) => ({ id: member.id, name: member.name }))}
            tags={tags}
            action={createQuickAddTasksAction}
            initialInput={initialInput}
          />
        </CardContent>
      </Card>
    </div>
  );
}
