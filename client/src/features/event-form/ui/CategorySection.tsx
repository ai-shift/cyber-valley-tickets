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
  const { fields, append, remove, replace } = useFieldArray({
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

  // Calculate total quota used by all categories.
  const totalQuotaUsed =
    categories?.reduce((sum, cat) => {
      return sum + cat.quota;
    }, 0) ?? 0;

  // Calculate remaining tickets for categories.
  const remainingTickets = Math.max(0, maxTickets - totalQuotaUsed);

  const isBelowMinTickets = totalQuotaUsed < minTickets && fields.length > 0;

  function findQuotaDonorIndex(requiredExtraQuota: number): number {
    if (requiredExtraQuota <= 0) return -1;
    let donorIndex = -1;
    let donorQuota = 0;
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (!category) continue;
      // Keep at least 1 ticket in donor category after reallocation.
      if (category.quota - requiredExtraQuota < 1) continue;
      if (category.quota > donorQuota) {
        donorQuota = category.quota;
        donorIndex = i;
      }
    }
    return donorIndex;
  }

  function validateCategory(
    quotaValue: number,
    requiredExtraQuota: number,
  ): string | null {
    const discountValue = Number(newCategory.discount);

    // Validate discount range
    if (
      newCategory.discount !== "" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return "Discount must be between 0 and 100";
    }

    // Validate quota
    if (quotaValue < 1) {
      return "Quota must be at least 1 ticket";
    }
    if (quotaValue > maxTickets) {
      return `Quota cannot exceed maximum event capacity (${pluralTickets(maxTickets)})`;
    }

    if (requiredExtraQuota > 0) {
      const donorIndex = findQuotaDonorIndex(requiredExtraQuota);
      if (donorIndex === -1) {
        return `Cannot add ${pluralTickets(quotaValue)}. Only ${pluralTickets(remainingTickets)} free and no existing category can donate ${pluralTickets(requiredExtraQuota)}.`;
      }
    }

    return null;
  }

  function handleAdd() {
    if (!newCategory.name) return;

    const quotaValue = Number(newCategory.quota);
    const requiredExtraQuota = Math.max(0, quotaValue - remainingTickets);

    const validationError = validateCategory(quotaValue, requiredExtraQuota);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (requiredExtraQuota > 0) {
      const donorIndex = findQuotaDonorIndex(requiredExtraQuota);
      if (donorIndex !== -1) {
        const donor = categories[donorIndex];
        if (donor) {
          const next = [...categories];
          next[donorIndex] = {
            ...donor,
            quota: donor.quota - requiredExtraQuota,
          };
          replace(next);
        }
      }
    }

    const discountValue =
      newCategory.discount === "" ? 0 : Number(newCategory.discount);

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
        Set up ticket categories for your event. Each category must have a
        positive quota. The total quota cannot exceed place capacity.
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
                  {pluralTickets(field.quota)}
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
          Total quota must be at least {minTickets}. Increase category quotas.
        </div>
      )}

      {remainingTickets <= 0 && (
        <p className="text-sm text-amber-500">
          All {pluralTickets(maxTickets)} are allocated. Adding a new category
          will reallocate quota from an existing category.
        </p>
      )}

      {!isAdding ? (
        <Button
          filling="outline"
          className="w-full"
          onClick={() => setIsAdding(true)}
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
              Ticket Limit (1 to {maxTickets})
            </label>
            <Input
              id="cat-quota"
              type="number"
              min="1"
              max={maxTickets}
              value={newCategory.quota}
              onChange={(e) => {
                setNewCategory({ ...newCategory, quota: e.target.value });
                setError(null);
              }}
              placeholder={`1-${maxTickets}`}
            />
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
