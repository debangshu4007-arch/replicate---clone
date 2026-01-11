'use client';

import { memo } from 'react';
import { Model, ViewMode } from '@/types';
import { ModelCard } from './model-card';
import { SkeletonModelGrid } from '@/components/ui/skeleton';

interface ModelGridProps {
  models: Model[];
  viewMode?: ViewMode;
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Model grid/list container - memoized to prevent re-renders
 */
export const ModelGrid = memo(function ModelGrid({
  models,
  viewMode = 'grid',
  isLoading,
  emptyMessage = 'No models found',
}: ModelGridProps) {
  if (isLoading) {
    return <SkeletonModelGrid count={viewMode === 'list' ? 5 : 9} />;
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3 opacity-50">🔍</div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-1.5">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
