'use client';

import { useState, useEffect, useCallback } from 'react';
import { Model, ModelFilters, ViewMode } from '@/types';
import { ModelFiltersBar } from '@/components/models/model-filters';
import { ModelGrid } from '@/components/models/model-grid';
import { SkeletonModelGrid } from '@/components/ui/skeleton';

export default function HomePage() {
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<ModelFilters>({
    search: '',
    modality: 'all',
    tier: 'all',
  });

  // Fetch models on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/models?featured=true');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        
        const data = await response.json();
        setModels(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
        console.error('Error fetching models:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...models];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(searchLower) ||
          model.owner.toLowerCase().includes(searchLower) ||
          model.description?.toLowerCase().includes(searchLower)
      );
    }

    // Modality filter (basic heuristic based on model name/description)
    if (filters.modality !== 'all') {
      result = result.filter((model) => {
        const combined = `${model.name} ${model.description || ''}`.toLowerCase();
        switch (filters.modality) {
          case 'image':
            return combined.includes('image') || combined.includes('photo') || 
                   combined.includes('diffusion') || combined.includes('stable') ||
                   combined.includes('flux') || combined.includes('sdxl');
          case 'video':
            return combined.includes('video') || combined.includes('animate');
          case 'audio':
            return combined.includes('audio') || combined.includes('music') || 
                   combined.includes('speech') || combined.includes('voice');
          case 'text':
            return combined.includes('llama') || combined.includes('gpt') ||
                   combined.includes('text') || combined.includes('language') ||
                   combined.includes('chat');
          default:
            return true;
        }
      });
    }

    setFilteredModels(result);
  }, [models, filters]);

  const handleFiltersChange = useCallback((newFilters: ModelFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Run AI Models in{' '}
          <span className="gradient-text">Seconds</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Browse and run state-of-the-art machine learning models. Generate images, 
          videos, audio, and text using the latest AI technology.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ModelFiltersBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={filteredModels.length}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-400 hover:text-blue-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* Model Grid */}
      {!error && (
        <ModelGrid
          models={filteredModels}
          viewMode={viewMode}
          isLoading={isLoading}
          emptyMessage={
            filters.search || filters.modality !== 'all'
              ? 'No models match your filters'
              : 'No models available'
          }
        />
      )}

      {/* Load More hint */}
      {!isLoading && filteredModels.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {filteredModels.length} models
        </div>
      )}
    </div>
  );
}
