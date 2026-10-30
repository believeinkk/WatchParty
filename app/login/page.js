'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tv, Lock, User, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const action = searchParams.get('action');
  const registeredUserId = searchParams.get('registered');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (registeredUserId) {
      setIdentifier(registeredUserId);
      setSuccess('Account created! Please enter your password to sign in.');
    }
  }, [registeredUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        identifier: identifier.trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        localStorage.setItem('watchparty_username', identifier.trim());
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error('[Login Error]:', err);
      setError('An unexpected error occurred during sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-zinc-200/80 dark:border-white/20 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/10 dark:shadow-black/50 relative overflow-hidden"
      >
        {/* Subtle Ambient Decorative Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <Link href="/" className="inline-block group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Tv className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Admin Sign In
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            {action === 'create_room'
              ? 'Sign in to create persistent watch rooms with full playback authority'
              : 'Sign in with your registered account to manage rooms and assign roles'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              User ID, Email, or Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. alex_admin or alex@example.com"
                required
                className="w-full bg-zinc-100/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/15 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-red-600 dark:text-red-400 hover:underline transition-colors font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-zinc-100/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/15 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In as Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Actions */}
        <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-white/10 space-y-3 text-center relative z-10">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Don&apos;t have an account?{' '}
            <Link
              href={`/signup${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
              className="text-red-600 dark:text-red-400 hover:underline font-bold transition-colors"
            >
              Create Account
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

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient Radial Depth Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 dark:bg-red-600/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 blur-[100px] pointer-events-none rounded-full" />

      <Suspense fallback={<div className="text-zinc-500 text-xs">Loading form...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
