import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, Flame, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import EventRegistrationClient from './EventRegistrationClient';
import EventParticipantsList from '@/components/EventParticipantsList';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { registrations: true } },
      registrations: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!event) return notFound();

  const spotsLeft = event.capacity - event._count.registrations;
  const isFull = spotsLeft <= 0;

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 bg-background-secondary overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-gradient">
            <Flame className="w-24 h-24 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All Events
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  {formatDate(event.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary-400" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary-purple" />
                  {event.venue}
                </span>
                <a
                  href="#attendees"
                  className="flex items-center gap-1.5 text-indigo-300 hover:text-white transition font-medium"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{event.registrations.length} Attending (See List)</span>
                </a>
              </div>
            </div>

            <div className="shrink-0">
              <span
                className={`px-4 py-2 rounded-xl text-sm font-bold ${
                  event.price === 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-accent/20 text-accent border border-accent/30'
                }`}
              >
                {event.price === 0 ? 'FREE' : formatCurrency(event.price)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Event Details & Participants Roster */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8">
              <h2 className="text-xl font-bold text-white mb-4">About This Event</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            <div className="glass-card p-8">
              <h2 className="text-xl font-bold text-white mb-4">Event Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Date</div>
                  <div className="text-sm text-white font-medium">{formatDate(event.date)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Time</div>
                  <div className="text-sm text-white font-medium">{event.time}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Venue</div>
                  <div className="text-sm text-white font-medium">{event.venue}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Capacity</div>
                  <div className="text-sm text-white font-medium">
                    {event._count.registrations} / {event.capacity} registered
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400">
                    {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Event is full'}
                  </span>
                  <span className="text-slate-500">
                    {Math.round((event._count.registrations / event.capacity) * 100)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
                        ? 'bg-red-500'
                        : spotsLeft < 10
                        ? 'bg-accent'
                        : 'bg-gradient-to-r from-primary-600 to-primary-purple'
                    }`}
                    style={{
                      width: `${Math.min(
                        (event._count.registrations / event.capacity) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Public Community Participants Roster */}
            <EventParticipantsList
              participants={event.registrations.map((r) => ({
                id: r.id,
                name: r.name,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
              }))}
              eventTitle={event.title}
            />
          </div>

          {/* Right - Registration Form */}
          <div className="lg:col-span-1">
            <EventRegistrationClient
              event={{
                id: event.id,
                title: event.title,
                price: event.price,
                isFull,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
