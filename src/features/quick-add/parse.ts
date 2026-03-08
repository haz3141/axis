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

  if (/\b(high priority|urgent)\b/.test(normalizedText) || normalizedText.includes("!!")) {
    return "high" as TaskPriority;
  }

  if (/\b(low priority)\b/.test(normalizedText)) {
    return "low" as TaskPriority;
  }

  if (/\b(medium priority)\b/.test(normalizedText)) {
    return "medium" as TaskPriority;
  }

  return null;
}

function extractRecurrence(text: string) {
  for (const candidate of recurrencePatterns) {
    const match = text.match(candidate.pattern);

    if (match) {
      return {
        match: match[0],
        recurrence: candidate.recurrence(),
      };
    }
  }

  const weekdays = weekdayLookup
    .map((weekday, index) => (new RegExp(`every\\s+${weekday}`, "i").test(text) ? index : null))
    .filter((value): value is number => value !== null);

  if (weekdays.length) {
    return {
      match: "weekly",
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
      match: monthlyMatch[0],
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
  const normalizedText = text.toLowerCase();

  if (/\b(for me|@me|my task)\b/i.test(text)) {
    return {
      assigneeMemberId: null,
      assigneeLabel: "Mine",
      ambiguity: null,
    };
  }

  const matches = context.members.filter((member) => {
    const memberName = member.name.toLowerCase();
    return (
      normalizedText.includes(`@${memberName}`) ||
      normalizedText.includes(`for ${memberName}`)
    );
  });

  if (matches.length > 1) {
    return {
      assigneeMemberId: null,
      assigneeLabel: null,
      ambiguity: "Multiple household members matched this assignee.",
    };
  }

  if (matches.length === 1) {
    return {
      assigneeMemberId: matches[0].id,
      assigneeLabel: matches[0].name,
      ambiguity: null,
    };
  }

  if (/\bfor\s+[a-z]/i.test(text) || /@[a-z]/i.test(text)) {
    return {
      assigneeMemberId: null,
      assigneeLabel: null,
      ambiguity: "Assignee was mentioned but did not match the household roster.",
    };
  }

  return {
    assigneeMemberId: null,
    assigneeLabel: null,
    ambiguity: null,
  };
}

function extractCategory(text: string, context: QuickAddContext) {
  const hashtagMatch = text.match(/#([a-z0-9-_]+)/i);

  if (hashtagMatch) {
    return {
      category: hashtagMatch[1].replace(/-/g, " "),
      ambiguity: null,
    };
  }

  const normalizedText = text.toLowerCase();
  const matchedCategory = context.categories.find((category) =>
    normalizedText.includes(`in ${category.toLowerCase()}`)
  );

  if (matchedCategory) {
    return {
      category: matchedCategory,
      ambiguity: null,
    };
  }

  if (/\bin\s+[a-z]/i.test(text)) {
    return {
      category: null,
      ambiguity: "Category was mentioned but did not match an existing label.",
    };
  }

  return {
    category: null,
    ambiguity: null,
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
    const priority = extractPriority(item);

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
      recurrenceMatch?.match,
      assigneeMatch.assigneeLabel ? `for ${assigneeMatch.assigneeLabel}` : null,
      categoryMatch.category ? `#${categoryMatch.category}` : null,
      priority ? `${priority} priority` : null,
    ]).replace(/^[:,\-]+|[:,\-]+$/g, "");

    return {
      sourceText: item,
      title: cleanedTitle || item,
      dueDate,
      priority,
      category: categoryMatch.category,
      assigneeMemberId: assigneeMatch.assigneeMemberId,
      assigneeLabel: assigneeMatch.assigneeLabel,
      recurrence: recurrenceMatch?.recurrence ?? null,
      ambiguities,
    } satisfies QuickAddDraft;
  });
}
