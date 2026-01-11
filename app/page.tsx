'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Model, ModelFilters, ViewMode } from '@/types';
import { ModelFiltersBar } from '@/components/models/model-filters';
import { ModelGrid } from '@/components/models/model-grid';
import { ModelBrowser } from '@/components/models/model-browser';

interface HealthCheckResponse {
  status: 'healthy' | 'misconfigured';
  replicateConfigured: boolean;
  timestamp: string;
  message?: string;
  setupInstructions?: string[];
}

function SetupWarning({ instructions }: { instructions?: string[] }) {
  return (
    <div className="border border-yellow-800 bg-yellow-900/10 rounded-lg p-5 mb-6">
      <div className="flex gap-3">
        <span className="text-2xl">🔑</span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-yellow-400 mb-2">
            API Token Required
          </h2>
          <p className="text-yellow-200/70 text-sm mb-4">
            Configure your Replicate API token to get started.
          </p>
          <div className="bg-black/30 rounded p-3 font-mono text-xs space-y-1.5 text-yellow-100/80">
            {instructions?.map((instruction, i) => (
              <div key={i}>{instruction}</div>
            )) || (
                <>
                  <div>1. Get token from <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">replicate.com/account/api-tokens</a></div>
                  <div>2. Create <code className="bg-black/40 px-1 rounded">.env.local</code> in project root</div>
                  <div>3. Add: <code className="bg-black/40 px-1 rounded">REPLICATE_API_TOKEN=your_token</code></div>
                  <div>4. Restart dev server</div>
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [curatedModels, setCuratedModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  const [setupInstructions, setSetupInstructions] = useState<string[]>();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<ModelFilters>({
    search: '',
    modality: 'all',
    tier: 'all',
    mode: 'curated',
    sort: 'popular',
  });

  // Load curated models once
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Health check
        const healthRes = await fetch('/api/health');
        const health: HealthCheckResponse = await healthRes.json();

        if (!health.replicateConfigured) {
          setConfigError(true);
          setSetupInstructions(health.setupInstructions);
          setIsLoading(false);
          return;
        }

        // Fetch featured models
        const modelsRes = await fetch('/api/models?featured=true');
        const data = await modelsRes.json();

        if (!modelsRes.ok) {
          if (data.code === 'MISSING_API_TOKEN') {
            setConfigError(true);
            return;
          }
          throw new Error(data.error || 'Failed to load models');
        }

        if (!cancelled) {
          setCuratedModels(data.results || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load models');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Filter curated models (client-side)
  const filteredModels = useMemo(() => {
    if (filters.mode === 'browse') return [];

    let result = [...curatedModels];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.owner.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
      );
    }

    // Modality
    if (filters.modality !== 'all') {
      result = result.filter(m => {
        const text = `${m.name} ${m.description || ''}`.toLowerCase();
        switch (filters.modality) {
          case 'image': return /image|photo|diffusion|stable|flux|sdxl/.test(text);
          case 'video': return /video|animate/.test(text);
          case 'audio': return /audio|music|speech|voice/.test(text);
          case 'text': return /llama|gpt|text|language|chat/.test(text);
          default: return true;
        }
      });
    }

    // Sort
    if (filters.sort === 'newest') {
      result.sort((a, b) => {
        const ta = a.latest_version?.created_at || '';
        const tb = b.latest_version?.created_at || '';
        return tb.localeCompare(ta);
      });
    } else {
      result.sort((a, b) => (b.run_count || 0) - (a.run_count || 0));
    }

    return result;
  }, [curatedModels, filters]);

  const handleFiltersChange = useCallback((newFilters: ModelFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">
          Run AI Models in <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Seconds</span>
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Browse and run state-of-the-art ML models. Generate images, video, audio, and text.
        </p>
      </div>

      {/* Config error */}
      {configError && <SetupWarning instructions={setupInstructions} />}

      {/* Filters */}
      {!configError && (
        <div className="mb-6">
          <ModelFiltersBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={filters.mode === 'curated' ? filteredModels.length : undefined}
          />
        </div>
      )}

      {/* Error (non-config) */}
      {error && !configError && filters.mode === 'curated' && (
        <div className="text-center py-12">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-blue-400 hover:underline"
          >
            Reload
          </button>
        </div>
      )}

      {/* Content */}
      {!configError && (
        filters.mode === 'browse' ? (
          <ModelBrowser filters={filters} viewMode={viewMode} />
        ) : (
          <>
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
            {!isLoading && filteredModels.length > 0 && (
              <div className="mt-6 text-center">
                <span className="text-xs text-gray-600">
                  {filteredModels.length} featured models.{' '}
                  <button
                    onClick={() => setFilters(f => ({ ...f, mode: 'browse' }))}
                    className="text-blue-400 hover:underline"
                  >
                    Browse all →
                  </button>
                </span>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
