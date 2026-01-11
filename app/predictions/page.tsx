'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StoredPrediction } from '@/types';
import { PredictionList } from '@/components/predictions/prediction-list';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Trash2 } from 'lucide-react';

export default function PredictionsPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<StoredPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/predictions?local=true');
      if (!response.ok) throw new Error('Failed to fetch predictions');

      const data = await response.json();
      setPredictions(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const handleDelete = useCallback(async (localId: string) => {
    try {
      const response = await fetch(`/api/predictions/${localId}`, { method: 'DELETE' });
      if (response.ok) {
        setPredictions((prev) => prev.filter((p) => p.localId !== localId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    if (!confirm('Clear all predictions?')) return;
    try {
      const response = await fetch('/api/predictions', { method: 'DELETE' });
      if (response.ok) setPredictions([]);
    } catch (err) {
      console.error('Clear all error:', err);
    }
  }, []);

  const handleRerun = useCallback((prediction: StoredPrediction) => {
    router.push(`/models/${prediction.modelOwner}/${prediction.modelName}?clone=${prediction.localId}`);
  }, [router]);

  // Stats
  const stats = {
    total: predictions.length,
    succeeded: predictions.filter((p) => p.status === 'succeeded').length,
    failed: predictions.filter((p) => p.status === 'failed').length,
    models: new Set(predictions.map((p) => `${p.modelOwner}/${p.modelName}`)).size,
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">History</h1>
          <p className="text-[#737373] mt-1">Your past model runs</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPredictions}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#737373] hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {predictions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#737373] hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Succeeded" value={stats.succeeded} color="text-green-400" />
          <StatCard label="Failed" value={stats.failed} color="text-red-400" />
          <StatCard label="Models" value={stats.models} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-16">
          <p className="text-[#737373] mb-4">{error}</p>
          <button onClick={fetchPredictions} className="text-sm text-[#a3a3a3] hover:text-white">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#141414] rounded-lg p-4 flex gap-4">
              <Skeleton className="h-16 w-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {!isLoading && !error && (
        <PredictionList
          predictions={predictions}
          onDelete={handleDelete}
          onRerun={handleRerun}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-[#141414] rounded-lg p-4">
      <p className="text-sm text-[#525252]">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
