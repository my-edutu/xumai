import React, { useState, useEffect } from 'react';
import {
    Bell,
    Mail,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Info,
    Plus,
    Settings,
    Clock,
    Calendar,
    Users,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    X,
    Edit2,
    Trash2,
    Play,
    Pause,
    Send,
    Eye,
    Filter,
    Search,
    Loader2,
    Shield,
    Zap,
    BarChart3
} from 'lucide-react';
import {
    realtimeAnalyticsService,
    AnomalyAlert,
    AnomalyThresholds
} from '../services/realtimeAnalyticsService';
import {
    emailReportsService,
    ScheduledReport,
    CreateReportInput,
    REPORT_TEMPLATES,
    AVAILABLE_METRICS,
    ReportType,
    ReportFrequency
} from '../services/emailReportsService';

type ActiveTab = 'alerts' | 'reports' | 'settings';

export default function AlertsAndReports() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('alerts');
    const [isLoading, setIsLoading] = useState(true);

    // Alerts State
    const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
    const [alertFilter, setAlertFilter] = useState<'all' | 'active' | 'critical'>('active');

    // Reports State
    const [reports, setReports] = useState<ScheduledReport[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Settings State
    const [thresholds, setThresholds] = useState<AnomalyThresholds | null>(null);

    // Real-time stats
    const [realtimeStats, setRealtimeStats] = useState<any>(null);

    useEffect(() => {
        loadData();

        // Set up real-time subscriptions
        realtimeAnalyticsService.startStatsPolling(stats => {
            setRealtimeStats(stats);
        }, 30000);

        realtimeAnalyticsService.subscribeToAlerts(alert => {
            setAlerts(prev => [alert, ...prev]);
        });

        return () => {
            realtimeAnalyticsService.unsubscribeAll();
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [alertsData, reportsData, thresholdsData] = await Promise.all([
                realtimeAnalyticsService.getActiveAlerts(),
                emailReportsService.getScheduledReports(),
                realtimeAnalyticsService.getThresholds()
            ]);

            setAlerts(alertsData);
            setReports(reportsData);
            setThresholds(thresholdsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        const success = await realtimeAnalyticsService.acknowledgeAlert(alertId);
        if (success) {
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, status: 'acknowledged' } : a
            ));
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        const success = await realtimeAnalyticsService.resolveAlert(alertId);
        if (success) {
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, status: 'resolved' } : a
            ));
        }
    };

    const handleDismissAlert = async (alertId: string) => {
        const success = await realtimeAnalyticsService.dismissAlert(alertId);
        if (success) {
            setAlerts(prev => prev.filter(a => a.id !== alertId));
        }
    };

    const handleToggleReport = async (reportId: string, isActive: boolean) => {
        const success = await emailReportsService.toggleReportStatus(reportId, isActive);
        if (success) {
            setReports(prev => prev.map(r =>
                r.id === reportId ? { ...r, isActive } : r
            ));
        }
    };

    const handleSendReportNow = async (reportId: string) => {
        const success = await emailReportsService.sendReportNow(reportId);
        if (success) {
            await loadData(); // Refresh to get updated send count
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (window.confirm('Are you sure you want to delete this scheduled report?')) {
            const success = await emailReportsService.deleteReport(reportId);
            if (success) {
                setReports(prev => prev.filter(r => r.id !== reportId));
            }
        }
    };

    const handleSaveThresholds = async (newThresholds: AnomalyThresholds) => {
        const success = await realtimeAnalyticsService.updateThresholds(newThresholds);
        if (success) {
            setThresholds(newThresholds);
        }
    };

    const filteredAlerts = alerts.filter(alert => {
        if (alertFilter === 'active') return alert.status === 'active';
        if (alertFilter === 'critical') return alert.severity === 'critical';
        return true;
    });

    const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
    const criticalAlertsCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-slate-400">Loading alerts & reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold outfit flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl">
                            <Bell className="text-red-500" size={28} />
                        </div>
                        Alerts & Reports
                    </h1>
                    <p className="text-slate-400 mt-2">Monitor anomalies and manage scheduled email reports.</p>
                </div>

                <div className="flex gap-3">
                    {activeAlertsCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
                            <AlertTriangle size={16} />
                            <span className="font-bold">{activeAlertsCount} Active Alerts</span>
                            {criticalAlertsCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                    {criticalAlertsCount} Critical
                                </span>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-900/20 hover:bg-orange-500 transition-all"
                    >
                        <Plus size={16} />
                        New Report
                    </button>
                </div>
            </header>

            {/* Real-time Stats Bar */}
            {realtimeStats && (
                <div className="glass-card p-4 flex items-center gap-6 overflow-x-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-slate-400 font-medium">Live</span>
                    </div>
                    <StatItem label="Submissions (24h)" value={realtimeStats.totalSubmissions} />
                    <StatItem label="Approved" value={realtimeStats.approvedCount} color="text-green-500" />
                    <StatItem label="Rejected" value={realtimeStats.rejectedCount} color="text-red-500" />
                    <StatItem label="Accuracy" value={`${realtimeStats.avgAccuracy?.toFixed(1)}%`} color="text-blue-500" />
                    <StatItem label="Active Workers" value={realtimeStats.activeWorkers} color="text-purple-500" />
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-white/10 pb-4">
                <TabButton
                    active={activeTab === 'alerts'}
                    onClick={() => setActiveTab('alerts')}
                    icon={<AlertTriangle size={18} />}
                    label="Alerts"
                    badge={activeAlertsCount > 0 ? activeAlertsCount : undefined}
                />
                <TabButton
                    active={activeTab === 'reports'}
                    onClick={() => setActiveTab('reports')}
                    icon={<Mail size={18} />}
                    label="Email Reports"
                    badge={reports.filter(r => r.isActive).length}
                />
                <TabButton
                    active={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                    icon={<Settings size={18} />}
                    label="Thresholds"
                />
            </div>

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
                <div className="space-y-4">
                    {/* Alert Filters */}
                    <div className="flex gap-2">
                        {(['active', 'critical', 'all'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setAlertFilter(filter)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${alertFilter === filter
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {filter === 'active' ? '🔔 Active' : filter === 'critical' ? '🚨 Critical' : '📋 All'}
                            </button>
                        ))}
                    </div>

                    {/* Alerts List */}
                    <div className="space-y-3">
                        {filteredAlerts.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold">All Clear!</h3>
                                <p className="text-slate-400 text-sm mt-2">No {alertFilter} alerts at this time.</p>
                            </div>
                        ) : (
                            filteredAlerts.map(alert => (
                                <AlertCard
                                    key={alert.id}
                                    alert={alert}
                                    onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                                    onResolve={() => handleResolveAlert(alert.id)}
                                    onDismiss={() => handleDismissAlert(alert.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="space-y-4">
                    {/* Report Templates */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {REPORT_TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                onClick={() => setShowCreateModal(true)}
                                className="glass-card p-4 text-center hover:border-orange-500/30 transition-all group"
                            >
                                <span className="text-2xl">{template.icon}</span>
                                <p className="text-xs font-bold mt-2 group-hover:text-orange-500 transition-colors">
                                    {template.name}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Reports List */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-lg font-bold">Scheduled Reports</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {reports.map(report => (
                                <ReportRow
                                    key={report.id}
                                    report={report}
                                    onToggle={(isActive) => handleToggleReport(report.id, isActive)}
                                    onSendNow={() => handleSendReportNow(report.id)}
                                    onDelete={() => handleDeleteReport(report.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && thresholds && (
                <ThresholdsSettings
                    thresholds={thresholds}
                    onSave={handleSaveThresholds}
                />
            )}

            {/* Create Report Modal */}
            {showCreateModal && (
                <CreateReportModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={async (input) => {
                        const report = await emailReportsService.createReport(input);
                        if (report) {
                            setReports(prev => [report, ...prev]);
                            setShowCreateModal(false);
                        }
                    }}
                />
            )}
        </div>
    );
}

// ============================================
// Sub-components
// ============================================

function StatItem({ label, value, color = 'text-white' }: { label: string; value: any; color?: string }) {
    return (
        <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-xs text-slate-500">{label}:</span>
            <span className={`font-bold ${color}`}>{value}</span>
        </div>
    );
}

function TabButton({ active, onClick, icon, label, badge }: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all relative ${active
                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            {label}
            {badge !== undefined && badge > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-orange-600 text-white text-xs font-bold rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );
}

function AlertCard({ alert, onAcknowledge, onResolve, onDismiss }: {
    alert: AnomalyAlert;
    onAcknowledge: () => void;
    onResolve: () => void;
    onDismiss: () => void;
}) {
    const getSeverityStyles = () => {
        switch (alert.severity) {
            case 'critical': return 'border-l-red-500 bg-red-500/5';
            case 'warning': return 'border-l-yellow-500 bg-yellow-500/5';
            default: return 'border-l-blue-500 bg-blue-500/5';
        }
    };

    const getSeverityIcon = () => {
        switch (alert.severity) {
            case 'critical': return <AlertTriangle className="text-red-500" size={20} />;
            case 'warning': return <AlertCircle className="text-yellow-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return `${minutes}m ago`;
    };

    return (
        <div className={`glass-card p-4 border-l-4 ${getSeverityStyles()}`}>
            <div className="flex items-start gap-4">
                <div className="p-2 bg-white/5 rounded-lg">
                    {getSeverityIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold">{alert.title}</h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${alert.status === 'active' ? 'bg-red-500/20 text-red-500' :
                                alert.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-green-500/20 text-green-500'
                            }`}>
                            {alert.status}
                        </span>
                    </div>
                    <p className="text-sm text-slate-400">{alert.description}</p>
                    {alert.metricValue !== null && (
                        <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-slate-500">
                                Current: <span className="font-bold text-white">{alert.metricValue}</span>
                            </span>
                            {alert.thresholdValue !== null && (
                                <span className="text-slate-500">
                                    Threshold: <span className="font-bold text-red-400">{alert.thresholdValue}</span>
                                </span>
                            )}
                        </div>
                    )}
                    {alert.workerName && (
                        <p className="text-xs text-purple-500 mt-1">Worker: {alert.workerName}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500">{getTimeAgo(alert.createdAt)}</p>
                    {alert.status === 'active' && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={onAcknowledge}
                                className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs font-bold hover:bg-yellow-500/20 transition-all"
                            >
                                Acknowledge
                            </button>
                            <button
                                onClick={onResolve}
                                className="px-3 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold hover:bg-green-500/20 transition-all"
                            >
                                Resolve
                            </button>
                            <button
                                onClick={onDismiss}
                                className="p-1 text-slate-500 hover:text-red-500 transition-all"
                                title="Dismiss"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReportRow({ report, onToggle, onSendNow, onDelete }: {
    report: ScheduledReport;
    onToggle: (isActive: boolean) => void;
    onSendNow: () => void;
    onDelete: () => void;
}) {
    const template = REPORT_TEMPLATES.find(t => t.id === report.reportType);

    const getFrequencyLabel = () => {
        switch (report.frequency) {
            case 'daily': return `Daily at ${report.scheduleTime}`;
            case 'weekly': return `Weekly on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][report.scheduleDayOfWeek || 0]} at ${report.scheduleTime}`;
            case 'monthly': return `Monthly on day ${report.scheduleDayOfMonth} at ${report.scheduleTime}`;
            case 'realtime': return 'Real-time (instant)';
            default: return report.frequency;
        }
    };

    return (
        <div className="p-4 flex items-center gap-4 hover:bg-white/5 transition-all">
            <div className="text-2xl">{template?.icon || '📊'}</div>
            <div className="flex-1">
                <h4 className="font-bold">{report.reportName}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {getFrequencyLabel()}
                    </span>
                    <span className="flex items-center gap-1">
                        <Mail size={12} />
                        {report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}
                    </span>
                    <span>
                        {report.sendCount} sent
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {report.nextScheduledAt && report.isActive && (
                    <span className="text-xs text-slate-500">
                        Next: {new Date(report.nextScheduledAt).toLocaleDateString()}
                    </span>
                )}
                <button
                    onClick={() => onToggle(!report.isActive)}
                    className={`p-2 rounded-lg transition-all ${report.isActive ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                        }`}
                    title={report.isActive ? 'Pause' : 'Activate'}
                >
                    {report.isActive ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                    onClick={onSendNow}
                    className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-all"
                    title="Send Now"
                >
                    <Send size={16} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

function ThresholdsSettings({ thresholds, onSave }: {
    thresholds: AnomalyThresholds;
    onSave: (thresholds: AnomalyThresholds) => void;
}) {
    const [local, setLocal] = useState(thresholds);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(local);
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            {/* Quality Thresholds */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap className="text-green-500" size={20} />
                    Quality Thresholds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ThresholdInput
                        label="Minimum Accuracy (%)"
                        value={local.minAccuracyThreshold}
                        onChange={(v) => setLocal({ ...local, minAccuracyThreshold: v })}
                        min={50}
                        max={100}
                        description="Alert when accuracy falls below this threshold"
                    />
                    <ThresholdInput
                        label="Accuracy Drop Alert (%)"
                        value={local.accuracyDropThreshold}
                        onChange={(v) => setLocal({ ...local, accuracyDropThreshold: v })}
                        min={1}
                        max={50}
                        description="Alert when accuracy drops by this percentage"
                    />
                    <ThresholdInput
                        label="Max Rejection Rate (%)"
                        value={local.maxRejectionRate}
                        onChange={(v) => setLocal({ ...local, maxRejectionRate: v })}
                        min={1}
                        max={100}
                        description="Alert when rejection rate exceeds this"
                    />
                    <ThresholdInput
                        label="Min Worker Accuracy (%)"
                        value={local.minWorkerAccuracy}
                        onChange={(v) => setLocal({ ...local, minWorkerAccuracy: v })}
                        min={50}
                        max={100}
                        description="Flag workers below this accuracy"
                    />
                </div>
            </div>

            {/* Volume Thresholds */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="text-blue-500" size={20} />
                    Volume & Time Thresholds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ThresholdInput
                        label="Min Daily Submissions"
                        value={local.minDailySubmissions}
                        onChange={(v) => setLocal({ ...local, minDailySubmissions: v })}
                        min={0}
                        max={10000}
                        description="Alert when daily submissions fall below this"
                    />
                    <ThresholdInput
                        label="Max Turnaround (hours)"
                        value={local.maxTurnaroundHours}
                        onChange={(v) => setLocal({ ...local, maxTurnaroundHours: v })}
                        min={1}
                        max={168}
                        description="Alert when turnaround exceeds this"
                    />
                    <ThresholdInput
                        label="Inactivity Alert (hours)"
                        value={local.inactivityAlertHours}
                        onChange={(v) => setLocal({ ...local, inactivityAlertHours: v })}
                        min={1}
                        max={168}
                        description="Alert after this period of no activity"
                    />
                    <ThresholdInput
                        label="Suspicious Speed (tasks/min)"
                        value={local.suspiciousSpeedThreshold}
                        onChange={(v) => setLocal({ ...local, suspiciousSpeedThreshold: v })}
                        min={1}
                        max={100}
                        description="Flag workers submitting faster than this"
                    />
                </div>
            </div>

            {/* Notification Settings */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bell className="text-orange-500" size={20} />
                    Notification Settings
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <h4 className="font-medium">Critical Alerts</h4>
                            <p className="text-xs text-slate-400">Get notified for critical severity alerts</p>
                        </div>
                        <ToggleSwitch
                            checked={local.notifyOnCritical}
                            onChange={(v) => setLocal({ ...local, notifyOnCritical: v })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                            <h4 className="font-medium">Warning Alerts</h4>
                            <p className="text-xs text-slate-400">Get notified for warning severity alerts</p>
                        </div>
                        <ToggleSwitch
                            checked={local.notifyOnWarning}
                            onChange={(v) => setLocal({ ...local, notifyOnWarning: v })}
                        />
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                        <label className="block text-sm font-medium mb-2">Notification Email</label>
                        <input
                            type="email"
                            value={local.notifyEmail || ''}
                            onChange={(e) => setLocal({ ...local, notifyEmail: e.target.value })}
                            placeholder="alerts@company.com"
                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-900/20 hover:bg-orange-500 transition-all disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                    Save Thresholds
                </button>
            </div>
        </div>
    );
}

function ThresholdInput({ label, value, onChange, min, max, description }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    description: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <p className="text-[10px] text-slate-500 mt-1">{description}</p>
        </div>
    );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full transition-all ${checked ? 'bg-orange-600' : 'bg-slate-700'}`}
        >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? 'ml-6' : 'ml-0.5'}`} />
        </button>
    );
}

function CreateReportModal({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: (input: CreateReportInput) => void;
}) {
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<ReportType>('daily_digest');
    const [form, setForm] = useState({
        reportName: '',
        frequency: 'daily' as ReportFrequency,
        scheduleTime: '09:00',
        scheduleDayOfWeek: 1,
        scheduleDayOfMonth: 1,
        timezone: 'Africa/Lagos',
        recipientEmail: '',
        recipientName: '',
        includedMetrics: [] as string[],
        includeCharts: true,
        includeCsvAttachment: true
    });

    const template = REPORT_TEMPLATES.find(t => t.id === selectedTemplate);

    const handleCreate = () => {
        onCreate({
            reportName: form.reportName || template?.name || 'Custom Report',
            reportType: selectedTemplate,
            frequency: form.frequency,
            scheduleTime: form.scheduleTime,
            scheduleDayOfWeek: form.frequency === 'weekly' ? form.scheduleDayOfWeek : undefined,
            scheduleDayOfMonth: form.frequency === 'monthly' ? form.scheduleDayOfMonth : undefined,
            timezone: form.timezone,
            recipients: [{ email: form.recipientEmail, name: form.recipientName || 'Recipient' }],
            includedMetrics: form.includedMetrics.length > 0 ? form.includedMetrics : template?.defaultMetrics,
            includeCharts: form.includeCharts,
            includeCsvAttachment: form.includeCsvAttachment
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Create Scheduled Report</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {step === 1 && (
                        <>
                            <h3 className="font-bold">1. Select Report Type</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {REPORT_TEMPLATES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t.id)}
                                        className={`p-4 rounded-xl border-2 text-center transition-all ${selectedTemplate === t.id
                                                ? 'border-orange-500 bg-orange-500/10'
                                                : 'border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        <span className="text-2xl">{t.icon}</span>
                                        <p className="text-xs font-bold mt-2">{t.name}</p>
                                    </button>
                                ))}
                            </div>
                            {template && (
                                <p className="text-sm text-slate-400">{template.description}</p>
                            )}
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <h3 className="font-bold">2. Schedule & Recipients</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Report Name</label>
                                    <input
                                        type="text"
                                        value={form.reportName}
                                        onChange={(e) => setForm({ ...form, reportName: e.target.value })}
                                        placeholder={template?.name}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Frequency</label>
                                    <select
                                        value={form.frequency}
                                        onChange={(e) => setForm({ ...form, frequency: e.target.value as ReportFrequency })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={form.scheduleTime}
                                        onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2"
                                    />
                                </div>
                                {form.frequency === 'weekly' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Day of Week</label>
                                        <select
                                            value={form.scheduleDayOfWeek}
                                            onChange={(e) => setForm({ ...form, scheduleDayOfWeek: Number(e.target.value) })}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2"
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                                                <option key={day} value={i + 1}>{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Recipient Email</label>
                                    <input
                                        type="email"
                                        value={form.recipientEmail}
                                        onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                                        placeholder="email@company.com"
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Recipient Name</label>
                                    <input
                                        type="text"
                                        value={form.recipientName}
                                        onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                                        placeholder="Team Lead"
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.includeCharts}
                                        onChange={(e) => setForm({ ...form, includeCharts: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Include Charts</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.includeCsvAttachment}
                                        onChange={(e) => setForm({ ...form, includeCsvAttachment: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Include CSV Attachment</span>
                                </label>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 flex justify-between">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}
                    {step < 2 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold"
                        >
                            Create Report
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
