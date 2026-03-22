import {
  MapPin,
  Clock,
  Calendar,
  UtensilsCrossed,
  ExternalLink,
  X,
  CalendarPlus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { Event } from "../services/api";
import { getGoogleCalendarUrl, voteEvent } from "../services/api";
import { useState } from "react";

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const [votesAvailable, setVotesAvailable] = useState(event.votesAvailable);
  const [votesFinished, setVotesFinished] = useState(event.votesFinished);
  const [voting, setVoting] = useState(false);

  const handleVote = async (type: "available" | "finished") => {
    setVoting(true);
    try {
      const updated = await voteEvent(event.id, type);
      setVotesAvailable(updated.votesAvailable);
      setVotesFinished(updated.votesFinished);
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVoting(false);
    }
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
            {event.organization && (
              <p className="text-sm text-gray-500">{event.organization}</p>
            )}
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
            {event.date && (
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
            )}
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

          {/* Instagram link */}
          {event.instagramUrl && (
            <a
              href={event.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors group"
            >
              <ExternalLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-purple-400 uppercase font-semibold tracking-wide">
                  Source
                </p>
                <p className="text-sm font-medium text-purple-700 group-hover:underline truncate">
                  View original post on Instagram
                </p>
              </div>
            </a>
          )}

          {/* Community voting */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Is this event still available?
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote("available")}
                disabled={voting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Still available ({votesAvailable})
              </button>
              <button
                onClick={() => handleVote("finished")}
                disabled={voting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Finished ({votesFinished})
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-100">
            <Button
              onClick={() =>
                window.open(getGoogleCalendarUrl(event.id), "_blank")
              }
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add to Google Calendar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}