import { Link, useLocation } from "react-router";
import { UtensilsCrossed, Map, User, Home } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl">Campus Eats</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className={isActive("/") ? "gap-2 bg-orange-500 hover:bg-orange-600" : "gap-2"}
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <Link to="/events">
              <Button
                variant={isActive("/events") ? "default" : "ghost"}
                className={isActive("/events") ? "gap-2 bg-orange-500 hover:bg-orange-600" : "gap-2"}
              >
                <UtensilsCrossed className="w-4 h-4" />
                Campus Events
              </Button>
            </Link>
            <Link to="/map">
              <Button
                variant={isActive("/map") ? "default" : "ghost"}
                className={isActive("/map") ? "gap-2 bg-orange-500 hover:bg-orange-600" : "gap-2"}
              >
                <Map className="w-4 h-4" />
                Map
              </Button>
            </Link>
            <Link to="/account">
              <Button
                variant={isActive("/account") ? "default" : "ghost"}
                className={isActive("/account") ? "gap-2 bg-orange-500 hover:bg-orange-600" : "gap-2"}
              >
                <User className="w-4 h-4" />
                Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}