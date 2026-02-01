import { eventQueries } from "@/entities/event";
import type { TicketAllocation } from "@/entities/order";
import { getCurrencySymbol } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export interface CategoryOption {
  categoryId: number;
  name: string;
  discount: number;
  quota: number;
  hasQuota: boolean;
  ticketsBought: number;
}

interface CategoryAllocationProps {
  eventId: number;
  ticketPrice: number;
  totalTickets: number;
  allocations: TicketAllocation[];
  onTotalChange: (total: number) => void;
  onAllocationsChange: (allocations: TicketAllocation[]) => void;
}

export const CategoryAllocation: React.FC<CategoryAllocationProps> = ({
  eventId,
  ticketPrice,
  totalTickets,
  allocations,
  onTotalChange,
  onAllocationsChange,
}) => {
  const { data: categories, isLoading } = useQuery(
    eventQueries.categories(eventId),
  );
  const [error, setError] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    if (!categories) return new Map<number, CategoryOption>();
    return new Map(categories.map((c) => [c.categoryId, c]));
  }, [categories]);

  const getCategoryPrice = (category: CategoryOption): number => {
    if (category.discount === 0) return ticketPrice;
    const discount = (ticketPrice * category.discount) / 10000;
    return ticketPrice - discount;
  };

  const getRemainingQuota = (category: CategoryOption): number | null => {
    if (!category.hasQuota) return null;
    return category.quota - category.ticketsBought;
  };

  const isSoldOut = (category: CategoryOption): boolean => {
    if (!category.hasQuota) return false;
    return category.ticketsBought >= category.quota;
  };

  const allocatedCount = useMemo(
    () => allocations.reduce((sum, a) => sum + a.count, 0),
    [allocations],
  );

  const remainingToAllocate = totalTickets - allocatedCount;

  const totalPrice = useMemo(() => {
    return allocations.reduce(
      (sum, a) => sum + a.count * a.finalPricePerTicket,
      0,
    );
  }, [allocations]);

  const addAllocation = () => {
    if (remainingToAllocate <= 0) {
      setError("All tickets are already allocated");
      return;
    }
    if (!categories || categories.length === 0) return;

    // Find first available category that isn't already selected
    const usedCategoryIds = new Set(allocations.map((a) => a.categoryId));
    const availableCategory = categories.find(
      (c) => !usedCategoryIds.has(c.categoryId) && !isSoldOut(c),
    );

    if (!availableCategory) {
      setError("No available categories to add");
      return;
    }

    const finalPrice = getCategoryPrice(availableCategory);
    const newAllocation: TicketAllocation = {
      categoryId: availableCategory.categoryId,
      categoryName: availableCategory.name,
      discount: availableCategory.discount,
      count: Math.min(1, remainingToAllocate),
      finalPricePerTicket: finalPrice,
    };

    onAllocationsChange([...allocations, newAllocation]);
    setError(null);
  };

  const removeAllocation = (index: number) => {
    const newAllocations = allocations.filter((_, i) => i !== index);
    onAllocationsChange(newAllocations);
    setError(null);
  };

  const updateAllocationCategory = (index: number, categoryId: number) => {
    const category = categoryMap.get(categoryId);
    if (!category) return;

    // Check for duplicates
    const isDuplicate = allocations.some(
      (a, i) => i !== index && a.categoryId === categoryId,
    );
    if (isDuplicate) {
      setError("This category is already selected");
      return;
    }

    const finalPrice = getCategoryPrice(category);
    const remainingQuota = getRemainingQuota(category);
    const currentAllocation = allocations[index];
    const currentCount = currentAllocation?.count ?? 1;
    const maxCount =
      remainingQuota !== null
        ? remainingQuota
        : remainingToAllocate + currentCount;

    const newAllocations = [...allocations];
    newAllocations[index] = {
      categoryId: category.categoryId,
      categoryName: category.name,
      discount: category.discount,
      count: Math.min(
        currentCount,
        maxCount,
        remainingToAllocate + currentCount,
      ),
      finalPricePerTicket: finalPrice,
    };

    onAllocationsChange(newAllocations);
    setError(null);
  };

  const updateAllocationCount = (index: number, count: number) => {
    const allocation = allocations[index];
    if (!allocation) return;
    const category = categoryMap.get(allocation.categoryId);
    if (!category) return;

    const remainingQuota = getRemainingQuota(category);
    const maxAllowed =
      remainingQuota !== null
        ? Math.min(remainingQuota, remainingToAllocate + allocation.count)
        : remainingToAllocate + allocation.count;

    let clampedCount = count;
    if (clampedCount < 1) clampedCount = 1;
    if (clampedCount > maxAllowed) clampedCount = maxAllowed;

    const newAllocations = [...allocations];
    newAllocations[index] = { ...allocation, count: clampedCount };
    onAllocationsChange(newAllocations);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader />
        <span className="text-muted-foreground">Loading categories...</span>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Total tickets input */}
      <div className="space-y-2">
        <label htmlFor="total-tickets" className="text-sm font-medium">
          Total Tickets
        </label>
        <Input
          id="total-tickets"
          type="number"
          min={1}
          max={10}
          value={totalTickets}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value) || 1;
            const clamped = Math.max(1, Math.min(10, value));
            onTotalChange(clamped);
          }}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Maximum 10 tickets per purchase
        </p>
      </div>

      {/* Allocations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Category Allocations</h4>
          <span
            className={`text-xs ${
              remainingToAllocate === 0 ? "text-green-500" : "text-amber-500"
            }`}
          >
            {remainingToAllocate === 0
              ? "All tickets allocated"
              : `${remainingToAllocate} tickets remaining to allocate`}
          </span>
        </div>

        {allocations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No categories selected. Add a category to allocate tickets.
          </p>
        )}

        {allocations.map((allocation, index) => {
          const category = categoryMap.get(allocation.categoryId);
          const remainingQuota = category ? getRemainingQuota(category) : null;
          const discountPercent = allocation.discount / 100;

          return (
            <div
              key={`${allocation.categoryId}-${index}`}
              className="p-3 bg-popover border border-input space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Select
                  value={allocation.categoryId.toString()}
                  onValueChange={(value) =>
                    updateAllocationCategory(index, Number.parseInt(value))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const isUsed = allocations.some(
                        (a, i) =>
                          i !== index && a.categoryId === cat.categoryId,
                      );
                      const soldOut = isSoldOut(cat);
                      const price = getCategoryPrice(cat);
                      const remaining = getRemainingQuota(cat);

                      return (
                        <SelectItem
                          key={cat.categoryId}
                          value={cat.categoryId.toString()}
                          disabled={isUsed || soldOut}
                        >
                          <div className="flex items-center justify-between w-full gap-4 text-sm">
                            <span className="font-medium">{cat.name}</span>
                            <span className="text-green-500">
                              {cat.discount > 0
                                ? `-${cat.discount / 100}%`
                                : ""}
                            </span>
                            <span>
                              {price}{" "}
                              <img
                                src={getCurrencySymbol()}
                                className="h-4 aspect-square inline"
                                alt="currency"
                              />
                            </span>
                            <span
                              className={
                                remaining !== null && remaining < 5
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                              }
                            >
                              {remaining !== null ? `${remaining} left` : "∞"}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={() => removeAllocation(index)}
                  className="p-1 hover:bg-destructive/10 rounded"
                >
                  <img
                    className="h-5 w-5"
                    src="/icons/staff bin_2.svg"
                    alt="remove"
                  />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Count</span>
                  <Input
                    type="number"
                    min={1}
                    max={
                      remainingQuota !== null ? remainingQuota : totalTickets
                    }
                    value={allocation.count}
                    onChange={(e) =>
                      updateAllocationCount(
                        index,
                        Number.parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-24"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Price per ticket
                  </span>
                  <div className="text-sm">
                    {allocation.finalPricePerTicket}{" "}
                    <img
                      src={getCurrencySymbol()}
                      className="h-4 aspect-square inline"
                      alt="currency"
                    />
                    {discountPercent > 0 && (
                      <span className="text-green-500 ml-1">
                        (-{discountPercent}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Subtotal
                  </span>
                  <div className="text-sm font-medium">
                    {allocation.count * allocation.finalPricePerTicket}{" "}
                    <img
                      src={getCurrencySymbol()}
                      className="h-4 aspect-square inline"
                      alt="currency"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
            {error}
          </div>
        )}

        <Button
          filling="outline"
          className="w-full"
          onClick={addAllocation}
          disabled={
            remainingToAllocate <= 0 || allocations.length >= categories.length
          }
        >
          Add Category
          {remainingToAllocate > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({remainingToAllocate} tickets to allocate)
            </span>
          )}
        </Button>
      </div>

      {/* Total price summary */}
      {allocations.length > 0 && (
        <div className="flex justify-between items-center text-sm bg-primary/10 p-3 border border-primary/30">
          <span className="font-medium">Total Price:</span>
          <span className="font-bold text-lg">
            {totalPrice}{" "}
            <img
              src={getCurrencySymbol()}
              className="h-5 aspect-square inline"
              alt="currency"
            />
          </span>
        </div>
      )}
    </div>
  );
};
