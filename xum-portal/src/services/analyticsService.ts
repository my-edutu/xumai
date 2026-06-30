import { supabase } from '../utils/supabase';

// ============================================
// Types for Analytics Data
// ============================================

export interface AnalyticsOverview {
    totalProjects: number;
    activeProjects: number;
    totalSubmissions: number;
    totalApproved: number;
    avgAccuracy: number;
    totalWorkers: number;
    topPerformers: number;
    totalSpend: number;
}

export interface TimeSeriesData {
    date: string;
    submissions: number;
    approved: number;
    rejected: number;
    accuracy: number;
    workers: number;
    spend: number;
}

export interface GeoDistribution {
    country: string;
    workers: number;
    submissions: number;
    accuracy: number;
}

export interface ProjectMetrics {
    id: string;
    name: string;
    status: string;
    projectType: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    currentAccuracy: number;
    totalBudget: number;
    spentBudget: number;
    progress: number;
}

export interface WorkerMetrics {
    id: string;
    fullName: string;
    avatarUrl: string;
    location: string;
    totalSubmissions: number;
    approvedSubmissions: number;
    accuracyRate: number;
    avgTimePerTask: number;
    totalEarned: number;
    isTopPerformer: boolean;
    qualityTrend: number;
    lastSubmissionAt: string;
}

export interface SubmissionStatus {
    approved: number;
    pending: number;
    rejected: number;
    revision: number;
}

export interface PerformanceTrend {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
}

export interface DashboardKPIs {
    throughput: PerformanceTrend;
    accuracy: PerformanceTrend;
    turnaround: PerformanceTrend;
    workerRetention: PerformanceTrend;
    costEfficiency: PerformanceTrend;
}

// ============================================
// Mock Data Generator (until real data is available)
// ============================================

const generateMockTimeSeriesData = (days: number): TimeSeriesData[] => {
    const data: TimeSeriesData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const baseSubmissions = Math.floor(Math.random() * 800) + 200;
        const approvalRate = 0.85 + Math.random() * 0.12;
        const rejectionRate = 0.05 + Math.random() * 0.08;

        data.push({
            date: date.toISOString().split('T')[0],
            submissions: baseSubmissions,
            approved: Math.floor(baseSubmissions * approvalRate),
            rejected: Math.floor(baseSubmissions * rejectionRate),
            accuracy: Math.round((85 + Math.random() * 13) * 100) / 100,
            workers: Math.floor(Math.random() * 150) + 50,
            spend: Math.round((baseSubmissions * 0.15) * 100) / 100
        });
    }

    return data;
};

const generateMockGeoData = (): GeoDistribution[] => {
    return [
        { country: 'Nigeria', workers: 1250, submissions: 45000, accuracy: 96.2 },
        { country: 'Kenya', workers: 890, submissions: 32000, accuracy: 95.8 },
        { country: 'Ghana', workers: 650, submissions: 21000, accuracy: 97.1 },
        { country: 'South Africa', workers: 420, submissions: 18000, accuracy: 94.5 },
        { country: 'Egypt', workers: 380, submissions: 12000, accuracy: 98.2 },
        { country: 'Tanzania', workers: 290, submissions: 9500, accuracy: 93.8 },
        { country: 'Uganda', workers: 185, submissions: 7200, accuracy: 95.4 },
        { country: 'Ethiopia', workers: 160, submissions: 5800, accuracy: 94.1 },
    ];
};

const generateMockWorkerData = (): WorkerMetrics[] => {
    const names = [
        'Amara Okonkwo', 'Kofi Mensah', 'Fatima Hassan', 'Thabo Molefe',
        'Aisha Kamara', 'David Njoroge', 'Grace Adeyemi', 'Samuel Osei',
        'Blessing Eze', 'Peter Kariuki', 'Mary Achieng', 'James Yeboah'
    ];

    const locations = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Tanzania', 'Egypt'];

    return names.map((name, index) => ({
        id: `worker-${index + 1}`,
        fullName: name,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        totalSubmissions: Math.floor(Math.random() * 2000) + 500,
        approvedSubmissions: Math.floor(Math.random() * 1800) + 450,
        accuracyRate: Math.round((88 + Math.random() * 12) * 100) / 100,
        avgTimePerTask: Math.floor(Math.random() * 120) + 30,
        totalEarned: Math.round((Math.random() * 500 + 100) * 100) / 100,
        isTopPerformer: Math.random() > 0.7,
        qualityTrend: Math.round((Math.random() * 10 - 5) * 100) / 100,
        lastSubmissionAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
    }));
};

