import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const envelopeSchema = z.object({
  householdId: z.string(),
  envelopes: z.array(
    z.object({
      name: z.string().min(1),
      defaultAmount: z.number().min(0),
      rolloverRule: z.enum(["save", "rollover", "rollover_limit"]),
      rolloverLimit: z.number().optional(),
      description: z.string().optional(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = envelopeSchema.parse(json);

    // Verify user has access to this household
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: member } = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", data.householdId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create envelopes
    const { error: envelopesError } = await supabase.from("envelopes").insert(
      data.envelopes.map((envelope, index) => ({
        household_id: data.householdId,
        name: envelope.name,
        default_amount: envelope.defaultAmount,
        rollover_rule: envelope.rolloverRule,
        rollover_limit:
          envelope.rolloverRule === "rollover_limit"
            ? envelope.rolloverLimit
            : null,
        description: envelope.description || null,
        is_active: true,
        sort_order: index,
      }))
    );

    if (envelopesError) throw envelopesError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving envelopes:", error);
    return NextResponse.json(
      { error: "Failed to save envelopes" },
      { status: 500 }
    );
  }
}
