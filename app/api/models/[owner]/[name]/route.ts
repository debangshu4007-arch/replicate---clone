import { NextRequest, NextResponse } from 'next/server';
import { getModel, getModelVersions, ReplicateError } from '@/lib/replicate';
import {
  isReplicateConfigured,
  REPLICATE_TOKEN_ERROR,
  ERROR_CODE_MISSING_TOKEN,
  ConfigurationError
} from '@/lib/config';

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
      console.error('[API /models/[owner]/[name]] Configuration error: ' + REPLICATE_TOKEN_ERROR);
      return NextResponse.json(
        {
          error: REPLICATE_TOKEN_ERROR,
          code: ERROR_CODE_MISSING_TOKEN,
          hint: 'Check /api/health for setup instructions',
        },
        { status: 500 }
      );
    }

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
    // Log the full error on the server for debugging
    console.error('[API /models/[owner]/[name]] Error:', error);

    // Handle configuration errors
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

    // Handle Replicate API errors with their original status
    if (error instanceof ReplicateError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'REPLICATE_API_ERROR',
        },
        { status: error.status }
      );
    }

    // Unknown errors - return sanitized message
    return NextResponse.json(
      {
        error: 'Failed to fetch model. Please try again later.',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

