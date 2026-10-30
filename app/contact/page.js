'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Mail,
  Send,
  MessageSquare,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Globe,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Technical Support',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    'Technical Support',
    'Bug Report',
    'Feature Suggestion',
    'General Inquiry',
    'Partnership',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          category: formData.category,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry. Please try again.');
      }

      setStatus('success');
      // Automatically clear all input fields
      setFormData({
        name: '',
        email: '',
        category: 'Technical Support',
        subject: '',
        message: '',
      });
    } catch (err) {
      console.error('[Contact Error]:', err);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white transition-colors duration-200 relative">
      {/* Success Toast */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/95 dark:bg-zinc-900/95 border border-emerald-500/30 text-white shadow-2xl backdrop-blur-xl"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">Message Sent Successfully!</p>
              <p className="text-[11px] text-zinc-400">Saved to database. We will reply soon.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="relative px-6 py-16 overflow-hidden border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 mb-5 shadow-sm"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-red-500" />
              <span>Developer & User Support</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-4"
            >
              Get in Touch with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 dark:from-red-500 dark:to-amber-400">
                WatchParty
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed"
            >
              Have a technical question about our WebSocket synchronization or need assistance with
              your Watch Party room? We respond within 24 hours.
            </motion.p>
          </div>
        </section>

        {/* Content Section: Form + Contact Cards */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Contact Cards & Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-5 space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Direct Channels</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Reach out directly through any of our official channels.
                </p>
              </div>

              {/* Card 1 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-start gap-4 shadow-sm">
                <div className="p-3 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Email Inquiries</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">support@watchparty.live</p>
                  <span className="inline-block mt-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    Average response: 2 hours
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-start gap-4 shadow-sm">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Live Room Feedback</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Submit bug reports regarding audio drift, participant controls, or lobby
                    requests.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-start gap-4 shadow-sm">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Operating Status</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      All WebSocket Systems Operational
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">99.98% uptime in last 30 days</p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Query Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-7"
            >
              <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 shadow-xl relative">
                <AnimatePresence mode="wait">
                  {status === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="py-12 text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Message Received!</h3>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                        Thank you for reaching out to the WatchParty engineering team. We have logged
                        your inquiry and will respond to your provided email shortly.
                      </p>
                      <button
                        onClick={() => setStatus('idle')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Send Another Inquiry</span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Send a Message</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Fill in your details below and our team will get back to you promptly.
                        </p>
                      </div>

                      {status === 'error' && errorMessage && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Your Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@example.com"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Inquiry Category
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Regarding video drift or lobby controls"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Message / Query Details <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Please provide details about your question, setup, or feedback..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-[0.99] cursor-pointer"
                      >
                        {status === 'loading' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Inquiry</span>
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
