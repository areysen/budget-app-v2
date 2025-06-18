"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useBudgetSetup, BudgetEnvelopesStep } from "../budget-setup-context";

// Form schema
const envelopeSchema = z.object({
  envelopes: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        amount: z.number().min(0, "Amount must be positive"),
        rolloverRule: z.enum([
          "always_rollover",
          "rollover_limit",
          "always_to_savings",
        ]),
        rolloverLimit: z.number().optional(),
      })
    )
    .min(1, "At least one envelope is required"),
});

type EnvelopeFormData = z.infer<typeof envelopeSchema>;

interface StepEnvelopesProps {
  householdId: string;
  onComplete: () => void;
}

// Pre-populated examples
const EXAMPLE_ENVELOPES = [
  {
    name: "Groceries",
    amount: 300,
    rolloverRule: "rollover_limit" as const,
    rolloverLimit: 100,
  },
  {
    name: "Gas",
    amount: 150,
    rolloverRule: "always_rollover" as const,
  },
  {
    name: "Dining Out",
    amount: 100,
    rolloverRule: "always_to_savings" as const,
  },
  {
    name: "Entertainment",
    amount: 50,
    rolloverRule: "always_to_savings" as const,
  },
];

const StepEnvelopes = forwardRef(function StepEnvelopes(
  { householdId, onComplete }: StepEnvelopesProps,
  ref
) {
  const { getStepData, setStepData } = useBudgetSetup();
  const existingData = getStepData("envelopes");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EnvelopeFormData>({
    resolver: zodResolver(envelopeSchema),
    defaultValues: existingData || {
      envelopes: [
        {
          name: "",
          amount: 0,
          rolloverRule: "always_rollover",
        },
      ],
    },
  });

  const onSubmit = async (data: EnvelopeFormData) => {
    try {
      setIsSubmitting(true);
      // Save to context
      setStepData("envelopes", data);

      // Save to API
      const response = await fetch("/api/budget-setup/envelopes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save envelopes");
      }

      onComplete();
    } catch (error) {
      toast.error("Failed to save envelopes. Please try again.");
      console.error("Error saving envelopes:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEnvelope = () => {
    const currentEnvelopes = form.getValues("envelopes");
    form.setValue("envelopes", [
      ...currentEnvelopes,
      {
        name: "",
        amount: 0,
        rolloverRule: "always_rollover",
      },
    ]);
  };

  const removeEnvelope = (index: number) => {
    const currentEnvelopes = form.getValues("envelopes");
    form.setValue(
      "envelopes",
      currentEnvelopes.filter((_, i) => i !== index)
    );
  };

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)(),
  }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Envelopes</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEnvelope}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Envelope
          </Button>
        </div>

        {form.watch("envelopes").map((_, index) => (
          <div key={index} className="grid gap-4 p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Envelope #{index + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEnvelope(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`envelopes.${index}.name`}>Name</Label>
                <Input
                  id={`envelopes.${index}.name`}
                  {...form.register(`envelopes.${index}.name`)}
                  placeholder="e.g., Groceries"
                />
                {form.formState.errors.envelopes?.[index]?.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.envelopes[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`envelopes.${index}.amount`}>Amount</Label>
                <Input
                  id={`envelopes.${index}.amount`}
                  type="number"
                  step="0.01"
                  {...form.register(`envelopes.${index}.amount`, {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.envelopes?.[index]?.amount && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.envelopes[index]?.amount?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`envelopes.${index}.rolloverRule`}>
                  Rollover Rule
                </Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue(
                      `envelopes.${index}.rolloverRule`,
                      value as any
                    )
                  }
                  defaultValue={form.getValues(
                    `envelopes.${index}.rolloverRule`
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rollover rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always_rollover">
                      Always rollover
                    </SelectItem>
                    <SelectItem value="rollover_limit">
                      Rollover up to limit
                    </SelectItem>
                    <SelectItem value="always_to_savings">
                      Always to savings
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.watch(`envelopes.${index}.rolloverRule`) ===
                "rollover_limit" && (
                <div className="space-y-2">
                  <Label htmlFor={`envelopes.${index}.rolloverLimit`}>
                    Rollover Limit
                  </Label>
                  <Input
                    id={`envelopes.${index}.rolloverLimit`}
                    type="number"
                    step="0.01"
                    {...form.register(`envelopes.${index}.rolloverLimit`, {
                      valueAsNumber: true,
                    })}
                  />
                  {form.formState.errors.envelopes?.[index]?.rolloverLimit && (
                    <p className="text-sm text-destructive">
                      {
                        form.formState.errors.envelopes[index]?.rolloverLimit
                          ?.message
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {form.formState.errors.envelopes &&
          !Array.isArray(form.formState.errors.envelopes) && (
            <p className="text-sm text-destructive">
              {form.formState.errors.envelopes.message}
            </p>
          )}
      </div>
    </form>
  );
});

export { StepEnvelopes };
