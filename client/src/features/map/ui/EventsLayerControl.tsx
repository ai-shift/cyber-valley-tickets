import { Calendar, ChevronRight, MapPin } from "lucide-react";
import { memo } from "react";
import { twMerge } from "tailwind-merge";
import { useMapState } from "../model/slice";

type EventsLayerControlProps = {
  closeGroups: () => void;
};

export const EventsLayerControl: React.FC<EventsLayerControlProps> = memo(
  ({ closeGroups }) => {
    const { events, selectEventPlace } = useMapState();

    return (
      <div className="mb-4">
        {/* Header - not expandable, always shown */}
        <div className="rounded-xl border border-primary/20 shadow-sm p-3 flex items-center gap-3">
          {/* Event indicator icon */}
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>

          {/* Title section */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
              Events
              <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {events.length}
              </span>
            </h3>
          </div>
        </div>

        {/* Content - always expanded */}
        <div className="pt-2 space-y-1">
          {events.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              No active events at the moment
            </div>
          ) : (
            events.map((event, index) => (
              <button
                type="button"
                className={twMerge(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                  "border border-transparent",
                )}
                key={event.id}
                onClick={() => {
                  selectEventPlace(event.placeId);
                  closeGroups();
                }}
              >
                {/* Event image or placeholder */}
                <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {event.imageUrl ? (
                    <img
                      className="h-full w-full object-cover"
                      alt={event.title}
                      src={event.imageUrl}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/5">
                      <Calendar className="h-5 w-5 text-primary/40" />
                    </div>
                  )}
                  {/* Index badge */}
                  <div className="absolute top-0 left-0 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-br">
                    {index + 1}
                  </div>
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-primary truncate">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>View on map</span>
                  </div>
                </div>

                {/* Arrow indicator */}
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  },
);

EventsLayerControl.displayName = "EventsLayerControl";
