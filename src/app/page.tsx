import React from 'react';
import prisma from '@/lib/prisma';
import EventsSection, { EventItem } from '@/components/EventsSection';
import PrayerRequestForm from '@/components/PrayerRequestForm';
import {
  Flame,
  ArrowRight,
  Sparkles,
  Play,
  Heart,
  Users,
  Compass,
  BookOpen,
  Calendar,
  Send,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Default fallback events in case the database is freshly initialized
const defaultEvents: EventItem[] = [
  {
    id: 'sample-1',
    title: 'Youth Ignition Conference 2026',
    description: 'A transformative 3-day spiritual encounter packed with inspiring keynote messages, vibrant worship sessions, life breakout workshops, and deep fellowship.',
    date: new Date('2026-11-20T09:00:00Z'),
    time: '09:00 AM - 05:00 PM',
    venue: 'MCK Beyond Sanctuary, Main Hall',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    price: 500,
    capacity: 350,
    isActive: true,
  },
  {
    id: 'sample-2',
    title: 'Acoustic Worship Night & Prayer Vigil',
    description: 'An intimate evening of authentic unscripted acoustic praise, collective prayer intercession, and personal encounter in God’s holy presence.',
    date: new Date('2026-12-05T18:00:00Z'),
    time: '06:00 PM - 09:30 PM',
    venue: 'Amphitheatre & Youth Courtyard',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    price: 0,
    capacity: 200,
    isActive: true,
  },
  {
    id: 'sample-3',
    title: 'Kingdom Leadership & Career Summit',
    description: 'Equipping Christian young professionals, entrepreneurs, and campus leaders to excel and influence their spheres of culture with biblical integrity.',
    date: new Date('2027-01-16T10:00:00Z'),
    time: '10:00 AM - 04:00 PM',
    venue: 'Beyond Innovation Center',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    price: 300,
    capacity: 150,
    isActive: true,
  },
];

interface SermonItem {
  id: string;
  title: string;
  speaker: string;
  date: Date;
  youtubeUrl?: string | null;
  description?: string | null;
}

interface GalleryItem {
  id: string;
  url: string;
  caption?: string | null;
}

const defaultSermons: SermonItem[] = [
  {
    id: 'sermon-1',
    title: 'Unashamed: Living With Conviction in a Compromised World',
    speaker: 'Pastor David Mwangi',
    date: new Date('2026-10-04T10:30:00Z'),
    youtubeUrl: 'https://www.youtube.com',
    description: 'Exploring Daniel’s unyielding faith in Babylon and what it means for modern youth to stand tall without bowing down.',
  },
  {
    id: 'sermon-2',
    title: 'Walking in the Spirit: Overcoming the Digital Noise',
    speaker: 'Minister Grace Wanjiku',
    date: new Date('2026-09-27T10:30:00Z'),
    youtubeUrl: 'https://www.youtube.com',
    description: 'How to cultivate a disciplined devotional life and tune into the whisper of the Holy Spirit amidst endless distractions.',
  },
  {
    id: 'sermon-3',
    title: 'The Blueprint of Servant Leadership',
    speaker: 'Youth Pastor Eric Otieno',
    date: new Date('2026-09-20T10:30:00Z'),
    youtubeUrl: 'https://www.youtube.com',
    description: 'Jesus redefined greatness through humble service. Learn how to be salt and light in your campus and workplace.',
  },
];

const defaultGallery: GalleryItem[] = [
  {
    id: 'g-1',
    url: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&w=800&q=80',
    caption: 'Sunday Celebration Worship',
  },
  {
    id: 'g-2',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    caption: 'Youth Camp Breakout Discussions',
  },
  {
    id: 'g-3',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    caption: 'Community Outreach & Compassion Ministry',
  },
  {
    id: 'g-4',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    caption: 'Passionate Youth Choir and Band',
  },
  {
    id: 'g-5',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    caption: 'Friday Night Fire Prayer Encounter',
  },
  {
    id: 'g-6',
    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80',
    caption: 'Campus Fellowship & Small Groups',
  },
];

export default async function HomePage() {
  let events: EventItem[] = defaultEvents;
  let sermons: SermonItem[] = defaultSermons;
  let gallery: GalleryItem[] = defaultGallery;

  try {
    const dbEvents = await prisma.event.findMany({
      where: { isActive: true },
      orderBy: { date: 'asc' },
    });
    if (dbEvents.length > 0) {
      events = dbEvents;
    }

    const dbSermons = await prisma.sermonEntry.findMany({
      orderBy: { date: 'desc' },
      take: 3,
    });
    if (dbSermons.length > 0) {
      sermons = dbSermons;
    }

    const dbGallery = await prisma.galleryImage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    if (dbGallery.length > 0) {
      gallery = dbGallery;
    }
  } catch {
    // Fall back gracefully to preset defaults
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section
        id="home"
        className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-gradient-to-b from-[#120B22] via-[#0F0B1A] to-[#0F0B1A]"
      >
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/20 to-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -top-10 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/40 border border-purple-600/40 text-purple-200 text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Methodist Church in Kenya • Youth Ministries</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            IGNITING PURPOSE.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-purple-300 to-indigo-400">
              LIVING BEYOND.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-gray-300 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            We are a movement of young believers unashamed of the Gospel, rooted in the Word, and unleashed to transform culture through Christ.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#events"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-bold text-base shadow-xl shadow-purple-950/60 flex items-center justify-center gap-2 group transition-all duration-200 hover:scale-[1.02]"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Explore Upcoming Events</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#sermons"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-purple-800/40 font-semibold text-base flex items-center justify-center gap-2 backdrop-blur-sm transition-all"
            >
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Watch Sermons</span>
            </a>
          </div>

          {/* Impact Stats Banner */}
          <div className="pt-16 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-[#16102B]/60 border border-purple-900/30 backdrop-blur-md">
              <div className="text-center p-2">
                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400">500+</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Youth Members</span>
              </div>
              <div className="text-center p-2">
                <span className="block text-2xl sm:text-3xl font-extrabold text-indigo-400">3</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Campuses</span>
              </div>
              <div className="text-center p-2">
                <span className="block text-2xl sm:text-3xl font-extrabold text-purple-400">24+</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Annual Outreaches</span>
              </div>
              <div className="text-center p-2">
                <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Christ Focused</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-[#120B22] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Who We Are</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Called to Transcend, <span className="text-gradient-brand">Anchored in Truth</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              MCK Beyond is the youth arm of the Methodist Church in Kenya. We are intentional about nurturing authentic young disciples who don&apos;t just survive the world, but thrive as beacons of light in it.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#16102B] border border-purple-900/30 hover:border-purple-600/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Radical Worship</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Worship is more than a song; it&apos;s a daily lifestyle surrendered to God in spirit and truth.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#16102B] border border-purple-900/30 hover:border-purple-600/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Biblical Discipleship</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Digging deep into the uncompromised Word to build unshakable spiritual foundations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#16102B] border border-purple-900/30 hover:border-purple-600/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Community & Life Groups</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Authentic brotherhood and sisterhood where young people grow, pray, and overcome together.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#16102B] border border-purple-900/30 hover:border-purple-600/50 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Kingdom Excellence</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Excelling in academics, tech, media, governance, and business to glorify God in every arena.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS SECTION */}
      <EventsSection events={events} />

      {/* SERMONS VAULT SECTION */}
      <section id="sermons" className="py-24 bg-[#120B22] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Sermon Vault</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Feed Your Soul With <span className="text-gradient-gold">Truth</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Catch up on recent Sunday teachings, youth symposium messages, and spiritual nourishment whenever you need it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sermons.map((sermon) => (
              <div
                key={sermon.id}
                className="rounded-2xl bg-[#16102B] border border-purple-900/40 p-6 flex flex-col justify-between space-y-6 hover:border-purple-600/40 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="text-amber-400 font-semibold">{sermon.speaker}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(sermon.date)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {sermon.title}
                  </h3>
                  {sermon.description && (
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                      {sermon.description}
                    </p>
                  )}
                </div>

                <a
                  href={sermon.youtubeUrl || 'https://youtube.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-purple-600/30 text-purple-200 border border-purple-800/40 text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="py-24 bg-[#0F0B1A] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Moments & Memories</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Life Together in <span className="text-gradient-brand">Fellowship</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              A glimpse into what God is doing through our services, retreats, outreach visits, and youth family life.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((img) => (
              <div
                key={img.id}
                className="group relative h-64 rounded-2xl overflow-hidden bg-purple-950/40 border border-purple-900/40 shadow-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption || 'MCK Beyond moment'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end p-5">
                  <p className="text-white font-medium text-sm drop-shadow-md">
                    {img.caption || 'MCK Beyond Youth Community'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT & PRAYER REQUEST SECTION */}
      <section id="contact" className="py-24 bg-[#120B22] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                <Heart className="w-3.5 h-3.5 text-amber-400" />
                <span>Connect With Us</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Need Prayer or Looking for a Spiritual Home?
              </h2>
              <p className="text-gray-400 text-base leading-relaxed">
                Whether you have questions, need someone to stand with you in faith, or want to join a youth small group near you — our pastoral team and youth leaders are here for you.
              </p>

              <div className="space-y-4 pt-2 text-sm text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>Confidential prayer support from pastoral elders</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>Direct connection to weekly campus/area cell groups</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span>Mentorship and young adults leadership pipeline</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Box */}
            <PrayerRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
