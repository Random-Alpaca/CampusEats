import { useEffect, useState } from "react";
import { Calendar, MapPin, Clock, UtensilsCrossed } from "lucide-react";
import { Badge } from "./ui/badge";
import type { Event } from "../services/api";

interface EventCardProps {
  event: Event;
  number: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isHighlighted?: boolean;
}

export function EventCard({
  event,
  number,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isHighlighted,
}: EventCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hash = event.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = (hash * 47) % 360;
  const placeholderBg = `hsl(${hue}, 35%, 85%)`;
  const placeholderFg = `hsl(${hue}, 40%, 55%)`;
  const showEventImage = !!event.imageUrl && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [event.imageUrl]);

  return (
    <div
      className={`flex gap-4 p-4 rounded-lg cursor-pointer transition-colors border ${
        isHighlighted
          ? "bg-orange-50 border-orange-200"
          : "bg-white border-transparent hover:bg-gray-50"
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="w-[120px] h-[100px] rounded-lg flex-shrink-0 overflow-hidden"
        style={{ backgroundColor: placeholderBg }}
      >
        {showEventImage ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed
              className="w-8 h-8"
              style={{ color: placeholderFg }}
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="text-base font-semibold text-gray-900 leading-snug">
            <span className="text-gray-400 mr-1">{number}.</span>
            {event.name}
          </h3>
          {event.foodAvailable && (
            <Badge className="bg-orange-600 hover:bg-orange-700 text-white text-[10px] px-1.5 py-0.5 shrink-0 leading-none">
              Free Food
            </Badge>
          )}
        </div>

        {event.organization && (
          <p className="text-sm text-gray-500 mb-1">{event.organization}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          {event.date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {event.date}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {event.time}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {event.location}
          </span>
        </div>

        {event.foodType && (
          <div className="mt-2">
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-600 text-[11px] font-medium"
            >
              {event.foodType}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
