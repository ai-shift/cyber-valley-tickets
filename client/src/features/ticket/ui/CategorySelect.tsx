import { eventQueries } from "@/entities/event";
import { getCurrencySymbol } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useQuery } from "@tanstack/react-query";

export interface CategoryOption {
  categoryId: number;
  name: string;
  discount: number;
  quota: number;
  hasQuota: boolean;
  ticketsBought: number;
}

interface CategorySelectProps {
  eventId: number;
  ticketPrice: number;
  selectedCategoryId: number | null;
  onCategorySelect: (category: CategoryOption | null) => void;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  eventId,
  ticketPrice,
  selectedCategoryId,
  onCategorySelect,
}) => {
  const { data: categories, isLoading } = useQuery(
    eventQueries.categories(eventId),
  );

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

  const handleSelect = (value: string) => {
    if (value === "no-category") {
      onCategorySelect(null);
      return;
    }
    const category = categories.find((c) => c.categoryId === Number(value));
    if (category) {
      onCategorySelect(category);
    }
  };

  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.categoryId === selectedCategoryId)
    : null;

  const finalPrice = selectedCategory
    ? getCategoryPrice(selectedCategory)
    : ticketPrice;

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="category-select"
          className="text-sm text-muted-foreground mb-1 block"
        >
          Select Ticket Category
        </label>
        <Select
          name="category-select"
          value={selectedCategoryId?.toString() ?? "no-category"}
          onValueChange={handleSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-category">
              <div className="flex items-center justify-between w-full gap-4">
                <span>Standard Ticket</span>
                <span className="text-muted-foreground">
                  {ticketPrice}{" "}
                  <img
                    src={getCurrencySymbol()}
                    className="h-4 aspect-square inline"
                    alt="currency"
                  />
                </span>
              </div>
            </SelectItem>
            {categories.map((category) => {
              const remaining = getRemainingQuota(category);
              const soldOut = isSoldOut(category);
              const price = getCategoryPrice(category);
              const discountPercent = category.discount / 100;

              return (
                <SelectItem
                  key={category.categoryId}
                  value={category.categoryId.toString()}
                  disabled={soldOut}
                >
                  <div className="flex items-center justify-between w-full gap-4 text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-green-500">
                      {discountPercent > 0 ? `-${discountPercent}%` : ""}
                    </span>
                    <span
                      className={category.discount > 0 ? "text-green-500" : ""}
                    >
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
      </div>

      {selectedCategory && selectedCategory.discount > 0 && (
        <div className="flex justify-between items-center text-sm bg-green-500/10 p-2">
          <span className="text-green-600">You save:</span>
          <span className="text-green-600 font-medium">
            {ticketPrice - finalPrice}{" "}
            <img
              src={getCurrencySymbol()}
              className="h-4 aspect-square inline"
              alt="currency"
            />
          </span>
        </div>
      )}

      <div className="flex justify-between items-center text-lg font-medium pt-2 border-t border-input/20">
        <span>Final Price:</span>
        <span>
          {finalPrice}{" "}
          <img
            src={getCurrencySymbol()}
            className="h-6 aspect-square inline"
            alt="currency"
          />
        </span>
      </div>
    </div>
  );
};
