import React, { useState } from 'react';
import {
    X,
    FolderPlus,
    Target,
    Database,
    Upload,
    ChevronRight,
    ArrowLeft,
    DollarSign,
    ShieldCheck,
    Briefcase,
    Zap,
    Users
} from 'lucide-react';

interface NewWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (projectData: any) => void;
}

export default function NewWorkspaceModal({ isOpen, onClose, onComplete }: NewWorkspaceModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        projectName: '',
        projectDescription: '', // scope
        dataType: 'Text',
        projectAim: '', // aim
        dataAmount: 1000,
        bidPerItem: 0.05,
        uploadedFiles: [] as File[]
    });

    if (!isOpen) return null;

    const totalCost = formData.dataAmount * formData.bidPerItem;
    const platformFee = totalCost * 0.15;
    const finalCommitment = totalCost + platformFee;

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = () => {
        onComplete(formData);
        onClose();
        setStep(1);
        alert("Your workspace request has been sent for Admin Review. We will notify you once approved.");
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                    <div className={`h-full bg-orange-500 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
                </div>

                <div className="p-8 md:p-12">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black outfit text-white tracking-tight">
                                {step === 1 ? 'Details' : step === 2 ? 'Uploads' : 'Finance'}
                            </h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Section {step} of 3</p>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-white/10">
                            <X size={24} />
                        </button>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="block">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Name of Project</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Swahili Audio Data"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-orange-500/50 transition-all focus:bg-white/10"
                                        value={formData.projectName}
                                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Type of Data</span>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-orange-500/50 transition-all appearance-none"
                                        value={formData.dataType}
                                        onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                                    >
                                        <option>Text / NLP</option>
                                        <option>Audio / Voice</option>
                                        <option>Images / Computer Vision</option>
                                        <option>Video Analysis</option>
                                        <option>Sensor / IoT Data</option>
                                    </select>
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Scope (What is the project about?)</span>
                                <textarea
                                    rows={3}
                                    placeholder="Describe the tasks we should perform..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-orange-500/50 transition-all focus:bg-white/10 resize-none"
                                    value={formData.projectDescription}
                                    onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                                />
                            </label>

                            <label className="block">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Goal / Aim (What do you want to achieve?)</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Improve speech recognition for local accents"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-orange-500/50 transition-all focus:bg-white/10"
                                    value={formData.projectAim}
                                    onChange={(e) => setFormData({ ...formData, projectAim: e.target.value })}
                                />
                            </label>

                            <button
                                onClick={handleNext}
                                disabled={!formData.projectName}
                                className="w-full py-5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl font-black outfit text-lg transition-all shadow-xl shadow-orange-900/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                Next Step <ChevronRight size={20} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-12 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02] flex flex-col items-center justify-center text-center group hover:border-orange-500/30 transition-all">
                                <div className="w-16 h-16 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6 border border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Upload Data Source</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 font-medium">Drag and drop your ZIP, CSV, or Media files here to start the process.</p>
                                <button className="px-8 py-3 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-xl">
                                    Select Files
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={18} /> Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-[2] py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black outfit text-lg transition-all shadow-xl shadow-orange-900/20 active:scale-95"
                                >
                                    Review Financing
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="block">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Items to Analyze</span>
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-orange-500/50 transition-all focus:bg-white/10"
                                        value={formData.dataAmount}
                                        onChange={(e) => setFormData({ ...formData, dataAmount: parseInt(e.target.value) })}
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">My Proposed Bid ($ / Item)</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-orange-500/50 transition-all focus:bg-white/10"
                                        value={formData.bidPerItem}
                                        onChange={(e) => setFormData({ ...formData, bidPerItem: parseFloat(e.target.value) })}
                                    />
                                </label>
                            </div>

                            <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Project Subtotal</span>
                                    <span className="text-white font-black outfit text-xl">${totalCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Platform Sync Fee (15%)</span>
                                    <span className="text-white font-black outfit text-xl">${platformFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <div>
                                        <span className="text-orange-500 font-black uppercase tracking-widest text-[10px] block mb-1">Total Commitment</span>
                                        <p className="text-xs text-slate-500 font-medium">Awaiting final Admin price review</p>
                                    </div>
                                    <span className="text-4xl font-black outfit text-white tracking-tighter">${finalCommitment.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={18} /> Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-[2] py-4 bg-white text-black hover:bg-slate-200 rounded-2xl font-black outfit text-lg transition-all shadow-xl shadow-white/10 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <ShieldCheck size={20} /> Request Submission
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
