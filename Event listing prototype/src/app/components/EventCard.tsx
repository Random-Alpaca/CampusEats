import { Calendar, MapPin, Clock, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Event } from "../data/events";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{event.name}</CardTitle>
          {event.foodAvailable && (
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">
              <UtensilsCrossed className="w-3 h-3 mr-1" />
              Food
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{event.organization}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{event.location}</span>
        </div>
        {event.foodType && (
          <div className="pt-2 border-t">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
              {event.foodType}
            </Badge>
          </div>
        )}
        <p className="text-sm text-muted-foreground pt-2">{event.description}</p>
      </CardContent>
    </Card>
  );
}