import { NextRequest, NextResponse } from 'next/server';
import { getModel, getModelVersions, ReplicateError } from '@/lib/replicate';

interface RouteParams {
  params: Promise<{
    owner: string;
    name: string;
  }>;
}

/**
 * GET /api/models/[owner]/[name]
 * 
 * Fetches detailed information about a specific model including:
 * - Model metadata
 * - Latest version with schema
 * - All available versions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { owner, name } = await params;

    // Fetch model and versions in parallel
    const [model, versionsResponse] = await Promise.all([
      getModel(owner, name),
      getModelVersions(owner, name).catch(() => ({ results: [] })),
    ]);

    return NextResponse.json({
      ...model,
      versions: versionsResponse.results,
    });
  } catch (error) {
    console.error('Error fetching model:', error);

    if (error instanceof ReplicateError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch model' },
      { status: 500 }
    );
  }
}
