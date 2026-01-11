import { NextResponse } from 'next/server';
import { listCollections, ReplicateError } from '@/lib/replicate';

/**
 * GET /api/collections
 * 
 * Lists all available model collections from Replicate
 */
export async function GET() {
  try {
    const response = await listCollections();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching collections:', error);

    if (error instanceof ReplicateError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}
