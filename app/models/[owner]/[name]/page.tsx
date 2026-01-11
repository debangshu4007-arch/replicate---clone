'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Model, ModelVersion, Prediction, JSONSchema, StoredPrediction } from '@/types';
import { extractInputSchema } from '@/lib/replicate';
import { PredictionForm } from '@/components/predictions/prediction-form';
import { PredictionOutput, PredictionLoading } from '@/components/predictions/prediction-output';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonForm } from '@/components/ui/skeleton';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import {
  ArrowLeft,
  Github,
  ExternalLink,
  Play,
  User,
  Clock,
  Hash,
} from 'lucide-react';

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
  const [versions, setVersions] = useState<ModelVersion[]>([]);
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
        setVersions(data.versions || []);

        if (data.latest_version?.openapi_schema) {
          const schema = extractInputSchema(data.latest_version.openapi_schema);
          setInputSchema(schema as JSONSchema);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model');
        console.error('Error fetching model:', err);
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
          body: JSON.stringify({
            modelOwner: owner,
            modelName: name,
            input,
          }),
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <SkeletonForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !model) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to models
        </Link>
        <div className="text-center py-12">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Model Not Found</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link href="/">
            <Button>Browse Models</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to models
      </Link>

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">{model?.name}</h1>
            <div className="flex items-center gap-3 text-gray-400">
              <Link
                href={`https://replicate.com/${owner}`}
                target="_blank"
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <User className="h-4 w-4" />
                {owner}
              </Link>
              {model?.run_count && (
                <span className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  {formatNumber(model.run_count)} runs
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {model?.github_url && (
              <a href={model.github_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
              </a>
            )}
            <a
              href={`https://replicate.com/${owner}/${name}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Replicate
              </Button>
            </a>
          </div>
        </div>

        {model?.description && (
          <p className="text-gray-400 mt-4 max-w-3xl">{model.description}</p>
        )}

        {model?.latest_version && (
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {model.latest_version.id.slice(0, 12)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(model.latest_version.created_at)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure the model parameters and run</CardDescription>
          </CardHeader>
          <CardContent>
            <PredictionForm
              schema={inputSchema}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              initialValues={initialValues}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              {prediction ? `Prediction ${prediction.id.slice(0, 8)}` : 'Run the model to see results'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prediction ? (
              prediction.status === 'starting' || prediction.status === 'processing' ? (
                <PredictionLoading status={prediction.status} />
              ) : (
                <PredictionOutput prediction={prediction} onRerun={handleRerun} />
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">🎯</div>
                <p>Configure your inputs and click "Run Model"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      { model?.default_example?.output !== undefined && model?.default_example?.output !== null && !prediction && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Example Output</CardTitle>
            <CardDescription>Sample output from this model</CardDescription>
          </CardHeader>
          <CardContent>
            <ExampleOutput output={model.default_example.output} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExampleOutput({ output }: { output: unknown }) {
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

function ExampleOutputItem({ value }: { value: unknown }) {
  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
    return <img src={value} alt="Example output" className="rounded-lg w-full" />;
  }

  return (
    <pre className="text-xs text-gray-400 overflow-auto max-h-32">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
