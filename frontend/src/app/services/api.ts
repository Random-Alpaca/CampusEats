import { postImageLookup } from "../data/postImageLookup";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

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
  image_url: string;
  image_local_path: string;
  votes_available: number;
  votes_finished: number;
}

function extractInstagramPostId(instagramUrl: string): string {
  const match = instagramUrl?.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/i);
  return match?.[1] ?? "";
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
  imageUrl: string;
  lat: number;
  lng: number;
  votesAvailable: number;
  votesFinished: number;
}

function resolveEventImage(raw: ApiEvent): string {
  const localPath = raw.image_local_path?.trim();
  if (localPath) {
    const parts = localPath.split("/").filter(Boolean);
    const fileName = parts[parts.length - 1];
    if (fileName) {
      return `${API_BASE}/media/${encodeURIComponent(fileName)}`;
    }
  }

  const directImageUrl = raw.image_url?.trim();
  if (directImageUrl) {
    return directImageUrl;
  }

  const postId = extractInstagramPostId(raw.instagram_url || "");
  if (!postId) {
    return "";
  }

  return postImageLookup[postId]?.imageUrl || "";
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
    imageUrl: resolveEventImage(raw),
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
