import { useState } from "react";
import { Link } from "react-router";
import { List, X, Pizza, Coffee, Croissant, Popcorn, Apple, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Layout } from "../components/Layout";
import { mockEvents } from "../data/events";
import type { Event } from "../data/events";

const getFoodIcon = (foodType: string | undefined) => {
  if (!foodType) return Apple;
  const type = foodType.toLowerCase();
  if (type.includes("pizza")) return Pizza;
  if (type.includes("coffee") || type.includes("donut")) return Coffee;
  if (type.includes("breakfast")) return Croissant;
  if (type.includes("popcorn")) return Popcorn;
  return Apple;
};

const getFoodEmoji = (foodType: string | undefined) => {
  if (!foodType) return "🍎";
  const type = foodType.toLowerCase();
  if (type.includes("pizza")) return "🍕";
  if (type.includes("taco")) return "🌮";
  if (type.includes("coffee")) return "☕";
  if (type.includes("donut")) return "🍩";
  if (type.includes("breakfast")) return "🥐";
  if (type.includes("popcorn")) return "🍿";
  return "🍽️";
};

const getMarkerColor = (event: Event, isSelected: boolean) => {
  if (!event.foodAvailable) return { bg: "#e2e8f0", border: "#94a3b8", text: "#475569" };
  const type = event.foodType?.toLowerCase() || "";
  if (type.includes("pizza")) return { bg: isSelected ? "#fb923c" : "#fed7aa", border: "#ea580c", text: "#7c2d12" };
  if (type.includes("taco")) return { bg: isSelected ? "#fbbf24" : "#fef3c7", border: "#d97706", text: "#78350f" };
  if (type.includes("coffee") || type.includes("donut")) return { bg: isSelected ? "#a16207" : "#fef9c3", border: "#ca8a04", text: "#713f12" };
  if (type.includes("breakfast")) return { bg: isSelected ? "#f97316" : "#ffedd5", border: "#ea580c", text: "#7c2d12" };
  if (type.includes("popcorn")) return { bg: isSelected ? "#eab308" : "#fefce8", border: "#ca8a04", text: "#713f12" };
  return { bg: isSelected ? "#84cc16" : "#f0fdf4", border: "#65a30d", text: "#365314" };
};

