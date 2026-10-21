'use client';

import React, { useState } from 'react';
import { Users, Search, Sparkles, CheckCircle2, BookmarkCheck, Clock, UserCheck } from 'lucide-react';

export interface PublicParticipant {
  id: string;
  name: string;
  status: string;
  createdAt: string | Date;
}

interface EventParticipantsListProps {
  participants: PublicParticipant[];
  eventTitle: string;
}

// Helper to generate consistent avatar gradient based on name
function getAvatarGradient(name: string): string {
  const gradients = [
    'from-indigo-600 to-purple-600',
    'from-purple-600 to-pink-600',
    'from-amber-500 to-red-500',
    'from-emerald-500 to-teal-600',
    'from-blue-600 to-indigo-600',
    'from-amber-600 to-orange-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Helper to get initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EventParticipantsList({
  participants,
  eventTitle,
}: EventParticipantsListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'provisional'>('all');

  const filtered = participants.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'confirmed'
        ? p.status === 'confirmed' || p.status === 'attended'
        : p.status === 'provisional' || p.status === 'payment_uploaded';
    return matchesSearch && matchesFilter;
  });

  const confirmedCount = participants.filter(
    (p) => p.status === 'confirmed' || p.status === 'attended'
  ).length;
  const provisionalCount = participants.filter(
    (p) => p.status === 'provisional' || p.status === 'payment_uploaded'
  ).length;

  return (
    <div id="attendees" className="glass-card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-600/10 text-primary-300 border border-primary-500/20 mb-2">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>Community Roster</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Who&apos;s Attending
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            See other youth who have registered for <span className="text-slate-200 font-medium">{eventTitle}</span>
          </p>
        </div>

        {/* Total pill */}
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">
            {participants.length} {participants.length === 1 ? 'Person' : 'People'} Registered
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background border border-white/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({participants.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filter === 'confirmed'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirmed ({confirmedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('provisional')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filter === 'provisional'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            <BookmarkCheck className="w-3 h-3" />
            <span>Provisional ({provisionalCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search attendee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-background border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Participants Grid / List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-slate-500">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-300">
            {participants.length === 0
              ? 'No one has registered yet.'
              : 'No attendees match your search.'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {participants.length === 0
              ? 'Be the first to register and invite your friends to join this gathering!'
              : 'Try searching with another name or switch your filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((participant) => {
            const isConfirmed = participant.status === 'confirmed' || participant.status === 'attended';
            const isAttended = participant.status === 'attended';
            const gradient = getAvatarGradient(participant.name);
            const initials = getInitials(participant.name);

            return (
              <div
                key={participant.id}
                className="p-3.5 rounded-xl bg-background/60 border border-white/5 hover:border-primary-500/30 transition-all flex items-center gap-3 group"
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md`}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-primary-300 transition-colors">
                    {participant.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isAttended ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/20">
                        <UserCheck className="w-2.5 h-2.5" />
                        Attended
                      </span>
                    ) : isConfirmed ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Confirmed Seat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        <BookmarkCheck className="w-2.5 h-2.5" />
                        Provisional RSVP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
