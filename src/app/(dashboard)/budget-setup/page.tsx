"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const stepRef = useRef<{ submit: () => void }>(null);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  useEffect(() => {
    async function fetchHouseholdId() {
      setLoading(true);
      const res = await fetch("/api/user/household");
      if (res.ok) {
        const data = await res.json();
        setHouseholdId(data.householdId);
      } else {
        setHouseholdId(null);
      }
      setLoading(false);
    }
    fetchHouseholdId();
  }, []);

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
    if (!householdId) return null;
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

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                renderStep()
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isSubmitting}
                >
                  Previous
                </Button>
                {currentStep < STEPS.length - 1 && (
                  <Button onClick={handleNext} disabled={isSubmitting}>
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
