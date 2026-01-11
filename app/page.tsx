'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Model, ModelFilters, ViewMode } from '@/types';
import { ModelFiltersBar } from '@/components/models/model-filters';
import { ModelGrid } from '@/components/models/model-grid';
import { ModelBrowser } from '@/components/models/model-browser';
import { rankModels, searchAndRankModels } from '@/lib/ranking';

interface HealthCheckResponse {
  status: 'healthy' | 'misconfigured';
  replicateConfigured: boolean;
  setupInstructions?: string[];
}

function SetupWarning({ instructions }: { instructions?: string[] }) {
  return (
    <div className="max-w-xl mx-auto border border-[#262626] bg-[#141414] rounded-lg p-6 my-8">
      <h2 className="text-lg font-semibold text-white mb-3">
        API Token Required
      </h2>
      <p className="text-[#a3a3a3] text-sm mb-4">
        Configure your Replicate API token to get started.
      </p>
      <div className="bg-[#0a0a0a] rounded p-4 font-mono text-xs space-y-1.5 text-[#a3a3a3]">
        {instructions?.map((instruction, i) => (
          <div key={i}>{instruction}</div>
        )) || (
            <>
              <div>1. Get token from <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="text-white underline">replicate.com/account/api-tokens</a></div>
              <div>2. Create <code className="bg-[#1a1a1a] px-1 rounded">.env.local</code> in project root</div>
              <div>3. Add: <code className="bg-[#1a1a1a] px-1 rounded">REPLICATE_API_TOKEN=your_token</code></div>
              <div>4. Restart dev server</div>
            </>
          )}
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

  // Load and rank models
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const healthRes = await fetch('/api/health');
        const health: HealthCheckResponse = await healthRes.json();

        if (!health.replicateConfigured) {
          setConfigError(true);
          setSetupInstructions(health.setupInstructions);
          setIsLoading(false);
          return;
        }

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
          // Apply ranking to fetched models
          const ranked = rankModels(data.results || []);
          setCuratedModels(ranked);
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

  // Filter and rank curated models
  const filteredModels = useMemo(() => {
    if (filters.mode === 'browse') return [];

    let result = curatedModels;

    // Search with ranking
    if (filters.search) {
      result = searchAndRankModels(result, filters.search);
    }

    // Modality filter
    if (filters.modality !== 'all') {
      result = result.filter(m => {
        const text = `${m.name} ${m.description || ''}`.toLowerCase();
        switch (filters.modality) {
          case 'image': return /image|photo|diffusion|stable|flux|sdxl|dalle|midjourney/.test(text);
          case 'video': return /video|animate|motion|luma|runway|kling|sora/.test(text);
          case 'audio': return /audio|music|speech|voice|sound|whisper/.test(text);
          case 'text': return /llama|gpt|text|language|chat|mistral|claude/.test(text);
          default: return true;
        }
      });
    }

    // Sort (ranking already applied, but allow override)
    if (filters.sort === 'newest' && !filters.search) {
      result = [...result].sort((a, b) => {
        const ta = a.latest_version?.created_at || '';
        const tb = b.latest_version?.created_at || '';
        return tb.localeCompare(ta);
      });
    }

    return result;
  }, [curatedModels, filters]);

  const handleFiltersChange = useCallback((newFilters: ModelFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="pt-16 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-white mb-4">
            Run AI models
          </h1>
          <p className="text-lg text-[#a3a3a3] text-balance">
            Discover and run state-of-the-art machine learning models.
            Generate images, video, audio, and text.
          </p>
        </div>
      </div>

      {/* Config error */}
      {configError && <SetupWarning instructions={setupInstructions} />}

      {/* Main content */}
      {!configError && (
        <div className="container mx-auto px-6 pb-16">
          {/* Filters */}
          <div className="mb-8">
            <ModelFiltersBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={filters.mode === 'curated' ? filteredModels.length : undefined}
            />
          </div>

          {/* Error */}
          {error && filters.mode === 'curated' && (
            <div className="text-center py-12">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-[#a3a3a3] hover:text-white"
              >
                Reload
              </button>
            </div>
          )}

          {/* Content */}
          {!error && (
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
                  <div className="mt-10 text-center">
                    <button
                      onClick={() => setFilters(f => ({ ...f, mode: 'browse' }))}
                      className="text-sm text-[#737373] hover:text-white transition-colors"
                    >
                      Browse all models →
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
