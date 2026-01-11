'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StoredPrediction } from '@/types';
import { PredictionList } from '@/components/predictions/prediction-list';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, RefreshCw, History } from 'lucide-react';

export default function PredictionsPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<StoredPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch predictions
  const fetchPredictions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/predictions?local=true');
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const data = await response.json();
      setPredictions(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
      console.error('Error fetching predictions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Delete a prediction
  const handleDelete = useCallback(async (localId: string) => {
    try {
      const response = await fetch(`/api/predictions/${localId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPredictions((prev) => prev.filter((p) => p.localId !== localId));
      }
    } catch (err) {
      console.error('Error deleting prediction:', err);
    }
  }, []);

  // Clear all predictions
  const handleClearAll = useCallback(async () => {
    if (!confirm('Are you sure you want to clear all predictions?')) {
      return;
    }

    try {
      const response = await fetch('/api/predictions', {
        method: 'DELETE',
      });

      if (response.ok) {
        setPredictions([]);
      }
    } catch (err) {
      console.error('Error clearing predictions:', err);
    }
  }, []);

  // Rerun a prediction
  const handleRerun = useCallback(
    (prediction: StoredPrediction) => {
      router.push(
        `/models/${prediction.modelOwner}/${prediction.modelName}?clone=${prediction.localId}`
      );
    },
    [router]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8" />
            Prediction History
          </h1>
          <p className="text-gray-400 mt-2">
            View and manage your past model runs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPredictions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {predictions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Runs"
            value={predictions.length}
          />
          <StatCard
            label="Succeeded"
            value={predictions.filter((p) => p.status === 'succeeded').length}
            color="text-green-500"
          />
          <StatCard
            label="Failed"
            value={predictions.filter((p) => p.status === 'failed').length}
            color="text-red-500"
          />
          <StatCard
            label="Unique Models"
            value={new Set(predictions.map((p) => `${p.modelOwner}/${p.modelName}`)).size}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchPredictions}>Try again</Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Predictions List */}
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

// Stats card component
function StatCard({
  label,
  value,
  color = 'text-white',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
