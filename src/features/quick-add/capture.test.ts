import assert from "node:assert/strict";
import test from "node:test";
import {
  decideQuickCaptureInput,
  quickAddReviewPath,
  quickAddSuccessPath,
} from "@/features/quick-add/capture";

const context = {
  members: [{ id: "maya", name: "Maya" }],
  categories: ["work"],
};

test("decideQuickCaptureInput creates a single clear draft inline", () => {
  const decision = decideQuickCaptureInput(
    "Submit expense report March 15 2026 #work",
    context
  );

  assert.equal(decision.kind, "inline");

  if (decision.kind === "inline") {
    assert.equal(decision.draft.title, "Submit expense report");
    assert.equal(decision.draft.dueDate, "2026-03-15");
  }
});

test("decideQuickCaptureInput hands off multiline capture for review", () => {
  const decision = decideQuickCaptureInput(
    "Pay rent March 1 2026\nBuy groceries March 2 2026",
    context
  );

  assert.deepStrictEqual(decision, {
    kind: "handoff",
    drafts: decision.kind === "handoff" ? decision.drafts : [],
    input: "Pay rent March 1 2026\nBuy groceries March 2 2026",
    reason: "batch",
  });

  assert.equal(
    quickAddReviewPath("Pay rent March 1 2026\nBuy groceries March 2 2026"),
    "/quick-add?input=Pay%20rent%20March%201%202026%0ABuy%20groceries%20March%202%202026"
  );
});

test("decideQuickCaptureInput hands off ambiguous recurrence input", () => {
  const decision = decideQuickCaptureInput("Laundry every 3 days", context);

  assert.equal(decision.kind, "handoff");

  if (decision.kind === "handoff") {
    assert.equal(decision.reason, "ambiguous");
  }
});

test("quickAddSuccessPath routes scheduled drafts to upcoming", () => {
  assert.equal(
    quickAddSuccessPath([
      {
        sourceText: "Pay rent March 1 2026",
        title: "Pay rent",
        dueDate: "2026-03-01",
        priority: null,
        category: null,
        assigneeMemberId: null,
        assigneeLabel: null,
        recurrence: null,
        ambiguities: [],
      },
    ]),
    "/upcoming"
  );
});
