
import React, { useState, useEffect } from 'react';
import { ScreenName, Task, LinguasenseTask } from '../types';
import { Header } from '../components/Shared';
import { supabase } from '../supabaseClient';

type LinguasenseEngine = 'grounding' | 'synthesis' | 'audit';

interface ScreenProps {
  onNavigate: (screen: ScreenName, engineType?: LinguasenseEngine) => void;
  onCompleteTask?: (reward: number, xp: number) => void;
  engineType?: LinguasenseEngine;
}

// Enhanced Service with Supabase Integration
const TaskService = {
  fetchActivePool: async (): Promise<Task[]> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      if (data && data.length > 0) return data as any;
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to mock data", e);
    }

    // Fallback Mock Data
    await new Promise(r => setTimeout(r, 800));
    return [
      { id: '1', title: 'Street Sign Labeling', description: 'Identify signs in urban images.', reward: 0.50, xp: 25, timeEstimate: '2m', difficulty: 'Easy', type: 'image', priority: true },
      { id: '2', title: 'Local Dialect Recording', description: 'Read sentences in native accent.', reward: 1.25, xp: 50, timeEstimate: '5m', difficulty: 'Medium', type: 'audio' },
      { id: '3', title: 'Sentiment Analysis', description: 'Analyze social media tones.', reward: 0.15, xp: 10, timeEstimate: '1m', difficulty: 'Easy', type: 'text' },
      { id: '4', title: 'Object Detection', description: 'Draw boxes around vehicles.', reward: 0.75, xp: 30, timeEstimate: '3m', difficulty: 'Medium', type: 'image' },
    ];
  },
  submitPayload: async (taskId: string, payload: any, reward: number, xp: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Insert Submission
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          task_id: taskId,
          user_id: user.id,
          submission_data: payload,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Invoke Reward Logic (Simulating auto-approval for MVP ease of use)
      const { error: rpcError } = await supabase.rpc('process_task_reward', {
        p_user_id: user.id,
        p_submission_id: data.id,
        p_reward: reward,
        p_xp: xp
      });

      if (rpcError) console.error("Reward logic failed:", rpcError);

      return { status: 'success', accreditation: 'instant' };
    } catch (e) {
      console.warn("Supabase submission failed", e);
      return { status: 'error', message: 'Handshake failed' };
    }
  }
};

