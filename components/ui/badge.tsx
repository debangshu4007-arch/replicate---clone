'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const badgeVariants = {
  default: 'bg-gray-800 text-gray-300 border-gray-700',
  secondary: 'bg-gray-700 text-gray-200 border-gray-600',
  success: 'bg-green-500/10 text-green-500 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const badgeSizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
};

export function Badge({
  className,
  variant = 'default',
  size = 'sm',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    />
  );
}

// Convenience wrappers for status badges
export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeProps['variant']> = {
    succeeded: 'success',
    failed: 'error',
    canceled: 'error',
    processing: 'info',
    starting: 'warning',
  };

  return (
    <Badge variant={variants[status] || 'default'}>
      {status}
    </Badge>
  );
}

// Modality badges
export function ModalityBadge({ modality }: { modality: string }) {
  const icons: Record<string, string> = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    text: '📝',
    multimodal: '🔀',
  };

  return (
    <Badge variant="secondary">
      {icons[modality] || '📦'} {modality}
    </Badge>
  );
}
