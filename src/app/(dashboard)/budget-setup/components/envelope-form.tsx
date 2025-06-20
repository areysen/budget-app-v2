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
import { Envelope } from "../budget-setup-context";

// Validation schema
const envelopeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  rolloverRule: z.enum([
    "always_rollover",
    "rollover_limit",
    "always_to_savings",
  ]),
  rolloverLimit: z.coerce.number().positive().optional(),
});

type EnvelopeFormValues = z.infer<typeof envelopeSchema>;

interface EnvelopeFormProps {
  initialData?: Envelope | null;
  householdId: string;
  onSave: (envelope: Omit<Envelope, "id">) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function EnvelopeForm({
  initialData,
  householdId,
  onSave,
  onCancel,
  saving,
}: EnvelopeFormProps) {
  // Default values
  const defaultValues: Partial<EnvelopeFormValues> = {
    name: initialData?.name || "",
    amount: initialData?.amount || 0,
    rolloverRule: initialData?.rolloverRule || "always_rollover",
    rolloverLimit: initialData?.rolloverLimit,
    ...(initialData?.id && { id: initialData.id }),
  };

  const form = useForm<EnvelopeFormValues>({
    resolver: zodResolver(envelopeSchema),
    defaultValues,
  });

  // Watch rollover rule to conditionally show rollover limit
  const rolloverRule = form.watch("rolloverRule");
  const showRolloverLimit = rolloverRule === "rollover_limit";

  // Handle form submission
  const onSubmit = (values: EnvelopeFormValues) => {
    if (values.rolloverRule !== "rollover_limit") {
      values.rolloverLimit = undefined;
    }
    const { id, ...saveData } = values;
    onSave(saveData);
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
          name="amount"
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
          name="rolloverRule"
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
            name="rolloverLimit"
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
