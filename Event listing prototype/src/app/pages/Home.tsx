import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Users, Calendar, MapPin, Bell } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Layout } from "../components/Layout";

const clubs = [
  { id: 1, name: "Computer Science Club", abbr: "CS", color: "bg-orange-400" },
  { id: 2, name: "Business Association", abbr: "BA", color: "bg-amber-400" },
  { id: 3, name: "Engineering Society", abbr: "ES", color: "bg-yellow-400" },
  { id: 4, name: "Art Collective", abbr: "AC", color: "bg-rose-400" },
  { id: 5, name: "Sports Club", abbr: "SC", color: "bg-red-400" },
  { id: 6, name: "Music Society", abbr: "MS", color: "bg-orange-300" },
  { id: 7, name: "Drama Club", abbr: "DC", color: "bg-amber-300" },
  { id: 8, name: "Environmental Club", abbr: "EC", color: "bg-lime-400" },
  { id: 9, name: "Debate Team", abbr: "DT", color: "bg-orange-500" },
  { id: 10, name: "Photography Club", abbr: "PC", color: "bg-yellow-500" },
];

// Floating food emojis for the hero
const foodEmojis = ["🍕", "🌮", "🧁", "🍩", "🥪", "🍜", "🍣", "🥗", "🍔", "🧇"];

