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
import {
  getReplicateToken,
  ConfigurationError,
  REPLICATE_TOKEN_ERROR,
  ERROR_CODE_MISSING_TOKEN,
} from './config';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

// Rate limiting config
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_RETRY_DELAY_MS = 5000;

/**
 * Generic fetch wrapper with retry logic and error handling
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  const token = getReplicateToken();

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
 * List all public models with cursor-based pagination
 * 
 * IMPORTANT: This is the ONLY way to browse all models on Replicate.
 * One API call does NOT return all models - you must paginate.
 * 
 * @param cursor - Opaque cursor from previous response's `next` field
 * @param sortBy - Sort field: 'model_created_at' or 'latest_version_created_at' (default)
 * @param sortDirection - 'asc' or 'desc' (default)
 */
export async function listModels(
  cursor?: string,
  sortBy?: 'model_created_at' | 'latest_version_created_at',
  sortDirection?: 'asc' | 'desc'
): Promise<ModelListResponse> {
  const url = new URL(`${REPLICATE_API_BASE}/models`);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  if (sortBy) {
    url.searchParams.set('sort_by', sortBy);
  }
  if (sortDirection) {
    url.searchParams.set('sort_direction', sortDirection);
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
 * ============================================================================
 * REPLICATE API SEARCH LIMITATIONS (Important to understand)
 * ============================================================================
 * 
 * The Replicate API has TWO different ways to discover models:
 * 
 * 1. GET /v1/models - List all public models
 *    - Returns ~100 models per page (cursor-paginated)
 *    - No search/filter capability - returns ALL models
 *    - Use `cursor` param to paginate through thousands of models
 *    - Can sort by `sort_by` (model_created_at, latest_version_created_at)
 *    - Use for: "Browse All Models" with infinite scroll
 * 
 * 2. QUERY /v1/models - Search public models (uses HTTP QUERY method)
 *    - Returns models matching a text query
 *    - Limited to 1-50 results (default 20)
 *    - NO cursor pagination - single page of results
 *    - Use for: Quick search by owner/name
 * 
 * 3. GET /v1/search - Universal search (beta)
 *    - Searches models, collections, and docs
 *    - Limited to 1-50 model results
 *    - Returns enhanced metadata (tags, AI-generated descriptions)
 *    - Use for: Rich search experience
 * 
 * RATE LIMITS:
 * - Replicate has undisclosed rate limits
 * - We implement retry logic with backoff
 * - Avoid rapid sequential calls when paginating
 * 
 * ============================================================================
 */

/**
 * Search models using Replicate's native QUERY API
 * 
 * IMPORTANT: This uses the HTTP QUERY method (not GET or POST)
 * The query is sent as plain text in the request body.
 * 
 * Limitations:
 * - Maximum 50 results per call
 * - No cursor pagination for search results
 * - For browsing all models, use listModels() with cursor pagination instead
 * 
 * @param query - Search term (matches owner, name, description)
 * @param limit - Max results (1-50, default 20)
 */
export async function searchModelsAPI(
  query: string,
  limit: number = 20
): Promise<ModelListResponse> {
  const token = getReplicateToken();

  // Validate limit
  const validLimit = Math.min(50, Math.max(1, limit));

  const url = new URL(`${REPLICATE_API_BASE}/models`);
  url.searchParams.set('limit', validLimit.toString());

  // QUERY method with plain text body
  const response = await fetch(url.toString(), {
    method: 'QUERY',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: query,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new ReplicateError(
      `Search failed: ${errorBody || response.statusText}`,
      response.status
    );
  }

  return response.json();
}

/**
 * Search models using the universal search API (beta)
 * 
 * This endpoint provides richer results with AI-generated descriptions
 * and relevance scoring, but is marked as beta and may change.
 * 
 * @param query - Search query string
 * @param limit - Max results (1-50, default 20)
 */
export async function universalSearch(
  query: string,
  limit: number = 20
): Promise<{
  models: Array<Model & {
    metadata?: {
      generated_description?: string;
      tags?: string[];
      score?: number;
    };
  }>;
  collections?: Array<{ name: string; slug: string; description: string }>;
}> {
  const validLimit = Math.min(50, Math.max(1, limit));
  const url = new URL(`${REPLICATE_API_BASE}/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('limit', validLimit.toString());

  return fetchWithRetry(url.toString());
}

/**
 * Legacy local search (fallback when API search fails)
 * 
 * Note: This only searches models from a single page of results.
 * For comprehensive search, use searchModelsAPI() instead.
 */
export async function searchModelsLocal(query: string): Promise<Model[]> {
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
