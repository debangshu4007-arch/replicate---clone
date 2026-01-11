'use client';

import { memo } from 'react';
import { Model, ViewMode } from '@/types';
import { ModelCard } from './model-card';

interface ModelGridProps {
  models: Model[];
  viewMode?: ViewMode;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Model grid - responsive, Netflix-style layout
 */
export const ModelGrid = memo(function ModelGrid({
  models,
  viewMode = 'grid',
  isLoading,
  emptyMessage = 'No models found',
}: ModelGridProps) {
  if (isLoading) {
    return <SkeletonGrid count={viewMode === 'list' ? 6 : 12} viewMode={viewMode} />;
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 opacity-30">◇</div>
        <p className="text-[#737373]">{emptyMessage}</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="divide-y divide-[#1f1f1f]">
        {models.map((model) => (
          <ModelCard
            key={`${model.owner}/${model.name}`}
            model={model}
            variant="list"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {models.map((model) => (
        <ModelCard
          key={`${model.owner}/${model.name}`}
          model={model}
          variant="grid"
        />
      ))}
    </div>
  );
});

// Skeleton loader
function SkeletonGrid({ count, viewMode }: { count: number; viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="divide-y divide-[#1f1f1f]">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-2 py-3">
            <div className="h-12 w-20 rounded skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded skeleton" />
              <div className="h-3 w-24 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden bg-[#141414]">
          <div className="aspect-video skeleton" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 rounded skeleton" />
            <div className="h-3 w-1/2 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
