import { NextRequest, NextResponse } from 'next/server';
import {
  createPrediction,
  createPredictionForModel,
  listPredictions,
  ReplicateError,
} from '@/lib/replicate';
import {
  storePrediction,
  listStoredPredictions,
  clearAllPredictions,
} from '@/lib/store';

/**
 * GET /api/predictions
 * 
 * Lists prediction history
 * Supports:
 * - ?local=true - Fetch from local store instead of Replicate
 * - ?modelOwner=<owner>&modelName=<name> - Filter by model
 * - ?status=<status> - Filter by status
 * - ?limit=<number> - Limit results
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const useLocal = searchParams.get('local') === 'true';
    const modelOwner = searchParams.get('modelOwner') || undefined;
    const modelName = searchParams.get('modelName') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (useLocal) {
      const predictions = listStoredPredictions({
        modelOwner,
        modelName,
        status,
        limit,
      });
      return NextResponse.json({ results: predictions });
    }

    // Fetch from Replicate API
    const response = await listPredictions();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching predictions:', error);

    if (error instanceof ReplicateError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/predictions
 * 
 * Creates a new prediction
 * Body:
 * - version: Model version ID (optional if model owner/name provided)
 * - modelOwner: Model owner (optional if version provided)
 * - modelName: Model name (optional if version provided)
 * - input: Input parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { version, modelOwner, modelName, input } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    let prediction;

    // Use model endpoint if owner/name provided (uses latest version automatically)
    if (modelOwner && modelName) {
      prediction = await createPredictionForModel(modelOwner, modelName, input);
    } else if (version) {
      prediction = await createPrediction(version, input);
    } else {
      return NextResponse.json(
        { error: 'Either version or modelOwner/modelName is required' },
        { status: 400 }
      );
    }

    // Store locally for history
    const stored = storePrediction(
      prediction,
      modelOwner || 'unknown',
      modelName || 'unknown',
      modelName
    );

    return NextResponse.json({
      ...prediction,
      localId: stored.localId,
    });
  } catch (error) {
    console.error('Error creating prediction:', error);

    if (error instanceof ReplicateError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create prediction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/predictions
 * 
 * Clears all local predictions
 */
export async function DELETE() {
  try {
    clearAllPredictions();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing predictions:', error);
    return NextResponse.json(
      { error: 'Failed to clear predictions' },
      { status: 500 }
    );
  }
}
