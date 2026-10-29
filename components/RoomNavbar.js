'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv,
  LogOut,
  Radio,
  RotateCcw,
  Link as LinkIcon,
  Crown,
  Shield,
  User,
  Film,
  Send,
  X,
  Check,
  Users,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Power,
  SlidersHorizontal,
  Share2,
  Copy,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  Menu,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import ShareLink from '@/components/ShareLink';

export default function RoomNavbar({
  roomId,
  username,
  userId,
  userRole,
  canControl,
  isAdminRole,
  videoState,
  autoJoin,
  pendingRequests = [],
  messages = [],
  participants = [],
  isSidebarOpen,
  sidebarTab,
  toggleSidebarTab,
  toggleSidebarOpen,
  onToggleAutoJoin,
  onOpenPendingModal,
  onOpenEndRoomModal,
  onOpenRequestModal,
  onChangeVideo,
  newVideoUrl,
  setNewVideoUrl,
  onSyncRequest,
  onLeaveRoom,
  showNotification,
}) {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isChangeVideoModalOpen, setIsChangeVideoModalOpen] = useState(false);

  const managementMenuRef = useRef(null);

  // Close management dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (managementMenuRef.current && !managementMenuRef.current.contains(e.target)) {
        setIsManagementOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyCode = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      if (showNotification) showNotification('Room Code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerResync = () => {
    setIsResyncing(true);
    if (onSyncRequest) onSyncRequest();
    setTimeout(() => setIsResyncing(false), 1200);
  };

  const handleForceResyncAll = () => {
    if (onSyncRequest) onSyncRequest();
    if (showNotification) {
      showNotification('Broadcasting synchronization state to all participants...', 'info');
    }
  };

  // Counts of participant roles
  const adminCount = participants.filter((p) =>
    ['admin', 'host'].includes(p.role?.toLowerCase())
  ).length;
  const coAdminCount = participants.filter((p) =>
    ['co-admin', 'mod', 'moderator'].includes(p.role?.toLowerCase())
  ).length;
  const viewerCount = participants.length - adminCount - coAdminCount;

  return (
    <>
      <header className="border-b border-zinc-200/70 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* ==================== LEFT: LOGO, ROOM CODE, SHARE & LIVE SYNC ==================== */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              title="Return to Home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 flex items-center justify-center shadow-md shadow-red-600/20">
                <Tv className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight hidden md:inline text-zinc-900 dark:text-white">
                Watch<span className="bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">Party</span>
              </span>
            </Link>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

            {/* Room ID Badge with Copy */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyCode}
                title="Click to copy Room Code"
                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/60 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer active:scale-95"
              >
                <span className="text-[10px] text-zinc-400 group-hover:text-red-500 transition-colors">#</span>
                <span className="tracking-wider">{roomId}</span>
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors shrink-0" />
                )}
              </button>

              {/* Shareable Link Button */}
              <ShareLink
                roomId={roomId}
                className="hidden sm:inline-flex"
                onCopied={(msg) => showNotification && showNotification(msg, 'success')}
              />
            </div>

            {/* Live Sync Status Pill with Re-sync Trigger */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-mono tracking-tight">LIVE SYNC</span>
              <button
                type="button"
                onClick={handleTriggerResync}
                title="Re-synchronize with room playback"
                className="ml-1 p-0.5 rounded hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
              >
                <RotateCcw className={`w-3 h-3 ${isResyncing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* ==================== CENTER: VIDEO URL INPUT OR REQUEST VIDEO ==================== */}
          <div className="flex-1 max-w-md hidden lg:flex items-center justify-center">
            {canControl ? (
              <form onSubmit={onChangeVideo} className="w-full relative flex items-center">
                <input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="Paste YouTube URL to play..."
                  className="w-full bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl pl-9 pr-24 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10 transition-all shadow-inner"
                />
                <LinkIcon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3" />
                {newVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setNewVideoUrl('')}
                    className="absolute right-20 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1 px-3 py-1 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-sm shadow-red-600/25"
                >
                  Load
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenRequestModal}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-100/90 hover:bg-zinc-200/80 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/70 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Film className="w-3.5 h-3.5 text-red-500" />
                  <span>Request Video</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/50 px-2.5 py-1 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span className="text-[11px]">Synced with Host</span>
                </div>
              </div>
            )}
          </div>

          {/* ==================== RIGHT: CONTROLS & MANAGEMENT ==================== */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Change Video Icon Button (for screens where center input is hidden) */}
            {canControl ? (
              <button
                type="button"
                onClick={() => setIsChangeVideoModalOpen(true)}
                title="Change Video"
                className="lg:hidden p-2 rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30 hover:bg-red-500 transition-all cursor-pointer active:scale-95"
              >
                <Film className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenRequestModal}
                title="Request Video"
                className="lg:hidden p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Film className="w-4 h-4" />
              </button>
            )}

            {/* 1. PROFESSIONAL ROOM MANAGEMENT DROPDOWN (Admin & Co-Admin only) */}
            {canControl && (
              <div className="relative" ref={managementMenuRef}>
                <button
                  type="button"
                  id="room-management-btn"
                  onClick={() => setIsManagementOpen((prev) => !prev)}
                  className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                    isManagementOpen
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-800 dark:border-white shadow-md'
                      : pendingRequests.length > 0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/20'
                      : 'bg-zinc-100/90 hover:bg-zinc-200/80 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800/70'
                  }`}
                  title="Professional Room Management & Admin Controls"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Manage</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isManagementOpen ? 'rotate-180' : ''}`} />

                  {/* Pending Request Indicator Badge */}
                  {pendingRequests.length > 0 && (
                    <span className="flex h-2 w-2 absolute -top-0.5 -right-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                  )}
                </button>

                {/* Management Dropdown Menu */}
                <AnimatePresence>
                  {isManagementOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/90 dark:border-zinc-800/80 shadow-2xl backdrop-blur-2xl p-3 z-50 text-zinc-900 dark:text-zinc-100 space-y-3"
                    >
                      {/* Menu Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                              Room Management
                            </h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              Room ID: <span className="font-mono font-semibold">{roomId}</span>
                            </p>
                          </div>
                        </div>

                        {isAdminRole ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            Co-Admin
                          </span>
                        )}
                      </div>

                      {/* Section 1: Lobby & Admission Controls */}
                      <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Lobby & Admissions
                        </span>

                        {/* Auto-Join Toggle Row */}
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              Auto-Join Visitors
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              {autoJoin ? 'Viewers bypass waiting room' : 'Viewers wait for approval'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleAutoJoin && onToggleAutoJoin(!autoJoin)}
                            className={`p-1 rounded-xl transition-all cursor-pointer ${
                              autoJoin ? 'text-emerald-500' : 'text-zinc-400'
                            }`}
                            title="Toggle Auto-Join"
                          >
                            {autoJoin ? (
                              <ToggleRight className="w-6 h-6 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-zinc-400" />
                            )}
                          </button>
                        </div>

                        {/* Waiting Requests Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsManagementOpen(false);
                            onOpenPendingModal && onOpenPendingModal();
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                            pendingRequests.length > 0
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Waiting Room Queue</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            pendingRequests.length > 0 ? 'bg-amber-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                          }`}>
                            {pendingRequests.length}
                          </span>
                        </button>
                      </div>

                      {/* Section 2: Playback & Sync Tools */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Playback & Sync Tools
                        </span>

                        <button
                          type="button"
                          onClick={handleForceResyncAll}
                          className="w-full py-1.5 px-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Radio className="w-3.5 h-3.5 text-emerald-500" />
                            Force Re-Sync All Participants
                          </span>
                          <span className="text-[10px] text-zinc-400">Broadcast</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsManagementOpen(false);
                            setIsChangeVideoModalOpen(true);
                          }}
                          className="w-full py-1.5 px-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Film className="w-3.5 h-3.5 text-red-500" />
                            Switch YouTube Stream
                          </span>
                          <span className="text-[10px] text-zinc-400">URL</span>
                        </button>
                      </div>

                      {/* Section 3: Room Participants Overview */}
                      <div className="bg-zinc-50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-[11px] flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                        <span>Connected: <strong className="text-zinc-800 dark:text-zinc-200">{participants.length}</strong></span>
                        <span>Admins: <strong className="text-amber-500">{adminCount}</strong></span>
                        <span>Co-Admins: <strong className="text-blue-500">{coAdminCount}</strong></span>
                        <span>Viewers: <strong className="text-zinc-700 dark:text-zinc-300">{viewerCount}</strong></span>
                      </div>

                      {/* Section 4: End Room for All (Admin Only) */}
                      {isAdminRole && (
                        <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              setIsManagementOpen(false);
                              onOpenEndRoomModal && onOpenEndRoomModal();
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <Power className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            <span>End Room for All Participants</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 2. SIDEBAR TOGGLE CONTROLS (Chat & Participants) — Grouped Pill */}
            <div className="hidden sm:flex items-center gap-0.5 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/70 p-0.5 sm:p-1 rounded-xl">
              <button
                type="button"
                id="navbar-toggle-chat-btn"
                onClick={() => toggleSidebarTab('chat')}
                className={`relative p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  isSidebarOpen && sidebarTab === 'chat'
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title={isSidebarOpen && sidebarTab === 'chat' ? 'Hide Chat' : 'Show Chat'}
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {messages.length > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1 rounded-full ${
                      isSidebarOpen && sidebarTab === 'chat'
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {messages.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                id="navbar-toggle-participants-btn"
                onClick={() => toggleSidebarTab('participants')}
                className={`relative p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  isSidebarOpen && sidebarTab === 'participants'
                    ? 'bg-zinc-800 text-white dark:bg-zinc-700 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title={
                  isSidebarOpen && sidebarTab === 'participants'
                    ? 'Hide Participants'
                    : 'Show Participants'
                }
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] font-mono px-1 rounded-full bg-black/10 dark:bg-white/10">
                  {participants.length}
                </span>
              </button>

              <button
                type="button"
                id="navbar-toggle-sidebar-btn"
                onClick={toggleSidebarOpen}
                className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title={isSidebarOpen ? 'Theater Mode (Hide Sidebar)' : 'Restore Sidebar'}
              >
                {isSidebarOpen ? (
                  <PanelRightClose className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <PanelRightOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                )}
              </button>
            </div>

            {/* 3. THEME TOGGLE */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* 4. USER BADGE (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/70 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[85px]">
                {username || 'Guest'}
              </span>
              {['admin', 'host'].includes(userRole?.toLowerCase()) ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  <Crown className="w-2.5 h-2.5 text-amber-500" />
                  Admin
                </span>
              ) : ['co-admin', 'mod', 'moderator'].includes(userRole?.toLowerCase()) ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  <Shield className="w-2.5 h-2.5 text-blue-500" />
                  Co-Admin
                </span>
              ) : null}
            </div>

            {/* 5. END ROOM FOR ALL (Admin Only — Direct navbar button on large screens) */}
            {isAdminRole && (
              <button
                type="button"
                id="end-room-all-navbar-btn"
                onClick={onOpenEndRoomModal}
                title="End Watch Party for All Participants"
                className="hidden xl:flex px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-500/50 text-[11px] font-bold items-center gap-1.5 shadow-sm shadow-red-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Power className="w-3.5 h-3.5" />
                <span>End Room</span>
              </button>
            )}

            {/* 6. LEAVE ROOM BUTTON */}
            <button
              type="button"
              onClick={onLeaveRoom}
              title="Leave Room"
              className="p-1.5 sm:p-2 rounded-xl bg-zinc-100/90 hover:bg-zinc-200 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200/80 dark:border-zinc-800/70 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* 7. MOBILE HAMBURGER / DRAWER TRIGGER (< lg) */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/70 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Open Mobile Controls"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MOBILE RESPONSIVE DRAWER OVERLAY ==================== */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-4 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center text-white">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Room Controls
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">#{roomId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* User Identity Card */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-rose-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {username}
                      </p>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {isAdminRole ? 'Host (Admin)' : canControl ? 'Moderator' : 'Viewer'}
                      </span>
                    </div>
                  </div>

                  <ThemeToggle />
                </div>

                {/* Live Sync Status Card */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Live Synchronized
                      </p>
                      <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80">
                        Real-time video alignment
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerResync}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                  >
                    <RotateCcw className={`w-3 h-3 ${isResyncing ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>

                {/* Change Video Section (Admin / Co-Admin) */}
                {canControl ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Playback Stream
                    </span>
                    <form
                      onSubmit={(e) => {
                        onChangeVideo(e);
                        setIsMobileDrawerOpen(false);
                      }}
                      className="space-y-2"
                    >
                      <input
                        type="text"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="Paste YouTube Link..."
                        className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 cursor-pointer"
                      >
                        Load Video
                      </button>
                    </form>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenRequestModal();
                    }}
                    className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-2"
                  >
                    <Film className="w-3.5 h-3.5 text-red-500" />
                    <span>Request Video to Play</span>
                  </button>
                )}

                {/* Admin Management Controls (Auto-Join & Lobby) */}
                {canControl && (
                  <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Admin Controls
                    </span>

                    {/* Auto Join Switch */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Auto-Join Mode
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {autoJoin ? 'Bypass waiting room' : 'Approval required'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleAutoJoin(!autoJoin)}
                        className="p-1 cursor-pointer"
                      >
                        {autoJoin ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-zinc-400" />
                        )}
                      </button>
                    </div>

                    {/* Waiting Lobby Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        onOpenPendingModal();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Waiting Room Queue
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {pendingRequests.length}
                      </span>
                    </button>
                  </div>
                )}

                {/* Sharing & Code */}
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Invite & Share
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3 h-3 text-red-500" />
                      <span>{copiedCode ? 'Copied!' : 'Copy ID'}</span>
                    </button>
                    <ShareLink roomId={roomId} className="w-full justify-center" />
                  </div>
                </div>
              </div>

              {/* Bottom Actions: End Room & Leave */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                {isAdminRole && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenEndRoomModal();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-red-600/25"
                  >
                    <Power className="w-4 h-4" />
                    <span>End Room for All</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onLeaveRoom();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-red-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Watch Party</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== QUICK CHANGE VIDEO MODAL (Mobile & Tablet) ==================== */}
      <AnimatePresence>
        {isChangeVideoModalOpen && canControl && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Switch YouTube Stream
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Admin & Co-Admin Playback Control
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChangeVideoModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  onChangeVideo(e);
                  setIsChangeVideoModalOpen(false);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    YouTube Video URL or ID
                  </label>
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    autoFocus
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangeVideoModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Load Video for All</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
