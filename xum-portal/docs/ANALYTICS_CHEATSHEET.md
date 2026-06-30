# XUM Analytics - Quick Reference Cheatsheet

> Quick reference for developers working with the XUM Company Portal Analytics System

---

## 🚀 Quick Start

```typescript
// 1. Import services
import analyticsService from '@/services/analyticsService';
import realtimeAnalyticsService from '@/services/realtimeAnalyticsService';
import emailReportsService from '@/services/emailReportsService';

// 2. Set company context
analyticsService.setCompanyId(companyId);
realtimeAnalyticsService.setCompanyId(companyId);
emailReportsService.setCompanyId(companyId);

// 3. Fetch data
const overview = await analyticsService.getOverview();
const timeSeries = await analyticsService.getTimeSeries(7);
const workers = await analyticsService.getWorkerMetrics(10);
```

---

## 📊 Analytics Service Methods

| Method | Params | Returns |
|--------|--------|---------|
| `getOverview()` | - | `AnalyticsOverview` |
| `getTimeSeries(days, projectId?)` | days: number | `TimeSeriesData[]` |
| `getGeoDistribution()` | - | `GeoDistribution[]` |
| `getSubmissionStatus()` | - | `SubmissionStatus` |
| `getWorkerMetrics(limit)` | limit: number | `WorkerMetrics[]` |
| `getProjectMetrics()` | - | `ProjectMetrics[]` |
| `getKPITrends()` | - | `DashboardKPIs` |
| `exportReport(format)` | 'csv' \| 'json' | string |

---

## ⚡ Real-Time Service Methods

```typescript
// Subscribe to submissions
realtimeAnalyticsService.subscribeToSubmissions({
    onSubmission: (sub) => console.log('New:', sub),
    onStatsUpdate: (stats) => setStats(stats)
});

// Subscribe to alerts
realtimeAnalyticsService.subscribeToAlerts((alert) => {
    showNotification(alert.title);
});

// Polling fallback
realtimeAnalyticsService.startStatsPolling(setStats, 30000);

// Cleanup
realtimeAnalyticsService.unsubscribeAll();
```

### Alert Management

```typescript
await realtimeAnalyticsService.getActiveAlerts(20);
await realtimeAnalyticsService.acknowledgeAlert(alertId);
await realtimeAnalyticsService.resolveAlert(alertId, 'Fixed the issue');
await realtimeAnalyticsService.dismissAlert(alertId);
```

### Thresholds

```typescript
const thresholds = await realtimeAnalyticsService.getThresholds();
await realtimeAnalyticsService.updateThresholds({
    minAccuracyThreshold: 90,
    maxRejectionRate: 10
});
```

---

## 📧 Email Reports Service

### Create Report

```typescript
const report = await emailReportsService.createReport({
    reportName: 'Daily Summary',
    reportType: 'daily_digest',
    frequency: 'daily',
    scheduleTime: '09:00',
    timezone: 'Africa/Lagos',
    recipients: [{ email: 'team@co.com', name: 'Team' }],
    includedMetrics: ['submissions', 'accuracy', 'workers'],
    includeCharts: true,
    includeCsvAttachment: true
});
```

### Report Types

| Type | Icon | Metrics |
|------|------|---------|
| `daily_digest` | 📊 | submissions, accuracy, workers, spend |
| `weekly_summary` | 📈 | + trends, geo |
| `monthly_overview` | 📅 | + projects |
| `anomaly_report` | 🚨 | alerts, accuracy, rejection_rate |
| `worker_performance` | 👥 | workers, accuracy, submissions, earnings |
| `financial_summary` | 💰 | spend, budget, cost_per_task, escrow |

### Actions

