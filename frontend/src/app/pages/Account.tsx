import { useState } from "react";
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
  Plus,
  Leaf,
  Activity,
} from "lucide-react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

const ALL_CLUBS = [
  { id: 1, name: "UBC BizTech", img: "/images/HomePage/icons/biztech.jpg" },
  { id: 2, name: "BUCS", img: "/images/HomePage/icons/BUCS.png" },
  { id: 3, name: "CUS", img: "/images/HomePage/icons/cus.png" },
  { id: 4, name: "HEWE", img: "/images/HomePage/icons/hewe.jpg" },
  { id: 5, name: "Marketing Association", img: "/images/HomePage/icons/ma.jpg" },
  { id: 6, name: "Sauder Summit", img: "/images/HomePage/icons/summit.png" },
  { id: 7, name: "Young Women in Business", img: "/images/HomePage/icons/ywib.jpg" },
  { id: 8, name: "nwPlus", img: "/images/HomePage/icons/nwPlus.png" },
  { id: 9, name: "POITS", img: "/images/HomePage/icons/poits.png" },
  { id: 10, name: "SFU ACE", img: "/images/HomePage/icons/SFU ACE.png" },
  { id: 11, name: "SFU ASA", img: "/images/HomePage/icons/SFU ASA.png" },
  { id: 12, name: "SFU Enactus", img: "/images/HomePage/icons/SFU enactus.png" },
  { id: 13, name: "Commerce Night", img: "/images/HomePage/icons/commerce night.jpg" },
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
  const [followedIds, setFollowedIds] = useState<number[]>([1, 2, 3]);
  const [showAddClubs, setShowAddClubs] = useState(false);

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

              {/* Impact Report */}
              <div className="mt-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <Leaf className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Your Campus Impact</h3>
                </div>

                <div className="space-y-4 flex flex-col">
                  {/* Environmental Impact */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <Leaf className="w-3 h-3 text-green-500" /> Food Waste Prevented
                      </span>
                      <span className="text-green-700 font-bold bg-green-100/50 px-2 py-0.5 rounded-md">12.5 kg</span>
                    </div>
                    <div className="w-full bg-green-200/50 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  {/* Nutrition Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-orange-500" /> Healthy Meals Secured
                      </span>
                      <span className="text-orange-600 font-bold bg-orange-100/50 px-2 py-0.5 rounded-md">24 meals</span>
                    </div>
                    <div className="w-full bg-orange-100 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
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
                      className="flex flex-col items-start gap-0.5 cursor-pointer text-left"
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
                {ALL_CLUBS.filter(c => followedIds.includes(c.id)).length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    You aren't following any clubs yet.
                  </div>
                )}
                {ALL_CLUBS.filter(c => followedIds.includes(c.id)).map((club) => (
                  <div
                    key={club.id}
                    className="flex justify-between items-center bg-white border shadow-sm border-gray-200 rounded-lg px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <img src={club.img} alt={club.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-medium">{club.name}</span>
                    </div>
                    <button
                      onClick={() => setFollowedIds(prev => prev.filter(id => id !== club.id))}
                      className="text-xs font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 cursor-pointer shadow-sm"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>

              {!showAddClubs ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddClubs(true)}
                  className="w-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 text-sm py-5 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add more clubs
                </Button>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-900">Discover Clubs</h4>
                    <button onClick={() => setShowAddClubs(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">Close</button>
                  </div>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {ALL_CLUBS.filter(c => !followedIds.includes(c.id)).map(club => (
                      <div
                        key={club.id}
                        className="flex justify-between items-center bg-gray-50 border border-transparent hover:border-orange-200 rounded-lg px-3 py-2 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-gray-200 shadow-sm">
                            <img src={club.img} alt={club.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{club.name}</span>
                        </div>
                        <button
                          onClick={() => setFollowedIds(prev => [...prev, club.id])}
                          className="text-xs font-bold text-orange-600 bg-orange-100 hover:bg-orange-500 hover:text-white transition-colors px-3 py-1 rounded-full cursor-pointer shadow-sm"
                        >
                          Follow
                        </button>
                      </div>
                    ))}
                    {ALL_CLUBS.filter(c => !followedIds.includes(c.id)).length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
                        You follow all available clubs! 🎉
                      </div>
                    )}
                  </div>
                </div>
              )}
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
