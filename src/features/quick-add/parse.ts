import * as chrono from "chrono-node";
import { formatDateKey } from "@/features/tasks/lib/dates";
import type { QuickAddDraft, RecurrenceDraft, TaskPriority } from "@/features/tasks/types";

export type QuickAddContext = {
  members: Array<{
    id: string;
    name: string;
  }>;
  tags: string[];
};

export const RECURRENCE_ANCHOR_MESSAGE =
  'Recurring phrases need a clear anchor date like "March 14 2026".';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const recurrencePatterns = [
  {
    pattern: /\b(daily|every day)\b/i,
    recurrence: (): RecurrenceDraft => ({
      frequency: "daily",
      interval: 1,
      daysOfWeek: [],
      dayOfMonth: null,
      endsOn: null,
    }),
  },
  {
    pattern: /\b(every other day)\b/i,
    recurrence: (): RecurrenceDraft => ({
      frequency: "daily",
      interval: 2,
      daysOfWeek: [],
      dayOfMonth: null,
      endsOn: null,
    }),
  },
  {
    pattern: /\b(every weekday)\b/i,
    recurrence: (): RecurrenceDraft => ({
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [1, 2, 3, 4, 5],
      dayOfMonth: null,
      endsOn: null,
    }),
  },
];

const weekdayLookup = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const weekdayPattern = weekdayLookup.join("|");