const generateMockProjectData = (): ProjectMetrics[] => {
    return [
        {
            id: 'PJ-2025-001',
            name: 'Swahili NLP Tuning',
            status: 'active',
            projectType: 'text_annotation',
            totalTasks: 5000,
            completedTasks: 3750,
            pendingTasks: 1250,
            currentAccuracy: 96.4,
            totalBudget: 5000,
            spentBudget: 3750,
            progress: 75
        },
        {
            id: 'PJ-2025-002',
            name: 'Yoruba Voice RLHF',
            status: 'active',
            projectType: 'rlhf',
            totalTasks: 3000,
            completedTasks: 3000,
            pendingTasks: 0,
            currentAccuracy: 98.1,
            totalBudget: 6500,
            spentBudget: 6500,
            progress: 100
        },
        {
            id: 'PJ-2025-003',
            name: 'East African Landmarks',
            status: 'active',
            projectType: 'image_labeling',
            totalTasks: 8000,
            completedTasks: 960,
            pendingTasks: 7040,
            currentAccuracy: 94.2,
            totalBudget: 3200,
            spentBudget: 384,
            progress: 12
        },
        {
            id: 'PJ-2025-004',
            name: 'Hausa Voice Collection',
            status: 'paused',
            projectType: 'voice_collection',
            totalTasks: 2000,
            completedTasks: 1100,
            pendingTasks: 900,
            currentAccuracy: 92.8,
            totalBudget: 4000,
            spentBudget: 2200,
            progress: 55
        }
    ];
};

// ============================================
// Analytics Service Class
// ============================================

class AnalyticsService {
    private companyId: string | null = null;

    setCompanyId(id: string) {
        this.companyId = id;
    }

    // Fetch overview KPIs
    async getOverview(): Promise<AnalyticsOverview> {
        try {
            // First try to get real data from Supabase
            const { data, error } = await supabase
                .rpc('get_company_analytics_overview', { p_company_id: this.companyId });

            if (data && !error) {
                return {
                    totalProjects: data.total_projects || 0,
                    activeProjects: data.active_projects || 0,
                    totalSubmissions: data.total_submissions || 0,
                    totalApproved: data.total_approved || 0,
                    avgAccuracy: data.avg_accuracy || 0,
                    totalWorkers: data.total_workers || 0,
                    topPerformers: data.top_performers || 0,
                    totalSpend: data.total_spend || 0
                };
            }
        } catch (e) {
            console.warn('Using mock analytics data:', e);
        }

        // Return mock data if real data is unavailable
        return {
            totalProjects: 12,
            activeProjects: 8,
            totalSubmissions: 145200,
            totalApproved: 128520,
            avgAccuracy: 96.4,
            totalWorkers: 3420,
            topPerformers: 342,
            totalSpend: 18750.50
        };
    }