```typescript
// Get all reports
const reports = await emailReportsService.getScheduledReports();

// Toggle active
await emailReportsService.toggleReportStatus(reportId, false);

// Send immediately
await emailReportsService.sendReportNow(reportId);

// Delete
await emailReportsService.deleteReport(reportId);
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `company_projects` | Project/campaign management |
| `analytics_events` | Event sourcing |
| `analytics_daily_metrics` | Pre-aggregated daily data |
| `worker_performance_metrics` | Worker stats per company |
| `anomaly_thresholds` | Alert configuration |
| `anomaly_alerts` | Detected anomalies |
| `scheduled_email_reports` | Email report config |
| `email_report_log` | Send history |

---

## 🔧 SQL Functions

```sql
-- Get overview KPIs
SELECT get_company_analytics_overview('company-uuid');

-- Get time series (7 days)
SELECT get_analytics_time_series('company-uuid', 7, NULL);

-- Get geographic distribution
SELECT get_geo_distribution('company-uuid');

-- Check for anomalies
SELECT * FROM check_accuracy_anomalies();
SELECT * FROM check_suspicious_activity();

-- Get company alerts
SELECT get_company_alerts('company-uuid', 'active', 20);

-- Create alert
SELECT create_anomaly_alert(
    'company-uuid', 'accuracy_drop', 'warning',
    'Accuracy Drop', 'Description here',
    91.2, 95.0, NULL, NULL
);
```

---

## 🚨 Alert Types & Severity

| Type | Severity | Trigger |
|------|----------|---------|
| `accuracy_drop` | ⚠️/🔴 | Accuracy decreased |
| `high_rejection` | ⚠️ | Rejection rate > threshold |
| `suspicious_activity` | ⚠️/🔴 | Worker too fast |
| `inactivity` | ℹ️ | No activity for X hours |
| `threshold_breach` | ⚠️ | Any threshold exceeded |
| `quality_anomaly` | ℹ️/⚠️ | Quality outlier |

### Alert Status Flow

```
Active ──▶ Acknowledged ──▶ Resolved
   │                           
   └───────▶ Dismissed
```

---

## 🎨 UI Components

### KPI Card

```tsx
<KPICard
    title="Accuracy Rate"
    value="96.4%"
    subValue="Target: 95%"
    icon={<Star className="text-green-500" />}
    trend={{ value: 2.3, direction: 'up' }}
    color="green"
/>
```

### Alert Card

```tsx
<AlertCard
    alert={alert}
    onAcknowledge={() => handleAcknowledge(alert.id)}
    onResolve={() => handleResolve(alert.id)}
    onDismiss={() => handleDismiss(alert.id)}
/>
```

---

## 🔐 RLS Policies

```sql
-- All tables use this pattern:
CREATE POLICY company_access ON table_name
    FOR ALL USING (
        company_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );
```

---

## 🐛 Debug Tips

```typescript
// Check company ID is set
console.log('Company ID:', analyticsService.companyId);

// Test RPC directly
const { data, error } = await supabase
    .rpc('get_company_analytics_overview', { p_company_id: companyId });
console.log('RPC:', { data, error });

// Check realtime status
const channel = supabase.channel('test');
channel.subscribe((status) => console.log('Realtime:', status));
```

---

## 📁 File Locations

```
company/src/
├── pages/
│   ├── Analytics.tsx           # Dashboard
│   ├── WorkerAnalytics.tsx     # Workforce
│   └── AlertsAndReports.tsx    # Alerts & Email
├── services/
│   ├── analyticsService.ts
│   ├── realtimeAnalyticsService.ts
│   └── emailReportsService.ts
└── styles/global.css

supabase/
├── 14_analytics_schema.sql
└── 15_realtime_analytics.sql
```

---

## 🔗 Navigation Routes

| Route | Tab Value | Component |
|-------|-----------|-----------|
| Analytics | `analytics` | `<Analytics />` |
| Workforce | `workforce` | `<WorkerAnalytics />` |
| Alerts | `alerts` | `<AlertsAndReports />` |

---

*Quick Reference v2.0 | Updated January 2026*
