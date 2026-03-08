import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addHouseholdMemberAction,
  deleteHouseholdMemberAction,
  saveProfileAction,
} from "@/features/profile/actions";
import { getProfilePageData } from "@/features/profile/data";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { members, profile } = await getProfilePageData();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Plain profile data only. Astrology and human-design fields are stored without behavior logic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveProfileAction} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={profile.name} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="householdName">Household / family name</Label>
              <Input
                id="householdName"
                name="householdName"
                defaultValue={profile.householdName}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="astrologyDetails">Astrology details</Label>
              <Textarea
                id="astrologyDetails"
                name="astrologyDetails"
                rows={4}
                defaultValue={profile.astrologyDetails ?? ""}
                placeholder="Optional plain profile data only"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="humanDesignDetails">Human design details</Label>
              <Textarea
                id="humanDesignDetails"
                name="humanDesignDetails"
                rows={4}
                defaultValue={profile.humanDesignDetails ?? ""}
                placeholder="Optional plain profile data only"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Household roster</CardTitle>
            <CardDescription>
              Assignment targets for shared tasks. No invites or auth yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {members.length ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border p-4"
                >
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.relationship ?? "Relationship optional"}
                    </p>
                  </div>

                  <form action={deleteHouseholdMemberAction.bind(null, member.id)}>
                    <Button type="submit" variant="outline">
                      Remove
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Add household members so tasks can be assigned beyond yourself.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add household member</CardTitle>
            <CardDescription>Simple roster management for MVP assignment flows.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={addHouseholdMemberAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="member-name">Name</Label>
                <Input id="member-name" name="name" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="member-relationship">Relationship</Label>
                <Input
                  id="member-relationship"
                  name="relationship"
                  placeholder="Partner, child, roommate"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Add member</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
