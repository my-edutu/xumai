import React, { useState } from 'react';
import {
    ArrowLeft,
    Save,
    Image as ImageIcon,
    Mic,
    Type,
    Layers,
    Settings,
    HelpCircle,
    ChevronRight,
    Database,
    Coins,
    Plus
} from 'lucide-react';

interface TaskBuilderProps {
    projectId: string;
    onBack: () => void;
    onSave: (taskSet: any) => void;
}

export default function TaskBuilder({ projectId, onBack, onSave }: TaskBuilderProps) {
    const [step, setStep] = useState(1);
    const [taskType, setTaskType] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        reward: 0.25,
        targetCount: 1000,
        minTrustScore: 7.5,
        overlap: 3 // Consensus number
    });

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold outfit">Create New Task Set</h1>
                        <p className="text-slate-400 mt-1">Project: {projectId}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-semibold transition-all">
                        Draft
                    </button>
                    <button className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2">
                        <Save size={18} />
                        Launch Task
                    </button>
                </div>
            </header>

            {/* Progress Stepper */}
            <div className="flex items-center gap-4 mb-12">
                <StepIndicator number={1} label="Type" active={step === 1} done={step > 1} />
                <ChevronRight size={18} className="text-slate-600" />
                <StepIndicator number={2} label="Config" active={step === 2} done={step > 2} />
                <ChevronRight size={18} className="text-slate-600" />
                <StepIndicator number={3} label="Data" active={step === 3} done={step > 3} />
                <ChevronRight size={18} className="text-slate-600" />
                <StepIndicator number={4} label="Review" active={step === 4} done={step > 4} />
            </div>

            {/* Step 1: Select Type */}
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <TypeCard
                        icon={<Mic size={32} />}
                        title="Voice Collection"
                        desc="Gather audio recordings for NLP and speech recognition."
                        active={taskType === 'audio'}
                        onClick={() => { setTaskType('audio'); setStep(2); }}
                    />
                    <TypeCard
                        icon={<ImageIcon size={32} />}
                        title="Image Labeling"
                        desc="Bounding boxes, segmentation, or classification."
                        active={taskType === 'image'}
                        onClick={() => { setTaskType('image'); setStep(2); }}
                    />
                    <TypeCard
                        icon={<Layers size={32} />}
                        title="RLHF Calibration"
                        desc="Fine-tune models with human preference data."
                        active={taskType === 'rlhf'}
                        onClick={() => { setTaskType('rlhf'); setStep(2); }}
                    />
                    <TypeCard
                        icon={<Type size={32} />}
                        title="Text Annotation"
                        desc="NER, sentiment analysis, or translation auditing."
                        active={taskType === 'text'}
                        onClick={() => { setTaskType('text'); setStep(2); }}
                    />
                    <TypeCard
                        icon={<Settings size={32} />}
                        title="Custom Workflow"
                        desc="Design your own complex human-in-the-loop logic."
                        active={taskType === 'custom'}
                        onClick={() => { setTaskType('custom'); setStep(2); }}
                    />
                </div>
            )}

            {/* Step 2: Configuration */}
            {step === 2 && (
                <div className="glass-card p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold outfit mb-2">Basic Information</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Task Set Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Swahili Daily Greetings"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Instructions for Workers</label>
                            <textarea
                                rows={4}
                                placeholder="Describe exactly what workers need to do..."
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold outfit mb-2">Economics & Quality</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                    <Coins size={14} className="text-orange-500" /> Reward ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    value={formData.reward}
                                    onChange={(e) => setFormData({ ...formData, reward: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                    <Database size={14} className="text-blue-500" /> Target Count
                                </label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    value={formData.targetCount}
                                    onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2 flex justify-between">
                                <span>Min. Worker Trust Score</span>
                                <span className="text-orange-500 font-bold">{formData.minTrustScore} / 10</span>
                            </label>
                            <input
                                type="range"
                                min="0" max="10" step="0.5"
                                className="w-full accent-orange-600"
                                value={formData.minTrustScore}
                                onChange={(e) => setFormData({ ...formData, minTrustScore: parseFloat(e.target.value) })}
                            />
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <HelpCircle size={12} /> Higher score increases quality but slows down throughput.
                            </p>
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={() => setStep(3)}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold outfit transition-all border border-white/5"
                            >
                                Continue to Data Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Data Placeholder */}
            {step === 3 && (
                <div className="glass-card p-12 text-center">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                        <Database size={40} />
                    </div>
                    <h3 className="text-2xl font-bold outfit mb-2">Upload Source Inventory</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-8">
                        Upload a JSON or CSV file containing the items you want to be processed.
                        For voice/image tasks, include public URLs to the assets.
                    </p>
                    <div className="max-w-md mx-auto border-2 border-dashed border-white/10 rounded-2xl p-10 hover:border-orange-500/50 transition-all cursor-pointer bg-white/5">
                        <Plus size={32} className="mx-auto mb-4 text-slate-500" />
                        <p className="font-semibold">Drop your manifest file here</p>
                        <p className="text-xs text-slate-500 mt-1">Accepts .json, .csv, .xlsx (max 50MB)</p>
                    </div>
                    <button
                        onClick={() => setStep(4)}
                        className="mt-10 text-slate-400 underline hover:text-white"
                    >
                        Skip for now (use generator)
                    </button>
                </div>
            )}
        </div>
    );
}

function StepIndicator({ number, label, active, done }: any) {
    return (
        <div className={`flex items-center gap-2 ${active ? 'text-orange-500' : done ? 'text-green-500' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold outfit ${active ? 'border-orange-500 bg-orange-500/10' :
                done ? 'border-green-500 bg-green-500/10' :
                    'border-slate-800'
                }`}>
                {done ? '✓' : number}
            </div>
            <span className="font-semibold">{label}</span>
        </div>
    );
}

function TypeCard({ icon, title, desc, active, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`glass-card p-6 cursor-pointer border-2 transition-all group ${active ? 'border-orange-500 bg-orange-500/5' : 'border-transparent hover:border-white/20'
                }`}
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/40 scale-110' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                }`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold outfit mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
        </div>
    );
}