export function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[580px] overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        {/* Decorative blob shapes */}
        <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute bottom-[-40px] left-[-40px] w-64 h-64 rounded-full bg-amber-200/40 blur-3xl" />

        {/* Floating food emojis */}
        {foodEmojis.map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl select-none pointer-events-none"
            style={{
              left: `${8 + (i * 9) % 88}%`,
              top: `${10 + (i * 17) % 75}%`,
              opacity: 0.18,
            }}
            animate={{
              y: [0, -14, 0],
              rotate: [0, i % 2 === 0 ? 8 : -8, 0],
            }}
            transition={{
              duration: 3 + (i * 0.3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.25,
            }}
          >
            {emoji}
          </motion.div>
        ))}

        <div className="relative max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row items-center gap-12">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Fun badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-base">🍕</span>
              Free food tracker for broke students
            </motion.div>

            <motion.h1
              className="text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-5 leading-[1.1]"
              style={{ fontFamily: "'Fredoka One', 'Nunito', cursive, sans-serif" }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Never Miss
              <span className="block text-orange-500"> Free Food </span>
              <span className="block">on Campus!</span>
            </motion.h1>

            <motion.p
              className="text-lg text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Discover events with free pizza, snacks, and meals happening right now across campus. Save money, meet people, eat well! 🎉
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link to="/events">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-200 font-semibold px-6 py-3 text-base">
                  🍽️ Find Free Food Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/map">
                <Button size="lg" variant="outline" className="rounded-2xl border-orange-200 text-orange-600 hover:bg-orange-50 font-semibold px-6 py-3 text-base">
                  🗺️ View Map
                </Button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              className="flex items-center gap-3 mt-8 justify-center lg:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex -space-x-2">
                {["🧑‍🎓", "👩‍🎓", "👨‍🎓", "🧑‍💻"].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">2,400+</span> students saving money weekly</p>
            </motion.div>
          </div>

          {/* Hero image card */}
          <motion.div
            className="flex-1 max-w-sm lg:max-w-none w-full"
            initial={{ opacity: 0, x: 30, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              {/* Main image */}
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-orange-200/60 border-4 border-white">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1628941018521-a4a5f283f22a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJtJTIwcGl6emElMjBzdW5zZXQlMjBmb29kJTIwZ2F0aGVyaW5nfGVufDF8fHx8MTc3NDEyMDIxMHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Students enjoying free food at campus event"
                  className="w-full h-72 object-cover"
                />
              </div>

              {/* Floating info card */}
              <motion.div
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3 border border-orange-100"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🍕</div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Right now</p>
                  <p className="text-sm font-bold text-gray-800">Free Pizza in CS Lounge!</p>
                </div>
              </motion.div>

              {/* Floating badge */}
              <motion.div
                className="absolute -top-3 -right-3 bg-amber-400 text-white rounded-2xl shadow-lg px-3 py-2 text-sm font-bold"
                animate={{ rotate: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                FREE!
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-orange-500 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[
              { value: "340+", label: "Events this month", icon: "📅" },
              { value: "48", label: "Campus clubs tracked", icon: "🏫" },
              { value: "2.4k", label: "Happy students", icon: "😋" },
              { value: "$0", label: "Cost to you", icon: "💸" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="text-orange-100 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rolling Club Icons */}
      <section className="py-14 bg-amber-50 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="inline-block bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-2">Tracked Organizations</span>
            <h2 className="text-2xl font-black text-gray-800">Active Campus Clubs</h2>
          </div>
          <div className="relative overflow-hidden">
            <div className="flex gap-6 animate-scroll">
              {[...clubs, ...clubs].map((club, idx) => (
                <motion.div
                  key={idx}
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.12, y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex flex-col items-center gap-2 w-24">
                    <div className={`w-14 h-14 ${club.color} rounded-2xl flex items-center justify-center text-white shadow-md font-black text-sm`}>
                      {club.abbr}
                    </div>
                    <p className="text-xs text-center text-gray-500 line-clamp-2 leading-tight">
                      {club.name}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block bg-orange-100 text-orange-600 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-3">How it works</span>
            <h2 className="text-3xl font-black text-gray-900">Campus Eats in 4 steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                img: "/images/HomePage/1.png",
                bg: "bg-orange-100",
                title: "Track Organizations",
                desc: "We monitor campus club social media for event announcements automatically.",
                delay: 0,
              },
              {
                img: "/images/HomePage/2.png",
                bg: "bg-amber-100",
                title: "Detect Free Food",
                desc: "AI identifies mentions of pizza, snacks, and refreshments in real-time.",
                delay: 0.1,
              },
              {
                img: "/images/HomePage/3.png",
                bg: "bg-yellow-100",
                title: "View on Map",
                desc: "See all events with locations mapped right across your campus.",
                delay: 0.2,
              },
              {
                img: "images/HomePage/4.png",
                bg: "bg-lime-100",
                title: "Get Notified",
                desc: "Receive instant alerts the moment new food events are posted.",
                delay: 0.3,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: item.delay }}
                whileHover={{ y: -6 }}
              >
                <Card className="p-6 text-center border-2 border-transparent hover:border-orange-200 transition-all duration-200 rounded-3xl shadow-sm hover:shadow-md">
                  {/* Step number */}
                  <div className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-widest">Step {i + 1}</div>
                  <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <img src={item.img} alt={item.title} className="w-10 h-10 object-contain" />
                  </div>
                  <h3 className="font-black text-gray-800 mb-2 text-base">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Food category highlights */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-2">What's usually on offer?</h2>
            <p className="text-gray-400">Real food from real events on campus</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { emoji: "🍕", name: "Pizza", count: "142 events", color: "bg-orange-100 border-orange-200" },
              { emoji: "🌮", name: "Tacos", count: "38 events", color: "bg-yellow-100 border-yellow-200" },
              { emoji: "🧁", name: "Baked goods", count: "56 events", color: "bg-pink-100 border-pink-200" },
              { emoji: "🍩", name: "Donuts", count: "24 events", color: "bg-rose-100 border-rose-200" },
              { emoji: "🥗", name: "Salads", count: "19 events", color: "bg-lime-100 border-lime-200" },
              { emoji: "☕", name: "Coffee", count: "87 events", color: "bg-amber-100 border-amber-200" },
            ].map((food, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className={`${food.color} border-2 rounded-3xl p-4 text-center cursor-pointer`}
              >
                <div className="text-3xl mb-2">{food.emoji}</div>
                <div className="font-bold text-gray-800 text-sm">{food.name}</div>
                <div className="text-xs text-gray-400 mt-1">{food.count}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-amber-500 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-40px] right-[-40px] w-60 h-60 rounded-full bg-white/10" />
        <div className="absolute bottom-[-60px] left-[-30px] w-80 h-80 rounded-full bg-white/5" />

        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-4xl font-black mb-4">Ready to eat for free?</h2>
          <p className="text-lg mb-8 text-orange-100">
            Join thousands of students finding free food events every single week
          </p>
          <Link to="/events">
            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-50 rounded-2xl shadow-xl font-bold px-8 py-4 text-base">
              Browse Events Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </Layout>
  );
}
