export interface Event {
  id: string;
  name: string;
  organization: string;
  location: string;
  building: string;
  room: string;
  date: string;
  time: string;
  foodAvailable: boolean;
  foodType?: string;
  description: string;
  lat: number;
  lng: number;
}

// Coordinates centered around UCLA campus area for demo purposes
export const mockEvents: Event[] = [
  {
    id: "1",
    name: "Free Pizza Night",
    organization: "Computer Science Club",
    location: "Engineering Building Room 210",
    building: "Engineering Building",
    room: "210",
    date: "Thursday, March 25",
    time: "6:00 PM",
    foodAvailable: true,
    foodType: "Pizza",
    description: "Join us for our weekly meetup with free pizza! We'll be discussing upcoming hackathons and working on projects together.",
    lat: 34.0699,
    lng: -118.4438,
  },
  {
    id: "2",
    name: "Taco Tuesday Mixer",
    organization: "Business Students Association",
    location: "Student Center Main Hall",
    building: "Student Center",
    room: "Main Hall",
    date: "Tuesday, March 23",
    time: "7:00 PM",
    foodAvailable: true,
    foodType: "Tacos",
    description: "Network with fellow business students over free tacos and refreshments. Guest speaker from local startup.",
    lat: 34.0706,
    lng: -118.4451,
  },
  {
    id: "3",
    name: "Spring Career Fair",
    organization: "Career Services",
    location: "University Center Hall A",
    building: "University Center",
    room: "Hall A",
    date: "Wednesday, March 24",
    time: "10:00 AM - 4:00 PM",
    foodAvailable: false,
    description: "Meet with employers from top companies. Bring your resume and dress professionally.",
    lat: 34.0715,
    lng: -118.4420,
  },
  {
    id: "4",
    name: "Study Break: Donuts & Coffee",
    organization: "Residence Hall Association",
    location: "Library Commons 1st Floor",
    building: "Library Commons",
    room: "1st Floor",
    date: "Monday, March 22",
    time: "9:00 PM",
    foodAvailable: true,
    foodType: "Donuts & Coffee",
    description: "Free donuts and coffee provided during finals week. Take a break from studying!",
    lat: 34.0718,
    lng: -118.4415,
  },
  {
    id: "5",
    name: "Sustainability Workshop",
    organization: "Environmental Club",
    location: "Science Building Room 105",
    building: "Science Building",
    room: "105",
    date: "Friday, March 26",
    time: "3:00 PM",
    foodAvailable: true,
    foodType: "Snacks",
    description: "Learn about campus sustainability initiatives. Light snacks and refreshments provided.",
    lat: 34.0688,
    lng: -118.4465,
  },
  {
    id: "6",
    name: "Movie Night",
    organization: "Student Activities Board",
    location: "Campus Theater",
    building: "Campus Theater",
    room: "Main Auditorium",
    date: "Saturday, March 27",
    time: "8:00 PM",
    foodAvailable: true,
    foodType: "Popcorn",
    description: "Free movie screening with complimentary popcorn and drinks. This week: recent blockbuster hit!",
    lat: 34.0725,
    lng: -118.4405,
  },
  {
    id: "7",
    name: "Research Symposium",
    organization: "Graduate Student Association",
    location: "Research Center Auditorium",
    building: "Research Center",
    room: "Auditorium",
    date: "Thursday, March 25",
    time: "2:00 PM",
    foodAvailable: false,
    description: "Annual research presentations by graduate students across all departments.",
    lat: 34.0675,
    lng: -118.4480,
  },
  {
    id: "8",
    name: "Breakfast Club Meeting",
    organization: "Marketing Club",
    location: "Business Building Room 302",
    building: "Business Building",
    room: "302",
    date: "Wednesday, March 24",
    time: "8:00 AM",
    foodAvailable: true,
    foodType: "Breakfast",
    description: "Early morning meeting with continental breakfast. Discussing spring marketing campaign projects.",
    lat: 34.0693,
    lng: -118.4472,
  },
];