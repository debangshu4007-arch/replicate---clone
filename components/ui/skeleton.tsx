'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton rounded', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden bg-[#141414]">
      <div className="aspect-video skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  );
}

export function SkeletonModelGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 px-2 py-3">
      <div className="h-12 w-20 rounded skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded skeleton" />
        <div className="h-3 w-24 rounded skeleton" />
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="h-3 w-20 rounded skeleton" />
        <div className="h-10 w-full rounded skeleton" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-24 rounded skeleton" />
        <div className="h-24 w-full rounded skeleton" />
      </div>
      <div className="h-10 w-24 rounded skeleton" />
    </div>
  );
}

export function SkeletonPrediction() {
  return (
    <div className="rounded-lg bg-[#141414] p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-5 w-24 rounded skeleton" />
        <div className="h-5 w-16 rounded-full skeleton" />
      </div>
      <div className="h-3 w-full rounded skeleton" />
      <div className="h-40 w-full rounded skeleton" />
    </div>
  );
}
