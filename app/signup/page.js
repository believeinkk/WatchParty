'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tv, Lock, User, AtSign, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/login';

  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-generate suggested userId based on username if userId is empty
  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    if (!userId || userId === username.toLowerCase().replace(/[^a-z0-9_-]/g, '_')) {
      setUserId(val.toLowerCase().replace(/[^a-z0-9_-]/g, '_'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side confirmation check
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          userId: userId.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account.');
        setLoading(false);
      } else {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push(`/login?registered=${encodeURIComponent(userId.trim().toLowerCase())}`);
        }, 1500);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/25 group-hover:scale-105 transition-transform">
              <Tv className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Register to host persistent watch parties and manage rooms
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="e.g. Alex Streamer"
                required
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                User ID (Unique Handle)
              </label>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">lowercase, no spaces</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="e.g. alex_host"
                required
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
              />
              <Shield className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <AtSign className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={6}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/25 active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Host Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-zinc-800/80 text-center space-y-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="text-red-600 dark:text-red-400 hover:underline font-bold transition-colors">
              Sign In
            </Link>
          </p>
          <div>
            <Link
              href="/"
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Home & Join as Guest</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-3xl pointer-events-none rounded-full" />
      <Suspense fallback={<div className="text-zinc-500 text-xs">Loading...</div>}>
        <SignUpForm />
      </Suspense>
    </main>
  );
}
