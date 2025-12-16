'use client';

import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export default function PremiumBadge({ size = 'medium' }: PremiumBadgeProps) {
  const sizes = {
    small: 'px-3 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white rounded-full font-bold shadow-lg ${sizes[size]}`}
    >
      <Crown className={iconSizes[size]} />
      <span>PREMIUM</span>
    </motion.div>
  );
}
