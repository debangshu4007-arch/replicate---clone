'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Model, ModelVersion, Prediction, JSONSchema, StoredPrediction } from '@/types';
import { extractInputSchema } from '@/lib/replicate';
import { PredictionForm } from '@/components/predictions/prediction-form';
import { PredictionOutput, PredictionLoading } from '@/components/predictions/prediction-output';
import { Skeleton, SkeletonForm } from '@/components/ui/skeleton';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import { ArrowLeft, ExternalLink, Play } from 'lucide-react';

interface PageProps {
  params: Promise<{
    owner: string;
    name: string;
  }>;
}

export default function ModelDetailPage({ params }: PageProps) {
  const { owner, name } = use(params);
  const searchParams = useSearchParams();
  const cloneId = searchParams.get('clone');

  const [model, setModel] = useState<Model | null>(null);
  const [inputSchema, setInputSchema] = useState<JSONSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    async function fetchModel() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/models/${owner}/${name}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch model');
        }

        const data = await response.json();
        setModel(data);

        if (data.latest_version?.openapi_schema) {
          const schema = extractInputSchema(data.latest_version.openapi_schema);
          setInputSchema(schema as JSONSchema);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model');
      } finally {
        setIsLoading(false);
      }
    }

    fetchModel();
  }, [owner, name]);

  useEffect(() => {
    if (cloneId) {
      async function fetchPredictionToClone() {
        try {
          const response = await fetch(`/api/predictions?local=true`);
          if (response.ok) {
            const data = await response.json();
            const prediction = data.results?.find(
              (p: StoredPrediction) => p.localId === cloneId
            );
            if (prediction) {
              setInitialValues(prediction.input);
            }
          }
        } catch (err) {
          console.error('Failed to load prediction to clone:', err);
        }
      }
      fetchPredictionToClone();
    }
  }, [cloneId]);

  const handleSubmit = useCallback(
    async (input: Record<string, unknown>) => {
      try {
        setIsSubmitting(true);
        setPrediction(null);

        const response = await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelOwner: owner, modelName: name, input }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create prediction');
        }

        const data = await response.json();
        setPrediction(data);
        pollPrediction(data.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to run model');
      } finally {
        setIsSubmitting(false);
      }
    },
    [owner, name]
  );

  const pollPrediction = useCallback(async (predictionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/predictions/${predictionId}`);
        if (!response.ok) return;

        const data = await response.json();
        setPrediction(data);

        if (data.status === 'starting' || data.status === 'processing') {
          setTimeout(poll, 1000);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };
    poll();
  }, []);

  const handleRerun = useCallback(() => {
    if (prediction?.input) {
      handleSubmit(prediction.input);
    }
  }, [prediction, handleSubmit]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#141414] rounded-lg p-6">
            <SkeletonForm />
          </div>
          <div className="bg-[#141414] rounded-lg p-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !model) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[#737373] hover:text-white mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold mb-2">Model not found</h1>
          <p className="text-[#737373] mb-6">{error}</p>
          <Link href="/" className="text-sm text-[#a3a3a3] hover:text-white">
            Browse models →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-2 text-[#737373] hover:text-white mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">
              {model?.name}
            </h1>
            <div className="flex items-center gap-4 text-[#737373]">
              <span>{owner}</span>
              {model?.run_count && (
                <span className="flex items-center gap-1 text-sm">
                  <Play className="h-3 w-3" />
                  {formatNumber(model.run_count)} runs
                </span>
              )}
            </div>
          </div>

          <a
            href={`https://replicate.com/${owner}/${name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#737373] hover:text-white transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Replicate
          </a>
        </div>

        {model?.description && (
          <p className="text-[#a3a3a3] mt-4 max-w-2xl leading-relaxed">
            {model.description}
          </p>
        )}

        {model?.latest_version && (
          <p className="text-sm text-[#525252] mt-3">
            Updated {formatRelativeTime(model.latest_version.created_at)}
          </p>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="bg-[#141414] rounded-lg p-6">
          <h2 className="text-lg font-medium text-white mb-1">Input</h2>
          <p className="text-sm text-[#525252] mb-6">Configure parameters and run</p>
          <PredictionForm
            schema={inputSchema}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            initialValues={initialValues}
          />
        </div>

        {/* Output */}
        <div className="bg-[#141414] rounded-lg p-6">
          <h2 className="text-lg font-medium text-white mb-1">Output</h2>
          <p className="text-sm text-[#525252] mb-6">
            {prediction ? `ID: ${prediction.id.slice(0, 8)}` : 'Run the model to see results'}
          </p>

          {prediction ? (
            prediction.status === 'starting' || prediction.status === 'processing' ? (
              <PredictionLoading status={prediction.status} />
            ) : (
              <PredictionOutput prediction={prediction} onRerun={handleRerun} />
            )
          ) : (
            <div className="text-center py-16 text-[#525252]">
              <div className="text-4xl mb-4 opacity-30">◇</div>
              <p className="text-sm">Configure inputs and run</p>
            </div>
          )}
        </div>
      </div>

      {/* Example output */}
      {model?.default_example?.output && !prediction && (
        <div className="mt-10 bg-[#141414] rounded-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">Example Output</h2>
          <ExampleOutput output={model.default_example.output} />
        </div>
      )}
    </div>
  );
}

function ExampleOutput({ output }: { output: unknown }): React.ReactNode {
  if (!output) return null;

  if (Array.isArray(output)) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {output.slice(0, 4).map((item, i) => (
          <ExampleOutputItem key={i} value={item} />
        ))}
      </div>
    );
  }

  return <ExampleOutputItem value={output} />;
}

function ExampleOutputItem({ value }: { value: unknown }): React.ReactNode {
  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
    return <img src={value} alt="" className="rounded-lg w-full" />;
  }

  return (
    <pre className="text-xs text-[#525252] overflow-auto max-h-32">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

