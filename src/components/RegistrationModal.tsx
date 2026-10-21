'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Sparkles,
  Smartphone,
  Upload,
  FileImage,
  User,
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  BookmarkCheck,
  Info,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import EventParticipantsList, { PublicParticipant } from './EventParticipantsList';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string | Date;
  time: string;
  venue: string;
  price: number;
  capacity: number;
}

interface RegistrationModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
}

type PaymentOption = 'provisional' | 'stk_push' | 'manual_code' | 'upload_screenshot';

export default function RegistrationModal({
  event,
  isOpen,
  onClose,
}: RegistrationModalProps) {
  const [participantNames, setParticipantNames] = useState<string[]>(['']);
  const [payerName, setPayerName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    mpesaCode: '',
  });
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('provisional');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [stkLoading, setStkLoading] = useState(false);
  const [stkMessage, setStkMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [registeredBatch, setRegisteredBatch] = useState<string[]>([]);

  const [activeModalTab, setActiveModalTab] = useState<'register' | 'attendees' | 'pay_existing'>('register');
  const [participants, setParticipants] = useState<PublicParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Pay Existing Reservation state
  const [lookupQuery, setLookupQuery] = useState('');
  const [searchingLookup, setSearchingLookup] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const [payMethodExisting, setPayMethodExisting] = useState<'stk_push' | 'manual_code' | 'upload_screenshot'>('stk_push');
  const [existingMpesaCode, setExistingMpesaCode] = useState('');
  const [existingScreenshotFile, setExistingScreenshotFile] = useState<File | null>(null);
  const [existingScreenshotPreview, setExistingScreenshotPreview] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentConfirmSuccess, setPaymentConfirmSuccess] = useState<string | null>(null);
  const existingFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && event?.id) {
      setLoadingParticipants(true);
      fetch(`/api/events/${event.id}/participants`)
        .then((res) => res.json())
        .then((data) => {
          setParticipants(data.participants || []);
        })
        .catch((err) => console.error('Failed to load participants', err))
        .finally(() => setLoadingParticipants(false));
    }
  }, [isOpen, event?.id]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !event) return null;

  const ticketCount = participantNames.length;
  const totalPrice = event.price * ticketCount;

  const handleAddParticipant = () => {
    if (participantNames.length >= 10) {
      setError('You can register up to 10 participants per submission.');
      return;
    }
    setParticipantNames([...participantNames, '']);
    setError(null);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participantNames.length <= 1) return;
    setParticipantNames(participantNames.filter((_, idx) => idx !== index));
  };

  const handleParticipantNameChange = (index: number, val: string) => {
    const updated = [...participantNames];
    updated[index] = val;
    setParticipantNames(updated);
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot size must not exceed 5MB');
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExistingScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot size must not exceed 5MB');
        return;
      }
      setExistingScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setExistingScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerStkPush = async (amount: number, phoneToUse: string) => {
    if (!phoneToUse || phoneToUse.trim().length < 9) {
      setError('Please provide a valid M-Pesa phone number first.');
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
          phone: phoneToUse.trim(),
          amount,
          eventId: event.id,
          accountRef: `BEYOND-${event.id.slice(-4).toUpperCase()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger STK Push.');
      }

      setStkMessage(
        `STK prompt for KES ${amount.toLocaleString()} sent to your phone! Please input your M-Pesa PIN. Once received, enter the M-Pesa code below or submit your registration.`
      );
      if (activeModalTab === 'register') {
        setPaymentOption('manual_code');
      } else {
        setPayMethodExisting('manual_code');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to initiate STK Push. Try manual payment or upload.');
      }
    } finally {
      setStkLoading(false);
    }
  };

  const handleLookupReservations = async () => {
    if (!lookupQuery.trim() || lookupQuery.trim().length < 3) {
      setError('Please enter your phone number or email.');
      return;
    }

    setSearchingLookup(true);
    setError(null);
    setPaymentConfirmSuccess(null);

    try {
      const res = await fetch(`/api/reservations/lookup?query=${encodeURIComponent(lookupQuery.trim())}&eventId=${event.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to find reservations.');
      }

      setExistingReservations(data.registrations || []);
      setLookupDone(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to find reservations.');
      }
    } finally {
      setSearchingLookup(false);
    }
  };

  const handleConfirmExistingPayment = async (unpaidRegs: any[]) => {
    setConfirmingPayment(true);
    setError(null);

    try {
      let base64Screenshot: string | undefined = undefined;
      if (payMethodExisting === 'upload_screenshot' && existingScreenshotFile) {
        base64Screenshot = await fileToBase64(existingScreenshotFile);
      }

      const res = await fetch('/api/reservations/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationIds: unpaidRegs.map((r) => r.id),
          paymentMethod: payMethodExisting,
          mpesaCode: existingMpesaCode.trim().toUpperCase() || undefined,
          mpesaScreenshot: base64Screenshot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm payment.');
      }

      setPaymentConfirmSuccess(data.message || 'Payment proof submitted!');
      setExistingMpesaCode('');
      setExistingScreenshotFile(null);
      setExistingScreenshotPreview(null);
      setStkMessage(null);

      handleLookupReservations();
      // Also refresh participants in modal
      fetch(`/api/events/${event.id}/participants`)
        .then((r) => r.json())
        .then((d) => setParticipants(d.participants || []))
        .catch((err) => console.error(err));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const cleanedNames = participantNames.map((n) => n.trim()).filter((n) => n.length > 0);

    if (cleanedNames.length === 0) {
      setError('Please provide at least one participant full name.');
      setLoading(false);
      return;
    }

    const lowerNames = cleanedNames.map((n) => n.toLowerCase());
    const uniqueNames = new Set(lowerNames);
    if (uniqueNames.size !== lowerNames.length) {
      setError('Each participant in your ticket group must have a distinct name.');
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, any> = {
        names: cleanedNames,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        payerName: payerName.trim() || cleanedNames[0],
      };

      if (event.price > 0) {
        if (paymentOption === 'manual_code' && formData.mpesaCode) {
          payload.mpesaCode = formData.mpesaCode.trim().toUpperCase();
        } else if (paymentOption === 'upload_screenshot' && screenshotFile) {
          const base64 = await fileToBase64(screenshotFile);
          payload.mpesaScreenshot = base64;
          payload.mpesaCode = 'SCREENSHOT_UPLOADED';
        }
      }

      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration.');
      }

      setSuccessMessage(data.message || 'Registration successfully submitted!');
      setRegisteredBatch(cleanedNames);
      setParticipantNames(['']);
      setPayerName('');
      setFormData({ email: '', phone: '', mpesaCode: '' });
      setScreenshotFile(null);
      setScreenshotPreview(null);

      // Refresh public participants roster
      if (event?.id) {
        fetch(`/api/events/${event.id}/participants`)
          .then((r) => r.json())
          .then((d) => setParticipants(d.participants || []))
          .catch((err) => console.error(err));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const unpaidExisting = existingReservations.filter((r) => r.status === 'provisional' && event.price > 0);
  const totalExistingDue = unpaidExisting.length * event.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#140E24] border border-purple-800/50 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-gray-100 my-8 z-10 max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-purple-900/40 pb-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-900/40 text-purple-300 border border-purple-700/50">
              Registration & Payment
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                event.price === 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {event.price === 0 ? 'Free Entry' : `${formatCurrency(event.price)} / ticket`}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {event.title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              📅 {formatDate(event.date)}
            </span>
            <span className="flex items-center gap-1.5">
              ⏰ {event.time}
            </span>
            <span className="flex items-center gap-1.5 text-purple-300">
              📍 {event.venue}
            </span>
          </div>

          {/* Modal Tab Switcher: Register Form vs Who's Attending vs Pay for Reserved */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveModalTab('register');
                setError(null);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                activeModalTab === 'register'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Register Tickets</span>
            </button>

            {event.price > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('pay_existing');
                  setError(null);
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  activeModalTab === 'pay_existing'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay for Reserved</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveModalTab('attendees');
                setError(null);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                activeModalTab === 'attendees'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Who&apos;s Attending ({participants.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto pr-1 py-4 flex-1 space-y-5">
          {/* TAB 1: WHO'S ATTENDING */}
          {activeModalTab === 'attendees' && (
            <div className="space-y-4">
              {loadingParticipants ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  <span className="text-xs">Loading attendees roster...</span>
                </div>
              ) : (
                <EventParticipantsList
                  participants={participants}
                  eventTitle={event.title}
                />
              )}
            </div>
          )}

          {/* TAB 2: PAY FOR EXISTING RESERVATION */}
          {activeModalTab === 'pay_existing' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Find Your Provisional Reservation</span>
                </h4>
                <p className="text-xs text-gray-400">
                  Enter your mobile phone number or email to view your unpaid spots and pay via M-Pesa.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupReservations();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. 0712345678 or your@email.com"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={searchingLookup}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
                >
                  {searchingLookup ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Find Reservation</span>
                </button>
              </form>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {stkMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{stkMessage}</span>
                </div>
              )}

              {paymentConfirmSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentConfirmSuccess}</span>
                </div>
              )}

              {lookupDone && (
                <div className="space-y-4 pt-3 border-t border-purple-900/40">
                  {existingReservations.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                      <p className="text-sm font-semibold text-white">No Reservations Found</p>
                      <p className="text-xs text-gray-400">
                        No bookings found for this event under <strong className="text-gray-200">{lookupQuery}</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-300">
                          {existingReservations.length} Reservation(s) Found
                        </span>
                        {unpaidExisting.length > 0 && (
                          <span className="text-amber-400 font-bold">
                            Total Due: {formatCurrency(totalExistingDue)} ({unpaidExisting.length} spots)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {existingReservations.map((reg) => (
                          <div
                            key={reg.id}
                            className="p-3 rounded-xl bg-[#0F0B1A] border border-purple-900/40 flex items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <p className="font-semibold text-white">{reg.name}</p>
                              <span className="text-[10px] text-gray-500 block">
                                Ref: #{reg.id.slice(-6).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              {reg.status === 'confirmed' || reg.status === 'attended' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                  Confirmed
                                </span>
                              ) : reg.status === 'payment_uploaded' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                                  In Review
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                                  Unpaid
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {unpaidExisting.length > 0 ? (
                        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">
                              Pay for {unpaidExisting.length} Unpaid Spot(s)
                            </span>
                            <span className="text-sm font-extrabold text-amber-400">
                              {formatCurrency(totalExistingDue)}
                            </span>
                          </div>

                          {/* Payment Mode Selector */}
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setPayMethodExisting('stk_push')}
                              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition ${
                                payMethodExisting === 'stk_push'
                                  ? 'bg-emerald-600/30 border-emerald-500 text-white'
                                  : 'bg-[#0F0B1A] border-purple-900/40 text-gray-400 hover:text-white'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>STK Push</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPayMethodExisting('manual_code')}
                              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition ${
                                payMethodExisting === 'manual_code'
                                  ? 'bg-amber-600/30 border-amber-500 text-white'
                                  : 'bg-[#0F0B1A] border-purple-900/40 text-gray-400 hover:text-white'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                              <span>M-Pesa Code</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPayMethodExisting('upload_screenshot')}
                              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition ${
                                payMethodExisting === 'upload_screenshot'
                                  ? 'bg-purple-600/30 border-purple-500 text-white'
                                  : 'bg-[#0F0B1A] border-purple-900/40 text-gray-400 hover:text-white'
                              }`}
                            >
                              <Upload className="w-3.5 h-3.5 text-purple-400" />
                              <span>Screenshot</span>
                            </button>
                          </div>

                          {payMethodExisting === 'stk_push' && (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => handleTriggerStkPush(totalExistingDue, lookupQuery)}
                                disabled={stkLoading || !lookupQuery}
                                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition"
                              >
                                {stkLoading ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Sending prompt...</span>
                                  </>
                                ) : (
                                  <>
                                    <Smartphone className="w-3.5 h-3.5" />
                                    <span>Send STK Push for {formatCurrency(totalExistingDue)}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {payMethodExisting === 'manual_code' && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={existingMpesaCode}
                                onChange={(e) => setExistingMpesaCode(e.target.value)}
                                placeholder="Enter 10-digit M-Pesa transaction code"
                                className="w-full px-3.5 py-2 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-500 uppercase tracking-widest font-mono"
                              />
                            </div>
                          )}

                          {payMethodExisting === 'upload_screenshot' && (
                            <div className="space-y-2">
                              <input
                                ref={existingFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleExistingScreenshotSelect}
                                className="hidden"
                              />
                              {existingScreenshotPreview ? (
                                <div className="relative rounded-xl overflow-hidden border border-purple-800/50">
                                  <img
                                    src={existingScreenshotPreview}
                                    alt="M-Pesa preview"
                                    className="w-full h-32 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExistingScreenshotFile(null);
                                      setExistingScreenshotPreview(null);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => existingFileInputRef.current?.click()}
                                  className="w-full py-5 rounded-xl border border-dashed border-purple-800/60 bg-[#0F0B1A] flex flex-col items-center justify-center gap-1 text-xs text-gray-400 hover:border-purple-500 transition"
                                >
                                  <Upload className="w-5 h-5 text-purple-400" />
                                  <span>Click to select M-Pesa Screenshot</span>
                                </button>
                              )}
                            </div>
                          )}

                          {(payMethodExisting === 'manual_code' || payMethodExisting === 'upload_screenshot') && (
                            <button
                              type="button"
                              onClick={() => handleConfirmExistingPayment(unpaidExisting)}
                              disabled={
                                confirmingPayment ||
                                (payMethodExisting === 'manual_code' && existingMpesaCode.trim().length < 5) ||
                                (payMethodExisting === 'upload_screenshot' && !existingScreenshotFile)
                              }
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition"
                            >
                              {confirmingPayment ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Submitting Payment Proof...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Submit Payment Proof for Approval</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>All your tickets are already confirmed or in admin review!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGISTER NEW TICKETS */}
          {activeModalTab === 'register' && (
            successMessage ? (
              <div className="py-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Registration Successful!
                  </h3>
                  <p className="text-sm text-gray-300 max-w-md mx-auto">
                    {successMessage}
                  </p>
                </div>

                {registeredBatch.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-purple-900/40 text-left max-w-md mx-auto">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">
                      Registered Attendees ({registeredBatch.length}):
                    </p>
                    <ul className="text-xs text-white space-y-1">
                      {registeredBatch.map((pName, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{pName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMessage(null);
                      setRegisteredBatch([]);
                      setStkMessage(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm transition"
                  >
                    Register Another Group
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 text-white font-semibold text-xs sm:text-sm hover:opacity-95 shadow-lg transition"
                  >
                    Close & Return
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {stkMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                    <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{stkMessage}</span>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-700/30 text-xs text-indigo-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    You can register and pay for <strong>multiple participants</strong> with a single mobile number and payment.
                  </span>
                </div>

                {/* Participant Names List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Participant Names ({ticketCount})</span>
                      <span className="text-amber-400">*</span>
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {participantNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 w-4">
                            #{index + 1}
                          </span>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => handleParticipantNameChange(index, e.target.value)}
                            placeholder={
                              index === 0
                                ? 'Primary Attendee Full Name'
                                : `Participant #${index + 1} Full Name`
                            }
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                          />
                        </div>
                        {participantNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(index)}
                            className="p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition shrink-0"
                            title="Remove participant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Participant (Pay for Multiple)</span>
                  </button>
                </div>

                {/* Contact Information */}
                <div className="pt-3 border-t border-purple-900/40 space-y-3">
                  <p className="text-xs font-semibold text-gray-200">
                    Contact & Payment Information
                  </p>

                  {ticketCount > 1 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Payer / Group Leader Name (Optional)
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={payerName}
                          onChange={(e) => setPayerName(e.target.value)}
                          placeholder={participantNames[0] || 'Name of person paying'}
                          className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Email Address <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="e.g. samuel@example.com"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Phone Number (M-Pesa) <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g. 0712345678"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAYMENT TABS & OPTIONS FOR PAID EVENTS */}
                {event.price > 0 && (
                  <div className="pt-3 border-t border-purple-900/40 space-y-3.5">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-purple-900/40">
                      <div>
                        <span className="text-xs text-gray-400 block">Total Due</span>
                        <span className="text-[11px] text-gray-500">
                          {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} × {formatCurrency(event.price)}
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-amber-400">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentOption('provisional')}
                        className={`p-2.5 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center gap-1.5 transition border text-center ${
                          paymentOption === 'provisional'
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                            : 'bg-[#0F0B1A]/80 border-purple-900/40 text-gray-400 hover:text-white'
                        }`}
                      >
                        <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                        <span>Provisional RSVP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentOption('stk_push')}
                        className={`p-2.5 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center gap-1.5 transition border text-center ${
                          paymentOption === 'stk_push'
                            ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md'
                            : 'bg-[#0F0B1A]/80 border-purple-900/40 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>STK Push (PIN)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentOption('manual_code')}
                        className={`p-2.5 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center gap-1.5 transition border text-center ${
                          paymentOption === 'manual_code'
                            ? 'bg-amber-600/30 border-amber-500 text-white shadow-md'
                            : 'bg-[#0F0B1A]/80 border-purple-900/40 text-gray-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span>M-Pesa Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentOption('upload_screenshot')}
                        className={`p-2.5 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center gap-1.5 transition border text-center ${
                          paymentOption === 'upload_screenshot'
                            ? 'bg-purple-600/30 border-purple-500 text-white shadow-md'
                            : 'bg-[#0F0B1A]/80 border-purple-900/40 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Upload className="w-4 h-4 text-purple-400" />
                        <span>Upload Proof</span>
                      </button>
                    </div>

                    {paymentOption === 'provisional' && (
                      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 space-y-1">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                          Reserve {ticketCount} Provisional Spot(s)
                        </p>
                        <p className="text-gray-300">
                          Reserve spots for your group today. You can come back anytime to complete payment via M-Pesa.
                        </p>
                      </div>
                    )}

                    {paymentOption === 'stk_push' && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-3 text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            Prompt to Your Phone (Lipa Na M-Pesa)
                          </p>
                          <p className="text-gray-300">
                            Click below to send a payment request of{' '}
                            <strong className="text-amber-400">{formatCurrency(totalPrice)}</strong> ({ticketCount} tickets) directly to {formData.phone || 'your phone number'}.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTriggerStkPush(totalPrice, formData.phone)}
                          disabled={stkLoading || !formData.phone}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-lg shadow-emerald-950"
                        >
                          {stkLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Requesting M-Pesa Prompt...</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-4 h-4" />
                              <span>Trigger STK Push for {formatCurrency(totalPrice)}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {paymentOption === 'manual_code' && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs space-y-1 text-purple-200">
                          <p className="font-bold text-amber-400 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4" />
                            Manual M-Pesa Payment Details
                          </p>
                          <p>1. Paybill: <strong className="text-white">174379</strong></p>
                          <p>2. Account Number: <strong className="text-white">BEYOND-{event.id.slice(-4).toUpperCase()}</strong></p>
                          <p>3. Total Amount: <strong className="text-amber-400">{formatCurrency(totalPrice)}</strong> ({ticketCount} tickets)</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            M-Pesa Transaction Reference Code
                          </label>
                          <input
                            type="text"
                            value={formData.mpesaCode}
                            onChange={(e) => setFormData({ ...formData, mpesaCode: e.target.value })}
                            placeholder="e.g. QKH78923KL"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 uppercase tracking-widest font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {paymentOption === 'upload_screenshot' && (
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotSelect}
                          className="hidden"
                        />

                        {screenshotPreview ? (
                          <div className="relative rounded-2xl overflow-hidden border border-purple-700/50">
                            <img
                              src={screenshotPreview}
                              alt="M-Pesa screenshot preview"
                              className="w-full h-40 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setScreenshotFile(null);
                                setScreenshotPreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/70 hover:bg-black text-white transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-purple-800/60 hover:border-indigo-500 bg-[#0F0B1A]/60 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Upload className="w-5 h-5 text-purple-400" />
                            <span className="text-xs font-semibold text-gray-200">
                              Upload Payment Screenshot
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-950 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Registration...</span>
                      </>
                    ) : event.price === 0 ? (
                      `Confirm Free Registration (${ticketCount} ${ticketCount === 1 ? 'seat' : 'seats'})`
                    ) : paymentOption === 'provisional' ? (
                      `Reserve ${ticketCount} Provisional Spot(s)`
                    ) : (
                      `Complete Registration (${formatCurrency(totalPrice)})`
                    )}
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });
}
