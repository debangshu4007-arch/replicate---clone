import { NextResponse } from 'next/server';
import { isReplicateConfigured, isDevelopment } from '@/lib/config';

/**
 * GET /api/health
 * 
 * Health check endpoint that returns the configuration status of the application.
 * Use this endpoint to:
 * - Check if Replicate API is properly configured before making API calls
 * - Display helpful setup instructions to users when configuration is missing
 * - Monitor application health in production
 * 
 * This endpoint does NOT expose any secrets - only boolean configuration status.
 */
export async function GET() {
    const replicateConfigured = isReplicateConfigured();

    // Build response object
    const response: {
        status: 'healthy' | 'misconfigured';
        replicateConfigured: boolean;
        timestamp: string;
        message?: string;
        setupInstructions?: string[];
    } = {
        status: replicateConfigured ? 'healthy' : 'misconfigured',
        replicateConfigured,
        timestamp: new Date().toISOString(),
    };

    // Add helpful message when not configured
    if (!replicateConfigured) {
        response.message = 'Replicate API token is not configured.';
        response.setupInstructions = [
            '1. Get your API token from https://replicate.com/account/api-tokens',
            '2. Create a file named .env.local in the project root',
            '3. Add: REPLICATE_API_TOKEN=your_token_here',
            '4. Restart the development server',
            'Note: .env.local may be hidden by your code editor!',
        ];
    }

    // Return 200 even when misconfigured (this is a health check, not an error)
    // The frontend can inspect the response to determine status
    return NextResponse.json(response);
}
