
import React, { useState, useEffect } from 'react';
import { ScreenName } from '../types';
import { Header, BottomNav } from '../components/Shared';

interface Transaction {
  title: string;
  date: string;
  amount: string;
  type: string;
  icon: string;
  color: string;
}

import { supabase } from '../supabaseClient';

const WalletService = {
  requestWithdrawal: async (amount: number, method: string, details: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc('request_withdrawal', {
        p_user_id: user.id,
        p_amount: amount,
        p_method: method,
        p_account_details: details
      });

      if (error) throw error;
      return { status: 'success', id: data };
    } catch (e: any) {
      console.error("Protocol error during liquidity transfer", e);
      return { status: 'error', message: e.message || 'Handshake rejected' };
    }
  }
};

interface ScreenProps {
  onNavigate: (screen: ScreenName) => void;
  balance?: number;
  history?: Transaction[];
  onConfirm?: (amount: number, method: string) => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  activeThemeId?: string;
  setActiveThemeId?: (id: string) => void;
  themes?: any[];
}

export const HomeScreen: React.FC<ScreenProps> = (props) => {
  const { onNavigate, balance, profile } = props;

  const quickTasks = [
    { id: '1', title: 'Street Sign Labeling', type: 'image', reward: '$0.50', xp: '25', time: '2m', icon: 'image' },
    { id: '2', title: 'Local Dialect Voice', type: 'audio', reward: '$1.25', xp: '50', time: '5m', icon: 'mic' },
    { id: '3', title: 'Sentiment Check', type: 'text', reward: '$0.15', xp: '10', time: '1m', icon: 'description' }
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32 font-display transition-colors duration-500">
      <header className="p-6 pt-12 md:pt-16 md:pb-16 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-20 md:px-12">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-[1.1] tracking-tighter uppercase">
          Welcome back, <br /><span className="text-primary">{profile?.full_name?.split(' ')[0] || 'Agent'}</span>
        </h2>
      </header>

      <div className="space-y-12 md:px-12">
        <section className="px-5 md:px-0 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
          <div onClick={() => onNavigate(ScreenName.WALLET)} className="flex flex-col gap-3 md:gap-6 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 bg-surface-light dark:bg-surface-dark shadow-xl border border-slate-100 dark:border-slate-800/50 cursor-pointer active:scale-95 transition-all group md:col-span-1 min-h-[140px] md:min-h-[200px] justify-center">
            <div className="flex items-center gap-2 md:gap-3 text-slate-500 dark:text-slate-400">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined text-[20px] md:text-3xl">account_balance_wallet</span>
              </div>
              <p className="text-[10px] md:text-sm font-semibold uppercase tracking-widest">Earned</p>
            </div>
            <p className="text-2xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">${balance?.toFixed(2)}</p>
          </div>

          <div className="flex flex-col gap-3 md:gap-6 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 bg-surface-light dark:bg-surface-dark shadow-xl border border-slate-100 dark:border-slate-800/50 cursor-pointer active:scale-95 transition-all group md:col-span-1 min-h-[140px] md:min-h-[200px] justify-center">
            <div className="flex items-center gap-2 md:gap-3 text-slate-500 dark:text-slate-400">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                <span className="material-symbols-outlined text-[20px] md:text-3xl">hourglass_top</span>
              </div>
              <p className="text-[10px] md:text-sm font-semibold uppercase tracking-widest">Pending</p>
            </div>
            <p className="text-2xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">$24.00</p>
          </div>

          <div onClick={() => onNavigate(ScreenName.LEADERBOARD)} className="col-span-2 relative overflow-hidden rounded-[2rem] md:rounded-[3.5rem] theme-card-gradient p-6 md:p-12 shadow-2xl cursor-pointer active:scale-[0.98] transition-all min-h-[160px] md:min-h-[200px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[100px] md:text-[220px]">public</span>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0 h-full">
              <div className="flex flex-col justify-center">
                <span className="inline-block px-3 py-1 md:px-4 md:py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] md:text-xs font-semibold uppercase tracking-widest w-fit mb-2 md:mb-4">Network Status</span>
                <p className="text-xl md:text-3xl text-white font-bold leading-none tracking-tight">Global Connectivity</p>
                <div className="flex items-center gap-2 mt-2 md:mt-4 text-emerald-400">
                  <span className="material-symbols-outlined text-base md:text-xl">check_circle</span>
                  <span className="text-[10px] md:text-sm font-semibold uppercase tracking-widest">Operational</span>
                </div>
              </div>
              <div className="md:text-right flex flex-col justify-center">
                <p className="text-white/60 text-[10px] md:text-sm font-bold uppercase tracking-widest leading-none mb-1">Current Node</p>
                <p className="text-white text-4xl md:text-7xl font-bold leading-none">#142</p>
              </div>
            </div>
          </div>
        </section>

        <div className="md:grid md:grid-cols-2 md:gap-12">
          <section className="animate-fade-in mb-12 md:mb-0">
            <div className="px-5 md:px-0 flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">XUM Judge</h3>
            </div>
            <div className="px-5 md:px-0">
              <div className="relative flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-white dark:bg-surface-dark border-2 border-dashed border-slate-200 dark:border-slate-700 text-center overflow-hidden">
                <div className="size-16 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-slate-400">lock</span>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base uppercase tracking-tight">Locked</h4>
                  <p className="text-slate-400 text-sm font-medium mt-1">Complete more tasks to unlock XUM Judge.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="animate-fade-in">
            <div className="px-5 md:px-0 flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Daily Missions</h3>
              <button onClick={() => onNavigate(ScreenName.TASK_MARKETPLACE)} className="text-[11px] md:text-sm font-bold text-primary uppercase tracking-widest hover:underline">Browse all</button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 md:px-0">
              {quickTasks.map((task) => (
                <div key={task.id} onClick={() => onNavigate(ScreenName.TASK_DETAILS)} className="flex items-center gap-5 md:gap-8 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.99] transition-all cursor-pointer group">
                  <div className={`size-14 md:size-20 rounded-2xl md:rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 group-hover:bg-primary group-hover:text-white transition-all`}>
                    <span className="material-symbols-outlined text-xl md:text-4xl">{task.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm md:text-xl text-slate-900 dark:text-white uppercase truncate leading-tight">{task.title}</h4>
                    <div className="flex items-center gap-3 md:gap-5 mt-2">
                      <span className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs md:text-lg">schedule</span> {task.time}
                      </span>
                      <span className="text-[10px] md:text-sm font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs md:text-lg">bolt</span> {task.xp} XP
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-lg md:text-3xl font-black text-primary leading-none">{task.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <BottomNav currentScreen={ScreenName.HOME} {...props} />
    </div>
  );
};

export const WalletScreen: React.FC<ScreenProps> = (props) => {
  const { onNavigate, balance, history } = props;
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col animate-fade-in transition-colors duration-500">
      <Header title="Wallet" onBack={() => onNavigate(ScreenName.HOME)} />

      <div className="w-full flex-1 overflow-y-auto px-4 md:px-12 pb-32">
        <div className="flex flex-col gap-10 md:gap-16 mt-6 md:mt-16 md:max-w-3xl md:mx-auto">
          <div className="pt-4 md:pt-0">
            <div className="flex flex-col justify-center rounded-[2.5rem] md:rounded-[4rem] shadow-2xl theme-card-gradient text-white p-8 md:p-16 overflow-hidden relative min-h-[260px] md:min-h-[400px]">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[140px] md:text-[300px]">account_balance_wallet</span>
              </div>
              <div className="relative z-10">
                <p className="text-white/70 text-[11px] md:text-lg font-bold uppercase tracking-widest mb-2 md:mb-4">Available Balance</p>
                <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none">${balance?.toFixed(2)}</h1>
                <div className="mt-10 md:mt-16 flex gap-4 md:gap-6 w-full max-w-lg">
                  <button onClick={() => onNavigate(ScreenName.WITHDRAW)} className="flex-1 h-14 md:h-20 bg-white text-slate-900 font-black uppercase tracking-widest text-sm md:text-xl rounded-2xl md:rounded-3xl active:scale-95 transition-all hover:bg-slate-50 shadow-xl">Withdraw</button>
                  <button className="h-14 md:h-20 w-14 md:w-20 bg-white/20 backdrop-blur-md rounded-2xl md:rounded-3xl flex items-center justify-center active:scale-95 transition-all border border-white/20 hover:bg-white/30">
                    <span className="material-symbols-outlined md:text-4xl font-black">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col pb-8">
            <div className="flex items-center justify-between mb-6 md:mb-10 ml-2">
              <h2 className="text-[11px] md:text-lg font-black uppercase tracking-[0.2em] text-slate-400">Handshake History</h2>
            </div>

            <div className="flex flex-col gap-4 md:gap-6">
              {history?.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-slate-800 shadow-sm hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-5 md:gap-10">
                    <div className="size-12 md:size-24 rounded-2xl md:rounded-[1.5rem] bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <span className="material-symbols-outlined text-[24px] md:text-5xl">{item.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm md:text-2xl font-black uppercase tracking-tight truncate text-slate-900 dark:text-white leading-none">{item.title}</p>
                      <p className="text-[10px] md:text-base font-bold text-slate-400 uppercase tracking-widest mt-2 md:mt-4">{item.date}</p>
                    </div>
                  </div>
                  <p className={`${item.type === 'withdraw' ? 'text-slate-900 dark:text-white' : 'text-emerald-500'} font-black text-xl md:text-4xl tracking-tighter ml-6`}>{item.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav currentScreen={ScreenName.WALLET} {...props} />
    </div>
  );
};

export const LeaderboardScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const leaders = [
    { rank: 1, name: 'Elena S.', xp: 12450, avatar: 'ES' },
    { rank: 2, name: 'Marcus W.', xp: 11200, avatar: 'MW' },
    { rank: 3, name: 'Sarah K.', xp: 10800, avatar: 'SK' },
    { rank: 4, name: 'Alex R.', xp: 10450, avatar: 'AR' },
    { rank: 5, name: 'Jin P.', xp: 9800, avatar: 'JP' },
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark animate-fade-in transition-colors duration-500">
      <Header title="Leaderboard" onBack={() => onNavigate(ScreenName.HOME)} />
      <div className="p-4 md:max-w-4xl md:mx-auto md:py-16">
        <div className="bg-primary/10 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 mb-12 border border-primary/20 text-center shadow-xl relative overflow-hidden">
          <p className="text-[11px] md:text-lg font-bold text-primary uppercase tracking-widest mb-4">Performance Protocol</p>
          <h2 className="text-5xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">#142</h2>
          <p className="text-xs md:text-xl text-slate-500 mt-6 font-bold uppercase tracking-widest">Global Percentile: Top 5%</p>
        </div>
        <div className="space-y-6">
          <h3 className="px-4 text-[11px] md:text-lg font-black uppercase tracking-widest text-slate-400 mb-6">Elite Nodes</h3>
          {leaders.map((leader) => (
            <div key={leader.rank} className={`flex items-center gap-6 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-surface-light dark:bg-surface-dark border ${leader.rank === 4 ? 'border-primary ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className={`w-10 md:w-16 text-center font-black text-xl md:text-4xl ${leader.rank <= 3 ? 'text-primary' : 'text-slate-400'}`}>#{leader.rank}</div>
              <div className="size-14 md:size-24 rounded-2xl md:rounded-[1.5rem] bg-slate-700 flex items-center justify-center text-white font-black text-lg md:text-4xl shrink-0 shadow-lg">{leader.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight truncate text-lg md:text-3xl leading-none">{leader.name}</p>
                <p className="text-[11px] md:text-lg font-bold text-slate-400 uppercase tracking-widest mt-2 md:mt-4">{leader.xp} Accumulated XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ProfileScreen: React.FC<ScreenProps> = ({ onNavigate, balance, profile }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white animate-fade-in transition-colors duration-500">
      <Header title="Profile" onBack={() => onNavigate(ScreenName.HOME)} />
      <div className="flex p-8 flex-col items-center md:flex-row md:justify-center md:gap-20 md:py-24">
        <div className="relative mb-8 md:mb-0">
          <div className="bg-slate-700 size-32 md:size-56 rounded-full flex items-center justify-center text-white text-4xl md:text-7xl font-black shadow-2xl">
            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || '??'}
          </div>
          <div className="absolute bottom-1 right-1 bg-primary rounded-full size-12 md:size-20 flex items-center justify-center text-white border-4 md:border-8 border-background-light dark:border-background-dark text-xs md:text-2xl font-black">L{profile?.level || 1}</div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-7xl font-black uppercase tracking-tighter mb-2 md:mb-4">{profile?.full_name || 'Anonymous Agent'}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] md:text-lg">Contributor Node #{profile?.id?.slice(-4) || '0000'}</p>
        </div>
      </div>
      <div className="px-5 space-y-8 pb-32 md:max-w-4xl md:mx-auto">
        {/* Monetization Progress */}
        <section className="bg-gradient-to-br from-indigo-600 to-primary p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <span className="material-symbols-outlined text-7xl md:text-9xl">monetization_on</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] mb-2 opacity-80">Growth Phase</h3>
            <h2 className="text-xl md:text-4xl font-black uppercase tracking-tight mb-4">Unlock Lab <br />Monetization</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: '24%' }}></div>
              </div>
              <span className="text-xs font-bold font-mono">12/50</span>
            </div>
            <p className="text-[11px] md:text-lg font-medium opacity-90">Achieve 50 followers to activate currency conversion for your neural contributions.</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 md:gap-8">
          <div className="bg-surface-light dark:bg-surface-dark p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 dark:border-slate-800/50 shadow-xl flex flex-col items-center justify-center text-center">
            <p className="text-[11px] md:text-lg font-bold text-slate-400 uppercase tracking-widest mb-2">Earnings</p>
            <p className="text-3xl md:text-6xl font-black text-primary tracking-tight">${balance?.toFixed(2)}</p>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 dark:border-slate-800/50 shadow-xl flex flex-col items-center justify-center text-center">
            <p className="text-[11px] md:text-lg font-bold text-slate-400 uppercase tracking-widest mb-2">Precision</p>
            <p className="text-3xl md:text-6xl font-black text-emerald-500 tracking-tight">98.4%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WithdrawScreen: React.FC<ScreenProps> = ({ onNavigate, balance, onConfirm }) => {
  const [amount, setAmount] = useState(balance || 0);
  const [method, setMethod] = useState<'paypal' | 'crypto'>('paypal');
  const [status, setStatus] = useState<'idle' | 'processing' | 'verifying' | 'success'>('idle');

  const startWithdraw = async () => {
    if (amount < 5.00) {
      alert("Minimum withdrawal threshold is $5.00");
      return;
    }
    if (amount > (balance || 0)) {
      alert("Insufficient liquidity in node balance.");
      return;
    }

    setStatus('processing');
    const result = await WalletService.requestWithdrawal(amount, method, { destination: 'User terminal' });

    if (result.status === 'success') {
      setStatus('verifying');
      setTimeout(() => {
        setStatus('success');
        onConfirm?.(amount, method);
      }, 2000);
    } else {
      setStatus('idle');
      alert(`Handshake Error: ${result.message}`);
    }
  };

  if (status !== 'idle') {
    return (
      <div className="h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-8 text-center animate-fade-in transition-colors duration-500">
        {status === 'processing' && (
          <>
            <div className="size-24 md:size-40 rounded-full border-4 md:border-8 border-primary/20 border-t-primary animate-spin mb-10"></div>
            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight mb-4">Processing</h2>
            <p className="text-slate-500 font-bold text-[14px] md:text-xl uppercase tracking-widest">Initializing handshake protocol...</p>
          </>
        )}
        {status === 'verifying' && (
          <>
            <div className="size-24 md:size-40 rounded-full bg-primary/10 flex items-center justify-center mb-10">
              <span className="material-symbols-outlined text-primary text-4xl md:text-7xl">security</span>
            </div>
            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight mb-4">Verifying</h2>
            <p className="text-slate-500 font-bold text-[14px] md:text-xl uppercase tracking-widest">Securing ledger entry...</p>
          </>
        )}
        {status === 'success' && (
          <div className="animate-fade-in md:max-w-2xl">
            <div className="size-32 md:size-64 rounded-full bg-emerald-500 flex items-center justify-center mb-12 mx-auto shadow-[0_0_60px_rgba(16,185,129,0.4)]">
              <span className="material-symbols-outlined text-white text-6xl md:text-9xl font-black">check_circle</span>
            </div>
            <h2 className="text-3xl md:text-7xl font-black uppercase tracking-tighter mb-6">Complete</h2>
            <p className="text-slate-500 mb-12 max-w-sm md:max-w-md mx-auto font-bold text-[14px] md:text-2xl leading-relaxed">Funds have been dispatched to your linked {method} account.</p>
            <button onClick={() => onNavigate(ScreenName.WALLET)} className="w-full h-16 md:h-24 bg-primary text-white font-black uppercase tracking-widest text-sm md:text-2xl rounded-[2rem] shadow-2xl shadow-primary/30">Return to Terminal</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-500">
      <Header title="Withdrawal Portal" onBack={() => onNavigate(ScreenName.WALLET)} />
      <div className="p-6 md:p-16 md:max-w-4xl md:mx-auto">
        <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2.5rem] md:rounded-[4rem] p-10 md:p-20 text-center mb-12 shadow-2xl">
          <p className="text-slate-500 text-[11px] md:text-lg font-bold uppercase tracking-[0.2em] mb-4">Liquidity Available</p>
          <h1 className="text-6xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tighter">${balance?.toFixed(2)}</h1>
        </div>
        <div className="space-y-12">
          <div>
            <label className="text-[11px] md:text-lg font-black text-slate-500 uppercase tracking-widest mb-5 block ml-2">Specify Amount</label>
            <div className="relative">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-4xl md:text-7xl font-black text-primary">$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full h-24 md:h-40 pl-16 md:pl-28 pr-10 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-[2rem] md:rounded-[3rem] text-4xl md:text-8xl font-black focus:ring-8 focus:ring-primary/10 transition-all outline-none text-slate-900 dark:text-white shadow-inner" />
            </div>
          </div>
        </div>
        <div className="mt-16">
          <button onClick={startWithdraw} className="w-full h-20 md:h-28 bg-primary text-white font-black uppercase tracking-[0.3em] text-sm md:text-2xl rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all">Execute Transfer</button>
        </div>
      </div>
    </div>
  );
};

export const SubmissionTrackerScreen: React.FC<ScreenProps> = ({ onNavigate }) => <div className="min-h-screen bg-background-light dark:bg-background-dark"><Header title="Submission Log" onBack={() => onNavigate(ScreenName.HOME)} /></div>;

export const SettingsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark animate-fade-in transition-colors duration-500">
      <Header title="System Config" onBack={() => onNavigate(ScreenName.HOME)} />
      <div className="p-6 md:p-16 md:max-w-4xl md:mx-auto space-y-12">
        <section>
          <h3 className="text-[11px] md:text-lg font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2">Operational Controls</h3>
          <div className="bg-surface-light dark:bg-surface-dark rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl divide-y dark:divide-slate-800">
            <div className="flex items-center justify-between p-6 md:p-10">
              <div className="flex items-center gap-4 md:gap-8">
                <span className="material-symbols-outlined text-primary md:text-4xl font-black">notifications</span>
                <div>
                  <p className="text-sm md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Push Protocols</p>
                  <p className="text-[10px] md:text-lg text-slate-500 uppercase font-bold mt-1">Incoming task alerts</p>
                </div>
              </div>
              <button onClick={() => setNotifications(!notifications)} className={`w-14 md:w-20 h-8 md:h-12 rounded-full p-1 transition-colors ${notifications ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`size-6 md:size-10 bg-white rounded-full shadow-lg transition-transform ${notifications ? 'translate-x-6 md:translate-x-8' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-6 md:p-10">
              <div className="flex items-center gap-4 md:gap-8">
                <span className="material-symbols-outlined text-primary md:text-4xl font-black">fingerprint</span>
                <div>
                  <p className="text-sm md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Biometric Vault</p>
                  <p className="text-[10px] md:text-lg text-slate-500 uppercase font-bold mt-1">Fingerprint withdrawal</p>
                </div>
              </div>
              <button onClick={() => setBiometrics(!biometrics)} className={`w-14 md:w-20 h-8 md:h-12 rounded-full p-1 transition-colors ${biometrics ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`size-6 md:size-10 bg-white rounded-full shadow-lg transition-transform ${biometrics ? 'translate-x-6 md:translate-x-8' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] md:text-lg font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2">Network Utility</h3>
          <div className="bg-surface-light dark:bg-surface-dark rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl divide-y dark:divide-slate-800">
            <div className="flex items-center justify-between p-6 md:p-10">
              <div className="flex items-center gap-4 md:gap-8">
                <span className="material-symbols-outlined text-primary md:text-4xl font-black">database</span>
                <div>
                  <p className="text-sm md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Low Bandwidth Mode</p>
                  <p className="text-[10px] md:text-lg text-slate-500 uppercase font-bold mt-1">Optimize media loading</p>
                </div>
              </div>
              <button onClick={() => setDataSaver(!dataSaver)} className={`w-14 md:w-20 h-8 md:h-12 rounded-full p-1 transition-colors ${dataSaver ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`size-6 md:size-10 bg-white rounded-full shadow-lg transition-transform ${dataSaver ? 'translate-x-6 md:translate-x-8' : ''}`} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export const NotificationsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [notifications] = useState([
    { id: 1, title: 'Handshake Verified', body: 'Task #8291 has been accredited. $0.50 credited.', type: 'success', icon: 'verified', time: '2m ago' },
    { id: 2, title: 'Network Update', body: 'New High-Reward RLHF mission available in your region.', type: 'info', icon: 'bolt', time: '1h ago' },
    { id: 3, title: 'Payout Processed', body: 'Your withdrawal of $100.00 is now arriving.', type: 'finance', icon: 'payments', time: 'Yesterday' },
  ]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark animate-fade-in transition-colors duration-500">
      <Header title="Comms Hub" onBack={() => onNavigate(ScreenName.HOME)} />
      <div className="p-6 md:p-16 md:max-w-4xl md:mx-auto space-y-6">
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="text-[11px] md:text-lg font-black uppercase tracking-[0.2em] text-slate-400">Activity Log</h3>
          <button className="text-[10px] md:text-sm font-black text-primary uppercase tracking-widest">Mark all read</button>
        </div>
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="p-6 md:p-10 bg-white dark:bg-surface-dark rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-5 md:gap-10 active:scale-[0.98] transition-all cursor-pointer">
              <div className={`size-12 md:size-20 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : notif.type === 'info' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'}`}>
                <span className="material-symbols-outlined text-2xl md:text-4xl font-black">{notif.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 md:mb-2">
                  <h4 className="text-sm md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{notif.title}</h4>
                  <span className="text-[10px] md:text-base font-bold text-slate-400 whitespace-nowrap ml-4">{notif.time}</span>
                </div>
                <p className="text-[13px] md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{notif.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SupportScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const faqs = [
    { q: "How are tasks accredited?", a: "Each contribution is cross-verified by 3 distinct network nodes to ensure semantic precision." },
    { q: "When can I withdraw?", a: "Once your internal ledger reaches a minimum of $10.00 verified funds." },
    { q: "What is RLHF?", a: "Reinforcement Learning from Human Feedback—guiding AI responses to be safer and more accurate." }
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark animate-fade-in transition-colors duration-500">
      <Header title="Support Labs" onBack={() => onNavigate(ScreenName.HOME)} />
      <div className="p-6 md:p-16 md:max-w-4xl md:mx-auto space-y-12">
        <section className="bg-primary p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-[100px] md:text-[220px]">support_agent</span>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter leading-tight mb-4">Request Assistance</h2>
            <p className="text-white/80 font-bold text-sm md:text-2xl mb-10 leading-relaxed">Our neural operators are standing by to resolve protocol interruptions.</p>
            <button className="h-14 md:h-24 px-8 md:px-16 bg-white text-primary rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-xs md:text-xl shadow-xl active:scale-95 transition-all">Open Support Ticket</button>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] md:text-lg font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2">Operational FAQ</h3>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <details key={i} className="group bg-white dark:bg-surface-dark rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
                <summary className="flex items-center justify-between p-6 md:p-10 cursor-pointer list-none">
                  <span className="text-sm md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white pr-6">{f.q}</span>
                  <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-6 md:px-10 pb-6 md:pb-10 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                  <p className="text-[13px] md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="text-center pt-8">
          <p className="text-[10px] md:text-lg font-bold text-slate-400 uppercase tracking-widest">Protocol v4.0.2 Stable</p>
          <p className="text-[10px] md:text-lg text-slate-300 dark:text-slate-600 uppercase font-black tracking-widest mt-1">Decentralized Intelligence Network</p>
        </section>
      </div>
    </div>
  );
};

export const ReferralScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark animate-fade-in transition-colors duration-500">
      <Header title="Network Growth" onBack={() => onNavigate(ScreenName.HOME)} />
      <div className="p-6 md:p-16 md:max-w-4xl md:mx-auto space-y-12">
        <div className="text-center">
          <div className="size-24 md:size-40 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8">
            <span className="material-symbols-outlined text-4xl md:text-7xl">group_add</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">Expand the <br />Network</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] md:text-lg">Refer active contributors and earn cents for every verified task they complete.</p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-xl text-center">
          <p className="text-slate-400 text-[10px] md:text-base font-bold uppercase tracking-widest mb-4">Your Unique Node Identifier</p>
          <div className="flex items-center gap-4 bg-white dark:bg-black/20 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-white/5">
            <code className="flex-1 text-lg md:text-4xl font-mono font-bold text-primary tracking-tighter">XUM-REF-9102-JK</code>
            <button className="size-12 md:size-20 bg-primary text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
              <span className="material-symbols-outlined md:text-3xl">content_copy</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-8 pb-12">
          <div className="p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-[10px] md:text-base font-bold text-emerald-600 uppercase tracking-widest mb-1">Referral Yield</p>
            <p className="text-2xl md:text-5xl font-black text-emerald-500">+$0.12</p>
            <p className="text-[9px] md:text-sm text-emerald-600/60 font-medium uppercase mt-2">Verified today</p>
          </div>
          <div className="p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-primary/10 border border-primary/20 text-center">
            <p className="text-[10px] md:text-base font-bold text-primary uppercase tracking-widest mb-1">Total Nodes</p>
            <p className="text-2xl md:text-5xl font-black text-primary">14</p>
            <p className="text-[9px] md:text-sm text-primary/60 font-medium uppercase mt-2">In your network</p>
          </div>
        </div>
      </div>
    </div>
  );
};
