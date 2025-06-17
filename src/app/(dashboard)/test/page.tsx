import { createTestData } from "@/lib/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TestPage() {
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
            Please sign in to access the test page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Test Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Test Data</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await createTestData(user.id);
            }}
          >
            <Button type="submit">Create Test Data</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
