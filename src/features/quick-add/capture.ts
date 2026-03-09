import { parseQuickAddInput, type QuickAddContext } from "@/features/quick-add/parse";
import type { QuickAddDraft } from "@/features/tasks/types";

export type QuickCaptureDecision =
  | {
      kind: "empty";
    }
  | {
      kind: "inline";
      draft: QuickAddDraft;
    }
  | {
      kind: "handoff";
      drafts: QuickAddDraft[];
      input: string;
      reason: "batch" | "ambiguous" | "review";
    };

function isBatchCaptureInput(input: string) {
  return /[\r\n]/.test(input) || input.includes(";");
}

export function decideQuickCaptureInput(
  rawInput: string,
  context: QuickAddContext
): QuickCaptureDecision {
  const input = rawInput.trim();

  if (!input) {
    return {
      kind: "empty",
    };
  }

  const drafts = parseQuickAddInput(input, context);

  if (drafts.length !== 1 || isBatchCaptureInput(input)) {
    return {
      kind: "handoff",
      drafts,
      input,
      reason: drafts.length > 1 || isBatchCaptureInput(input) ? "batch" : "review",
    };
  }

  const [draft] = drafts;

  if (!draft || draft.ambiguities.length > 0) {
    return {
      kind: "handoff",
      drafts,
      input,
      reason: "ambiguous",
    };
  }

  return {
    kind: "inline",
    draft,
  };
}

export function quickAddReviewPath(input: string) {
  return `/quick-add?input=${encodeURIComponent(input)}`;
}

export function quickAddSuccessPath(drafts: QuickAddDraft[]) {
  return drafts.some((draft) => draft.dueDate || draft.recurrence) ? "/upcoming" : "/tasks";
}
