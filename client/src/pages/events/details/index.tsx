import { useAuthSlice } from "@/app/providers";
import { eventQueries } from "@/entities/event";
import { EventDetails } from "@/features/event-details";
import { PageContainer } from "@/shared/ui/PageContainer";
import { useQuery } from "@tanstack/react-query";
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
          className="cursor-pointer text-primary"
          aria-label="Share event"
          onClick={() => {
            void handleShare();
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-current"
          >
            <path d="M21.707,11.293l-8-8A.99991.99991,0,0,0,12,4V7.54492A11.01525,11.01525,0,0,0,2,18.5V20a1,1,0,0,0,1.78418.62061,11.45625,11.45625,0,0,1,7.88672-4.04932c.0498-.00635.1748-.01611.3291-.02588V20a.99991.99991,0,0,0,1.707.707l8-8A.99962.99962,0,0,0,21.707,11.293ZM14,17.58594V15.5a.99974.99974,0,0,0-1-1c-.25488,0-1.2959.04932-1.56152.085A14.00507,14.00507,0,0,0,4.05176,17.5332,9.01266,9.01266,0,0,1,13,9.5a.99974.99974,0,0,0,1-1V6.41406L19.58594,12Z" />
          </svg>
        </button>
      }
    >
      <EventDetails eventId={numericId} />
    </PageContainer>
  );
};
