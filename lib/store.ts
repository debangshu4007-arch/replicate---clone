/**
 * In-memory store for prediction history
 * 
 * This provides local persistence during the session.
 * For production, this would be replaced with a proper database.
 * The store is serialized to localStorage on the client side.
 */

import { StoredPrediction, Prediction } from '@/types';

// In-memory store for server-side operations
const predictions = new Map<string, StoredPrediction>();

/**
 * Generate a unique local ID
 */
function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Store a new prediction
 */
export function storePrediction(
  prediction: Prediction,
  modelOwner: string,
  modelName: string,
  modelDisplayName?: string
): StoredPrediction {
  const stored: StoredPrediction = {
    ...prediction,
    modelOwner,
    modelName,
    modelDisplayName,
    localId: generateLocalId(),
    savedAt: new Date().toISOString(),
  };

  predictions.set(stored.localId, stored);
  return stored;
}

/**
 * Update an existing stored prediction
 */
export function updateStoredPrediction(
  localId: string,
  update: Partial<Prediction>
): StoredPrediction | null {
  const existing = predictions.get(localId);
  if (!existing) return null;

  const updated: StoredPrediction = {
    ...existing,
    ...update,
  };

  predictions.set(localId, updated);
  return updated;
}

/**
 * Get a stored prediction by local ID
 */
export function getStoredPrediction(localId: string): StoredPrediction | null {
  return predictions.get(localId) || null;
}

/**
 * Get a stored prediction by Replicate prediction ID
 */
export function getStoredPredictionByReplicateId(
  replicateId: string
): StoredPrediction | null {
  for (const prediction of predictions.values()) {
    if (prediction.id === replicateId) {
      return prediction;
    }
  }
  return null;
}

/**
 * List all stored predictions, sorted by creation date (newest first)
 */
export function listStoredPredictions(options?: {
  modelOwner?: string;
  modelName?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): StoredPrediction[] {
  let results = Array.from(predictions.values());

  // Filter by model
  if (options?.modelOwner && options?.modelName) {
    results = results.filter(
      p => p.modelOwner === options.modelOwner && p.modelName === options.modelName
    );
  }

  // Filter by status
  if (options?.status) {
    results = results.filter(p => p.status === options.status);
  }

  // Sort by saved date (newest first)
  results.sort((a, b) => 
    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  // Apply pagination
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  
  return results.slice(offset, offset + limit);
}

/**
 * Delete a stored prediction
 */
export function deleteStoredPrediction(localId: string): boolean {
  return predictions.delete(localId);
}

/**
 * Clear all stored predictions
 */
export function clearAllPredictions(): void {
  predictions.clear();
}

/**
 * Get prediction count
 */
export function getPredictionCount(): number {
  return predictions.size;
}

/**
 * Export all predictions (for backup/download)
 */
export function exportPredictions(): StoredPrediction[] {
  return Array.from(predictions.values());
}

/**
 * Import predictions (for restore)
 */
export function importPredictions(data: StoredPrediction[]): number {
  let imported = 0;
  for (const prediction of data) {
    if (prediction.localId && !predictions.has(prediction.localId)) {
      predictions.set(prediction.localId, prediction);
      imported++;
    }
  }
  return imported;
}
