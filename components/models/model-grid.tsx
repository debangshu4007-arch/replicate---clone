'use client';

import { Model, ViewMode } from '@/types';
import { ModelCard } from './model-card';
import { SkeletonCard, SkeletonModelGrid } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ModelGridProps {
  models: Model[];
  viewMode?: ViewMode;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ModelGrid({
  models,
  viewMode = 'grid',
  isLoading,
  emptyMessage = 'No models found',
}: ModelGridProps) {
  if (isLoading) {
    return <SkeletonModelGrid count={viewMode === 'list' ? 4 : 6} />;
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'flex flex-col gap-2'
      )}
    >
      {models.map((model) => (
        <ModelCard
          key={`${model.owner}/${model.name}`}
          model={model}
          variant={viewMode}
        />
      ))}
    </div>
  );
}
