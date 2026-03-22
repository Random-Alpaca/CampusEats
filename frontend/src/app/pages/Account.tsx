import {
  User,
  Bell,
  Heart,
  Settings,
  ChevronRight,
  Star,
  Pizza,
  UtensilsCrossed,
  Calendar,
  DollarSign,
  Lock,
  Shield,
  LogOut,
  Pencil,
} from "lucide-react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

const FAVORITE_CLUBS = [
  { name: "Computer Science Club", icon: Settings, color: "bg-blue-50 text-blue-700 border-blue-100" },
  { name: "Business Association", icon: Star, color: "bg-purple-50 text-purple-700 border-purple-100" },
  { name: "Engineering Society", icon: Settings, color: "bg-gray-50 text-gray-700 border-gray-100" },
];

const NOTIFICATION_PREFS = [
  {
    id: "pizza",
    icon: Pizza,
    bg: "bg-orange-50",
    title: "Pizza Events",
    desc: "Get notified the moment free pizza appears",
    defaultChecked: true,
  },
  {
    id: "all-food",
    icon: UtensilsCrossed,
    bg: "bg-amber-50",
    title: "All Food Events",
    desc: "Any campus event offering free food",
    defaultChecked: true,
  },
  {
    id: "other-events",
    icon: Calendar,
    bg: "bg-gray-50",
    title: "Other Events",
    desc: "General campus events without food",
    defaultChecked: false,
  },
];

export function Account() {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-10">
          {/* Profile Card */}
          <Card className="mb-5 rounded-xl border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 mb-0.5">
                    Student Account
                  </h2>
                  <p className="text-gray-500 text-sm mb-1.5">
                    student@university.edu
                  </p>
                  <div className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full border border-orange-100">
                    <Star className="w-3 h-3" />
                    Free Food Hunter
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">47</div>
                  <div className="text-xs text-gray-500">events attended</div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                {[
                  { value: "$280", label: "saved", icon: DollarSign },
                  { value: "12", label: "clubs followed", icon: Heart },
                  { value: "3", label: "this week", icon: Calendar },
                ].map((stat, i) => (
                  <div key={i} className="text-center bg-gray-50 rounded-lg p-3">
                    <stat.icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <div className="text-lg font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="mb-5 rounded-xl border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
                <Bell className="w-4 h-4 text-gray-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {NOTIFICATION_PREFS.map((pref) => (
                <div
                  key={pref.id}
                  className={`flex items-center justify-between ${pref.bg} rounded-lg p-3`}
                >
                  <div className="flex items-center gap-3">
                    <pref.icon className="w-4 h-4 text-gray-500" />
                    <Label
                      htmlFor={pref.id}
                      className="flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-semibold text-gray-800 text-sm">
                        {pref.title}
                      </span>
                      <span className="text-xs text-gray-500 font-normal">
                        {pref.desc}
                      </span>
                    </Label>
                  </div>
                  <Switch
                    id={pref.id}
                    defaultChecked={pref.defaultChecked}
                    className="data-[state=checked]:bg-orange-600"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Favorite Clubs */}
          <Card className="mb-5 rounded-xl border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
                <Heart className="w-4 h-4 text-gray-500" />
                Favourite Clubs
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-sm text-gray-500 mb-3">
                Follow organisations to get priority notifications
              </p>
              <div className="space-y-2 mb-4">
                {FAVORITE_CLUBS.map((club, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between ${club.color} border rounded-lg px-4 py-2.5`}
                  >
                    <div className="flex items-center gap-2.5">
                      <club.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{club.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">Following</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 text-sm"
              >
                + Add more clubs
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
                <Settings className="w-4 h-4 text-gray-500" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-1">
              {[
                { label: "Edit Profile", icon: Pencil, color: "text-gray-700 hover:bg-gray-50" },
                { label: "Change Password", icon: Lock, color: "text-gray-700 hover:bg-gray-50" },
                { label: "Privacy Settings", icon: Shield, color: "text-gray-700 hover:bg-gray-50" },
                { label: "Sign Out", icon: LogOut, color: "text-red-500 hover:bg-red-50" },
              ].map((item, i) => (
                <button
                  key={i}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${item.color}`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
