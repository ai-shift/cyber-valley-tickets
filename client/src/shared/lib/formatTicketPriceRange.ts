import { getCurrencySymbol } from "@/shared/lib/web3";

/**
 * Ticket price range as returned from the API.
 * The API returns { [key: string]: number | null } but we expect { min: number | null, max: number | null }
 */
type ApiTicketPriceRange = {
  [key: string]: number | null;
};

/**
 * Formats the ticket price range for display.
 * Shows "from <min>" format.
 * Returns null if no tickets are available (all categories sold out).
 *
 * @param priceRange - Object containing min and max prices from API
 * @returns Formatted price string with currency symbol, or null if unavailable
 */
export function formatTicketPriceRange(
  priceRange: ApiTicketPriceRange | undefined,
): string | null {
  if (!priceRange) {
    return null;
  }

  const min = priceRange.min;

  // All categories sold out
  if (min === null) {
    return null;
  }

  const currencySymbol = getCurrencySymbol();

  // Always show "from <min>" format
  return `from ${min} ${currencySymbol}`;
}

/**
 * Gets a simple display string for the ticket price range without currency symbol.
 * Used when the currency symbol is displayed separately.
 *
 * @param priceRange - Object containing min and max prices from API
 * @returns Formatted price string (e.g., "from 50"), or null if unavailable
 */
export function getTicketPriceRangeDisplay(
  priceRange: ApiTicketPriceRange | undefined,
): string | null {
  if (!priceRange) {
    return null;
  }

  const min = priceRange.min;

  // All categories sold out
  if (min === null) {
    return null;
  }

  // Always show "from <min>" format
  return `from ${min}`;
}
