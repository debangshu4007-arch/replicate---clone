'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  label?: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showValue?: boolean;
}

export function Slider({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  required,
  className,
  showValue = true,
}: SliderProps) {
  const inputId = React.useId();
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-sm font-medium text-[#a3a3a3]">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
          {showValue && (
            <span className="text-sm text-[#525252] font-mono">{value}</span>
          )}
        </div>
      )}
      <input
        type="range"
        id={inputId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={cn(
          'w-full h-1.5 rounded-lg appearance-none cursor-pointer',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:w-4',
          '[&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-white',
          '[&::-moz-range-thumb]:border-0',
        )}
        style={{
          background: `linear-gradient(to right, #525252 0%, #525252 ${percentage}%, #262626 ${percentage}%, #262626 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-[#525252]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint && <p className="text-xs text-[#525252]">{hint}</p>}
    </div>
  );
}
