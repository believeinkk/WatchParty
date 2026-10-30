'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  ArrowRight,
  Info,
  Mail,
  Home,
  Settings,
  ChevronDown,
  Sparkles,
  Plus,
  Users,
  Zap,
  Copy,
  Check,
  Shield,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [isCreatingRoomNav, setIsCreatingRoomNav] = useState(false);
  const dropdownRef = useRef(null);

  // Track scroll for navbar background shift
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U';
  const displayUserId = session?.user?.id || session?.user?.email || 'user';

  const handleCopyUserId = async (e) => {
    e.stopPropagation();
    if (!session?.user?.id) return;
    try {
      await navigator.clipboard.writeText(session.user.id);
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoomNavbar = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);

    if (!isAuthenticated) {
      router.push('/login?callbackUrl=/#create&action=create_room');
      return;
    }

    setIsCreatingRoomNav(true);
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
      console.error('Navbar create room error:', err);
      const fallbackId = Math.random().toString(36).substring(2, 9);
      router.push(`/room/${fallbackId}?role=Admin`);
    } finally {
      setIsCreatingRoomNav(false);
    }
  };

  const handleJoinPartyNavbar = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    if (pathname === '/') {
      const inputEl = document.getElementById('room-id-input') || document.getElementById('action-card');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus?.();
      }
    } else {
      router.push('/#join');
    }
  };

  const handleNavigateTab = (tab) => {
    if (tab === 'create') {
      handleCreateRoomNavbar();
    } else {
      handleJoinPartyNavbar();
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-md shadow-black/[0.03] dark:shadow-black/20'
          : 'bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-200/40 dark:border-zinc-800/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/25"
          >
            <Tv className="w-5 h-5 text-white" />
          </motion.div>
          <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white">
            Watch<span className="bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">Party</span>
          </span>
        </Link>

        {/* Desktop Navigation Links — Floating Pill Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/70 rounded-full px-1.5 py-1 backdrop-blur-md shadow-xs">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/60 rounded-full -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Quick Create Room Button */}
          {isAuthenticated ? (
            <button
              type="button"
              id="navbar-create-room-btn"
              onClick={handleCreateRoomNavbar}
              disabled={isCreatingRoomNav}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-70"
            >
              {isCreatingRoomNav ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{isCreatingRoomNav ? 'Creating...' : 'Create Room'}</span>
            </button>
          ) : (
            <button
              type="button"
              id="navbar-join-party-btn"
              onClick={handleJoinPartyNavbar}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Join Party</span>
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile / Auth State */}
          {isAuthenticated ? (
            <div ref={dropdownRef} className="relative">
              {/* Profile Pill Button */}
              <button
                type="button"
                id="user-profile-menu-btn"
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  userDropdownOpen
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-800 dark:border-white shadow-md'
                    : 'bg-zinc-100/90 hover:bg-zinc-200/80 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 border-zinc-200/80 dark:border-zinc-800/70 text-zinc-800 dark:text-zinc-200'
                }`}
                aria-expanded={userDropdownOpen}
                aria-label="User Profile Menu"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center font-bold text-[11px] text-white shadow-sm">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold truncate max-w-[105px]">
                  {session?.user?.name || 'Account'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/90 dark:border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-2 z-50 backdrop-blur-2xl"
                  >
                    {/* User Info Header */}
                    <div className="px-3 py-2.5 mb-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/60">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {session?.user?.name}
                        </p>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Admin
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {session?.user?.email || 'Registered User'}
                      </p>

                      {/* User ID with one-click copy */}
                      {session?.user?.id && (
                        <button
                          type="button"
                          onClick={handleCopyUserId}
                          className="mt-2 w-full flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                          title="Copy Unique User ID"
                        >
                          <span className="font-mono truncate max-w-[140px]">
                            ID: {session.user.id}
                          </span>
                          {copiedUserId ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-400" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        id="profile-dropdown-create-btn"
                        onClick={handleCreateRoomNavbar}
                        disabled={isCreatingRoomNav}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-70"
                      >
                        <span className="flex items-center gap-2">
                          {isCreatingRoomNav ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span>Create Party Room</span>
                        </span>
                        <span className="text-[10px] text-zinc-400">Launch</span>
                      </button>

                      <button
                        type="button"
                        id="profile-dropdown-join-btn"
                        onClick={handleJoinPartyNavbar}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>Join with Room Code</span>
                        </span>
                        <span className="text-[10px] text-zinc-400">Code</span>
                      </button>

                      <Link
                        href="/about"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Platform Docs</span>
                        </span>
                      </Link>

                      <Link
                        href="/contact"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Contact Support</span>
                        </span>
                      </Link>
                    </div>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1.5" />

                    {/* Sign Out Button */}
                    <button
                      type="button"
                      id="navbar-signout-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Right: Theme Toggle + Menu Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shadow-sm"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Animated Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-zinc-200/80 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Navigation Links */}
              <div className="space-y-1">
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-zinc-700/50'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
                        <span>{link.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick Action Buttons (Mobile) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="mobile-drawer-create-btn"
                  onClick={handleCreateRoomNavbar}
                  disabled={isCreatingRoomNav}
                  className="py-2.5 text-center rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-xs font-bold text-white shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
                >
                  {isCreatingRoomNav ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{isCreatingRoomNav ? 'Creating...' : 'Create Room'}</span>
                </button>
                <button
                  type="button"
                  id="mobile-drawer-join-btn"
                  onClick={handleJoinPartyNavbar}
                  className="py-2.5 text-center rounded-xl bg-zinc-100 dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>Join Room</span>
                </button>
              </div>

              {/* User Section (Mobile) */}
              <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/60">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center font-bold text-sm text-white shadow-sm shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {session?.user?.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {session?.user?.email || 'Logged In'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 text-center rounded-xl bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/60"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 text-center rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-xs font-bold text-white shadow-md shadow-red-600/20"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
