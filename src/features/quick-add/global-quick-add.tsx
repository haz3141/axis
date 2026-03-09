"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitGlobalQuickAddAction } from "@/features/quick-add/actions";

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.getAttribute("role") === "textbox"
  );
}

export function GlobalQuickAddLauncher() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submitCapture = useCallback(() => {
    if (!input.trim() || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await submitGlobalQuickAddAction(input);

      if (result.kind === "handoff") {
        setOpen(false);
        setInput("");
        router.push(result.href);
        return;
      }

      if (result.kind === "created") {
        setOpen(false);
        setInput("");
        router.refresh();
      }
    });
  }, [input, isPending, router]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById("global-quick-add-input")?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === "q" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !open &&
        !isEditableElement(event.target)
      ) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && open) {
        event.preventDefault();
        submitCapture();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, submitCapture]);

  return (
    <>
      <div className="mt-4 hidden lg:block">
        <Button className="w-full justify-between" onClick={() => setOpen(true)}>
          <span className="inline-flex items-center gap-2">
            <SparklesIcon className="size-4" />
            Quick capture
          </span>
          <span className="rounded-full border px-2 py-0.5 text-xs">Q</span>
        </Button>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <Button className="w-full shadow-lg" size="lg" onClick={() => setOpen(true)}>
          <SparklesIcon className="size-4" />
          Capture task
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick capture</DialogTitle>
            <DialogDescription>
              One clear line creates immediately. Multiline or ambiguous input opens full quick add for review.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitCapture();
            }}
            className="grid gap-4"
          >
            <Textarea
              id="global-quick-add-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={8}
              placeholder={"Pay rent March 14 2026\nLaundry every Monday and Wednesday starting March 12 2026"}
            />

            <p className="text-sm text-muted-foreground">
              Use <span className="font-medium">Esc</span> to close and <span className="font-medium">Cmd/Ctrl+Enter</span> to submit.
            </p>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={!input.trim() || isPending}>
                {isPending ? "Capturing..." : "Capture"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
