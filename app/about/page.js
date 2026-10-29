'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Tv,
  Wifi,
  ShieldCheck,
  Users,
  Film,
  Sparkles,
  ArrowRight,
  Crown,
  Play,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  HeartHandshake,
} from 'lucide-react';

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 py-20 overflow-hidden border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 mb-6 shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-red-500" />
              <span>Real-Time Sync Architecture & Mission</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-white mb-6 leading-tight"
            >
              Engineered for seamless, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 dark:from-red-500 dark:via-rose-400 dark:to-amber-400">
                sub-second video synchronization.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              YouTube Watch Party solves video desynchronization across distributed audiences with
              WebSocket state machines, RBAC moderation, and an intelligent lobby control system.
            </motion.p>
          </div>
        </section>

        {/* Technology Deep Dive */}
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Core Technical Pillars
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              How our single-process real-time engine delivers uninterrupted synchronization
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Pillar 1 */}
            <motion.div
              variants={itemVariants}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-5">
                  <Wifi className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                  Drift-Compensating State Engine
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  WebSocket events broadcast timestamps on every play, pause, or seek. Clients
                  continuously reconcile their local playback against the canonical timeline with a
                  strict 1.5-second threshold to guarantee zero audio overlap.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 font-mono">
                Socket.io Event Broadcasts
              </div>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div
              variants={itemVariants}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                  Role-Based Moderation (RBAC)
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  Multi-tier role model with Admin, Co-Admin, and Viewer privileges. Prevents
                  playback hijacking while empowering Admins to transfer ownership, assign
                  moderators, approve participant video requests, or remove disruptive users.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 font-mono">
                Admin, Co-Admin & Viewer Security
              </div>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div
              variants={itemVariants}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-5">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                  Lobby & Waiting Room Gatekeeper
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  Rooms feature an optional Waiting Room lobby. Uninvited viewers wait for Admin
                  admittance via floating notifications, while Admins can toggle Auto-Join or click
                  &quot;Admit All&quot; with a single click.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 font-mono">
                Lobby Waiting System & Auto-Join
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Technical Specs Table Section */}
        <section className="py-16 px-6 bg-zinc-100/60 dark:bg-zinc-900/40 border-y border-zinc-200 dark:border-zinc-800/80">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">System Architecture & Specifications</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">High-performance specifications at a glance</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
                <span className="text-2xl font-black text-red-500">&lt; 50ms</span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Event Latency</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
                <span className="text-2xl font-black text-amber-500">1.5s</span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Drift Tolerance</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
                <span className="text-2xl font-black text-emerald-500">3-Tier</span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">RBAC Roles</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
                <span className="text-2xl font-black text-blue-500">MongoDB</span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">State Persistence</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Vision & Mission Section */}
        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-zinc-900/80 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-3xl pointer-events-none rounded-full" />

            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-red-600/15 border border-red-500/20 text-red-500 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Our Vision: Shared Moments, Distances Erased
              </h3>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Whether you are streaming a documentary with classmates, enjoying music videos with
                friends across continents, or conducting remote study sessions, video should be an
                intimate, shared experience. We built this platform so that anyone can launch a
                party room in seconds without cumbersome plugins or complicated screen shares.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
                >
                  <span>Launch a Watch Party</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/contact"
                  className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all border border-zinc-200 dark:border-zinc-700"
                >
                  <span>Contact Our Team</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
