import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTaskConfirmHref,
  buildTaskNoticeHref,
  clearTaskFormErrorHref,
  clearTaskConfirmHref,
  clearTaskNoticeHref,
  readTaskConfirm,
  readTaskNotice,
  taskNoticeCopy,
} from "@/features/tasks/lib/notices";

test("task notice helpers append and clear notice params", () => {
  const href = buildTaskNoticeHref("/tasks?view=completed", "task-completed", "undo-1");

  assert.equal(href, "/tasks?view=completed&notice=task-completed&undo=undo-1");
  assert.equal(clearTaskNoticeHref(href), "/tasks?view=completed");
});

test("task notice helpers clear stale confirm state", () => {
  assert.equal(
    buildTaskNoticeHref("/tasks/abc?view=inbox&confirm=delete", "task-saved"),
    "/tasks/abc?view=inbox&notice=task-saved"
  );
});

test("task confirm helpers preserve existing search params", () => {
  const href = buildTaskConfirmHref("/tasks/abc?view=inbox", "delete");

  assert.equal(href, "/tasks/abc?view=inbox&confirm=delete");
  assert.equal(clearTaskConfirmHref(href), "/tasks/abc?view=inbox");
});

test("task confirm helpers clear stale notice state", () => {
  assert.equal(
    buildTaskConfirmHref("/tasks/abc?notice=task-completed&undo=undo-1", "archive"),
    "/tasks/abc?confirm=archive"
  );
});

test("task form error helper removes stale error state", () => {
  assert.equal(
    clearTaskFormErrorHref("/tasks/abc?view=inbox&error=recurrence-anchor-required"),
    "/tasks/abc?view=inbox"
  );
});

test("task notice readers ignore invalid values", () => {
  assert.equal(readTaskNotice({}), null);
  assert.equal(readTaskNotice({ notice: "bogus" }), null);
  assert.deepStrictEqual(readTaskNotice({ notice: "task-deleted", undo: "undo-2" }), {
    notice: "task-deleted",
    undoId: "undo-2",
  });
});

test("task confirm reader and copy return stable values", () => {
  assert.equal(readTaskConfirm({ confirm: "archive" }), "archive");
  assert.equal(readTaskConfirm({ confirm: "delete" }), "delete");
  assert.equal(readTaskConfirm({ confirm: "other" }), null);
  assert.equal(taskNoticeCopy("task-undo-applied"), "Last change undone.");
  assert.equal(taskNoticeCopy("task-occurrence-completed"), "Occurrence completed.");
});
