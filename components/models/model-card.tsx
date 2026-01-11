'use client';

import Link from 'next/link';
import { Model } from '@/types';
import { cn, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Play, Star, User } from 'lucide-react';

interface ModelCardProps {
  model: Model;
  variant?: 'grid' | 'list';
}

export function ModelCard({ model, variant = 'grid' }: ModelCardProps) {
  const hasImage = model.cover_image_url;

  if (variant === 'list') {
    return (
      <Link href={`/models/${model.owner}/${model.name}`}>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-700 transition-all group">
          {/* Thumbnail */}
          <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-800 overflow-hidden">
            {hasImage ? (
              <img
                src={model.cover_image_url}
                alt={model.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl">
                🤖
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                {model.name}
              </h3>
              {model.run_count && model.run_count > 100000 && (
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="h-3 w-3" />
              <span className="truncate">{model.owner}</span>
            </div>
            {model.description && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {model.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {model.run_count && (
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <Play className="h-3 w-3" />
                {formatNumber(model.run_count)}
              </div>
            )}
            <Badge variant="secondary">
              Run →
            </Badge>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link href={`/models/${model.owner}/${model.name}`}>
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden hover:bg-gray-800/50 hover:border-gray-700 transition-all group h-full flex flex-col">
        {/* Cover Image */}
        <div className="aspect-video bg-gray-800 overflow-hidden relative">
          {hasImage ? (
            <img
              src={model.cover_image_url}
              alt={model.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-800 to-gray-900">
              🤖
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Badge variant="info" size="md">
              View Model →
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                {model.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-400 mt-0.5">
                <User className="h-3 w-3" />
                <span className="truncate">{model.owner}</span>
              </div>
            </div>
            {model.run_count && model.run_count > 100000 && (
              <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            )}
          </div>

          {model.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-1">
              {model.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
            {model.run_count && (
              <Badge variant="default">
                <Play className="h-3 w-3 mr-1" />
                {formatNumber(model.run_count)} runs
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
