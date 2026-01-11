import { NextResponse } from 'next/server';
import { listCollections, ReplicateError } from '@/lib/replicate';
import {
  isReplicateConfigured,
  REPLICATE_TOKEN_ERROR,
  ERROR_CODE_MISSING_TOKEN,
  ConfigurationError
} from '@/lib/config';

/**
 * GET /api/collections
 * 
 * Lists all available model collections from Replicate
 * 
 * Error Handling:
 * - Returns 500 with code 'MISSING_API_TOKEN' if Replicate token is not configured
 * - Returns appropriate status codes for Replicate API errors
 */
export async function GET() {
  try {
    // =========================================================================
    // CONFIGURATION CHECK - Fail fast if API token is not configured
    // =========================================================================
    if (!isReplicateConfigured()) {
      console.error('[API /collections] Configuration error: ' + REPLICATE_TOKEN_ERROR);
      return NextResponse.json(
        {
          error: REPLICATE_TOKEN_ERROR,
          code: ERROR_CODE_MISSING_TOKEN,
          hint: 'Check /api/health for setup instructions',
        },
        { status: 500 }
      );
    }

    const response = await listCollections();
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API /collections] Error:', error);

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
        error: 'Failed to fetch collections. Please try again later.',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}
