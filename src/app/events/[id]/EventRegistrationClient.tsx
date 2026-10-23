'use client';

import React, { useState, useRef } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Smartphone,
  Upload,
  FileImage,
  User,
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  Sparkles,
  X,
  Info,
  Search,
  BookmarkCheck,
  CheckCircle2,
  Edit3,
  Save,
} from 'lucide-react';
import { formatCurrency, compressImageToDataUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface EventRegistrationClientProps {
  event: {
    id: string;
    title: string;
    price: number;
    isFull: boolean;
  };
}

type PaymentMethod = 'provisional' | 'stk_push' | 'manual_code' | 'upload_screenshot';

interface FoundReservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  payerName?: string | null;
  status: string;
  mpesaCode?: string | null;
  amountPaid?: number | null;
  createdAt: string;
}

export default function EventRegistrationClient({
  event,
}: EventRegistrationClientProps) {
  const router = useRouter();
  
  // Tab mode: 'register' = New booking, 'pay_existing' = Edit / Pay for an existing reservation
  const [activeMode, setActiveMode] = useState<'register' | 'pay_existing'>('register');

  // New Registration State
  const [participantNames, setParticipantNames] = useState<string[]>(['']);
  const [payerName, setPayerName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    mpesaCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('provisional');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stkLoading, setStkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registeredList, setRegisteredList] = useState<string[]>([]);
  const [lastUsedPhone, setLastUsedPhone] = useState('');
  const [stkStatus, setStkStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pay / Edit Existing Reservation State
  const [lookupQuery, setLookupQuery] = useState('');
  const [searchingLookup, setSearchingLookup] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [existingReservations, setExistingReservations] = useState<FoundReservation[]>([]);
  const [payMethodExisting, setPayMethodExisting] = useState<'stk_push' | 'manual_code' | 'upload_screenshot'>('manual_code');
  const [existingMpesaCode, setExistingMpesaCode] = useState('');
  const [existingScreenshotFile, setExistingScreenshotFile] = useState<File | null>(null);
  const [existingScreenshotPreview, setExistingScreenshotPreview] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentConfirmSuccess, setPaymentConfirmSuccess] = useState<string | null>(null);
  const existingFileInputRef = useRef<HTMLInputElement>(null);

  // Ticket Editing State
  const [editingRegId, setEditingRegId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    payerName: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const ticketCount = participantNames.length;
  const totalPrice = event.price * ticketCount;

  // Handle adding another participant name
  const handleAddParticipant = () => {
    if (participantNames.length >= 10) {
      setError('You can register up to 10 participants per submission.');
      return;
    }
    setParticipantNames([...participantNames, '']);
    setError(null);
  };

  // Handle removing a participant
  const handleRemoveParticipant = (index: number) => {
    if (participantNames.length <= 1) return;
    const updated = participantNames.filter((_, idx) => idx !== index);
    setParticipantNames(updated);
  };

  // Handle updating a participant's name
  const handleParticipantNameChange = (index: number, val: string) => {
    const updated = [...participantNames];
    updated[index] = val;
    setParticipantNames(updated);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot file must be under 5MB');
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

  const handleExistingScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot file must be under 5MB');
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

  const handleStkPush = async (amount: number, phoneToUse: string) => {
    if (!phoneToUse || phoneToUse.trim().length < 9) {
      setError('Please enter a valid phone number for STK Push');
      return;
    }
    setStkLoading(true);
    setStkStatus(null);
    setError(null);

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
        throw new Error(data.error || 'STK Push failed');
      }

      setStkStatus(
        `STK Push for KES ${amount.toLocaleString()} sent! Check your phone and enter your M-Pesa PIN. Once received, enter the M-Pesa code below or submit your registration.`
      );
      if (activeMode === 'register') {
        setPaymentMethod('manual_code');
      } else {
        setPayMethodExisting('manual_code');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to initiate STK Push. Please try manual payment.');
      }
    } finally {
      setStkLoading(false);
    }
  };

  // Lookup existing reservations by phone or email
  const handleLookupReservations = async (overrideQuery?: string) => {
    const q = (overrideQuery || lookupQuery).trim();
    if (!q || q.length < 3) {
      setError('Please enter your phone number or email to look up your reservation.');
      return;
    }

    setSearchingLookup(true);
    setError(null);
    setPaymentConfirmSuccess(null);
    setEditingRegId(null);

    try {
      const res = await fetch(`/api/reservations/lookup?query=${encodeURIComponent(q)}&eventId=${event.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to look up reservations.');
      }

      setExistingReservations(data.registrations || []);
      setLookupDone(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to look up reservations.');
      }
    } finally {
      setSearchingLookup(false);
    }
  };

  const handleStartEdit = (reg: FoundReservation) => {
    setEditingRegId(reg.id);
    setEditForm({
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
      payerName: reg.payerName || '',
    });
    setError(null);
    setPaymentConfirmSuccess(null);
  };

  const handleSaveEdit = async (regId: string) => {
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      setError('Participant name, email, and phone number are required.');
      return;
    }

    setSavingEdit(true);
    setError(null);
    setPaymentConfirmSuccess(null);

    try {
      const res = await fetch(`/api/reservations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          payerName: editForm.payerName.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update ticket details.');
      }

      setExistingReservations((prev) =>
        prev.map((r) => (r.id === regId ? data.registration : r))
      );
      setEditingRegId(null);
      setPaymentConfirmSuccess(data.message || 'Ticket details updated successfully!');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update ticket details.');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Confirm payment for existing unpaid reservations
  const handleConfirmExistingPayment = async (unpaidRegs: FoundReservation[]) => {
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
        throw new Error(data.error || 'Failed to submit payment confirmation.');
      }

      setPaymentConfirmSuccess(data.message || 'Payment proof submitted successfully!');
      setExistingMpesaCode('');
      setExistingScreenshotFile(null);
      setExistingScreenshotPreview(null);
      setStkStatus(null);

      // Re-fetch reservations
      handleLookupReservations();
      // Refresh RSC attendees roster
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while confirming payment.');
      }
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const cleanedNames = participantNames.map((n) => n.trim()).filter((n) => n.length > 0);

    if (cleanedNames.length === 0) {
      setError('Please provide at least one participant full name.');
      setLoading(false);
      return;
    }

    const lowerNames = cleanedNames.map((n) => n.toLowerCase());
    const uniqueNames = new Set(lowerNames);
    if (uniqueNames.size !== lowerNames.length) {
      setError('Each participant in your group must have a unique, distinct name.');
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
        if (paymentMethod === 'manual_code' && formData.mpesaCode) {
          payload.mpesaCode = formData.mpesaCode.trim().toUpperCase();
        }

        if (paymentMethod === 'upload_screenshot' && screenshotFile) {
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
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(data.message || 'Registration submitted successfully!');
      setRegisteredList(cleanedNames);
      setLastUsedPhone(formData.phone.trim());
      setParticipantNames(['']);
      setPayerName('');
      setFormData({ email: '', phone: '', mpesaCode: '' });
      setScreenshotFile(null);
      setScreenshotPreview(null);

      router.refresh();
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

  if (event.isFull && activeMode === 'register') {
    return (
      <div className="glass-card p-8 text-center sticky top-24 space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-500/20 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Event Capacity Reached</h3>
        <p className="text-sm text-slate-400">
          New registrations are currently closed. If you already have a provisional booking, you can still complete your payment below.
        </p>
        <button
          onClick={() => setActiveMode('pay_existing')}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <CreditCard className="w-4 h-4" />
          <span>Complete Payment for Existing Reservation</span>
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="glass-card p-8 text-center sticky top-24 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Registration Recorded!</h3>
        <p className="text-sm text-slate-300">{success}</p>

        {registeredList.length > 0 && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-left">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">
              Registered Participants ({registeredList.length}):
            </p>
            <ul className="text-xs text-white space-y-1.5">
              {registeredList.map((pName, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{pName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              setActiveMode('pay_existing');
              setLookupQuery(lastUsedPhone);
              handleLookupReservations(lastUsedPhone);
              setSuccess(null);
            }}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950"
          >
            <Edit3 className="w-4 h-4" />
            <span>
              {event.price > 0
                ? 'Edit Ticket Details / Pay Now'
                : 'View & Edit Ticket Details'}
            </span>
          </button>

          <button
            onClick={() => {
              setSuccess(null);
              setStkStatus(null);
              setRegisteredList([]);
            }}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
          >
            Register More Participants
          </button>
        </div>
      </div>
    );
  }

  // Calculate unpaid reservations in the lookup tab
  const unpaidExisting = existingReservations.filter((r) => r.status === 'provisional' && event.price > 0);
  const totalExistingDue = unpaidExisting.length * event.price;

  return (
    <div className="glass-card p-6 sticky top-24 space-y-5">
      {/* Top Mode Toggle */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-background border border-white/10 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveMode('register');
            setError(null);
          }}
          className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeMode === 'register'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Booking</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('pay_existing');
            setError(null);
          }}
          className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeMode === 'pay_existing'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-emerald-400'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{event.price > 0 ? 'Edit / Pay Tickets' : 'Edit My Tickets'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {stkStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
          <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{stkStatus}</span>
        </div>
      )}

      {paymentConfirmSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{paymentConfirmSuccess}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: NEW REGISTRATION                                                  */}
      {/* ========================================================================= */}
      {activeMode === 'register' && (
        <>
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Event Registration</span>
            </h4>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
              {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-700/30 text-[11px] text-indigo-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              You can pay for <strong>multiple participants</strong> using one mobile number.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Participant Names Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-accent" />
                  <span>Participant Names</span>
                  <span className="text-accent">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {ticketCount} {ticketCount === 1 ? 'person' : 'people'}
                </span>
              </div>

              <div className="space-y-2">
                {participantNames.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 w-4">
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
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500"
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
                className="w-full py-2 px-3 rounded-xl border border-dashed border-primary-500/40 text-primary-300 hover:bg-primary-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Another Participant (Pay for Multiple)</span>
              </button>
            </div>

            {/* Contact & Payer Info */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <p className="text-xs font-semibold text-slate-200">
                Contact & Payment Details
              </p>

              {ticketCount > 1 && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Payer / Coordinator Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder={participantNames[0] || 'Name of person paying'}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-primary-500"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  Contact Email <span className="text-accent">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. contact@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  M-Pesa Phone Number <span className="text-accent">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0712345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Payment Section for Paid Events */}
            {event.price > 0 && (
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <span className="text-xs text-slate-400 block">Total Due</span>
                    <span className="text-[11px] text-slate-500">
                      {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} × {formatCurrency(event.price)}
                    </span>
                  </div>
                  <span className="text-base font-extrabold text-accent">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'provisional' as const, label: 'Reserve Spots', icon: User },
                    { key: 'stk_push' as const, label: 'STK Push', icon: Smartphone },
                    { key: 'manual_code' as const, label: 'M-Pesa Code', icon: CreditCard },
                    { key: 'upload_screenshot' as const, label: 'Upload Proof', icon: Upload },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentMethod(key)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                        paymentMethod === key
                          ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'provisional' && (
                  <div className="p-3 rounded-xl bg-primary-900/20 border border-primary-800/30 text-xs text-primary-200 space-y-1">
                    <p className="font-semibold">📋 Reserve {ticketCount} Provisional Spot(s)</p>
                    <p className="text-slate-400">
                      Reserve your spots now and pay later. You can return to this page anytime to complete payment via M-Pesa.
                    </p>
                  </div>
                )}

                {paymentMethod === 'stk_push' && (
                  <div className="p-3.5 rounded-xl bg-emerald-900/20 border border-emerald-800/30 text-xs text-emerald-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>Lipa Na M-Pesa (STK Push)</span>
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-slate-300">
                      Automated STK Push is coming soon! For now, please send{' '}
                      <strong className="text-accent">{formatCurrency(totalPrice)}</strong> via M-Pesa Send Money to{' '}
                      <strong className="text-white">0704390997 (Belinda Muthee)</strong>, then enter your M-Pesa code or upload a screenshot.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('manual_code')}
                        className="flex-1 py-2 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-xs transition"
                      >
                        Enter M-Pesa Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upload_screenshot')}
                        className="flex-1 py-2 px-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 font-semibold text-xs transition"
                      >
                        Upload Proof
                      </button>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'manual_code' || paymentMethod === 'upload_screenshot') && (
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs space-y-1.5">
                    <p className="font-semibold text-accent flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      M-Pesa Payment Details
                    </p>
                    <p className="text-slate-300">
                      Send Money To: <strong className="text-white font-mono">0704390997</strong>
                    </p>
                    <p className="text-slate-300">
                      Recipient Name: <strong className="text-white">Belinda Muthee</strong>
                    </p>
                    <p className="text-slate-300">
                      Amount: <strong className="text-accent">{formatCurrency(totalPrice)}</strong>
                    </p>
                  </div>
                )}

                {paymentMethod === 'manual_code' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        M-Pesa Transaction Code
                      </label>
                      <input
                        type="text"
                        value={formData.mpesaCode}
                        onChange={(e) =>
                          setFormData({ ...formData, mpesaCode: e.target.value })
                        }
                        placeholder="e.g. QKH78923KL"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 uppercase tracking-wider font-mono"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'upload_screenshot' && (
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
                          alt="M-Pesa screenshot"
                          className="w-full h-36 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotFile(null);
                            setScreenshotPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-6 rounded-xl border border-dashed border-white/10 hover:border-primary-500/30 bg-white/[0.02] flex flex-col items-center gap-2 transition"
                      >
                        <Upload className="w-6 h-6 text-slate-500" />
                        <span className="text-xs text-slate-400">
                          Click to upload payment screenshot (max 5MB)
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-gradient hover:opacity-90 text-white font-semibold text-sm shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2 disabled:opacity-50 transition mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : event.price === 0 ? (
                `Confirm Free Registration (${ticketCount} ${ticketCount === 1 ? 'seat' : 'seats'})`
              ) : paymentMethod === 'provisional' ? (
                `Reserve ${ticketCount} Spot(s) (Pay Later)`
              ) : (
                `Complete Registration (${formatCurrency(totalPrice)})`
              )}
            </button>
          </form>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: EDIT / COMPLETE PAYMENT FOR EXISTING RESERVATION                   */}
      {/* ========================================================================= */}
      {activeMode === 'pay_existing' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>Edit Ticket Details & Manage Payment</span>
            </h4>
            <p className="text-xs text-slate-400">
              Enter the phone number or email used during registration to edit your ticket details{event.price > 0 ? ' or submit payment proof' : ''}.
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
              placeholder="e.g. 0712345678"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={searchingLookup}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition"
            >
              {searchingLookup ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Find</span>
            </button>
          </form>

          {/* Results of lookup */}
          {lookupDone && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              {existingReservations.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-white">No Reservations Found</p>
                  <p className="text-[11px] text-slate-400">
                    No booking found for this event under <strong className="text-slate-200">{lookupQuery}</strong>. Make sure your phone number matches.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Found {existingReservations.length} Ticket(s):
                    </span>
                    {unpaidExisting.length > 0 && (
                      <span className="text-accent font-bold">
                        {unpaidExisting.length} Unpaid ({formatCurrency(totalExistingDue)})
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {existingReservations.map((reg) => {
                      const isEditing = editingRegId === reg.id;

                      return (
                        <div
                          key={reg.id}
                          className={`p-3 rounded-xl bg-background border text-xs transition ${
                            isEditing
                              ? 'border-primary-500/50 space-y-3'
                              : 'border-white/10 flex items-start justify-between gap-2'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <span className="font-bold text-primary-300 flex items-center gap-1.5">
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Edit Ticket (#{reg.id.slice(-6).toUpperCase()})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingRegId(null)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                    Attendee Full Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, name: e.target.value })
                                    }
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:border-primary-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                    Phone Number *
                                  </label>
                                  <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, phone: e.target.value })
                                    }
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:border-primary-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                    Email Address *
                                  </label>
                                  <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, email: e.target.value })
                                    }
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:border-primary-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                    Booked By / Coordinator (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.payerName}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, payerName: e.target.value })
                                    }
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs focus:outline-none focus:border-primary-500"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingRegId(null)}
                                  disabled={savingEdit}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(reg.id)}
                                  disabled={savingEdit}
                                  className="px-3.5 py-1.5 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                                >
                                  {savingEdit ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-3.5 h-3.5" />
                                      Save
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0 space-y-0.5">
                                <p className="font-semibold text-white truncate">{reg.name}</p>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {reg.phone} • {reg.email}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  Booked: {new Date(reg.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                {reg.status === 'confirmed' || reg.status === 'attended' ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Confirmed
                                  </span>
                                ) : reg.status === 'payment_uploaded' ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Payment Under Review
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    Unpaid RSVP
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(reg)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[10px] font-semibold transition"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  Edit
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Options if there are unpaid spots */}
                  {unpaidExisting.length > 0 ? (
                    <div className="pt-3 border-t border-white/5 space-y-3">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/30">
                        <span className="text-xs text-emerald-200">Amount Due:</span>
                        <span className="text-sm font-bold text-accent">
                          {formatCurrency(totalExistingDue)}
                        </span>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPayMethodExisting('stk_push')}
                          className={`py-2 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 border transition ${
                            payMethodExisting === 'stk_push'
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>STK Push</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayMethodExisting('manual_code')}
                          className={`py-2 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 border transition ${
                            payMethodExisting === 'manual_code'
                              ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>M-Pesa Code</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayMethodExisting('upload_screenshot')}
                          className={`py-2 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 border transition ${
                            payMethodExisting === 'upload_screenshot'
                              ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Proof</span>
                        </button>
                      </div>

                      {/* Option 1: STK Push */}
                      {payMethodExisting === 'stk_push' && (
                        <div className="p-3 rounded-xl bg-emerald-900/20 border border-emerald-800/30 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                              STK Push Prompt
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Coming Soon
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px]">
                            Automated STK Push is coming soon! For now, please send{' '}
                            <strong className="text-accent">{formatCurrency(totalExistingDue)}</strong> via M-Pesa Send Money to{' '}
                            <strong className="text-white">0704390997 (Belinda Muthee)</strong>, then enter your M-Pesa code or upload proof.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setPayMethodExisting('manual_code')}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-semibold text-[11px] transition"
                            >
                              Enter M-Pesa Code
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayMethodExisting('upload_screenshot')}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 font-semibold text-[11px] transition"
                            >
                              Upload Proof
                            </button>
                          </div>
                        </div>
                      )}

                      {(payMethodExisting === 'manual_code' || payMethodExisting === 'upload_screenshot') && (
                        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs space-y-1">
                          <p className="font-semibold text-accent flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            M-Pesa Payment Details
                          </p>
                          <p className="text-slate-300">
                            Send Money To: <strong className="text-white font-mono">0704390997</strong>
                          </p>
                          <p className="text-slate-300">
                            Recipient Name: <strong className="text-white">Belinda Muthee</strong>
                          </p>
                          <p className="text-slate-300">
                            Amount: <strong className="text-accent">{formatCurrency(totalExistingDue)}</strong>
                          </p>
                        </div>
                      )}

                      {/* Option 2: Manual Code */}
                      {payMethodExisting === 'manual_code' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={existingMpesaCode}
                            onChange={(e) => setExistingMpesaCode(e.target.value)}
                            placeholder="Enter 10-digit M-Pesa Code"
                            className="w-full px-3 py-2 rounded-xl bg-background border border-white/10 text-white text-xs font-mono uppercase focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}

                      {/* Option 3: Upload Screenshot */}
                      {payMethodExisting === 'upload_screenshot' && (
                        <div className="space-y-2">
                          <input
                            ref={existingFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleExistingScreenshotChange}
                            className="hidden"
                          />
                          {existingScreenshotPreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-white/10">
                              <img
                                src={existingScreenshotPreview}
                                alt="Proof preview"
                                className="w-full h-28 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setExistingScreenshotFile(null);
                                  setExistingScreenshotPreview(null);
                                }}
                                className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => existingFileInputRef.current?.click()}
                              className="w-full py-4 rounded-xl border border-dashed border-white/15 hover:border-purple-500 bg-white/[0.02] text-xs text-slate-400 flex flex-col items-center justify-center gap-1 transition"
                            >
                              <Upload className="w-5 h-5 text-slate-500" />
                              <span>Select M-Pesa Screenshot</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Submit Confirmation */}
                      {(payMethodExisting === 'manual_code' || payMethodExisting === 'upload_screenshot') && (
                        <button
                          type="button"
                          onClick={() => handleConfirmExistingPayment(unpaidExisting)}
                          disabled={
                            confirmingPayment ||
                            (payMethodExisting === 'manual_code' && existingMpesaCode.trim().length < 5) ||
                            (payMethodExisting === 'upload_screenshot' && !existingScreenshotFile)
                          }
                          className="w-full py-2.5 rounded-xl bg-brand-gradient hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition"
                        >
                          {confirmingPayment ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Confirming Payment...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Submit Payment Proof for Approval
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>All tickets under this lookup are already confirmed or in review!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return compressImageToDataUrl(file);
}
