import { placesQueries } from "@/entities/place";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ManageItem } from "@/widgets/ManageItem";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { NavigateUpdatePlace } from "../ui/NavigateUpdatePlace.tsx";
import { ManageRequestedPlace } from "./ManageRequestedPlace.tsx";

interface PlacesListProps {
  searchParamName?: string;
}

export const PlacesList: React.FC<PlacesListProps> = ({
  searchParamName = "search",
}) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get(searchParamName) || undefined;

  const {
    data: places,
    isLoading,
    error,
  } = useQuery(placesQueries.list(searchQuery));

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!places)
    return (
      <ErrorMessage errors={new Error("Some problem with getting places")} />
    );

  return (
    <ul className="divide-y divide-secondary/60 py-2">
      {places.map((place) => (
        <ManageItem
          key={place.id}
          title={place.title}
          isRequested={place.status === "submitted"}
          render={() => [
            <ManageRequestedPlace key="manrepla" place={place} />,
            <NavigateUpdatePlace key={place.id} place={place} />,
          ]}
        />
      ))}
    </ul>
  );
};
