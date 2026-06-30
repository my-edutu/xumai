import { supabase } from '../utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// Types for Real-Time Analytics
// ============================================

export interface RealtimeStats {
    totalSubmissions: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    avgAccuracy: number;
    activeWorkers: number;
    lastSubmissionAt: string | null;
}

export interface AnomalyAlert {
    id: string;
    type: 'accuracy_drop' | 'high_rejection' | 'suspicious_activity' | 'inactivity' | 'threshold_breach' | 'quality_anomaly' | 'volume_spike' | 'worker_flagged';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    metricValue: number | null;
    thresholdValue: number | null;
    status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
    workerName?: string;
    createdAt: string;
}

export interface AnomalyThresholds {
    minAccuracyThreshold: number;
    accuracyDropThreshold: number;
    minDailySubmissions: number;
    maxRejectionRate: number;
    maxTurnaroundHours: number;
    inactivityAlertHours: number;
    minWorkerAccuracy: number;
    suspiciousSpeedThreshold: number;
    notifyOnCritical: boolean;
    notifyOnWarning: boolean;
    notifyEmail: string | null;
}

export interface ScheduledReport {
    id: string;
    reportName: string;
    reportType: 'daily_digest' | 'weekly_summary' | 'monthly_overview' | 'anomaly_report' | 'worker_performance' | 'financial_summary' | 'custom';
    frequency: 'daily' | 'weekly' | 'monthly' | 'realtime';
    scheduleTime: string;
    scheduleDayOfWeek: number | null;
    scheduleDayOfMonth: number | null;
    timezone: string;
    recipients: { email: string; name: string }[];
    includedMetrics: string[];
    includeCharts: boolean;
    includeCsvAttachment: boolean;
    isActive: boolean;
    lastSentAt: string | null;
    nextScheduledAt: string | null;
    sendCount: number;
}

export interface RealtimeCallback {
    onSubmission?: (submission: any) => void;
    onAlert?: (alert: AnomalyAlert) => void;
    onStatsUpdate?: (stats: RealtimeStats) => void;
    onError?: (error: Error) => void;
}

// ============================================
// Real-Time Analytics Service
// ============================================

class RealtimeAnalyticsService {
    private companyId: string | null = null;
    private channels: Map<string, RealtimeChannel> = new Map();
    private callbacks: RealtimeCallback = {};
    private statsPollingInterval: NodeJS.Timer | null = null;
    private anomalyCheckInterval: NodeJS.Timer | null = null;

    setCompanyId(id: string) {
        this.companyId = id;
    }

    // ============================================
    // REAL-TIME SUBSCRIPTIONS
    // ============================================

    /**
     * Subscribe to real-time submission updates
     */
    subscribeToSubmissions(callbacks: RealtimeCallback): RealtimeChannel {
        this.callbacks = { ...this.callbacks, ...callbacks };

        const channel = supabase
            .channel('submissions-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'submissions'
                },
                (payload) => {
                    console.log('New submission:', payload.new);
                    callbacks.onSubmission?.(payload.new);
                    this.refreshStats();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'submissions'
                },
                (payload) => {
                    console.log('Submission updated:', payload.new);
                    callbacks.onSubmission?.(payload.new);
                    this.refreshStats();
                }
            )
            .subscribe((status) => {
                console.log('Submissions channel status:', status);
            });

