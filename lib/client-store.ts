'use client';

/**
 * Client-side storage utilities for prediction history persistence
 * Uses localStorage for cross-session persistence
 */

import { StoredPrediction } from '@/types';

const STORAGE_KEY = 'modelhub_predictions';

/**
 * Save predictions to localStorage
 */
export function savePredictionsToStorage(predictions: StoredPrediction[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
  } catch (error) {
    console.warn('Failed to save predictions to localStorage:', error);
  }
}

/**
 * Load predictions from localStorage
 */
export function loadPredictionsFromStorage(): StoredPrediction[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load predictions from localStorage:', error);
    return [];
  }
}

/**
 * Clear predictions from localStorage
 */
export function clearPredictionsFromStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear predictions from localStorage:', error);
  }
}

/**
 * Add a prediction to localStorage
 */
export function addPredictionToStorage(prediction: StoredPrediction): void {
  const predictions = loadPredictionsFromStorage();
  predictions.unshift(prediction); // Add to beginning
  savePredictionsToStorage(predictions);
}

/**
 * Update a prediction in localStorage
 */
export function updatePredictionInStorage(
  localId: string,
  update: Partial<StoredPrediction>
): void {
  const predictions = loadPredictionsFromStorage();
  const index = predictions.findIndex((p) => p.localId === localId);
  
  if (index !== -1) {
    predictions[index] = { ...predictions[index], ...update };
    savePredictionsToStorage(predictions);
  }
}

/**
 * Remove a prediction from localStorage
 */
export function removePredictionFromStorage(localId: string): void {
  const predictions = loadPredictionsFromStorage();
  const filtered = predictions.filter((p) => p.localId !== localId);
  savePredictionsToStorage(filtered);
}
