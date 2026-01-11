'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  label?: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  label,
  hint,
  checked,
  onChange,
  disabled,
  className,
}: SwitchProps) {
  const inputId = React.useId();

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
          checked ? 'bg-white' : 'bg-[#333]',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full shadow transition duration-150',
            checked ? 'translate-x-4 bg-[#0a0a0a]' : 'translate-x-0 bg-[#737373]'
          )}
        />
      </button>
      {(label || hint) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-[#a3a3a3] cursor-pointer"
              onClick={() => !disabled && onChange(!checked)}
            >
              {label}
            </label>
          )}
          {hint && <p className="text-xs text-[#525252] mt-0.5">{hint}</p>}
        </div>
      )}
    </div>
  );
}
