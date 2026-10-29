'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Check,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Clock,
  ShieldAlert,
  UserCheck,
  CheckCheck,
} from 'lucide-react';

export function AdminJoinToast({ request, onAdmit, onReject }) {
  if (!request) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
    >
      <div className="bg-white dark:bg-zinc-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
            {request.username ? request.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {request.username}
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              Wants to join the watch party
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onAdmit(request.requestId)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Admit Viewer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Admit</span>
          </button>
          <button
            onClick={() => onReject(request.requestId)}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Reject Viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function AutoJoinToggle({ autoJoin, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!autoJoin)}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer select-none ${
        autoJoin
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm'
          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
      }`}
      title={
        autoJoin
          ? 'Auto-Join is ON: New viewers enter automatically'
          : 'Auto-Join is OFF: New viewers wait in lobby for approval'
      }
    >
      {autoJoin ? (
        <>
          <ToggleRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Auto-Join ON</span>
        </>
      ) : (
        <>
          <ToggleLeft className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <span>Auto-Join OFF</span>
        </>
      )}
    </button>
  );
}

export function PendingRequestsModal({
  isOpen,
  onClose,
  pendingRequests = [],
  onAdmit,
  onReject,
  onAdmitAll,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Lobby Waiting Room
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {pendingRequests.length} {pendingRequests.length === 1 ? 'viewer' : 'viewers'} waiting for approval
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admit All Option Button */}
        {pendingRequests.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => {
                onAdmitAll();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Admit All ({pendingRequests.length} Waiting)</span>
            </button>
          </div>
        )}

        {/* Requests List */}
        <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
              <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p>No viewers waiting in the lobby.</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                When viewers arrive, they will appear here.
              </p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.requestId}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
                    {req.username ? req.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {req.username}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {req.requestedAt || 'Just now'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onAdmit(req.requestId)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Admit"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Admit</span>
                  </button>
                  <button
                    onClick={() => onReject(req.requestId)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Reject"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
