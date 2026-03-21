import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { EventList } from "./pages/EventList";
import { MapView } from "./pages/MapView";
import { Account } from "./pages/Account";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/events",
    Component: EventList,
  },
  {
    path: "/map",
    Component: MapView,
  },
  {
    path: "/account",
    Component: Account,
  },
]);