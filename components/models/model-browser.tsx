'use client';

import { useEffect, useRef, useMemo } from 'react';
import { ModelFilters, ViewMode } from '@/types';
import { useInfiniteModels } from '@/hooks/use-infinite-models';
import { ModelGrid } from './model-grid';
import { Loader2, AlertCircle } from 'lucide-react';

interface ModelBrowserProps {
    filters: ModelFilters;
    viewMode: ViewMode;
}

export function ModelBrowser({ filters, viewMode }: ModelBrowserProps) {
    // Build fetch URL based on filters - memoized to prevent unnecessary refreshes
    const fetchUrl = useMemo(() => {
        if (filters.search && filters.search.trim()) {
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

    // Intersection Observer for infinite scroll
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Disconnect previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        // Don't observe if we're searching (search doesn't paginate)
        const isSearchMode = !!filters.search?.trim();
        if (isSearchMode) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                // Only trigger if visible, has more, and not already loading
                if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    loadMore();
                }
            },
            {
                rootMargin: '100px',
                threshold: 0
            }
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, isLoadingMore, isLoading, loadMore, filters.search]);

    const isSearchMode = !!filters.search?.trim();

    if (error) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">Failed to load models</p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-400 hover:text-blue-300"
                >
                    Reload page
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search mode notice */}
            {isSearchMode && !isLoading && models.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 border border-gray-800 rounded px-3 py-2">
                    <AlertCircle className="h-3 w-3" />
                    <span>Search returns top 50 matches. Clear search to browse all.</span>
                </div>
            )}

            {/* Grid */}
            <ModelGrid
                models={models}
                viewMode={viewMode}
                isLoading={isLoading}
                emptyMessage={
                    isSearchMode
                        ? `No models match "${filters.search}"`
                        : 'No models found'
                }
            />

            {/* Infinite scroll sentinel */}
            {!isLoading && models.length > 0 && !isSearchMode && (
                <div ref={sentinelRef} className="py-6 flex justify-center">
                    {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading...</span>
                        </div>
                    ) : hasMore ? (
                        <div className="h-1" aria-hidden="true" />
                    ) : (
                        <p className="text-gray-600 text-xs">
                            {totalLoaded} models loaded
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
