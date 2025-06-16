import { createUserHousehold } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function HouseholdSetup() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please sign in to set up your household.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to Budget App!</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData: FormData) => {
            "use server";
            const householdName = formData.get("householdName") as string;
            if (!householdName) return;

            console.log("Inserting household with:", {
              name: householdName,
              created_by: user.id,
            });
            const household = await createUserHousehold(user.id, householdName);
            if (household) {
              redirect("/dashboard");
            }
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="householdName">Household Name</Label>
              <Input
                id="householdName"
                name="householdName"
                placeholder="e.g., Smith Family Budget"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Create Household
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
