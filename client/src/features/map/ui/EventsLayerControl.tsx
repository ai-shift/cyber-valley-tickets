import { Expandable } from "@/shared/ui/expandable/ui/Expandable";
import { ExpandableContent } from "@/shared/ui/expandable/ui/ExpandableContent";
import { ExpandableTrigger } from "@/shared/ui/expandable/ui/ExpandableTrigger";
import { memo } from "react";
import { twMerge } from "tailwind-merge";
import { useMapState } from "../model/slice";

type EventsLayerControlProps = {
  closeGroups: () => void;
}

export const EventsLayerControl: React.FC<EventsLayerControlProps> = memo(({closeGroups}) => {
  const { events, selectEventPlace } = useMapState();

  return (
    <Expandable defaultOpened>
      <ExpandableTrigger className="capitalize flex gap-3 text-xl items-center w-full">
        {({ isCurrentExpanded }: { isCurrentExpanded: boolean }) => (
          <>
            <input type="checkbox" readOnly checked={true} />
            <img
              className={twMerge(
                "h-4 transition-all duration-300",
                isCurrentExpanded && "rotate-90",
              )}
              alt="chevrone"
              src="/icons/chevrone_right.svg"
            />
            <p className="font-bold">Events</p>
          </>
        )}
      </ExpandableTrigger>
      <ExpandableContent>
        <div className="flex flex-col items-start">
          {events.map((event) => (
            <button
              type="button"
              className="flex gap-1 items-center justify-center"
              key={event.id}
              onClick={() => {
                selectEventPlace(event.placeId)
                closeGroups()
                }
              }
            >
              <img
                className="aspect-square h-6"
                alt={event.title}
                src={event.imageUrl ?? ""}
              />
              <p className="text-lg">{event.title}</p>
            </button>
          ))}
        </div>
      </ExpandableContent>
    </Expandable>
  );
});
