/**
 * Model Ranking System
 * 
 * Deterministic ranking based on existing metadata to surface quality models.
 * No hardcoded model names or manual whitelists.
 */

import { Model } from '@/types';

/**
 * Known official/verified owners who publish high-quality models.
 * These are organization-level owners, not individual models.
 * Add more as needed based on Replicate's ecosystem.
 */
const VERIFIED_OWNERS = new Set([
    'stability-ai',
    'black-forest-labs',
    'meta',
    'openai',
    'anthropic',
    'google',
    'bytedance',
    'tencent',
    'alibaba',
    'microsoft',
    'nvidia',
    'salesforce',
    'huggingface',
    'deepmind',
    'together',
    'mistralai',
    'replicate',
    'zsxkib', // Known quality model author
    'lucataco', // Prolific quality contributor
    'cjwbw', // Well-known contributor
]);

/**
 * Calculate a ranking score for a model.
 * Higher score = more prominent placement.
 * 
 * Scoring weights:
 * - run_count: Primary signal (log scale to prevent runaway dominance)
 * - Verified owner: Significant boost for official models
 * - Recency: Minor boost for recently updated models
 */
export function calculateModelScore(model: Model): number {
    let score = 0;

    // 1. Run count (log scale, max ~50 points)
    const runCount = model.run_count || 0;
    if (runCount > 0) {
        // Log10 scale: 1M runs ≈ 30 points, 100K ≈ 25, 10K ≈ 20, 1K ≈ 15
        score += Math.log10(runCount + 1) * 5;
    }

    // 2. Verified owner boost (+15 points)
    const ownerLower = model.owner.toLowerCase();
    if (VERIFIED_OWNERS.has(ownerLower)) {
        score += 15;
    }

    // 3. Recency boost (minor, max +5 points)
    // Favor models updated in the last 90 days
    if (model.latest_version?.created_at) {
        const updatedAt = new Date(model.latest_version.created_at).getTime();
        const now = Date.now();
        const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);

        if (daysSinceUpdate < 7) {
            score += 5;
        } else if (daysSinceUpdate < 30) {
            score += 3;
        } else if (daysSinceUpdate < 90) {
            score += 1;
        }
    }

    // 4. Has cover image (+2 points) - indicates maintained model
    if (model.cover_image_url) {
        score += 2;
    }

    // 5. Has description (+1 point) - indicates documentation effort
    if (model.description && model.description.length > 20) {
        score += 1;
    }

    return score;
}

/**
 * Rank models by quality score (descending)
 */
export function rankModels(models: Model[]): Model[] {
    return [...models].sort((a, b) => {
        const scoreA = calculateModelScore(a);
        const scoreB = calculateModelScore(b);

        // Primary: score
        if (scoreB !== scoreA) {
            return scoreB - scoreA;
        }

        // Tiebreaker: run count
        return (b.run_count || 0) - (a.run_count || 0);
    });
}

/**
 * Filter models by search query, then rank by relevance + quality
 */
export function searchAndRankModels(models: Model[], query: string): Model[] {
    if (!query.trim()) {
        return rankModels(models);
    }

    const q = query.toLowerCase().trim();

    // Score each model for relevance
    const scored = models.map(model => {
        let relevance = 0;
        const name = model.name.toLowerCase();
        const owner = model.owner.toLowerCase();
        const desc = (model.description || '').toLowerCase();

        // Exact name match - highest relevance
        if (name === q) {
            relevance = 100;
        } else if (name.startsWith(q)) {
            relevance = 80;
        } else if (name.includes(q)) {
            relevance = 60;
        }

        // Owner match
        if (owner === q) {
            relevance = Math.max(relevance, 90);
        } else if (owner.includes(q)) {
            relevance = Math.max(relevance, 40);
        }

        // Description match (lower weight)
        if (desc.includes(q)) {
            relevance = Math.max(relevance, 20);
        }

        return { model, relevance };
    });

    // Filter to only matching models
    const matching = scored.filter(s => s.relevance > 0);

    // Sort by relevance first, then by quality score
    matching.sort((a, b) => {
        // High relevance difference = sort by relevance
        if (Math.abs(a.relevance - b.relevance) >= 20) {
            return b.relevance - a.relevance;
        }

        // Similar relevance = sort by quality score
        const qualityA = calculateModelScore(a.model);
        const qualityB = calculateModelScore(b.model);

        return qualityB - qualityA;
    });

    return matching.map(s => s.model);
}
