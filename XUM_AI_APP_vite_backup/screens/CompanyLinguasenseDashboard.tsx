import React, { useState } from 'react';
import { Header } from '../components/Shared';
import { ScreenName } from '../types';

interface DatasetProject {
    id: string;
    title: string;
    language: string;
    status: 'active' | 'completed' | 'processing';
    progress: number;
    totalSamples: number;
    purity: number;
}

export const CompanyLinguasenseDashboard: React.FC<{ onNavigate: (s: ScreenName) => void }> = ({ onNavigate }) => {
    const [projects] = useState<DatasetProject[]>([
        { id: 'p1', title: 'Lagos Street Slang v2', language: 'Yoruba-Pidgin', status: 'active', progress: 65, totalSamples: 2400, purity: 99.2 },
        { id: 'p2', title: 'Nairobi Tech Sentiment', language: 'Swahili', status: 'completed', progress: 100, totalSamples: 5000, purity: 99.8 },
        { id: 'p3', title: 'Johannesburg Dialect Grounding', language: 'Zulu', status: 'processing', progress: 12, totalSamples: 1500, purity: 94.5 },
    ]);

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 font-sans animate-fade-in">
            <Header title="Linguasense Data Portal" onBack={() => onNavigate(ScreenName.COMPANY_DASHBOARD)} transparent />

            <div className="p-6">
                {/* API Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-6 rounded-3xl bg-slate-900 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total API Calls</p>
                        <p className="text-2xl font-bold text-white">124.5k</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-900 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Est. Revenue Share</p>
                        <p className="text-2xl font-bold text-emerald-500">$3,420</p>
                    </div>
                </div>

                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6 px-2">Active Data Campaigns</h2>

                <div className="space-y-4">
                    {projects.map(project => (
                        <div key={project.id} className="p-6 rounded-[2.5rem] bg-slate-900/50 border border-white/5 hover:border-primary/20 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{project.title}</h3>
                                    <p className="text-xs text-slate-500 font-medium">Target Language: <span className="text-slate-300">{project.language}</span></p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${project.status === 'active' ? 'bg-primary/20 text-primary' :
                                    project.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                                        'bg-orange-500/20 text-orange-500'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <span>Samples: {project.progress}%</span>
                                    <span>Purity: {project.purity}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 h-12 rounded-2xl bg-white text-slate-950 text-xs font-bold uppercase tracking-widest active:scale-95 transition-all">
                                    Export Parquet
                                </button>
                                <button className="flex-1 h-12 rounded-2xl bg-slate-800 text-white text-xs font-bold uppercase tracking-widest active:scale-95 transition-all">
                                    Manage Key
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* New Campaign Button */}
                <button className="w-full h-16 mt-8 rounded-[2rem] border-2 border-dashed border-slate-800 text-slate-500 font-bold uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">add_circle</span>
                    Deploy New Grounding Node
                </button>
            </div>
        </div>
    );
};
