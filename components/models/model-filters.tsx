'use client';

import { useState, useCallback } from 'react';
import { ModelFilters, ViewMode, ModelModality, ModelTier } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Grid, List, X, Image, Video, Music, Type, Sparkles } from 'lucide-react';

interface ModelFiltersProps {
  filters: ModelFilters;
  onFiltersChange: (filters: ModelFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount?: number;
}

const modalityOptions: { value: ModelModality | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
  { value: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { value: 'audio', label: 'Audio', icon: <Music className="h-4 w-4" /> },
  { value: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
];

export function ModelFiltersBar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  totalCount,
}: ModelFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      // Debounce search updates
      const timeout = setTimeout(() => {
        onFiltersChange({ ...filters, search: value });
      }, 300);
      return () => clearTimeout(timeout);
    },
    [filters, onFiltersChange]
  );

  const handleModalityChange = (modality: ModelModality | 'all') => {
    onFiltersChange({ ...filters, modality });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({ search: '', modality: 'all', tier: 'all' });
  };

  const hasActiveFilters = filters.search || filters.modality !== 'all' || filters.tier !== 'all';

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search models by name, owner, or description..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        <div className="flex items-center border border-gray-700 rounded-lg">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-2 rounded-l-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-2 rounded-r-lg transition-colors',
              viewMode === 'list'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modality Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {modalityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleModalityChange(option.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filters.modality === option.value
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}

        {totalCount !== undefined && (
          <span className="ml-auto text-sm text-gray-500">
            {totalCount} model{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
