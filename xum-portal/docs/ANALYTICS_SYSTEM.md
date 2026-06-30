# XUM Company Portal - Analytics System Documentation

> **Version:** 2.0.0  
> **Last Updated:** January 2, 2026  
> **Author:** XUM AI Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Services Layer](#services-layer)
5. [UI Components](#ui-components)
6. [Real-Time Analytics](#real-time-analytics)
7. [Anomaly Detection](#anomaly-detection)
8. [Email Reports](#email-reports)
9. [API Reference](#api-reference)
10. [Security](#security)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The XUM Company Portal Analytics System provides comprehensive insights into data pipeline performance, workforce metrics, quality tracking, and financial analytics for companies using the XUM AI platform.

### Key Features

| Feature | Description |
|---------|-------------|
| **Core Analytics Dashboard** | Real-time KPIs, interactive charts, geographic distribution |
| **Workforce Analytics** | Worker performance, rankings, geographic insights |
| **Anomaly Detection** | Automatic quality monitoring with configurable thresholds |
| **Email Reports** | Scheduled report delivery with customizable templates |
| **Real-Time Updates** | Live data streaming via Supabase Realtime |

### Technology Stack

- **Frontend:** React 18, TypeScript, Recharts
- **Backend:** Supabase (PostgreSQL, RealTime, RLS)
- **Styling:** Tailwind CSS, Custom CSS
- **State Management:** React Hooks

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        XUM Company Portal                            │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Analytics  │  │  Workforce  │  │   Alerts    │  │   Reports   │ │
│  │    Page     │  │    Page     │  │    Page     │  │    Modal    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │                │        │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐ │
│  │                        Services Layer                          │ │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐     │ │
│  │  │ analyticsService│ │realtimeService│ │emailReportsService│  │ │
│  │  └────────┬───────┘ └───────┬────────┘ └────────┬───────┘     │ │
│  └───────────┼─────────────────┼───────────────────┼─────────────┘ │
│              │                 │                   │               │
├──────────────┼─────────────────┼───────────────────┼───────────────┤
│              │      Supabase   │                   │               │
│  ┌───────────▼─────────────────▼───────────────────▼─────────────┐ │
│  │                     Supabase Client                           │ │
│  │  • RPC Functions  • Realtime Subscriptions  • Direct Queries  │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Supabase Backend                              │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    PostgreSQL Database                          ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ ││
│  │  │ Core Tables     │  │ Analytics Tables │ │ Realtime Tables │ ││
│  │  │ • users         │  │ • company_projects│ │ • anomaly_alerts│ ││
│  │  │ • tasks         │  │ • analytics_events│ │ • scheduled_rpts│ ││
│  │  │ • submissions   │  │ • daily_metrics  │ │ • email_log     │ ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘ ││
│  │                                                                 ││
│  │  ┌─────────────────────────────────────────────────────────────┐││
│  │  │                  RPC Functions                              │││
│  │  │ • get_company_analytics_overview                            │││
│  │  │ • get_analytics_time_series                                 │││
│  │  │ • get_geo_distribution                                      │││
│  │  │ • check_accuracy_anomalies                                  │││
│  │  │ • check_suspicious_activity                                 │││
│  │  │ • create_anomaly_alert                                      │││
│  │  └─────────────────────────────────────────────────────────────┘││
│  │                                                                 ││
│  │  ┌─────────────────────────────────────────────────────────────┐││
│  │  │                  Row Level Security (RLS)                   │││
│  │  │ • Company-based isolation                                   │││
│  │  │ • Admin override policies                                   │││
│  │  └─────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Supabase Realtime                            ││
│  │  • submissions channel                                          ││
│  │  • anomaly_alerts channel                                       ││
│  └─────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
company/
├── src/
│   ├── pages/
│   │   ├── Analytics.tsx           # Core analytics dashboard
│   │   ├── WorkerAnalytics.tsx     # Workforce analytics page
│   │   └── AlertsAndReports.tsx    # Alerts & email reports management
│   ├── services/
│   │   ├── analyticsService.ts     # Core analytics data service
│   │   ├── realtimeAnalyticsService.ts  # Real-time subscriptions
│   │   └── emailReportsService.ts  # Email reports management
│   ├── styles/
│   │   └── global.css              # Enhanced with analytics styles
│   ├── utils/
│   │   └── supabase.ts             # Supabase client
│   └── App.tsx                     # Main app with routing
├── docs/
│   └── ANALYTICS_SYSTEM.md         # This documentation
└── package.json

supabase/
├── 00_schema.sql                   # Core schema (users, tasks, submissions)
├── 14_analytics_schema.sql         # Analytics tables & functions
└── 15_realtime_analytics.sql       # Real-time & alerting schema
```

---

## Database Schema

### Core Analytics Tables

#### `company_projects`
Stores project/campaign information for companies.

```sql
CREATE TABLE company_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    pending_tasks INTEGER DEFAULT 0,
    current_accuracy DECIMAL(5,2),
    total_budget DECIMAL(12,2) DEFAULT 0,
    spent_budget DECIMAL(12,2) DEFAULT 0,
    target_accuracy DECIMAL(5,2) DEFAULT 95.00,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | Reference to company user |
| `name` | VARCHAR | Project display name |
| `project_type` | VARCHAR | text_annotation, image_labeling, rlhf, voice_collection, validation |
| `status` | VARCHAR | planning, active, paused, completed, archived |
| `current_accuracy` | DECIMAL | Current quality score (0-100) |
| `total_budget` | DECIMAL | Allocated budget |
| `spent_budget` | DECIMAL | Amount spent |

#### `analytics_events`
Event sourcing table for all analytics events.

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES users(id),
    project_id UUID REFERENCES company_projects(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    worker_id UUID REFERENCES users(id),
    task_id UUID REFERENCES tasks(id),
    submission_id UUID REFERENCES submissions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

| Event Type | Description |
|------------|-------------|
| `submission_created` | New submission received |
| `submission_approved` | Submission approved |
| `submission_rejected` | Submission rejected |
| `worker_joined` | Worker started on project |
| `budget_updated` | Budget allocation changed |
| `threshold_breached` | Quality threshold exceeded |

#### `analytics_daily_metrics`
Pre-computed daily aggregations for fast querying.

```sql
CREATE TABLE analytics_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES users(id),
    project_id UUID REFERENCES company_projects(id),
    metric_date DATE NOT NULL,
    total_submissions INTEGER DEFAULT 0,
    approved_submissions INTEGER DEFAULT 0,
    rejected_submissions INTEGER DEFAULT 0,
    pending_submissions INTEGER DEFAULT 0,
    avg_accuracy DECIMAL(5,2),
    unique_workers INTEGER DEFAULT 0,
    new_workers INTEGER DEFAULT 0,
    total_spend DECIMAL(12,2) DEFAULT 0,
    avg_time_per_task_seconds INTEGER,
    UNIQUE(company_id, project_id, metric_date)
);
```

#### `worker_performance_metrics`
Aggregated worker performance per company.

```sql
CREATE TABLE worker_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES users(id),
    worker_id UUID REFERENCES users(id),
    project_id UUID REFERENCES company_projects(id),
    total_submissions INTEGER DEFAULT 0,
    approved_submissions INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2),
    avg_time_per_task_seconds INTEGER,
    total_earned DECIMAL(10,2) DEFAULT 0,
    quality_trend DECIMAL(5,2),
    is_top_performer BOOLEAN DEFAULT false,
    first_submission_at TIMESTAMP WITH TIME ZONE,
    last_submission_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(company_id, worker_id, project_id)
);
```

#### `anomaly_thresholds`
Company-specific alerting configuration.

```sql
CREATE TABLE anomaly_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES users(id) UNIQUE,
    min_accuracy_threshold DECIMAL(5,2) DEFAULT 85.00,
    accuracy_drop_threshold DECIMAL(5,2) DEFAULT 5.00,
    min_daily_submissions INTEGER DEFAULT 100,
    max_rejection_rate DECIMAL(5,2) DEFAULT 15.00,
    max_turnaround_hours INTEGER DEFAULT 48,
    inactivity_alert_hours INTEGER DEFAULT 24,
    min_worker_accuracy DECIMAL(5,2) DEFAULT 80.00,
    suspicious_speed_threshold INTEGER DEFAULT 5,
    notify_on_critical BOOLEAN DEFAULT true,
    notify_on_warning BOOLEAN DEFAULT true,
    notify_email VARCHAR(255)
);
```

| Threshold | Default | Purpose |
|-----------|---------|---------|
| `min_accuracy_threshold` | 85% | Alert when overall accuracy drops below |
| `accuracy_drop_threshold` | 5% | Alert on sudden accuracy decrease |
| `max_rejection_rate` | 15% | Alert when rejection rate exceeds |
| `min_daily_submissions` | 100 | Alert on low volume |
| `max_turnaround_hours` | 48h | Alert on slow turnaround |
| `inactivity_alert_hours` | 24h | Alert on no activity |
| `suspicious_speed_threshold` | 5/min | Flag workers submitting too fast |

#### `anomaly_alerts`
Detected anomaly alerts log.

```sql
CREATE TABLE anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES users(id),
    project_id UUID REFERENCES company_projects(id),
    worker_id UUID REFERENCES users(id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metric_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active',
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

| Alert Type | Description |
|------------|-------------|
| `accuracy_drop` | Quality score decreased significantly |
| `high_rejection` | Rejection rate above threshold |
| `suspicious_activity` | Worker submitting abnormally fast |
| `inactivity` | No submissions for extended period |
| `threshold_breach` | Any configured threshold exceeded |
| `quality_anomaly` | Individual submission quality issue |
| `volume_spike` | Unusual submission volume |
| `worker_flagged` | Worker behavior flagged |

#### `scheduled_email_reports`
Email report configuration.

```sql
CREATE TABLE scheduled_email_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES users(id),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    included_metrics JSONB DEFAULT '["submissions", "accuracy", "workers", "spend"]',
    frequency VARCHAR(20) NOT NULL,
    schedule_time TIME DEFAULT '09:00:00',
    schedule_day_of_week INTEGER,
    schedule_day_of_month INTEGER,
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
    recipients JSONB NOT NULL,
    cc_emails TEXT[],
    include_charts BOOLEAN DEFAULT true,
    include_csv_attachment BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_at TIMESTAMP WITH TIME ZONE,
    send_count INTEGER DEFAULT 0,
    date_range_days INTEGER DEFAULT 7
);
```

| Report Type | Default Metrics |
|-------------|-----------------|
| `daily_digest` | submissions, accuracy, workers, spend |
| `weekly_summary` | + trends, geo |
| `monthly_overview` | + projects |
| `anomaly_report` | alerts, accuracy, rejection_rate |
| `worker_performance` | workers, accuracy, submissions, earnings |
| `financial_summary` | spend, budget, cost_per_task, escrow |

### Database Functions

#### `get_company_analytics_overview(company_id UUID)`
Returns aggregated overview KPIs for a company.

```sql
-- Returns JSON:
{
    "total_projects": 12,
    "active_projects": 8,
    "total_submissions": 145200,
    "total_approved": 128520,
    "avg_accuracy": 96.4,
    "total_workers": 3420,
    "top_performers": 342,
    "total_spend": 18750.50
}
```

#### `get_analytics_time_series(company_id UUID, days INT, project_id UUID)`
Returns daily time series data for charts.

```sql
-- Returns array of:
{
    "date": "2026-01-01",
    "submissions": 450,
    "approved": 412,
    "rejected": 38,
    "accuracy": 96.2,
    "workers": 82,
    "spend": 135.50
}
```

#### `get_geo_distribution(company_id UUID)`
Returns geographic distribution of workers and submissions.

```sql
-- Returns array of:
{
    "country": "Nigeria",
    "workers": 1250,
    "submissions": 45000,
    "accuracy": 96.2
}
```

#### `check_accuracy_anomalies()`
Checks for accuracy drops across all companies.

```sql
-- Returns:
{
    "company_id": "uuid",
    "current_accuracy": 91.2,
    "previous_accuracy": 96.5,
    "accuracy_drop": 5.3,
    "should_alert": true
}
```

#### `check_suspicious_activity()`
Identifies workers with unusually fast submission rates.

```sql
-- Returns:
{
    "company_id": "uuid",
    "worker_id": "uuid",
    "worker_name": "Kofi Mensah",
    "submissions_per_minute": 8.5,
    "is_suspicious": true
}
```

#### `create_anomaly_alert(...)`
Creates a new anomaly alert and triggers notifications.

```sql
SELECT create_anomaly_alert(
    p_company_id := 'uuid',
    p_alert_type := 'accuracy_drop',
    p_severity := 'critical',
    p_title := 'Accuracy Drop Detected',
    p_description := 'Accuracy dropped from 96.5% to 91.2%',
    p_metric_value := 91.2,
    p_threshold_value := 95.0
);
```

### Views

#### `v_realtime_submission_stats`
Rolling 24-hour submission statistics.

```sql
SELECT * FROM v_realtime_submission_stats WHERE company_id = 'uuid';
-- Returns:
{
    "total_submissions": 342,
    "approved_count": 298,
    "rejected_count": 44,
    "pending_count": 0,
    "avg_accuracy": 94.5,
    "active_workers": 28,
    "last_submission_at": "2026-01-02T05:45:00Z"
}
```

#### `v_realtime_worker_activity`
Today's worker activity summary.

---

## Services Layer

### analyticsService.ts

Main analytics data service with Supabase integration and mock data fallback.

#### Types

```typescript
interface AnalyticsOverview {
    totalProjects: number;
    activeProjects: number;
    totalSubmissions: number;
    totalApproved: number;
    avgAccuracy: number;
    totalWorkers: number;
    topPerformers: number;
    totalSpend: number;
}

interface TimeSeriesData {
    date: string;
    submissions: number;
    approved: number;
    rejected: number;
    accuracy: number;
    workers: number;
    spend: number;
}

interface GeoDistribution {
    country: string;
    workers: number;
    submissions: number;
    accuracy: number;
}

interface WorkerMetrics {
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

interface SubmissionStatus {
    approved: number;
    pending: number;
    rejected: number;
    revision: number;
}

interface PerformanceTrend {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
}
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `setCompanyId(id)` | Set active company context | void |
| `getOverview()` | Fetch KPI overview | `Promise<AnalyticsOverview>` |
| `getTimeSeries(days, projectId?)` | Fetch time series data | `Promise<TimeSeriesData[]>` |
| `getGeoDistribution()` | Fetch geographic data | `Promise<GeoDistribution[]>` |
| `getSubmissionStatus()` | Fetch status breakdown | `Promise<SubmissionStatus>` |
| `getWorkerMetrics(limit)` | Fetch top workers | `Promise<WorkerMetrics[]>` |
| `getProjectMetrics()` | Fetch project metrics | `Promise<ProjectMetrics[]>` |
| `getKPITrends()` | Calculate trend data | `Promise<DashboardKPIs>` |
| `getHourlyDistribution()` | Fetch hourly patterns | `Promise<{hour, submissions}[]>` |
| `exportReport(format)` | Generate CSV/JSON export | `Promise<string>` |

#### Usage Example

```typescript
import analyticsService from '../services/analyticsService';

// Set company context
analyticsService.setCompanyId(companyId);

// Fetch analytics data
const overview = await analyticsService.getOverview();
const timeSeries = await analyticsService.getTimeSeries(7);
const workers = await analyticsService.getWorkerMetrics(10);

// Export report
const csv = await analyticsService.exportReport('csv');
downloadFile(csv, 'analytics-report.csv');
```

### realtimeAnalyticsService.ts

Real-time subscriptions and anomaly detection service.

#### Types

```typescript
interface RealtimeStats {
    totalSubmissions: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    avgAccuracy: number;
    activeWorkers: number;
    lastSubmissionAt: string | null;
}

interface AnomalyAlert {
    id: string;
    type: AlertType;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    metricValue: number | null;
    thresholdValue: number | null;
    status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
    workerName?: string;
    createdAt: string;
}

interface AnomalyThresholds {
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
```

#### Methods

| Method | Description |
|--------|-------------|
| `setCompanyId(id)` | Set active company |
| `subscribeToSubmissions(callbacks)` | Subscribe to submission updates |
| `subscribeToAlerts(onAlert)` | Subscribe to new alerts |
| `startStatsPolling(onUpdate, intervalMs)` | Start polling fallback |
| `startAnomalyDetection(intervalMs)` | Start anomaly checks |
| `refreshStats()` | Force stats refresh |
| `unsubscribeAll()` | Clean up subscriptions |
| `getThresholds()` | Get current thresholds |
| `updateThresholds(thresholds)` | Update thresholds |
| `getActiveAlerts(limit)` | Get active alerts |
| `getAllAlerts(limit)` | Get all alerts |
| `acknowledgeAlert(alertId)` | Mark alert acknowledged |
| `resolveAlert(alertId, notes?)` | Resolve alert |
| `dismissAlert(alertId)` | Dismiss alert |

#### Usage Example

```typescript
import realtimeAnalyticsService from '../services/realtimeAnalyticsService';

// Initialize
realtimeAnalyticsService.setCompanyId(companyId);

// Subscribe to real-time updates
const channel = realtimeAnalyticsService.subscribeToSubmissions({
    onSubmission: (submission) => {
        console.log('New submission:', submission);
    },
    onStatsUpdate: (stats) => {
        setRealtimeStats(stats);
    }
});

// Subscribe to alerts
realtimeAnalyticsService.subscribeToAlerts((alert) => {
    showNotification(alert.title, alert.severity);
});

// Start polling as fallback
realtimeAnalyticsService.startStatsPolling(setStats, 30000);

// Cleanup on unmount
useEffect(() => {
    return () => realtimeAnalyticsService.unsubscribeAll();
}, []);
```

### emailReportsService.ts

Scheduled email reports management.

#### Report Templates

| Template ID | Name | Default Frequency | Icon |
|-------------|------|-------------------|------|
| `daily_digest` | Daily Digest | Daily 9:00 AM | 📊 |
| `weekly_summary` | Weekly Summary | Weekly Monday | 📈 |
| `monthly_overview` | Monthly Overview | Monthly 1st | 📅 |
| `anomaly_report` | Anomaly Report | Real-time | 🚨 |
| `worker_performance` | Worker Performance | Weekly | 👥 |
| `financial_summary` | Financial Summary | Monthly | 💰 |
| `custom` | Custom Report | User-defined | ⚙️ |

#### Available Metrics

| Category | Metrics |
|----------|---------|
| **Volume** | submissions, approved, rejected, pending |
| **Quality** | accuracy, rejection_rate, first_pass_yield |
| **Workforce** | workers, new_workers, top_performers, worker_retention |
| **Financial** | spend, cost_per_task, budget, escrow |
| **Insights** | trends, geo, projects, alerts, turnaround |

#### Methods

| Method | Description |
|--------|-------------|
| `setCompanyId(id)` | Set active company |
| `getScheduledReports()` | Get all scheduled reports |
| `getReport(reportId)` | Get single report |
| `createReport(input)` | Create new report |
| `updateReport(reportId, updates)` | Update report config |
| `toggleReportStatus(reportId, isActive)` | Enable/disable report |
| `deleteReport(reportId)` | Delete report |
| `sendReportNow(reportId)` | Trigger immediate send |
| `generateReportData(report)` | Generate report content |
| `getEmailHistory(reportId?, limit)` | Get email send log |

#### Usage Example

```typescript
import emailReportsService, { REPORT_TEMPLATES } from '../services/emailReportsService';

// Create a new scheduled report
const report = await emailReportsService.createReport({
    reportName: 'Weekly Analytics Summary',
    reportType: 'weekly_summary',
    frequency: 'weekly',
    scheduleTime: '09:00',
    scheduleDayOfWeek: 1, // Monday
    timezone: 'Africa/Lagos',
    recipients: [
        { email: 'manager@company.com', name: 'Project Manager' }
    ],
    includedMetrics: ['submissions', 'accuracy', 'workers', 'spend', 'trends'],
    includeCharts: true,
    includeCsvAttachment: true
});

// Send report immediately
await emailReportsService.sendReportNow(report.id);

// Get email history
const history = await emailReportsService.getEmailHistory(report.id, 20);
```

---

## UI Components

### Analytics Dashboard (`Analytics.tsx`)

The main analytics dashboard with KPI cards, interactive charts, and insights.

#### Features
- **KPI Cards**: Global Rank, Total Throughput, Accuracy Rate, Active Workers, Turnaround Time
- **Date Range Selector**: 7, 14, 30, 90 days
- **Production Velocity Chart**: Combo chart (Area + Bar)
- **Submission Status**: Donut chart with legend
- **Geographic Distribution**: Horizontal bar chart
- **Quality Trend**: Line chart with gradient fill
- **Top Performing Workers**: Worker cards with rankings
- **Recent Activity Feed**: Timeline of events
- **Quick Insights**: AI-generated insights cards
- **Export Report**: CSV download

#### Sub-components

| Component | Purpose |
|-----------|---------|
| `KPICard` | Displays single KPI with trend arrow |
| `LegendItem` | Chart legend item |
| `WorkerCard` | Top performer display |
| `InsightCard` | Quick insight display |

### Workforce Analytics (`WorkerAnalytics.tsx`)

Detailed worker performance analytics.

#### Features
- **Summary Stats**: Total workers, top performers, avg accuracy, submissions, payouts
- **Worker Locations Map**: Geographic bar chart
- **Quality Distribution Pie**: Workers by accuracy tier
- **Performance Radar**: Individual worker radar chart
- **Worker Table**: Full sortable/filterable table
  - Rank with medals (🥇🥈🥉)
  - Profile with avatar
  - Location, accuracy, submissions
  - Average time, earnings, trend
  - Actions (View, Flag)
- **Filters**: All, Top Performers, Active, Flagged
- **Search**: By worker name
- **Sorting**: By accuracy, submissions, earnings, recent

### Alerts & Reports (`AlertsAndReports.tsx`)

Anomaly detection and email reports management.

#### Tabs

**1. Alerts Tab**
- Real-time stats bar (live indicator)
- Alert filter buttons: Active, Critical, All
- Alert cards with:
  - Severity icon (🔴 Critical, 🟡 Warning, 🔵 Info)
  - Title and description
  - Metric vs threshold values
  - Status badge (Active, Acknowledged, Resolved)
  - Actions: Acknowledge, Resolve, Dismiss
- Empty state with checkmark

**2. Email Reports Tab**
- Report template quick buttons
- Scheduled reports table:
  - Report name with icon
  - Frequency and schedule
  - Recipients count
  - Send count
  - Next scheduled date
  - Toggle active/pause
  - Send now button
  - Delete button
- Create Report Modal:
  - Step 1: Select template
  - Step 2: Configure schedule & recipients

**3. Thresholds Tab**
- Quality Thresholds section:
  - Min Accuracy (%)
  - Accuracy Drop Alert (%)
  - Max Rejection Rate (%)
  - Min Worker Accuracy (%)
- Volume & Time Thresholds section:
  - Min Daily Submissions
  - Max Turnaround (hours)
  - Inactivity Alert (hours)
  - Suspicious Speed (tasks/min)
- Notification Settings:
  - Critical alerts toggle
  - Warning alerts toggle
  - Notification email input
- Save button

---

## Real-Time Analytics

### Supabase Realtime Integration

The system uses Supabase Realtime for instant updates:

```typescript
// Subscribe to submission changes
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
            handleNewSubmission(payload.new);
        }
    )
    .subscribe();
```

### Polling Fallback

For development or when WebSockets are unavailable:

```typescript
// Poll every 30 seconds
realtimeAnalyticsService.startStatsPolling(
    (stats) => setRealtimeStats(stats),
    30000
);
```

### Real-Time Stats Display

```jsx
{realtimeStats && (
    <div className="glass-card p-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live</span>
        </div>
        <StatItem label="Submissions (24h)" value={realtimeStats.totalSubmissions} />
        <StatItem label="Approved" value={realtimeStats.approvedCount} />
        <StatItem label="Accuracy" value={`${realtimeStats.avgAccuracy?.toFixed(1)}%`} />
    </div>
)}
```

---

## Anomaly Detection

### Detection Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ New Submission  │ ───▶ │ Trigger Check   │ ───▶ │ Compare Against │
│   Inserted      │      │ Function        │      │ Thresholds      │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                           │
                                                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Send            │ ◀─── │ Create Alert    │ ◀─── │ Threshold       │
│ Notification    │      │ Record          │      │ Breached?       │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Alert Severity Levels

| Severity | Color | Use Case |
|----------|-------|----------|
| `critical` | 🔴 Red | Immediate action required (accuracy drop >10%, suspicious activity) |
| `warning` | 🟡 Orange | Attention needed (threshold breach, high rejection) |
| `info` | 🔵 Blue | Informational (inactivity, quality improvement) |

### Alert Workflow States

```
┌────────┐     Acknowledge     ┌──────────────┐     Resolve     ┌──────────┐
│ Active │ ─────────────────▶ │ Acknowledged │ ─────────────▶ │ Resolved │
└────────┘                     └──────────────┘                 └──────────┘
     │                                                               
     │                   Dismiss                                     
     └─────────────────────────────────────────────────────▶ ┌───────────┐
                                                              │ Dismissed │
                                                              └───────────┘
```

### Configuring Thresholds

```typescript
// Get current thresholds
const thresholds = await realtimeAnalyticsService.getThresholds();

// Update thresholds
await realtimeAnalyticsService.updateThresholds({
    minAccuracyThreshold: 90,      // Stricter accuracy requirement
    accuracyDropThreshold: 3,      // More sensitive to drops
    maxRejectionRate: 10,          // Lower rejection tolerance
    suspiciousSpeedThreshold: 3    // Stricter speed limit
});
```

---

## Email Reports

### Creating a Scheduled Report

```typescript
const report = await emailReportsService.createReport({
    // Basic info
    reportName: 'Weekly Performance Summary',
    reportType: 'weekly_summary',
    
    // Schedule
    frequency: 'weekly',
    scheduleTime: '09:00',
    scheduleDayOfWeek: 1, // Monday
    timezone: 'Africa/Lagos',
    
    // Recipients
    recipients: [
        { email: 'team@company.com', name: 'Analytics Team' }
    ],
    ccEmails: ['manager@company.com'],
    
    // Content
    includedMetrics: ['submissions', 'accuracy', 'workers', 'spend', 'trends', 'geo'],
    includeCharts: true,
    includeCsvAttachment: true,
    
    // Filters
    projectFilter: null, // All projects
    dateRangeDays: 7
});
```

### Report Data Generation

```typescript
const reportData = await emailReportsService.generateReportData(report);

// reportData structure:
{
    generatedAt: "2026-01-02T09:00:00Z",
    period: {
        days: 7,
        start: "2025-12-26T00:00:00Z",
        end: "2026-01-02T00:00:00Z"
    },
    submissions: {
        total: 4200,
        approved: 3780,
        timeSeries: [...]
    },
    accuracy: {
        current: 96.2,
        trend: [...]
    },
    workers: {
        total: 142,
        topPerformers: 28,
        topList: [...]
    },
    financial: {
        totalSpend: 2450.00,
        trend: [...]
    },
    geographic: [...]
}
```

### Email Sending (Edge Function)

To actually send emails, create a Supabase Edge Function:

```typescript
// supabase/functions/send-analytics-report/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Resend } from 'npm:resend'

serve(async (req) => {
    const { reportId, recipients, subject, html, csvData } = await req.json()
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    
    const result = await resend.emails.send({
        from: 'XUM Analytics <analytics@xum.ai>',
        to: recipients,
        subject: subject,
        html: html,
        attachments: csvData ? [{
            filename: 'report.csv',
            content: Buffer.from(csvData).toString('base64')
        }] : []
    })
    
    return new Response(JSON.stringify({ success: true, messageId: result.id }))
})
```

### Scheduled Job (pg_cron)

```sql
-- Run every hour to check for reports to send
SELECT cron.schedule(
    'send-scheduled-reports',
    '0 * * * *',
    $$
    SELECT send_due_reports();
    $$
);

-- Function to send due reports
CREATE OR REPLACE FUNCTION send_due_reports()
RETURNS void AS $$
DECLARE
    report RECORD;
BEGIN
    FOR report IN
        SELECT * FROM scheduled_email_reports
        WHERE is_active = true
        AND next_scheduled_at <= NOW()
    LOOP
        -- Call Edge Function via HTTP
        PERFORM net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/send-analytics-report',
            body := json_build_object('reportId', report.id)::text
        );
        
        -- Update next scheduled time
        UPDATE scheduled_email_reports
        SET 
            last_sent_at = NOW(),
            send_count = send_count + 1,
            next_scheduled_at = calculate_next_schedule(...)
        WHERE id = report.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## API Reference

### REST API Endpoints (via Supabase)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/rpc/get_company_analytics_overview` | POST | Get overview KPIs |
| `/rest/v1/rpc/get_analytics_time_series` | POST | Get time series data |
| `/rest/v1/rpc/get_geo_distribution` | POST | Get geographic distribution |
| `/rest/v1/rpc/get_company_alerts` | POST | Get company alerts |
| `/rest/v1/rpc/check_accuracy_anomalies` | POST | Check for anomalies |
| `/rest/v1/anomaly_thresholds` | GET/POST/PATCH | Threshold CRUD |
| `/rest/v1/anomaly_alerts` | GET/PATCH | Alert management |
| `/rest/v1/scheduled_email_reports` | GET/POST/PATCH/DELETE | Report CRUD |
| `/rest/v1/email_report_log` | GET | Email history |

### Example API Calls

```bash
# Get analytics overview
curl -X POST \
  'https://your-project.supabase.co/rest/v1/rpc/get_company_analytics_overview' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer USER_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"p_company_id": "company-uuid"}'

# Get active alerts
curl -X POST \
  'https://your-project.supabase.co/rest/v1/rpc/get_company_alerts' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer USER_JWT' \
  -H 'Content-Type: application/json' \
  -d '{"p_company_id": "company-uuid", "p_status": "active", "p_limit": 20}'

# Create scheduled report
curl -X POST \
  'https://your-project.supabase.co/rest/v1/scheduled_email_reports' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer USER_JWT' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{
    "company_id": "company-uuid",
    "report_name": "Daily Summary",
    "report_type": "daily_digest",
    "frequency": "daily",
    "schedule_time": "09:00:00",
    "recipients": [{"email": "test@example.com", "name": "Test"}]
  }'
```

---

## Security

### Row Level Security (RLS)

All analytics tables have RLS enabled to ensure data isolation:

```sql
-- Companies can only access their own data
CREATE POLICY company_own_data ON analytics_daily_metrics
    FOR ALL USING (
        company_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Same pattern for all analytics tables
ALTER TABLE anomaly_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_email_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_report_log ENABLE ROW LEVEL SECURITY;
```

### Data Access Patterns

| User Role | Can Access |
|-----------|------------|
| Company | Own company data only |
| Admin | All company data |
| Contributor | No direct analytics access |

### Input Validation

- Threshold values are constrained (min/max)
- Alert types and statuses are enum-checked
- Email recipients are validated format
- Project/worker IDs are foreign key constrained

### Audit Trail

- All alerts include `created_at`, `acknowledged_at`, `resolved_at`
- Email sends are logged with status and timestamps
- Analytics events provide event sourcing capability

---

## Deployment

### Prerequisites

1. Supabase project with PostgreSQL
2. Environment variables configured:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Database Migration

```bash
# Apply analytics schema
psql $DATABASE_URL -f supabase/14_analytics_schema.sql

# Apply realtime schema
psql $DATABASE_URL -f supabase/15_realtime_analytics.sql
```

### Enable Realtime

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE anomaly_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Deploy Edge Functions (for email)

```bash
supabase functions deploy send-analytics-report
```

### Configure Cron (for scheduled reports)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly report check
SELECT cron.schedule('send-scheduled-reports', '0 * * * *', 'SELECT send_due_reports()');
```

---

## Troubleshooting

### Common Issues

#### 1. Mock Data Showing Instead of Real Data

**Cause:** Supabase RPC calls failing silently

**Solution:**
```typescript
// Check browser console for errors
// Verify company ID is set
analyticsService.setCompanyId(userId);

// Test RPC directly
const { data, error } = await supabase.rpc('get_company_analytics_overview', {
    p_company_id: userId
});
console.log('RPC result:', data, error);
```

#### 2. Realtime Subscriptions Not Working

**Cause:** Realtime not enabled for table

**Solution:**
```sql
-- Verify realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Add table if missing
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
```

#### 3. Alerts Not Being Created

**Cause:** Trigger function not executing

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'submission_created_trigger';

-- Manually test anomaly check
SELECT * FROM check_accuracy_anomalies();
```

#### 4. Email Reports Not Sending

**Cause:** Edge Function not deployed or cron not running

**Solution:**
```bash
# Check Edge Function logs
supabase functions logs send-analytics-report

# Verify cron job
SELECT * FROM cron.job;
```

### Debug Mode

Enable verbose logging in services:

```typescript
// analyticsService.ts
async getOverview(): Promise<AnalyticsOverview> {
    console.log('[Analytics] Fetching overview for company:', this.companyId);
    try {
        const { data, error } = await supabase.rpc(...);
        console.log('[Analytics] RPC result:', { data, error });
        // ...
    } catch (e) {
        console.error('[Analytics] RPC error:', e);
    }
}
```

---

## Changelog

### v2.0.0 (January 2, 2026)
- Added real-time analytics with Supabase subscriptions
- Added anomaly detection system with configurable thresholds
- Added scheduled email reports with 7 templates
- Added Alerts & Reports management page
- Enhanced global CSS with animations and utilities
- Added comprehensive documentation

### v1.0.0 (January 1, 2026)
- Initial analytics dashboard implementation
- Core KPI cards and charts
- Workforce analytics page
- Basic export functionality
- Analytics service with mock data fallback

---

## Support

For issues or feature requests, contact the XUM AI Development Team or open an issue in the project repository.

---

*© 2026 XUM AI. All rights reserved.*
