import type { LatLng } from "@/entities/geodata";
import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

type MouseClickEvent = {
  domEvent: MouseClickEvent;
  latLng: google.maps.LatLng;
};

type HandlerProps = {
  onLongPressMs?: number;
  onLongPress?: (latLng: LatLng) => void;
};

export const MapLongPressHandler: React.FC<HandlerProps> = ({
  onLongPressMs = 500,
  onLongPress,
}) => {
  const map = useMap();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pressedRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pressedRef.current = false;
    };

    const onMouseDown = (e: MouseClickEvent) => {
      pressedRef.current = true;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (pressedRef.current) {
          if (onLongPress && e && e.latLng) {
            const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            onLongPress(coords);
            map.panTo(coords);
          }
        }
      }, onLongPressMs);
    };

    const onMouseUp = () => clearTimer();
    const onDragStart = () => clearTimer();

    const listeners = [
      map.addListener("mousedown", onMouseDown),
      map.addListener("mouseup", onMouseUp),
      map.addListener("dragstart", onDragStart),
    ];

    return () => {
      clearTimer();
      for (const listener of listeners) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [map, onLongPressMs, onLongPress]);

  return null;
};
