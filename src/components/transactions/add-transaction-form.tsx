"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const transactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  envelope_id: z.string().min(1, "Please select an envelope"),
  transaction_date: z.string(),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

interface AddTransactionFormProps {
  userId: string;
  householdId: string;
  session?: Session | null;
}

export function AddTransactionForm({
  userId,
  householdId,
  session,
}: AddTransactionFormProps) {
  const [envelopes, setEnvelopes] = useState<
    Array<{ id: string; name: string; sort_order: number | null }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split("T")[0],
      notes: "",
      envelope_id: "",
    },
  });

  useEffect(() => {
    async function fetchEnvelopes() {
      const { data, error } = await supabase
        .from("envelopes")
        .select("id, name, sort_order")
        .eq("household_id", householdId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching envelopes:", error);
        toast.error("Failed to load envelopes");
        return;
      }
      setEnvelopes(data || []);
    }
    fetchEnvelopes();
  }, [householdId]);

  useEffect(() => {
    if (session) {
      supabase.auth.setSession(session);
    }
  }, [session]);

  const getEnvelopeColor = (index: number) => {
    const colors = [
      { bg: "bg-purple-500" },
      { bg: "bg-cyan-500" },
      { bg: "bg-green-500" },
      { bg: "bg-amber-500" },
      { bg: "bg-red-500" },
      { bg: "bg-blue-500" },
    ];
    return colors[index % colors.length];
  };

  const onSubmit = async (data: TransactionForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_transactions").insert({
        ...data,
        household_id: householdId,
        entered_by: userId,
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: userId,
      });
      if (error) {
        toast.error("Failed to add transaction");
        return;
      }
      toast.success("Transaction added!");
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error("Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (envelopes.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Add Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading envelopes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" />
          Add Transaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="25.50"
              className="font-mono"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>
          {/* Description Input */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What did you buy?"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          {/* Envelope Selection */}
          <div>
            <Label htmlFor="envelope">Envelope</Label>
            <Select
              value={form.watch("envelope_id") ?? ""}
              onValueChange={(value) => form.setValue("envelope_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select envelope" />
              </SelectTrigger>
              <SelectContent>
                {envelopes.map((envelope, index) => {
                  const color = getEnvelopeColor(index);
                  return (
                    <SelectItem key={envelope.id} value={envelope.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${color.bg} rounded-full`} />
                        {envelope.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {form.formState.errors.envelope_id && (
              <p className="text-sm text-red-500">
                {form.formState.errors.envelope_id.message}
              </p>
            )}
          </div>
          {/* Transaction Date */}
          <div>
            <Label htmlFor="transaction_date">Date</Label>
            <Input
              id="transaction_date"
              type="date"
              {...form.register("transaction_date")}
            />
          </div>
          {/* Notes (Optional) */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Additional details..."
              {...form.register("notes")}
            />
          </div>
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
