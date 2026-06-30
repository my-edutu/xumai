import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import {
    Users,
    Database,
    DollarSign,
    Clock,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    AlertTriangle,
    Activity
} from 'lucide-react';


// --- Mock Data for Analytics ---
const consensusOverTime = [
    { date: 'Dec 26', score: 92, submissions: 1240 },
    { date: 'Dec 27', score: 94, submissions: 1380 },
    { date: 'Dec 28', score: 91, submissions: 1520 },
    { date: 'Dec 29', score: 96, submissions: 1450 },
    { date: 'Dec 30', score: 95, submissions: 1680 },
    { date: 'Dec 31', score: 97, submissions: 1890 },
    { date: 'Jan 1', score: 98, submissions: 2100 },
];

const qualityDistribution = [
    { name: 'Verified (85%+)', value: 72, color: '#10b981' },
    { name: 'Pending Review', value: 18, color: '#f59e0b' },
    { name: 'Rejected', value: 7, color: '#ef4444' },
    { name: 'Disputed', value: 3, color: '#8b5cf6' },
];

const languageBreakdown = [
    { language: 'Yoruba-Pidgin', samples: 4200, purity: 98.2 },
    { language: 'Swahili', samples: 3800, purity: 97.1 },
    { language: 'Zulu', samples: 2100, purity: 96.5 },
    { language: 'Hausa', samples: 1800, purity: 94.8 },
    { language: 'Igbo', samples: 1200, purity: 95.3 },
];

const revenueData = [
    { month: 'Sep', revenue: 12400, payouts: 8200 },
    { month: 'Oct', revenue: 18600, payouts: 11400 },
    { month: 'Nov', revenue: 24800, payouts: 15600 },
    { month: 'Dec', revenue: 32100, payouts: 19800 },
];

const topContributors = [
    { rank: 1, name: 'Sade Williams', xp: 12450, accuracy: 99.2, earnings: 1240 },
    { rank: 2, name: 'Kofi Mensah', xp: 11200, accuracy: 98.7, earnings: 1120 },
    { rank: 3, name: 'Amina Okoro', xp: 10800, accuracy: 98.4, earnings: 980 },
    { rank: 4, name: 'Chidi Nwosu', xp: 9650, accuracy: 97.9, earnings: 890 },
    { rank: 5, name: 'Fatima Hassan', xp: 8920, accuracy: 97.5, earnings: 820 },
];

const validationQueue = [
    { id: 'VQ-001', project: 'Lagos Street Slang', pending: 142, avgWait: '2.4h' },
    { id: 'VQ-002', project: 'Nairobi Tech Terms', pending: 89, avgWait: '1.8h' },
    { id: 'VQ-003', project: 'Johannesburg Dialect', pending: 56, avgWait: '3.1h' },
];

const activityFeed = [
    { type: 'validation', message: 'Batch #4521 validated with 96% consensus', time: '2m ago', icon: CheckCircle2, color: 'emerald' },
    { type: 'payout', message: 'Sade Williams withdrew $450.00', time: '8m ago', icon: DollarSign, color: 'blue' },
    { type: 'alert', message: 'Low consensus on Hausa project', time: '15m ago', icon: AlertTriangle, color: 'orange' },
    { type: 'signup', message: '12 new contributors joined today', time: '1h ago', icon: Users, color: 'purple' },
];

// --- Utility Components ---
const StatCard = ({ label, value, trend, trendUp, icon: Icon, color }: any) => (
    <div className="glass-card p-6 md:p-8 group hover:border-orange-500/30 transition-all">
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-500 group-hover:bg-${color}-500 group-hover:text-white transition-all duration-500`}>
                <Icon size={28} strokeWidth={1.5} />
            </div>
            {trend && (
                <span className={`text-[10px] md:text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 ${trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {trend}
                </span>
            )}
        </div>
        <p className="text-[10px] md:text-xs text-dim font-black uppercase tracking-[0.2em]">{label}</p>
        <h4 className="text-3xl md:text-4xl lg:text-5xl font-black mt-2 text-white outfit tracking-tighter">{value}</h4>
    </div>
);

const SectionHeader = ({ title, subtitle }: any) => (
    <div className="mb-6">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-dim font-medium">{subtitle}</p>}
    </div>
);

