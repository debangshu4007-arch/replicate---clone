import { NextRequest, NextResponse } from 'next/server';
import {
  getPrediction,
  cancelPrediction,
  ReplicateError,
} from '@/lib/replicate';
import {
  getStoredPrediction,
  getStoredPredictionByReplicateId,
  updateStoredPrediction,
  deleteStoredPrediction,
} from '@/lib/store';
import {
  isReplicateConfigured,
  REPLICATE_TOKEN_ERROR,
  ERROR_CODE_MISSING_TOKEN,
  ConfigurationError
} from '@/lib/config';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/predictions/[id]
 * 
 * Fetches the current status of a prediction
 * The ID can be either a Replicate prediction ID or a local ID
 * 
 * Error Handling:
 * - Returns 500 with code 'MISSING_API_TOKEN' if Replicate token is not configured
 * - Returns appropriate status codes for Replicate API errors
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // =========================================================================
    // CONFIGURATION CHECK - Fail fast if API token is not configured
    // =========================================================================
    if (!isReplicateConfigured()) {
      console.error('[API /predictions/[id] GET] Configuration error: ' + REPLICATE_TOKEN_ERROR);
      return NextResponse.json(
        {
          error: REPLICATE_TOKEN_ERROR,
          code: ERROR_CODE_MISSING_TOKEN,
          hint: 'Check /api/health for setup instructions',
        },
        { status: 500 }
      );
    }

    const { id } = await params;

    // First, check if this is a local ID
    let stored = getStoredPrediction(id);

    // If not found by local ID, try Replicate ID
    if (!stored) {
      stored = getStoredPredictionByReplicateId(id);
    }

    // Fetch latest status from Replicate
    const replicateId = stored?.id || id;
    const prediction = await getPrediction(replicateId);

    // Update local store with latest status
    if (stored) {
      updateStoredPrediction(stored.localId, {
        status: prediction.status,
        output: prediction.output,
        error: prediction.error,
        logs: prediction.logs,
        metrics: prediction.metrics,
        completed_at: prediction.completed_at,
      });
    }

    return NextResponse.json({
      ...prediction,
      localId: stored?.localId,
    });
  } catch (error) {
    console.error('[API /predictions/[id] GET] Error:', error);

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
        error: 'Failed to fetch prediction. Please try again later.',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/predictions/[id]
 * 
 * Actions on a prediction:
 * - ?action=cancel - Cancel a running prediction
 * 
 * Error Handling:
 * - Returns 500 with code 'MISSING_API_TOKEN' if Replicate token is not configured
 * - Returns appropriate status codes for Replicate API errors
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // =========================================================================
    // CONFIGURATION CHECK - Fail fast if API token is not configured
    // =========================================================================
    if (!isReplicateConfigured()) {
      console.error('[API /predictions/[id] POST] Configuration error: ' + REPLICATE_TOKEN_ERROR);
      return NextResponse.json(
        {
          error: REPLICATE_TOKEN_ERROR,
          code: ERROR_CODE_MISSING_TOKEN,
          hint: 'Check /api/health for setup instructions',
        },
        { status: 500 }
      );
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'cancel') {
      // Get the Replicate ID
      let stored = getStoredPrediction(id);
      if (!stored) {
        stored = getStoredPredictionByReplicateId(id);
      }

      const replicateId = stored?.id || id;
      const prediction = await cancelPrediction(replicateId);

      // Update local store
      if (stored) {
        updateStoredPrediction(stored.localId, {
          status: prediction.status,
        });
      }

      return NextResponse.json(prediction);
    }

    return NextResponse.json(
      {
        error: 'Unknown action',
        code: 'INVALID_ACTION',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API /predictions/[id] POST] Error:', error);

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
        error: 'Failed to process action. Please try again later.',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/predictions/[id]
 * 
 * Deletes a prediction from local storage
 * This does NOT require Replicate API token as it only affects local storage.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Try to delete by local ID first, then by Replicate ID
    let deleted = deleteStoredPrediction(id);

    if (!deleted) {
      const stored = getStoredPredictionByReplicateId(id);
      if (stored) {
        deleted = deleteStoredPrediction(stored.localId);
      }
    }

    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('[API /predictions/[id] DELETE] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete prediction',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}
