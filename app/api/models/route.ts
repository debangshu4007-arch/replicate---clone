import { NextRequest, NextResponse } from 'next/server';
import { listModels, getCollection, ReplicateError } from '@/lib/replicate';
import { rankModels } from '@/lib/ranking';
import {
  isReplicateConfigured,
  REPLICATE_TOKEN_ERROR,
  ERROR_CODE_MISSING_TOKEN,
  ConfigurationError
} from '@/lib/config';

/**
 * GET /api/models
 * 
 * Fetches and ranks models from Replicate API.
 * 
 * Query params:
 * - cursor: Pagination cursor
 * - collection: Collection slug
 * - featured: Apply ranking (default: true for first page)
 * - sort_by: 'model_created_at' | 'latest_version_created_at'
 * - sort_direction: 'asc' | 'desc'
 */
export async function GET(request: NextRequest) {
  try {
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

    const rawCursor = searchParams.get('cursor');
    const cursor = rawCursor?.trim() || undefined;

    const sortBy = searchParams.get('sort_by') as 'model_created_at' | 'latest_version_created_at' | undefined;
    const sortDirection = searchParams.get('sort_direction') as 'asc' | 'desc' | undefined;

    // Collection fetch
    if (collection) {
      try {
        const collectionData = await getCollection(collection);
        // Rank collection models too
        const ranked = rankModels(collectionData.models || []);
        return NextResponse.json({
          results: ranked,
          next: null,
          collection: {
            name: collectionData.name,
            description: collectionData.description,
          },
        });
      } catch {
        console.warn(`[/api/models] Collection "${collection}" not found`);
      }
    }

    // Fetch models
    const response = await listModels(cursor, sortBy, sortDirection);
    let models = response.results || [];

    // Apply ranking for featured/first page (no cursor)
    if (featured || !cursor) {
      models = rankModels(models);
    }

    const nextCursor = response.next?.trim() || null;

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
