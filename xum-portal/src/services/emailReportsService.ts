import { supabase } from '../utils/supabase';
import analyticsService from './analyticsService';

// ============================================
// Types for Email Reports
// ============================================

export interface ScheduledReport {
    id: string;
    reportName: string;
    reportType: ReportType;
    frequency: ReportFrequency;
    scheduleTime: string;
    scheduleDayOfWeek: number | null;
    scheduleDayOfMonth: number | null;
    timezone: string;
    recipients: Recipient[];
    ccEmails: string[];
    includedMetrics: string[];
    includeCharts: boolean;
    includeCsvAttachment: boolean;
    isActive: boolean;
    lastSentAt: string | null;
    nextScheduledAt: string | null;
    sendCount: number;
    projectFilter: string[] | null;
    dateRangeDays: number;
}

export interface Recipient {
    email: string;
    name: string;
}

export type ReportType =
    | 'daily_digest'
    | 'weekly_summary'
    | 'monthly_overview'
    | 'anomaly_report'
    | 'worker_performance'
    | 'financial_summary'
    | 'custom';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'realtime';

export interface ReportTemplate {
    id: ReportType;
    name: string;
    description: string;
    defaultMetrics: string[];
    icon: string;
    color: string;
}

export interface EmailLog {
    id: string;
    reportId: string;
    recipients: string[];
    subject: string;
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
    sentAt: string | null;
    deliveredAt: string | null;
    openedAt: string | null;
    errorMessage: string | null;
    createdAt: string;
}

export interface CreateReportInput {
    reportName: string;
    reportType: ReportType;
    frequency: ReportFrequency;
    scheduleTime: string;
    scheduleDayOfWeek?: number;
    scheduleDayOfMonth?: number;
    timezone?: string;
    recipients: Recipient[];
    ccEmails?: string[];
    includedMetrics?: string[];
    includeCharts?: boolean;
    includeCsvAttachment?: boolean;
    projectFilter?: string[];
    dateRangeDays?: number;
}

// ============================================
// Report Templates
// ============================================

export const REPORT_TEMPLATES: ReportTemplate[] = [
    {
        id: 'daily_digest',
        name: 'Daily Digest',
        description: 'Summary of daily submissions, quality metrics, and worker activity',
        defaultMetrics: ['submissions', 'accuracy', 'workers', 'spend'],
        icon: '📊',
        color: '#f97316'
    },
    {
        id: 'weekly_summary',
        name: 'Weekly Summary',
        description: 'Comprehensive weekly overview with trends and comparisons',
        defaultMetrics: ['submissions', 'accuracy', 'workers', 'spend', 'trends', 'geo'],
        icon: '📈',
        color: '#3b82f6'
    },
    {
        id: 'monthly_overview',
        name: 'Monthly Overview',
        description: 'Detailed monthly analysis with MoM comparisons',
        defaultMetrics: ['submissions', 'accuracy', 'workers', 'spend', 'trends', 'geo', 'projects'],
        icon: '📅',
        color: '#10b981'
    },
    {
        id: 'anomaly_report',
        name: 'Anomaly Report',
        description: 'Real-time alerts when quality thresholds are breached',
        defaultMetrics: ['alerts', 'accuracy', 'rejection_rate'],
        icon: '🚨',
        color: '#ef4444'
    },
    {
        id: 'worker_performance',
        name: 'Worker Performance',
        description: 'Detailed worker metrics, rankings, and productivity insights',
        defaultMetrics: ['workers', 'accuracy', 'submissions', 'earnings'],
        icon: '👥',
        color: '#a855f7'
    },
    {
        id: 'financial_summary',
        name: 'Financial Summary',
        description: 'Budget tracking, spend analysis, and ROI metrics',
        defaultMetrics: ['spend', 'budget', 'cost_per_task', 'escrow'],
        icon: '💰',
        color: '#f59e0b'
    },
    {
        id: 'custom',
        name: 'Custom Report',
        description: 'Build your own report with custom metrics and filters',
        defaultMetrics: [],
        icon: '⚙️',
        color: '#64748b'
    }
];

