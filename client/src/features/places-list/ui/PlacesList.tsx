import { placesQueries } from "@/entities/place";
import { NavigateUpdatePlace } from "@/features/create-edit-place/ui/NavigateUpdatePlace";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { ManageItem } from "@/widgets/ManageItem";
import { useQuery } from "@tanstack/react-query";

export const PlacesList: React.FC = () => {
  const { data: places, isLoading, error } = useQuery(placesQueries.list());

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
          render={() => [<NavigateUpdatePlace key={place.id} place={place} />]}
        />
      ))}
    </ul>
  );
};