export const TaskMarketplaceScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState<'All' | 'Audio' | 'Text' | 'Image'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  const featuredTasksList = [
    { id: 'f1', title: 'AI Perception Lab', description: 'Validate object depth in 3D lidar scans.', reward: 2.50, xp: 50, time: '3m', color: 'from-blue-600 to-indigo-800' },
    { id: 'f2', title: 'Neural Audit v2', description: 'Review high-sensitivity dialogue safety.', reward: 1.80, xp: 35, time: '2m', color: 'from-purple-600 to-pink-700' },
    { id: 'f3', title: 'Visual Grounding', description: 'Identify spatial relationships in scenes.', reward: 3.10, xp: 60, time: '5m', color: 'from-emerald-600 to-teal-800' }
  ];

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await TaskService.fetchActivePool();
      setTasks(data);
    } catch (e) {
      console.error("Connection error during handshake");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t =>
    (filter === 'All' || t.type.toLowerCase() === filter.toLowerCase()) &&
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 transition-colors duration-500">
      <Header
        title="Task"
        onBack={() => onNavigate(ScreenName.HOME)}
        rightAction={
          <button onClick={handleRefresh} className={`text-slate-400 p-2 hover:text-primary transition-all duration-500 ${isLoading ? 'rotate-180 animate-pulse text-primary' : ''}`}>
            <span className="material-symbols-outlined">refresh</span>
          </button>
        }
      />

      <div className="px-4 pt-4">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Search active protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="p-4 space-y-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {['All', 'Audio', 'Text', 'Image'].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-6 py-2.5 rounded-full text-[11px] font-medium uppercase tracking-widest transition-all shrink-0 ${filter === f ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-surface-dark text-slate-500 border border-slate-200 dark:border-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center animate-pulse">
            <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Syncing with Central Ledger...</p>
          </div>
        ) : (
          <>
            {/* TRAIN YOUR OWN AI CARD - Moved from Home */}
            {!searchQuery && (
              <section className="px-1 animate-fade-in">
                <div
                  onClick={() => onNavigate(ScreenName.CAPTURE_CHOICE)}
                  className="relative overflow-hidden p-6 rounded-[2.5rem] bg-slate-900 dark:bg-slate-800 text-white shadow-2xl border border-white/5 group active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-4 text-primary/20 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-[100px]">psychology</span>
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary rounded-md text-[10px] font-bold uppercase tracking-widest mb-3 border border-primary/30">Laboratory</span>
                    <h3 className="text-2xl font-bold uppercase tracking-tighter leading-none mb-2">Train your <br />own AI</h3>
                    <p className="text-slate-400 text-sm font-medium mb-4 max-w-[180px]">Personalize models with your data and preferences.</p>
                    <button className="flex items-center gap-2 text-primary text-[11px] font-bold uppercase tracking-widest">
                      Open Neural Lab <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {!searchQuery && (
              <section className="animate-fade-in overflow-hidden">
                <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-4 px-1">Featured Tasks</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory px-1 pb-4">
                  {featuredTasksList.map((fTask) => (
                    <div key={fTask.id} onClick={() => onNavigate(ScreenName.TASK_DETAILS)} className={`relative overflow-hidden min-w-[280px] rounded-[2rem] bg-gradient-to-br ${fTask.color} p-6 text-white shadow-xl snap-center active:scale-[0.98] transition-all cursor-pointer`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-[100px]">auto_awesome</span>
                      </div>
                      <div className="relative z-10">
                        <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md rounded text-[10px] font-semibold uppercase tracking-widest mb-3">Priority Contract</span>
                        <h4 className="text-xl font-bold uppercase tracking-tight mb-1">{fTask.title}</h4>
                        <p className="text-white/70 text-sm mb-4 h-10 line-clamp-2">{fTask.description}</p>
                        <div className="flex justify-between items-end">
                          <div className="flex gap-3">
                            <span className="text-[11px] font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bolt</span> {fTask.xp} XP</span>
                            <span className="text-[11px] font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {fTask.time}</span>
                          </div>
                          <p className="text-2xl font-bold">${fTask.reward.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="animate-fade-in">
              <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-4 px-1">Available Missions</h3>
              <div className="grid gap-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} onClick={() => onNavigate(ScreenName.TASK_DETAILS)} className="p-3.5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center gap-3.5">
                    <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-xl">{task.type === 'audio' ? 'mic' : task.type === 'text' ? 'description' : 'image'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight uppercase truncate">{task.title}</h3>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span> {task.timeEstimate}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">bolt</span> {task.xp} XP
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-primary leading-none">${task.reward.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

// Enhanced Service with Supabase/S3 Integration
export const StorageService = {
  getUploadUrl: async (fileName: string, contentType: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('storage-manager', {
        body: {
          action: 'GET-UPLOAD-URL',
          bucket: 'xum-raw-submissions',
          fileName: `raw/${Date.now()}_${fileName}`,
          contentType
        }
      });
      if (error) throw error;
      return data.url;
    } catch (e) {
      console.error("S3 Handshake failed", e);
      return null;
    }
  },
  uploadToS3: async (url: string, blob: Blob) => {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': blob.type
        }
      });
      return response.ok;
    } catch (e) {
      console.error("Direct S3 transmission failed", e);
      return false;
    }
  }
};

export const TaskDetailsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 transition-colors duration-500">
      <Header title="Mission Brief" onBack={() => onNavigate(ScreenName.TASK_MARKETPLACE)} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">Image Labelling</span>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest">High Accuracy</span>
        </div>
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Street Sign Labelling</h1>
        <div className="flex gap-4 mb-8">
          <div className="flex items-center gap-1 text-primary font-bold text-[14px]">$0.50 Reward</div>
          <div className="flex items-center gap-1 text-slate-500 font-medium text-[14px]">2m Est.</div>
        </div>
        <section className="space-y-8">
          <div>
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3">Objective</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium text-[16px]">Ground AI navigation protocols by identifying and categorizing urban signage in complex street view captures.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-[2rem] bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">XP Bonus</p>
              <p className="text-xl font-bold text-primary">+25 XP</p>
            </div>
            <div className="p-5 rounded-[2rem] bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">Difficulty</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Easy</p>
            </div>
          </div>
        </section>
        <div className="fixed bottom-0 left-0 w-full p-4 bg-background-light/95 dark:bg-background-dark/95 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button onClick={() => onNavigate(ScreenName.TEXT_INPUT_TASK)} className="w-full h-14 bg-primary text-white rounded-2xl text-[14px] font-bold uppercase tracking-widest shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">Accept Protocol</button>
        </div>
      </div>
    </div>
  );
};

export const CaptureChoiceScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const choices = [
    { id: 'aud', title: 'Record Voice', desc: 'Audio linguistic grounding.', icon: 'mic', color: 'bg-blue-600', screen: ScreenName.CAPTURE_AUDIO },
    { id: 'img', title: 'Capture Image', desc: 'Visual environment mapping.', icon: 'photo_camera', color: 'bg-emerald-500', screen: ScreenName.MEDIA_CAPTURE },
    { id: 'vid', title: 'Record Video', desc: 'Temporal scene analysis.', icon: 'videocam', color: 'bg-rose-500', screen: ScreenName.CAPTURE_VIDEO },
    { id: 'txt', title: 'Write/Type Text', desc: 'Semantic text datasets.', icon: 'description', color: 'bg-orange-500', screen: ScreenName.TEXT_INPUT_TASK },
    { id: 'val', title: 'Validate Data', desc: 'Cross-verify node accuracy.', icon: 'fact_check', color: 'bg-indigo-500', screen: ScreenName.VALIDATION_TASK }
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark animate-fade-in transition-colors duration-500">
      <Header title="Capture Data" onBack={() => onNavigate(ScreenName.HOME)} />
      <div className="p-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-8">Environmental <br />Sensing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {choices.map((choice) => (
            <div key={choice.id} onClick={() => onNavigate(choice.screen)} className="group p-6 rounded-[2.5rem] bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-xl active:scale-[0.97] transition-all cursor-pointer flex items-center gap-6">
              <div className={`size-16 md:size-24 rounded-3xl ${choice.color} flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl md:text-5xl font-bold">{choice.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg md:text-2xl leading-tight uppercase tracking-tight">{choice.title}</h3>
                <p className="text-[13px] md:text-base text-slate-500 dark:text-slate-400 mt-1 uppercase font-semibold tracking-widest">{choice.desc}</p>
              </div>
              <span className="material-symbols-outlined ml-auto text-slate-300">chevron_right</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CaptureVideoScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

  const handleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      setStatus('uploading');

      // Simulate real S3 upload flow
      const uploadUrl = await StorageService.getUploadUrl('submission.mp4', 'video/mp4');
      if (uploadUrl) {
        const mockBlob = new Blob(["video data"], { type: 'video/mp4' });
        await StorageService.uploadToS3(uploadUrl, mockBlob);
      }

      await TaskService.submitPayload('video-capture', { type: 'video', s3_path: 'raw/video' }, 1.50, 40);
      setStatus('success');
      onCompleteTask?.(1.50, 40);
      setTimeout(() => onNavigate(ScreenName.TASK_SUCCESS), 1500);
    } else {
      setIsRecording(true);
    }
  };

  if (status === 'uploading') {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Syncing Visuals</h2>
        <p className="text-slate-500 text-sm mt-2">Transmitting to H-S3 Cluster...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden relative">
      <div className="p-6 flex justify-between items-center relative z-20">
        <button onClick={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="size-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white"><span className="material-symbols-outlined">close</span></button>
        <h2 className="text-white text-[11px] font-bold uppercase tracking-widest">Video Lab</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className={`w-full max-w-sm aspect-[9/16] rounded-[3rem] bg-slate-900 border-2 border-white/10 relative overflow-hidden flex flex-col items-center justify-center transition-all ${isRecording ? 'ring-4 ring-red-500 ring-offset-4 ring-offset-black' : ''}`}>
          {!isRecording && status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm z-10 text-center">
              <span className="material-symbols-outlined text-5xl text-white mb-4">video_library</span>
              <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">Temporal Sensing</h3>
              <p className="text-slate-400 text-xs mb-6">You can record a live stream or upload an existing capture from your neural archive.</p>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">upload</span> Upload from device
              </button>
            </div>
          )}
          <span className="material-symbols-outlined text-[100px] text-white/5">{isRecording ? 'videocam' : 'videocam_off'}</span>
          {isRecording && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
              <div className="size-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold text-xs uppercase tracking-widest">Recording...</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-12 flex items-center justify-center gap-12 relative z-20">
        <button onClick={handleRecord} className={`size-24 rounded-full border-4 p-1.5 active:scale-95 transition-all ${isRecording ? 'border-red-500' : 'border-white'}`}>
          <div className={`w-full h-full rounded-full transition-all ${isRecording ? 'bg-red-500 rounded-lg scale-75' : 'bg-white'}`}></div>
        </button>
      </div>
    </div>
  );
};

export const MediaCaptureScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading'>('idle');

  const handleCapture = async () => {
    setIsCapturing(true);
    setStatus('uploading');

    // S3 Pipeline
    const uploadUrl = await StorageService.getUploadUrl(`image_${label.replace(/\s/g, '_')}.jpg`, 'image/jpeg');
    if (uploadUrl) {
      const mockBlob = new Blob(["image data"], { type: 'image/jpeg' });
      await StorageService.uploadToS3(uploadUrl, mockBlob);
    }

    await TaskService.submitPayload('image-capture', { type: 'image', label, s3_path: 'raw/images' }, 0.50, 20);

    setIsCapturing(false);
    onCompleteTask?.(0.50, 20);
    onNavigate(ScreenName.TASK_SUCCESS);
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden relative">
      <div className="p-6 flex justify-between items-center relative z-20">
        <button onClick={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="size-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white"><span className="material-symbols-outlined">close</span></button>
        <h2 className="text-white text-[11px] font-bold uppercase tracking-widest">Image Lab</h2>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center relative">
        <div className="w-full aspect-[4/5] rounded-[3rem] bg-slate-900 border-2 border-white/10 relative overflow-hidden flex items-center justify-center">
          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/60 backdrop-blur-sm z-10 text-center">
              <span className="material-symbols-outlined text-5xl text-white mb-4">add_a_photo</span>
              <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">Visual Mapping</h3>
              <p className="text-slate-400 text-xs mb-6">Snap a fresh capture or select an image from your device storage.</p>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">image</span> Select from Gallery
              </button>
            </div>
          )}
          <span className="material-symbols-outlined text-[100px] text-white/5">photo_camera</span>
          {isCapturing && (
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="size-10 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
            </div>
          )}
        </div>

        <div className="w-full mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative z-30">
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Capture Label</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Assign semantic tag..."
            className="w-full h-14 bg-transparent border-b border-white/20 text-white font-bold text-lg outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="p-8 pb-12 flex items-center justify-center gap-12 relative z-20">
        <button onClick={handleCapture} disabled={!label || isCapturing} className="size-24 rounded-full border-4 border-white p-1.5 active:scale-95 transition-all disabled:opacity-20">
          <div className="w-full h-full rounded-full bg-white"></div>
        </button>
      </div>
    </div>
  );
};

export const CaptureAudioScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'transmitting'>('idle');

  const handleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      setStatus('transmitting');

      // S3 Pipeline
      const uploadUrl = await StorageService.getUploadUrl('audio_capture.wav', 'audio/wav');
      if (uploadUrl) {
        const mockBlob = new Blob(["audio data"], { type: 'audio/wav' });
        await StorageService.uploadToS3(uploadUrl, mockBlob);
      }

      await TaskService.submitPayload('audio-capture', { type: 'audio', description, s3_path: 'raw/audio' }, 1.00, 35);

      onCompleteTask?.(1.00, 35);
      onNavigate(ScreenName.TASK_SUCCESS);
    } else {
      setIsRecording(true);
    }
  };

  if (status === 'transmitting') {
    return (
      <div className="h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-8 text-center">
        <div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold uppercase tracking-tight">Transmitting Frequencies</h2>
        <p className="text-slate-500 text-sm mt-2">Syncing with H-S3 Archive...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col transition-colors duration-500">
      <Header title="Audio Capture" onBack={() => onNavigate(ScreenName.CAPTURE_CHOICE)} />
      <div className="flex-1 p-6 flex flex-col items-center justify-center gap-12">
        <div className="relative size-48 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-primary/20 transition-all duration-700 ${isRecording ? 'scale-150 opacity-0 animate-ping' : 'scale-100 opacity-100'}`}></div>
          <div className={`size-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_40px_rgba(19,73,236,0.3)]'}`}>
            <span className="material-symbols-outlined text-white text-[60px]">{isRecording ? 'pause' : 'mic'}</span>
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
            <label className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">Linguistic Context</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Briefly describe the audio environment..."
              className="w-full h-24 bg-transparent text-slate-900 dark:text-white font-medium outline-none resize-none"
            />
          </div>
          <button
            onClick={handleRecord}
            disabled={!description && !isRecording}
            className={`w-full h-16 rounded-3xl text-sm font-bold uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 ${isRecording ? 'bg-red-500 text-white' : 'bg-primary text-white'}`}
          >
            {isRecording ? 'Finish & Label' : 'Initialize Capture'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const HybridCaptureScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask }) => {
  const [step, setStep] = useState<'video' | 'labeling'>('video');
  const [tags, setTags] = useState<string[]>([]);

  const handleNext = async () => {
    if (step === 'video') setStep('labeling');
    else {
      await TaskService.submitPayload('hybrid-task-id', { tags, description: 'Hybrid data' }, 2.50, 60);
      onCompleteTask?.(2.50, 60);
      onNavigate(ScreenName.TASK_SUCCESS);
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden text-white transition-colors duration-500">
      <div className="p-6 flex justify-between items-center border-b border-white/5">
        <button onClick={() => onNavigate(ScreenName.CAPTURE_CHOICE)} className="size-10 rounded-full bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
        <h2 className="text-[11px] font-bold uppercase tracking-widest">Hybrid Protocol</h2>
        <div className="size-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {step === 'video' ? (
          <div className="p-6 flex flex-col items-center gap-8 animate-fade-in">
            <div className="w-full aspect-square rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
              <span className="material-symbols-outlined text-[80px] opacity-10">videocam</span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold uppercase tracking-tighter mb-2">Capture Visuals</h3>
              <p className="text-white/40 text-sm font-medium">Record a 10s clip of your current environment.</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-8 animate-fade-in">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Select Semantic Tags</h4>
              <div className="flex flex-wrap gap-2">
                {['Urban', 'Indoor', 'Speech', 'Crowded', 'Noisy', 'Nature', 'Traffic'].map(t => (
                  <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${tags.includes(t) ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Scene Description</h4>
              <textarea placeholder="Describe the sequence..." className="w-full bg-transparent outline-none h-24 text-sm font-medium resize-none"></textarea>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pb-12 bg-slate-950/80 backdrop-blur-md border-t border-white/5">
        <button
          onClick={handleNext}
          className="w-full h-16 bg-white text-slate-950 rounded-3xl text-sm font-bold uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
        >
          {step === 'video' ? 'Next: Labelling' : 'Seal Submission'}
        </button>
      </div>
    </div>
  );
};

export const LanguageTaskRunnerScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask, engineType = 'grounding' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textValue, setTextValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'submitting'>('idle');
  const [consensusScore, setConsensusScore] = useState(0);
  const [audioBars, setAudioBars] = useState<number[]>(new Array(12).fill(10));

  const [selectedEngine, setSelectedEngine] = useState<LinguasenseEngine>(engineType);

  // Sync if the engineType prop changes (e.g., navigating from different engine cards)
  useEffect(() => { setSelectedEngine(engineType); }, [engineType]);

  const engineConfigs: Record<LinguasenseEngine, { title: string; tasks: LinguasenseTask[] }> = {
    grounding: {
      title: 'Grounding Engine',
      tasks: [
        { id: '550e8400-e29b-41d4-a716-446655440000', prompt: 'What is the local slang for "Fake/Imitation" in Lagos?', context: 'Street commerce and fashion.', type: 'both', reward: 0.75, xp: 30, targetLanguage: 'Yoruba-Pidgin' },
        { id: '550e8400-e29b-41d4-a716-446655440001', prompt: 'Record the correct pronunciation of "Owanbe".', context: 'Party context.', type: 'voice', reward: 1.20, xp: 50, targetLanguage: 'Yoruba' },
      ]
    },
    synthesis: {
      title: 'Synthesis Lab',
      tasks: [
        { id: '550e8400-e29b-41d4-a716-446655440003', prompt: 'Critique this AI-generated joke for cultural relevance.', context: 'Social satire.', type: 'text', reward: 1.50, xp: 40, targetLanguage: 'Igbo-English' },
        { id: '550e8400-e29b-41d4-a716-446655440004', prompt: 'Perform a roleplay of a traditional market negotiation.', context: 'Economic culture.', type: 'voice', reward: 2.00, xp: 60, targetLanguage: 'Hausa' },
      ]
    },
    audit: {
      title: 'Audit Layer',
      tasks: [
        { id: '550e8400-e29b-41d4-a716-446655440005', prompt: 'Identify factual hallucinations in this localized news brief.', context: 'News verification.', type: 'text', reward: 1.80, xp: 45, targetLanguage: 'En-NG' },
        { id: '550e8400-e29b-41d4-a716-446655440006', prompt: 'Verify the safety and toxicity of this dialect-heavy dialogue.', context: 'Moderation.', type: 'both', reward: 2.50, xp: 70, targetLanguage: 'Pidgin' },
      ]
    }
  };

  const currentConfig = engineConfigs[selectedEngine];
  const linguasenseTasks = currentConfig.tasks;

  const currentTask = linguasenseTasks[currentIndex];

  // Simulated Audio Visualization
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioBars(prev => prev.map(() => Math.floor(Math.random() * 40) + 10));
      }, 100);
    } else {
      setAudioBars(new Array(12).fill(10));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    // Simulate AI analyzing context as you type
    if (textValue.length > 5 && status === 'idle') {
      const interval = setInterval(() => {
        setConsensusScore(prev => Math.min(prev + Math.random() * 15, 88));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [textValue, status]);

  const handleSubmit = async () => {
    setStatus('analyzing');
    // Simulated deep processing
    await new Promise(r => setTimeout(r, 2000));
    setStatus('submitting');

    try {
      await TaskService.submitPayload(currentTask.id, {
        text: textValue,
        audio: audioUrl || 's3://xum-raw-submissions/audio/simulated.wav',
        language: currentTask.targetLanguage,
        model_version: 'linguasense-v2-gamma',
        handshake_id: Math.random().toString(36).substring(7)
      }, currentTask.reward, currentTask.xp);

      onCompleteTask?.(currentTask.reward, currentTask.xp);

      if (currentIndex < linguasenseTasks.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setTextValue('');
        setAudioUrl(null);
        setConsensusScore(0);
        setStatus('idle');
      } else {
        onNavigate(ScreenName.TASK_SUCCESS);
      }
    } catch (e) {
      setStatus('idle');
      alert("Neural sync failed. Please check connection.");
    }
  };

  if (status !== 'idle') {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center transition-colors duration-500">
        <div className="relative size-32 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border-4 border-emerald-500/20 animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-primary text-5xl">{status === 'analyzing' ? 'psychology' : 'cloud_upload'}</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-tighter mb-2">
          {status === 'analyzing' ? 'Neural Cross-Check' : 'Encrypting Payload'}
        </h2>
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden mt-4 relative">
          <div className="h-full bg-primary animate-progress shadow-[0_0_10px_#1349ec]"></div>
        </div>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-6">
          Transmission Protocol: AES-XUM-2025
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-500">
      <Header
        title={currentConfig.title}
        onBack={() => onNavigate(ScreenName.LINGUASENSE)}
      />

      <div className="flex-1 p-6 flex flex-col">
        {/* Progress Matrix */}
        <div className="flex gap-1.5 mb-8">
          {linguasenseTasks.map((_, i) => (
            <div key={i} className="h-1 flex-1 relative bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
              {i <= currentIndex && (
                <div className={`h-full bg-primary transition-all duration-1000 ${i === currentIndex ? 'w-1/2' : 'w-full'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Prompt Card */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-2xl mb-6">
          <div className="absolute -right-4 -top-4 opacity-5">
            <span className="material-symbols-outlined text-[100px] text-primary">{currentTask.type === 'voice' ? 'mic' : 'translate'}</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 bg-primary text-white rounded text-[9px] font-bold uppercase tracking-widest">{currentTask.targetLanguage}</span>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{currentTask.context}</span>
          </div>
          <p className="text-slate-900 dark:text-white font-bold text-2xl leading-[1.1] tracking-tight">
            {currentTask.prompt}
          </p>
        </div>

        {/* Dynamic Input Hub */}
        <div className="flex-1 space-y-4 flex flex-col">
          {(currentTask.type === 'text' || currentTask.type === 'both') && (
            <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] p-7 border border-slate-200 dark:border-white/5 flex flex-col flex-1 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ground Truth Input</label>
                {consensusScore > 0 && (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">AI Confidence: {Math.floor(consensusScore)}%</span>
                  </div>
                )}
              </div>
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Expose the cultural nuance here..."
                className="w-full flex-1 bg-transparent text-slate-900 dark:text-white font-bold text-xl outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-800"
              />
            </div>
          )}

          {(currentTask.type === 'voice' || currentTask.type === 'both') && (
            <div className={`p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between shadow-lg ${isRecording ? 'bg-red-500/5 border-red-500' : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5'}`}>
              <div className="flex-1 text-slate-900 dark:text-white">
                <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isRecording ? 'text-red-500' : 'text-primary'}`}>
                  {isRecording ? 'Capturing Frequency...' : 'Audio Synthesis'}
                </h4>
                {/* Visualizer bars */}
                <div className="flex items-end gap-1 h-8">
                  {audioBars.map((h, i) => (
                    <div key={i} className={`w-1 rounded-full transition-all duration-100 ${isRecording ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`} style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`size-20 rounded-[2rem] flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-500 text-white scale-110' : 'bg-slate-900 dark:bg-primary text-white'}`}
              >
                <span className="material-symbols-outlined text-3xl font-bold">{isRecording ? 'stop_circle' : 'mic'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-8 pb-4">
          <button
            disabled={(!textValue && currentTask.type !== 'voice') || (currentTask.type === 'voice' && !isRecording && !audioUrl)}
            onClick={handleSubmit}
            className="w-full h-18 bg-primary text-white rounded-[2rem] text-sm font-bold uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(19,73,236,0.2)] active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
          >
            {currentIndex === linguasenseTasks.length - 1 ? 'Finalize Synthesis' : `Next ${selectedEngine.charAt(0).toUpperCase() + selectedEngine.slice(1)}`}
            <span className="material-symbols-outlined text-white">neurology</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const TextInputTaskScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask }) => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async () => {
    setStatus('submitting');
    try {
      await TaskService.submitPayload('mock-id-1', { response: value }, 0.50, 25);
      setStatus('success');
      onCompleteTask?.(0.50, 25);
      setTimeout(() => onNavigate(ScreenName.TASK_SUCCESS), 1500);
    } catch (e) {
      setStatus('idle');
      alert("Submission failed. Handshake interrupted.");
    }
  };

  if (status === 'submitting') {
    return (
      <div className="h-screen bg-background-dark flex flex-col items-center justify-center p-8 text-center transition-colors duration-500">
        <div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">Syncing Data</h2>
        <p className="text-slate-500 font-medium text-sm">Uploading contribution to decentralized node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <Header title="Mission Execution" onBack={() => onNavigate(ScreenName.TASK_DETAILS)} />
      <div className="flex-1 p-6 flex flex-col">
        <div className="bg-primary/10 rounded-3xl p-6 border border-primary/20 mb-8">
          <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">Prompt Protocol</h3>
          <p className="text-slate-900 dark:text-white font-medium text-lg">"Identify and transcribe the text visible on the main billboard in this scene."</p>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest ml-1">Contributor Input</label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter transcription here..."
            className="w-full flex-1 rounded-[2.5rem] bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-8 text-lg font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none dark:text-white"
          />
        </div>

        <div className="pt-8 pb-4">
          <button
            disabled={!value}
            onClick={handleSubmit}
            className="w-full h-16 bg-primary text-white rounded-3xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-20 transition-all"
          >
            Submit Contribution
          </button>
        </div>
      </div>
    </div>
  );
};

export const TaskSuccessScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-8 text-center animate-fade-in transition-colors duration-500">
      <div className="size-40 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        <span className="material-symbols-outlined text-white text-[80px]">verified</span>
      </div>
      <h2 className="text-4xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Contribution <br />Validated</h2>
      <p className="text-slate-500 font-medium text-sm mb-12 max-w-xs">Handshake successful. Your accreditation is being processed by the network.</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
        <div className="p-6 rounded-[2rem] bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">Accredited</p>
          <p className="text-2xl font-bold text-primary">+$0.50</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">Node Exp</p>
          <p className="text-2xl font-bold text-emerald-500">+25 XP</p>
        </div>
      </div>

      <button onClick={() => onNavigate(ScreenName.HOME)} className="w-full max-w-xs h-16 bg-primary text-white rounded-3xl text-sm font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Return to Home</button>
    </div>
  );
};

export const LinguasenseScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const engineStats = [
    { label: 'Global Reaching', value: '114 Nodes' },
    { label: 'Dataset Purity', value: '99.8%' },
    { label: 'Human Network', value: '2.4M' }
  ];

  const categories: { id: string; engine: 'grounding' | 'synthesis' | 'audit'; title: string; desc: string; icon: string; color: string; count: number }[] = [
    { id: 'l1', engine: 'grounding', title: 'Grounding (H2D)', desc: 'Convert human dialects into machine intelligence.', icon: 'neurology', color: 'from-blue-600 to-indigo-800', count: 42 },
    { id: 'l2', engine: 'synthesis', title: 'Synthesis (D2H)', desc: 'Test AI comprehension of complex cultural cues.', icon: 'auto_awesome', color: 'from-purple-600 to-pink-700', count: 18 },
    { id: 'l3', engine: 'audit', title: 'Audit Layer', desc: 'Identify and correct hallucinations in LLM outputs.', icon: 'security', color: 'from-emerald-600 to-teal-800', count: 31 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 animate-fade-in transition-colors duration-500 font-sans">
      <Header title="Linguasense Engine" onBack={() => onNavigate(ScreenName.HOME)} transparent />

      {/* Engine Hero */}
      <div className="px-6 pt-4 pb-12">
        <div className="relative p-8 rounded-[3rem] bg-gradient-to-br from-slate-900 via-slate-900 to-primary/20 border border-white/5 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-20 animate-spin-slow">
            <span className="material-symbols-outlined text-[140px] text-primary">hub</span>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#1349ec]"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Core Systems Active</span>
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter leading-none mb-4">
              Deep <br />Language Lab
            </h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[200px] mb-8">
              Bridges the gap between human culture and artificial reasoning.
            </p>

            <div className="flex gap-4 border-t border-white/5 pt-6">
              {engineStats.map((stat, i) => (
                <div key={i} className="flex-1">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xs font-bold text-white uppercase">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-6 px-4">Neural Infrastructure</h2>
        <div className="grid gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate(ScreenName.LANGUAGE_RUNNER, cat.engine)}
              className="group relative p-6 rounded-[2rem] bg-slate-900/50 border border-white/5 hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                  <span className="material-symbols-outlined text-2xl font-bold text-primary group-hover:scale-110 transition-transform">{cat.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-white text-lg leading-none uppercase tracking-tight">{cat.title}</h3>
                    <span className="text-[10px] font-bold text-primary uppercase">{cat.count} Tasks</span>
                  </div>
                  <p className="text-[12px] text-slate-400 font-medium leading-snug">{cat.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal View Footnote */}
      <div className="px-10 pb-12 mt-4">
        <div className="py-4 border-t border-white/5 flex items-center justify-between text-slate-600">
          <p className="text-[9px] font-mono tracking-widest uppercase">Encryption: AES-256</p>
          <p className="text-[9px] font-mono tracking-widest uppercase">Status: 200 OK</p>
        </div>
      </div>
    </div>
  );
};

// Keeping placeholders for others
export const CreateTaskScreen: React.FC<ScreenProps> = ({ onNavigate }) => <div className="min-h-screen bg-background-light dark:bg-background-dark"><Header title="Create" onBack={() => onNavigate(ScreenName.HOME)} /></div>;
export const ValidationTaskScreen: React.FC<ScreenProps> = ({ onNavigate, onCompleteTask }) => {
  const [correction, setCorrection] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');

  const handleSubmit = async () => {
    if (isCorrect === null) return;
    setStatus('submitting');

    // Simulate complex validation logic (3 min threshold)
    await new Promise(r => setTimeout(r, 1500));

    await TaskService.submitPayload('val-task-001', {
      is_accurate: isCorrect,
      correction: isCorrect ? '' : correction,
      validation_count: 1 // In a real app, this would be updated in the DB
    }, 0.30, 15);

    onCompleteTask?.(0.30, 15);
    onNavigate(ScreenName.TASK_SUCCESS);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 transition-colors duration-500">
      <Header title="Neural Validation" onBack={() => onNavigate(ScreenName.CAPTURE_CHOICE)} />
      <div className="p-6">
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-sm">info</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Protocol Instruction</span>
          </div>
          <p className="text-slate-900 dark:text-white font-medium leading-relaxed">
            Verify the accuracy of the following contribution. This requires at least <span className="text-primary font-bold">3 independent node validations</span> before acceptance.
          </p>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl mb-8">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Original Contribution</h3>
          <div className="aspect-video bg-slate-100 dark:bg-black/20 rounded-2xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-slate-300">image</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase">"Traffic Light: Red"</p>
          <p className="text-sm text-slate-500">Label: <span className="text-primary font-bold">Urban Safety</span></p>
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2">Accuracy Verdict</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsCorrect(true)}
              className={`h-20 rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${isCorrect === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 text-slate-400'}`}
            >
              <span className="material-symbols-outlined mb-1">check_circle</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Accurate</span>
            </button>
            <button
              onClick={() => setIsCorrect(false)}
              className={`h-20 rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${isCorrect === false ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 text-slate-400'}`}
            >
              <span className="material-symbols-outlined mb-1">cancel</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Incorrect</span>
            </button>
          </div>

          {isCorrect === false && (
            <div className="animate-fade-in space-y-4">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block ml-2">Correct Submission & Notes</label>
              <textarea
                value={correction}
                onChange={e => setCorrection(e.target.value)}
                placeholder="What should this be? Provide reasoning..."
                className="w-full h-32 rounded-[2rem] bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-6 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="mt-12">
          <button
            disabled={isCorrect === null || (isCorrect === false && !correction) || status === 'submitting'}
            onClick={handleSubmit}
            className="w-full h-18 bg-primary text-white rounded-[2rem] text-sm font-bold uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3"
          >
            {status === 'submitting' ? 'Verifying Node...' : 'Submit Verification'}
          </button>
        </div>
      </div>
    </div>
  );
};
export const TaskSubmissionScreen: React.FC<ScreenProps> = ({ onNavigate }) => <div className="min-h-screen bg-background-light dark:bg-background-dark"><Header title="Review" onBack={() => onNavigate(ScreenName.HOME)} /></div>;
export const XUMJudgeTaskScreen: React.FC<ScreenProps> = ({ onNavigate }) => <div className="min-h-screen bg-background-light dark:bg-background-dark"><Header title="Judge" onBack={() => onNavigate(ScreenName.HOME)} /></div>;
export const RLHFCorrectionTaskScreen: React.FC<ScreenProps> = ({ onNavigate }) => <div className="min-h-screen bg-background-light dark:bg-background-dark"><Header title="Correction" onBack={() => onNavigate(ScreenName.HOME)} /></div>;
