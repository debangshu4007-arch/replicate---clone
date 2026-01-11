'use client';

import { useState } from 'react';
import { Prediction } from '@/types';
import { inferMediaType, formatDuration } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface PredictionOutputProps {
  prediction: Prediction;
  onRerun?: () => void;
}

export function PredictionOutput({ prediction, onRerun }: PredictionOutputProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderOutput = () => {
    if (!prediction.output) {
      return (
        <div className="text-gray-500 text-center py-8">
          No output yet
        </div>
      );
    }

    // Handle array of outputs (common for image generation)
    if (Array.isArray(prediction.output)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prediction.output.map((item, index) => (
            <OutputItem key={index} value={item} index={index} />
          ))}
        </div>
      );
    }

    // Single output
    return <OutputItem value={prediction.output} />;
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={prediction.status} />
          {prediction.metrics?.predict_time && (
            <span className="text-sm text-gray-400">
              {formatDuration(prediction.metrics.predict_time)}
            </span>
          )}
        </div>
        {onRerun && prediction.status !== 'processing' && prediction.status !== 'starting' && (
          <Button variant="outline" size="sm" onClick={onRerun}>
            Run Again
          </Button>
        )}
      </div>

      {/* Error Message */}
      {prediction.error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400 font-medium">Error</p>
          <p className="text-sm text-red-300 mt-1">{prediction.error}</p>
        </div>
      )}

      {/* Main Output */}
      {prediction.status === 'succeeded' && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Output</CardTitle>
          </CardHeader>
          <CardContent>
            {renderOutput()}
          </CardContent>
        </Card>
      )}

      {/* Input (Collapsible) */}
      <button
        onClick={() => setShowInput(!showInput)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
      >
        {showInput ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Input Parameters
      </button>
      {showInput && (
        <Card>
          <CardContent className="py-3">
            <pre className="text-xs text-gray-300 overflow-auto max-h-48 font-mono">
              {JSON.stringify(prediction.input, null, 2)}
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => handleCopy(JSON.stringify(prediction.input, null, 2))}
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Logs (Collapsible) */}
      {prediction.logs && (
        <>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
          >
            {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Logs
          </button>
          {showLogs && (
            <Card>
              <CardContent className="py-3">
                <pre className="text-xs text-gray-400 overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                  {prediction.logs}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// Render individual output items
function OutputItem({ value, index }: { value: unknown; index?: number }) {
  if (typeof value === 'string') {
    const mediaType = inferMediaType(value);

    // Image output
    if (mediaType === 'image') {
      return (
        <div className="space-y-2">
          <img
            src={value}
            alt={`Output ${index !== undefined ? index + 1 : ''}`}
            className="w-full rounded-lg"
          />
          <div className="flex gap-2">
            <a
              href={value}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <Download className="h-3 w-3" />
              Download
            </a>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </a>
          </div>
        </div>
      );
    }

    // Video output
    if (mediaType === 'video') {
      return (
        <div className="space-y-2">
          <video
            src={value}
            controls
            className="w-full rounded-lg"
          />
          <a
            href={value}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        </div>
      );
    }

    // Audio output
    if (mediaType === 'audio') {
      return (
        <div className="space-y-2">
          <audio
            src={value}
            controls
            className="w-full"
          />
          <a
            href={value}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        </div>
      );
    }

    // URL but unknown type
    if (value.startsWith('http')) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 break-all"
        >
          {value}
        </a>
      );
    }

    // Plain text
    return (
      <div className="p-4 rounded-lg bg-gray-800 text-gray-200 whitespace-pre-wrap font-mono text-sm">
        {value}
      </div>
    );
  }

  // Object/JSON output
  return (
    <pre className="p-4 rounded-lg bg-gray-800 text-gray-200 overflow-auto text-xs font-mono">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

// Loading state component
export function PredictionLoading({ status }: { status: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
      </div>
      <p className="mt-4 text-gray-400 capitalize">{status}...</p>
      <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
    </div>
  );
}
