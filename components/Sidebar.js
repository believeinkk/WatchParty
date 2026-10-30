'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Crown,
  Shield,
  User,
  Copy,
  Check,
  Send,
  PanelRightClose,
  Hash,
  LinkIcon,
  Smile,
  ArrowDown,
} from 'lucide-react';
import ShareLink from '@/components/ShareLink';
import ParticipantList from '@/components/ParticipantList';

export default function Sidebar({
  roomId,
  participants = [],
  currentUserId,
  currentUserRole,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
  messages = [],
  onSendMessage,
  isOpen = true,
  onClose,
  activeTab: controlledActiveTab,
  onTabChange,
}) {
  const [internalActiveTab, setInternalActiveTab] = useState('chat');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const setActiveTab = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const [copiedCode, setCopiedCode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const chatBottomRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Track scroll position to show/hide scroll-to-bottom button
  const handleChatScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 80);
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyRoomCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !onSendMessage) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Tab content animation variants
  const tabContentVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  };

  return (
    <aside className="w-full lg:w-80 h-full flex flex-col bg-white/95 dark:bg-zinc-900/95 border-l border-zinc-200/80 dark:border-zinc-800/60 backdrop-blur-xl transition-colors duration-200 select-none">
      {/* Compact Header */}
      <div className="p-3 sm:p-4 border-b border-zinc-200/80 dark:border-zinc-800/60">
        {/* Top Header Row with Minimize Toggle */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Room Panel
            </span>
            <span className="relative text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              Live
            </span>
          </div>

          {onClose && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Minimize Sidebar (Full Screen Video)"
              aria-label="Minimize Sidebar"
            >
              <PanelRightClose className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Room Code & Sharing Card */}
        <div className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/60 rounded-xl p-2.5 mb-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <Hash className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-200 tracking-wider truncate">
                {roomId}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopyRoomCode}
                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Copy Room ID"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <ShareLink roomId={roomId} compact />
            </div>
          </div>
        </div>

        {/* Dual Navigation Tabs */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-950/80 p-1 border border-zinc-200/80 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'chat'
                ? 'text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'chat' && (
              <motion.div
                layoutId="sidebar-tab-indicator"
                className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-500 rounded-lg shadow-md shadow-red-600/25 -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {messages.length > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full font-mono ${
                activeTab === 'chat' ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}>
                {messages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'participants'
                ? 'text-zinc-900 dark:text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'participants' && (
              <motion.div
                layoutId="sidebar-tab-indicator"
                className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-md -z-10 border border-zinc-200/50 dark:border-zinc-700/50"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Users className="w-3.5 h-3.5" />
            <span>People ({participants.length})</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <AnimatePresence mode="wait">
        {/* TAB 1: LIVE TEXT CHAT */}
        {activeTab === 'chat' && (
          <motion.div
            key="chat-tab"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Messages Scroll Area */}
            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 scroll-smooth"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">No messages yet</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[180px]">
                    Say hello to everyone in the watch party!
                  </p>
                </div>
              ) : (
                messages.map((m, index) => {
                  const roleLower = m.role?.toLowerCase();
                  const isAdmin = roleLower === 'admin' || roleLower === 'host';
                  const isCoAdmin = roleLower === 'co-admin' || roleLower === 'mod' || roleLower === 'moderator';
                  const isSelf = m.userId === currentUserId;

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, delay: index > messages.length - 3 ? 0.05 : 0 }}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
                        isSelf
                          ? 'bg-red-500/5 dark:bg-red-500/10 border-red-500/15 dark:border-red-500/20'
                          : isAdmin
                          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20'
                          : isCoAdmin
                          ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20'
                          : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200/60 dark:border-zinc-800/60'
                      }`}
                    >
                      {/* Sender Header */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* Avatar */}
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            isAdmin
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : isCoAdmin
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : isSelf
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                          }`}>
                            {m.username ? m.username.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span
                            className={`text-[11px] font-bold truncate ${
                              isAdmin
                                ? 'text-amber-700 dark:text-amber-300'
                                : isCoAdmin
                                ? 'text-blue-700 dark:text-blue-300'
                                : isSelf
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            {m.username}
                          </span>
                          {isSelf && (
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">(You)</span>
                          )}
                        </div>

                        {/* Role Tag + Timestamp */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAdmin && (
                            <span className="text-[8px] uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/25">
                              Admin
                            </span>
                          )}
                          {isCoAdmin && (
                            <span className="text-[8px] uppercase px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold border border-blue-500/25">
                              Co-Admin
                            </span>
                          )}
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">{m.timestamp}</span>
                        </div>
                      </div>

                      {/* Message Body */}
                      <p className="text-xs text-zinc-700 dark:text-zinc-200 break-words leading-relaxed pl-6.5 sm:pl-7">
                        {m.message}
                      </p>
                    </motion.div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Scroll to Bottom Floating Button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 p-2 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 cursor-pointer hover:bg-red-500 transition-colors"
                  title="Scroll to latest messages"
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-2.5 sm:p-3 border-t border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-50/80 dark:bg-zinc-950/60"
            >
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={500}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/60 rounded-xl pl-3.5 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10 transition-all shadow-sm"
                />
                <motion.button
                  type="submit"
                  disabled={!inputText.trim()}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 disabled:opacity-30 disabled:hover:from-red-600 disabled:hover:to-rose-500 text-white transition-all cursor-pointer shadow-md shadow-red-600/20 shrink-0"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TAB 2: PARTICIPANTS LIST */}
        {activeTab === 'participants' && (
          <motion.div
            key="participants-tab"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col min-h-0"
          >
            <ParticipantList
              participants={participants}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onAssignRole={onAssignRole}
              onRemoveParticipant={onRemoveParticipant}
              onTransferHost={onTransferHost}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-zinc-200/80 dark:border-zinc-800/60 text-center">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
          Powered by WatchParty · Real-time Sync
        </span>
      </div>
    </aside>
  );
}
