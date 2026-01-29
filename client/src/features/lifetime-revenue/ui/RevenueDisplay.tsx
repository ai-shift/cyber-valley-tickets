import { eventQueries } from "@/entities/event";
import { useQuery } from "@tanstack/react-query";

interface RevenueDisplayProps {
  eventId: number;
}

export const RevenueDisplay: React.FC<RevenueDisplayProps> = ({ eventId }) => {
  const { data: revenue, isLoading } = useQuery(
    eventQueries.lifetimeRevenue(eventId),
  );

  const formatAmount = (amount: number | undefined) => {
    if (amount === undefined) return "0.00";
    // Convert from 6 decimals (USDT) to human readable
    return (amount / 1_000_000).toFixed(2);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading revenue data...</div>;
  }

  if (!revenue) {
    return <div className="text-center py-4">No revenue data available</div>;
  }

  const { totalRevenue, ticketRevenue, deposit, ticketsSold } = revenue;

  return (
    <div className="bg-secondary/10 p-6 rounded-lg space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Total Revenue</p>
        <p className="text-3xl font-bold text-primary">
          {formatAmount(totalRevenue)} USDT
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Ticket Sales</p>
          <p className="text-lg font-semibold">
            {formatAmount(ticketRevenue)} USDT
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Deposit</p>
          <p className="text-lg font-semibold">{formatAmount(deposit)} USDT</p>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">Tickets Sold</p>
        <p className="text-lg font-semibold">{ticketsSold}</p>
      </div>
    </div>
  );
};
