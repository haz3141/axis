import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { householdMembers, profiles } from "@/lib/db/schema";

const defaultProfileId = "default-profile";
const defaultProfile = {
  id: defaultProfileId,
  name: "You",
  householdName: "Home",
  astrologyDetails: null,
  humanDesignDetails: null,
  createdAt: "",
  updatedAt: "",
} as const;

export async function getProfile() {
  return db.query.profiles.findFirst();
}

export async function ensureProfile() {
  const existingProfile = await getProfile();

  if (existingProfile) {
    return existingProfile;
  }

  await db
    .insert(profiles)
    .values({
      id: defaultProfileId,
      name: "You",
      householdName: "Home",
    })
    .onConflictDoNothing({
      target: profiles.id,
    });

  return (await getProfile()) ?? defaultProfile;
}

export async function getHouseholdMembers() {
  const profile = await getProfile();

  if (!profile) {
    return [];
  }

  return db.query.householdMembers.findMany({
    where: eq(householdMembers.profileId, profile.id),
    orderBy: (_, { asc }) => [asc(householdMembers.name)],
  });
}

export async function getProfilePageData() {
  const [profile, members] = await Promise.all([
    getProfile(),
    getHouseholdMembers(),
  ]);

  return {
    profile: profile ?? defaultProfile,
    members,
  };
}
