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
 * Shows "<min> - <max>" format, or just the price if min === max.
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
  const max = priceRange.max;

  // All categories sold out
  if (min === null || max === null) {
    return null;
  }

  const currencySymbol = getCurrencySymbol();

  // Single price (no range)
  if (min === max) {
    return `${min} ${currencySymbol}`;
  }

  // Price range
  return `${min} - ${max} ${currencySymbol}`;
}

/**
 * Gets a simple display string for the ticket price range without currency symbol.
 * Used when the currency symbol is displayed separately.
 *
 * @param priceRange - Object containing min and max prices from API
 * @returns Formatted price string (e.g., "50 - 90"), or null if unavailable
 */
export function getTicketPriceRangeDisplay(
  priceRange: ApiTicketPriceRange | undefined,
): string | null {
  if (!priceRange) {
    return null;
  }

  const min = priceRange.min;
  const max = priceRange.max;

  // All categories sold out
  if (min === null || max === null) {
    return null;
  }

  // Single price (no range)
  if (min === max) {
    return `${min}`;
  }

  // Price range
  return `${min} - ${max}`;
}
