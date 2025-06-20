"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { EnvelopeSummaryCard } from "./envelope-summary-card";
import { EnvelopeForm } from "./envelope-form";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tables } from "@/types/supabase";
import {
  useBudgetSetup,
  Envelope as ContextEnvelope,
} from "../budget-setup-context";
import { toast } from "react-hot-toast";

type DbEnvelope = Tables<"envelopes">;

// Default envelope suggestions
const DEFAULT_ENVELOPES = [
  {
    name: "Groceries",
    default_amount: 300,
    rollover_rule: "rollover_limit",
    rollover_limit: 100,
  },
  {
    name: "Household & Maintenance",
    default_amount: 100,
    rollover_rule: "rollover_limit",
    rollover_limit: 50,
  },
  {
    name: "Fun Money",
    default_amount: 150,
    rollover_rule: "always_to_savings",
  },
  {
    name: "Dining Out",
    default_amount: 100,
    rollover_rule: "always_to_savings",
  },
  {
    name: "Personal Care",
    default_amount: 75,
    rollover_rule: "rollover_limit",
    rollover_limit: 25,
  },
  {
    name: "Miscellaneous",
    default_amount: 50,
    rollover_rule: "always_rollover",
  },
];

interface StepEnvelopesProps {
  householdId: string;
  onComplete: () => void;
}

// DB -> Context
const mapDbEnvelopeToContext = (dbEnvelope: DbEnvelope): ContextEnvelope => {
  return {
    id: dbEnvelope.id,
    name: dbEnvelope.name,
    amount: dbEnvelope.default_amount || 0,
    rolloverRule: dbEnvelope.rollover_rule as ContextEnvelope["rolloverRule"],
    rolloverLimit: dbEnvelope.rollover_limit,
  };
};

