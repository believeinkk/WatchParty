'use client';

import Link from 'next/link';
import {
  Tv,
  Globe,
  Heart,
  Shield,
  Sparkles,
  Video,
  Film,
  MessageSquare,
  Code,
  Mail,
  Zap,
  Radio,
  Sliders,
  Users,
  ExternalLink,
  CheckCircle2,
  Lock,
} from 'lucide-react';

function GithubIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function TwitterIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950/60 backdrop-blur-md text-zinc-600 dark:text-zinc-400 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Tv className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                Watch<span className="bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">Party</span>
              </span>
            </Link>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
              Real-time synchronized YouTube watch parties with ultra-low latency playback, multi-tier
              RBAC moderation, waiting lobby admissions, and cross-device responsive design.
            </p>

            {/* Live Engine Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>WebSocket Sync Engine Online</span>
            </div>

            {/* Social Icons (Zero emojis — 100% Crisp Vector Icons) */}
            <div className="pt-2 flex items-center gap-2.5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="GitHub Repository"
                aria-label="GitHub Repository"
              >
                <GithubIcon />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="Twitter Community"
                aria-label="Twitter Community"
              >
                <TwitterIcon />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="LinkedIn Network"
                aria-label="LinkedIn Network"
              >
                <LinkedinIcon />
              </a>

              <a
                href="mailto:support@watchparty.live"
                className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                title="Contact Email Support"
                aria-label="Contact Email Support"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 3: Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Platform
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/"
                  className="hover:text-red-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>Home Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#join"
                  className="hover:text-red-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Join Party</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#create"
                  className="hover:text-red-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Create Room</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-red-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5 text-red-500" />
                  <span>About Technology</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-red-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Contact & Feedback</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Architecture & Specs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Architecture
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Shield className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>RBAC Role Engine</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Socket.io Broadcast</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>YouTube IFrame API</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Lobby Waiting Gate</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>MongoDB Persistence</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Security & Accounts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Access & Auth
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/signup"
                  className="hover:text-red-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Create Account</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-red-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Admin Sign In</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/forgot-password"
                  className="hover:text-red-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Reset Password</span>
                </Link>
              </li>
            </ul>

            <div className="pt-2">
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Security Standard
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  BCrypt hashed credentials & isolated session tokens.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
          <p>© 2026 WatchParty Platform. All rights reserved.</p>

          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span>Built with Next.js & Socket.io</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              <span>for shared streaming</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