    // Fetch time series for charts
    async getTimeSeries(days: number = 7, projectId?: string): Promise<TimeSeriesData[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_analytics_time_series', {
                    p_company_id: this.companyId,
                    p_days: days,
                    p_project_id: projectId || null
                });

            if (data && !error && Array.isArray(data) && data.length > 0) {
                return data.map((d: any) => ({
                    date: d.date,
                    submissions: d.submissions || 0,
                    approved: d.approved || 0,
                    rejected: d.rejected || 0,
                    accuracy: d.accuracy || 0,
                    workers: d.workers || 0,
                    spend: d.spend || 0
                }));
            }
        } catch (e) {
            console.warn('Using mock time series data:', e);
        }

        return generateMockTimeSeriesData(days);
    }

    // Fetch geographic distribution
    async getGeoDistribution(): Promise<GeoDistribution[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_geo_distribution', { p_company_id: this.companyId });

            if (data && !error && Array.isArray(data) && data.length > 0) {
                return data;
            }
        } catch (e) {
            console.warn('Using mock geo data:', e);
        }

        return generateMockGeoData();
    }

    // Fetch submission status breakdown
    async getSubmissionStatus(): Promise<SubmissionStatus> {
        try {
            const { data, error } = await supabase
                .from('analytics_daily_metrics')
                .select('approved_submissions, pending_submissions, rejected_submissions')
                .eq('company_id', this.companyId)
                .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

            if (data && !error && data.length > 0) {
                const totals = data.reduce((acc, d) => ({
                    approved: acc.approved + (d.approved_submissions || 0),
                    pending: acc.pending + (d.pending_submissions || 0),
                    rejected: acc.rejected + (d.rejected_submissions || 0),
                    revision: 0
                }), { approved: 0, pending: 0, rejected: 0, revision: 0 });

                return totals;
            }
        } catch (e) {
            console.warn('Using mock submission status:', e);
        }

        // Mock data
        const total = 10000;
        return {
            approved: Math.floor(total * 0.85),
            pending: Math.floor(total * 0.08),
            rejected: Math.floor(total * 0.05),
            revision: Math.floor(total * 0.02)
        };
    }

    // Fetch worker metrics
    async getWorkerMetrics(limit: number = 10): Promise<WorkerMetrics[]> {
        try {
            const { data, error } = await supabase
                .from('worker_performance_metrics')
                .select(`
                    *,
                    worker:worker_id (
                        full_name,
                        avatar_url,
                        location
                    )
                `)
                .eq('company_id', this.companyId)
                .order('accuracy_rate', { ascending: false })
                .limit(limit);

            if (data && !error && data.length > 0) {
                return data.map((d: any) => ({
                    id: d.worker_id,
                    fullName: d.worker?.full_name || 'Unknown',
                    avatarUrl: d.worker?.avatar_url || '',
                    location: d.worker?.location || 'Unknown',
                    totalSubmissions: d.total_submissions || 0,
                    approvedSubmissions: d.approved_submissions || 0,
                    accuracyRate: d.accuracy_rate || 0,
                    avgTimePerTask: d.avg_time_per_task_seconds || 0,
                    totalEarned: d.total_earned || 0,
                    isTopPerformer: d.is_top_performer || false,
                    qualityTrend: d.quality_trend || 0,
                    lastSubmissionAt: d.last_submission_at || ''
                }));
            }
        } catch (e) {
            console.warn('Using mock worker data:', e);
        }

        return generateMockWorkerData().slice(0, limit);
    }

    // Fetch project metrics
    async getProjectMetrics(): Promise<ProjectMetrics[]> {
        try {
            const { data, error } = await supabase
                .from('company_projects')
                .select('*')
                .eq('company_id', this.companyId)
                .order('created_at', { ascending: false });

            if (data && !error && data.length > 0) {
                return data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    status: d.status,
                    projectType: d.project_type,
                    totalTasks: d.total_tasks || 0,
                    completedTasks: d.completed_tasks || 0,
                    pendingTasks: d.pending_tasks || 0,
                    currentAccuracy: d.current_accuracy || 0,
                    totalBudget: d.total_budget || 0,
                    spentBudget: d.spent_budget || 0,
                    progress: d.total_tasks > 0 ? Math.round((d.completed_tasks / d.total_tasks) * 100) : 0
                }));
            }
        } catch (e) {
            console.warn('Using mock project data:', e);
        }

        return generateMockProjectData();
    }

    // Calculate KPI trends
    async getKPITrends(): Promise<DashboardKPIs> {
        const currentPeriod = await this.getTimeSeries(7);
        const previousPeriod = await this.getTimeSeries(14);

        const current7Days = currentPeriod.slice(-7);
        const previous7Days = previousPeriod.slice(0, 7);

        const calculateTrend = (current: number, previous: number): PerformanceTrend => {
            const change = current - previous;
            const changePercent = previous > 0 ? (change / previous) * 100 : 0;
            return {
                current,
                previous,
                change,
                changePercent: Math.round(changePercent * 10) / 10,
                trend: changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable'
            };
        };

        const currentThroughput = current7Days.reduce((sum, d) => sum + d.submissions, 0);
        const previousThroughput = previous7Days.reduce((sum, d) => sum + d.submissions, 0);

        const currentAccuracy = current7Days.reduce((sum, d) => sum + d.accuracy, 0) / current7Days.length;
        const previousAccuracy = previous7Days.reduce((sum, d) => sum + d.accuracy, 0) / previous7Days.length;

        const currentWorkers = current7Days.reduce((sum, d) => sum + d.workers, 0) / current7Days.length;
        const previousWorkers = previous7Days.reduce((sum, d) => sum + d.workers, 0) / previous7Days.length;

        const currentSpend = current7Days.reduce((sum, d) => sum + d.spend, 0);
        const previousSpend = previous7Days.reduce((sum, d) => sum + d.spend, 0);

        return {
            throughput: calculateTrend(currentThroughput, previousThroughput),
            accuracy: calculateTrend(currentAccuracy, previousAccuracy),
            turnaround: calculateTrend(2.4, 2.8), // Mock turnaround time in days
            workerRetention: calculateTrend(currentWorkers, previousWorkers),
            costEfficiency: calculateTrend(
                currentThroughput > 0 ? currentSpend / currentThroughput : 0,
                previousThroughput > 0 ? previousSpend / previousThroughput : 0
            )
        };
    }

    // Get hourly distribution for heatmap
    async getHourlyDistribution(): Promise<{ hour: number; submissions: number }[]> {
        // This would typically come from aggregated hourly data
        return Array.from({ length: 24 }, (_, hour) => ({
            hour,
            submissions: Math.floor(Math.random() * 500) + (hour >= 9 && hour <= 18 ? 300 : 50)
        }));
    }

    // Export report data
    async exportReport(format: 'csv' | 'json' = 'csv'): Promise<string> {
        const [overview, timeSeries, geo, workers] = await Promise.all([
            this.getOverview(),
            this.getTimeSeries(30),
            this.getGeoDistribution(),
            this.getWorkerMetrics(50)
        ]);

        if (format === 'json') {
            return JSON.stringify({ overview, timeSeries, geo, workers }, null, 2);
        }

        // Generate CSV
        const headers = ['Date', 'Submissions', 'Approved', 'Rejected', 'Accuracy', 'Workers', 'Spend'];
        const rows = timeSeries.map(d =>
            [d.date, d.submissions, d.approved, d.rejected, d.accuracy, d.workers, d.spend].join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
