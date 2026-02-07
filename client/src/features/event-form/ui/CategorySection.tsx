import type { EventPlace } from "@/entities/place";
import { pluralTickets } from "@/shared/lib/pluralDays";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useState } from "react";
import type { Control } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import type { EventFormOutput } from "../model/types";

interface CategorySectionProps {
  control: Control<EventFormOutput>;
  selectedPlace?: EventPlace;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  control,
  selectedPlace,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "categories",
  });

  const categories = useWatch({
    control,
    name: "categories",
    defaultValue: [],
  });

  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    discount: "",
    quota: "",
  });

  const maxTickets = selectedPlace?.maxTickets ?? Number.MAX_SAFE_INTEGER;
  const minTickets = selectedPlace?.minTickets ?? 1;
  const hasUnlimitedCategory = categories?.some((cat) => cat.quota === 0);

  // Calculate total quota used by all categories (excluding unlimited)
  const totalQuotaUsed =
    categories?.reduce((sum, cat) => {
      return cat.quota > 0 ? sum + cat.quota : sum;
    }, 0) ?? 0;

  // Calculate remaining tickets for categories (respecting minTickets boundary)
  const remainingTickets = Math.max(0, maxTickets - totalQuotaUsed);

  // Check if we're below minTickets (when no unlimited category)
  const isBelowMinTickets =
    !hasUnlimitedCategory && totalQuotaUsed < minTickets && fields.length > 0;

  function validateCategory(): string | null {
    const discountValue = Number(newCategory.discount);
    const quotaValue = Number(newCategory.quota);

    // Validate discount range
    if (
      newCategory.discount !== "" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return "Discount must be between 0 and 100";
    }

    // Validate quota
    if (quotaValue !== 0) {
      if (quotaValue < 1) {
        return "Quota must be at least 1 ticket";
      }
      if (quotaValue > maxTickets) {
        return `Quota cannot exceed maximum event capacity (${pluralTickets(maxTickets)})`;
      }
      // Check if adding this category would exceed maxTickets
      if (quotaValue > remainingTickets) {
        return `Cannot add ${pluralTickets(quotaValue)}. Only ${pluralTickets(remainingTickets)} remaining for categories (max: ${maxTickets})`;
      }
    }

    // Check unlimited category limit
    if (quotaValue === 0 && hasUnlimitedCategory) {
      return "Only one category can have unlimited quota";
    }

    // Check if any quota is available when not unlimited
    if (quotaValue > 0 && remainingTickets <= 0) {
      return `No tickets available for categories. All ${pluralTickets(maxTickets)} are already allocated.`;
    }

    return null;
  }

  function handleAdd() {
    if (!newCategory.name) return;

    const validationError = validateCategory();
    if (validationError) {
      setError(validationError);
      return;
    }

    const discountValue =
      newCategory.discount === "" ? 0 : Number(newCategory.discount);
    const quotaValue = newCategory.quota === "" ? 0 : Number(newCategory.quota);

    append({
      id: crypto.randomUUID(),
      name: newCategory.name,
      discount: discountValue,
      quota: quotaValue,
    });

    setNewCategory({ name: "", discount: "", quota: "" });
    setError(null);
    setIsAdding(false);
  }

  function handleRemove(index: number) {
    remove(index);
    setError(null);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Ticket Categories (Required)</h3>
      <p className="text-sm text-muted-foreground">
        Set up ticket categories for your event. Categories must cover all
        available tickets. Either have one unlimited category or quotas must sum
        to the event capacity.
      </p>

      {fields.length === 0 && (
        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded">
          At least one category is required. Please add a category to continue.
        </div>
      )}

      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-3 bg-popover border border-input"
            >
              <div>
                <span className="font-medium">{field.name}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({Number(field.discount).toFixed(2)}% off)
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {field.quota !== 0 ? pluralTickets(field.quota) : "Unlimited"}
                </span>
              </div>
              <button
                className="cursor-pointer p-1"
                type="button"
                onClick={() => handleRemove(index)}
              >
                <img
                  className="h-5 w-5"
                  src="/icons/staff bin_2.svg"
                  alt="remove category"
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {isBelowMinTickets && (
        <div className="text-sm text-amber-500 bg-amber-500/10 p-3 rounded">
          Total quota must be at least {minTickets}. Increase it or use an
          unlimited category.
        </div>
      )}

      {remainingTickets <= 0 && !hasUnlimitedCategory && (
        <p className="text-sm text-amber-500">
          All {pluralTickets(maxTickets)} are allocated to categories. No more
          categories can be added.
        </p>
      )}

      {!isAdding ? (
        <Button
          filling="outline"
          className="w-full"
          onClick={() => setIsAdding(true)}
          disabled={remainingTickets <= 0 && !hasUnlimitedCategory}
        >
          Add Category
          {remainingTickets > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({pluralTickets(remainingTickets)} available)
            </span>
          )}
        </Button>
      ) : (
        <div className="space-y-3 p-4 bg-popover border border-input">
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="cat-name" className="text-sm">
              Category Name
            </label>
            <Input
              id="cat-name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              placeholder="e.g., Early Bird, Students"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cat-discount" className="text-sm">
              Discount (%) - 0 to 100
            </label>
            <Input
              id="cat-discount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={newCategory.discount}
              onChange={(e) =>
                setNewCategory({ ...newCategory, discount: e.target.value })
              }
              placeholder="0-100"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cat-quota" className="text-sm">
              Ticket Limit (1 to{" "}
              {remainingTickets > 0 ? remainingTickets : maxTickets}, or 0 for
              unlimited)
            </label>
            <Input
              id="cat-quota"
              type="number"
              min="0"
              max={remainingTickets > 0 ? remainingTickets : maxTickets}
              value={newCategory.quota}
              onChange={(e) => {
                setNewCategory({ ...newCategory, quota: e.target.value });
                setError(null);
              }}
              placeholder={`1-${remainingTickets > 0 ? remainingTickets : maxTickets} (0 = unlimited)`}
            />
            {hasUnlimitedCategory && (
              <p className="text-xs text-amber-500">
                You already have one unlimited category. Only one unlimited
                category is allowed per event.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              filling="outline"
              className="flex-1"
              onClick={() => {
                setIsAdding(false);
                setNewCategory({
                  name: "",
                  discount: "",
                  quota: "",
                });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAdd}
              disabled={!newCategory.name}
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
