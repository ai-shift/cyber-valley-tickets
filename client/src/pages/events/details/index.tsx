import { useAuthSlice } from "@/app/providers";
import { eventQueries } from "@/entities/event";
import { EventDetails } from "@/features/event-details";
import { PageContainer } from "@/shared/ui/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";

export const EventsDetailsPage: React.FC = () => {
  const { eventId } = useParams();
  const { user } = useAuthSlice();
  const navigate = useNavigate();
  const location = useLocation();

  if (eventId === undefined) return <Navigate to={"/events"} />;
  const numericId = Number(eventId);
  const { data: event } = useQuery(eventQueries.detail(numericId));

  // Check if we came from the txhash placeholder page
  const fromTxHash = location.state?.fromTxHash === true;

  const handleBack = () => {
    if (fromTxHash) {
      // Navigate to home instead of back in history
      navigate("/", { replace: true });
    } else {
      // Default back behavior
      navigate(-1);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = new URL(window.location.href);
      if (user?.address) {
        shareUrl.searchParams.set("ref", user.address);
      } else {
        shareUrl.searchParams.delete("ref");
      }

      const url = shareUrl.toString();
      if (navigator.share) {
        await navigator.share({
          title: event?.title,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
    } catch {
      // Ignore share/copy cancellation errors.
    }
  };

  return (
    <PageContainer
      name="Event Details"
      onBack={handleBack}
      rightSlot={
        <button
          type="button"
          className="cursor-pointer"
          aria-label="Share event"
          onClick={() => {
            void handleShare();
          }}
        >
          <Share2 size={24} />
        </button>
      }
    >
      <EventDetails eventId={numericId} />
    </PageContainer>
  );
};
