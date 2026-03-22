import { User, Bell, Heart, Settings, ChevronRight, Star } from "lucide-react";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

const FAVORITE_CLUBS = [
  { name: "Computer Science Club", emoji: "💻", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { name: "Business Association", emoji: "📊", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { name: "Engineering Society", emoji: "⚙️", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

const NOTIFICATION_PREFS = [
  {
    id: "pizza",
    emoji: "🍕",
    bg: "bg-orange-50",
    title: "Pizza Events",
    desc: "Get notified the moment free pizza appears",
    defaultChecked: true,
  },
  {
    id: "all-food",
    emoji: "🍽️",
    bg: "bg-amber-50",
    title: "All Food Events",
    desc: "Any campus event offering free food",
    defaultChecked: true,
  },
  {
    id: "other-events",
    emoji: "📅",
    bg: "bg-blue-50",
    title: "Other Events",
    desc: "General campus events without food",
    defaultChecked: false,
  },
];

export function Account() {
  return (
    <Layout>
      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-10">

          {/* Profile Card */}
          <div className="relative mb-8">
            {/* Decorative background blob */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl pointer-events-none" />

            <Card className="rounded-3xl border-0 shadow-xl shadow-orange-100 overflow-visible bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                      <span className="text-3xl">🧑‍🎓</span>
                    </div>
                    {/* Online dot */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-gray-900 mb-0.5">Student Account</h2>
                    <p className="text-gray-400 text-sm mb-2">student@university.edu</p>
                    <div className="flex items-center gap-1.5">
                      <div className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Free Food Hunter
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black text-orange-500">47</div>
                    <div className="text-xs text-gray-400">events attended</div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                  {[
                    { value: "$280", label: "saved", emoji: "💰" },
                    { value: "12", label: "clubs followed", emoji: "❤️" },
                    { value: "3", label: "this week", emoji: "🗓️" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center bg-gray-50 rounded-2xl p-3">
                      <div className="text-lg mb-0.5">{stat.emoji}</div>
                      <div className="text-lg font-black text-gray-800">{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notification Settings */}
          <Card className="mb-5 rounded-3xl border-0 shadow-lg shadow-orange-50 bg-white">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="flex items-center gap-2.5 text-base font-black text-gray-900">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-base">🔔</div>
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-3">
              {NOTIFICATION_PREFS.map((pref) => (
                <div
                  key={pref.id}
                  className={`flex items-center justify-between ${pref.bg} rounded-2xl p-4 border border-white`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{pref.emoji}</span>
                    <Label htmlFor={pref.id} className="flex flex-col gap-0.5 cursor-pointer">
                      <span className="font-bold text-gray-800 text-sm">{pref.title}</span>
                      <span className="text-xs text-gray-400 font-normal">{pref.desc}</span>
                    </Label>
                  </div>
                  <Switch
                    id={pref.id}
                    defaultChecked={pref.defaultChecked}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Favorite Clubs */}
          <Card className="mb-5 rounded-3xl border-0 shadow-lg shadow-orange-50 bg-white">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="flex items-center gap-2.5 text-base font-black text-gray-900">
                <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center text-base">❤️</div>
                Favourite Clubs
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-sm text-gray-400 mb-4">
                Follow organisations to get priority notifications
              </p>
              <div className="space-y-2 mb-4">
                {FAVORITE_CLUBS.map((club, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between ${club.color} border rounded-2xl px-4 py-3`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{club.emoji}</span>
                      <span className="text-sm font-semibold">{club.name}</span>
                    </div>
                    <span className="text-xs opacity-60">Following</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-2xl border-dashed border-orange-300 text-orange-500 hover:bg-orange-50 font-semibold"
              >
                + Add more clubs
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="rounded-3xl border-0 shadow-lg shadow-orange-50 bg-white">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="flex items-center gap-2.5 text-base font-black text-gray-900">
                <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-base">⚙️</div>
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-2">
              {[
                { label: "Edit Profile", emoji: "✏️", color: "hover:bg-gray-50 text-gray-700" },
                { label: "Change Password", emoji: "🔒", color: "hover:bg-gray-50 text-gray-700" },
                { label: "Privacy Settings", emoji: "🛡️", color: "hover:bg-gray-50 text-gray-700" },
                { label: "Sign Out", emoji: "👋", color: "hover:bg-red-50 text-red-500" },
              ].map((item, i) => (
                <button
                  key={i}
                  className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors ${item.color} border border-transparent hover:border-gray-100`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30" />
                </button>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
      `}</style>
    </Layout>
  );
}
