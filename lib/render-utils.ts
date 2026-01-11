import { ReactNode } from 'react';

/**
 * Safely render an unknown value as a ReactNode.
 * Handles all possible types that could come from API responses.
 */
export function renderValue(value: unknown): ReactNode {
    // Null/undefined - render nothing
    if (value === null || value === undefined) {
        return null;
    }

    // String - render directly
    if (typeof value === 'string') {
        return value;
    }

    // Number - render as string
    if (typeof value === 'number') {
        return String(value);
    }

    // Boolean - render as string
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    // Array - JSON stringify
    if (Array.isArray(value)) {
        return JSON.stringify(value, null, 2);
    }

    // Object - JSON stringify
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }

    // Fallback for any other type
    return String(value);
}

/**
 * Check if a value is a renderable URL (image, video, audio)
 */
export function isMediaUrl(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return value.startsWith('http') || value.startsWith('data:');
}

/**
 * Check if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}
