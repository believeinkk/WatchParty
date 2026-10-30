'use client';

import { motion } from 'framer-motion';
import { Clock, ShieldX, Loader2, ArrowLeft, Tv, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function WaitingRoom({
  roomId,
  username,
  status = 'waiting', // 'waiting' or 'rejected'
  rejectionReason,
  onReturnHome,
}) {
  const isRejected = status === 'rejected';

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-red-600 selection:text-white transition-colors duration-200">
      {/* Background Ambience */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-3xl pointer-events-none rounded-full transition-colors duration-700 ${
          isRejected ? 'bg-red-600/15' : 'bg-amber-500/10'
        }`}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-zinc-200/80 dark:border-white/20 rounded-3xl p-8 shadow-2xl relative text-center"
      >
        {/* Animated Status Icon */}
        <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
          {!isRejected ? (
            <>
              {/* Pulsing radar rings for waiting state */}
              <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-60" />
              <span className="absolute -inset-2 rounded-full border border-amber-500/30 animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-lg shadow-amber-500/20 relative z-10">
                <Clock className="w-8 h-8 animate-spin-slow" />
              </div>
            </>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 dark:text-red-400 shadow-lg shadow-red-500/20">
              <ShieldX className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title & Subtitle */}
        {!isRejected ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Waiting Room</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
              Waiting for Admin Approval
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed mb-6">
              The Admin has been notified of your request to enter this watch party. Please hold on
              while they admit you.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold mb-3">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Access Denied</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
              Join Request Declined
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed mb-6">
              {rejectionReason || 'Your request to join this watch party was declined by the Admin.'}
            </p>
          </>
        )}

        {/* Room Info Pill Box */}
        <div className="bg-zinc-100/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
              <Tv className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Party Room</p>
              <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">{roomId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[100px]">
              {username || 'Guest'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {onReturnHome ? (
            <button
              onClick={onReturnHome}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-800 dark:border-zinc-700 active:scale-[0.99]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Home</span>
            </button>
          ) : (
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-800 dark:border-zinc-700 active:scale-[0.99]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Home</span>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
