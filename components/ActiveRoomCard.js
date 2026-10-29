'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  ArrowRight,
  X,
  Crown,
  Shield,
  Film,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ActiveRoomCard({
  activeRoom,
  onDismiss,
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!activeRoom || !activeRoom.roomId) return null;

  const handleRejoin = () => {
    const params = new URLSearchParams();
    if (activeRoom.username) {
      params.set('username', activeRoom.username);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`/room/${encodeURIComponent(activeRoom.roomId)}${query}`);
  };

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(activeRoom.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleLower = activeRoom.role?.toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'host';
  const isCoAdmin = roleLower === 'co-admin' || roleLower === 'mod' || roleLower === 'moderator';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-lg mx-auto mb-8 rounded-3xl overflow-hidden border border-red-500/35 bg-white/95 dark:bg-zinc-900/90 shadow-2xl shadow-red-600/10 backdrop-blur-2xl"
    >
      {/* Subtle Top Gradient Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

      {/* Ambient background light */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-red-600/10 dark:bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="p-5 sm:p-6">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active Room Detected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Contextual Role Pill */}
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Admin</span>
              </span>
            ) : isCoAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                <Shield className="w-3 h-3 text-blue-500" />
                <span>Co-Admin</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                <span>Participant</span>
              </span>
            )}

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Dismiss and forget active room"
                aria-label="Dismiss active session"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Room Info Body */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Return to your Watch Party
            </h3>
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 font-mono">Room ID:</span>
              <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {activeRoom.roomId}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer ml-0.5"
                title="Copy Room ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1 truncate">
            <Film className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate">
              {activeRoom.videoTitle || 'Live YouTube Synchronized Stream'}
            </span>
          </p>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2.5">
          <button
            id="return-to-active-room-btn"
            type="button"
            onClick={handleRejoin}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return to Active Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
