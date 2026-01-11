import { NextRequest, NextResponse } from 'next/server';
import { searchModelsAPI, universalSearch, ReplicateError } from '@/lib/replicate';
import { rankModels } from '@/lib/ranking';
import {
    isReplicateConfigured,
    REPLICATE_TOKEN_ERROR,
    ERROR_CODE_MISSING_TOKEN,
    ConfigurationError
} from '@/lib/config';

/**
 * GET /api/models/search
 * 
 * Server-side search endpoint for models.
 * 
 * ============================================================================
 * REPLICATE API SEARCH BEHAVIOR
 * ============================================================================
 * 
 * This endpoint uses Replicate's native search capabilities:
 * 
 * 1. Primary: QUERY /v1/models (HTTP QUERY method)
 *    - Searches by owner, name, and description
 *    - Returns up to 50 results (no pagination)
 *    - Fast and efficient for targeted searches
 * 
 * 2. Fallback: GET /v1/search (beta)
 *    - Universal search across models, collections, docs
 *    - Returns enhanced metadata (AI descriptions, tags, scores)
 *    - May be subject to change as it's in beta
 * 
 * LIMITATIONS:
 * - Search results are LIMITED to 50 models maximum
 * - NO cursor pagination for search - this is an API limitation
 * - For browsing ALL models, use /api/models with cursor pagination instead
 * - Search queries are case-insensitive on Replicate's side
 * 
 * RATE LIMITING:
 * - Replicate imposes rate limits (not publicly documented)
 * - We return 429 status if rate limited
 * - Frontend should implement exponential backoff
 * 
 * ============================================================================
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - limit: Max results 1-50 (default: 20)
 * - enhanced: If 'true', use universal search for richer metadata
 */
export async function GET(request: NextRequest) {
    try {
        // =========================================================================
        // CONFIGURATION CHECK
        // =========================================================================
        if (!isReplicateConfigured()) {
            console.error('[API /models/search] Configuration error: ' + REPLICATE_TOKEN_ERROR);
            return NextResponse.json(
                {
                    error: REPLICATE_TOKEN_ERROR,
                    code: ERROR_CODE_MISSING_TOKEN,
                    hint: 'Check /api/health for setup instructions',
                },
                { status: 500 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const useEnhanced = searchParams.get('enhanced') === 'true';

        // Validate query
        if (!query || query.trim().length === 0) {
            return NextResponse.json(
                {
                    error: 'Search query is required',
                    code: 'MISSING_QUERY',
                    hint: 'Add ?q=your_search_term to the request',
                },
                { status: 400 }
            );
        }

        // Validate limit
        const validLimit = Math.min(50, Math.max(1, isNaN(limit) ? 20 : limit));

        // Choose search method based on request
        if (useEnhanced) {
            // Use universal search for richer metadata
            const searchResult = await universalSearch(query.trim(), validLimit);
            const rankedResults = rankModels(searchResult.models || []);
            return NextResponse.json({
                results: rankedResults,
                query: query.trim(),
                limit: validLimit,
                enhanced: true,
            });
        } else {
            // Use QUERY method for standard search
            const response = await searchModelsAPI(query.trim(), validLimit);
            const rankedResults = rankModels(response.results || []);
            return NextResponse.json({
                results: rankedResults,
                query: query.trim(),
                limit: validLimit,
            });
        }
    } catch (error) {
        console.error('[API /models/search] Error:', error);

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

        // Handle Replicate API errors
        if (error instanceof ReplicateError) {
            return NextResponse.json(
                {
                    error: error.message,
                    code: 'REPLICATE_API_ERROR',
                },
                { status: error.status }
            );
        }

        // Unknown errors
        return NextResponse.json(
            {
                error: 'Search failed. Please try again later.',
                code: 'UNKNOWN_ERROR',
            },
            { status: 500 }
        );
    }
}
