import {
  Calendar,
  MapPin,
  Clock,
  UtensilsCrossed,
  X,
  Bookmark,
  CalendarPlus,
  UserPlus,
  Check,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { Event } from "../data/events";
import { useState } from "react";

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isAddedToAccount, setIsAddedToAccount] = useState(false);

  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(event.name);
    const location = encodeURIComponent(event.location);
    const description = encodeURIComponent(
      `${event.description}\n\nOrganized by: ${event.organization}${
        event.foodType ? `\n\nFood provided: ${event.foodType}` : ""
      }`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${location}&details=${description}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {event.name}
            </h2>
            <p className="text-sm text-gray-500">{event.organization}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Food badge */}
        {event.foodAvailable && (
          <div className="px-5 pt-3">
            <Badge className="bg-orange-600 text-white gap-1">
              <UtensilsCrossed className="w-3 h-3" />
              Free {event.foodType || "Food"}
            </Badge>
          </div>
        )}

        {/* Details */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
                  Date
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {event.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
                  Time
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {event.time}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
                Location
              </p>
              <p className="text-sm font-medium text-gray-800">
                {event.location}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
              About this event
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 space-y-2 border-t border-gray-100">
            <Button
              onClick={() => window.open(getGoogleCalendarUrl(), "_blank")}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add to Google Calendar
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setIsSaved(true)}
                variant={isSaved ? "secondary" : "outline"}
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-green-600" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-1.5" />
                    Save
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsAddedToAccount(true)}
                variant={isAddedToAccount ? "secondary" : "outline"}
                disabled={isAddedToAccount}
              >
                {isAddedToAccount ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-green-600" />
                    Added
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    My Events
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}