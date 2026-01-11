import { useState, useCallback, useRef, useEffect } from 'react';
import { Model, ModelListResponse } from '@/types';

interface UseInfiniteModelsOptions {
    fetchUrl?: string;
}

interface UseInfiniteModelsReturn {
    models: Model[];
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    totalLoaded: number;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Robust infinite scroll hook for model lists.
 * 
 * CURSOR RULES (must be followed strictly):
 * 1. NEVER send cursor on first request
 * 2. NEVER send cursor if it's null/undefined/empty
 * 3. HARD STOP loading when hasMore === false
 * 4. De-duplicate models by owner/name
 */
export function useInfiniteModels({
    fetchUrl = '/api/models',
}: UseInfiniteModelsOptions = {}): UseInfiniteModelsReturn {
    const [models, setModels] = useState<Model[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Track loaded model IDs to prevent duplicates
    const loadedIds = useRef<Set<string>>(new Set());
    // Prevent concurrent requests
    const isRequestInFlight = useRef(false);
    // Track the current fetchUrl to detect changes
    const currentUrlRef = useRef(fetchUrl);

    const fetchModels = useCallback(async (cursor?: string): Promise<ModelListResponse | null> => {
        try {
            const url = new URL(fetchUrl, window.location.origin);

            // CRITICAL: Only add cursor if it's a valid, non-empty string
            if (cursor && typeof cursor === 'string' && cursor.trim().length > 0) {
                url.searchParams.set('cursor', cursor);
                if (isDev) console.log('[useInfiniteModels] Fetching with cursor:', cursor.substring(0, 20) + '...');
            } else {
                if (isDev) console.log('[useInfiniteModels] Fetching first page (no cursor)');
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data: ModelListResponse = await response.json();

            if (isDev) {
                console.log('[useInfiniteModels] Response:', {
                    resultCount: data.results?.length || 0,
                    hasNext: !!data.next,
                    nextCursor: data.next ? data.next.substring(0, 20) + '...' : null
                });
            }

            return data;
        } catch (err) {
            console.error('[useInfiniteModels] Fetch error:', err);
            throw err;
        }
    }, [fetchUrl]);

    const loadMore = useCallback(async () => {
        // HARD GUARDS - prevent invalid loadMore calls
        if (isRequestInFlight.current) {
            if (isDev) console.log('[useInfiniteModels] Blocked: request in flight');
            return;
        }
        if (isLoadingMore) {
            if (isDev) console.log('[useInfiniteModels] Blocked: already loading more');
            return;
        }
        if (!hasMore) {
            if (isDev) console.log('[useInfiniteModels] Blocked: no more pages');
            return;
        }
        if (!nextCursor || nextCursor.trim().length === 0) {
            if (isDev) console.log('[useInfiniteModels] Blocked: no valid cursor');
            setHasMore(false);
            return;
        }

        isRequestInFlight.current = true;
        setIsLoadingMore(true);

        try {
            const data = await fetchModels(nextCursor);
            if (!data) return;

            // Filter duplicates and add new models
            const newModels = (data.results || []).filter(model => {
                const id = `${model.owner}/${model.name}`;
                if (loadedIds.current.has(id)) return false;
                loadedIds.current.add(id);
                return true;
            });

            if (newModels.length > 0) {
                setModels(prev => [...prev, ...newModels]);
            }

            // Update pagination state
            const nextPage = data.next && typeof data.next === 'string' && data.next.trim().length > 0
                ? data.next
                : null;
            setNextCursor(nextPage);
            setHasMore(!!nextPage);

        } catch (err) {
            // Silent fail for pagination - don't break the UI
            console.error('[useInfiniteModels] loadMore failed:', err);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
            isRequestInFlight.current = false;
        }
    }, [isLoadingMore, hasMore, nextCursor, fetchModels]);

    const refresh = useCallback(async () => {
        if (isRequestInFlight.current) return;

        isRequestInFlight.current = true;
        setIsLoading(true);
        setError(null);
        loadedIds.current.clear();

        try {
            // CRITICAL: First page - NO cursor
            const data = await fetchModels(undefined);
            if (!data) return;

            // Reset and populate
            const newModels = data.results || [];
            newModels.forEach(m => loadedIds.current.add(`${m.owner}/${m.name}`));
            setModels(newModels);

            // Set next cursor only if valid
            const nextPage = data.next && typeof data.next === 'string' && data.next.trim().length > 0
                ? data.next
                : null;
            setNextCursor(nextPage);
            setHasMore(!!nextPage);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load models';
            setError(message);
            setHasMore(false);
        } finally {
            setIsLoading(false);
            isRequestInFlight.current = false;
        }
    }, [fetchModels]);

    // Refresh when URL changes
    useEffect(() => {
        if (currentUrlRef.current !== fetchUrl) {
            currentUrlRef.current = fetchUrl;
            if (isDev) console.log('[useInfiniteModels] URL changed, refreshing:', fetchUrl);
        }
        refresh();
    }, [fetchUrl, refresh]);

    return {
        models,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        loadMore,
        refresh,
        totalLoaded: models.length
    };
}
