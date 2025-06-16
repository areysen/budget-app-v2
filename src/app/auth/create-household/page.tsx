import { HouseholdForm } from "@/components/auth/household-form";

export default function CreateHouseholdPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your household
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up your household to start budgeting together
        </p>
      </div>

      <HouseholdForm />
    </div>
  );
}
