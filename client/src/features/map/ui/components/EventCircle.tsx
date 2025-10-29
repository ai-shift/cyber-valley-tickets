import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

type EventCircleProps = {
  center: google.maps.LatLngLiteral;
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWeight: number;
  onClick?: () => void;
};

export const EventCircle: React.FC<EventCircleProps> = ({
  center,
  radius,
  fillColor,
  strokeColor,
  strokeWeight,
  onClick,
}) => {
  const map = useMap();
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      center,
      radius,
      fillColor,
      fillOpacity: 0.8,
      strokeColor,
      strokeWeight,
      map,
    });

    circleRef.current = circle;

    class TextOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      private position: google.maps.LatLngLiteral;
      private radius: number;

      constructor(position: google.maps.LatLngLiteral, radius: number) {
        super();
        this.position = position;
        this.radius = radius;
      }

      onAdd() {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.transform = "translate(-50%, -50%)";
        div.style.pointerEvents = "none";
        div.innerHTML = `<span style="color: black; font-weight: bold; line-height: 1;">E</span>`;

        this.div = div;
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(div);
      }

      draw() {
        if (!this.div) return;
        const overlayProjection = this.getProjection();
        const map = this.getMap() as google.maps.Map;

        if (!map) return;

        const centerPos = overlayProjection.fromLatLngToDivPixel(
          new google.maps.LatLng(this.position.lat, this.position.lng),
        );

        // Calculate circle radius in pixels at current zoom
        const scale = Math.pow(2, map.getZoom() || 0);
        const metersPerPixel =
          (156543.03392 * Math.cos((this.position.lat * Math.PI) / 180)) /
          scale;
        const radiusInPixels = this.radius / metersPerPixel;

        // Scale font size based on circle size
        const fontSize = Math.max(12, Math.min(32, radiusInPixels * 0.8));

        if (centerPos) {
          this.div.style.left = `${centerPos.x}px`;
          this.div.style.top = `${centerPos.y}px`;
          const span = this.div.querySelector("span") as HTMLSpanElement;
          if (span) {
            span.style.fontSize = `${fontSize}px`;
          }
        }
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode?.removeChild(this.div);
          this.div = null;
        }
      }

      updatePosition(position: google.maps.LatLngLiteral) {
        this.position = position;
        this.draw();
      }
    }

    const overlay = new TextOverlay(center, radius);
    overlay.setMap(map);
    overlayRef.current = overlay;

    if (onClick) {
      const listener = circle.addListener("click", onClick);
      return () => {
        google.maps.event.removeListener(listener);
        circle.setMap(null);
        overlay.setMap(null);
      };
    }

    return () => {
      circle.setMap(null);
      overlay.setMap(null);
    };
  }, [map, center, radius, fillColor, strokeColor, strokeWeight, onClick]);

  return null;
};
