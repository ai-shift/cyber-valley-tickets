import { eventQueries } from "@/entities/event";
import type { TicketAllocation } from "@/entities/order";
import { getCurrencySymbol } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

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
  allocations: TicketAllocation[];
  onAllocationsChange: (allocations: TicketAllocation[]) => void;
}

export const CategoryAllocation: React.FC<CategoryAllocationProps> = ({
  eventId,
  ticketPrice,
  allocations,
  onAllocationsChange,
}) => {
  const { data: categories, isLoading } = useQuery(
    eventQueries.categories(eventId),
  );

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

  const isSoldOut = (category: CategoryOption | undefined): boolean => {
    if (!category) return true;
    if (!category.hasQuota) return false;
    return category.ticketsBought >= category.quota;
  };

  const getAllocationCount = (categoryId: number): number => {
    const allocation = allocations.find((a) => a.categoryId === categoryId);
    return allocation?.count ?? 0;
  };

  const updateCategoryCount = (categoryId: number, delta: number) => {
    const category = categoryMap.get(categoryId);
    if (!category) return;

    const currentCount = getAllocationCount(categoryId);
    const remainingQuota = getRemainingQuota(category);
    const maxAllowed = remainingQuota !== null ? remainingQuota : 10;

    const newCount = Math.max(0, Math.min(currentCount + delta, maxAllowed));

    const newAllocations = allocations.filter(
      (a) => a.categoryId !== categoryId,
    );

    if (newCount > 0) {
      const finalPrice = getCategoryPrice(category);
      newAllocations.push({
        categoryId: category.categoryId,
        categoryName: category.name,
        discount: category.discount,
        count: newCount,
        finalPricePerTicket: finalPrice,
      });
    }

    onAllocationsChange(newAllocations);
  };

  useEffect(() => {
    if (categories && categories.length > 0 && allocations.length === 0) {
      const firstCategory = categories[0];
      if (firstCategory && !isSoldOut(firstCategory)) {
        const finalPrice = getCategoryPrice(firstCategory);
        onAllocationsChange([
          {
            categoryId: firstCategory.categoryId,
            categoryName: firstCategory.name,
            discount: firstCategory.discount,
            count: 1,
            finalPricePerTicket: finalPrice,
          },
        ]);
      }
    }
  }, [categories]);

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
    <div className="space-y-2">
      {categories.map((category) => {
        const price = getCategoryPrice(category);
        const remaining = getRemainingQuota(category);
        const count = getAllocationCount(category.categoryId);
        const soldOut = isSoldOut(category);

        return (
          <div
            key={category.categoryId}
            className="flex items-center justify-between py-3 border-b border-input last:border-b-0"
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">{category.name}</span>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                    remaining !== null && remaining < 5 ? "text-red-500" : ""
                  }
                >
                  {remaining !== null ? `${remaining} left` : "∞"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                filling="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateCategoryCount(category.categoryId, 1)}
                disabled={soldOut || (remaining !== null && remaining <= count)}
              >
                +
              </Button>
              <span className="w-8 text-center font-medium">{count}</span>
              <Button
                filling="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateCategoryCount(category.categoryId, -1)}
                disabled={count <= 0}
              >
                -
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
