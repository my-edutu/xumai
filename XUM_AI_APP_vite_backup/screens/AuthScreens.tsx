
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ScreenName } from '../types';

interface ScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

// Logic: Particles will gather towards these points, then fade into the solid SVG text.
const LOGO_MAP = [
  // X
  { x: 10, y: 30 }, { x: 15, y: 35 }, { x: 20, y: 40 }, { x: 25, y: 45 }, { x: 30, y: 50 }, { x: 35, y: 55 }, { x: 40, y: 60 },
  { x: 40, y: 30 }, { x: 35, y: 35 }, { x: 30, y: 40 }, { x: 20, y: 50 }, { x: 15, y: 55 }, { x: 10, y: 60 },
  // U
  { x: 50, y: 30 }, { x: 50, y: 35 }, { x: 50, y: 40 }, { x: 50, y: 45 }, { x: 50, y: 50 }, { x: 55, y: 55 }, { x: 60, y: 60 }, { x: 65, y: 60 }, { x: 70, y: 55 }, { x: 75, y: 50 }, { x: 75, y: 45 }, { x: 75, y: 40 }, { x: 75, y: 35 }, { x: 75, y: 30 },
  // M
  { x: 85, y: 60 }, { x: 85, y: 55 }, { x: 85, y: 50 }, { x: 85, y: 45 }, { x: 85, y: 40 }, { x: 85, y: 35 }, { x: 85, y: 30 },
  { x: 90, y: 35 }, { x: 95, y: 40 }, { x: 100, y: 45 }, { x: 105, y: 40 }, { x: 110, y: 35 },
  { x: 115, y: 30 }, { x: 115, y: 35 }, { x: 115, y: 40 }, { x: 115, y: 45 }, { x: 115, y: 50 }, { x: 115, y: 55 }, { x: 115, y: 60 },
  // A
  { x: 135, y: 60 }, { x: 135, y: 55 }, { x: 135, y: 50 }, { x: 135, y: 45 }, { x: 140, y: 40 }, { x: 145, y: 35 }, { x: 150, y: 30 }, { x: 155, y: 35 }, { x: 160, y: 40 }, { x: 165, y: 45 }, { x: 165, y: 50 }, { x: 165, y: 55 }, { x: 165, y: 60 },
  { x: 142, y: 48 }, { x: 148, y: 48 }, { x: 154, y: 48 }, { x: 160, y: 48 },
  // I
  { x: 175, y: 30 }, { x: 180, y: 30 }, { x: 185, y: 30 },
  { x: 180, y: 35 }, { x: 180, y: 40 }, { x: 180, y: 45 }, { x: 180, y: 50 }, { x: 180, y: 55 },
  { x: 175, y: 60 }, { x: 180, y: 60 }, { x: 185, y: 60 },
];

export const SplashScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [phase, setPhase] = useState<'scattered' | 'forming' | 'stable'>('scattered');

  const particles = useMemo(() => {
    return Array.from({ length: 800 }).map((_, i) => {
      const targetPoint = LOGO_MAP[i % LOGO_MAP.length];
      const scale = 0.28;
      const jitterX = (Math.random() - 0.5) * 1.5;
      const jitterY = (Math.random() - 0.5) * 1.5;

      return {
        id: i,
        size: Math.random() * 2 + 1,
        initialX: Math.random() * 100,
        initialY: Math.random() * 100,
        targetX: 50 + (targetPoint.x - 100) * scale + jitterX,
        targetY: 48 + (targetPoint.y - 45) * scale + jitterY,
        delay: Math.random() * 1200,
        duration: 2200 + Math.random() * 1800,
      };
    });
  }, []);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('forming'), 1200);
    const timer2 = setTimeout(() => setPhase('stable'), 5200);
    const timer3 = setTimeout(() => onNavigate(ScreenName.ONBOARDING), 8200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onNavigate]);

  return (
    <div className="relative h-screen w-full bg-gradient-to-b from-[#1349ec] via-[#10b981] to-[#0a0d1d] flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => onNavigate(ScreenName.ONBOARDING)}>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-white/5 rounded-full blur-[140px] animate-pulse"></div>
      </div>
      <div className={`relative z-30 transition-all duration-1000 transform ${phase === 'stable' ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-xl'}`}>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
          XUM AI
        </h1>
      </div>
      <div className={`absolute inset-0 z-20 transition-opacity duration-1000 ${phase === 'stable' ? 'opacity-0' : 'opacity-100'}`}>
        {particles.map((p) => {
          const isTarget = phase !== 'scattered';
          return (
            <div
              key={p.id}
              className="absolute rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all ease-in-out"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: `${isTarget ? p.targetX : p.initialX}%`,
                top: `${isTarget ? p.targetY : p.initialY}%`,
                opacity: phase === 'forming' ? 0.6 : 0.35,
                transitionDuration: `${p.duration}ms`,
                transitionDelay: `${isTarget ? p.delay : 0}ms`,
                transform: phase === 'forming' ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          );
        })}
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] opacity-10"></div>
    </div>
  );
};

