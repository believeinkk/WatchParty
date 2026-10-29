'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Shield,
  MoreVertical,
  UserMinus,
  ShieldCheck,
  UserX,
  Circle,
  Wifi,
} from 'lucide-react';

/**
 * Helper to render subtle, professional badges for 'Admin' and 'Co-Admin' next to their names.
 * Viewers do not need a badge.
 */
export function getRoleBadge(role) {
  const normalized = role?.toLowerCase();

  if (normalized === 'admin' || normalized === 'host') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tracking-wide">
        <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
        <span>Admin</span>
      </span>
    );
  }

  if (normalized === 'co-admin' || normalized === 'mod' || normalized === 'moderator') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 tracking-wide">
        <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 shrink-0" />
        <span>Co-Admin</span>
      </span>
    );
  }

  // Viewers don't need a badge
  return null;
}

export default function ParticipantList({
  participants = [],
  currentUserId,
  currentUserRole,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
}) {
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);

  const isCurrentUserAdmin = ['admin', 'host'].includes(currentUserRole?.toLowerCase());

  const toggleUserMenu = (userId) => {
    if (!isCurrentUserAdmin) return;
    setActiveMenuUserId((prev) => (prev === userId ? null : userId));
  };

  // Sorted: Admin first, then Co-Admin, then Viewers
  const sortedParticipants = [...participants].sort((a, b) => {
    const roleOrder = (role) => {
      const r = role?.toLowerCase();
      if (r === 'admin' || r === 'host') return 0;
      if (r === 'co-admin' || r === 'mod' || r === 'moderator') return 1;
      return 2;
    };
    return roleOrder(a.role) - roleOrder(b.role);
  });

  // Generate avatar color based on username
  const getAvatarGradient = (username, role) => {
    const r = role?.toLowerCase();
    if (r === 'admin' || r === 'host') return 'from-amber-500 to-orange-500';
    if (r === 'co-admin' || r === 'mod' || r === 'moderator') return 'from-blue-500 to-indigo-500';
    // Hash-based color for viewers
    const colors = [
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-violet-500',
      'from-pink-500 to-rose-500',
      'from-cyan-500 to-sky-500',
      'from-lime-500 to-green-500',
    ];
    const hash = (username || 'u').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1 mb-2">
        <div className="flex items-center gap-2">
          <span>Participants</span>
          <div className="flex items-center gap-1 text-emerald-500">
            <Wifi className="w-3 h-3 animate-pulse" />
            <span className="text-[10px] font-semibold normal-case tracking-normal">Online</span>
          </div>
        </div>
        <span className="font-mono bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-[10px]">
          {participants.length}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {sortedParticipants.map((p, index) => {
          const isSelf = p.userId === currentUserId;
          const isMenuOpen = activeMenuUserId === p.userId;
          const roleLower = p.role?.toLowerCase();
          const isCoAdmin = roleLower === 'co-admin' || roleLower === 'mod' || roleLower === 'moderator';
          const isAdmin = roleLower === 'admin' || roleLower === 'host';
          const avatarGradient = getAvatarGradient(p.username, p.role);

          return (
            <div key={p.socketId || p.userId} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all group/participant ${
                  isSelf
                    ? 'bg-red-500/[0.03] dark:bg-red-500/[0.06] border-red-500/15 dark:border-red-500/20'
                    : isAdmin
                    ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.06] border-amber-500/15 dark:border-amber-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-800/20 border-zinc-200/60 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* User Info */}
                <div
                  onClick={() => !isSelf && toggleUserMenu(p.userId)}
                  className={`flex items-center gap-2.5 min-w-0 flex-1 ${
                    isCurrentUserAdmin && !isSelf ? 'cursor-pointer' : ''
                  }`}
                  title={
                    isCurrentUserAdmin && !isSelf
                      ? 'Click to manage participant'
                      : undefined
                  }
                >
                  {/* Avatar with online indicator */}
                  <div className="relative shrink-0">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-bold text-[11px] sm:text-xs text-white shadow-sm`}>
                      {p.username ? p.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {/* Online Dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {p.username}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">(You)</span>
                      )}
                    </div>
                    {/* Role badge below name */}
                    <div className="mt-0.5">
                      {getRoleBadge(p.role) || (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Viewer</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Action Dropdown Trigger */}
                {isCurrentUserAdmin && !isSelf && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleUserMenu(p.userId)}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all ml-1 cursor-pointer opacity-0 group-hover/participant:opacity-100"
                    title="Manage Participant"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </motion.button>
                )}
              </motion.div>

              {/* Animated Admin Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && isCurrentUserAdmin && !isSelf && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 z-30 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-1.5 space-y-0.5 backdrop-blur-xl"
                  >
                    {/* Transfer Admin */}
                    <button
                      onClick={() => {
                        onTransferHost?.(p.userId);
                        setActiveMenuUserId(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors text-left cursor-pointer font-medium"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>Make Admin</span>
                    </button>

                    {/* Role Toggle */}
                    {isCoAdmin ? (
                      <button
                        onClick={() => {
                          onAssignRole(p.userId, 'Participant');
                          setActiveMenuUserId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <UserMinus className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Demote to Viewer</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onAssignRole(p.userId, 'Co-Admin');
                          setActiveMenuUserId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Make Co-Admin</span>
                      </button>
                    )}

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-0.5" />

                    {/* Remove */}
                    <button
                      onClick={() => {
                        onRemoveParticipant(p.userId);
                        setActiveMenuUserId(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left cursor-pointer font-medium"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Remove Participant</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </AnimatePresence>

      {participants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center mb-3">
            <Circle className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">No participants yet</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Share the room link to invite others
          </p>
        </div>
      )}
    </div>
  );
}
