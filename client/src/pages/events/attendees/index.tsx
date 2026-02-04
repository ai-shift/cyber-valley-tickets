import { EventAttendees } from "@/features/event-attendees";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Navigate, useParams } from "react-router";

const SEARCH_PARAM_NAME = "search";

export const EventAttendeesPage: React.FC = () => {
  const { eventId } = useParams();
  if (eventId === undefined) return <Navigate to={"/events"} />;
  return (
    <PageContainer name="Event Attendees">
      <div className="flex flex-col gap-4 px-3">
        <SearchBar
          paramName={SEARCH_PARAM_NAME}
          placeholder="Search attendees by address, ENS, or socials..."
        />
        <EventAttendees
          eventId={Number(eventId)}
          searchParamName={SEARCH_PARAM_NAME}
        />
      </div>
    </PageContainer>
  );
};