const StepEnvelopes = forwardRef(function StepEnvelopes(
  { householdId, onComplete }: StepEnvelopesProps,
  ref
) {
  const { user, loading: userLoading } = useUser();
  const { setStepData } = useBudgetSetup();

  const [state, setState] = useState<{
    envelopes: DbEnvelope[];
    editingEnvelope: DbEnvelope | null;
    addingNewEnvelope: boolean;
    loading: boolean;
    saving: boolean;
    error: string | null;
  }>({
    envelopes: [],
    editingEnvelope: null,
    addingNewEnvelope: false,
    loading: true,
    saving: false,
    error: null,
  });

  // Load envelopes on component mount
  useEffect(() => {
    if (householdId) {
      loadEnvelopes();
    }
  }, [householdId]);

  // Load envelopes from database
  const loadEnvelopes = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/budget-setup/envelopes?householdId=${householdId}`
      );
      if (!response.ok) throw new Error("Failed to fetch envelopes");
      const { envelopes: data } = await response.json();

      setState((prev) => ({
        ...prev,
        envelopes: data || [],
        loading: false,
      }));
    } catch (error) {
      console.error("Error loading envelopes:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to load envelopes. Please try again.",
        loading: false,
      }));
    }
  };

  // Handle adding a new envelope
  const handleAddNew = () => {
    setState((prev) => ({
      ...prev,
      addingNewEnvelope: true,
      editingEnvelope: null,
    }));
  };

  // Handle editing an envelope
  const handleEdit = (envelope: DbEnvelope) => {
    setState((prev) => ({
      ...prev,
      editingEnvelope: envelope,
      addingNewEnvelope: false,
    }));
  };

  // Handle canceling add/edit
  const handleCancel = () => {
    setState((prev) => ({
      ...prev,
      editingEnvelope: null,
      addingNewEnvelope: false,
    }));
  };

  // Handle saving an envelope
  const handleSave = async (formValues: Omit<ContextEnvelope, "id">) => {
    setState((prev) => ({ ...prev, saving: true, error: null }));

    // Map form values to DB shape
    const dataToSave = {
      name: formValues.name,
      default_amount: formValues.amount,
      rollover_rule: formValues.rolloverRule,
      rollover_limit: formValues.rolloverLimit,
      id: state.editingEnvelope?.id, // Pass id if editing
    };

    try {
      const isEditing = !!dataToSave.id;
      const response = await fetch("/api/budget-setup/envelopes", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dataToSave, household_id: householdId }),
      });

      if (!response.ok) throw new Error("Failed to save envelope");
      const { envelope: savedEnvelope } = await response.json();

      setState((prev) => {
        const updatedEnvelopes = isEditing
          ? prev.envelopes.map((e) =>
              e.id === savedEnvelope.id ? savedEnvelope : e
            )
          : [...prev.envelopes, savedEnvelope];

        updatedEnvelopes.sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        );

        setStepData("envelopes", {
          envelopes: updatedEnvelopes.map(mapDbEnvelopeToContext),
        });

        return {
          ...prev,
          envelopes: updatedEnvelopes,
          editingEnvelope: null,
          addingNewEnvelope: false,
          saving: false,
        };
      });
      toast.success(`Envelope ${isEditing ? "updated" : "added"} successfully`);
    } catch (error) {
      console.error("Error saving envelope:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to save envelope. Please try again.",
        saving: false,
      }));
    }
  };

  // Handle deleting an envelope
  const handleDelete = async (envelope: DbEnvelope) => {
    if (!confirm("Are you sure you want to delete this envelope?")) return;

    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      const response = await fetch(
        `/api/budget-setup/envelopes?householdId=${householdId}&id=${envelope.id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete envelope");

      setState((prev) => {
        const updatedEnvelopes = prev.envelopes.filter(
          (e) => e.id !== envelope.id
        );
        setStepData("envelopes", {
          envelopes: updatedEnvelopes.map(mapDbEnvelopeToContext),
        });
        return {
          ...prev,
          envelopes: updatedEnvelopes,
          saving: false,
        };
      });
      toast.success("Envelope deleted successfully");
    } catch (error) {
      console.error("Error deleting envelope:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to delete envelope. Please try again.",
        saving: false,
      }));
    }
  };

  const handleAddDefaults = async () => {
    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      const defaultsWithHouseholdId = DEFAULT_ENVELOPES.map(
        (envelope, index) => ({
          ...envelope,
          household_id: householdId,
          sort_order: index,
        })
      );

      const response = await fetch("/api/budget-setup/envelopes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envelopes: defaultsWithHouseholdId,
          household_id: householdId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add default envelopes");

      const { envelopes: newEnvelopes } = await response.json();

      setState((prev) => {
        const updatedEnvelopes = [...prev.envelopes, ...newEnvelopes].sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        );
        setStepData("envelopes", {
          envelopes: updatedEnvelopes.map(mapDbEnvelopeToContext),
        });
        return {
          ...prev,
          envelopes: updatedEnvelopes,
          saving: false,
        };
      });
      toast.success("Suggested envelopes added!");
    } catch (error) {
      console.error("Error adding default envelopes:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to add default envelopes. Please try again.",
        saving: false,
      }));
    }
  };

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (state.envelopes.length === 0) {
        toast.error("Please add at least one envelope before continuing.");
        return;
      }
      onComplete();
    },
  }));

  // Show loading state
  if (userLoading || state.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Show error state
  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Spending Envelopes</h2>
        <div className="flex gap-2">
          {state.envelopes.length === 0 && (
            <Button
              onClick={handleAddDefaults}
              variant="outline"
              disabled={state.saving}
            >
              Add Suggested Envelopes
            </Button>
          )}
          <Button onClick={handleAddNew} disabled={state.saving}>
            Add New Envelope
          </Button>
        </div>
      </div>

      {state.envelopes.length === 0 && !state.addingNewEnvelope && (
        <div className="text-center p-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">
            No envelopes yet. Add your first envelope or use our suggested
            defaults.
          </p>
        </div>
      )}

      {/* Show form when adding or editing */}
      {(state.addingNewEnvelope || state.editingEnvelope) && (
        <EnvelopeForm
          householdId={householdId}
          initialData={
            state.editingEnvelope
              ? mapDbEnvelopeToContext(state.editingEnvelope)
              : undefined
          }
          onSave={handleSave}
          onCancel={handleCancel}
          saving={state.saving}
        />
      )}

      {/* Show envelope cards when not adding/editing */}
      {!state.addingNewEnvelope && !state.editingEnvelope && (
        <div className="space-y-4">
          {state.envelopes.map((envelope) => (
            <EnvelopeSummaryCard
              key={envelope.id}
              envelope={mapDbEnvelopeToContext(envelope)}
              onEdit={() => handleEdit(envelope)}
              onDelete={() => handleDelete(envelope)}
            />
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="mt-8 p-4 bg-muted/20 rounded-md">
        <h3 className="font-medium mb-2">About Spending Envelopes</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Envelopes are spending categories for day-to-day expenses. Each
          envelope gets a set amount per paycheck period.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Savings goals (like Emergency Fund or Vacation)
          should be created in the next step, not as envelopes.
        </p>
      </div>
    </div>
  );
});

StepEnvelopes.displayName = "StepEnvelopes";

export { StepEnvelopes };