export function MapView() {
  const [showFoodOnly, setShowFoodOnly] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const eventsToShow = showFoodOnly
    ? mockEvents.filter((event) => event.foodAvailable)
    : mockEvents;

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🗺️</span>
                <h1 className="text-2xl font-black text-gray-900">Campus Events Map</h1>
              </div>
              <p className="text-sm text-gray-400 ml-8">
                <span className="font-semibold text-orange-500">{eventsToShow.length}</span> events on campus right now
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFoodOnly(!showFoodOnly)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border transition-all ${
                  showFoodOnly
                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200"
                    : "bg-white text-gray-500 border-orange-200 hover:border-orange-400"
                }`}
              >
                🍽️ {showFoodOnly ? "Show All" : "Food Only"}
              </button>
              <Link to="/events">
                <Button variant="outline" className="rounded-2xl border-orange-200 text-orange-600 hover:bg-orange-50 gap-2">
                  <List className="w-4 h-4" />
                  List View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-amber-50/50" style={{ height: "calc(100vh - 200px)" }}>
        <svg className="w-full h-full" viewBox="0 0 800 600">
          {/* Background */}
          <rect x="0" y="0" width="800" height="600" fill="#fefce8" />

          {/* Grass / open areas */}
          <ellipse cx="400" cy="300" rx="320" ry="240" fill="#f0fdf4" opacity="0.6" />

          {/* Campus paths */}
          <path d="M 50 300 L 750 300" stroke="#fde68a" strokeWidth="10" strokeLinecap="round" />
          <path d="M 400 50 L 400 560" stroke="#fde68a" strokeWidth="10" strokeLinecap="round" />
          <path d="M 150 150 L 650 450" stroke="#fde68a" strokeWidth="6" strokeLinecap="round" opacity="0.5" />

          {/* Campus buildings - cute rounded rectangles */}
          {[
            { x: 90, y: 90, w: 130, h: 85, label: "Engineering Hall", emoji: "⚙️" },
            { x: 275, y: 140, w: 110, h: 70, label: "Student Centre", emoji: "🏛️" },
            { x: 450, y: 110, w: 120, h: 80, label: "University Ctr", emoji: "🏫" },
            { x: 140, y: 250, w: 110, h: 80, label: "Library", emoji: "📚" },
            { x: 315, y: 275, w: 95, h: 70, label: "Science", emoji: "🔬" },
            { x: 475, y: 255, w: 115, h: 78, label: "Theater", emoji: "🎭" },
            { x: 190, y: 400, w: 110, h: 70, label: "Research Ctr", emoji: "🧪" },
            { x: 395, y: 390, w: 95, h: 78, label: "Business", emoji: "💼" },
          ].map((building, i) => (
            <g key={i}>
              <rect
                x={building.x}
                y={building.y}
                width={building.w}
                height={building.h}
                fill="white"
                stroke="#fed7aa"
                strokeWidth="2"
                rx="12"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
              />
              <text
                x={building.x + building.w / 2}
                y={building.y + building.h / 2 - 6}
                textAnchor="middle"
                fontSize="14"
                fill="#6b7280"
              >
                {building.emoji}
              </text>
              <text
                x={building.x + building.w / 2}
                y={building.y + building.h / 2 + 10}
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
                fontWeight="500"
              >
                {building.label}
              </text>
            </g>
          ))}

          {/* Event markers */}
          {eventsToShow.map((event) => {
            const x = event.lat;
            const y = event.lng;
            const isSelected = selectedEvent?.id === event.id;
            const emoji = getFoodEmoji(event.foodType);
            const colors = getMarkerColor(event, isSelected);
            const r = isSelected ? 22 : 18;

            return (
              <g
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                style={{ cursor: "pointer" }}
              >
                {/* Pulse ring for food events */}
                {event.foodAvailable && (
                  <circle
                    cx={x}
                    cy={y}
                    r={r + 8}
                    fill="none"
                    stroke={colors.border}
                    strokeWidth="2"
                    opacity={isSelected ? 0.5 : 0.25}
                  />
                )}

                {/* Marker body */}
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={isSelected ? 3 : 2}
                />

                {/* Emoji */}
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fontSize={isSelected ? 16 : 13}
                >
                  {emoji}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Event Card */}
        {selectedEvent && (
          <div className="absolute top-4 right-4 w-80 z-20">
            <Card className="rounded-3xl border-0 shadow-2xl shadow-orange-100 overflow-hidden">
              {/* Colorful header */}
              <div className="bg-gradient-to-r from-orange-400 to-amber-400 px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                      {getFoodEmoji(selectedEvent.foodType)}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-sm leading-tight">{selectedEvent.name}</h3>
                      <p className="text-orange-100 text-xs mt-0.5">{selectedEvent.organization}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <CardContent className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-orange-50 rounded-2xl p-3">
                    <div className="text-xs text-gray-400 mb-0.5">📍 Location</div>
                    <div className="text-xs font-bold text-gray-700">{selectedEvent.location}</div>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-3">
                    <div className="text-xs text-gray-400 mb-0.5">🕐 Time</div>
                    <div className="text-xs font-bold text-gray-700">{selectedEvent.time}</div>
                  </div>
                </div>

                {selectedEvent.foodType && (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-3 flex items-center gap-2">
                    <span className="text-lg">{getFoodEmoji(selectedEvent.foodType)}</span>
                    <div>
                      <div className="text-xs text-gray-400">Free food</div>
                      <div className="text-sm font-bold text-gray-800">{selectedEvent.foodType}</div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 leading-relaxed">{selectedEvent.description}</p>

                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm">
                  I'm going! 🙋
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Food legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-orange-100">
          <p className="text-xs font-bold text-gray-700 mb-2.5">Food Types</p>
          <div className="space-y-1.5">
            {[
              { emoji: "🍕", label: "Pizza" },
              { emoji: "🌮", label: "Tacos" },
              { emoji: "☕", label: "Coffee/Donuts" },
              { emoji: "🥐", label: "Breakfast" },
              { emoji: "🍿", label: "Snacks" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-gray-500">
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tap hint */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-orange-100 px-4 py-2.5">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <span>👆</span>
            Tap a marker to see event details
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
      `}</style>
    </Layout>
  );
}
