"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface HouseholdFormProps {
  onSuccess?: () => void;
}

export function HouseholdForm({ onSuccess }: HouseholdFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = "Household name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    if (!validateForm()) {
      console.log("Validation failed");
      return;
    }
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("User:", user);
      if (!user) {
        toast.error("You must be logged in to create a household.");
        setIsLoading(false);
        return;
      }
      const { data: household, error: householdError } = await supabase
        .from("households")
        .insert({
          name: formData.name,
          created_by: user.id,
        })
        .select()
        .single();
      console.log("Insert result:", household, householdError);
      if (householdError) throw householdError;
      toast.success("Household created successfully!");
      router.push("/dashboard");
      onSuccess?.();
    } catch (error) {
      console.error("Household creation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create household"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Household Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="The Smith Family"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={errors.name ? "border-error" : ""}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-error">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          type="text"
          placeholder="Our family budget"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-white rounded-md px-6 py-3 font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Household...
          </>
        ) : (
          "Create Household"
        )}
      </Button>
    </form>
  );
}
