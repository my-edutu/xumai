import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Activity,
    Users,
    ChevronDown,
    Download,
    RefreshCw,
    Wallet,
    DollarSign,
    Loader2,
    Briefcase,
    ShoppingBag,
    Bell,
    Plus,
    Clock,
    CheckCircle,
    TrendingUp,
    Zap
} from 'lucide-react';
import analyticsService from '../services/analyticsService';

export default function Analytics({ onNavigate, onSubmitTask }: { onNavigate?: (tab: string) => void; onSubmitTask?: () => void }) {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'workforce' | 'billing'>('overview');

    // Real-time state (Simulated for now, would be fetched from Supabase)
    const [balance, setBalance] = useState(() => Number(localStorage.getItem('xum_balance')) || 0);
    const [stats, setStats] = useState({
        activeProjects: 0,
        totalWorkers: 0,
        successRate: 0
    });

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 800);
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const renderOverview = () => (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* BIG BOLD METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Active Workspaces"
                    value={stats.activeProjects}
                    suffix="Units"
                    icon={<Zap size={32} />}
                    color="bg-blue-600"
                    glow="shadow-blue-500/20"
                    onClick={() => onNavigate?.('projects')}
                />
                <MetricCard
                    title="Worker Network"
                    value={stats.totalWorkers}
                    suffix="People"
                    icon={<Users size={32} />}
                    color="bg-purple-600"
                    glow="shadow-purple-500/20"
                    onClick={() => setActiveTab('workforce')}
                />
                <MetricCard
                    title="Available Funds"
                    value={balance}
                    prefix="$"
                    icon={<Wallet size={32} />}
                    color="bg-orange-600"
                    glow="shadow-orange-500/20"
                    onClick={() => onNavigate?.('budget')}
                />
                <MetricCard
                    title="Marketplace"
                    value={0}
                    suffix="Datasets"
                    icon={<ShoppingBag size={32} />}
                    color="bg-emerald-600"
                    glow="shadow-emerald-500/20"
                    onClick={() => onNavigate?.('market')}
                />
            </div>

            {/* Performance Pulse */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-10 bg-[#0f172a]/40 border-white/5 relative overflow-hidden group">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black outfit text-white uppercase tracking-tight">Intelligence Velocity</h3>
                                <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Global Data Throughput</p>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 rounded-2xl border border-green-500/20">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-xs font-black text-green-500 uppercase tracking-widest">System Optimal</span>
                            </div>
                        </div>

                        {/* Large Success Rate */}
                        <div className="flex items-center gap-12">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Quality Accuracy</p>
                                <h4 className="text-7xl font-black text-white outfit tracking-tighter">{stats.successRate}<span className="text-3xl text-slate-600">%</span></h4>
                            </div>
                            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full w-[2%] transition-all duration-1000" />
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Batch Validations</p>
                                <p className="text-2xl font-black text-white outfit">0</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Open Issues</p>
                                <p className="text-2xl font-black text-white outfit">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications Panel */}
                <div className="glass-card p-10 bg-[#0f172a]/80 border-white/5 relative overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Bell className="text-orange-500" size={24} />
                            <h3 className="text-xl font-black outfit text-white uppercase tracking-tight">Updates</h3>
                        </div>
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                    </div>

                    <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">System</span>
                                <span className="text-[9px] text-slate-600 font-bold uppercase">Just Now</span>
                            </div>
                            <p className="text-sm font-bold text-white group-hover:text-orange-100 transition-colors leading-relaxed">Workspace initialization complete. You can now request data flows.</p>
                        </div>
                        <div className="p-5 bg-white/[0.02] rounded-3xl border border-white/5 opacity-40">
                            <p className="text-xs text-slate-500 font-medium text-center py-4">Scanning for signals...</p>
                        </div>
                    </div>

                    <button className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 group">
                        Clear Frequency <ChevronDown size={14} className="inline ml-2 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderWorkforce = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="glass-card p-12 border-purple-500/20 bg-purple-500/5 text-center max-w-3xl mx-auto">
                <div className="w-24 h-24 bg-purple-600/10 rounded-[2.5rem] flex items-center justify-center text-purple-500 mx-auto mb-8 border border-purple-500/20 shadow-2xl shadow-purple-500/20">
                    <Users size={48} />
                </div>
                <h2 className="text-4xl font-black outfit text-white mb-4">Worker Network</h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">You currently have no active team members. Once you launch a project, qualified experts will join your network.</p>
                <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto">
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Level 1</p>
                        <p className="text-xl font-bold text-white">0</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Level 2</p>
                        <p className="text-xl font-bold text-white">0</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Expert</p>
                        <p className="text-xl font-bold text-white">0</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBilling = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="glass-card p-12 border-orange-500/20 bg-orange-600/5 overflow-hidden relative shadow-2xl">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-600/10 blur-[100px] rounded-full" />
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white outfit tracking-tighter mb-2">Account Balance</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10">Your Available Funds</p>

                    <div className="flex flex-col md:flex-row md:items-end gap-6 mb-12">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-8xl font-black text-white outfit tracking-tighter">${balance.toLocaleString()}</span>
                            <span className="text-slate-500 text-sm font-black uppercase tracking-widest mb-2 md:mb-6">USD</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => onNavigate?.('budget')}
                            className="px-8 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-3xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-orange-950/40 active:scale-95 flex items-center gap-3"
                        >
                            <Plus size={20} strokeWidth={3} /> Add Funds
                        </button>
                        <button
                            className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white rounded-3xl text-sm font-black uppercase tracking-widest transition-all border border-white/10"
                        >
                            View Transactions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-16 h-16 animate-spin text-orange-500 mb-6" />
                <p className="text-slate-400 font-bold tracking-[0.4em] uppercase text-[10px] animate-pulse">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10 pb-20">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black outfit text-white tracking-tighter">Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-sm">Welcome back! Here's an overview of your activity.</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={fetchDashboardData}
                        className="p-4 bg-[#0f172a] border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={() => onNavigate?.('projects')}
                        className="px-8 py-4 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-orange-900/40 hover:bg-orange-500 transition-all active:scale-95 flex items-center gap-3 border border-orange-400/20"
                    >
                        <PlusCircleIcon /> New Task
                    </button>
                </div>
            </header>

            <div className="flex gap-3 bg-white/[0.02] p-2 rounded-2xl border border-white/5 w-fit backdrop-blur-3xl shadow-xl">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'workforce', label: 'Workers', icon: Users },
                    { id: 'billing', label: 'Billing', icon: Wallet }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="pt-2">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'workforce' && renderWorkforce()}
                {activeTab === 'billing' && renderBilling()}
            </div>
        </div>
    );
}

function PlusCircleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
    );
}

function MetricCard({ title, value, prefix = "", suffix = "", icon, color, glow, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-left transition-all duration-500 hover:translate-y-[-4px] active:scale-[0.98] shadow-2xl border-2 border-transparent hover:border-white/10 ${color} ${glow} overflow-hidden min-h-[200px] md:min-h-[240px] w-full`}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            {/* Background Icon Decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.07] text-white rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                {React.cloneElement(icon as React.ReactElement, { size: 160 })}
            </div>

            <div className="relative z-10 flex flex-col h-full w-full">
                {/* Header: Icon + Title on same line */}
                <div className="flex items-center gap-3 mb-8 w-full">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
                        {React.cloneElement(icon as React.ReactElement, { size: 18, className: "text-white" })}
                    </div>
                    <h4 className="text-[11px] font-black text-white/90 uppercase tracking-[0.2em] truncate">
                        {title}
                    </h4>
                </div>

                {/* Main Content: Bigger, Bolder Numbers */}
                <div className="flex-1 flex flex-col justify-center py-4">
                    <div className="flex items-baseline gap-2 flex-wrap text-white">
                        {prefix && <span className="text-lg md:text-2xl font-black opacity-60 outfit">{prefix}</span>}
                        <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black outfit tracking-tighter leading-none break-all">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                        {suffix && <span className="text-xs md:text-base font-black uppercase opacity-60 outfit tracking-widest">{suffix}</span>}
                    </div>
                </div>

                {/* Footer Component */}
                <div className="mt-8 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                        View Details <ChevronDown size={12} className="-rotate-90" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white group-hover:animate-pulse" />
                </div>
            </div>
        </button>
    );
}