function splitIntoItems(input: string) {
  return input
    .split(/\n+/)
    .flatMap((line) => line.split(/\s*;\s*/))
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function extractPriority(text: string) {
  const normalizedText = text.toLowerCase();

  if (/\bhigh priority\b/.test(normalizedText)) {
    return {
      priority: "high" as TaskPriority,
      fragment: text.match(/\bhigh priority\b/i)?.[0] ?? null,
    };
  }

  if (/\burgent\b/.test(normalizedText)) {
    return {
      priority: "high" as TaskPriority,
      fragment: text.match(/\burgent\b/i)?.[0] ?? null,
    };
  }

  if (normalizedText.includes("!!")) {
    return {
      priority: "high" as TaskPriority,
      fragment: text.match(/!{2,}/)?.[0] ?? "!!",
    };
  }

  if (/\b(low priority)\b/.test(normalizedText)) {
    return {
      priority: "low" as TaskPriority,
      fragment: text.match(/\blow priority\b/i)?.[0] ?? null,
    };
  }

  if (/\b(medium priority)\b/.test(normalizedText)) {
    return {
      priority: "medium" as TaskPriority,
      fragment: text.match(/\bmedium priority\b/i)?.[0] ?? null,
    };
  }

  return {
    priority: null,
    fragment: null,
  };
}

function parseWeekdays(value: string) {
  const matches = value.toLowerCase().match(new RegExp(weekdayPattern, "g")) ?? [];
  return [...new Set(matches.map((match) => weekdayLookup.indexOf(match)))].sort(
    (left, right) => left - right
  );
}

function weeklyRecurrence(interval: number, daysOfWeek: number[]): RecurrenceDraft {
  return {
    frequency: "weekly",
    interval,
    daysOfWeek,
    dayOfMonth: null,
    endsOn: null,
  };
}

function extractRecurrence(text: string) {
  for (const candidate of recurrencePatterns) {
    const match = text.match(candidate.pattern);

    if (match) {
      return {
        fragments: [match[0]],
        recurrence: candidate.recurrence(),
      };
    }
  }

  const explicitDayIntervalMatch = text.match(/\b(every\s+(\d+)\s+days?)\b/i);

  if (explicitDayIntervalMatch) {
    return {
      fragments: [explicitDayIntervalMatch[1]],
      recurrence: {
        frequency: "daily" as const,
        interval: Number(explicitDayIntervalMatch[2]) || 1,
        daysOfWeek: [],
        dayOfMonth: null,
        endsOn: null,
      },
    };
  }

  const weeklyDaysMatch = text.match(
    new RegExp(
      `\\b(every(?:\\s+(\\d+))?\\s+(?:weeks?)?(?:\\s+on)?\\s+((?:${weekdayPattern})(?:\\s*(?:,\\s*|\\s+and\\s+)(?:${weekdayPattern})+)*))\\b`,
      "i"
    )
  );

  if (weeklyDaysMatch) {
    const daysOfWeek = parseWeekdays(weeklyDaysMatch[3]);
    const interval = Number(weeklyDaysMatch[2]) || 1;

    return {
      fragments: [weeklyDaysMatch[1]],
      recurrence: weeklyRecurrence(interval, daysOfWeek),
    };
  }

  const explicitWeekIntervalMatch = text.match(/\b(every\s+(\d+)\s+weeks?)\b/i);

  if (explicitWeekIntervalMatch) {
    return {
      fragments: [explicitWeekIntervalMatch[1]],
      recurrence: weeklyRecurrence(Number(explicitWeekIntervalMatch[2]) || 1, []),
    };
  }

  const explicitMonthIntervalMatch = text.match(
    /\b(every\s+(\d+)\s+months?(?:\s+on(?:\s+the)?\s+(\d{1,2})(?:st|nd|rd|th)?)?)\b/i
  );

  if (explicitMonthIntervalMatch) {
    return {
      fragments: [explicitMonthIntervalMatch[1]],
      recurrence: {
        frequency: "monthly" as const,
        interval: Number(explicitMonthIntervalMatch[2]) || 1,
        daysOfWeek: [],
        dayOfMonth: explicitMonthIntervalMatch[3]
          ? Number(explicitMonthIntervalMatch[3])
          : null,
        endsOn: null,
      },
    };
  }

  const monthlyMatch = text.match(
    /\b(monthly|every month(?:\s+on(?:\s+the)?\s+(\d{1,2})(?:st|nd|rd|th)?)?)\b/i
  );

  if (monthlyMatch) {
    return {
      fragments: [monthlyMatch[0]],
      recurrence: {
        frequency: "monthly" as const,
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: monthlyMatch[2] ? Number(monthlyMatch[2]) : null,
        endsOn: null,
      },
    };
  }

  return null;
}

function extractAssignee(text: string, context: QuickAddContext) {
  if (/\bfor me\b/i.test(text) || /@me\b/i.test(text) || /\bmy task\b/i.test(text)) {
    const fragments = [
      ...(text.match(/\bfor me\b/ig) ?? []),
      ...(text.match(/@me\b/ig) ?? []),
      ...(text.match(/\bmy task\b/ig) ?? []),
    ];

    return {
      assigneeMemberId: null,
      assigneeLabel: "Mine",
      ambiguity: null,
      fragments,
    };
  }

  const matches = context.members.flatMap((member) => {
    const memberNamePattern = escapeRegex(member.name);
    const fragments = [
      ...(text.match(new RegExp(`@${memberNamePattern}\\b`, "ig")) ?? []),
      ...(text.match(new RegExp(`\\bfor\\s+${memberNamePattern}\\b`, "ig")) ?? []),
    ];

    return fragments.length
      ? [
          {
            member,
            fragments,
          },
        ]
      : [];
  });

  if (matches.length > 1) {
    return {
      assigneeMemberId: null,
      assigneeLabel: null,
      ambiguity: "Multiple household members matched this assignee.",
      fragments: [],
    };
  }

  if (matches.length === 1) {
    return {
      assigneeMemberId: matches[0].member.id,
      assigneeLabel: matches[0].member.name,
      ambiguity: null,
      fragments: matches[0].fragments,
    };
  }

  if (/\bfor\s+[a-z]/i.test(text) || /@[a-z]/i.test(text)) {
    return {
      assigneeMemberId: null,
      assigneeLabel: null,
      ambiguity: "Assignee was mentioned but did not match the household roster.",
      fragments: [],
    };
  }

  return {
    assigneeMemberId: null,
    assigneeLabel: null,
    ambiguity: null,
    fragments: [],
  };
}

function extractTags(text: string, context: QuickAddContext) {
  const tagNames = new Map<string, string>();
  const fragments: string[] = [];

  for (const match of text.matchAll(/#([a-z0-9-_]+)/gi)) {
    const tagName = match[1]?.replace(/-/g, " ").trim();

    if (!tagName) {
      continue;
    }

    tagNames.set(tagName.toLowerCase(), tagName);
    fragments.push(match[0]);
  }

  const normalizedText = text.toLowerCase();
  const matchedTag = context.tags.find((tag) =>
    new RegExp(`\\bin\\s+${escapeRegex(tag)}\\b`, "i").test(normalizedText)
  );

  if (matchedTag) {
    const fragment = text.match(new RegExp(`\\bin\\s+${escapeRegex(matchedTag)}\\b`, "i"))?.[0];

    if (fragment) {
      fragments.push(fragment);
    }

    tagNames.set(matchedTag.toLowerCase(), matchedTag);
  }

  const hasTagMention = tagNames.size > 0;

  if (!hasTagMention && /\bin\s+[a-z]/i.test(text)) {
    return {
      tagNames: [],
      ambiguity: "Tag was mentioned but did not match an existing label.",
      fragments: [],
    };
  }

  return {
    tagNames: [...tagNames.values()],
    ambiguity: null,
    fragments,
  };
}

function stripFragments(text: string, fragments: Array<string | null | undefined>) {
  const normalizedFragments = [
    ...new Set(
      fragments
        .filter((fragment): fragment is string => Boolean(fragment?.trim()))
        .map((fragment) => fragment.trim())
    ),
  ].sort((left, right) => right.length - left.length);

  return normalizedFragments.reduce<string>(
    (value, fragment) =>
      fragment
        ? value.replace(fragment, " ").replace(/\s{2,}/g, " ").trim()
        : value,
    text
  );
}

function findAnchorDateText(text: string, recurrenceFragments: string[]) {
  const matches = chrono.casual.parse(text, new Date(), {
    forwardDate: true,
  });

  return (
    matches.find((candidate) => {
      const normalizedCandidate = candidate.text.toLowerCase();

      return !recurrenceFragments.some((fragment) =>
        fragment.toLowerCase().includes(normalizedCandidate)
      );
    }) ?? null
  );
}

export function parseQuickAddInput(input: string, context: QuickAddContext) {
  return splitIntoItems(input).map((item) => {
    const ambiguities: string[] = [];
    const recurrenceMatch = extractRecurrence(item);
    const parsedDate = findAnchorDateText(item, recurrenceMatch?.fragments ?? []);
    const dueDate = parsedDate?.start ? formatDateKey(parsedDate.start.date()) : null;
    const assigneeMatch = extractAssignee(item, context);
    const tagMatch = extractTags(item, context);
    const priorityMatch = extractPriority(item);

    if (assigneeMatch.ambiguity) {
      ambiguities.push(assigneeMatch.ambiguity);
    }

    if (tagMatch.ambiguity) {
      ambiguities.push(tagMatch.ambiguity);
    }

    if (recurrenceMatch?.recurrence && !dueDate) {
      ambiguities.push(RECURRENCE_ANCHOR_MESSAGE);
    }

    const cleanedTitle = stripFragments(item, [
      parsedDate?.text ?? null,
      ...(recurrenceMatch?.fragments ?? []),
      ...assigneeMatch.fragments,
      ...tagMatch.fragments,
      priorityMatch.fragment,
    ]).replace(/^[:,\-]+|[:,\-]+$/g, "");

    return {
      sourceText: item,
      title: cleanedTitle || item,
      dueDate,
      priority: priorityMatch.priority,
      projectName: null,
      tagNames: tagMatch.tagNames,
      assigneeMemberId: assigneeMatch.assigneeMemberId,
      assigneeLabel: assigneeMatch.assigneeLabel,
      recurrence: recurrenceMatch?.recurrence ?? null,
      ambiguities,
    } satisfies QuickAddDraft;
  });
}
