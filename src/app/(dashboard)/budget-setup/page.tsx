// src/app/(dashboard)/budget-setup/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { BudgetSetupProvider } from "./budget-setup-context";
import { StepIncome } from "./components/step-income";
import { StepFixedExpenses } from "./components/step-fixed-expenses";
import { StepEnvelopes } from "./components/step-envelopes";
import { StepSavingsGoals } from "./components/step-savings-goals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

const STEPS = [
  { id: "income", title: "Income" },
  { id: "fixedExpenses", title: "Fixed Expenses" },
  { id: "envelopes", title: "Envelopes" },
  { id: "savingsGoals", title: "Savings Goals" },
] as const;

export default function BudgetSetupPage() {
  const router = useRouter();
  const { user, householdId, loading, error } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepRef = useRef<{ submit: () => void }>(null);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  // Add debugging
  useEffect(() => {
    console.log("🔍 Budget Setup Debug:", {
      user: user ? "Present" : "Missing",
      userId: user?.id,
      householdId,
      loading,
      error,
      userEmail: user?.email,
    });
  }, [user, householdId, loading, error]);

  // Handle loading state
  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading authentication...</span>
          </div>
        </Card>
      </div>
    );
  }

  // Handle authentication error - show more detailed info
  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Authentication Error</p>
            <p className="text-sm text-gray-600 mb-4">Error: {error}</p>
            <p className="text-sm text-gray-600 mb-4">
              Debug: User={user ? "present" : "missing"}, HouseholdId=
              {householdId || "missing"}
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push("/login")}>Go to Login</Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Handle missing user
  if (!user) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">No user session found</p>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Handle missing household
  if (!householdId) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-yellow-500 mb-4">
              No household found for user: {user.email}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              You may need to create or join a household first.
            </p>
            <Button onClick={() => router.push("/onboarding")}>
              Set Up Household
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleNext = () => {
    console.log("🔵 handleNext called, current step:", currentStep);
    console.log("🔵 stepRef.current:", stepRef.current);
    if (completedSteps[currentStep]) {
      console.log("🟢 Step already completed, advancing without resubmitting");
      setCurrentStep((prev) => prev + 1);
    } else if (stepRef.current) {
      console.log("🔵 Calling stepRef.current.submit()");
      stepRef.current.submit();
    } else {
      console.log("🔴 stepRef.current is null!");
    }
  };

  const onStepComplete = () => {
    setCompletedSteps((prev) => {
      const updated = [...prev];
      updated[currentStep] = true;
      return updated;
    });
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/budget-setup/complete", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete budget setup");
      }

      toast.success("Budget setup completed successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing budget setup:", error);
      toast.error("Failed to complete budget setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "income":
        return (
          <StepIncome
            ref={stepRef}
            householdId={householdId}
            onComplete={onStepComplete}
          />
        );
      case "fixedExpenses":
        return (
          <StepFixedExpenses
            ref={stepRef}
            householdId={householdId}
            onComplete={onStepComplete}
          />
        );
      case "envelopes":
        return (
          <StepEnvelopes
            ref={stepRef}
            householdId={householdId}
            onComplete={onStepComplete}
          />
        );
      case "savingsGoals":
        return (
          <StepSavingsGoals
            ref={stepRef}
            householdId={householdId}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <BudgetSetupProvider>
      <div className="container max-w-4xl py-8">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Budget Setup</h1>
              <p className="text-muted-foreground">
                Let's set up your budget step by step. We'll start with your
                income and work our way through your expenses and savings goals.
              </p>
              {/* Debug info in development */}
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-500">
                  Debug: User {user.email}, Household {householdId}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    Step {currentStep + 1} of {STEPS.length}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {STEPS[currentStep].title}
                  </p>
                </div>
                <Progress
                  value={(currentStep / (STEPS.length - 1)) * 100}
                  className="w-1/3"
                />
              </div>

              <div className="min-h-[400px]">{renderStep()}</div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                {currentStep === STEPS.length - 1 ? (
                  <Button
                    onClick={handleComplete}
                    disabled={isSubmitting || !completedSteps[currentStep]}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={currentStep >= STEPS.length - 1}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </BudgetSetupProvider>
  );
}
