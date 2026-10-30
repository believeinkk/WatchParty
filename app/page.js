'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ActiveRoomCard from '@/components/ActiveRoomCard';
import { getSocket } from '@/lib/socket';
import {
  Tv,
  Users,
  Wifi,
  ArrowRight,
  Shield,
  Crown,
  Loader2,
  Sparkles,
  Play,
  Pause,
  Heart,
  Flame,
  Share2,
  Sliders,
  Layers,
  Zap,
  AlertCircle,
  X,
  Monitor,
  Smartphone,
  Tablet,
  MousePointerClick,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

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
      const params = new URLSearchParams(window.location.search);

      if (params.get('terminated') === 'true' || params.get('ended') === 'true') {
        setTerminationNotice('The previous watch party was terminated by the Admin.');
        localStorage.removeItem('watchparty_active_room');
      }

      if (window.location.hash === '#join') {
        setTimeout(() => {
          const inputEl = document.getElementById('room-id-input') || document.getElementById('action-card');
          if (inputEl) {
            inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputEl.focus?.();
          }
        }, 150);
      } else if (window.location.hash === '#create') {
        setTimeout(() => {
          const el = document.getElementById('action-card');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    };

    handleUrlState();
    window.addEventListener('hashchange', handleUrlState);
    return () => window.removeEventListener('hashchange', handleUrlState);
  }, []);

  // Sync session identity & Check active room session
  useEffect(() => {
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
    e?.preventDefault();
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

  // Create Room Flow (Admin)
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

  // Framer Motion entry animations
  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const heroItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 220 },
    },
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white transition-colors duration-300 overflow-x-hidden relative">
      <Navbar />

      <main className="flex-1">
        {/* ==================== 3D INTERACTIVE HERO SECTION ==================== */}
        <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28 overflow-hidden">
          <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center justify-center text-center">
            {/* Header Overlay & Typography */}
            <motion.div
              variants={heroContainerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-4xl mx-auto flex flex-col items-center"
            >
              {/* Real-time Status Badge */}
              <motion.div
                variants={heroItemVariants}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 text-xs text-zinc-800 dark:text-zinc-200 mb-6 shadow-xl"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      socketConnected ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
                <span className="font-bold tracking-wide">
                  {socketConnected ? 'Real-Time Sync Engine Live' : 'Connecting to Cloud Engine...'}
                </span>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                  &lt;50ms Latency
                </span>
              </motion.div>

              {/* Main Headings: Large, bold, uppercase WATCH and PARTY with radiant glowing neon gradient */}
              <motion.div
                variants={heroItemVariants}
                className="select-none flex flex-col items-center justify-center leading-none tracking-tight mb-6"
              >
                <div className="flex items-center gap-2 mb-3.5 px-4 py-1.5 rounded-full bg-red-500/10 dark:bg-white/5 border border-red-500/20 dark:border-white/10 backdrop-blur-md shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                    Ultra-Low Latency YouTube Sync
                  </span>
                </div>

                <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-100 dark:to-zinc-400 drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_0_45px_rgba(255,255,255,0.25)]">
                  WATCH
                </h1>
                <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 drop-shadow-[0_0_55px_rgba(239,68,68,0.55)] -mt-3 sm:-mt-6 md:-mt-10">
                  PARTY
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                variants={heroItemVariants}
                className="text-base sm:text-lg md:text-xl text-zinc-700 dark:text-zinc-200 drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-8 max-w-2xl mx-auto leading-relaxed font-normal"
              >
                Sync YouTube videos in real-time with your friends. Move your cursor to interact with the 3D space.
              </motion.p>

              {/* Action Area: Sleek "Create Room" button & simple input field + "Join Room" button */}
              <motion.div
                id="action-card"
                variants={heroItemVariants}
                className="w-full max-w-xl mx-auto space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                  {/* Sleek Create Room button with framer-motion hover effect */}
                  <motion.button
                    whileHover={{
                      scale: 1.04,
                      boxShadow: '0 0 25px rgba(239, 68, 68, 0.45)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateRoom}
                    disabled={isCreatingRoom}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-red-600/30 border border-red-500/30 cursor-pointer transition-all shrink-0"
                  >
                    {isCreatingRoom ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Room...</span>
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 text-amber-300" />
                        <span>Create Room</span>
                      </>
                    )}
                  </motion.button>

                  {/* Simple input field and Join Room button with Glassmorphism */}
                  <form
                    onSubmit={handleJoinParty}
                    className="flex items-center gap-2 w-full sm:flex-1"
                  >
                    <div className="relative flex-1">
                      <input
                        id="room-id-input"
                        type="text"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        placeholder="Enter Room Code..."
                        required
                        className="w-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-300 dark:border-white/20 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 font-mono tracking-wider shadow-lg"
                      />
                      <Tv className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="px-5 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-black/10 dark:shadow-white/10 shrink-0 cursor-pointer transition-all"
                      >
                        <span>Join</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </form>
                  </div>

                  {/* Feature badges */}
                  <div className="flex items-center justify-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Zero Extension Required</span>
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600">•</span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                      <span>Host Moderation</span>
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600">•</span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Unlimited Viewers</span>
                    </span>
                  </div>
                </motion.div>

                {/* Floating "Click to randomize" pulse animation at the bottom */}
                <motion.div
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.75, 1, 0.75],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="mt-12 flex items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 text-xs font-medium tracking-wider uppercase text-zinc-800 dark:text-zinc-300 drop-shadow-md select-none cursor-pointer hover:bg-white dark:hover:bg-white/20 transition-colors shadow-md"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-500" />
                  <span>Click anywhere to randomize neon 3D colors</span>
                </motion.div>
              </motion.div>

              {/* Termination Notice Banner */}
              <AnimatePresence>
                {terminationNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="max-w-lg mx-auto mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-3 shadow-sm backdrop-blur-md"
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
                  <div className="w-full max-w-lg mx-auto mt-6">
                    <ActiveRoomCard
                      activeRoom={activeRoom}
                      onDismiss={handleDismissActiveRoom}
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* ==================== ANIMATED VIDEO PLAYER PREVIEW MOCKUP ==================== */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-16 sm:mt-20 w-full max-w-4xl mx-auto rounded-3xl bg-white/30 dark:bg-zinc-950/30 backdrop-blur-md border border-zinc-200/50 dark:border-white/10 p-2 sm:p-4 shadow-2xl shadow-black/10 dark:shadow-black/70 relative opacity-80 hover:opacity-100 transition-opacity duration-300"
              >
                <div className="rounded-2xl bg-zinc-950/40 backdrop-blur-xs border border-zinc-800/40 overflow-hidden relative shadow-inner">
                  {/* Simulated Browser Chrome Top Bar */}
                  <div className="px-4 py-2.5 bg-zinc-900/50 backdrop-blur-xs border-b border-zinc-800/40 flex items-center justify-between">
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
                  <div className="relative aspect-video bg-gradient-to-br from-zinc-950/20 via-black/15 to-zinc-900/20 backdrop-blur-[1px] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:20px_20px]" />

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

                    {/* Floating Reaction Badges (Vector SVGs) */}
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

                    {/* Controls Bar Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-center justify-between text-xs">
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
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-b border-zinc-200/80 dark:border-white/10">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1">
              How WatchParty Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
              Start watching YouTube in sync with your friends in less than 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 space-y-4 shadow-lg relative overflow-hidden"
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
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 space-y-4 shadow-lg relative overflow-hidden"
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
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 space-y-4 shadow-lg relative overflow-hidden"
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
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-b border-zinc-200/80 dark:border-white/10">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
              Production Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1">
              Engineered for Shared Streaming
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
              Everything required to host low-latency watch sessions without third-party extensions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 hover:border-red-500/40 transition-all space-y-3 shadow-lg group"
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
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 hover:border-amber-500/40 transition-all space-y-3 shadow-lg group"
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
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 hover:border-blue-500/40 transition-all space-y-3 shadow-lg group"
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
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 hover:border-emerald-500/40 transition-all space-y-3 shadow-lg group"
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
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 hover:border-rose-500/40 transition-all space-y-3 shadow-lg group"
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
              className="p-6 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 hover:border-purple-500/40 transition-all space-y-3 shadow-lg group"
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
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-b border-zinc-200/80 dark:border-white/10">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-zinc-200/80 dark:border-white/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
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
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/90 dark:bg-white/10 border border-zinc-200 dark:border-white/20 shadow-xs">
                <Monitor className="w-5 h-5 text-red-500" />
                <span className="text-[10px] font-semibold">Desktop</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/90 dark:bg-white/10 border border-zinc-200 dark:border-white/20 shadow-xs">
                <Tablet className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-semibold">Tablet</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/90 dark:bg-white/10 border border-zinc-200 dark:border-white/20 shadow-xs">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-semibold">Mobile</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== BOTTOM CALL TO ACTION ==================== */}
        <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-red-950/40 backdrop-blur-xl border border-zinc-200/80 dark:border-white/20 text-center space-y-6 shadow-2xl relative overflow-hidden">
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
                className="px-6 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs cursor-pointer"
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
