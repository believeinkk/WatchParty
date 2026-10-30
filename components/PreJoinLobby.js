'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Tv,
  User,
  LogIn,
  Play,
  Sparkles,
  Radio,
  Shield,
  Volume2,
  ArrowRight,
  MessageSquare,
  Smile,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function PreJoinLobby({
  roomId,
  initialUsername = '',
  session = null,
  onJoin,
}) {
  const [displayName, setDisplayName] = useState(
    initialUsername || session?.user?.name || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = Boolean(session?.user);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName && !isAuthenticated) return;
    
    setIsSubmitting(true);
    onJoin(cleanName || session?.user?.name || 'Guest Viewer');
  };

  const initialLetter = (displayName || session?.user?.name || 'G')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between z-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-600/25 group-hover:shadow-red-600/40 transition-shadow">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                WatchParty
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-600 dark:text-red-400">
                LIVE
              </span>
            </div>
            <p className="text-[10px] font-medium text-zinc-400">Synchronized Cinema</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Room: {roomId}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Pre-Join Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left: Google Meet Style Stream Preview Stage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-7 flex flex-col items-center"
          >
            <div className="w-full aspect-video rounded-3xl bg-zinc-900 dark:bg-black border border-zinc-200/80 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 group">
              {/* Subtle Animated Background Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Top Bar inside Preview */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Playback Ready</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-xs font-mono">
                  <Lock className="w-3 h-3 text-red-400" />
                  <span>{roomId}</span>
                </div>
              </div>

              {/* Center User Avatar & Visual Pulse */}
              <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-red-600/20 blur-xl animate-pulse" />
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 border-4 border-white/20 dark:border-zinc-800 shadow-2xl flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold select-none">
                    {initialLetter}
                  </div>
                </div>
                <h3 className="mt-4 text-sm sm:text-base font-semibold text-white drop-shadow truncate max-w-xs text-center">
                  {displayName.trim() || (isAuthenticated ? session?.user?.name : 'Guest User')}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {isAuthenticated ? 'Authenticated Member' : 'Guest Viewer'}
                </p>
              </div>

              {/* Bottom Feature Badges */}
              <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-medium">
                  <Volume2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Audio Sync</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-medium">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Chat</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-medium">
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reactions</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>No software or extension needed. Connects directly in browser.</span>
            </p>
          </motion.div>

          {/* Right: Join Form & Profile Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pre-Join Lobby</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
                Ready to watch?
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                Choose how you appear to others in this watch party before entering.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Authenticated user banner if logged in */}
                {isAuthenticated ? (
                  <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {session?.user?.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      Logged In
                    </span>
                  </div>
                ) : null}

                {/* Display Name Input */}
                <div>
                  <label
                    htmlFor="lobby-display-name"
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5"
                  >
                    Your Display Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="lobby-display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name (e.g. Alex)"
                      maxLength={30}
                      required
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                    This name will be displayed in the room participant list and live chat.
                  </p>
                </div>

                {/* Action Buttons: Join Button + Optional Login Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    id="join-party-btn"
                    type="submit"
                    disabled={isSubmitting || (!displayName.trim() && !isAuthenticated)}
                    className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/25 hover:shadow-red-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Join Room</span>
                      </>
                    )}
                  </button>

                  {/* Login to Account Button for Guests */}
                  {!isAuthenticated && (
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(`/room/${roomId}`)}`}
                      className="py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-sm border border-zinc-200 dark:border-zinc-700/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      title="Sign in with your WatchParty account"
                    >
                      <LogIn className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="whitespace-nowrap">Login to Account</span>
                    </Link>
                  )}
                </div>

                {!isAuthenticated && (
                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-zinc-400">
                      Want host permissions and saved history?{' '}
                      <Link
                        href={`/login?callbackUrl=${encodeURIComponent(`/room/${roomId}`)}`}
                        className="text-red-500 hover:underline font-semibold"
                      >
                        Sign in now
                      </Link>
                    </p>
                  </div>
                )}
              </form>

              {/* Room Security / Notice info */}
              <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 text-zinc-400 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Protected room. The room host may require approval to join.</span>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-zinc-400 z-10">
        <p>© {new Date().getFullYear()} WatchParty. Real-time synchronized video streaming.</p>
      </footer>
    </div>
  );
}
