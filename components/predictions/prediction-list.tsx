'use client';

import Link from 'next/link';
import { StoredPrediction } from '@/types';
import { StatusBadge } from '@/components/ui/badge';
import { formatRelativeTime, formatDuration, inferMediaType, truncate } from '@/lib/utils';
import { Play, Trash2, Copy } from 'lucide-react';

interface PredictionListProps {
  predictions: StoredPrediction[];
  onDelete?: (localId: string) => void;
  onRerun?: (prediction: StoredPrediction) => void;
}

export function PredictionList({ predictions, onDelete, onRerun }: PredictionListProps) {
  if (predictions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4 opacity-30">◇</div>
        <p className="text-[#737373]">No predictions yet</p>
        <p className="text-sm text-[#525252] mt-1">
          Run a model to see your history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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

  const getInputSummary = () => {
    const keys = Object.keys(prediction.input);
    if (keys.length === 0) return 'No input';

    const textFields = ['prompt', 'text', 'input', 'message', 'query'];
    for (const field of textFields) {
      if (prediction.input[field] && typeof prediction.input[field] === 'string') {
        return truncate(prediction.input[field] as string, 80);
      }
    }

    return `${keys.length} parameter${keys.length === 1 ? '' : 's'}`;
  };

  return (
    <div className="bg-[#141414] rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors">
      <div className="flex gap-4">
        {/* Preview */}
        <div className="h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-[#1a1a1a]">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[#525252]">
              {prediction.status === 'succeeded' ? '✓' :
                prediction.status === 'failed' ? '✕' :
                  prediction.status === 'processing' ? '◌' : '◇'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/models/${prediction.modelOwner}/${prediction.modelName}`}
                className="font-medium text-[#e5e5e5] hover:text-white transition-colors truncate block"
              >
                {prediction.modelDisplayName || `${prediction.modelOwner}/${prediction.modelName}`}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={prediction.status} />
                <span className="text-xs text-[#525252]">
                  {formatRelativeTime(prediction.savedAt)}
                </span>
                {prediction.metrics?.predict_time && (
                  <span className="text-xs text-[#525252]">
                    • {formatDuration(prediction.metrics.predict_time)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {onRerun && (
                <button
                  onClick={() => onRerun(prediction)}
                  className="p-2 text-[#525252] hover:text-white transition-colors"
                  title="Run again"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}
              <Link
                href={`/models/${prediction.modelOwner}/${prediction.modelName}?clone=${prediction.localId}`}
                className="p-2 text-[#525252] hover:text-white transition-colors"
                title="Clone"
              >
                <Copy className="h-4 w-4" />
              </Link>
              {onDelete && (
                <button
                  onClick={() => onDelete(prediction.localId)}
                  className="p-2 text-[#525252] hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-[#525252] mt-2 line-clamp-1">
            {getInputSummary()}
          </p>
        </div>
      </div>
    </div>
  );
}
