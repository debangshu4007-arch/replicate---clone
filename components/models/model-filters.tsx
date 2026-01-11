'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ModelFilters, ViewMode, ModelModality } from '@/types';
import { cn } from '@/lib/utils';
import { Search, X, LayoutGrid, List } from 'lucide-react';

interface ModelFiltersProps {
  filters: ModelFilters;
  onFiltersChange: (filters: ModelFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount?: number;
}

const MODALITIES: { value: ModelModality | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'text', label: 'Text' },
];

/**
 * Clean, minimal filter bar
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

  useEffect(() => {
    if (filters.search !== searchInput && !debounceRef.current) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onFiltersChange({ ...filters, search: value });
    }, 300);
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
    if (mode !== filters.mode) {
      onFiltersChange({ ...filters, mode, sort: mode === 'browse' ? 'newest' : 'popular' });
    }
  }, [filters, onFiltersChange]);

  const setModality = useCallback((modality: ModelModality | 'all') => {
    onFiltersChange({ ...filters, modality });
  }, [filters, onFiltersChange]);

  return (
    <div className="space-y-4">
      {/* Search + View toggle */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search models..."
            className="w-full h-10 pl-10 pr-10 text-sm rounded-lg bg-[#1a1a1a] border border-[#262626] text-[#e5e5e5] placeholder:text-[#525252] focus:border-[#404040] focus:outline-none transition-colors"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setMode('curated')}
            className={cn(
              'px-3 py-1.5 rounded-md transition-colors',
              filters.mode === 'curated'
                ? 'bg-[#262626] text-white'
                : 'text-[#737373] hover:text-white'
            )}
          >
            Featured
          </button>
          <button
            onClick={() => setMode('browse')}
            className={cn(
              'px-3 py-1.5 rounded-md transition-colors',
              filters.mode === 'browse'
                ? 'bg-[#262626] text-white'
                : 'text-[#737373] hover:text-white'
            )}
          >
            All
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-[#262626] rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'grid' ? 'bg-[#262626] text-white' : 'text-[#737373] hover:text-white'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list' ? 'bg-[#262626] text-white' : 'text-[#737373] hover:text-white'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {MODALITIES.map((m) => (
            <button
              key={m.value}
              onClick={() => setModality(m.value)}
              className={cn(
                'px-3 py-1 text-sm rounded-full transition-colors',
                filters.modality === m.value
                  ? 'bg-white text-black'
                  : 'text-[#a3a3a3] hover:text-white'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {totalCount !== undefined && filters.mode === 'curated' && (
          <span className="text-xs text-[#525252]">
            {totalCount} models
          </span>
        )}
      </div>
    </div>
  );
}