// --- Main Analytics Dashboard Component ---
export const AnalyticsDashboard = () => {
    return (
        <div className="space-y-8 animate-slide-up pb-12">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-white/5 pb-10 gap-8">
                <div className="max-w-2xl">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white outfit leading-none">
                        Analytics <span className="text-orange-500">Command Center</span>
                    </h1>
                    <p className="text-dim mt-4 text-base md:text-lg font-medium leading-relaxed">
                        Precision tracking for planetary-scale data operations. Monitor integrity, flow, and node performance in real-time.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <select className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm font-black text-white outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                    </select>
                    <button className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-900/40 active:scale-95">
                        Export Intel
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Active Contributors" value="2,847" trend="+12.4%" trendUp={true} icon={Users} color="blue" />
                <StatCard label="Validated Datasets" value="14.2k" trend="+8.2%" trendUp={true} icon={Database} color="emerald" />
                <StatCard label="Revenue (MTD)" value="$32.1k" trend="+24%" trendUp={true} icon={DollarSign} color="orange" />
                <StatCard label="Pending Payouts" value="$4.8k" trend="156 req" trendUp={false} icon={Clock} color="purple" />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Consensus Over Time */}
                <div className="lg:col-span-2 glass-card p-6">
                    <SectionHeader title="Data Quality Trend" subtitle="Consensus scores and submission volume over time" />
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={consensusOverTime}>
                                <defs>
                                    <linearGradient id="gradientScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradientSubmissions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} domain={[85, 100]} />
                                <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fill="url(#gradientScore)" name="Consensus %" />
                                <Area yAxisId="right" type="monotone" dataKey="submissions" stroke="#3b82f6" strokeWidth={2} fill="url(#gradientSubmissions)" name="Submissions" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quality Distribution Pie */}
                <div className="glass-card p-6">
                    <SectionHeader title="Quality Distribution" subtitle="Submission status breakdown" />
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={qualityDistribution} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                    {qualityDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {qualityDistribution.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] text-dim font-bold">{item.name}</span>
                                <span className="text-[10px] text-white font-bold ml-auto">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Second Row: Revenue & Language Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Payouts */}
                <div className="glass-card p-6">
                    <SectionHeader title="Revenue vs Payouts" subtitle="Monthly financial flow comparison" />
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    formatter={(value: any) => `$${value.toLocaleString()}`}
                                />
                                <Legend />
                                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                                <Bar dataKey="payouts" fill="#f97316" radius={[4, 4, 0, 0]} name="Payouts" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Language Purity Table */}
                <div className="glass-card p-6">
                    <SectionHeader title="Language Data Purity" subtitle="Quality scores by target language" />
                    <div className="space-y-3">
                        {languageBreakdown.map((lang) => (
                            <div key={lang.language} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold text-white">{lang.language}</span>
                                        <span className="text-xs text-emerald-500 font-bold">{lang.purity}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                                            style={{ width: `${lang.purity}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-dim font-bold">{lang.samples.toLocaleString()} samples</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Third Row: Contributors & Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Contributors */}
                <div className="lg:col-span-2 glass-card p-6">
                    <SectionHeader title="Top Contributors" subtitle="Highest performing data labelers" />
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-[10px] md:text-xs text-dim font-black uppercase tracking-[0.2em] border-b border-white/5">
                                    <th className="pb-5">Rank</th>
                                    <th className="pb-5">Contributor</th>
                                    <th className="pb-5">XP</th>
                                    <th className="pb-5">Accuracy</th>
                                    <th className="pb-5 text-right">Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {topContributors.map((c) => (
                                    <tr key={c.rank} className="group hover:bg-white/[0.02] transition-all">
                                        <td className="py-5">
                                            <span className={`text-base md:text-xl font-black outfit ${c.rank <= 3 ? 'text-orange-500' : 'text-dim'}`}>#{c.rank}</span>
                                        </td>
                                        <td className="py-5">
                                            <span className="text-sm md:text-base font-black text-white outfit">{c.name}</span>
                                        </td>
                                        <td className="py-5">
                                            <span className="text-sm md:text-base font-bold text-blue-400">{c.xp.toLocaleString()}</span>
                                        </td>
                                        <td className="py-5">
                                            <span className="text-sm md:text-base font-bold text-emerald-500">{c.accuracy}%</span>
                                        </td>
                                        <td className="py-5 text-right">
                                            <span className="text-sm md:text-base font-black text-white outfit">${c.earnings}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Validation Queue */}
                <div className="glass-card p-6">
                    <SectionHeader title="Validation Queue" subtitle="Pending review items" />
                    <div className="space-y-4">
                        {validationQueue.map((q) => (
                            <div key={q.id} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-bold text-white">{q.project}</span>
                                    <span className="text-[10px] text-dim font-mono">{q.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-orange-500" />
                                        <span className="text-xs text-orange-500 font-bold">{q.pending} pending</span>
                                    </div>
                                    <span className="text-[10px] text-dim">Avg: {q.avgWait}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-3 bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                        Review All
                    </button>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="glass-card p-6">
                <SectionHeader title="Live Activity Feed" subtitle="Real-time platform events" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {activityFeed.map((event, i) => (
                        <div key={i} className="p-6 md:p-8 bg-white/5 rounded-3xl border border-white/5 flex items-start gap-5 hover:bg-white/[0.08] transition-all group">
                            <div className={`p-3 rounded-2xl md:rounded-3xl bg-${event.color}-500/10 text-${event.color}-500 group-hover:bg-${event.color}-500 group-hover:text-white transition-all`}>
                                <event.icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm md:text-base font-bold text-white leading-tight outfit">{event.message}</p>
                                <p className="text-[10px] md:text-xs text-dim mt-2 font-black uppercase tracking-widest">{event.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
