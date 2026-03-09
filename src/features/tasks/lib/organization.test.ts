import assert from "node:assert/strict";
import test from "node:test";
import {
  dedupeOrganizationNames,
  mergeLegacyCategoryIntoTags,
  parseTagNamesInput,
} from "@/features/tasks/lib/organization";

test("parseTagNamesInput splits, trims, and deduplicates tag names", () => {
  assert.deepStrictEqual(
    parseTagNamesInput("home, Errands; home\nSchool"),
    ["Errands", "home", "School"]
  );
});

test("mergeLegacyCategoryIntoTags keeps legacy category readable without duplicates", () => {
  assert.deepStrictEqual(mergeLegacyCategoryIntoTags(["Home", "Errands"], "home"), [
    "Errands",
    "Home",
  ]);
});

test("dedupeOrganizationNames ignores blanks", () => {
  assert.deepStrictEqual(dedupeOrganizationNames(["", "  ", "Family"]), ["Family"]);
});

test("dedupeOrganizationNames normalizes repeated internal whitespace", () => {
  assert.deepStrictEqual(
    dedupeOrganizationNames(["Home   Reset", "Home Reset", "  Home Reset  "]),
    ["Home Reset"]
  );
});
