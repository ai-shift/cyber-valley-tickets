import { eventQueries } from "@/entities/event";
import { Button } from "@/shared/ui/button";
import { useQuery } from "@tanstack/react-query";

interface LifetimeRevenueButtonProps {
  eventId: number;
  onClick?: () => void;
}

export const LifetimeRevenueButton: React.FC<LifetimeRevenueButtonProps> = ({
  eventId,
  onClick,
}) => {
  const { data: revenue } = useQuery(eventQueries.lifetimeRevenue(eventId));

  const formatRevenue = (amount: number | undefined) => {
    if (amount === undefined) return "0";
    // Convert from 6 decimals (USDT) to human readable
    return (amount / 1_000_000).toFixed(2);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <span>Lifetime Revenue:</span>
      <span className="font-bold">
        {formatRevenue(revenue?.totalRevenue)} USDT
      </span>
    </Button>
  );
};
