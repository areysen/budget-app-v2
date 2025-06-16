import AuthGuard from "./AuthGuard";

async function DashboardData() {
  // Fetch your data here (e.g., from Supabase, server-side)
  // const data = await fetchData();
  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome to Your Dashboard!</h1>
      <p className="text-muted-foreground mb-6">
        🎉 You are signed in and have access to this protected page.
        <br />
        This is just a placeholder. The full dashboard experience is coming
        soon.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center bg-background-soft">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm text-center">
          <DashboardData />
        </div>
      </div>
    </AuthGuard>
  );
}
