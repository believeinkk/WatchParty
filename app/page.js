'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Tv,
  Radio,
  Users,
  Wifi,
  ArrowRight,
  Shield,
  Film,
  Crown,
  Lock,
  UserCheck,
  Loader2,
  Sparkles,
  Play,
  Pause,
  MessageSquare,
  Heart,
  Flame,
  ThumbsUp,
  Smile,
  CheckCircle2,
  Share2,
  Sliders,
  Layers,
  Zap,
  AlertCircle,
  X,
  Volume2,
  Maximize2,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Check,
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import ActiveRoomCard from '@/components/ActiveRoomCard';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinUsername, setJoinUsername] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Active Room Memory & Session Recovery
  const [activeRoom, setActiveRoom] = useState(null);
  const [terminationNotice, setTerminationNotice] = useState(null);

  // Sync hash (#create or #join) & query params
  useEffect(() => {
    const handleUrlState = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);

      if (hash === '#create' || params.get('tab') === 'create' || params.get('action') === 'create_room') {
        setActiveTab('create');
      } else if (hash === '#join' || params.get('tab') === 'join') {
        setActiveTab('join');
      }

      if (params.get('terminated') === 'true' || params.get('ended') === 'true') {
        setTerminationNotice('The previous watch party was terminated by the Admin.');
        localStorage.removeItem('watchparty_active_room');
      }
    };

    handleUrlState();
    window.addEventListener('hashchange', handleUrlState);
    return () => window.removeEventListener('hashchange', handleUrlState);
  }, []);

  // Sync session identity & Check active room session
  useEffect(() => {
    // Active Room Session Recovery
    try {
      const savedActive = localStorage.getItem('watchparty_active_room');
      if (savedActive) {
        const parsed = JSON.parse(savedActive);
        if (parsed?.roomId && parsed?.status === 'active') {
          fetch(`/api/room/status?roomId=${encodeURIComponent(parsed.roomId)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.exists) {
                setActiveRoom({
                  ...parsed,
                  videoTitle: data.videoTitle || parsed.videoTitle,
                  role: parsed.role || 'Participant',
                });
              } else {
                localStorage.removeItem('watchparty_active_room');
                setActiveRoom(null);
              }
            })
            .catch(() => {
              setActiveRoom(parsed);
            });
        }
      }
    } catch (e) {
      console.warn('Active room retrieval error:', e);
    }

    if (session?.user?.name) {
      setJoinUsername(session.user.name);
      localStorage.setItem('watchparty_username', session.user.name);
      if (session.user.id) {
        localStorage.setItem('watchparty_userId', session.user.id);
      }
    } else {
      const savedName = localStorage.getItem('watchparty_username');
      if (savedName) {
        setJoinUsername(savedName);
      }
    }

    const socket = getSocket();
    if (!socket) return;

    if (socket.connected) {
      setSocketConnected(true);
    }

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [session]);

  const handleDismissActiveRoom = () => {
    localStorage.removeItem('watchparty_active_room');
    setActiveRoom(null);
  };

  // Join Room Flow (Guests or logged-in users)
  const handleJoinParty = (e) => {
    e.preventDefault();
    const cleanRoomId = joinRoomId.trim();
    if (!cleanRoomId) return;

    let cleanUsername = joinUsername.trim();
    let userId = session?.user?.id || localStorage.getItem('watchparty_userId');

    if (!cleanUsername) {
      const guestNumber = Math.floor(1000 + Math.random() * 9000);
      cleanUsername = `Guest ${guestNumber}`;
      if (!userId) {
        userId = `guest_${guestNumber}`;
      }
    }

    if (!userId) {
      userId = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    localStorage.setItem('watchparty_username', cleanUsername);
    localStorage.setItem('watchparty_userId', userId);

    router.push(
      `/room/${encodeURIComponent(cleanRoomId)}?username=${encodeURIComponent(cleanUsername)}`
    );
  };

  // Create Room Flow (Admin only)
  const handleCreateRoom = async (e) => {
    e?.preventDefault();

    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/#create&action=create_room');
      return;
    }

    setIsCreatingRoom(true);

    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      const generatedRoomId = data.roomId;

      const cleanUsername = session?.user?.name || 'Admin';
      const userId =
        session?.user?.id || 'admin_' + cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');

      localStorage.setItem('watchparty_username', cleanUsername);
      localStorage.setItem('watchparty_userId', userId);

      router.push(
        `/room/${encodeURIComponent(generatedRoomId)}?username=${encodeURIComponent(cleanUsername)}&role=Admin`
      );
    } catch (err) {
      console.error('Failed to auto-generate room ID:', err);
      const fallbackId = Math.random().toString(36).substring(2, 9);
      router.push(`/room/${encodeURIComponent(fallbackId)}?role=Admin`);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white transition-colors duration-200 overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* ==================== HERO SECTION ==================== */}
        <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-28 overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/70">
          
          {/* Animated Ambient Light Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.12, 0.22, 0.12],
              y: [0, -30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 blur-[150px] pointer-events-none rounded-full -z-10"
          />
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.08, 0.16, 0.08],
              x: [0, 40, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-10 right-5 w-[400px] h-[400px] bg-amber-500 blur-[140px] pointer-events-none rounded-full -z-10"
          />

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto">
              
              {/* Real-time Status Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300 mb-6 shadow-sm backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      socketConnected ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {socketConnected ? 'Sync Engine Live' : 'Connecting Engine...'}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                  &lt;50ms Latency
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-zinc-900 dark:text-white mb-6 leading-[1.12]"
              >
                Watch YouTube together, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 dark:from-red-500 dark:via-rose-400 dark:to-amber-400">
                  flawlessly synchronized.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed"
              >
                Zero-drift audio sync, multi-tier RBAC moderation, and waiting room lobby admissions.
                Auto-generate persistent rooms in one click or join any stream seamlessly.
              </motion.p>

              {/* Quick Feature Pills */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="flex flex-wrap items-center justify-center gap-2 mb-10 text-xs font-semibold"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 shadow-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sub-Second Sync</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 shadow-xs">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span>Admin Moderation</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 shadow-xs">
                  <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Lobby Waiting Room</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 shadow-xs">
                  <Share2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>1-Click Share Link</span>
                </div>
              </motion.div>
            </div>

            {/* Termination Notice Banner */}
            <AnimatePresence>
              {terminationNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-lg mx-auto mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-3 shadow-sm backdrop-blur-md"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-medium">{terminationNotice}</span>
                  </div>
                  <button
                    onClick={() => setTerminationNotice(null)}
                    className="p-1 hover:bg-amber-500/20 rounded-md transition-colors cursor-pointer text-amber-600 dark:text-amber-400"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              {/* Active Room Session Recovery Card */}
              {activeRoom && (
                <ActiveRoomCard
                  activeRoom={activeRoom}
                  onDismiss={handleDismissActiveRoom}
                />
              )}
            </AnimatePresence>

            {/* ==================== DUAL ACTION CARD: JOIN VS CREATE ==================== */}
            <motion.div
              id="action-card"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full max-w-lg mx-auto bg-white/95 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-2xl relative"
            >
              {/* Tab Selector with Smooth Spring Indicator */}
              <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-950 p-1 mb-6 border border-zinc-200/80 dark:border-zinc-800/80 relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('join');
                    if (typeof window !== 'undefined') window.location.hash = 'join';
                  }}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer relative z-10 ${
                    activeTab === 'join'
                      ? 'text-zinc-900 dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {activeTab === 'join' && (
                    <motion.div
                      layoutId="home-active-tab-indicator"
                      className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-200/60 dark:border-zinc-700/60 -z-10"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Users className="w-3.5 h-3.5" />
                  <span>Join Watch Room</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('create');
                    if (typeof window !== 'undefined') window.location.hash = 'create';
                  }}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer relative z-10 ${
                    activeTab === 'create'
                      ? 'text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {activeTab === 'create' && (
                    <motion.div
                      layoutId="home-active-tab-indicator"
                      className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-500 rounded-xl shadow-md shadow-red-600/30 -z-10"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Crown className="w-3.5 h-3.5" />
                  <span>Create Room (Admin)</span>
                </button>
              </div>

              {/* TAB 1: JOIN PARTY */}
              {activeTab === 'join' && (
                <form onSubmit={handleJoinParty} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Display Name
                      </label>
                      <span className="text-[10px] text-zinc-500">Auto-filled for guests</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={joinUsername}
                        onChange={(e) => setJoinUsername(e.target.value)}
                        placeholder="e.g. Alex (or leave blank for Guest ID)"
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all"
                      />
                      <Users className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Room Code / ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        placeholder="e.g. 6 to 8-character code like mfm2485"
                        required
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all font-mono tracking-wider"
                      />
                      <Tv className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 dark:from-zinc-800 dark:to-zinc-700 dark:hover:from-zinc-700 dark:hover:to-zinc-600 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    <span>Enter Watch Party Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* TAB 2: CREATE ROOM */}
              {activeTab === 'create' && (
                <div>
                  {!isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs mb-1.5">
                          <Lock className="w-4 h-4" />
                          <span>Admin Account Required</span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          Creating a watch room gives you full playback authority (play, pause, seek,
                          invite management, and lobby approvals). Please sign in to create a room.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleCreateRoom}
                          className="w-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/25 active:scale-[0.99] cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>Sign In to Launch Party</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="text-center pt-1">
                          <Link
                            href="/signup"
                            className="text-[11px] text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            Don&apos;t have an account? <span className="font-semibold underline">Register here</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Authenticated Admin Badge */}
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                            <UserCheck className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              Host: {session?.user?.name || 'Administrator'}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {session?.user?.email}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-semibold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Auto-Generated Secure Room ID</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Your watch party room will be instantly created on the server with real-time
                          sync, lobby waiting gate, and shareable link.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateRoom}
                        disabled={isCreatingRoom}
                        className="w-full mt-2 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 disabled:opacity-60 text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 active:scale-[0.99] cursor-pointer"
                      >
                        {isCreatingRoom ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Provisioning Watch Room...</span>
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4" />
                            <span>Launch Room as Admin</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* ==================== ANIMATED VIDEO PLAYER PREVIEW MOCKUP ==================== */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-16 sm:mt-24 max-w-4xl mx-auto rounded-3xl bg-white/90 dark:bg-zinc-900/70 border border-zinc-200/90 dark:border-zinc-800/80 p-2 sm:p-4 shadow-2xl shadow-black/15 backdrop-blur-2xl relative"
            >
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800/90 overflow-hidden relative shadow-inner">
                {/* Simulated Browser Chrome Top Bar */}
                <div className="px-4 py-2.5 bg-zinc-900/95 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] font-mono text-zinc-400 ml-2 truncate max-w-[200px] sm:max-w-none">
                      https://watchparty.live/room/mfm2485
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Synchronized Live</span>
                  </div>
                </div>

                {/* Simulated Video Player Viewport */}
                <div className="relative aspect-video bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center overflow-hidden">
                  {/* Subtle Grid Matrix Background */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:20px_20px]" />

                  {/* Centered Play Pulse Button */}
                  <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-red-600/40 border border-red-500 cursor-pointer"
                    >
                      <Play className="w-7 h-7 ml-1 fill-white" />
                    </motion.div>
                    <span className="text-xs font-semibold text-zinc-300">
                      Sub-second playback across all connected browsers
                    </span>
                  </div>

                  {/* Simulated Floating Reaction Badges (Lucide Vector Icons Only) */}
                  <motion.div
                    animate={{ y: [0, -18, 0], rotate: [-2, 2, -2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-16 left-6 sm:left-1/4 pointer-events-none"
                  >
                    <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 backdrop-blur-md shadow-lg shadow-rose-500/20 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      <span className="text-[10px] font-bold text-zinc-100">Alex</span>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -22, 0], rotate: [2, -2, 2] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                    className="absolute bottom-24 right-6 sm:right-1/4 pointer-events-none"
                  >
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md shadow-lg shadow-amber-500/20 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span className="text-[10px] font-bold text-zinc-100">Sarah</span>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -16, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                    className="absolute top-12 right-12 hidden sm:block pointer-events-none"
                  >
                    <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 backdrop-blur-md flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-bold text-zinc-100">Sync Calibrated</span>
                    </div>
                  </motion.div>

                  {/* Simulated Player Controls Bar Overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Pause className="w-4 h-4 text-white" />
                      <div className="w-24 sm:w-60 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="w-3/5 h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                        03:42 / 05:20
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-red-600 text-[10px] font-bold flex items-center justify-center border-2 border-zinc-950 text-white">
                          A
                        </div>
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center border-2 border-zinc-950 text-white">
                          S
                        </div>
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-[10px] font-bold flex items-center justify-center border-2 border-zinc-950 text-white">
                          M
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-zinc-400 hidden sm:inline">
                        +4 watching
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== 3-STEP WORKFLOW SECTION ==================== */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-b border-zinc-200/80 dark:border-zinc-800/70">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1">
              How WatchParty Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
              Start watching YouTube in sync with your friends in less than 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Launch or Enter Room
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Admins click <strong className="text-zinc-900 dark:text-zinc-200">Create Room</strong> for an auto-generated unique ID, or viewers join with a code or share link.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Lobby Gate & Video Choice
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The Host reviews waiting viewers in the lobby (or enables Auto-Join) and loads any YouTube video link.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Sync Playback & Chat
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Enjoy sub-second synced playback, real-time chat, vector reactions, and role controls on any device.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ==================== FEATURES GRID SECTION ==================== */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-b border-zinc-200/80 dark:border-zinc-800/70">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Production Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1">
              Engineered for Shared Streaming
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
              Everything required to host low-latency watch sessions without third-party extensions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-red-500/40 dark:hover:border-red-500/40 transition-all space-y-3 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wifi className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Sub-Second Sync Engine</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Automatic drift reconciliation continuously aligns playback across browsers with an
                ultra-tight threshold to prevent audio echo.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all space-y-3 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Multi-Tier RBAC Moderation</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Admin, Co-Admin, and Viewer role scoping guarantees organized video curation, role
                transfers, and participant management.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all space-y-3 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Lobby Waiting Room</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Keep watch parties private with real-time approval toasts, one-click Admit All, and
                instant Auto-Join mode toggles.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all space-y-3 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">One-Click Shareable Link</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Direct URL sharing copies clean, short links so friends can immediately click and
                join your party session from anywhere.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-rose-500/40 dark:hover:border-rose-500/40 transition-all space-y-3 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Live Vector Reactions</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Share moments with floating animated reactions (Love, Fire, Like, Smile) rendered
                crisply with modern vector SVGs and zero emojis.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all space-y-3 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Persistent MongoDB Rooms</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Video playback timestamps, room settings, and member permissions persist across
                browser refreshes and session restarts.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ==================== CROSS-DEVICE RESPONSIVE STRIP ==================== */}
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-b border-zinc-200/80 dark:border-zinc-800/70">
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-100/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Any Device, Anywhere
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                Responsive Multi-Device Support
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md">
                Stream on your laptop, iPad, or mobile phone. Features mobile drawer controls, bottom action bar, and theater view.
              </p>
            </div>

            <div className="flex items-center gap-4 text-zinc-700 dark:text-zinc-300">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <Monitor className="w-5 h-5 text-red-500" />
                <span className="text-[10px] font-semibold">Desktop</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <Tablet className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-semibold">Tablet</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-semibold">Mobile</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== BOTTOM CALL TO ACTION ==================== */}
        <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-zinc-100 via-zinc-50 dark:from-zinc-900 dark:via-zinc-900/90 to-red-100/50 dark:to-red-950/30 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
              <Tv className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Ready to host your next Watch Party?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Create an Admin account for full playback control or enter a room ID to join instantly as a guest.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer active:scale-95"
              >
                <span>Create Admin Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs cursor-pointer"
              >
                <span>Explore Technical Specs</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
