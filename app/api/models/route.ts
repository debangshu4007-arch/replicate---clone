import { NextRequest, NextResponse } from 'next/server';
import { listModels, listCollections, getCollection, ReplicateError } from '@/lib/replicate';
import { Model } from '@/types';

/**
 * GET /api/models
 * 
 * Fetches models from Replicate API
 * Supports:
 * - ?collection=<slug> - Fetch models from a specific collection
 * - ?cursor=<cursor> - Pagination cursor
 * - ?featured=true - Fetch featured/popular models
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collection = searchParams.get('collection');
    const cursor = searchParams.get('cursor') || undefined;
    const featured = searchParams.get('featured') === 'true';

    // If requesting a specific collection
    if (collection) {
      try {
        const collectionData = await getCollection(collection);
        return NextResponse.json({
          results: collectionData.models,
          collection: {
            name: collectionData.name,
            description: collectionData.description,
          },
        });
      } catch (error) {
        // Collection might not exist, fall back to regular list
        console.warn(`Collection ${collection} not found, falling back to model list`);
      }
    }

    // Fetch regular model list
    const response = await listModels(cursor);

    // If featured is requested, sort by run count
    let models = response.results;
    if (featured) {
      models = models.sort((a, b) => (b.run_count || 0) - (a.run_count || 0));
    }

    return NextResponse.json({
      results: models,
      next: response.next,
      previous: response.previous,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    
    if (error instanceof ReplicateError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
