"use client";

import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useBudgetSetup, Envelope } from "../budget-setup-context";
import { EnvelopeSummaryCard } from "./envelope-summary-card";
import { EnvelopeForm } from "./envelope-form";

interface StepEnvelopesProps {
  householdId: string;
  onComplete: () => void;
}

const StepEnvelopes = forwardRef(function StepEnvelopes(
  { householdId, onComplete }: StepEnvelopesProps,
  ref
) {
  const { getStepData, addEnvelope, updateEnvelope, removeEnvelope } =
    useBudgetSetup();
  const existingData = getStepData("envelopes");
  const envelopes = existingData?.envelopes || [];

  const [isFormOpen, setIsFormOpen] = useState(envelopes.length === 0);
  const [editingEnvelope, setEditingEnvelope] = useState<Envelope | null>(null);

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (envelopes.length === 0) {
        toast.error("Please add at least one envelope.");
        return;
      }
      onComplete();
    },
  }));

  const handleAdd = () => {
    setEditingEnvelope(null);
    setIsFormOpen(true);
  };

  const handleEdit = (envelope: Envelope) => {
    setEditingEnvelope(envelope);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    removeEnvelope(id);
    toast.success("Envelope removed.");
  };

  const handleSave = (envelopeData: Omit<Envelope, "id">) => {
    if (editingEnvelope) {
      updateEnvelope(editingEnvelope.id, envelopeData);
      toast.success("Envelope updated.");
    } else {
      addEnvelope(envelopeData);
      toast.success("Envelope added.");
    }
    setIsFormOpen(false);
    setEditingEnvelope(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Envelopes</h2>
        {!isFormOpen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Envelope
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <EnvelopeForm
          householdId={householdId}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
          initialData={editingEnvelope}
        />
      ) : (
        <div className="space-y-4">
          {envelopes.length > 0 ? (
            envelopes.map((envelope: Envelope) => (
              <EnvelopeSummaryCard
                key={envelope.id}
                envelope={envelope}
                onEdit={() => handleEdit(envelope)}
                onDelete={() => handleDelete(envelope.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No envelopes added yet.</p>
              <Button variant="link" onClick={handleAdd} className="mt-2">
                Add your first envelope
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export { StepEnvelopes };
