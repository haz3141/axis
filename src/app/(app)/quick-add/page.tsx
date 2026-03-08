import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuickAddTasksAction } from "@/features/tasks/actions";
import { getQuickAddReferenceData } from "@/features/tasks/data";
import { QuickAddWorkspace } from "@/features/quick-add/quick-add-workspace";

export const dynamic = "force-dynamic";

export default async function QuickAddPage() {
  const { categories, members } = await getQuickAddReferenceData();

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
            members={members.map((member) => ({ id: member.id, name: member.name }))}
            categories={categories}
            action={createQuickAddTasksAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
