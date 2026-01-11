'use client';

import Link from 'next/link';
import { memo } from 'react';
import { Model, ViewMode } from '@/types';
import { formatNumber } from '@/lib/utils';
import { Play } from 'lucide-react';

interface ModelCardProps {
  model: Model;
  variant?: ViewMode;
}

/**
 * Model card component - Replicate-inspired minimal design
 * Optimized with memo to prevent unnecessary re-renders
 */
export const ModelCard = memo(function ModelCard({ model, variant = 'grid' }: ModelCardProps) {
  const hasImage = !!model.cover_image_url;
  const runCount = model.run_count || 0;
  const isPopular = runCount > 100000;

  if (variant === 'list') {
    return (
      <Link href={`/models/${model.owner}/${model.name}`} className="block">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-800 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-800/60 transition-colors">
          {/* Thumbnail */}
          <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-800 overflow-hidden">
            {hasImage ? (
              <img
                src={model.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-lg bg-gray-800">
                🤖
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white text-sm truncate">
                {model.name}
              </span>
              {isPopular && (
                <span className="text-yellow-500 text-xs">★</span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {model.owner}
            </div>
          </div>

          {/* Stats */}
          {runCount > 0 && (
            <div className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
              <Play className="h-3 w-3" />
              {formatNumber(runCount)}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Grid variant
  return (
    <Link href={`/models/${model.owner}/${model.name}`} className="block group">
      <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden hover:border-gray-700 hover:bg-gray-800/40 transition-colors h-full flex flex-col">
        {/* Cover */}
        <div className="aspect-[16/10] bg-gray-800 overflow-hidden relative">
          {hasImage ? (
            <img
              src={model.cover_image_url}
              alt=""
              className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-800 to-gray-900">
              🤖
            </div>
          )}

          {/* Hover overlay - minimal */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-xs font-medium text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              Run →
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col gap-1">
          {/* Name + Star */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-white text-sm leading-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
              {model.name}
            </h3>
            {isPopular && (
              <span className="text-yellow-500 text-xs flex-shrink-0">★</span>
            )}
          </div>

          {/* Owner */}
          <div className="text-xs text-gray-500">
            {model.owner}
          </div>

          {/* Description */}
          {model.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 flex-1">
              {model.description}
            </p>
          )}

          {/* Stats footer */}
          {runCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5 pt-1.5 border-t border-gray-800/50">
              <Play className="h-3 w-3" />
              <span>{formatNumber(runCount)} runs</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});
