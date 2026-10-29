'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  Lock,
  Shield,
  Crown,
  RotateCcw,
  Loader2,
  SkipForward,
  SkipBack,
  Settings,
  Wifi,
} from 'lucide-react';
import { extractYouTubeID } from '@/lib/youtube';

export default function VideoPlayer({
  videoState,
  canControl,
  userRole,
  onPlay,
  onPause,
  onSeek,
  onSyncRequest,
}) {
  const [mounted, setMounted] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  // Browser autoplay requirement: starts muted
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [seeking, setSeeking] = useState(false);

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const scrubberRef = useRef(null);
  const playerIdRef = useRef('yt-player-embed');
  const isInternalSeekingRef = useRef(false);
  const activeVideoIdRef = useRef('');

  // Flag to differentiate programmatic remote sync from direct user clicks in YouTube iframe
  const isRemoteSyncRef = useRef(false);

  // Extract YouTube ID from videoState.videoId or videoState.url
  const currentVideoId =
    videoState?.videoId || (videoState?.url ? extractYouTubeID(videoState.url) : '');
  const hasVideo = Boolean(currentVideoId);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoState?.isPlaying) setShowControls(false);
    }, 3500);
  }, [videoState?.isPlaying]);

  useEffect(() => {
    if (!videoState?.isPlaying) setShowControls(true);
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [videoState?.isPlaying]);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Helper to dynamically load YouTube IFrame API script
  const ensureYouTubeAPI = useCallback(() => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return;
      if (window.YT && window.YT.Player) {
        return resolve(window.YT);
      }

      const scriptId = 'youtube-iframe-api';
      if (!document.getElementById(scriptId)) {
        const tag = document.createElement('script');
        tag.id = scriptId;
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }

      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(interval);
          resolve(window.YT);
        }
      }, 50);
    });
  }, []);

  // Initialize or update YouTube Player
  useEffect(() => {
    if (!mounted || !hasVideo) return;

    let isSubscribed = true;

    ensureYouTubeAPI().then((YT) => {
      if (!isSubscribed) return;

      const elementId = playerIdRef.current;
      const targetElement = document.getElementById(elementId);
      if (!targetElement) return;

      // If player already initialized, load the new video without re-mounting
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        if (activeVideoIdRef.current !== currentVideoId) {
          activeVideoIdRef.current = currentVideoId;
          const startSeconds = videoState?.currentTime || 0;
          isRemoteSyncRef.current = true;
          if (videoState?.isPlaying ?? true) {
            playerRef.current.loadVideoById({
              videoId: currentVideoId,
              startSeconds,
            });
          } else {
            playerRef.current.cueVideoById({
              videoId: currentVideoId,
              startSeconds,
            });
          }
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 600);
        }
        return;
      }

      activeVideoIdRef.current = currentVideoId;

      try {
        new YT.Player(elementId, {
          videoId: currentVideoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            mute: 1, // Start muted to bypass browser autoplay restrictions
            controls: 0, // Clean custom controls bar
            disablekb: canControl ? 0 : 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
          events: {
            onReady: (event) => {
              if (!isSubscribed) return;
              playerRef.current = event.target;
              setIsPlayerReady(true);
              const dur = event.target.getDuration();
              if (dur && !isNaN(dur)) setDuration(dur);

              isRemoteSyncRef.current = true;
              if (videoState?.isPlaying ?? true) {
                event.target.playVideo();
              } else {
                event.target.pauseVideo();
              }

              if (videoState?.currentTime && videoState.currentTime > 0) {
                event.target.seekTo(videoState.currentTime, true);
              }

              setTimeout(() => {
                isRemoteSyncRef.current = false;
              }, 600);
            },
            onStateChange: (event) => {
              if (!isSubscribed) return;

              // YT.PlayerState: PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5), ENDED (0)
              const state = event.data;
              const currentTime = event.target.getCurrentTime?.() || 0;

              if (state === 1) {
                // PLAYING
                setIsBuffering(false);

                // Phase 2 Task 4: Middle Click / Direct IFrame Play Detection
                // If the Admin/Co-Admin clicked directly inside the YouTube frame to play
                if (canControl && !isRemoteSyncRef.current && !videoState?.isPlaying) {
                  onPlay(currentTime);
                }
              } else if (state === 2) {
                // PAUSED
                setIsBuffering(false);

                // Phase 2 Task 4: Middle Click / Direct IFrame Pause Detection
                // If the Admin/Co-Admin clicked directly inside the YouTube frame to pause
                if (canControl && !isRemoteSyncRef.current && videoState?.isPlaying) {
                  onPause(currentTime);
                }
              } else if (state === 3) {
                // BUFFERING
                setIsBuffering(true);
              } else {
                setIsBuffering(false);
              }
            },
            onError: (err) => {
              console.warn('[YouTube API] Player notice:', err.data);
            },
          },
        });
      } catch (err) {
        console.error('[YouTube API] Setup error:', err);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [mounted, hasVideo, currentVideoId, ensureYouTubeAPI, canControl, videoState?.isPlaying, onPlay, onPause]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (_) {}
      }
    };
  }, []);

  // Sync isPlaying state from server (Remote sync)
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;

    try {
      const state = playerRef.current.getPlayerState?.();
      if (videoState?.isPlaying) {
        if (state !== 1 && state !== 3) {
          isRemoteSyncRef.current = true;
          playerRef.current.playVideo();
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 400);
        }
      } else {
        if (state === 1) {
          isRemoteSyncRef.current = true;
          playerRef.current.pauseVideo();
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 400);
        }
      }
    } catch (_) {}
  }, [videoState?.isPlaying, isPlayerReady]);

  // Sync currentTime from server (Remote seek or drift adjustment)
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady || isInternalSeekingRef.current) return;

    try {
      const targetTime = videoState?.currentTime || 0;
      const currentTime = playerRef.current.getCurrentTime?.() || 0;

      if (Math.abs(currentTime - targetTime) > 1.5) {
        isRemoteSyncRef.current = true;
        playerRef.current.seekTo(targetTime, true);
        setPlayedSeconds(targetTime);
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 400);
      }
    } catch (_) {}
  }, [videoState?.currentTime, isPlayerReady]);

  // Periodic ticker to update time and duration
  useEffect(() => {
    if (!isPlayerReady || seeking) return;

    const timer = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const time = playerRef.current.getCurrentTime?.();
        if (typeof time === 'number' && !isNaN(time)) {
          setPlayedSeconds(time);
        }
        const dur = playerRef.current.getDuration?.();
        if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
          setDuration(dur);
        }
      } catch (_) {}
    }, 500);

    return () => clearInterval(timer);
  }, [isPlayerReady, seeking]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play / Pause toggle from bottom controls bar
  const handlePlayPause = () => {
    if (!canControl || !playerRef.current) return;

    const currentTime = playerRef.current.getCurrentTime?.() || playedSeconds;

    isRemoteSyncRef.current = true;
    if (videoState?.isPlaying) {
      playerRef.current.pauseVideo?.();
      onPause(currentTime);
    } else {
      playerRef.current.playVideo?.();
      onPlay(currentTime);
    }

    setTimeout(() => {
      isRemoteSyncRef.current = false;
    }, 400);
  };

  // Skip forward/back 10 seconds
  const handleSkip = (delta) => {
    if (!canControl || !playerRef.current) return;
    const current = playerRef.current.getCurrentTime?.() || 0;
    const newTime = Math.max(0, Math.min(current + delta, duration));
    isInternalSeekingRef.current = true;
    isRemoteSyncRef.current = true;
    playerRef.current.seekTo?.(newTime, true);
    onSeek(newTime);
    setPlayedSeconds(newTime);
    setTimeout(() => {
      isInternalSeekingRef.current = false;
      isRemoteSyncRef.current = false;
    }, 500);
  };

  // Scrubber seeking
  const handleSeekChange = (e) => {
    if (!canControl) return;
    setSeeking(true);
    setPlayedSeconds(parseFloat(e.target.value));
  };

  const handleSeekEnd = (e) => {
    if (!canControl || !playerRef.current) return;
    const target = parseFloat(e.target.value);
    setSeeking(false);
    isInternalSeekingRef.current = true;
    isRemoteSyncRef.current = true;

    playerRef.current.seekTo?.(target, true);
    onSeek(target);

    setTimeout(() => {
      isInternalSeekingRef.current = false;
      isRemoteSyncRef.current = false;
    }, 500);
  };

  // Scrubber hover preview
  const handleScrubberHover = (e) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(percent * duration);
    setHoverPosition(percent * 100);
  };

  // Volume & Mute handling
  const handleUnmute = (e) => {
    e.stopPropagation();
    if (playerRef.current) {
      playerRef.current.unMute?.();
      playerRef.current.setVolume?.(volume * 100);
    }
    setMuted(false);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute?.();
      playerRef.current.setVolume?.(volume * 100);
      setMuted(false);
    } else {
      playerRef.current.mute?.();
      setMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume?.(newVol * 100);
      if (newVol > 0 && muted) {
        playerRef.current.unMute?.();
        setMuted(false);
      }
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const progressPercent = duration > 0 ? (playedSeconds / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? Math.min(100, progressPercent + 5) : 0;

  const isAdminRole = ['admin', 'host'].includes(userRole?.toLowerCase());
  const isCoAdminRole = ['co-admin', 'mod', 'moderator'].includes(userRole?.toLowerCase());

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  if (!mounted) {
    return (
      <div className="w-full aspect-video bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Initializing Player...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onClick={resetControlsTimeout}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800/50 shadow-2xl shadow-black/20 group flex flex-col justify-end select-none"
    >
      {/* Video Player Display */}
      {hasVideo ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* YouTube IFrame Mount Target */}
          <div
            id={playerIdRef.current}
            className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 pointer-events-auto"
          />

          {/* Buffering Indicator */}
          <AnimatePresence>
            {isBuffering && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-15 pointer-events-none"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
                  <span className="text-xs text-white/70 font-medium">Buffering...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Unmute Button */}
          <AnimatePresence>
            {muted && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleUnmute}
                className="absolute top-4 right-4 sm:right-16 z-30 px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-xl shadow-red-600/40 border border-red-400/30 transition-all cursor-pointer"
                title="Click to enable sound"
              >
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">Click to Unmute</span>
                <span className="sm:hidden">Unmute</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Transparent Overlay for non-controllers (Viewers) to prevent desync clicks */}
          {!canControl && (
            <div
              className="absolute inset-0 z-10 cursor-not-allowed"
              title="Playback is synchronized by Admin / Co-Admin"
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center mb-5 shadow-2xl">
              <Play className="w-10 h-10 text-zinc-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-200 mb-2">No Video Loaded</h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-xs leading-relaxed">
              {canControl
                ? 'Paste a YouTube video link above to start the watch party for everyone.'
                : 'Waiting for the Admin to choose a video to watch.'}
            </p>
          </motion.div>
        </div>
      )}

      {/* Top Gradient Overlay */}
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-15 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

      {/* Role Badge + Sync Indicator */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2"
          >
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-xl shadow-lg border ${
                isAdminRole
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                  : isCoAdminRole
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                  : 'bg-zinc-900/70 text-zinc-400 border-zinc-700/50'
              }`}
            >
              {isAdminRole ? (
                <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              ) : isCoAdminRole ? (
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
              ) : (
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isAdminRole
                  ? 'Admin Controls'
                  : isCoAdminRole
                  ? 'Co-Admin Controls'
                  : 'Synced'}
              </span>
            </div>

            {/* Live Sync Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-xl text-[10px] sm:text-xs font-semibold">
              <Wifi className="w-3 h-3 animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resync Button */}
      <AnimatePresence>
        {showControls && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onSyncRequest}
            title="Resync video with server"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/50 backdrop-blur-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Controls Bar with Premium Gradient */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative z-20 w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-3 sm:pb-4 px-3 sm:px-5"
        onMouseEnter={() => setShowControls(true)}
      >
        {/* Progress / Scrubber Bar */}
        <div
          ref={scrubberRef}
          className="w-full mb-2 sm:mb-3 relative group/scrubber cursor-pointer"
          onMouseMove={handleScrubberHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Hover Time Preview */}
          <AnimatePresence>
            {hoverTime !== null && canControl && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute -top-8 -translate-x-1/2 pointer-events-none z-10"
                style={{ left: `${hoverPosition}%` }}
              >
                <span className="bg-zinc-900 border border-zinc-700/50 text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-lg">
                  {formatTime(hoverTime)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Track Background */}
          <div className="w-full h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden group-hover/scrubber:h-2 sm:group-hover/scrubber:h-2.5 transition-all duration-200">
            {/* Buffered Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-white/15 rounded-full"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 rounded-full transition-[width] duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Invisible Range Input for Touch / Click Seeking */}
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.1}
            value={playedSeconds}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            disabled={!canControl || !hasVideo}
            className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none ${
              !canControl ? 'cursor-not-allowed' : ''
            }`}
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          />

          {/* Scrubber Knob */}
          {canControl && hasVideo && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 border-2 border-white opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
            />
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Controls Group */}
          <div className="flex items-center gap-1 sm:gap-2.5">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              disabled={!canControl || !hasVideo}
              className={`p-2 sm:p-2.5 rounded-xl transition-all ${
                !canControl
                  ? 'opacity-30 cursor-not-allowed text-white/50'
                  : 'cursor-pointer text-white hover:bg-white/10 hover:scale-105 active:scale-95'
              }`}
              title={
                !canControl
                  ? 'Only Admin / Co-Admin can control playback'
                  : videoState?.isPlaying
                  ? 'Pause'
                  : 'Play'
              }
            >
              {videoState?.isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
              )}
            </button>

            {/* Skip Back 10s */}
            <button
              onClick={() => handleSkip(-10)}
              disabled={!canControl || !hasVideo}
              className={`p-1.5 sm:p-2 rounded-lg transition-all hidden sm:flex ${
                !canControl ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Rewind 10s"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => handleSkip(10)}
              disabled={!canControl || !hasVideo}
              className={`p-1.5 sm:p-2 rounded-lg transition-all hidden sm:flex ${
                !canControl ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Forward 10s"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1 sm:gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={muted ? 'Unmute' : 'Mute'}
              >
                <VolumeIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${muted ? 'text-red-400' : ''}`} />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 sm:w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500 opacity-0 sm:opacity-50 group-hover/vol:opacity-100 group-hover/vol:w-16 transition-all duration-200"
              />
            </div>

            {/* Timestamp */}
            <div className="text-[10px] sm:text-xs font-mono text-zinc-400 ml-1 sm:ml-2 tabular-nums">
              <span className="text-white">{formatTime(playedSeconds)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls Group */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
