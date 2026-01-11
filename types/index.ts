/**
 * Core type definitions for the Replicate clone platform
 * These types mirror Replicate's API structure while adding local extensions
 */

// ============================================================================
// MODEL TYPES
// ============================================================================

export interface ModelOwner {
  username: string;
  name?: string;
  avatar_url?: string;
}

export interface ModelVersion {
  id: string;
  created_at: string;
  cog_version?: string;
  openapi_schema?: OpenAPISchema;
}

export interface Model {
  url: string;
  owner: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  github_url?: string;
  paper_url?: string;
  license_url?: string;
  run_count?: number;
  cover_image_url?: string;
  default_example?: PredictionExample;
  latest_version?: ModelVersion;
}

export interface ModelWithDetails extends Model {
  versions?: ModelVersion[];
}

// ============================================================================
// OPENAPI SCHEMA TYPES (for dynamic form generation)
// ============================================================================

export interface OpenAPISchema {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
  };
  components?: {
    schemas?: {
      Input?: JSONSchema;
      Output?: JSONSchema;
      [key: string]: JSONSchema | undefined;
    };
  };
}

export interface JSONSchema {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  items?: JSONSchema;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  $ref?: string;
  'x-order'?: number;
}

// ============================================================================
// PREDICTION TYPES
// ============================================================================

export type PredictionStatus = 
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface Prediction {
  id: string;
  version: string;
  model?: string;
  status: PredictionStatus;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string | null;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  urls?: {
    cancel?: string;
    get?: string;
    stream?: string;
  };
}

export interface PredictionExample {
  input: Record<string, unknown>;
  output: unknown;
}

// ============================================================================
// LOCAL STORAGE TYPES (for prediction history)
// ============================================================================

export interface StoredPrediction extends Prediction {
  modelOwner: string;
  modelName: string;
  modelDisplayName?: string;
  localId: string;
  savedAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ModelListResponse {
  results: Model[];
  next?: string;
  previous?: string;
}

export interface PredictionListResponse {
  results: Prediction[];
  next?: string;
  previous?: string;
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export type ModelModality = 'image' | 'video' | 'audio' | 'text' | 'multimodal';
export type ModelTier = 'all' | 'frontier' | 'premiere' | 'community';

export interface ModelFilters {
  search: string;
  modality: ModelModality | 'all';
  tier: ModelTier;
}

// ============================================================================
// FORM FIELD TYPES (for dynamic form generation)
// ============================================================================

export type FormFieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'slider'
  | 'select'
  | 'boolean'
  | 'file'
  | 'array'
  | 'json';

export interface FormField {
  name: string;
  type: FormFieldType;
  label: string;
  description?: string;
  required: boolean;
  default?: unknown;
  options?: { label: string; value: unknown }[];
  min?: number;
  max?: number;
  step?: number;
  accept?: string; // for file inputs
  schema?: JSONSchema; // original schema for reference
  order?: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export type ViewMode = 'grid' | 'list';
