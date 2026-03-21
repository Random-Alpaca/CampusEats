import { Calendar, MapPin, Clock, UtensilsCrossed, X, Bookmark, CalendarPlus, UserPlus, Check, Pizza, Coffee, Apple, Popcorn, Croissant } from "lucide-react";
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

  // Function to get large food icon based on type
  const getFoodIcon = (foodType?: string) => {
    if (!foodType) return Apple;
    const type = foodType.toLowerCase();
    if (type.includes("pizza")) return Pizza;
    if (type.includes("taco")) return Apple;
    if (type.includes("coffee") || type.includes("donut")) return Coffee;
    if (type.includes("breakfast")) return Croissant;
    if (type.includes("popcorn")) return Popcorn;
    return Apple;
  };

  const FoodIcon = getFoodIcon(event.foodType);

  // Get gradient colors based on food type
  const getGradientColors = () => {
    if (!event.foodAvailable) return "from-gray-400 to-gray-500";
    const type = event.foodType?.toLowerCase() || "";
    if (type.includes("pizza")) return "from-orange-400 via-orange-500 to-red-500";
    if (type.includes("taco")) return "from-yellow-400 via-amber-500 to-orange-500";
    if (type.includes("coffee") || type.includes("donut")) return "from-amber-600 via-orange-700 to-orange-900";
    if (type.includes("breakfast")) return "from-yellow-300 via-amber-400 to-orange-500";
    if (type.includes("popcorn")) return "from-yellow-200 via-yellow-400 to-amber-500";
    return "from-lime-400 via-green-500 to-emerald-600";
  };

  // Function to generate Google Calendar URL
  const getGoogleCalendarUrl = () => {
    // Parse the date and time
    const dateStr = event.date; // e.g., "Thursday, March 25"
    const timeStr = event.time; // e.g., "6:00 PM"
    
    // For demo purposes, using a simplified date format
    // In production, you'd parse the actual date properly
    const currentYear = new Date().getFullYear();
    const startTime = timeStr.split(" - ")[0] || timeStr;
    
    // Create a rough ISO date (this is simplified for demo)
    const title = encodeURIComponent(event.name);
    const location = encodeURIComponent(event.location);
    const description = encodeURIComponent(
      `${event.description}\n\nOrganized by: ${event.organization}${event.foodType ? `\n\nFood provided: ${event.foodType}` : ""}`
    );
    
    // Google Calendar URL format
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${location}&details=${description}`;
  };

  const handleAddToGoogleCalendar = () => {
    window.open(getGoogleCalendarUrl(), "_blank");
  };

  const handleSaveEvent = () => {
    setIsSaved(true);
    // In a real app, this would save to local storage or a backend
    setTimeout(() => {
      // Show confirmation briefly
    }, 1500);
  };

  const handleAddToAccount = () => {
    setIsAddedToAccount(true);
    // In a real app, this would save to user's personal account in the backend
    setTimeout(() => {
      // Show confirmation briefly
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colorful Header with Gradient */}
        <div className={`relative bg-gradient-to-br ${getGradientColors()} text-white px-6 py-8 rounded-t-2xl overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="relative z-10">
            {/* Food Icon - Large and centered if food available */}
            {event.foodAvailable && (
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 backdrop-blur-md rounded-full p-6 border-4 border-white/30">
                  <FoodIcon className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
            )}
            
            {/* Event Title */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">{event.name}</h2>
              <p className="text-white/90 text-lg">{event.organization}</p>
              
              {/* Free Food Badge */}
              {event.foodAvailable && (
                <div className="mt-4 inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                  <UtensilsCrossed className="w-5 h-5" />
                  <span>🎉 FREE {event.foodType?.toUpperCase()} 🎉</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Event Details - Colorful boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 rounded-lg p-2">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-semibold">DATE</p>
                  <p className="font-bold text-orange-900">{event.date}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 rounded-lg p-2">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-semibold">TIME</p>
                  <p className="font-bold text-amber-900">{event.time}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-lime-50 to-lime-100 border-2 border-lime-200 rounded-xl p-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="bg-lime-500 rounded-lg p-2">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-lime-600 font-semibold">LOCATION</p>
                  <p className="font-bold text-lime-900">{event.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5">
            <h3 className="font-bold text-lg mb-2 text-yellow-900 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              About This Event
            </h3>
            <p className="text-yellow-900 leading-relaxed">{event.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-xl text-center mb-4 text-gray-800">
              🍴 Don't Miss Out - Save Your Spot! 🍴
            </h3>
            
            {/* Add to Google Calendar */}
            <Button
              onClick={handleAddToGoogleCalendar}
              className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              size="lg"
            >
              <CalendarPlus className="w-5 h-5 mr-2" />
              <span className="font-bold">Add to Google Calendar</span>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              {/* Save Event (Local) */}
              <Button
                onClick={handleSaveEvent}
                variant={isSaved ? "secondary" : "outline"}
                className={`w-full ${!isSaved && 'border-2 border-orange-300 hover:bg-orange-50 hover:border-orange-400'}`}
                size="lg"
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-green-600" />
                    <span className="font-semibold">Saved!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Save</span>
                  </>
                )}
              </Button>

              {/* Add to Personal Account */}
              <Button
                onClick={handleAddToAccount}
                variant={isAddedToAccount ? "secondary" : "outline"}
                className={`w-full ${!isAddedToAccount && 'border-2 border-lime-300 hover:bg-lime-50 hover:border-lime-400'}`}
                size="lg"
                disabled={isAddedToAccount}
              >
                {isAddedToAccount ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-green-600" />
                    <span className="font-semibold">Added!</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    <span className="font-semibold">My Events</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info Note - More fun */}
          {event.foodAvailable && (
            <div className="bg-gradient-to-r from-orange-100 via-yellow-100 to-lime-100 border-2 border-orange-300 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-orange-900 mb-1">
                🎊 Hurry! Free food goes fast! 🎊
              </p>
              <p className="text-sm text-orange-800">
                Click "Add to Google Calendar" to never miss a free meal on campus!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}