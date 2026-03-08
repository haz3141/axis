import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { householdMembers, profiles } from "@/lib/db/schema";

const defaultProfileId = "default-profile";

export async function getOrCreateProfile() {
  const existingProfile = await db.query.profiles.findFirst();

  if (existingProfile) {
    return existingProfile;
  }

  const [createdProfile] = await db
    .insert(profiles)
    .values({
      id: defaultProfileId,
      name: "You",
      householdName: "Home",
    })
    .returning();

  return createdProfile;
}

export async function getHouseholdMembers() {
  const profile = await getOrCreateProfile();

  return db.query.householdMembers.findMany({
    where: eq(householdMembers.profileId, profile.id),
    orderBy: (_, { asc }) => [asc(householdMembers.name)],
  });
}

export async function getProfilePageData() {
  const [profile, members] = await Promise.all([
    getOrCreateProfile(),
    getHouseholdMembers(),
  ]);

  return {
    profile,
    members,
  };
}
