import { EventDetails } from "@/features/event-details";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";

export const EventsDetailsPage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  if (eventId === undefined) return <Navigate to={"/events"} />;
  const numericId = Number(eventId);

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

  return (
    <PageContainer name="Event Details" onBack={handleBack}>
      <EventDetails eventId={numericId} />
    </PageContainer>
  );
};
