"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { HouseholdForm } from "@/components/auth/household-form";

export default function OnboardingClient({ session }: { session: any }) {
  useEffect(() => {
    if (session) {
      supabase.auth.setSession(session);
    }
  }, [session]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-soft">
      <div className="w-full max-w-md">
        <div className="bg-white border border-border/50 rounded-2xl p-6 shadow-sm">
          <HouseholdForm />
        </div>
      </div>
    </div>
  );
}
