import * as chrono from "chrono-node";
import { formatDateKey } from "@/features/tasks/lib/dates";
import type { QuickAddDraft, RecurrenceDraft, TaskPriority } from "@/features/tasks/types";

export type QuickAddContext = {
  members: Array<{
    id: string;
    name: string;
  }>;
  categories: string[];
};

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

  const weekdayMatches = weekdayLookup.flatMap((weekday, index) => {
    const matches = text.match(new RegExp(`\\bevery\\s+${weekday}\\b`, "ig")) ?? [];
    return matches.length
      ? [
          {
            day: index,
            fragments: matches,
          },
        ]
      : [];
  });
  const weekdays = weekdayMatches.map((match) => match.day);

  if (weekdays.length) {
    return {
      fragments: weekdayMatches.flatMap((match) => match.fragments),
      recurrence: {
        frequency: "weekly" as const,
        interval: 1,
        daysOfWeek: weekdays,
        dayOfMonth: null,
        endsOn: null,
      },
    };
  }

  const monthlyMatch = text.match(/\b(monthly|every month(?: on the (\d{1,2})(?:st|nd|rd|th)?)?)\b/i);

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

function extractCategory(text: string, context: QuickAddContext) {
  const hashtagMatch = text.match(/#([a-z0-9-_]+)/i);

  if (hashtagMatch) {
    return {
      category: hashtagMatch[1].replace(/-/g, " "),
      ambiguity: null,
      fragments: [hashtagMatch[0]],
    };
  }

  const normalizedText = text.toLowerCase();
  const matchedCategory = context.categories.find((category) =>
    new RegExp(`\\bin\\s+${escapeRegex(category)}\\b`, "i").test(normalizedText)
  );

  if (matchedCategory) {
    const fragment =
      text.match(new RegExp(`\\bin\\s+${escapeRegex(matchedCategory)}\\b`, "i"))?.[0] ??
      null;

    return {
      category: matchedCategory,
      ambiguity: null,
      fragments: fragment ? [fragment] : [],
    };
  }

  if (/\bin\s+[a-z]/i.test(text)) {
    return {
      category: null,
      ambiguity: "Category was mentioned but did not match an existing label.",
      fragments: [],
    };
  }

  return {
    category: null,
    ambiguity: null,
    fragments: [],
  };
}

function stripFragments(text: string, fragments: Array<string | null | undefined>) {
  return fragments.reduce<string>(
    (value, fragment) =>
      fragment
        ? value.replace(fragment, "").replace(/\s{2,}/g, " ").trim()
        : value,
    text
  );
}

export function parseQuickAddInput(input: string, context: QuickAddContext) {
  return splitIntoItems(input).map((item) => {
    const ambiguities: string[] = [];
    const parsedDate = chrono.casual.parse(item, new Date(), {
      forwardDate: true,
    })[0];
    const dueDate = parsedDate?.start ? formatDateKey(parsedDate.start.date()) : null;
    const recurrenceMatch = extractRecurrence(item);
    const assigneeMatch = extractAssignee(item, context);
    const categoryMatch = extractCategory(item, context);
    const priorityMatch = extractPriority(item);

    if (assigneeMatch.ambiguity) {
      ambiguities.push(assigneeMatch.ambiguity);
    }

    if (categoryMatch.ambiguity) {
      ambiguities.push(categoryMatch.ambiguity);
    }

    if (recurrenceMatch?.recurrence && !dueDate) {
      ambiguities.push("Recurring phrases need a clear anchor date.");
    }

    const cleanedTitle = stripFragments(item, [
      parsedDate?.text ?? null,
      ...(recurrenceMatch?.fragments ?? []),
      ...assigneeMatch.fragments,
      ...categoryMatch.fragments,
      priorityMatch.fragment,
    ]).replace(/^[:,\-]+|[:,\-]+$/g, "");

    return {
      sourceText: item,
      title: cleanedTitle || item,
      dueDate,
      priority: priorityMatch.priority,
      category: categoryMatch.category,
      assigneeMemberId: assigneeMatch.assigneeMemberId,
      assigneeLabel: assigneeMatch.assigneeLabel,
      recurrence: recurrenceMatch?.recurrence ?? null,
      ambiguities,
    } satisfies QuickAddDraft;
  });
}
