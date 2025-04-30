import { eventQueries } from "@/entities/event";
import { PageContainer } from "@/shared/ui/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { format, fromUnixTime } from "date-fns";
import { useNavigate, useParams } from "react-router";

export const EventsDetailsPage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  if (eventId === undefined) {
    console.error("Give me eventId");
    navigate(-1);
    return;
  }

  const numericEventId: number = +eventId;
  const { data, error, isFetching } = useQuery(
    eventQueries.detail(numericEventId),
  );
  if (isFetching) return <p>Loading</p>;
  if (error || !data) return <p>Something went wrong</p>;

  const {
    imageUrl,
    title,
    description,
    place,
    ticketPrice,
    startDateTimestamp,
  } = data;

  return (
    <PageContainer name={title}>
      <img
        src={
          imageUrl ??
          "https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg"
        }
        alt={title}
      />
      <div className="flex justify-between items-center">
        <p>{place.title}</p>
        <p>{format(fromUnixTime(startDateTimestamp / 1000), "d MMM yyy")}</p>
      </div>
      <p>{description}</p>
      <p>{ticketPrice}</p>
    </PageContainer>
  );
};
