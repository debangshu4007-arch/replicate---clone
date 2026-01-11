'use client';

import Link from 'next/link';
import { StoredPrediction } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime, formatDuration, inferMediaType, truncate } from '@/lib/utils';
import { Play, Trash2, Copy, ExternalLink } from 'lucide-react';

interface PredictionListProps {
  predictions: StoredPrediction[];
  onDelete?: (localId: string) => void;
  onRerun?: (prediction: StoredPrediction) => void;
}

export function PredictionList({
  predictions,
  onDelete,
  onRerun,
}: PredictionListProps) {
  if (predictions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-gray-400">No predictions yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Run a model to see your prediction history here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {predictions.map((prediction) => (
        <PredictionListItem
          key={prediction.localId}
          prediction={prediction}
          onDelete={onDelete}
          onRerun={onRerun}
        />
      ))}
    </div>
  );
}

interface PredictionListItemProps {
  prediction: StoredPrediction;
  onDelete?: (localId: string) => void;
  onRerun?: (prediction: StoredPrediction) => void;
}

function PredictionListItem({ prediction, onDelete, onRerun }: PredictionListItemProps) {
  const hasOutput = prediction.output && prediction.status === 'succeeded';
  
  // Get preview image if output is image
  const getPreviewUrl = () => {
    if (!prediction.output) return null;
    
    if (Array.isArray(prediction.output)) {
      const firstImage = prediction.output.find(
        (item) => typeof item === 'string' && inferMediaType(item) === 'image'
      );
      return firstImage as string | undefined;
    }
    
    if (typeof prediction.output === 'string' && inferMediaType(prediction.output) === 'image') {
      return prediction.output;
    }
    
    return null;
  };

  const previewUrl = getPreviewUrl();

  // Get a summary of the input
  const getInputSummary = () => {
    const keys = Object.keys(prediction.input);
    if (keys.length === 0) return 'No input';
    
    // Try to find a "prompt" or similar text field
    const textFields = ['prompt', 'text', 'input', 'message', 'query'];
    for (const field of textFields) {
      if (prediction.input[field] && typeof prediction.input[field] === 'string') {
        return truncate(prediction.input[field] as string, 100);
      }
    }
    
    return `${keys.length} parameter${keys.length === 1 ? '' : 's'}`;
  };

  return (
    <Card className="hover:bg-gray-800/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Preview thumbnail */}
          <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-gray-800 overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Output preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl">
                {prediction.status === 'succeeded' ? '✅' : 
                 prediction.status === 'failed' ? '❌' : 
                 prediction.status === 'processing' ? '⏳' : '📦'}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link 
                  href={`/models/${prediction.modelOwner}/${prediction.modelName}`}
                  className="font-medium text-white hover:text-blue-400 transition-colors"
                >
                  {prediction.modelDisplayName || `${prediction.modelOwner}/${prediction.modelName}`}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={prediction.status} />
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(prediction.savedAt)}
                  </span>
                  {prediction.metrics?.predict_time && (
                    <span className="text-xs text-gray-500">
                      • {formatDuration(prediction.metrics.predict_time)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {onRerun && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRerun(prediction)}
                    title="Run again with same inputs"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Link href={`/models/${prediction.modelOwner}/${prediction.modelName}?clone=${prediction.localId}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Clone and edit"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </Link>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(prediction.localId)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Input summary */}
            <p className="text-sm text-gray-400 mt-2 line-clamp-2">
              {getInputSummary()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
