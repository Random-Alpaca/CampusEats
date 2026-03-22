import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Locate } from "lucide-react";
import type { Event } from "../data/events";

interface MapPanelProps {
  events: Event[];
  hoveredEventId: string | null;
  onEventHover: (id: string | null) => void;
  onEventClick: (event: Event) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Campus center (UCLA area)
const CENTER: [number, number] = [-118.4445, 34.0700];
const ZOOM = 15.5;

export function MapPanel({
  events,
  hoveredEventId,
  onEventHover,
  onEventClick,
}: MapPanelProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: CENTER,
      zoom: ZOOM,
    });

    m.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    // Ensure tiles render after the container has been laid out
    m.on("load", () => m.resize());

    // Mapbox doesn't auto-resize when container div resizes (only on window resize)
    // So we use a ResizeObserver to explicitly resize the map when the panel width changes
    const resizeObserver = new ResizeObserver(() => {
      m.resize();
    });
    resizeObserver.observe(mapContainer.current);

    map.current = m;

    return () => {
      resizeObserver.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);

  // Create/update markers when events change
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    events.forEach((event, index) => {
      const el = document.createElement("div");
      el.className = "mapbox-numbered-marker";
      el.dataset.eventId = event.id;
      el.textContent = String(index + 1);

      // Click handler
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onEventClick(event);
      });

      // Hover handlers
      el.addEventListener("mouseenter", () => {
        onEventHover(event.id);
        showPopup(event);
      });

      el.addEventListener("mouseleave", () => {
        onEventHover(null);
        hidePopup();
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([event.lng, event.lat])
        .addTo(map.current!);

      markersRef.current.set(event.id, marker);
    });
  }, [events, onEventClick, onEventHover]);

  const showPopup = useCallback((event: Event) => {
    if (!map.current) return;
    hidePopup();

    const html = `
      <div class="map-popup">
        <div class="map-popup-title">${event.name}</div>
        <div class="map-popup-org">${event.organization}</div>
        <div class="map-popup-details">
          <span>${event.date}</span>
          <span>${event.time}</span>
        </div>
        <div class="map-popup-location">${event.location}</div>
        ${event.foodType ? `<div class="map-popup-food">Free ${event.foodType}</div>` : ""}
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 16,
      className: "map-popup-container",
    })
      .setLngLat([event.lng, event.lat])
      .setHTML(html)
      .addTo(map.current);
  }, []);

  const hidePopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  // Highlight marker when hovering from the list panel
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === hoveredEventId) {
        el.classList.add("marker-highlighted");
        // Show popup for hovered event from list
        const event = events.find((e) => e.id === id);
        if (event) showPopup(event);
      } else {
        el.classList.remove("marker-highlighted");
      }
    });

    if (!hoveredEventId) {
      hidePopup();
    }
  }, [hoveredEventId, events, showPopup, hidePopup]);

        const handleRecenter = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (!map.current) return;

          if (events.length === 0) {
            map.current.flyTo({ center: CENTER, zoom: ZOOM, duration: 1000 });
            return;
          }

          const bounds = new mapboxgl.LngLatBounds();
          events.forEach((event) => {
            bounds.extend([event.lng, event.lat]);
          });

          map.current.fitBounds(bounds, {
            padding: 50,
            duration: 1000,
            maxZoom: 16,
          });
        };

        return (
          <>
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ width: '100%', height: '100%' }} />
            {/* Recenter button */}
            <button
              onClick={handleRecenter}
              className="absolute bottom-8 right-3 z-20 bg-white border border-gray-300 rounded-md p-1.5 shadow-sm hover:bg-gray-50 transition-colors"
              title="Recenter map"
            >
              <Locate className="w-4 h-4 text-gray-700" />
            </button>
            <style>{`
        .mapbox-numbered-marker {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ea580c;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Geist', sans-serif;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          transition: transform 0.15s, background 0.15s;
        }
        .mapbox-numbered-marker:hover,
        .mapbox-numbered-marker.marker-highlighted {
          transform: scale(1.3);
          background: #c2410c;
          z-index: 10 !important;
        }

        .map-popup-container .mapboxgl-popup-content {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .map-popup-container .mapboxgl-popup-tip {
          border-top-color: white;
        }
        .map-popup {
          padding: 12px 14px;
          min-width: 180px;
          max-width: 240px;
          font-family: 'Geist', sans-serif;
        }
        .map-popup-title {
          font-weight: 700;
          font-size: 13px;
          color: #111827;
          margin-bottom: 2px;
        }
        .map-popup-org {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .map-popup-details {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: #374151;
          margin-bottom: 3px;
        }
        .map-popup-location {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .map-popup-food {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 8px;
          background: #fff7ed;
          color: #ea580c;
          font-size: 10px;
          font-weight: 600;
          border-radius: 9999px;
          border: 1px solid #fed7aa;
        }
      `}</style>
    </>
  );
}