// Available metrics for custom reports
export const AVAILABLE_METRICS = [
    { id: 'submissions', label: 'Total Submissions', category: 'volume' },
    { id: 'approved', label: 'Approved Submissions', category: 'volume' },
    { id: 'rejected', label: 'Rejected Submissions', category: 'volume' },
    { id: 'pending', label: 'Pending Submissions', category: 'volume' },
    { id: 'accuracy', label: 'Quality Score', category: 'quality' },
    { id: 'rejection_rate', label: 'Rejection Rate', category: 'quality' },
    { id: 'first_pass_yield', label: 'First Pass Yield', category: 'quality' },
    { id: 'workers', label: 'Active Workers', category: 'workforce' },
    { id: 'new_workers', label: 'New Workers', category: 'workforce' },
    { id: 'top_performers', label: 'Top Performers', category: 'workforce' },
    { id: 'worker_retention', label: 'Worker Retention', category: 'workforce' },
    { id: 'spend', label: 'Total Spend', category: 'financial' },
    { id: 'cost_per_task', label: 'Cost per Task', category: 'financial' },
    { id: 'budget', label: 'Budget Utilization', category: 'financial' },
    { id: 'escrow', label: 'Escrow Balance', category: 'financial' },
    { id: 'trends', label: 'Historical Trends', category: 'insights' },
    { id: 'geo', label: 'Geographic Distribution', category: 'insights' },
    { id: 'projects', label: 'Project Breakdown', category: 'insights' },
    { id: 'alerts', label: 'Anomaly Alerts', category: 'insights' },
    { id: 'turnaround', label: 'Turnaround Time', category: 'efficiency' }
];

// ============================================
// Email Reports Service
// ============================================

class EmailReportsService {
    private companyId: string | null = null;

    setCompanyId(id: string) {
        this.companyId = id;
    }

    // ============================================
    // SCHEDULED REPORTS CRUD
    // ============================================

    /**
     * Get all scheduled reports for company
     */
    async getScheduledReports(): Promise<ScheduledReport[]> {
        try {
            const { data, error } = await supabase
                .from('scheduled_email_reports')
                .select('*')
                .eq('company_id', this.companyId)
                .order('created_at', { ascending: false });

            if (data && !error) {
                return data.map(this.formatReport);
            }
        } catch (error) {
            console.warn('Error fetching reports:', error);
        }

        // Return mock data for development
        return this.getMockReports();
    }

    /**
     * Get a single report by ID
     */
    async getReport(reportId: string): Promise<ScheduledReport | null> {
        try {
            const { data, error } = await supabase
                .from('scheduled_email_reports')
                .select('*')
                .eq('id', reportId)
                .eq('company_id', this.companyId)
                .single();

            if (data && !error) {
                return this.formatReport(data);
            }
        } catch (error) {
            console.warn('Error fetching report:', error);
        }
        return null;
    }

    /**
     * Create a new scheduled report
     */
    async createReport(input: CreateReportInput): Promise<ScheduledReport | null> {
        const template = REPORT_TEMPLATES.find(t => t.id === input.reportType);

        try {
            const { data, error } = await supabase
                .from('scheduled_email_reports')
                .insert({
                    company_id: this.companyId,
                    report_name: input.reportName,
                    report_type: input.reportType,
                    frequency: input.frequency,
                    schedule_time: input.scheduleTime,
                    schedule_day_of_week: input.scheduleDayOfWeek,
                    schedule_day_of_month: input.scheduleDayOfMonth,
                    timezone: input.timezone || 'Africa/Lagos',
                    recipients: input.recipients,
                    cc_emails: input.ccEmails || [],
                    included_metrics: input.includedMetrics || template?.defaultMetrics || [],
                    include_charts: input.includeCharts ?? true,
                    include_csv_attachment: input.includeCsvAttachment ?? true,
                    project_filter: input.projectFilter,
                    date_range_days: input.dateRangeDays || 7,
                    is_active: true,
                    next_scheduled_at: this.calculateNextSchedule(input)
                })
                .select()
                .single();

            if (data && !error) {
                return this.formatReport(data);
            }
        } catch (error) {
            console.error('Error creating report:', error);
        }
        return null;
    }

