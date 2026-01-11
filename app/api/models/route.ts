import { NextRequest, NextResponse } from 'next/server';
import { listModels, getCollection, ReplicateError } from '@/lib/replicate';
import {
  isReplicateConfigured,
  REPLICATE_TOKEN_ERROR,
  ERROR_CODE_MISSING_TOKEN,
  ConfigurationError
} from '@/lib/config';

/**
 * GET /api/models
 * 
 * Fetches models from Replicate API with proper cursor-based pagination.
 * 
 * Query params:
 * - cursor: Pagination cursor (MUST be valid non-empty string or omitted entirely)
 * - collection: Collection slug to fetch from
 * - featured: Sort by run_count (popularity)
 * - sort_by: 'model_created_at' | 'latest_version_created_at'
 * - sort_direction: 'asc' | 'desc'
 * 
 * CURSOR RULES:
 * 1. If cursor param is empty/null, we MUST NOT pass it to Replicate
 * 2. Invalid cursors return 400, not 500
 */
export async function GET(request: NextRequest) {
  try {
    // Config check
    if (!isReplicateConfigured()) {
      return NextResponse.json({
        error: REPLICATE_TOKEN_ERROR,
        code: ERROR_CODE_MISSING_TOKEN,
        hint: 'Check /api/health for setup instructions',
      }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const collection = searchParams.get('collection');
    const featured = searchParams.get('featured') === 'true';

    // CRITICAL: Validate cursor - only use if non-empty string
    const rawCursor = searchParams.get('cursor');
    const cursor = rawCursor && typeof rawCursor === 'string' && rawCursor.trim().length > 0
      ? rawCursor.trim()
      : undefined;

    const sortBy = searchParams.get('sort_by') as 'model_created_at' | 'latest_version_created_at' | undefined;
    const sortDirection = searchParams.get('sort_direction') as 'asc' | 'desc' | undefined;

    // Collection fetch
    if (collection) {
      try {
        const collectionData = await getCollection(collection);
        return NextResponse.json({
          results: collectionData.models,
          next: null, // Collections don't paginate
          collection: {
            name: collectionData.name,
            description: collectionData.description,
          },
        });
      } catch {
        console.warn(`[/api/models] Collection "${collection}" not found, falling back to list`);
      }
    }

    // Fetch models - cursor is either valid string or undefined (never empty)
    const response = await listModels(cursor, sortBy, sortDirection);

    let models = response.results || [];

    // Client-side sort by popularity if requested and no API sort
    if (featured && !sortBy) {
      models = [...models].sort((a, b) => (b.run_count || 0) - (a.run_count || 0));
    }

    // Validate next cursor before returning
    const nextCursor = response.next && typeof response.next === 'string' && response.next.trim().length > 0
      ? response.next
      : null;

    return NextResponse.json({
      results: models,
      next: nextCursor,
      previous: response.previous || null,
    });

  } catch (error) {
    console.error('[/api/models] Error:', error);

    if (error instanceof ConfigurationError) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
      }, { status: 500 });
    }

    if (error instanceof ReplicateError) {
      // Check for cursor-specific errors
      const isCursorError = error.message.toLowerCase().includes('cursor');
      return NextResponse.json({
        error: isCursorError ? 'Invalid pagination cursor' : error.message,
        code: isCursorError ? 'INVALID_CURSOR' : 'REPLICATE_API_ERROR',
      }, { status: isCursorError ? 400 : error.status });
    }

    return NextResponse.json({
      error: 'Failed to fetch models',
      code: 'UNKNOWN_ERROR',
    }, { status: 500 });
  }
}
