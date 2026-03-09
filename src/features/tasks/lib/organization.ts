export function normalizeOrganizationName(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

export const normalizeName = normalizeOrganizationName;

export function organizationLookupKey(value: string | null | undefined) {
  return normalizeOrganizationName(value).toLowerCase();
}

export const buildNameKey = organizationLookupKey;

export function dedupeOrganizationNames(values: Array<string | null | undefined>) {
  const uniqueValues = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = normalizeOrganizationName(value);

    if (!normalizedValue) {
      continue;
    }

    const lookupKey = organizationLookupKey(normalizedValue);

    if (!uniqueValues.has(lookupKey)) {
      uniqueValues.set(lookupKey, normalizedValue);
    }
  }

  return [...uniqueValues.values()].sort((left, right) => left.localeCompare(right));
}

export function parseTagNamesInput(rawValue: string | null | undefined) {
  return dedupeOrganizationNames((rawValue ?? "").split(/[,;\n]+/));
}

export const parseTagInput = parseTagNamesInput;

export function mergeLegacyCategoryIntoTags(
  tagNames: string[],
  legacyCategory: string | null | undefined
) {
  return dedupeOrganizationNames([...tagNames, legacyCategory]);
}

export const mergeTaskTagNames = mergeLegacyCategoryIntoTags;

export function includesOrganizationMatch(value: string | null | undefined, query: string) {
  const normalizedValue = normalizeOrganizationName(value).toLowerCase();
  const normalizedQuery = normalizeOrganizationName(query).toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return normalizedValue.includes(normalizedQuery);
}
