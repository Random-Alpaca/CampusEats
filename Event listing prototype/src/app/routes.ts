import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { EventList } from "./pages/EventList";
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
    path: "/account",
    Component: Account,
  },
]);