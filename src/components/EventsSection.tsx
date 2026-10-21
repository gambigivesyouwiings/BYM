'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Ticket, ArrowRight, Sparkles } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import RegistrationModal from './RegistrationModal';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string | Date;
  time: string;
  venue: string;
  imageUrl?: string | null;
  price: number;
  capacity: number;
  isActive: boolean;
  registrationsCount?: number;
}

interface EventsSectionProps {
  events: EventItem[];
}

export default function EventsSection({ events }: EventsSectionProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRegisterClick = (event: EventItem) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  return (
    <section id="events" className="py-24 relative overflow-hidden bg-[#0F0B1A]">
      {/* Decorative background blurs */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Upcoming Gatherings</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Experience God in <span className="text-gradient-gold">Community</span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            From powerful power-packed conferences to deep prayer vigils and creative workshops — step in, make lifelong friends, and ignite your spiritual walk.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => {
            const isFree = event.price === 0;
            return (
              <div
                key={event.id}
                className="group relative rounded-2xl bg-[#16102B]/90 border border-purple-900/40 hover:border-purple-600/50 shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-950/40"
              >
                {/* Event Image Banner */}
                <div className="relative h-52 w-full overflow-hidden bg-purple-950/50">
                  {event.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-purple-300 font-bold">
                      MCK Beyond
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16102B] via-transparent to-black/30" />

                  {/* Price Tag Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-md ${
                        isFree
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold'
                      }`}
                    >
                      {isFree ? 'FREE' : formatCurrency(event.price)}
                    </span>
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {event.title}
                    </h3>

                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Details Badges */}
                  <div className="space-y-2 pt-2 border-t border-purple-900/30 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Capacity: {event.capacity} seats</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 space-y-2">
                    <a
                      href={`/events/${event.id}#attendees`}
                      className="text-xs text-purple-300 hover:text-amber-300 flex items-center justify-between py-1 px-1 transition"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>See Who&apos;s Attending</span>
                      </span>
                      <span className="text-[11px] text-gray-400 hover:text-white">
                        View List &rarr;
                      </span>
                    </a>

                    <button
                      onClick={() => handleRegisterClick(event)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md shadow-purple-950 flex items-center justify-center gap-2 group-hover:shadow-purple-700/30 transition-all"
                    >
                      <Ticket className="w-4 h-4 text-amber-300" />
                      <span>Register for Event</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration Dialog */}
      <RegistrationModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </section>
  );
}
