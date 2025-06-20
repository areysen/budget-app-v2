import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Validation schema
const envelopeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  default_amount: z.coerce.number().positive("Amount must be greater than 0"),
  rollover_rule: z.enum([
    "always_rollover",
    "rollover_limit",
    "always_to_savings",
  ]),
  rollover_limit: z.coerce.number().positive().optional().nullable(),
  household_id: z.string(),
});

type EnvelopeFormValues = z.infer<typeof envelopeSchema>;

interface EnvelopeFormProps {
  envelope?: EnvelopeFormValues;
  householdId: string;
  onSave: (envelope: EnvelopeFormValues) => void;
  onCancel: () => void;
  saving: boolean;
}

export function EnvelopeForm({
  envelope,
  householdId,
  onSave,
  onCancel,
  saving,
}: EnvelopeFormProps) {
  // Default values
  const defaultValues: Partial<EnvelopeFormValues> = {
    name: "",
    default_amount: 0,
    rollover_rule: "always_rollover",
    rollover_limit: null,
    household_id: householdId,
    ...envelope,
  };

  const form = useForm<EnvelopeFormValues>({
    resolver: zodResolver(envelopeSchema),
    defaultValues,
  });

  // Watch rollover rule to conditionally show rollover limit
  const rolloverRule = form.watch("rollover_rule");
  const showRolloverLimit = rolloverRule === "rollover_limit";

  // Handle form submission
  const onSubmit = (values: EnvelopeFormValues) => {
    // If rollover rule is not rollover_limit, set limit to null
    if (values.rollover_rule !== "rollover_limit") {
      values.rollover_limit = null;
    }
    onSave(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Envelope Name</FormLabel>
              <FormControl>
                <Input placeholder="Groceries" {...field} />
              </FormControl>
              <FormDescription>
                Name for this spending category (e.g., Groceries, Fun Money)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount per Period</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" {...field} />
              </FormControl>
              <FormDescription>
                How much to allocate to this envelope each paycheck period
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rollover_rule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rollover Rule</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rollover rule" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="always_rollover">
                    Always Rollover
                  </SelectItem>
                  <SelectItem value="rollover_limit">
                    Rollover with Limit
                  </SelectItem>
                  <SelectItem value="always_to_savings">
                    Always to Savings
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === "always_rollover" &&
                  "Unused funds always roll over to the next period"}
                {field.value === "rollover_limit" &&
                  "Unused funds roll over up to a specified limit"}
                {field.value === "always_to_savings" &&
                  "Unused funds always go to savings"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showRolloverLimit && (
          <FormField
            control={form.control}
            name="rollover_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rollover Limit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Maximum amount that can roll over to the next period
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
