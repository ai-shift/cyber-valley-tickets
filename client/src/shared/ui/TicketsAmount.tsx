import { pluralTickets } from "@/shared/lib/pluralDays";
import { cn } from "@/shared/lib/utils";

type TicketsAmountProps = {
  count: number;
  className?: string;
  showNumber?: boolean;
  prefix?: string;
  suffix?: string;
};

/**
 * Unified component for rendering ticket amounts with proper pluralization.
 *
 * @example
 * <TicketsAmount count={1} /> // renders: "1 ticket"
 * <TicketsAmount count={5} /> // renders: "5 tickets"
 * <TicketsAmount count={3} prefix="Available:" /> // renders: "Available: 3 tickets"
 * <TicketsAmount count={2} suffix="left" /> // renders: "2 tickets left"
 */
export const TicketsAmount: React.FC<TicketsAmountProps> = ({
  count,
  className,
  showNumber = true,
  prefix,
  suffix,
}) => {
  const text = showNumber
    ? pluralTickets(count)
    : `ticket${count === 1 ? "" : "s"}`;

  return (
    <span className={cn(className)}>
      {prefix && `${prefix} `}
      {text}
      {suffix && ` ${suffix}`}
    </span>
  );
};

/**
 * Simpler version that only returns the pluralized word "ticket" or "tickets"
 * without the number.
 *
 * @example
 * <TicketsWord count={1} /> // renders: "ticket"
 * <TicketsWord count={5} /> // renders: "tickets"
 */
export const TicketsWord: React.FC<{ count: number; className?: string }> = ({
  count,
  className,
}) => {
  return (
    <span className={cn(className)}>{count === 1 ? "ticket" : "tickets"}</span>
  );
};
