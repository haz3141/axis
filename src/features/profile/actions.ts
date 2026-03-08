"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { householdMembers, profiles, tasks } from "@/lib/db/schema";
import { getOrCreateProfile } from "@/features/profile/data";
import { revalidateAppPaths } from "@/lib/revalidate";

function optionalText(value: FormDataEntryValue | null) {
  const trimmedValue = value?.toString().trim();
  return trimmedValue ? trimmedValue : null;
}

export async function saveProfileAction(formData: FormData) {
  const profile = await getOrCreateProfile();

  await db
    .update(profiles)
    .set({
      name: formData.get("name")?.toString().trim() || "You",
      householdName: formData.get("householdName")?.toString().trim() || "Home",
      astrologyDetails: optionalText(formData.get("astrologyDetails")),
      humanDesignDetails: optionalText(formData.get("humanDesignDetails")),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(profiles.id, profile.id));

  revalidateAppPaths();
}

export async function addHouseholdMemberAction(formData: FormData) {
  const profile = await getOrCreateProfile();
  const name = formData.get("name")?.toString().trim();

  if (!name) {
    return;
  }

  await db.insert(householdMembers).values({
    id: crypto.randomUUID(),
    profileId: profile.id,
    name,
    relationship: optionalText(formData.get("relationship")),
  });

  revalidateAppPaths();
}

export async function deleteHouseholdMemberAction(memberId: string) {
  await db.update(tasks).set({ assigneeMemberId: null }).where(eq(tasks.assigneeMemberId, memberId));
  await db.delete(householdMembers).where(eq(householdMembers.id, memberId));
  revalidateAppPaths();
}