export const OnboardingScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const slides = [
    { title: (<>Welcome to <span className="font-normal text-white/90">XUM AI</span></>), body: "Earn by helping train the next generation of AI — using your voice, language, and judgment.", cta: "Get Started", gradient: "from-[#1349ec] via-[#10b981] to-[#0a0d1d]", icons: [{ icon: 'mic', color: 'emerald', label: 'Voice Labeler', value: '+$0.45/min', pos: 'top-0 right-0', rot: 'rotate-6' }, { icon: 'verified', color: 'blue', label: 'RLHF Auditor', value: '+$1.20/task', pos: 'bottom-4 left-0', rot: '-rotate-3' }] },
    { title: "Simple Tasks. Real Money.", body: "Contribute by recording voice, labeling text or images, validating answers, or judging AI responses.", cta: "Next", gradient: "from-[#4f46e5] via-[#a855f7] to-[#0a0d1d]", icons: [{ icon: 'edit_note', color: 'purple', label: 'Text Editor', value: '+$0.15/msg', pos: 'top-2 left-4', rot: '-rotate-6' }, { icon: 'image_search', color: 'pink', label: 'Image Tagger', value: '+$0.80/task', pos: 'bottom-8 right-0', rot: 'rotate-12' }] },
    { title: "Your Data Trains Smarter AI", body: "Your language, culture, and decisions help AI understand the world better — more accurately and fairly.", cta: "Next", gradient: "from-[#0d9488] via-[#1349ec] to-[#0a0d1d]", icons: [{ icon: 'psychology', color: 'cyan', label: 'Logic Trainer', value: 'Level Up', pos: 'top-10 right-4', rot: 'rotate-12' }, { icon: 'public', color: 'emerald', label: 'Global Impact', value: 'Active', pos: 'bottom-0 left-8', rot: '-rotate-12' }] },
    { title: "Fair Pay. Full Control.", body: "Track your earnings in real time, withdraw anytime, and work only on tasks you qualify for.", cta: "Finish", gradient: "from-[#1349ec] via-[#4338ca] to-[#0a0d1d]", icons: [{ icon: 'payments', color: 'green', label: 'Instant Pay', value: 'Withdraw', pos: 'top-0 left-0', rot: '-rotate-12' }, { icon: 'shield_person', color: 'blue', label: 'Privacy Core', value: 'Secured', pos: 'bottom-4 right-4', rot: 'rotate-6' }] }
  ];

  const nextStep = () => { if (step < slides.length - 1) setStep(step + 1); else if (agreed) onNavigate(ScreenName.AUTH); };
  const prevStep = () => { if (step > 0) setStep(step - 1); };
  const current = slides[step];

  return (
    <div className={`relative h-screen w-full bg-gradient-to-b ${current.gradient} flex flex-col transition-all duration-1000 overflow-hidden font-display text-white`}>
      <div className="absolute top-1/4 -left-20 w-[150%] h-[400px] opacity-40 pointer-events-none rotate-[-15deg]">
        <svg viewBox="0 0 1000 1000" className="w-full h-full text-white/10 fill-none stroke-current stroke-[20] transition-all duration-1000"><path d="M0,500 C200,300 400,700 600,500 C800,300 1000,700 1200,500" /></svg>
      </div>
      <div className="px-8 pt-16 relative z-30">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center h-8">
            <button onClick={prevStep} className={`text-white transition-opacity duration-300 p-2 -ml-2 ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} aria-label="Go back"><span className="material-symbols-outlined text-3xl">arrow_back</span></button>
            <button onClick={() => onNavigate(ScreenName.AUTH)} className="text-white/60 text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-colors">Skip</button>
          </div>
          <div className="flex gap-2">{slides.map((_, i) => (<div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`} />))}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-end px-8 relative z-20 pb-4">
        <div className="relative h-44 w-full mb-8 animate-fade-in" key={`vis-${step}`}>
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-[100px] opacity-50"></div>
          {current.icons.map((item, idx) => (<div key={idx} className={`absolute ${item.pos} w-48 bg-white/10 backdrop-blur-2xl border border-white/20 p-4 rounded-[1.5rem] shadow-2xl ${item.rot} animate-[bounce_${idx === 0 ? '4s' : '5s'}_infinite] transition-all duration-700`}><div className="flex items-center gap-3"><div className={`size-10 rounded-xl bg-${item.color}-500/20 flex items-center justify-center text-${item.color}-400`}><span className="material-symbols-outlined text-xl">{item.icon}</span></div><div className="flex-1"><p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest leading-none mb-1">{item.label}</p><p className="text-sm font-bold text-white">{item.value}</p></div></div></div>))}
        </div>
        <div className="space-y-6 animate-fade-in" key={`txt-${step}`}>
          <h2 className="text-[3.2rem] font-bold leading-[1] tracking-[-0.04em]">{current.title}</h2>
          <div className="space-y-4"><h3 className="text-2xl font-medium leading-snug text-white/90 tracking-[-0.01em]">{current.body}</h3></div>
          {step === 3 && (
            <div className="pt-2 animate-fade-in">
              <label className="flex gap-4 items-center p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 group cursor-pointer transition-all hover:bg-white/10">
                <div className="relative flex items-center shrink-0">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only" />
                  <div className={`size-6 rounded-md border-2 transition-all flex items-center justify-center ${agreed ? 'bg-cyan-400 border-cyan-400' : 'border-white/20 bg-transparent'}`}>{agreed && <span className="material-symbols-outlined text-black text-base font-black">check</span>}</div>
                </div>
                <span className="text-[11px] text-white/60 leading-tight font-bold uppercase tracking-wider">I agree to the <span className="text-white underline">Terms</span> and <span className="text-white underline">Privacy Policy</span>.</span>
              </label>
            </div>
          )}
        </div>
      </div>
      <div className="px-8 pb-12 pt-8 relative z-30"><button onClick={nextStep} disabled={step === 3 && !agreed} style={{ height: '56px' }} className="w-full bg-white text-black rounded-[16px] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-20 active:bg-slate-100"><span className="text-[16px] font-semibold tracking-tight uppercase">{current.cta}</span><span className="material-symbols-outlined text-[20px]">arrow_forward_ios</span></button></div>
    </div>
  );
};

export const AuthScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<'Login' | 'SignUp'>('Login');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'SignUp') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              age: parseInt(age),
              role: 'worker' // Default role
            }
          }
        });
        if (signUpError) throw signUpError;
        alert('Verification email sent! Please check your inbox.');
        setMode('Login');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onNavigate(ScreenName.HOME);
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  const GoogleButton = () => (
    <button type="button" className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98] group">
      <svg className="size-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.19 2.7 1.227 6.655l4.039 3.11z" /><path fill="#FBBC05" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.114A11.982 11.982 0 0 0 12 24c3.055 0 5.782-1.01 7.91-2.782l-3.87-3.205z" /><path fill="#4285F4" d="M19.91 21.218c3.34-2.782 5.09-7.39 5.09-12.218 0-.818-.082-1.609-.227-2.373H12v4.61h7.527a6.45 6.45 0 0 1-2.79 4.227l3.87 3.205z" /><path fill="#34A853" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.795.118-1.55.336-2.264l-4.039-3.11C.423 8.164 0 9.991 0 12c0 2.01.423 3.836 1.218 5.373l4.059-3.105z" /></svg>
      <span className="text-sm font-bold tracking-tight text-white/90">{mode === 'Login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
    </button>
  );

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-y-auto max-w-md mx-auto bg-[#0a0d1d] text-white no-scrollbar">
      <div className="relative w-full h-[220px] shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1349ec]/40 to-transparent animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0d1d]"></div>
        <div className="relative z-10 flex flex-col justify-end h-full px-8 pb-8">
          <button onClick={() => onNavigate(ScreenName.ONBOARDING)} className="absolute top-8 left-6 text-white/40 hover:text-white transition-colors"><span className="material-symbols-outlined text-3xl">arrow_back</span></button>
          <h1 className="text-white text-4xl font-bold tracking-tighter leading-none mb-2">XUM AI<span className="text-cyan-400">.</span></h1>
          <h2 className="text-white/40 text-sm font-semibold uppercase tracking-[0.2em]">Contributor Terminal</h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col px-8 pb-10 pt-2 relative z-20">
        <div className="flex mb-8">
          <div className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-white/5 p-1 border border-white/10">
            <button onClick={() => setMode('Login')} className={`flex h-full grow items-center justify-center rounded-xl px-2 transition-all duration-300 ${mode === 'Login' ? 'bg-white text-black' : 'text-white/40'}`}><span className="font-bold text-xs uppercase tracking-widest">Log In</span></button>
            <button onClick={() => setMode('SignUp')} className={`flex h-full grow items-center justify-center rounded-xl px-2 transition-all duration-300 ${mode === 'SignUp' ? 'bg-white text-black' : 'text-white/40'}`}><span className="font-bold text-xs uppercase tracking-widest">Sign Up</span></button>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-shake">
            <p className="text-xs font-bold text-red-500 text-center uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {mode === 'SignUp' && (
            <div className="animate-fade-in flex flex-col gap-5">
              <div className="space-y-2">
                <label className="text-white/40 text-[10px] font-semibold uppercase tracking-widest ml-1">Identity: Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xl">person_outline</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 h-14 pl-12 pr-5 focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400/40 outline-none transition-all"
                    placeholder="Enter Full Name"
                    type="text"
                    required={mode === 'SignUp'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-white/40 text-[10px] font-semibold uppercase tracking-widest ml-1">Biological Age</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xl">event</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 h-14 pl-12 pr-5 focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400/40 outline-none transition-all"
                    placeholder="Enter Age"
                    type="number"
                    min="13"
                    required={mode === 'SignUp'}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-white/40 text-[10px] font-semibold uppercase tracking-widest ml-1">Terminal ID (Email)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xl">alternate_email</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 h-14 pl-12 pr-5 focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400/40 outline-none transition-all"
                placeholder="name@domain.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-white/40 text-[10px] font-semibold uppercase tracking-widest ml-1">Access Key (Password)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xl">lock_open</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 h-14 pl-12 pr-12 focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400/40 outline-none transition-all"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          {mode === 'Login' && (
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={() => onNavigate(ScreenName.FORGOT_PASSWORD)}
                className="text-[10px] text-cyan-400/60 font-black uppercase tracking-widest hover:text-cyan-400 transition-colors"
              >
                Forgot Access Key?
              </button>
            </div>
          )}
          <div className="flex flex-col gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black h-14 rounded-2xl text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : mode === 'Login' ? 'Log In' : 'Sign Up'}
            </button>
            <GoogleButton />
          </div>
        </form>
        <p className="mt-8 text-center text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">{mode === 'Login' ? "Unauthorized?" : "Already active?"} <button onClick={() => { setMode(mode === 'Login' ? 'SignUp' : 'Login'); }} className="text-cyan-400 ml-2 hover:underline transition-all">{mode === 'Login' ? 'Request Access' : 'Log In Instead'}</button></p>
      </div>
    </div>
  );
};

