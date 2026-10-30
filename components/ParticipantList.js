'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUp: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on window resize or scroll to prevent floating detached menu
  useEffect(() => {
    if (!activeMenuUserId) return;
    const handleClose = () => setActiveMenuUserId(null);

    window.addEventListener('resize', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [activeMenuUserId]);

  const isCurrentUserAdmin = ['admin', 'host'].includes(currentUserRole?.toLowerCase());

  const handleToggleMenu = (e, userId) => {
    e.stopPropagation();
    if (!isCurrentUserAdmin) return;

    if (activeMenuUserId === userId) {
      setActiveMenuUserId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 185;
    const dropdownWidth = 210;

    // Check if dropdown would bleed past bottom of viewport
    const openUp = rect.bottom + dropdownHeight > window.innerHeight && rect.top > dropdownHeight;
    const top = openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 6;
    const left = Math.min(
      window.innerWidth - dropdownWidth - 12,
      Math.max(12, rect.right - dropdownWidth)
    );

    setMenuPosition({ top, left, openUp });
    setActiveMenuUserId(userId);
  };

  // Find active participant being managed
  const activeParticipant = participants.find((p) => p.userId === activeMenuUserId);
  const activeRoleLower = activeParticipant?.role?.toLowerCase();
  const isActiveCoAdmin =
    activeRoleLower === 'co-admin' || activeRoleLower === 'mod' || activeRoleLower === 'moderator';

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
          const roleLower = p.role?.toLowerCase();
          const isAdmin = roleLower === 'admin' || roleLower === 'host';
          const avatarGradient = getAvatarGradient(p.username, p.role);
          const isMenuOpenForThis = activeMenuUserId === p.userId;

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
                  onClick={(e) => !isSelf && handleToggleMenu(e, p.userId)}
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
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-bold text-[11px] sm:text-xs text-white shadow-sm`}
                    >
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
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                          (You)
                        </span>
                      )}
                    </div>
                    {/* Role badge below name */}
                    <div className="mt-0.5">
                      {getRoleBadge(p.role) || (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          Viewer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Action Trigger Button */}
                {isCurrentUserAdmin && !isSelf && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleToggleMenu(e, p.userId)}
                    className={`p-2 sm:p-1.5 rounded-xl transition-all ml-1 cursor-pointer shrink-0 ${
                      isMenuOpenForThis
                        ? 'bg-red-500/10 text-red-500 dark:bg-red-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 sm:bg-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 sm:text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-100 sm:opacity-0 sm:group-hover/participant:opacity-100'
                    }`}
                    title="Manage Participant"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </motion.button>
                )}
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>

      {participants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center mb-3">
            <Circle className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            No participants yet
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Share the room link to invite others
          </p>
        </div>
      )}

      {/* =========================================================================
          REACT PORTAL: Render dropdown outside normal DOM tree to prevent clipping
          and scrolling issues in containers with overflow-hidden / overflow-y-auto
         ========================================================================= */}
      {mounted &&
        activeMenuUserId &&
        activeParticipant &&
        isCurrentUserAdmin &&
        createPortal(
          <div className="fixed inset-0 z-[100] pointer-events-auto">
            {/* Transparent Dismiss Backdrop */}
            <div
              className="fixed inset-0 bg-transparent"
              onClick={() => setActiveMenuUserId(null)}
            />

            {/* Floating Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: menuPosition.openUp ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: menuPosition.openUp ? 6 : -6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
              className="z-[101] w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl shadow-black/25 dark:shadow-black/60 p-2 space-y-1 backdrop-blur-2xl"
            >
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Manage User
                </p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  {activeParticipant.username}
                </p>
              </div>

              {/* Transfer Admin */}
              <button
                type="button"
                onClick={() => {
                  onTransferHost?.(activeParticipant.userId);
                  setActiveMenuUserId(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors text-left cursor-pointer font-semibold active:scale-98"
              >
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Make Admin</span>
              </button>

              {/* Role Toggle */}
              {isActiveCoAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    onAssignRole(activeParticipant.userId, 'Participant');
                    setActiveMenuUserId(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left cursor-pointer font-medium active:scale-98"
                >
                  <UserMinus className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Demote to Viewer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onAssignRole(activeParticipant.userId, 'Co-Admin');
                    setActiveMenuUserId(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors text-left cursor-pointer font-medium active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Make Co-Admin</span>
                </button>
              )}

              <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

              {/* Remove Participant */}
              <button
                type="button"
                onClick={() => {
                  onRemoveParticipant(activeParticipant.userId);
                  setActiveMenuUserId(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left cursor-pointer font-semibold active:scale-98"
              >
                <UserX className="w-4 h-4 shrink-0" />
                <span>Remove Participant</span>
              </button>
            </motion.div>
          </div>,
          document.body
        )}
    </div>
  );
}
