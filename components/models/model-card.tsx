'use client';

import Link from 'next/link';
import { memo } from 'react';
import { Model, ViewMode } from '@/types';
import { formatNumber } from '@/lib/utils';

interface ModelCardProps {
  model: Model;
  variant?: ViewMode;
}

/**
 * Cinematic model card - Netflix-style media tile
 * Content-first, borderless, with gradient text overlay
 */
export const ModelCard = memo(function ModelCard({ model, variant = 'grid' }: ModelCardProps) {
  const hasImage = !!model.cover_image_url;
  const runCount = model.run_count || 0;

  if (variant === 'list') {
    return (
      <Link href={`/models/${model.owner}/${model.name}`} className="block group">
        <div className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-[#1a1a1a] transition-colors">
          {/* Thumbnail */}
          <div className="h-12 w-20 flex-shrink-0 rounded overflow-hidden bg-[#141414]">
            {hasImage ? (
              <img
                src={model.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl text-[#737373]">
                ◇
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[#e5e5e5] truncate group-hover:text-white transition-colors">
              {model.name}
            </h3>
            <p className="text-sm text-[#737373] truncate">
              {model.owner}
              {runCount > 0 && <span className="ml-2">· {formatNumber(runCount)} runs</span>}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant - cinematic tile
  return (
    <Link href={`/models/${model.owner}/${model.name}`} className="block group">
      <div className="card-lift rounded-lg overflow-hidden bg-[#141414] h-full">
        {/* Cover - 16:9 cinematic */}
        <div className="aspect-video relative overflow-hidden">
          {hasImage ? (
            <img
              src={model.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
              <span className="text-4xl text-[#333]">◇</span>
            </div>
          )}

          {/* Gradient overlay with text */}
          <div className="absolute inset-0 gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Play indicator on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content - minimal */}
        <div className="p-3">
          <h3 className="font-medium text-[#e5e5e5] leading-snug line-clamp-1 group-hover:text-white transition-colors">
            {model.name}
          </h3>
          <p className="text-sm text-[#737373] mt-0.5">
            {model.owner}
          </p>
          {runCount > 0 && (
            <p className="text-xs text-[#525252] mt-1">
              {formatNumber(runCount)} runs
            </p>
          )}
        </div>
      </div>
    </Link>
  );
});
