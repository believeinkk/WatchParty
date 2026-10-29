'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareLink({ roomId, className = '', onCopied }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!roomId) return;

    const fullUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/room/${encodeURIComponent(roomId)}`
        : `/room/${roomId}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      if (onCopied) {
        onCopied('Shareable link copied to clipboard!');
      }

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to copy room link:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopyLink}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer ${
        copied
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      } ${className}`}
      title="Copy Shareable Watch Party Link"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>Copy Shareable Link</span>
        </>
      )}
    </button>
  );
}
