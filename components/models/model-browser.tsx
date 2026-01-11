'use client';

import { useEffect, useRef, useMemo } from 'react';
import { ModelFilters, ViewMode } from '@/types';
import { useInfiniteModels } from '@/hooks/use-infinite-models';
import { ModelGrid } from './model-grid';
import { Loader2 } from 'lucide-react';

interface ModelBrowserProps {
    filters: ModelFilters;
    viewMode: ViewMode;
}

export function ModelBrowser({ filters, viewMode }: ModelBrowserProps) {
    const fetchUrl = useMemo(() => {
        if (filters.search?.trim()) {
            return `/api/models/search?q=${encodeURIComponent(filters.search.trim())}&limit=50`;
        }
        const sortBy = filters.sort === 'newest' ? 'model_created_at' : 'latest_version_created_at';
        return `/api/models?sort_by=${sortBy}&sort_direction=desc`;
    }, [filters.search, filters.sort]);

    const {
        models,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        loadMore,
        totalLoaded,
    } = useInfiniteModels({ fetchUrl });

    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        const isSearchMode = !!filters.search?.trim();
        if (isSearchMode) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    loadMore();
                }
            },
            { rootMargin: '200px', threshold: 0 }
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [hasMore, isLoadingMore, isLoading, loadMore, filters.search]);

    const isSearchMode = !!filters.search?.trim();

    if (error) {
        return (
            <div className="text-center py-16">
                <p className="text-[#737373] mb-3">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-[#a3a3a3] hover:text-white"
                >
                    Reload
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Search notice */}
            {isSearchMode && !isLoading && models.length > 0 && (
                <p className="text-xs text-[#525252] mb-4">
                    Showing top 50 results for "{filters.search}"
                </p>
            )}

            <ModelGrid
                models={models}
                viewMode={viewMode}
                isLoading={isLoading}
                emptyMessage={isSearchMode ? `No models match "${filters.search}"` : 'No models found'}
            />

            {/* Infinite scroll sentinel */}
            {!isLoading && models.length > 0 && !isSearchMode && (
                <div ref={sentinelRef} className="py-8 flex justify-center">
                    {isLoadingMore ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[#525252]" />
                    ) : hasMore ? (
                        <div className="h-1" />
                    ) : (
                        <p className="text-xs text-[#525252]">{totalLoaded} models</p>
                    )}
                </div>
            )}
        </div>
    );
}
