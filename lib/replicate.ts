/**
 * Replicate API client
 * 
 * Server-side only - handles all communication with Replicate API
 * Includes rate limiting awareness, retry logic, and error handling
 */

import {
  Model,
  ModelVersion,
  Prediction,
  ModelListResponse,
  OpenAPISchema,
} from '@/types';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

// Rate limiting config
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_RETRY_DELAY_MS = 5000;

/**
 * Get API token from environment
 * Throws if not configured
 */
function getApiToken(): string {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error(
      'REPLICATE_API_TOKEN is not configured. Please add it to your .env file.'
    );
  }
  return token;
}

/**
 * Generic fetch wrapper with retry logic and error handling
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  const token = getApiToken();
  
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // Handle rate limiting
      if (response.status === 429) {
        if (attempt < retries) {
          console.warn(`Rate limited, retrying in ${RATE_LIMIT_RETRY_DELAY_MS}ms...`);
          await sleep(RATE_LIMIT_RETRY_DELAY_MS);
          continue;
        }
        throw new ReplicateError('Rate limit exceeded. Please try again later.', 429);
      }

      // Handle other errors
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage: string;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.detail || errorJson.error || errorBody;
        } catch {
          errorMessage = errorBody || `HTTP ${response.status}`;
        }
        throw new ReplicateError(errorMessage, response.status);
      }

      return await response.json();
    } catch (error) {
      // Don't retry for non-retryable errors
      if (error instanceof ReplicateError && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // Retry for network errors and 5xx
      if (attempt < retries) {
        console.warn(`Request failed, retrying (${attempt + 1}/${retries})...`);
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      throw error;
    }
  }

  throw new ReplicateError('Max retries exceeded', 500);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Custom error class for Replicate API errors
 */
export class ReplicateError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ReplicateError';
  }
}

// ============================================================================
// MODEL ENDPOINTS
// ============================================================================

/**
 * List all public models with pagination
 */
export async function listModels(cursor?: string): Promise<ModelListResponse> {
  const url = new URL(`${REPLICATE_API_BASE}/models`);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  return fetchWithRetry<ModelListResponse>(url.toString());
}

/**
 * Get a specific model by owner and name
 */
export async function getModel(owner: string, name: string): Promise<Model> {
  return fetchWithRetry<Model>(
    `${REPLICATE_API_BASE}/models/${owner}/${name}`
  );
}

/**
 * Get model versions
 */
export async function getModelVersions(
  owner: string,
  name: string
): Promise<{ results: ModelVersion[] }> {
  return fetchWithRetry<{ results: ModelVersion[] }>(
    `${REPLICATE_API_BASE}/models/${owner}/${name}/versions`
  );
}

/**
 * Get a specific model version
 */
export async function getModelVersion(
  owner: string,
  name: string,
  versionId: string
): Promise<ModelVersion> {
  return fetchWithRetry<ModelVersion>(
    `${REPLICATE_API_BASE}/models/${owner}/${name}/versions/${versionId}`
  );
}

/**
 * Search models by query
 * Note: Replicate doesn't have a direct search API, so we fetch and filter locally
 * For production, you'd want to implement server-side caching
 */
export async function searchModels(query: string): Promise<Model[]> {
  const response = await listModels();
  const lowerQuery = query.toLowerCase();
  
  return response.results.filter(model => 
    model.name.toLowerCase().includes(lowerQuery) ||
    model.owner.toLowerCase().includes(lowerQuery) ||
    model.description?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// PREDICTION ENDPOINTS
// ============================================================================

/**
 * Create a new prediction
 */
export async function createPrediction(
  version: string,
  input: Record<string, unknown>,
  webhook?: string
): Promise<Prediction> {
  return fetchWithRetry<Prediction>(
    `${REPLICATE_API_BASE}/predictions`,
    {
      method: 'POST',
      body: JSON.stringify({
        version,
        input,
        webhook,
      }),
    }
  );
}

/**
 * Create prediction using model identifier (owner/name)
 * Uses the official model endpoint which automatically uses latest version
 */
export async function createPredictionForModel(
  owner: string,
  name: string,
  input: Record<string, unknown>
): Promise<Prediction> {
  return fetchWithRetry<Prediction>(
    `${REPLICATE_API_BASE}/models/${owner}/${name}/predictions`,
    {
      method: 'POST',
      body: JSON.stringify({ input }),
    }
  );
}

/**
 * Get prediction status and results
 */
export async function getPrediction(id: string): Promise<Prediction> {
  return fetchWithRetry<Prediction>(
    `${REPLICATE_API_BASE}/predictions/${id}`
  );
}

/**
 * Cancel a running prediction
 */
export async function cancelPrediction(id: string): Promise<Prediction> {
  return fetchWithRetry<Prediction>(
    `${REPLICATE_API_BASE}/predictions/${id}/cancel`,
    { method: 'POST' }
  );
}

/**
 * List recent predictions
 */
export async function listPredictions(cursor?: string): Promise<{
  results: Prediction[];
  next?: string;
}> {
  const url = new URL(`${REPLICATE_API_BASE}/predictions`);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  return fetchWithRetry<{ results: Prediction[]; next?: string }>(url.toString());
}

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

/**
 * Extract input schema from model version's OpenAPI schema
 */
export function extractInputSchema(schema?: OpenAPISchema): Record<string, unknown> | null {
  if (!schema?.components?.schemas?.Input) {
    return null;
  }
  return schema.components.schemas.Input as Record<string, unknown>;
}

/**
 * Extract output schema from model version's OpenAPI schema
 */
export function extractOutputSchema(schema?: OpenAPISchema): Record<string, unknown> | null {
  if (!schema?.components?.schemas?.Output) {
    return null;
  }
  return schema.components.schemas.Output as Record<string, unknown>;
}

// ============================================================================
// COLLECTION HELPERS (for fetching frontier/premiere models)
// ============================================================================

/**
 * Fetch models from a collection
 * Collections include: 'language-models', 'image-models', etc.
 */
export async function getCollection(slug: string): Promise<{
  name: string;
  slug: string;
  description: string;
  models: Model[];
}> {
  return fetchWithRetry(
    `${REPLICATE_API_BASE}/collections/${slug}`
  );
}

/**
 * List available collections
 */
export async function listCollections(): Promise<{
  results: { name: string; slug: string; description: string }[];
}> {
  return fetchWithRetry(`${REPLICATE_API_BASE}/collections`);
}

// ============================================================================
// HARDWARE INFO
// ============================================================================

export interface Hardware {
  name: string;
  sku: string;
}

export async function listHardware(): Promise<Hardware[]> {
  return fetchWithRetry<Hardware[]>(`${REPLICATE_API_BASE}/hardware`);
}
