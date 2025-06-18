"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isSubmitting,
  isLastStep,
}: WizardNavigationProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={currentStep === 1 || isSubmitting}
        >
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLastStep ? "Completing..." : "Saving..."}
            </>
          ) : isLastStep ? (
            "Complete Setup"
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  );
}
