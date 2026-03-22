import { useState, useEffect, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { EventDetailModal } from "../components/EventDetailModal";
import { MapPanel } from "../components/MapPanel";
import { Layout } from "../components/Layout";
import { fetchEvents } from "../services/api";
import type { Event } from "../services/api";

const FOOD_FILTERS = [
  { key: "all", label: "All" },
  { key: "food", label: "Food Events" },
  { key: "pizza", label: "Pizza" },
  { key: "tacos", label: "Tacos" },
  { key: "snacks", label: "Snacks" },
  { key: "drinks", label: "Drinks" },
] as const;

type FilterKey = (typeof FOOD_FILTERS)[number]["key"];

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    fetchEvents()
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load events:", err);
        setError("Could not load events. Is the backend running?");
        setLoading(false);
      });
  }, []);

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    if (filter === "food") return event.foodAvailable;
    if (filter === "pizza")
      return event.foodType?.toLowerCase().includes("pizza");
    if (filter === "tacos")
      return event.foodType?.toLowerCase().includes("taco");
    if (filter === "drinks")
      return (
        event.foodType?.toLowerCase().includes("coffee") ||
        event.foodType?.toLowerCase().includes("drink")
      );
    if (filter === "snacks")
      return event.foodType?.toLowerCase().includes("snack");
    return true;
  });

  const listWidth = mapExpanded ? "w-[340px]" : "w-[55%]";
  const mapWidth = mapExpanded ? "flex-1" : "w-[45%]";

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event);
  }, []);

  const handleEventHover = useCallback((id: string | null) => {
    setHoveredEventId(id);
  }, []);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-56px)]">
        {/* LEFT PANEL — Event List */}
        <div
          className={`${listWidth} border-r border-gray-200 flex flex-col min-w-0 bg-white relative`}
        >
          {/* Decorative blob shapes */}
          <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full bg-orange-200/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-40px] left-[-40px] w-64 h-64 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0 relative z-10">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              All food events near campus
            </h1>
            <p className="text-xs text-gray-500 mb-3">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredEvents.length}
              </span>{" "}
              results
            </p>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {FOOD_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filter === f.key
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable event list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-16 px-5">
                <p className="text-sm text-gray-400">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 px-5">
                <h3 className="text-base font-semibold text-red-600 mb-1">
                  Error
                </h3>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-16 px-5">
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  No events found
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Try a different filter or check back later
                </p>
                <button
                  onClick={() => setFilter("all")}
                  className="text-sm text-orange-600 hover:underline font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    number={index + 1}
                    onClick={() => setSelectedEvent(event)}
                    onMouseEnter={() => setHoveredEventId(event.id)}
                    onMouseLeave={() => setHoveredEventId(null)}
                    isHighlighted={hoveredEventId === event.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Mapbox Map */}
        <div
          className={`${mapWidth} relative`}
        >
          <MapPanel
            events={filteredEvents}
            hoveredEventId={hoveredEventId}
            onEventHover={handleEventHover}
            onEventClick={handleEventClick}
          />

          {/* Expand/collapse button */}
          <button
            onClick={() => setMapExpanded(!mapExpanded)}
            className="absolute top-3 right-3 z-20 bg-white border border-gray-300 rounded-md p-1.5 shadow-sm hover:bg-gray-50 transition-colors"
            title={mapExpanded ? "Collapse map" : "Expand map"}
          >
            {mapExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-600" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </Layout>
  );
}
