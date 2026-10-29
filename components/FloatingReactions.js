'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp, Flame, Smile } from 'lucide-react';

const REACTION_CONFIG = {
  heart: {
    icon: Heart,
    color: 'text-rose-500 dark:text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/40',
    glowColor: 'shadow-rose-500/40',
    label: 'Love',
  },
  flame: {
    icon: Flame,
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    glowColor: 'shadow-amber-500/40',
    label: 'Fire',
  },
  thumbsUp: {
    icon: ThumbsUp,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/40',
    label: 'Like',
  },
  smile: {
    icon: Smile,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/40',
    label: 'Smile',
  },
};

/**
 * Floating Animated Reaction Display Overlay
 */
export function FloatingReactions({ reactions = [] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <AnimatePresence>
        {reactions.map((r) => {
          const config = REACTION_CONFIG[r.type] || REACTION_CONFIG.heart;
          const IconComponent = config.icon;
          const leftPercent = r.randomX ?? 50;

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -240,
                scale: [0.5, 1.3, 1.1, 0.8],
                rotate: [0, -8, 8, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              style={{ left: `${leftPercent}%` }}
              className="absolute bottom-16 -translate-x-1/2 flex flex-col items-center gap-1"
            >
              <div
                className={`p-3 rounded-2xl ${config.bgColor} ${config.color} border ${config.borderColor} shadow-xl ${config.glowColor} backdrop-blur-md`}
              >
                <IconComponent className="w-7 h-7 fill-current" />
              </div>
              <span className="text-[10px] font-semibold text-white bg-black/70 px-2 py-0.5 rounded-full border border-zinc-700/50 backdrop-blur-md">
                {r.username}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Reaction Quick Bar with 4 Lucide Icons
 */
export function ReactionPicker({ onSendReaction }) {
  const reactionTypes = ['heart', 'flame', 'thumbsUp', 'smile'];

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/90 backdrop-blur-xl shadow-lg">
      {reactionTypes.map((type) => {
        const config = REACTION_CONFIG[type];
        const IconComponent = config.icon;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSendReaction(type)}
            className={`p-2 rounded-xl ${config.color} hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:scale-125 active:scale-95 cursor-pointer`}
            title={`React ${config.label}`}
          >
            <IconComponent className="w-4 h-4 fill-current/20 hover:fill-current transition-colors" />
          </button>
        );
      })}
    </div>
  );
}
