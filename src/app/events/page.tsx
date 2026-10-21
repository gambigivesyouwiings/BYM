import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, ArrowRight, Flame, Sparkles, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    orderBy: { date: 'asc' },
    include: { _count: { select: { registrations: true } } },
  });

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.date) < new Date());

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>All Events</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Upcoming <span className="gradient-text">Gatherings</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Join us at one of our events — conferences, worship nights, leadership summits, 
            outreach missions, and more. Register now to secure your spot.
          </p>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group glass-card overflow-hidden hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-52 bg-background-elevated overflow-hidden">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-gradient opacity-50">
                      <Flame className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background-card via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                        event.price === 0
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-accent/90 text-background font-extrabold'
                      }`}
                    >
                      {event.price === 0 ? 'FREE' : formatCurrency(event.price)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-white/5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary-400" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary-purple" />
                      {event.venue}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      {event._count.registrations}/{event.capacity} registered
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-sm font-semibold text-primary-400 group-hover:text-primary-300">
                    Register Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-card mb-16">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Upcoming Events</h3>
            <p className="text-slate-400">Stay tuned — we&apos;re planning something amazing!</p>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">
              Past <span className="gradient-text">Events</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="glass-card p-6 space-y-3"
                >
                  <h3 className="text-base font-semibold text-white">{event.title}</h3>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.venue}
                    </div>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400">
                    Event Ended
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
