/**
 * XUM AI — Campaign Service
 *
 * Handles pricing calculations and CRUD operations for company campaigns.
 */

import { supabase } from '../supabaseClient';
import { CompanyCampaign } from './types';

// ─── Pricing Constants ────────────────────────────────────────────────────────

const BASE_RATES: Record<string, number> = {
    audio: 0.15,
    image: 0.10,
    video: 0.25,
    text: 0.05,
    validation: 0.04,
    linguasense: 0.20,
};

const QUALITY_MULT: Record<string, number> = {
    basic: 1.0,
    standard: 1.3,
    premium: 1.8,
};

const TIMEFRAME_MULT: Record<number, number> = {
    7: 1.6,
    14: 1.35,
    30: 1.0,
    60: 0.9,
    90: 0.85,
};

const PLATFORM_FEE = 0.15;

function getVolumeDiscount(quantity: number): number {
    if (quantity >= 5000) return 0.22;
    if (quantity >= 2000) return 0.15;
    if (quantity >= 500) return 0.08;
    return 0;
}

function getRegionMultiplier(regions: string[]): number {
    if (!regions || regions.length === 0 || regions.includes('Global')) return 1.0;
    if (regions.length === 1) return 1.1;
    return 1.2;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PricingConfig {
    taskType: string;
    quantity: number;
    qualityTier: string;
    timeframeDays: number;
    regions: string[];
}

export interface PricingQuote {
    baseRate: number;
    baseTotal: number;
    qualityMultiplier: number;
    qualityExtra: number;
    volumeDiscountRate: number;
    volumeDiscount: number;
    timeframeMultiplier: number;
    timeframeAdjustment: number;
    regionMultiplier: number;
    regionExtra: number;
    subtotal: number;
    platformFeeRate: number;
    platformFee: number;
    total: number;
}

// ─── Pricing Calculation ──────────────────────────────────────────────────────

export function getPricingQuote(config: PricingConfig): PricingQuote {
    const { taskType, quantity, qualityTier, timeframeDays, regions } = config;

    const baseRate = BASE_RATES[taskType] ?? BASE_RATES.audio;
    const baseTotal = baseRate * quantity;

    const qualityMult = QUALITY_MULT[qualityTier] ?? 1.0;
    const afterQuality = baseTotal * qualityMult;
    const qualityExtra = afterQuality - baseTotal;

    const volumeDiscountRate = getVolumeDiscount(quantity);
    const volumeDiscount = afterQuality * volumeDiscountRate;
    const afterVolume = afterQuality - volumeDiscount;

    const timeframeMult = TIMEFRAME_MULT[timeframeDays] ?? 1.0;
    const afterTimeframe = afterVolume * timeframeMult;
    const timeframeAdjustment = afterTimeframe - afterVolume;

    const regionMult = getRegionMultiplier(regions);
    const afterRegion = afterTimeframe * regionMult;
    const regionExtra = afterRegion - afterTimeframe;

    const subtotal = afterRegion;
    const platformFee = subtotal * PLATFORM_FEE;
    const total = subtotal + platformFee;

    return {
        baseRate,
        baseTotal,
        qualityMultiplier: qualityMult,
        qualityExtra,
        volumeDiscountRate,
        volumeDiscount,
        timeframeMultiplier: timeframeMult,
        timeframeAdjustment,
        regionMultiplier: regionMult,
        regionExtra,
        subtotal,
        platformFeeRate: PLATFORM_FEE,
        platformFee,
        total,
    };
}

// ─── Campaign CRUD ────────────────────────────────────────────────────────────

export interface CreateCampaignData {
    title: string;
    description: string;
    taskType: string;
    targetCount: number;
    guidelines: {
        what_to_do: string;
        what_not_to_do?: string;
        quality_requirements?: string;
    };
    timeframeDays: number;
    qualityTier: string;
    regionFilter: string[];
    languageFilter: string[];
    minContributorLevel: number;
    maxSubmissionsPerUser: number;
    quote: PricingQuote;
    sampleReference?: string;
    status?: 'draft' | 'pending_review';
}

export async function createCampaign(
    userId: string,
    data: CreateCampaignData
): Promise<{ success: boolean; campaign?: CompanyCampaign; error?: string }> {
    try {
        const { data: result, error } = await supabase.rpc('company_create_campaign', {
            p_user_id: userId,
            p_title: data.title,
            p_description: data.description,
            p_task_type: data.taskType,
            p_target_count: data.targetCount,
            p_guidelines: data.guidelines,
            p_timeframe_days: data.timeframeDays,
            p_quality_tier: data.qualityTier,
            p_region_filter: data.regionFilter,
            p_language_filter: data.languageFilter,
            p_min_level: data.minContributorLevel,
            p_max_per_user: data.maxSubmissionsPerUser,
            p_total_cost: data.quote.total,
            p_platform_fee: data.quote.platformFee,
            p_sample_reference: data.sampleReference ?? null,
            p_status: data.status ?? 'pending_review',
        });

        if (error) return { success: false, error: error.message };
        return { success: true, campaign: result };
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to create campaign' };
    }
}

export async function getCompanyCampaigns(userId: string): Promise<CompanyCampaign[]> {
    try {
        const { data, error } = await supabase.rpc('company_get_campaigns', {
            p_user_id: userId,
        });

        if (error) {
            console.warn('[Campaigns] RPC error:', error.message);
            return [];
        }

        return data || [];
    } catch (err: any) {
        console.warn('[Campaigns] Network error:', err.message);
        return [];
    }
}

export async function updateCampaign(
    campaignId: string,
    userId: string,
    data: CreateCampaignData
): Promise<{ success: boolean; campaign?: CompanyCampaign; error?: string }> {
    try {
        const { data: result, error } = await supabase.rpc('company_update_campaign', {
            p_campaign_id: campaignId,
            p_user_id: userId,
            p_title: data.title,
            p_description: data.description,
            p_task_type: data.taskType,
            p_target_count: data.targetCount,
            p_guidelines: data.guidelines,
            p_timeframe_days: data.timeframeDays,
            p_quality_tier: data.qualityTier,
            p_region_filter: data.regionFilter,
            p_language_filter: data.languageFilter,
            p_min_level: data.minContributorLevel,
            p_max_per_user: data.maxSubmissionsPerUser,
            p_total_cost: data.quote.total,
            p_platform_fee: data.quote.platformFee,
            p_sample_reference: data.sampleReference ?? null,
            p_status: data.status ?? 'draft',
        });

        if (error) return { success: false, error: error.message };
        return { success: true, campaign: result };
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update campaign' };
    }
}

export async function updateCampaignStatus(
    campaignId: string,
    userId: string,
    status: string
): Promise<{ success: boolean; campaign?: CompanyCampaign; error?: string }> {
    try {
        const { data: result, error } = await supabase.rpc('company_update_campaign_status', {
            p_campaign_id: campaignId,
            p_user_id: userId,
            p_status: status,
        });

        if (error) return { success: false, error: error.message };
        return { success: true, campaign: result };
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update campaign status' };
    }
}

export async function getActiveCampaignsForFeed(filters?: {
    region?: string;
    minLevel?: number;
    limit?: number;
}): Promise<any[]> {
    try {
        let query = supabase
            .from('company_campaigns')
            .select('*')
            .eq('status', 'active')
            .order('feed_priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(filters?.limit ?? 10);

        const { data, error } = await query;

        if (error) {
            console.warn('[CampaignFeed] Query error:', error.message);
            return [];
        }

        const now = new Date();
        return (data || []).map((c: any) => {
            const endsAt = c.ends_at ? new Date(c.ends_at) : null;
            const daysLeft = endsAt
                ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 86_400_000))
                : c.timeframe_days ?? 30;

            const progressPercent = c.target_count > 0
                ? Math.round((c.completed_count / c.target_count) * 100)
                : 0;

            return {
                id: c.id,
                type: c.task_type.charAt(0).toUpperCase() + c.task_type.slice(1),
                title: c.title,
                subtitle: c.description || 'Company Campaign',
                reward: c.base_rate_per_item || BASE_RATES[c.task_type] || 0.10,
                time: '2-5 min',
                difficulty: c.quality_tier === 'premium' ? 'Hard' : c.quality_tier === 'standard' ? 'Medium' : 'Easy',
                icon: getTaskIconForType(c.task_type),
                color: getTaskColorForType(c.task_type),
                screen: getTaskScreenForType(c.task_type),
                isCampaign: true,
                feedPriority: c.feed_priority ?? 10,
                daysLeft,
                companyName: c.company_name || 'XUM Partner',
                progressPercent,
                campaignId: c.id,
                targetCount: c.target_count,
                completedCount: c.completed_count,
                qualityTier: c.quality_tier,
                regions: c.region_filter || [],
                gradientStart: getGradientStartForType(c.task_type),
                gradientEnd: getGradientEndForType(c.task_type),
            };
        });
    } catch (err: any) {
        console.warn('[CampaignFeed] Error:', err.message);
        return [];
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTaskIconForType(type: string): string {
    const map: Record<string, string> = {
        audio: 'mic', voice: 'mic', image: 'camera-alt', video: 'videocam',
        text: 'text-fields', validation: 'verified', linguasense: 'translate',
    };
    return map[type] || 'assignment';
}

function getTaskColorForType(type: string): string {
    const map: Record<string, string> = {
        audio: '#ec4899', voice: '#ec4899', image: '#8b5cf6', video: '#10b981',
        text: '#3b82f6', validation: '#f59e0b', linguasense: '#06b6d4',
    };
    return map[type] || '#64748b';
}

function getTaskScreenForType(type: string): string {
    const map: Record<string, string> = {
        audio: 'VOICE_TASK', voice: 'VOICE_TASK', image: 'IMAGE_TASK',
        video: 'VIDEO_TASK', text: 'LINGUASENSE_ENGINE',
        validation: 'VALIDATION_TASK_EXECUTION', linguasense: 'LINGUASENSE_ENGINE',
    };
    return map[type] || 'HOME';
}

function getGradientStartForType(type: string): string {
    const map: Record<string, string> = {
        audio: '#be185d', voice: '#be185d', image: '#7c3aed', video: '#059669',
        text: '#2563eb', validation: '#d97706', linguasense: '#0891b2',
    };
    return map[type] || '#374151';
}

function getGradientEndForType(type: string): string {
    const map: Record<string, string> = {
        audio: '#f97316', voice: '#f97316', image: '#a855f7', video: '#34d399',
        text: '#60a5fa', validation: '#fbbf24', linguasense: '#38bdf8',
    };
    return map[type] || '#6b7280';
}
