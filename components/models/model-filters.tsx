'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ModelFilters, ViewMode, ModelModality } from '@/types';
import { cn } from '@/lib/utils';
import { Search, Grid, List, X } from 'lucide-react';

interface ModelFiltersProps {
  filters: ModelFilters;
  onFiltersChange: (filters: ModelFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount?: number;
}

const MODALITY_OPTIONS: { value: ModelModality | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'text', label: 'Text' },
];

/**
 * Model filter bar - search, mode toggle, view toggle, filters
 * Search properly debounced with cleanup
 */
export function ModelFiltersBar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  totalCount,
}: ModelFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external changes
  useEffect(() => {
    if (filters.search !== searchInput && !debounceRef.current) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce by 350ms
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onFiltersChange({ ...filters, search: value });
    }, 350);
  }, [filters, onFiltersChange]);

  const clearSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setSearchInput('');
    onFiltersChange({ ...filters, search: '' });
  }, [filters, onFiltersChange]);

  const setMode = useCallback((mode: 'curated' | 'browse') => {
    if (mode === filters.mode) return;
    onFiltersChange({
      ...filters,
      mode,
      sort: mode === 'browse' ? 'newest' : 'popular',
    });
  }, [filters, onFiltersChange]);

  const setModality = useCallback((modality: ModelModality | 'all') => {
    onFiltersChange({ ...filters, modality });
  }, [filters, onFiltersChange]);

  const setSort = useCallback((sort: 'newest' | 'popular') => {
    onFiltersChange({ ...filters, sort });
  }, [filters, onFiltersChange]);

  const hasFilters = searchInput || filters.modality !== 'all';

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={filters.mode === 'curated' ? 'Search featured...' : 'Search models...'}
            className="w-full h-9 pl-9 pr-8 text-sm rounded-md border border-gray-800 bg-gray-900 text-white placeholder:text-gray-600 focus:border-gray-600 focus:outline-none transition-colors"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-md p-0.5">
            <button
              onClick={() => setMode('curated')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded transition-colors',
                filters.mode === 'curated'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-white'
              )}
            >
              Featured
            </button>
            <button
              onClick={() => setMode('browse')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded transition-colors',
                filters.mode === 'browse'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-white'
              )}
            >
              All
            </button>
          </div>

          {/* Sort */}
          <select
            value={filters.sort || 'popular'}
            onChange={(e) => setSort(e.target.value as 'newest' | 'popular')}
            className="h-8 text-xs bg-gray-900 border border-gray-800 text-gray-400 rounded-md px-2 focus:outline-none focus:border-gray-600"
          >
            <option value="popular">Popular</option>
            <option value="newest">Newest</option>
          </select>

          {/* View toggle */}
          <div className="flex border border-gray-800 rounded-md overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 transition-colors',
                viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 transition-colors',
                viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Modality pills */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {MODALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setModality(opt.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                filters.modality === opt.value
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600 hover:text-white'
              )}
            >
              {opt.label}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => {
                clearSearch();
                onFiltersChange({ ...filters, search: '', modality: 'all' });
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-white flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Count */}
        {totalCount !== undefined && filters.mode === 'curated' && (
          <span className="text-xs text-gray-600">
            {totalCount} models
          </span>
        )}
      </div>
    </div>
  );
}
