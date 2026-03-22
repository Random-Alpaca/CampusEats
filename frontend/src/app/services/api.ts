const API_BASE = "http://localhost:3000";

/** Raw shape returned by GET /events */
interface ApiEvent {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  time: string;
  food_type: string;
  organization: string;
  date: string;
  instagram_url: string;
  votes_available: number;
  votes_finished: number;
}

/** Frontend-friendly Event shape */
export interface Event {
  id: string;
  name: string;
  organization: string;
  location: string;
  date: string;
  time: string;
  foodType: string;
  foodAvailable: boolean;
  instagramUrl: string;
  lat: number;
  lng: number;
  votesAvailable: number;
  votesFinished: number;
}

function mapApiEvent(raw: ApiEvent): Event {
  return {
    id: raw.id,
    name: raw.title,
    organization: raw.organization || '',
    location: raw.location,
    date: raw.date || '',
    time: raw.time,
    foodType: raw.food_type,
    foodAvailable: !!raw.food_type && raw.food_type !== '',
    instagramUrl: raw.instagram_url || '',
    lat: raw.lat,
    lng: raw.lng,
    votesAvailable: raw.votes_available,
    votesFinished: raw.votes_finished,
  };
}

export async function fetchEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status}`);
  }
  const data: ApiEvent[] = await res.json();
  return data.map(mapApiEvent);
}

export async function voteEvent(
  id: string,
  type: "available" | "finished"
): Promise<Event> {
  const res = await fetch(`${API_BASE}/events/${id}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  if (!res.ok) {
    throw new Error(`Failed to vote: ${res.status}`);
  }
  const data: ApiEvent = await res.json();
  return mapApiEvent(data);
}

export function getGoogleCalendarUrl(id: string): string {
  return `${API_BASE}/events/${id}/gcal`;
}