    /**
     * Update a scheduled report
     */
    async updateReport(reportId: string, updates: Partial<CreateReportInput>): Promise<boolean> {
        try {
            const updateData: any = {
                updated_at: new Date().toISOString()
            };

            if (updates.reportName) updateData.report_name = updates.reportName;
            if (updates.reportType) updateData.report_type = updates.reportType;
            if (updates.frequency) updateData.frequency = updates.frequency;
            if (updates.scheduleTime) updateData.schedule_time = updates.scheduleTime;
            if (updates.scheduleDayOfWeek !== undefined) updateData.schedule_day_of_week = updates.scheduleDayOfWeek;
            if (updates.scheduleDayOfMonth !== undefined) updateData.schedule_day_of_month = updates.scheduleDayOfMonth;
            if (updates.timezone) updateData.timezone = updates.timezone;
            if (updates.recipients) updateData.recipients = updates.recipients;
            if (updates.ccEmails) updateData.cc_emails = updates.ccEmails;
            if (updates.includedMetrics) updateData.included_metrics = updates.includedMetrics;
            if (updates.includeCharts !== undefined) updateData.include_charts = updates.includeCharts;
            if (updates.includeCsvAttachment !== undefined) updateData.include_csv_attachment = updates.includeCsvAttachment;
            if (updates.projectFilter) updateData.project_filter = updates.projectFilter;
            if (updates.dateRangeDays) updateData.date_range_days = updates.dateRangeDays;

            const { error } = await supabase
                .from('scheduled_email_reports')
                .update(updateData)
                .eq('id', reportId)
                .eq('company_id', this.companyId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating report:', error);
            return false;
        }
    }

    /**
     * Toggle report active status
     */
    async toggleReportStatus(reportId: string, isActive: boolean): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('scheduled_email_reports')
                .update({
                    is_active: isActive,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId)
                .eq('company_id', this.companyId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error toggling report status:', error);
            return false;
        }
    }

    /**
     * Delete a scheduled report
     */
    async deleteReport(reportId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('scheduled_email_reports')
                .delete()
                .eq('id', reportId)
                .eq('company_id', this.companyId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting report:', error);
            return false;
        }
    }

    // ============================================
    // SEND REPORTS
    // ============================================

    /**
     * Send a report immediately (manual trigger)
     */
    async sendReportNow(reportId: string): Promise<boolean> {
        try {
            const report = await this.getReport(reportId);
            if (!report) return false;

            // Generate report data
            const reportData = await this.generateReportData(report);

            // In production, this would call an Edge Function or API to send email
            // For now, we'll log the email and mark as sent
            console.log('Sending report:', {
                to: report.recipients.map(r => r.email),
                cc: report.ccEmails,
                subject: this.formatSubject(report),
                data: reportData
            });

            // Log the email
            await supabase
                .from('email_report_log')
                .insert({
                    report_id: reportId,
                    company_id: this.companyId,
                    recipients: report.recipients.map(r => r.email),
                    subject: this.formatSubject(report),
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    report_data: reportData
                });

            // Update report last sent time
            await supabase
                .from('scheduled_email_reports')
                .update({
                    last_sent_at: new Date().toISOString(),
                    send_count: report.sendCount + 1,
                    next_scheduled_at: this.calculateNextScheduleFromReport(report)
                })
                .eq('id', reportId);

            return true;
        } catch (error) {
            console.error('Error sending report:', error);
            return false;
        }
    }

    /**
     * Generate report data based on configuration
     */
    async generateReportData(report: ScheduledReport): Promise<any> {
        const days = report.dateRangeDays;

        const [overview, timeSeries, geo, workers, status] = await Promise.all([
            analyticsService.getOverview(),
            analyticsService.getTimeSeries(days),
            analyticsService.getGeoDistribution(),
            analyticsService.getWorkerMetrics(10),
            analyticsService.getSubmissionStatus()
        ]);

        const reportData: any = {
            generatedAt: new Date().toISOString(),
            period: {
                days,
                start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
            }
        };

        // Include requested metrics
        if (report.includedMetrics.includes('submissions')) {
            reportData.submissions = {
                total: overview.totalSubmissions,
                approved: overview.totalApproved,
                timeSeries: timeSeries.map(d => ({ date: d.date, value: d.submissions }))
            };
        }

        if (report.includedMetrics.includes('accuracy')) {
            reportData.accuracy = {
                current: overview.avgAccuracy,
                trend: timeSeries.map(d => ({ date: d.date, value: d.accuracy }))
            };
        }

        if (report.includedMetrics.includes('workers')) {
            reportData.workers = {
                total: overview.totalWorkers,
                topPerformers: overview.topPerformers,
                topList: workers.slice(0, 5)
            };
        }

        if (report.includedMetrics.includes('spend')) {
            reportData.financial = {
                totalSpend: overview.totalSpend,
                trend: timeSeries.map(d => ({ date: d.date, value: d.spend }))
            };
        }

        if (report.includedMetrics.includes('geo')) {
            reportData.geographic = geo;
        }

        if (report.includedMetrics.includes('rejection_rate')) {
            const total = (status?.approved || 0) + (status?.rejected || 0) + (status?.pending || 0);
            reportData.rejectionRate = total > 0 ? ((status?.rejected || 0) / total * 100).toFixed(2) : 0;
        }

        return reportData;
    }

    /**
     * Get email send history
     */
    async getEmailHistory(reportId?: string, limit: number = 20): Promise<EmailLog[]> {
        try {
            let query = supabase
                .from('email_report_log')
                .select('*')
                .eq('company_id', this.companyId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (reportId) {
                query = query.eq('report_id', reportId);
            }

            const { data, error } = await query;

            if (data && !error) {
                return data.map(this.formatEmailLog);
            }
        } catch (error) {
            console.warn('Error fetching email history:', error);
        }

        return [];
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private formatReport(data: any): ScheduledReport {
        return {
            id: data.id,
            reportName: data.report_name,
            reportType: data.report_type,
            frequency: data.frequency,
            scheduleTime: data.schedule_time,
            scheduleDayOfWeek: data.schedule_day_of_week,
            scheduleDayOfMonth: data.schedule_day_of_month,
            timezone: data.timezone,
            recipients: data.recipients || [],
            ccEmails: data.cc_emails || [],
            includedMetrics: data.included_metrics || [],
            includeCharts: data.include_charts,
            includeCsvAttachment: data.include_csv_attachment,
            isActive: data.is_active,
            lastSentAt: data.last_sent_at,
            nextScheduledAt: data.next_scheduled_at,
            sendCount: data.send_count || 0,
            projectFilter: data.project_filter,
            dateRangeDays: data.date_range_days || 7
        };
    }

    private formatEmailLog(data: any): EmailLog {
        return {
            id: data.id,
            reportId: data.report_id,
            recipients: data.recipients,
            subject: data.subject,
            status: data.status,
            sentAt: data.sent_at,
            deliveredAt: data.delivered_at,
            openedAt: data.opened_at,
            errorMessage: data.error_message,
            createdAt: data.created_at
        };
    }

    private formatSubject(report: ScheduledReport): string {
        const date = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return `XUM Analytics Report - ${report.reportName} - ${date}`;
    }

    private calculateNextSchedule(input: CreateReportInput): string {
        const now = new Date();
        let next: Date;

        switch (input.frequency) {
            case 'daily':
                next = new Date(now);
                next.setHours(parseInt(input.scheduleTime.split(':')[0]), parseInt(input.scheduleTime.split(':')[1]), 0, 0);
                if (next <= now) next.setDate(next.getDate() + 1);
                break;

            case 'weekly':
                const dayOfWeek = input.scheduleDayOfWeek || 1;
                const currentDay = now.getDay() || 7;
                const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
                next = new Date(now);
                next.setDate(next.getDate() + daysUntil);
                next.setHours(parseInt(input.scheduleTime.split(':')[0]), parseInt(input.scheduleTime.split(':')[1]), 0, 0);
                break;

            case 'monthly':
                const dayOfMonth = input.scheduleDayOfMonth || 1;
                next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
                next.setHours(parseInt(input.scheduleTime.split(':')[0]), parseInt(input.scheduleTime.split(':')[1]), 0, 0);
                if (next <= now) next.setMonth(next.getMonth() + 1);
                break;

            default:
                next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }

        return next.toISOString();
    }

    private calculateNextScheduleFromReport(report: ScheduledReport): string {
        return this.calculateNextSchedule({
            reportName: report.reportName,
            reportType: report.reportType,
            frequency: report.frequency,
            scheduleTime: report.scheduleTime,
            scheduleDayOfWeek: report.scheduleDayOfWeek || undefined,
            scheduleDayOfMonth: report.scheduleDayOfMonth || undefined,
            timezone: report.timezone,
            recipients: report.recipients
        });
    }

    private getMockReports(): ScheduledReport[] {
        return [
            {
                id: 'report-1',
                reportName: 'Daily Analytics Summary',
                reportType: 'daily_digest',
                frequency: 'daily',
                scheduleTime: '09:00',
                scheduleDayOfWeek: null,
                scheduleDayOfMonth: null,
                timezone: 'Africa/Lagos',
                recipients: [{ email: 'analytics@company.com', name: 'Analytics Team' }],
                ccEmails: [],
                includedMetrics: ['submissions', 'accuracy', 'workers', 'spend'],
                includeCharts: true,
                includeCsvAttachment: true,
                isActive: true,
                lastSentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                nextScheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
                sendCount: 42,
                projectFilter: null,
                dateRangeDays: 1
            },
            {
                id: 'report-2',
                reportName: 'Weekly Performance Review',
                reportType: 'weekly_summary',
                frequency: 'weekly',
                scheduleTime: '10:00',
                scheduleDayOfWeek: 1,
                scheduleDayOfMonth: null,
                timezone: 'Africa/Lagos',
                recipients: [
                    { email: 'manager@company.com', name: 'Project Manager' },
                    { email: 'ops@company.com', name: 'Operations' }
                ],
                ccEmails: ['ceo@company.com'],
                includedMetrics: ['submissions', 'accuracy', 'workers', 'spend', 'trends', 'geo'],
                includeCharts: true,
                includeCsvAttachment: true,
                isActive: true,
                lastSentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                nextScheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                sendCount: 12,
                projectFilter: null,
                dateRangeDays: 7
            },
            {
                id: 'report-3',
                reportName: 'Quality Alerts',
                reportType: 'anomaly_report',
                frequency: 'realtime',
                scheduleTime: '00:00',
                scheduleDayOfWeek: null,
                scheduleDayOfMonth: null,
                timezone: 'Africa/Lagos',
                recipients: [{ email: 'quality@company.com', name: 'Quality Team' }],
                ccEmails: [],
                includedMetrics: ['alerts', 'accuracy', 'rejection_rate'],
                includeCharts: false,
                includeCsvAttachment: false,
                isActive: true,
                lastSentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                nextScheduledAt: null,
                sendCount: 8,
                projectFilter: null,
                dateRangeDays: 1
            }
        ];
    }
}

export const emailReportsService = new EmailReportsService();
export default emailReportsService;