export const ForgotPasswordScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-[#0a0d1d] text-white overflow-hidden max-w-md mx-auto">
      <div className="relative h-48 flex flex-col justify-end p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent"></div>
        <button onClick={() => onNavigate(ScreenName.AUTH)} className="absolute top-8 left-6 text-white/40 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </button>
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tighter leading-tight mb-1 uppercase">Access Recovery</h1>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase">Let's get you back to earning</p>
        </div>
      </div>
      <div className="p-8 space-y-8 flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed text-white/60">
            Forgot your password? Enter your email below and we'll send a 4-digit verification code to your terminal.
          </p>
          <div className="space-y-2">
            <label className="text-white/40 text-[10px] font-black uppercase tracking-widest ml-1">Terminal ID (Email)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xl">alternate_email</span>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 h-16 pl-12 pr-5 outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all placeholder:text-white/10" placeholder="name@domain.com" type="email" />
            </div>
          </div>
        </div>
        <button onClick={() => onNavigate(ScreenName.OTP_VERIFICATION)} className="w-full h-16 bg-white text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Request Reset Code</button>
      </div>
    </div>
  );
};

export const OTPScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 3) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-[#0a0d1d] text-white overflow-hidden max-w-md mx-auto">
      <div className="relative h-48 flex flex-col justify-end p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent"></div>
        <button onClick={() => onNavigate(ScreenName.FORGOT_PASSWORD)} className="absolute top-8 left-6 text-white/40 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </button>
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tighter leading-tight mb-2 uppercase">Verify Identity</h1>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase">Enter the validation sequence</p>
        </div>
      </div>
      <div className="p-8 space-y-10 flex-1 flex flex-col justify-center items-center">
        <div className="text-center">
          <p className="text-sm font-medium leading-relaxed text-white/60 mb-8">Enter the 4-digit code we just sent to your inbox.</p>
          <div className="flex gap-4 justify-center">
            {otp.map((digit, i) => (
              <input key={i} ref={el => { inputs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onKeyDown={(e) => handleKeyDown(e, i)} onChange={(e) => handleChange(e.target.value, i)} className="size-16 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-black text-cyan-400 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 outline-none transition-all" />
            ))}
          </div>
        </div>
        <div className="w-full space-y-4">
          <button onClick={() => onNavigate(ScreenName.HOME)} className="w-full h-16 bg-white text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Verify & Access</button>
          <button className="w-full text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">Resend code (59s)</button>
        </div>
      </div>
    </div>
  );
};
