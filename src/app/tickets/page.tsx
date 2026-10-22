'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  BookmarkCheck,
  AlertCircle,
  Loader2,
  Smartphone,
  CreditCard,
  Upload,
  FileImage,
  X,
  ArrowLeft,
  Sparkles,
  Ticket,
  ChevronRight,
  User,
  Users,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatDate, compressImageToDataUrl } from '@/lib/utils';

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  imageUrl?: string | null;
}

interface RegistrationRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  payerName?: string | null;
  status: string;
  mpesaCode?: string | null;
  mpesaScreenshot?: string | null;
  amountPaid?: number | null;
  createdAt: string;
  event: EventData;
}

export default function MyTicketsPage() {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);

  // Payment modal/state for an event's unpaid tickets
  const [payingEventId, setPayingEventId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'stk_push' | 'manual_code' | 'upload_screenshot'>('stk_push');
  const [stkPhone, setStkPhone] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [stkLoading, setStkLoading] = useState(false);
  const [stkMessage, setStkMessage] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (searchVal?: string) => {
    const val = (searchVal || query).trim();
    if (!val || val.length < 3) {
      setError('Please enter a valid phone number or email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentSuccess(null);
    setPayingEventId(null);

    try {
      const res = await fetch(`/api/reservations/lookup?query=${encodeURIComponent(val)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search for reservations.');
      }

      setRegistrations(data.registrations || []);
      setSearchedQuery(val);
      setHasSearched(true);
      if (data.registrations?.[0]?.phone) {
        setStkPhone(data.registrations[0].phone);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while searching.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Group registrations by event
  const eventsMap = new Map<string, { event: EventData; regs: RegistrationRecord[] }>();
  registrations.forEach((r) => {
    if (!eventsMap.has(r.event.id)) {
      eventsMap.set(r.event.id, { event: r.event, regs: [] });
    }
    eventsMap.get(r.event.id)!.regs.push(r);
  });
  const groupedEvents = Array.from(eventsMap.values());

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot size must be under 5MB');
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerStkPush = async (amount: number, eventId: string) => {
    if (!stkPhone || stkPhone.trim().length < 9) {
      setError('Please enter a valid M-Pesa phone number.');
      return;
    }

    setStkLoading(true);
    setError(null);
    setStkMessage(null);

    try {
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkPhone.trim(),
          amount,
          eventId,
          accountRef: `BEYOND-${eventId.slice(-4).toUpperCase()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'STK Push failed');
      }

      setStkMessage(
        `STK Push for KES ${amount.toLocaleString()} sent to ${stkPhone}! Enter your M-Pesa PIN on your phone, then enter your confirmation code below.`
      );
      setPayMethod('manual_code');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to trigger STK Push.');
      }
    } finally {
      setStkLoading(false);
    }
  };

  const handleConfirmPayment = async (unpaidRegs: RegistrationRecord[]) => {
    setSubmittingPayment(true);
    setError(null);

    try {
      let screenshotBase64: string | undefined = undefined;
      if (payMethod === 'upload_screenshot' && screenshotFile) {
        screenshotBase64 = await fileToBase64(screenshotFile);
      }

      const payload = {
        registrationIds: unpaidRegs.map((r) => r.id),
        paymentMethod: payMethod,
        mpesaCode: mpesaCode.trim().toUpperCase() || undefined,
        mpesaScreenshot: screenshotBase64,
        phone: stkPhone.trim(),
      };

      const res = await fetch('/api/reservations/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment confirmation failed');
      }

      setPaymentSuccess(data.message || 'Payment proof submitted successfully!');
      setPayingEventId(null);
      setMpesaCode('');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setStkMessage(null);

      // Refresh data
      if (searchedQuery) {
        handleSearch(searchedQuery);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while confirming payment.');
      }
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Events
          </Link>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-semibold tracking-wide uppercase">
            <Ticket className="w-3.5 h-3.5 text-accent" />
            <span>Ticket & Reservation Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Find My <span className="gradient-text">Tickets & Pay</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Reserved a spot provisionally? Enter your mobile phone number or email to complete your payment, upload an M-Pesa screenshot, or check your admission status.
          </p>
        </div>

        {/* Search Card */}
        <div className="glass-card p-6 sm:p-8 space-y-4 shadow-2xl">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Look Up By Mobile Number or Email
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 0712345678 or samuel@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-gradient text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0 shadow-lg shadow-primary-600/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Find My Reservations
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {paymentSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{paymentSuccess}</span>
            </div>
          )}
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Results for</span>
                <span className="text-accent font-mono text-sm">{searchedQuery}</span>
              </h2>
              <span className="text-xs text-slate-400">
                {registrations.length} {registrations.length === 1 ? 'ticket' : 'tickets'} found
              </span>
            </div>

            {groupedEvents.length === 0 ? (
              <div className="glass-card p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white/5 text-slate-400 mx-auto flex items-center justify-center">
                  <Ticket className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">No Reservations Found</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                  We couldn&apos;t find any reservations under <strong className="text-white">{searchedQuery}</strong>. Make sure you entered the exact phone number or email used during registration.
                </p>
                <div className="pt-2">
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                  >
                    <span>Browse Upcoming Events</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedEvents.map(({ event, regs }) => {
                  const unpaidRegs = regs.filter(
                    (r) => r.status === 'provisional' && event.price > 0
                  );
                  const isPayingThisEvent = payingEventId === event.id;
                  const totalDue = unpaidRegs.length * event.price;

                  return (
                    <div
                      key={event.id}
                      className="glass-card overflow-hidden border border-white/10 space-y-0"
                    >
                      {/* Event Banner */}
                      <div className="p-6 bg-white/[0.02] border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-300">
                            Event Booking
                          </span>
                          <h3 className="text-xl font-bold text-white">
                            <Link
                              href={`/events/${event.id}`}
                              className="hover:text-accent transition-colors"
                            >
                              {event.title}
                            </Link>
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-accent" />
                              {formatDate(event.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-primary-400" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-primary-purple" />
                              {event.venue}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              event.price === 0
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-accent/20 text-accent border border-accent/30'
                            }`}
                          >
                            {event.price === 0 ? 'FREE' : `${formatCurrency(event.price)} / seat`}
                          </span>
                          <span className="text-xs text-slate-400">
                            {regs.length} {regs.length === 1 ? 'ticket' : 'tickets'}
                          </span>
                        </div>
                      </div>

                      {/* Attendee Tickets List */}
                      <div className="p-6 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Registered Attendees
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {regs.map((reg) => {
                            const isConfirmed = reg.status === 'confirmed' || reg.status === 'attended';
                            const isReview = reg.status === 'payment_uploaded';
                            const isProvisional = reg.status === 'provisional';

                            return (
                              <div
                                key={reg.id}
                                className="p-3.5 rounded-xl bg-background border border-white/5 flex items-start justify-between gap-3"
                              >
                                <div>
                                  <h5 className="text-sm font-semibold text-white">
                                    {reg.name}
                                  </h5>
                                  {reg.payerName && reg.payerName !== reg.name && (
                                    <span className="text-[10px] text-amber-300/80 block mt-0.5">
                                      Booked by: {reg.payerName}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-500 block mt-0.5">
                                    Ref: #{reg.id.slice(-6).toUpperCase()} • {new Date(reg.createdAt).toLocaleDateString()}
                                  </span>
                                  {reg.mpesaCode && (
                                    <span className="text-[10px] text-indigo-300 font-mono block mt-0.5">
                                      M-Pesa: {reg.mpesaCode}
                                    </span>
                                  )}
                                </div>

                                <div className="shrink-0">
                                  {isConfirmed ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Confirmed
                                    </span>
                                  ) : isReview ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      <Clock className="w-3.5 h-3.5" />
                                      Payment Under Review
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                      <BookmarkCheck className="w-3.5 h-3.5" />
                                      Provisional RSVP
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Unpaid Action Callout */}
                        {unpaidRegs.length > 0 && !isPayingThisEvent && (
                          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4" />
                                Payment Required to Confirm
                              </p>
                              <p className="text-xs text-slate-300 mt-0.5">
                                You have {unpaidRegs.length} unpaid provisional {unpaidRegs.length === 1 ? 'spot' : 'spots'}. Total due:{' '}
                                <strong className="text-accent">{formatCurrency(totalDue)}</strong>.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPayingEventId(event.id);
                                setStkPhone(unpaidRegs[0].phone || searchedQuery);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shrink-0 shadow transition flex items-center justify-center gap-1.5"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Pay / Confirm {formatCurrency(totalDue)}</span>
                            </button>
                          </div>
                        )}

                        {/* Payment Box (Open when user clicks Pay) */}
                        {isPayingThisEvent && (
                          <div className="mt-4 p-5 rounded-2xl bg-[#140D26] border border-primary-500/40 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-accent" />
                                  <span>Complete Payment for {unpaidRegs.length} {unpaidRegs.length === 1 ? 'Ticket' : 'Tickets'}</span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Total to Pay: <strong className="text-accent">{formatCurrency(totalDue)}</strong>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPayingEventId(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Payment Tabs */}
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setPayMethod('stk_push')}
                                className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                                  payMethod === 'stk_push'
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>STK Push (PIN)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPayMethod('manual_code')}
                                className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                                  payMethod === 'manual_code'
                                    ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>M-Pesa Code</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPayMethod('upload_screenshot')}
                                className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                                  payMethod === 'upload_screenshot'
                                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Screenshot</span>
                              </button>
                            </div>

                            {stkMessage && (
                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                                <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{stkMessage}</span>
                              </div>
                            )}

                            {/* Option 1: STK Push */}
                            {payMethod === 'stk_push' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-slate-300 mb-1">
                                    M-Pesa Phone Number
                                  </label>
                                  <input
                                    type="tel"
                                    value={stkPhone}
                                    onChange={(e) => setStkPhone(e.target.value)}
                                    placeholder="0712345678"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-primary-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTriggerStkPush(totalDue, event.id)}
                                  disabled={stkLoading || !stkPhone}
                                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition"
                                >
                                  {stkLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Sending prompt for {formatCurrency(totalDue)}...
                                    </>
                                  ) : (
                                    <>
                                      <Smartphone className="w-4 h-4" />
                                      Send Lipa Na M-Pesa Prompt ({formatCurrency(totalDue)})
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Option 2: Manual Code */}
                            {payMethod === 'manual_code' && (
                              <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs space-y-1 text-purple-200">
                                  <p className="font-bold text-amber-400">Paybill Payment Instructions:</p>
                                  <p>1. Paybill: <strong className="text-white">174379</strong></p>
                                  <p>2. Account: <strong className="text-white">BEYOND-{event.id.slice(-4).toUpperCase()}</strong></p>
                                  <p>3. Amount: <strong className="text-amber-400">{formatCurrency(totalDue)}</strong></p>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-300 mb-1">
                                    M-Pesa Reference Code
                                  </label>
                                  <input
                                    type="text"
                                    value={mpesaCode}
                                    onChange={(e) => setMpesaCode(e.target.value)}
                                    placeholder="e.g. QKH78923KL"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-primary-500 uppercase font-mono tracking-wider"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Option 3: Upload Screenshot */}
                            {payMethod === 'upload_screenshot' && (
                              <div className="space-y-3">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleScreenshotChange}
                                  className="hidden"
                                />
                                {screenshotPreview ? (
                                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                                    <img
                                      src={screenshotPreview}
                                      alt="Screenshot preview"
                                      className="w-full h-36 object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setScreenshotFile(null);
                                        setScreenshotPreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                      }}
                                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-6 rounded-xl border border-dashed border-white/15 hover:border-primary-500/50 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400 transition"
                                  >
                                    <Upload className="w-6 h-6 text-slate-500" />
                                    <span>Upload M-Pesa Confirmation Message</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Submit Button for Manual Code or Screenshot */}
                            {(payMethod === 'manual_code' || payMethod === 'upload_screenshot') && (
                              <button
                                type="button"
                                onClick={() => handleConfirmPayment(unpaidRegs)}
                                disabled={
                                  submittingPayment ||
                                  (payMethod === 'manual_code' && mpesaCode.trim().length < 5) ||
                                  (payMethod === 'upload_screenshot' && !screenshotFile)
                                }
                                className="w-full py-2.5 rounded-xl bg-brand-gradient hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition"
                              >
                                {submittingPayment ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting Payment Proof...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Submit Payment Proof for Verification
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return compressImageToDataUrl(file);
}
