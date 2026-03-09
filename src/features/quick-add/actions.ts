"use server";

import { decideQuickCaptureInput, quickAddReviewPath } from "@/features/quick-add/capture";
import { revalidateAppPaths } from "@/lib/revalidate";
import { getQuickAddReferenceData, saveTaskInput } from "@/features/tasks/data";

export async function submitGlobalQuickAddAction(rawInput: string) {
  const { members, tags } = await getQuickAddReferenceData();
  const decision = decideQuickCaptureInput(rawInput, {
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
    })),
    tags,
  });

  if (decision.kind === "empty") {
    return {
      kind: "noop" as const,
    };
  }

  if (decision.kind === "handoff") {
    return {
      kind: "handoff" as const,
      href: quickAddReviewPath(decision.input),
    };
  }

  const taskId = await saveTaskInput({
    title: decision.draft.title,
    notes: null,
    dueDate: decision.draft.dueDate,
    priority: decision.draft.priority,
    projectName: decision.draft.projectName,
    tagNames: decision.draft.tagNames,
    assigneeMemberId: decision.draft.assigneeMemberId,
    recurrence: decision.draft.recurrence,
  });

  revalidateAppPaths(taskId);

  return {
    kind: "created" as const,
    taskId,
  };
}
