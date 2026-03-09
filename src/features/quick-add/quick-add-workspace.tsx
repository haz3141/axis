"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { describeRecurrence } from "@/features/tasks/lib/recurrence";
import { Textarea } from "@/components/ui/textarea";
import { parseQuickAddInput, type QuickAddContext } from "@/features/quick-add/parse";
import type { QuickAddDraft } from "@/features/tasks/types";

type QuickAddWorkspaceProps = QuickAddContext & {
  action: (formData: FormData) => void | Promise<void>;
  initialInput?: string;
};

export function QuickAddWorkspace({
  members,
  tags,
  action,
  initialInput = "",
}: QuickAddWorkspaceProps) {
  const [input, setInput] = useState(initialInput);
  const [drafts, setDrafts] = useState<QuickAddDraft[]>(() =>
    initialInput.trim() ? parseQuickAddInput(initialInput, { members, tags }) : []
  );
  const [parsed, setParsed] = useState(Boolean(initialInput.trim()));
  const hasAmbiguities = drafts.some((draft) => draft.ambiguities.length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Paste or type multiple tasks</CardTitle>
          <CardDescription>
            Separate items by new lines, bullets, or semicolons. Use phrases like
            &quot;tomorrow&quot;, &quot;every weekday&quot;, &quot;for Maya&quot;, or
            &quot;#home&quot; when they are obvious.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setParsed(false);
              setDrafts([]);
            }}
            rows={16}
            placeholder={"Pay rent tomorrow\nLaundry every Sunday for Maya\n#errands buy groceries Friday"}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Review before create. Ambiguous fields stay blank instead of being invented.
            </p>
            <Button
              type="button"
              onClick={() => {
                setDrafts(parseQuickAddInput(input, { members, tags }));
                setParsed(true);
              }}
              disabled={!input.trim()}
            >
              Parse input
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Parser rules</CardTitle>
            <CardDescription>
              Deterministic MVP parsing only. No model-backed guessing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Dates are captured when chrono can resolve them clearly.</p>
            <p>Recurrence supports every N days, weeks, months, and multi-weekday phrases.</p>
            <p>Recurring drafts still need a clear anchor date before they can be created.</p>
            <p>Assignees only resolve against the household roster.</p>
            <p>Tags resolve from hashtags or known labels.</p>
          </CardContent>
        </Card>

        {parsed ? (
          drafts.length ? (
            <form action={action} className="grid gap-4">
              <input type="hidden" name="drafts" value={JSON.stringify(drafts)} />
              <div className="grid gap-3">
                {drafts.map((draft, index) => (
                  <Card key={`${draft.sourceText}-${index}`}>
                    <CardHeader className="gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{draft.title}</Badge>
                        {draft.dueDate ? <Badge variant="outline">{draft.dueDate}</Badge> : null}
                        {draft.recurrence ? (
                          <Badge variant="outline">
                            {describeRecurrence(draft.recurrence, draft.dueDate)}
                          </Badge>
                        ) : null}
                        {draft.assigneeLabel ? (
                          <Badge variant="outline">{draft.assigneeLabel}</Badge>
                        ) : null}
                        {draft.tagNames.map((tagName) => (
                          <Badge key={tagName} variant="outline">
                            #{tagName}
                          </Badge>
                        ))}
                        {draft.priority ? (
                          <Badge variant="outline">{draft.priority} priority</Badge>
                        ) : null}
                      </div>
                      <CardDescription>{draft.sourceText}</CardDescription>
                    </CardHeader>
                    {draft.ambiguities.length ? (
                      <CardContent className="grid gap-2">
                        {draft.ambiguities.map((ambiguity) => (
                          <p key={ambiguity} className="text-sm text-amber-700">
                            {ambiguity}
                          </p>
                        ))}
                      </CardContent>
                    ) : null}
                  </Card>
                ))}
              </div>

              {hasAmbiguities ? (
                <p className="text-sm text-amber-700">
                  Resolve the highlighted drafts in the source text, then parse again before creating tasks.
                </p>
              ) : null}

              <Button type="submit" disabled={hasAmbiguities}>
                Create {drafts.length} draft task{drafts.length === 1 ? "" : "s"}
              </Button>
            </form>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No tasks found</CardTitle>
                <CardDescription>
                  The parser did not find clear task lines. Adjust the wording and parse again.
                </CardDescription>
              </CardHeader>
            </Card>
          )
        ) : null}
      </div>
    </div>
  );
}
