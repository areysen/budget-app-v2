"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

const SUGGESTED_CATEGORIES = [
  "Housing",
  "Utilities",
  "Transportation",
  "Insurance",
  "Subscriptions",
  "Healthcare",
  "Debt Payments",
  "Other",
];

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  availableCategories: string[];
  placeholder?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  categoryError?: string | null;
}

export function CategorySelector({
  value,
  onChange,
  availableCategories,
  placeholder = "Select category",
  className,
  loading = false,
  error,
  categoryError,
}: CategorySelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // Check if current value is custom
  useEffect(() => {
    if (
      value &&
      !availableCategories.includes(value) &&
      !SUGGESTED_CATEGORIES.includes(value)
    ) {
      setIsCustom(true);
      setCustomValue(value);
    }
  }, [value, availableCategories]);

  const systemCategories = SUGGESTED_CATEGORIES;

  const customCategories = availableCategories.filter(
    (cat) => !SUGGESTED_CATEGORIES.includes(cat)
  );

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "__custom__") {
      setIsCustom(true);
      setCustomValue("");
    } else {
      setIsCustom(false);
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onChange(newValue);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-2">
        <Select disabled value="">
          <SelectTrigger className={className}>
            <SelectValue>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading categories...</span>
              </div>
            </SelectValue>
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  // Error state
  if (categoryError) {
    return (
      <div className="space-y-2">
        <Select disabled value="">
          <SelectTrigger className={`${className} border-destructive`}>
            <SelectValue>Failed to load categories</SelectValue>
          </SelectTrigger>
        </Select>
        <p className="text-destructive text-sm">{categoryError}</p>
      </div>
    );
  }

  // Custom category input
  if (isCustom) {
    return (
      <div className="space-y-2">
        <Input
          value={customValue}
          onChange={handleCustomInputChange}
          placeholder="Enter custom category..."
          className={`${className} ${error ? "border-destructive" : ""}`}
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            setCustomValue("");
            onChange("");
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to categories
        </button>
      </div>
    );
  }

  // Normal select state
  // Ensure value is either a valid category or undefined for the placeholder to show
  const selectValue = value && (SUGGESTED_CATEGORIES.includes(value) || availableCategories.includes(value)) 
    ? value 
    : undefined;
    
  return (
    <div className="space-y-2">
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger
          className={`${className} ${error ? "border-destructive" : ""}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {systemCategories.length > 0 && (
            <SelectGroup>
              <SelectLabel>Common Categories</SelectLabel>
              {systemCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {customCategories.length > 0 && (
            <SelectGroup>
              <SelectLabel>Your Categories</SelectLabel>
              {customCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          <SelectSeparator />
          <SelectItem value="__custom__">
            <div className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Category
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
