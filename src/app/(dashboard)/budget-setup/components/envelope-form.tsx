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
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  rolloverRule: z.enum(["rollover", "rollover_limit", "save"]),
  rolloverLimit: z.coerce.number().optional().nullable(),
});

type EnvelopeFormValues = z.infer<typeof formSchema>;

interface EnvelopeFormProps {
  householdId: string;
  initialData?: Envelope;
  onSave: (data: Envelope) => void;
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
  const form = useForm<EnvelopeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      amount: initialData?.amount || 0,
      rolloverRule: initialData?.rolloverRule || "rollover",
      rolloverLimit: initialData?.rolloverLimit ?? undefined,
    },
  });

  // Watch rollover rule to conditionally show rollover limit
  const watchRolloverRule = form.watch("rolloverRule");
  const showRolloverLimit = watchRolloverRule === "rollover_limit";

  // Handle form submission
  const onSubmit = (values: EnvelopeFormValues) => {
    onSave({
      id: initialData?.id || "",
      ...values,
      rolloverLimit:
        values.rolloverRule === "rollover_limit" ? values.rolloverLimit : null,
    });
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
                <SelectTrigger>
                  <SelectValue placeholder="Select a rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rollover">Always Rollover</SelectItem>
                  <SelectItem value="rollover_limit">
                    Rollover with Limit
                  </SelectItem>
                  <SelectItem value="save">Rollover to Savings</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === "rollover" &&
                  "Unused funds always roll over to the next period"}
                {field.value === "rollover_limit" &&
                  "Unused funds roll over up to a specified limit"}
                {field.value === "save" && "Unused funds always go to savings"}
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
