'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

export default function PrayerRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending prayer request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', contact: '', message: '' });
    }, 800);
  };

  if (submitted) {
    return (
      <div className="p-8 rounded-2xl bg-[#16102B] border border-purple-900/40 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Prayer Request Received!</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          Thank you for reaching out. Our ministry prayer team will lift you up in faith and get in touch if requested. God bless you!
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-3 px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-purple-800/40 transition"
        >
          Send Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-2xl bg-[#16102B] border border-purple-900/40 shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Send Us a Message / Prayer Request</h3>
      <p className="text-xs text-gray-400 mb-6">We read every message and respond with love.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Your Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Joy Muthoni"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Email or Phone Number</label>
          <input
            type="text"
            required
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            placeholder="e.g. joy@example.com or 0712345678"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">How can we support or pray for you?</label>
          <textarea
            rows={4}
            required
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Share your prayer request, inquiry, or message..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0B1A] border border-purple-900/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 resize-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-950 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Prayer Request</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
