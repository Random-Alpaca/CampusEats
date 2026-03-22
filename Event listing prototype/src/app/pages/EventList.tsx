import { useState } from "react";
import { Link } from "react-router";
import { Map, Search } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { EventDetailModal } from "../components/EventDetailModal";
import { Button } from "../components/ui/button";
import { mockEvents } from "../data/events";
import { Layout } from "../components/Layout";
import type { Event } from "../data/events";

const FOOD_FILTERS = [
  { key: "all", label: "All Events", emoji: "✨" },
  { key: "food", label: "Food Events", emoji: "🍽️" },
  { key: "pizza", label: "Pizza", emoji: "🍕" },
  { key: "drinks", label: "Drinks", emoji: "☕" },
  { key: "snacks", label: "Snacks", emoji: "🍿" },
] as const;

type FilterKey = typeof FOOD_FILTERS[number]["key"];

export function EventList() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch =
      !searchQuery ||
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organization?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "food") return event.foodAvailable && matchesSearch;
    if (filter === "pizza")
      return event.foodType?.toLowerCase().includes("pizza") && matchesSearch;
    if (filter === "drinks")
      return (
        (event.foodType?.toLowerCase().includes("coffee") ||
          event.foodType?.toLowerCase().includes("drink")) &&
        matchesSearch
      );
    if (filter === "snacks")
      return event.foodType?.toLowerCase().includes("snack") && matchesSearch;
    return matchesSearch;
  });

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-3">
                <span>🗓️</span> Today's Events
              </div>
              <h1 className="text-4xl font-black text-gray-900 mb-1">Campus Events</h1>
              <p className="text-gray-400">Find free food and fun happening around campus</p>
            </div>
            <Link to="/map">
              <Button variant="outline" className="rounded-2xl border-orange-200 text-orange-600 hover:bg-orange-50 gap-2">
                <Map className="w-4 h-4" />
                Map View
              </Button>
            </Link>
          </div>

          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events or clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-orange-200 bg-white text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent text-sm shadow-sm"
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {FOOD_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 border ${
                  filter === f.key
                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200"
                    : "bg-white text-gray-500 border-orange-100 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-400">
            Showing <span className="font-bold text-gray-600">{filteredEvents.length}</span>{" "}
            {filter === "all" ? "events" : "food events"}
          </p>
          {filter !== "all" && filteredEvents.length === 0 && (
            <button
              onClick={() => setFilter("all")}
              className="text-sm text-orange-500 hover:underline font-medium"
            >
              Clear filter
            </button>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😢</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-400 mb-4">Try a different filter or check back later</p>
            <Button
              onClick={() => { setFilter("all"); setSearchQuery(""); }}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl"
            >
              Show all events
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                {/* Food badge on card */}
                <div className="relative">
                  {event.foodAvailable && (
                    <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span>🍽️</span> Free Food!
                    </div>
                  )}
                  <div className="group-hover:-translate-y-1 transition-transform duration-200">
                    <EventCard
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
      `}</style>
    </Layout>
  );
}
