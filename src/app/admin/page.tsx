'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  CreditCard,
  Plus,
  Trash2,
  Pencil,
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
  MapPin,
  BookOpen,
  Image as ImageIcon,
  Play,
  Upload,
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

interface SermonItem {
  id: string;
  title: string;
  speaker: string;
  date: string;
  youtubeUrl?: string | null;
  description?: string | null;
}

interface GalleryItem {
  id: string;
  url: string;
  caption?: string | null;
  createdAt?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'events' | 'registrations' | 'sermons' | 'gallery'>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [sermons, setSermons] = useState<SermonItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilterInTable, setSelectedEventFilterInTable] = useState<string>('all');

  // Selected Event for Participants Detail View Modal
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<EventItem | null>(null);
  const [participantFilterStatus, setParticipantFilterStatus] = useState<string>('all');
  const [participantSearch, setParticipantSearch] = useState('');
  const [copiedPhones, setCopiedPhones] = useState(false);

  // Event Create / Edit Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    imageUrl: '',
    price: 0,
    capacity: 100,
  });

  // Sermon Create / Edit Modal State
  const [isSermonModalOpen, setIsSermonModalOpen] = useState(false);
  const [editingSermonId, setEditingSermonId] = useState<string | null>(null);
  const [sermonLoading, setSermonLoading] = useState(false);
  const [sermonFormData, setSermonFormData] = useState({
    title: '',
    speaker: '',
    date: '',
    youtubeUrl: '',
    description: '',
  });

  // Gallery Create / Edit Modal State
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFormData, setGalleryFormData] = useState({
    url: '',
    caption: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, regsRes, sermonsRes, galleryRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/registrations'),
        fetch('/api/admin/sermons'),
        fetch('/api/admin/gallery'),
      ]);

      if (eventsRes.ok) {
        const d = await eventsRes.json();
        setEvents(d.events || []);
      }
      if (regsRes.ok) {
        const d = await regsRes.json();
        setRegistrations(d.registrations || []);
      }
      if (sermonsRes.ok) {
        const d = await sermonsRes.json();
        setSermons(d.sermons || []);
      }
      if (galleryRes.ok) {
        const d = await galleryRes.json();
        setGallery(d.gallery || []);
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

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================
  const openCreateEventModal = () => {
    setEditingEventId(null);
    setEventFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      venue: '',
      imageUrl: '',
      price: 0,
      capacity: 100,
    });
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (event: EventItem) => {
    setEditingEventId(event.id);
    const formattedDate = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
    setEventFormData({
      title: event.title,
      description: event.description,
      date: formattedDate,
      time: event.time,
      venue: event.venue,
      imageUrl: event.imageUrl || '',
      price: event.price,
      capacity: event.capacity,
    });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventLoading(true);

    try {
      const url = editingEventId ? `/api/admin/events/${editingEventId}` : '/api/admin/events';
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventFormData),
      });

      if (res.ok) {
        setIsEventModalOpen(false);
        setEditingEventId(null);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save event');
      }
    } catch (err) {
      alert('An error occurred while saving the event.');
    } finally {
      setEventLoading(false);
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

  // =========================================================================
  // SERMON HANDLERS
  // =========================================================================
  const openCreateSermonModal = () => {
    setEditingSermonId(null);
    setSermonFormData({
      title: '',
      speaker: '',
      date: new Date().toISOString().split('T')[0],
      youtubeUrl: '',
      description: '',
    });
    setIsSermonModalOpen(true);
  };

  const openEditSermonModal = (sermon: SermonItem) => {
    setEditingSermonId(sermon.id);
    const formattedDate = sermon.date ? new Date(sermon.date).toISOString().split('T')[0] : '';
    setSermonFormData({
      title: sermon.title,
      speaker: sermon.speaker,
      date: formattedDate,
      youtubeUrl: sermon.youtubeUrl || '',
      description: sermon.description || '',
    });
    setIsSermonModalOpen(true);
  };

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSermonLoading(true);

    try {
      const url = editingSermonId ? `/api/admin/sermons/${editingSermonId}` : '/api/admin/sermons';
      const method = editingSermonId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sermonFormData),
      });

      if (res.ok) {
        setIsSermonModalOpen(false);
        setEditingSermonId(null);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save sermon');
      }
    } catch (err) {
      alert('An error occurred while saving the sermon.');
    } finally {
      setSermonLoading(false);
    }
  };

  const handleDeleteSermon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sermon?')) return;
    try {
      const res = await fetch(`/api/admin/sermons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSermons(sermons.filter((s) => s.id !== id));
      }
    } catch (err) {
      alert('Failed to delete sermon');
    }
  };

  // =========================================================================
  // GALLERY HANDLERS
  // =========================================================================
  const openCreateGalleryModal = () => {
    setEditingGalleryId(null);
    setGalleryFormData({
      url: '',
      caption: '',
    });
    setIsGalleryModalOpen(true);
  };

  const openEditGalleryModal = (item: GalleryItem) => {
    setEditingGalleryId(item.id);
    setGalleryFormData({
      url: item.url,
      caption: item.caption || '',
    });
    setIsGalleryModalOpen(true);
  };

  const handleGalleryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setGalleryFormData((prev) => ({ ...prev, url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryFormData.url.trim()) {
      alert('Please provide an image URL or upload an image file.');
      return;
    }
    setGalleryLoading(true);

    try {
      const endpoint = editingGalleryId
        ? `/api/admin/gallery/${editingGalleryId}`
        : '/api/admin/gallery';
      const method = editingGalleryId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(galleryFormData),
      });

      if (res.ok) {
        setIsGalleryModalOpen(false);
        setEditingGalleryId(null);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save gallery image');
      }
    } catch (err) {
      alert('An error occurred while saving the gallery image.');
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Are you sure you want to remove this photo from the gallery?')) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGallery(gallery.filter((g) => g.id !== id));
      }
    } catch (err) {
      alert('Failed to delete gallery photo');
    }
  };

  // =========================================================================
  // REGISTRATION HANDLERS
  // =========================================================================
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#16102B] border border-purple-900/40">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'events'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Events ({events.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'registrations'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registrations ({registrations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sermons')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'sermons'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Sermon Vault ({sermons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo Gallery ({gallery.length})</span>
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
                onClick={openCreateEventModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-purple-950 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </button>
            )}

            {activeTab === 'sermons' && (
              <button
                onClick={openCreateSermonModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs shadow-md shadow-amber-950/50 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Sermon</span>
              </button>
            )}

            {activeTab === 'gallery' && (
              <button
                onClick={openCreateGalleryModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-950 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Gallery Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: EVENTS (CLICKABLE TO SHOW PARTICIPANTS + EDIT / DELETE) */}
        {/* ========================================================================= */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>💡 Click on any event card to inspect participants, or use the Edit / Delete buttons below.</span>
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

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditEventModal(event);
                          }}
                          className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-500/20 transition"
                          title="Edit Event"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REGISTRATIONS & PAYMENTS */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* TAB 3: SERMON VAULT MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'sermons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Manage sermons displayed in the Sermon Vault section on the homepage.</span>
              <span>{sermons.length} Sermons Total</span>
            </div>

            {sermons.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#16102B] border border-purple-900/40 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm font-semibold text-white">No sermons in database yet</p>
                <p className="text-xs text-gray-400">Click &quot;Add New Sermon&quot; to publish teachings to the Sermon Vault.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sermons.map((sermon) => (
                  <div
                    key={sermon.id}
                    className="rounded-2xl bg-[#16102B] border border-purple-900/40 hover:border-amber-500/50 transition-all p-6 flex flex-col justify-between space-y-5 shadow-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="text-amber-400 font-semibold">{sermon.speaker}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {formatDate(sermon.date)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white line-clamp-2">{sermon.title}</h3>
                      {sermon.description && (
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                          {sermon.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-purple-900/30 flex items-center justify-between gap-2">
                      {sermon.youtubeUrl ? (
                        <a
                          href={sermon.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-amber-300 transition"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>YouTube Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">No video link</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditSermonModal(sermon)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSermon(sermon.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                          title="Delete Sermon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PHOTO GALLERY MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Manage fellowship photos displayed in the Moments & Memories gallery on the homepage.</span>
              <span>{gallery.length} Photos Total</span>
            </div>

            {gallery.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#16102B] border border-purple-900/40 text-center space-y-3">
                <ImageIcon className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-sm font-semibold text-white">No gallery photos in database yet</p>
                <p className="text-xs text-gray-400">Click &quot;Add Gallery Photo&quot; to upload images or add image URLs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((img) => (
                  <div
                    key={img.id}
                    className="group rounded-2xl overflow-hidden bg-[#16102B] border border-purple-900/40 hover:border-purple-500/60 shadow-xl flex flex-col justify-between transition-all"
                  >
                    <div className="relative h-56 w-full bg-[#0F0B1A] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.caption || 'Gallery image'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-4 flex items-center justify-between gap-3 bg-[#16102B]">
                      <p className="text-xs font-medium text-gray-200 line-clamp-2 flex-1">
                        {img.caption || 'MCK Beyond Youth Community'}
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditGalleryModal(img)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteGallery(img.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EVENT PARTICIPANTS & AVAILABILITY STATUS INSPECTOR */}
      {/* ========================================================================= */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#16102B] border border-purple-800/50 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-gray-100 max-h-[92vh] flex flex-col space-y-6">
            <button
              onClick={() => setSelectedEventForParticipants(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

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

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT EVENT */}
      {/* ========================================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#16102B] border border-purple-800/40 rounded-2xl shadow-2xl p-6 text-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingEventId ? 'Edit Ministry Event' : 'Create New Ministry Event'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  placeholder="e.g. Beyond Worship Experience 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
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
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-300 mb-1">Time *</label>
                  <input
                    type="text"
                    required
                    value={eventFormData.time}
                    onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
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
                  value={eventFormData.venue}
                  onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
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
                    value={eventFormData.price}
                    onChange={(e) => setEventFormData({ ...eventFormData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-300 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={eventFormData.capacity}
                    onChange={(e) => setEventFormData({ ...eventFormData, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={eventFormData.imageUrl}
                  onChange={(e) => setEventFormData({ ...eventFormData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 transition"
                >
                  {eventLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingEventId ? 'Save Changes' : 'Save & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT SERMON */}
      {/* ========================================================================= */}
      {isSermonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#16102B] border border-purple-800/40 rounded-2xl shadow-2xl p-6 text-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSermonModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingSermonId ? 'Edit Sermon Entry' : 'Add New Sermon to Vault'}
            </h3>

            <form onSubmit={handleSaveSermon} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-300 mb-1">Sermon Title *</label>
                <input
                  type="text"
                  required
                  value={sermonFormData.title}
                  onChange={(e) => setSermonFormData({ ...sermonFormData, title: e.target.value })}
                  placeholder="e.g. Unashamed: Living With Conviction"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-300 mb-1">Speaker / Preacher *</label>
                  <input
                    type="text"
                    required
                    value={sermonFormData.speaker}
                    onChange={(e) => setSermonFormData({ ...sermonFormData, speaker: e.target.value })}
                    placeholder="e.g. Pastor David Mwangi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-300 mb-1">Date Preached *</label>
                  <input
                    type="date"
                    required
                    value={sermonFormData.date}
                    onChange={(e) => setSermonFormData({ ...sermonFormData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">YouTube Video / Watch Link</label>
                <input
                  type="url"
                  value={sermonFormData.youtubeUrl}
                  onChange={(e) => setSermonFormData({ ...sermonFormData, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">Sermon Summary / Description</label>
                <textarea
                  rows={3}
                  value={sermonFormData.description}
                  onChange={(e) => setSermonFormData({ ...sermonFormData, description: e.target.value })}
                  placeholder="Brief summary of the message and key scripture..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSermonModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sermonLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-bold flex items-center gap-2 disabled:opacity-50 transition"
                >
                  {sermonLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingSermonId ? 'Update Sermon' : 'Publish Sermon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT GALLERY PHOTO */}
      {/* ========================================================================= */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#16102B] border border-purple-800/40 rounded-2xl shadow-2xl p-6 text-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsGalleryModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingGalleryId ? 'Edit Gallery Photo' : 'Add Photo to Gallery'}
            </h3>

            <form onSubmit={handleSaveGallery} className="space-y-4 text-xs">
              {/* Upload from device */}
              <div>
                <label className="block font-medium text-gray-300 mb-1.5">
                  Upload Photo File (or paste an Image URL below)
                </label>
                <label className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-purple-800/60 hover:border-indigo-500 bg-[#0F0B1A] cursor-pointer transition text-gray-300 hover:text-white">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Choose Image from Device (JPG / PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">Image URL *</label>
                <input
                  type="text"
                  required
                  value={galleryFormData.url}
                  onChange={(e) => setGalleryFormData({ ...galleryFormData, url: e.target.value })}
                  placeholder="https://images.unsplash.com/... or uploaded image"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {galleryFormData.url && (
                <div className="rounded-xl overflow-hidden border border-purple-900/50 bg-[#0F0B1A] h-44">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={galleryFormData.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-300 mb-1">Caption / Moment Description</label>
                <input
                  type="text"
                  value={galleryFormData.caption}
                  onChange={(e) => setGalleryFormData({ ...galleryFormData, caption: e.target.value })}
                  placeholder="e.g. Sunday Celebration Worship"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={galleryLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 transition"
                >
                  {galleryLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingGalleryId ? 'Update Photo' : 'Add to Gallery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
