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
import {
  isReplicateConfigured,
  REPLICATE_TOKEN_ERROR,
  ERROR_CODE_MISSING_TOKEN,
  ConfigurationError
} from '@/lib/config';

/**
 * GET /api/predictions
 * 
 * Lists prediction history
 * Supports:
 * - ?local=true - Fetch from local store instead of Replicate
 * - ?modelOwner=<owner>&modelName=<name> - Filter by model
 * - ?status=<status> - Filter by status
 * - ?limit=<number> - Limit results
 * 
 * Error Handling:
 * - Returns 500 with code 'MISSING_API_TOKEN' if Replicate token is not configured
 * - Returns appropriate status codes for Replicate API errors
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const useLocal = searchParams.get('local') === 'true';
    const modelOwner = searchParams.get('modelOwner') || undefined;
    const modelName = searchParams.get('modelName') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Local storage doesn't require API token
    if (useLocal) {
      const predictions = listStoredPredictions({
        modelOwner,
        modelName,
        status,
        limit,
      });
      return NextResponse.json({ results: predictions });
    }

    // =========================================================================
    // CONFIGURATION CHECK - Only needed for Replicate API calls
    // =========================================================================
    if (!isReplicateConfigured()) {
      console.error('[API /predictions] Configuration error: ' + REPLICATE_TOKEN_ERROR);
      return NextResponse.json(
        {
          error: REPLICATE_TOKEN_ERROR,
          code: ERROR_CODE_MISSING_TOKEN,
          hint: 'Check /api/health for setup instructions',
        },
        { status: 500 }
      );
    }

    // Fetch from Replicate API
    const response = await listPredictions();
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /predictions GET] Error:', error);

    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          hint: 'Check /api/health for setup instructions',
        },
        { status: 500 }
      );
    }

    if (error instanceof ReplicateError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'REPLICATE_API_ERROR',
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch predictions. Please try again later.',
        code: 'UNKNOWN_ERROR',
      },
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
 * 
 * Error Handling:
 * - Returns 500 with code 'MISSING_API_TOKEN' if Replicate token is not configured
 * - Returns 400 for invalid input
 * - Returns appropriate status codes for Replicate API errors
 */
export async function POST(request: NextRequest) {
  try {
    // =========================================================================
    // CONFIGURATION CHECK - Fail fast if API token is not configured
    // =========================================================================
    if (!isReplicateConfigured()) {
      console.error('[API /predictions POST] Configuration error: ' + REPLICATE_TOKEN_ERROR);
      return NextResponse.json(
        {
          error: REPLICATE_TOKEN_ERROR,
          code: ERROR_CODE_MISSING_TOKEN,
          hint: 'Check /api/health for setup instructions',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { version, modelOwner, modelName, input } = body;

    if (!input) {
      return NextResponse.json(
        {
          error: 'Input is required',
          code: 'INVALID_INPUT',
        },
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
        {
          error: 'Either version or modelOwner/modelName is required',
          code: 'INVALID_INPUT',
        },
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
    console.error('[API /predictions POST] Error:', error);

    if (error instanceof ConfigurationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          hint: 'Check /api/health for setup instructions',
        },
        { status: 500 }
      );
    }

    if (error instanceof ReplicateError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'REPLICATE_API_ERROR',
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create prediction. Please try again later.',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/predictions
 * 
 * Clears all local predictions
 * This does NOT require Replicate API token as it only affects local storage.
 */
export async function DELETE() {
  try {
    clearAllPredictions();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /predictions DELETE] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear predictions',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}
