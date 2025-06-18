import { HouseholdForm } from "@/components/auth/household-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OnboardingClient from "./onboarding-client";

export default async function OnboardingPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return <OnboardingClient session={session} />;
}