        this.channels.set('submissions', channel);
        return channel;
    }

    /**
     * Subscribe to anomaly alerts
     */
    subscribeToAlerts(onAlert: (alert: AnomalyAlert) => void): RealtimeChannel {
        this.callbacks.onAlert = onAlert;

        const channel = supabase
            .channel('alerts-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'anomaly_alerts',
                    filter: `company_id=eq.${this.companyId}`
                },
                (payload) => {
                    const alert = this.formatAlert(payload.new);
                    console.log('New alert:', alert);
                    onAlert(alert);
                }
            )
            .subscribe((status) => {
                console.log('Alerts channel status:', status);
            });

        this.channels.set('alerts', channel);
        return channel;
    }

    /**
     * Start polling for real-time stats (fallback if websockets unavailable)
     */
    startStatsPolling(onUpdate: (stats: RealtimeStats) => void, intervalMs: number = 30000) {
        this.callbacks.onStatsUpdate = onUpdate;

        // Initial fetch
        this.refreshStats();

        // Set up polling interval
        this.statsPollingInterval = setInterval(() => {
            this.refreshStats();
        }, intervalMs);
    }

    /**
     * Start periodic anomaly detection checks
     */
    startAnomalyDetection(intervalMs: number = 60000) {
        // Initial check
        this.checkForAnomalies();

        // Set up periodic checks
        this.anomalyCheckInterval = setInterval(() => {
            this.checkForAnomalies();
        }, intervalMs);
    }

    /**
     * Refresh real-time stats
     */
    async refreshStats(): Promise<RealtimeStats | null> {
        try {
            const { data, error } = await supabase
                .from('v_realtime_submission_stats')
                .select('*')
                .eq('company_id', this.companyId)
                .single();

            if (error) throw error;

            const stats: RealtimeStats = {
                totalSubmissions: data?.total_submissions || 0,
                approvedCount: data?.approved_count || 0,
                rejectedCount: data?.rejected_count || 0,
                pendingCount: data?.pending_count || 0,
                avgAccuracy: data?.avg_accuracy || 0,
                activeWorkers: data?.active_workers || 0,
                lastSubmissionAt: data?.last_submission_at || null
            };

            this.callbacks.onStatsUpdate?.(stats);
            return stats;
        } catch (error) {
            console.warn('Using mock realtime stats:', error);
            // Return mock data for development
            const mockStats: RealtimeStats = {
                totalSubmissions: Math.floor(Math.random() * 500) + 100,
                approvedCount: Math.floor(Math.random() * 400) + 80,
                rejectedCount: Math.floor(Math.random() * 50) + 10,
                pendingCount: Math.floor(Math.random() * 50) + 10,
                avgAccuracy: 85 + Math.random() * 13,
                activeWorkers: Math.floor(Math.random() * 50) + 10,
                lastSubmissionAt: new Date().toISOString()
            };
            this.callbacks.onStatsUpdate?.(mockStats);
            return mockStats;
        }
    }

    /**
     * Unsubscribe from all channels and stop polling
     */
    unsubscribeAll() {
        this.channels.forEach((channel, key) => {
            supabase.removeChannel(channel);
            this.channels.delete(key);
        });

        if (this.statsPollingInterval) {
            clearInterval(this.statsPollingInterval);
            this.statsPollingInterval = null;
        }

        if (this.anomalyCheckInterval) {
            clearInterval(this.anomalyCheckInterval);
            this.anomalyCheckInterval = null;
        }
    }

    // ============================================
    // ANOMALY DETECTION
    // ============================================

    /**
     * Get current anomaly thresholds
     */
    async getThresholds(): Promise<AnomalyThresholds> {
        try {
            const { data, error } = await supabase
                .from('anomaly_thresholds')
                .select('*')
                .eq('company_id', this.companyId)
                .single();

            if (data) {
                return {
                    minAccuracyThreshold: data.min_accuracy_threshold || 85,
                    accuracyDropThreshold: data.accuracy_drop_threshold || 5,
                    minDailySubmissions: data.min_daily_submissions || 100,
                    maxRejectionRate: data.max_rejection_rate || 15,
                    maxTurnaroundHours: data.max_turnaround_hours || 48,
                    inactivityAlertHours: data.inactivity_alert_hours || 24,
                    minWorkerAccuracy: data.min_worker_accuracy || 80,
                    suspiciousSpeedThreshold: data.suspicious_speed_threshold || 5,
                    notifyOnCritical: data.notify_on_critical ?? true,
                    notifyOnWarning: data.notify_on_warning ?? true,
                    notifyEmail: data.notify_email || null
                };
            }
        } catch (error) {
            console.warn('Error fetching thresholds:', error);
        }

        // Default thresholds
        return {
            minAccuracyThreshold: 85,
            accuracyDropThreshold: 5,
            minDailySubmissions: 100,
            maxRejectionRate: 15,
            maxTurnaroundHours: 48,
            inactivityAlertHours: 24,
            minWorkerAccuracy: 80,
            suspiciousSpeedThreshold: 5,
            notifyOnCritical: true,
            notifyOnWarning: true,
            notifyEmail: null
        };
    }

    /**
     * Update anomaly thresholds
     */
    async updateThresholds(thresholds: Partial<AnomalyThresholds>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('anomaly_thresholds')
                .upsert({
                    company_id: this.companyId,
                    min_accuracy_threshold: thresholds.minAccuracyThreshold,
                    accuracy_drop_threshold: thresholds.accuracyDropThreshold,
                    min_daily_submissions: thresholds.minDailySubmissions,
                    max_rejection_rate: thresholds.maxRejectionRate,
                    max_turnaround_hours: thresholds.maxTurnaroundHours,
                    inactivity_alert_hours: thresholds.inactivityAlertHours,
                    min_worker_accuracy: thresholds.minWorkerAccuracy,
                    suspicious_speed_threshold: thresholds.suspiciousSpeedThreshold,
                    notify_on_critical: thresholds.notifyOnCritical,
                    notify_on_warning: thresholds.notifyOnWarning,
                    notify_email: thresholds.notifyEmail,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating thresholds:', error);
            return false;
        }
    }

    /**
     * Get active alerts
     */
    async getActiveAlerts(limit: number = 20): Promise<AnomalyAlert[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_company_alerts', {
                    p_company_id: this.companyId,
                    p_status: 'active',
                    p_limit: limit
                });

            if (data && !error) {
                return data.map(this.formatAlert);
            }
        } catch (error) {
            console.warn('Using mock alerts:', error);
        }

        // Return mock alerts for development
        return this.generateMockAlerts();
    }

    /**
     * Get all alerts (including resolved)
     */
    async getAllAlerts(limit: number = 50): Promise<AnomalyAlert[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_company_alerts', {
                    p_company_id: this.companyId,
                    p_status: null,
                    p_limit: limit
                });

            if (data && !error) {
                return data.map(this.formatAlert);
            }
        } catch (error) {
            console.warn('Error fetching all alerts:', error);
        }

        return this.generateMockAlerts();
    }

    /**
     * Acknowledge an alert
     */
    async acknowledgeAlert(alertId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('anomaly_alerts')
                .update({
                    status: 'acknowledged',
                    acknowledged_at: new Date().toISOString()
                })
                .eq('id', alertId)
                .eq('company_id', this.companyId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            return false;
        }
    }

    /**
     * Resolve an alert
     */
    async resolveAlert(alertId: string, notes?: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('anomaly_alerts')
                .update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString(),
                    resolution_notes: notes
                })
                .eq('id', alertId)
                .eq('company_id', this.companyId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error resolving alert:', error);
            return false;
        }
    }

    /**
     * Dismiss an alert
     */
    async dismissAlert(alertId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('anomaly_alerts')
                .update({
                    status: 'dismissed'
                })
                .eq('id', alertId)
                .eq('company_id', this.companyId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error dismissing alert:', error);
            return false;
        }
    }

    /**
     * Check for anomalies and create alerts
     */
    private async checkForAnomalies(): Promise<void> {
        try {
            // Check accuracy anomalies
            const { data: accuracyData } = await supabase
                .rpc('check_accuracy_anomalies');

            if (accuracyData) {
                for (const row of accuracyData) {
                    if (row.should_alert && row.company_id === this.companyId) {
                        // Create an alert in memory and notify
                        const alert: AnomalyAlert = {
                            id: crypto.randomUUID(),
                            type: 'accuracy_drop',
                            severity: row.accuracy_drop > 10 ? 'critical' : 'warning',
                            title: 'Accuracy Drop Detected',
                            description: `Accuracy dropped from ${row.previous_accuracy}% to ${row.current_accuracy}% (-${row.accuracy_drop.toFixed(1)}%)`,
                            metricValue: row.current_accuracy,
                            thresholdValue: row.previous_accuracy,
                            status: 'active',
                            createdAt: new Date().toISOString()
                        };
                        this.callbacks.onAlert?.(alert);
                    }
                }
            }

            // Check suspicious activity
            const { data: suspiciousData } = await supabase
                .rpc('check_suspicious_activity');

            if (suspiciousData) {
                for (const row of suspiciousData) {
                    if (row.is_suspicious && row.company_id === this.companyId) {
                        const alert: AnomalyAlert = {
                            id: crypto.randomUUID(),
                            type: 'suspicious_activity',
                            severity: 'warning',
                            title: 'Suspicious Activity Detected',
                            description: `Worker ${row.worker_name} is submitting at ${row.submissions_per_minute} submissions/minute`,
                            metricValue: row.submissions_per_minute,
                            thresholdValue: 5,
                            status: 'active',
                            workerName: row.worker_name,
                            createdAt: new Date().toISOString()
                        };
                        this.callbacks.onAlert?.(alert);
                    }
                }
            }
        } catch (error) {
            console.warn('Anomaly detection check failed:', error);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private formatAlert(data: any): AnomalyAlert {
        return {
            id: data.id,
            type: data.type || data.alert_type,
            severity: data.severity,
            title: data.title,
            description: data.description,
            metricValue: data.metric_value,
            thresholdValue: data.threshold_value,
            status: data.status,
            workerName: data.worker_name,
            createdAt: data.created_at
        };
    }

    private generateMockAlerts(): AnomalyAlert[] {
        return [
            {
                id: 'alert-1',
                type: 'accuracy_drop',
                severity: 'warning',
                title: 'Accuracy Drop Detected',
                description: 'Quality score dropped from 96.5% to 91.2% in the last 24 hours',
                metricValue: 91.2,
                thresholdValue: 95,
                status: 'active',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'alert-2',
                type: 'high_rejection',
                severity: 'warning',
                title: 'High Rejection Rate',
                description: 'Rejection rate increased to 18% for Task Set #42',
                metricValue: 18,
                thresholdValue: 15,
                status: 'active',
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'alert-3',
                type: 'suspicious_activity',
                severity: 'critical',
                title: 'Suspicious Worker Activity',
                description: 'Worker Kofi M. is submitting at 8 tasks/minute (threshold: 5)',
                metricValue: 8,
                thresholdValue: 5,
                status: 'active',
                workerName: 'Kofi Mensah',
                createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            },
            {
                id: 'alert-4',
                type: 'quality_anomaly',
                severity: 'info',
                title: 'Quality Improvement',
                description: 'Swahili NLP project accuracy improved by 5.2%',
                metricValue: 98.1,
                thresholdValue: 92.9,
                status: 'acknowledged',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }
}

export const realtimeAnalyticsService = new RealtimeAnalyticsService();
export default realtimeAnalyticsService;
