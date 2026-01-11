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
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900',
          checked ? 'bg-blue-600' : 'bg-gray-700',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {(label || hint) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-gray-300 cursor-pointer"
              onClick={() => !disabled && onChange(!checked)}
            >
              {label}
            </label>
          )}
          {hint && (
            <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
          )}
        </div>
      )}
    </div>
  );
}
