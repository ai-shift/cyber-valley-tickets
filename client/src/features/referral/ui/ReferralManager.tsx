import { useOrderStore } from "@/entities/order";
import {
  ReferralDisplay,
  ReferralInput,
  useReferralStorage,
} from "@/features/referral";

export const ReferralManager: React.FC = () => {
  const { address, setReferral, clearReferral } = useReferralStorage();
  const { order } = useOrderStore();

  // Only show for ticket purchases
  if (order?.type !== "buy_ticket") return null;

  const handleSetReferral = (newAddress: string) => {
    setReferral(newAddress);
  };

  return (
    <article className="card border-primary/30">
      <h3 className="text-lg font-semibold mb-3">Referral Code</h3>
      {address ? (
        <ReferralDisplay address={address} onClear={clearReferral} />
      ) : (
        <ReferralInput onSubmit={handleSetReferral} />
      )}
    </article>
  );
};
