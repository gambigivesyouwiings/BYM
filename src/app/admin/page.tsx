'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  LogOut,
  ExternalLink,
  Flame,
  X,
  Loader2,
  RefreshCw,
  Search,
  Copy,
  Check,
  Eye,
  Filter,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  imageUrl?: string | null;
  price: number;
  capacity: number;
  isActive: boolean;
  _count?: {
    registrations: number;
  };
}

interface RegistrationItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  payerName?: string | null;
  status: string;
  mpesaCode: string | null;
  mpesaScreenshot: string | null;
  amountPaid: number | null;
  createdAt: string;
  eventId?: string;
  event: {
    id: string;
    title: string;
    date: string;
    price: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'events' | 'registrations'>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilterInTable, setSelectedEventFilterInTable] = useState<string>('all');

  // Selected Event for Participants Detail View Modal
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<EventItem | null>(null);
  const [participantFilterStatus, setParticipantFilterStatus] = useState<string>('all');
  const [participantSearch, setParticipantSearch] = useState('');
  const [copiedPhones, setCopiedPhones] = useState(false);

  // New Event Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    imageUrl: '',
    price: 0,
    capacity: 100,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, regsRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/registrations'),
      ]);

      if (eventsRes.ok) {
        const d = await eventsRes.json();
        setEvents(d.events || []);
      }
      if (regsRes.ok) {
        const d = await regsRes.json();
        setRegistrations(d.registrations || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventData),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewEventData({
          title: '',
          description: '',
          date: '',
          time: '',
          venue: '',
          imageUrl: '',
          price: 0,
          capacity: 100,
        });
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create event');
      }
    } catch (err) {
      alert('An error occurred while creating the event.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event and its registrations?')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(events.filter((e) => e.id !== id));
        setRegistrations(registrations.filter((r) => r.event?.id !== id));
        if (selectedEventForParticipants?.id === id) {
          setSelectedEventForParticipants(null);
        }
      }
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      alert('Failed to update registration status');
    }
  };

  // Copy all phone numbers for selected event
  const handleCopyPhones = (eventRegs: RegistrationItem[]) => {
    const phones = eventRegs
      .map((r) => r.phone.trim())
      .filter(Boolean)
      .join(', ');
    if (phones) {
      navigator.clipboard.writeText(phones);
      setCopiedPhones(true);
      setTimeout(() => setCopiedPhones(false), 2500);
    }
  };

  // Stats calculation
  const totalRegistrations = registrations.length;
  const confirmedCount = registrations.filter((r) => r.status === 'confirmed').length;
  const totalRevenue = registrations.reduce((acc, r) => acc + (r.amountPaid || 0), 0);

  // Filter registrations for main table
  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      (r.payerName && r.payerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.mpesaCode && r.mpesaCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.event?.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEvent =
      selectedEventFilterInTable === 'all' || r.event?.id === selectedEventFilterInTable;

    return matchesSearch && matchesEvent;
  });

  // Registrations specific to selected event in the Participants Modal
  const eventParticipants = selectedEventForParticipants
    ? registrations.filter((r) => r.event?.id === selectedEventForParticipants.id)
    : [];

  const filteredEventParticipants = eventParticipants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
      r.phone.includes(participantSearch) ||
      (r.payerName && r.payerName.toLowerCase().includes(participantSearch.toLowerCase())) ||
      (r.mpesaCode && r.mpesaCode.toLowerCase().includes(participantSearch.toLowerCase()));

    const matchesStatus =
      participantFilterStatus === 'all' || r.status === participantFilterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0A0713] text-gray-100 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-950">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">MCK Beyond Youth Ministries Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-900/40 text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-[#16102B] border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium uppercase tracking-wider">Total Events</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{events.length}</div>
            <span className="text-[11px] text-gray-400">Active & upcoming programs</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#16102B] border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium uppercase tracking-wider">Registrations</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">{totalRegistrations}</div>
            <span className="text-[11px] text-gray-400">Across all youth gatherings</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#16102B] border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium uppercase tracking-wider">Confirmed</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{confirmedCount}</div>
            <span className="text-[11px] text-gray-400">Seats reserved & settled</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#16102B] border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium uppercase tracking-wider">Collections</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400">
              {formatCurrency(totalRevenue)}
            </div>
            <span className="text-[11px] text-gray-400">M-Pesa registered passes</span>
          </div>
        </div>

        {/* Tab Controls & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center p-1 rounded-xl bg-[#16102B] border border-purple-900/40">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'events'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Events Management ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'registrations'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Registrations & Payments ({registrations.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-900/40 text-gray-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {activeTab === 'events' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-purple-950 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: EVENTS (CLICKABLE TO SHOW PARTICIPANTS) */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>💡 Click on any event card or the &quot;View Participants&quot; button to see attendees and their availability status.</span>
              <span>{events.length} Events Total</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const eventRegs = registrations.filter((r) => r.event?.id === event.id);
                const regCount = eventRegs.length;
                const eventConfirmed = eventRegs.filter((r) => r.status === 'confirmed').length;
                const eventProvisional = eventRegs.filter((r) => r.status === 'provisional').length;
                const fillPercentage = Math.min(100, Math.round((regCount / event.capacity) * 100));

                return (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEventForParticipants(event);
                      setParticipantFilterStatus('all');
                      setParticipantSearch('');
                    }}
                    className="group rounded-2xl bg-[#16102B] border border-purple-900/40 hover:border-indigo-500/80 hover:bg-[#1A1333] transition-all duration-200 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-950/60 flex flex-col justify-between cursor-pointer relative"
                  >
                    <div className="p-6 space-y-4">
                      {/* Top Bar with Title and Price */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                            {event.title}
                          </h3>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {event.time}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                            event.price === 0
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {event.price === 0 ? 'FREE' : formatCurrency(event.price)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-xs text-gray-300 pt-2 border-t border-purple-900/30">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      </div>

                      {/* Capacity & Availability Progress */}
                      <div className="pt-2 border-t border-purple-900/30 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 font-medium">Capacity Filled:</span>
                          <span className="font-bold text-indigo-300">
                            {regCount} / {event.capacity} seats ({fillPercentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#0F0B1A] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              fillPercentage >= 100
                                ? 'bg-red-500'
                                : fillPercentage > 75
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            }`}
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>

                        {/* Breakdown pills */}
                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                            {eventConfirmed} Confirmed
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-medium">
                            {eventProvisional} Provisional
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-4 bg-[#0F0B1A]/80 border-t border-purple-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-amber-300 transition-colors">
                        <Users className="w-4 h-4" />
                        <span>View Participants ({regCount})</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: REGISTRATIONS & PAYMENTS */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            {/* Filter Bar with Search and Event Select */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by attendee, email, phone, or M-Pesa code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#16102B] border border-purple-900/40 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Event Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-400 shrink-0" />
                <select
                  value={selectedEventFilterInTable}
                  onChange={(e) => setSelectedEventFilterInTable(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#16102B] border border-purple-900/40 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="all">Filter by Event: All Events ({registrations.length})</option>
                  {events.map((e) => {
                    const count = registrations.filter((r) => r.event?.id === e.id).length;
                    return (
                      <option key={e.id} value={e.id}>
                        {e.title} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-[#16102B] border border-purple-900/40 overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F0B1A] text-gray-400 uppercase tracking-wider border-b border-purple-900/40">
                  <tr>
                    <th className="p-4">Attendee</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">M-Pesa Ref</th>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Availability / Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-gray-300">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No registrations found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4 font-semibold text-white">
                          <p>{reg.name}</p>
                          {reg.payerName && reg.payerName !== reg.name && (
                            <span className="text-[10px] text-amber-300/90 font-medium block">
                              Group / Paid by: {reg.payerName}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500 font-normal">
                            Registered {new Date(reg.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{reg.email}</span>
                          </p>
                          <p className="text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span>{reg.phone}</span>
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-purple-200">{reg.event?.title}</p>
                          <p className="text-[11px] text-gray-400">
                            {reg.event?.price === 0 ? 'Free Entry' : formatCurrency(reg.event?.price)}
                          </p>
                        </td>
                        <td className="p-4 font-mono font-semibold text-amber-300">
                          {reg.mpesaCode || '—'}
                        </td>
                        <td className="p-4">
                          {reg.mpesaScreenshot ? (
                            <a
                              href={reg.mpesaScreenshot}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-[11px] font-medium transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Proof</span>
                            </a>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <select
                            value={reg.status}
                            onChange={(e) => handleUpdateStatus(reg.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-transparent cursor-pointer focus:outline-none ${
                              reg.status === 'confirmed'
                                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                : reg.status === 'attended'
                                ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                                : reg.status === 'payment_uploaded'
                                ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                                : 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10'
                            }`}
                          >
                            <option value="confirmed" className="bg-[#16102B] text-emerald-400">
                              Confirmed
                            </option>
                            <option value="provisional" className="bg-[#16102B] text-indigo-300">
                              Provisional
                            </option>
                            <option value="payment_uploaded" className="bg-[#16102B] text-amber-300">
                              Proof Review
                            </option>
                            <option value="attended" className="bg-[#16102B] text-blue-400">
                              Attended
                            </option>
                          </select>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {reg.status !== 'confirmed' ? (
                            <button
                              onClick={() => handleUpdateStatus(reg.id, 'confirmed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(reg.id, 'provisional')}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-[11px] transition"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EVENT PARTICIPANTS & AVAILABILITY STATUS INSPECTOR */}
      {/* ========================================================================= */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#16102B] border border-purple-800/50 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-gray-100 max-h-[92vh] flex flex-col space-y-6">
            {/* Close Button */}
            <button
              onClick={() => setSelectedEventForParticipants(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Event Header Banner */}
            <div className="border-b border-purple-900/40 pb-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Event Participants Roster
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedEventForParticipants.price === 0
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {selectedEventForParticipants.price === 0
                    ? 'Free Entry'
                    : formatCurrency(selectedEventForParticipants.price)}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {selectedEventForParticipants.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {formatDate(selectedEventForParticipants.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {selectedEventForParticipants.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {selectedEventForParticipants.venue}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    {eventParticipants.length} / {selectedEventForParticipants.capacity} Seats Filled
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[#0F0B1A] overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (eventParticipants.length / selectedEventForParticipants.capacity) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Availability Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setParticipantFilterStatus('all')}
                className={`p-3 rounded-xl border text-left transition ${
                  participantFilterStatus === 'all'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : 'bg-[#0F0B1A]/80 border-purple-900/30 text-gray-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider font-semibold">All Participants</div>
                <div className="text-xl font-extrabold text-white mt-1">{eventParticipants.length}</div>
              </button>

              <button
                type="button"
                onClick={() => setParticipantFilterStatus('confirmed')}
                className={`p-3 rounded-xl border text-left transition ${
                  participantFilterStatus === 'confirmed'
                    ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md'
                    : 'bg-[#0F0B1A]/80 border-purple-900/30 text-gray-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400">
                  Confirmed / Available
                </div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">
                  {eventParticipants.filter((r) => r.status === 'confirmed').length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setParticipantFilterStatus('provisional')}
                className={`p-3 rounded-xl border text-left transition ${
                  participantFilterStatus === 'provisional'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : 'bg-[#0F0B1A]/80 border-purple-900/30 text-gray-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider font-semibold text-indigo-300">
                  Provisional RSVP
                </div>
                <div className="text-xl font-extrabold text-indigo-300 mt-1">
                  {eventParticipants.filter((r) => r.status === 'provisional').length}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setParticipantFilterStatus('payment_uploaded')}
                className={`p-3 rounded-xl border text-left transition ${
                  participantFilterStatus === 'payment_uploaded'
                    ? 'bg-amber-600/30 border-amber-500 text-white shadow-md'
                    : 'bg-[#0F0B1A]/80 border-purple-900/30 text-gray-400 hover:text-white'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider font-semibold text-amber-300">
                  Proof Review
                </div>
                <div className="text-xl font-extrabold text-amber-300 mt-1">
                  {eventParticipants.filter((r) => r.status === 'payment_uploaded').length}
                </div>
              </button>
            </div>

            {/* Filter & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter attendees by name, phone, or email..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0F0B1A] border border-purple-900/40 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPhones(filteredEventParticipants)}
                  disabled={filteredEventParticipants.length === 0}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-800/40 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition disabled:opacity-40"
                  title="Copy attendee phone numbers for SMS/WhatsApp"
                >
                  {copiedPhones ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Phones ({filteredEventParticipants.length})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventFilterInTable(selectedEventForParticipants.id);
                    setActiveTab('registrations');
                    setSelectedEventForParticipants(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 flex items-center gap-1.5 transition"
                >
                  <span>Full Table View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Participants Table Container */}
            <div className="flex-1 overflow-y-auto rounded-2xl bg-[#0F0B1A] border border-purple-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#120B22] text-gray-400 uppercase tracking-wider border-b border-purple-900/40 sticky top-0 z-10">
                  <tr>
                    <th className="p-3.5">Attendee</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Availability / Status</th>
                    <th className="p-3.5">Payment Ref</th>
                    <th className="p-3.5">Proof</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-gray-300">
                  {filteredEventParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        {eventParticipants.length === 0
                          ? 'No one has registered for this event yet.'
                          : 'No participants found matching your filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredEventParticipants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-3.5 font-semibold text-white">
                          <p>{participant.name}</p>
                          {participant.payerName && participant.payerName !== participant.name && (
                            <span className="text-[10px] text-amber-300/90 font-medium block">
                              Group / Paid by: {participant.payerName}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500 font-normal">
                            Registered {new Date(participant.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="text-gray-300 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-500" />
                            <span>{participant.email}</span>
                          </p>
                          <p className="text-amber-300/90 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span>{participant.phone}</span>
                          </p>
                        </td>
                        <td className="p-3.5">
                          <select
                            value={participant.status}
                            onChange={(e) => handleUpdateStatus(participant.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-transparent cursor-pointer focus:outline-none ${
                              participant.status === 'confirmed'
                                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                : participant.status === 'attended'
                                ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                                : participant.status === 'payment_uploaded'
                                ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                                : 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10'
                            }`}
                          >
                            <option value="confirmed" className="bg-[#16102B] text-emerald-400">
                              Confirmed / Available
                            </option>
                            <option value="provisional" className="bg-[#16102B] text-indigo-300">
                              Provisional RSVP
                            </option>
                            <option value="payment_uploaded" className="bg-[#16102B] text-amber-300">
                              Proof Review
                            </option>
                            <option value="attended" className="bg-[#16102B] text-blue-400">
                              Attended / Present
                            </option>
                          </select>
                        </td>
                        <td className="p-3.5 font-mono text-amber-300 font-medium">
                          {participant.mpesaCode || '—'}
                        </td>
                        <td className="p-3.5">
                          {participant.mpesaScreenshot ? (
                            <a
                              href={participant.mpesaScreenshot}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 text-[11px] font-medium transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </a>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {participant.status !== 'confirmed' ? (
                            <button
                              onClick={() => handleUpdateStatus(participant.id, 'confirmed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] transition shadow"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(participant.id, 'provisional')}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] transition"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-purple-900/30">
              <span>Showing {filteredEventParticipants.length} of {eventParticipants.length} participants</span>
              <button
                type="button"
                onClick={() => setSelectedEventForParticipants(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold transition"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#16102B] border border-purple-800/40 rounded-2xl shadow-2xl p-6 text-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Create New Ministry Event</h3>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newEventData.title}
                  onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                  placeholder="e.g. Beyond Worship Experience 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                  placeholder="Detail the theme, guest minister, vision..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newEventData.date}
                    onChange={(e) => setNewEventData({ ...newEventData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-300 mb-1">Time *</label>
                  <input
                    type="text"
                    required
                    value={newEventData.time}
                    onChange={(e) => setNewEventData({ ...newEventData, time: e.target.value })}
                    placeholder="e.g. 10:00 AM - 04:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">Venue *</label>
                <input
                  type="text"
                  required
                  value={newEventData.venue}
                  onChange={(e) => setNewEventData({ ...newEventData, venue: e.target.value })}
                  placeholder="e.g. MCK Sanctuary, Nairobi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-300 mb-1">Fee (KES, 0 for Free)</label>
                  <input
                    type="number"
                    min="0"
                    value={newEventData.price}
                    onChange={(e) => setNewEventData({ ...newEventData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-300 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={newEventData.capacity}
                    onChange={(e) => setNewEventData({ ...newEventData, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={newEventData.imageUrl}
                  onChange={(e) => setNewEventData({ ...newEventData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 transition"
                >
                  {createLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
