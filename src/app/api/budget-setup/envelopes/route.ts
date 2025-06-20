import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const envelopeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  amount: z.number().min(0).default(0),
  rolloverRule: z
    .enum(["rollover", "rollover_limit", "save"])
    .default("rollover"),
  rolloverLimit: z.number().optional().nullable(),
  household_id: z.string(),
});

async function verifyUserAccess(supabase: any, householdId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: member } = await supabase
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    throw new Error("User is not a member of this household");
  }

  return user;
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get("householdId");

    if (!householdId) {
      return NextResponse.json(
        { error: "Household ID is required" },
        { status: 400 }
      );
    }

    await verifyUserAccess(supabase, householdId);

    const { data, error } = await supabase
      .from("envelopes")
      .select("*")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw error;

    return NextResponse.json({ envelopes: data || [] });
  } catch (error: any) {
    console.error("Error fetching envelopes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch envelopes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = envelopeSchema.parse(json);

    await verifyUserAccess(supabase, data.household_id);

    const { data: newEnvelope, error } = await supabase
      .from("envelopes")
      .insert({
        household_id: data.household_id,
        name: data.name,
        default_amount: data.amount,
        rollover_rule: data.rolloverRule,
        rollover_limit: data.rolloverLimit,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ envelope: newEnvelope });
  } catch (error: any) {
    console.error("Error creating envelope:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create envelope" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const json = await request.json();
    const data = envelopeSchema.parse(json);

    if (!data.id) {
      return NextResponse.json(
        { error: "Envelope ID is required for updates" },
        { status: 400 }
      );
    }

    await verifyUserAccess(supabase, data.household_id);

    const { data: updatedEnvelope, error } = await supabase
      .from("envelopes")
      .update({
        name: data.name,
        default_amount: data.amount,
        rollover_rule: data.rolloverRule,
        rollover_limit: data.rolloverLimit,
      })
      .eq("id", data.id)
      .eq("household_id", data.household_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ envelope: updatedEnvelope });
  } catch (error: any) {
    console.error("Error updating envelope:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update envelope" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get("householdId");
    const id = searchParams.get("id");

    if (!householdId || !id) {
      return NextResponse.json(
        { error: "Household ID and envelope ID are required" },
        { status: 400 }
      );
    }

    await verifyUserAccess(supabase, householdId);

    const { error } = await supabase
      .from("envelopes")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting envelope:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete envelope" },
      { status: 500 }
    );
  }
}
