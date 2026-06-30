import React, { useState, useEffect } from 'react';
import TaskBuilder from './TaskBuilder';
import {
    ArrowLeft,
    Download,
    Settings,
    Upload,
    Plus,
    Users,
    Target,
    ShieldCheck,
    FileJson,
    FileSpreadsheet,
    MoreVertical,
    Play,
    Pause,
    Clock,
    AlertCircle,
    Loader2,
    Database
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface ProjectDetailProps {
    project: {
        id: string;
        name: string;
        status: string;
        progress: number;
        cost: string;
    };
    onBack: () => void;
}

export default function ProjectDetail({ project, onBack }: ProjectDetailProps) {
    const [activeTab, setActiveTab] = useState('tasks');
    const [showTaskBuilder, setShowTaskBuilder] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Syncing logic simulation (Supabase real-time would go here)
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [project.id]);

    if (showTaskBuilder) {
        return (
            <TaskBuilder
                projectId={project.id}
                onBack={() => setShowTaskBuilder(false)}
                onSave={() => setShowTaskBuilder(false)}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Project Core...</p>
            </div>
        );
    }

    const isPending = project.status.toLowerCase().includes('review') || project.status.toLowerCase().includes('pending');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5 active:scale-95"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black outfit text-white tracking-tight">{project.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPending ? 'bg-blue-500/20 text-blue-500' :
                                project.status === 'Active' ? 'bg-green-500/20 text-green-500' :
                                    'bg-yellow-500/20 text-yellow-500'
                                }`}>
                                {project.status}
                            </span>
                        </div>
                        <p className="text-slate-500 mt-1 font-bold text-xs uppercase tracking-widest">Workspace ID: {project.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {!isPending && (
                        <>
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
                                <Download size={18} />
                                <span>Export</span>
                            </button>
                            <button
                                onClick={() => setShowTaskBuilder(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-orange-900/20 text-xs font-black uppercase tracking-widest"
                            >
                                <Plus size={18} />
                                Add Tasks
                            </button>
                        </>
                    )}
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 border border-white/5">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {isPending ? (
                <div className="glass-card p-12 text-center max-w-2xl mx-auto border-blue-500/20 bg-blue-500/5">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center text-blue-500 mx-auto mb-8 border border-blue-500/20">
                        <Clock size={40} className="animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black outfit text-white mb-4">Awaiting Admin Review</h2>
                    <p className="text-slate-400 leading-relaxed mb-8">
                        Our team is currently reviewing your project scope and determining the final price per item.
                        Once approved, you'll be able to launch the workspace and start collecting data.
                    </p>
                    <div className="flex items-center justify-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Proposed Bid</p>
                            <p className="text-lg font-bold text-white outfit">{project.cost}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Est. Time</p>
                            <p className="text-lg font-bold text-white outfit">~ 2 Hours</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Active Project Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <DetailStatCard title="Submissions" value="0" subValue="/ 10k" icon={<Users className="text-blue-500" />} color="blue" />
                        <DetailStatCard title="Accuracy" value="0%" subValue="Target: 98%" icon={<Target className="text-green-500" />} color="green" />
                        <DetailStatCard title="Validation" value="0" subValue="Consensus" icon={<ShieldCheck className="text-orange-500" />} color="orange" />
                        <DetailStatCard title="Spend" value="$0.00" subValue="Budget" icon={<Database className="text-purple-500" />} color="purple" />
                    </div>

                    {/* Placeholder for real data */}
                    <div className="glass-card p-20 text-center opacity-30 border-white/5">
                        <ActivityIcon />
                        <p className="mt-4 font-bold uppercase tracking-widest text-xs">Waiting for first submission...</p>
                    </div>
                </>
            )}
        </div>
    );
}

function ActivityIcon() {
    return (
        <div className="flex items-center justify-center gap-1 h-8">
            <div className="w-1 h-4 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-8 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-6 bg-orange-500 rounded-full animate-bounce" />
        </div>
    );
}

function DetailStatCard({ title, value, subValue, icon, color }: any) {
    const colorMap: any = {
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        green: 'bg-green-500/10 text-green-500 border-green-500/20',
        orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };

    return (
        <div className={`glass-card p-6 border-b-4 ${colorMap[color].split(' ')[2]} relative overflow-hidden group`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]}`}>
                    {React.cloneElement(icon, { size: 24 })}
                </div>
                <div className="text-right">
                    <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</h4>
                    <span className="text-sm text-slate-400 font-bold">{subValue}</span>
                </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-4xl font-black text-white outfit tracking-tighter">{value}</span>
            </div>
        </div>
    );
}

function ActionButton({ icon, label, primary = false }: any) {
    return (
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${primary
            ? 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20'
            : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}>
            {icon}
            <span>{label}</span>
        </button>
    );
}
