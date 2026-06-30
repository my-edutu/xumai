import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    TrendingDown,
    Globe,
    Award,
    Clock,
    Star,
    Search,
    Filter,
    Download,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    Flag,
    Loader2,
    UserCheck,
    UserX,
    Activity,
    MapPin
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import analyticsService, { WorkerMetrics, GeoDistribution } from '../services/analyticsService';

const COLORS = {
    primary: '#f97316',
    secondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#a855f7'
};

type SortBy = 'accuracy' | 'submissions' | 'earned' | 'recent';
type FilterStatus = 'all' | 'top_performers' | 'active' | 'flagged';

interface WorkerAnalyticsProps {
    onBack?: () => void;
}

export default function WorkerAnalytics({ onBack }: WorkerAnalyticsProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [workers, setWorkers] = useState<WorkerMetrics[]>([]);
    const [geoData, setGeoData] = useState<GeoDistribution[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('accuracy');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [selectedWorker, setSelectedWorker] = useState<WorkerMetrics | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [workersData, geoDistribution] = await Promise.all([
                analyticsService.getWorkerMetrics(50),
                analyticsService.getGeoDistribution()
            ]);
            setWorkers(workersData);
            setGeoData(geoDistribution);
        } catch (error) {
            console.error('Failed to fetch worker data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter and sort workers
    const filteredWorkers = workers
        .filter(w => {
            if (searchQuery && !w.fullName.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            switch (filterStatus) {
                case 'top_performers': return w.isTopPerformer;
                case 'flagged': return false; // No flagged in mock data
                case 'active': return true;
                default: return true;
            }
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'accuracy': return b.accuracyRate - a.accuracyRate;
                case 'submissions': return b.totalSubmissions - a.totalSubmissions;
                case 'earned': return b.totalEarned - a.totalEarned;
                case 'recent': return new Date(b.lastSubmissionAt).getTime() - new Date(a.lastSubmissionAt).getTime();
                default: return 0;
            }
        });

    // Calculate summary stats
    const totalWorkers = workers.length;
    const topPerformers = workers.filter(w => w.isTopPerformer).length;
    const avgAccuracy = workers.reduce((sum, w) => sum + w.accuracyRate, 0) / workers.length || 0;
    const totalSubmissions = workers.reduce((sum, w) => sum + w.totalSubmissions, 0);
    const totalEarned = workers.reduce((sum, w) => sum + w.totalEarned, 0);

    // Quality distribution data
    const qualityDistribution = [
        { range: '95-100%', count: workers.filter(w => w.accuracyRate >= 95).length, fill: COLORS.success },
        { range: '90-95%', count: workers.filter(w => w.accuracyRate >= 90 && w.accuracyRate < 95).length, fill: COLORS.primary },
        { range: '85-90%', count: workers.filter(w => w.accuracyRate >= 85 && w.accuracyRate < 90).length, fill: COLORS.warning },
        { range: '<85%', count: workers.filter(w => w.accuracyRate < 85).length, fill: COLORS.danger }
    ];

    // Performance radar data for selected worker
    const getRadarData = (worker: WorkerMetrics) => [
        { subject: 'Accuracy', A: worker.accuracyRate, fullMark: 100 },
        { subject: 'Speed', A: Math.min(100, 100 - (worker.avgTimePerTask / 2)), fullMark: 100 },
        { subject: 'Volume', A: Math.min(100, (worker.totalSubmissions / 20)), fullMark: 100 },
        { subject: 'Consistency', A: 85 + Math.random() * 15, fullMark: 100 },
        { subject: 'Reliability', A: 80 + Math.random() * 20, fullMark: 100 }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-slate-400">Loading workforce analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black outfit text-white flex items-center gap-3 tracking-tighter">
                        Worker Network
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">Monitor performance and activity across your participant pool.</p>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-slate-300">
                        <Download size={16} />
                        Export List
                    </button>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-5 py-3 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-900/40 hover:bg-orange-500 transition-all"
                        >
                            Back to Dashboard
                        </button>
                    )}
                </div>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <SummaryCard
                    label="Total Workers"
                    value={totalWorkers.toLocaleString()}
                    icon={<Users className="text-blue-500" />}
                    trend="+12%"
                    trendUp
                />
                <SummaryCard
                    label="Top Performers"
                    value={topPerformers.toLocaleString()}
                    icon={<Award className="text-yellow-500" />}
                    trend={`${((topPerformers / totalWorkers) * 100).toFixed(0)}%`}
                    trendUp
                />
                <SummaryCard
                    label="Avg Accuracy"
                    value={`${avgAccuracy.toFixed(1)}%`}
                    icon={<Star className="text-green-500" />}
                    trend="+2.3%"
                    trendUp
                />
                <SummaryCard
                    label="All Submissions"
                    value={`${(totalSubmissions / 1000).toFixed(1)}K`}
                    icon={<Activity className="text-orange-500" />}
                    trend="+18%"
                    trendUp
                />
                <SummaryCard
                    label="Paid Out"
                    value={`$${totalEarned.toLocaleString()}`}
                    icon={<TrendingUp className="text-emerald-500" />}
                    trend="+8%"
                    trendUp
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Geographic Distribution */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold outfit mb-4 flex items-center gap-2">
                        <Globe size={18} className="text-blue-500" />
                        Worker Locations
                    </h3>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={geoData.slice(0, 6)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis dataKey="country" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={65} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    formatter={(value: number) => [value.toLocaleString(), 'Workers']}
                                />
                                <Bar dataKey="workers" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quality Distribution */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold outfit mb-4 flex items-center gap-2">
                        <Star size={18} className="text-yellow-500" />
                        Quality Distribution
                    </h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={qualityDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={4}
                                    dataKey="count"
                                >
                                    {qualityDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {qualityDistribution.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></span>
                                <span className="text-slate-400">{item.range}</span>
                                <span className="font-bold">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Worker Performance Radar */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold outfit mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-purple-500" />
                        {selectedWorker ? selectedWorker.fullName : 'Select a Worker'}
                    </h3>
                    {selectedWorker ? (
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={getRadarData(selectedWorker)}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                                    <Radar
                                        name={selectedWorker.fullName}
                                        dataKey="A"
                                        stroke={COLORS.primary}
                                        fill={COLORS.primary}
                                        fillOpacity={0.3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">
                            Click on a worker to see their performance radar
                        </div>
                    )}
                </div>
            </div>

            {/* Worker Table */}
            <div className="glass-card overflow-hidden">
                {/* Table Controls */}
                <div className="p-4 border-b border-white/5 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex gap-2 flex-wrap">
                        {(['all', 'top_performers', 'active'] as FilterStatus[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === status
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {status === 'all' ? 'All Workers' :
                                    status === 'top_performers' ? '⭐ Top Performers' :
                                        status === 'active' ? '🟢 Active' : '🚩 Flagged'}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-initial">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search workers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full lg:w-64 bg-slate-800/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            />
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        >
                            <option value="accuracy">Sort by Accuracy</option>
                            <option value="submissions">Sort by Submissions</option>
                            <option value="earned">Sort by Earnings</option>
                            <option value="recent">Sort by Recent</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Rank</th>
                                <th className="px-6 py-4 font-semibold">Worker</th>
                                <th className="px-6 py-4 font-semibold">Location</th>
                                <th className="px-6 py-4 font-semibold">Accuracy</th>
                                <th className="px-6 py-4 font-semibold">Submissions</th>
                                <th className="px-6 py-4 font-semibold">Approved</th>
                                <th className="px-6 py-4 font-semibold">Avg Time</th>
                                <th className="px-6 py-4 font-semibold">Earned</th>
                                <th className="px-6 py-4 font-semibold">Trend</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredWorkers.map((worker, index) => (
                                <tr
                                    key={worker.id}
                                    className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedWorker?.id === worker.id ? 'bg-orange-500/10' : ''
                                        }`}
                                    onClick={() => setSelectedWorker(worker)}
                                >
                                    <td className="px-6 py-4">
                                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${index < 3
                                            ? index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-slate-400 text-black' : 'bg-amber-700 text-white'
                                            : 'bg-slate-800 text-slate-400'
                                            }`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={worker.avatarUrl}
                                                alt={worker.fullName}
                                                className="w-9 h-9 rounded-full bg-slate-700"
                                            />
                                            <div>
                                                <p className="font-bold text-sm">{worker.fullName}</p>
                                                {worker.isTopPerformer && (
                                                    <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                                                        <Star size={10} /> Top Performer
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1 text-sm text-slate-400">
                                            <MapPin size={12} />
                                            {worker.location}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold ${worker.accuracyRate >= 95 ? 'text-green-500' :
                                            worker.accuracyRate >= 90 ? 'text-orange-500' :
                                                'text-red-500'
                                            }`}>
                                            {worker.accuracyRate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        {worker.totalSubmissions.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-green-500 font-medium">
                                        {worker.approvedSubmissions.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {worker.avgTimePerTask}s
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-500">
                                        ${worker.totalEarned.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1 text-xs font-bold ${worker.qualityTrend >= 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {worker.qualityTrend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {Math.abs(worker.qualityTrend).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                                                title="View Profile"
                                            >
                                                <Eye size={14} className="text-slate-400" />
                                            </button>
                                            <button
                                                className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg transition-all"
                                                title="Flag Worker"
                                            >
                                                <Flag size={14} className="text-slate-400 hover:text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-white/5 flex justify-between items-center">
                    <p className="text-sm text-slate-400">
                        Showing <span className="font-bold text-white">{filteredWorkers.length}</span> of{' '}
                        <span className="font-bold text-white">{workers.length}</span> workers
                    </p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-bold hover:bg-slate-700 transition-all">
                            Previous
                        </button>
                        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-500 transition-all">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Summary Card Component
function SummaryCard({ label, value, icon, trend, trendUp }: {
    label: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    trendUp?: boolean;
}) {
    return (
        <div className="glass-card p-6 hover:border-orange-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                    {icon}
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trendUp ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </span>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</p>
            <p className="text-3xl md:text-4xl font-black outfit text-white mt-1 break-all">{value}</p>
        </div>
    );
}
