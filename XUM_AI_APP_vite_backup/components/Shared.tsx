
import React, { useState } from 'react';
import { ScreenName } from '../types';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  activeThemeId?: string;
  setActiveThemeId?: (id: string) => void;
  themes?: any[];
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  isDarkMode,
  setIsDarkMode,
  activeThemeId,
  setActiveThemeId,
  themes = []
}) => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isExtrasMenuOpen, setIsExtrasMenuOpen] = useState(false);
  const [extrasView, setExtrasView] = useState<'main' | 'themes'>('main');

  const toggleMode = () => {
    if (setIsDarkMode) setIsDarkMode(!isDarkMode);
  };

  const getTabClass = (screen: ScreenName) =>
    currentScreen === screen ? "text-primary" : "text-slate-400 dark:text-slate-500 hover:text-primary transition-colors";

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 pb-safe z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16 md:h-24 px-4 md:max-w-3xl md:mx-auto">
          <button onClick={() => onNavigate(ScreenName.HOME)} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${getTabClass(ScreenName.HOME)}`}>
            <span className={`material-symbols-outlined md:text-4xl ${currentScreen === ScreenName.HOME ? 'fill-current' : ''}`}>home</span>
            <span className="text-[11px] md:text-sm font-bold uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => onNavigate(ScreenName.TASK_MARKETPLACE)} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${getTabClass(ScreenName.TASK_MARKETPLACE)}`}>
            <span className="material-symbols-outlined md:text-4xl">explore</span>
            <span className="text-[11px] md:text-sm font-bold uppercase tracking-widest">Task</span>
          </button>
          <div className="relative w-full h-full flex items-center justify-center -mt-6 md:-mt-10">
            <button onClick={() => setIsCreateMenuOpen(true)} className="flex items-center justify-center w-14 md:w-20 h-14 md:h-20 rounded-full bg-primary text-white shadow-xl border-4 md:border-8 border-surface-light dark:border-surface-dark transition-transform active:scale-95">
              <span className={`material-symbols-outlined text-[28px] md:text-5xl transition-transform duration-300 ${isCreateMenuOpen ? 'rotate-45' : ''}`}>add</span>
            </button>
          </div>
          <button onClick={() => onNavigate(ScreenName.WALLET)} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${getTabClass(ScreenName.WALLET)}`}>
            <span className="material-symbols-outlined md:text-4xl">account_balance_wallet</span>
            <span className="text-[11px] md:text-sm font-bold uppercase tracking-widest">Wallet</span>
          </button>
          <button onClick={() => { setIsExtrasMenuOpen(true); setExtrasView('main'); }} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isExtrasMenuOpen ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
            <span className={`material-symbols-outlined md:text-4xl ${isExtrasMenuOpen ? 'fill-current' : ''}`}>menu</span>
            <span className="text-[11px] md:text-sm font-bold uppercase tracking-widest">Menu</span>
          </button>
        </div>
      </nav>

      {/* Extras Menu Popup */}
      {isExtrasMenuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsExtrasMenuOpen(false)} />
          <div className="relative bg-background-light dark:bg-background-dark rounded-t-[2.5rem] md:rounded-t-[4rem] p-6 md:p-12 pb-12 shadow-2xl animate-[slideUp_0.3s_ease-out] border-t border-white/10 max-h-[85vh] overflow-y-auto no-scrollbar md:max-w-3xl md:mx-auto md:w-full md:mb-4">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-10"></div>

            {extrasView === 'main' ? (
              <div className="flex flex-col gap-8 md:gap-12">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[24px] md:text-[40px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Contributor Hub</h3>
                  <button onClick={() => setIsExtrasMenuOpen(false)} className="size-12 md:size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl md:text-4xl">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                  {[
                    { label: 'Profile', icon: 'person', screen: ScreenName.PROFILE, color: 'bg-blue-500' },
                    { label: 'Wallet', icon: 'account_balance_wallet', screen: ScreenName.WALLET, color: 'bg-emerald-500' },
                    { label: 'Comms', icon: 'notifications', screen: ScreenName.NOTIFICATIONS, color: 'bg-orange-500' },
                    { label: 'Ranking', icon: 'military_tech', screen: ScreenName.LEADERBOARD, color: 'bg-purple-500' },
                  ].map((item) => (
                    <button key={item.label} onClick={() => { setIsExtrasMenuOpen(false); onNavigate(item.screen); }} className="flex flex-col items-center p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-white dark:bg-surface-dark shadow-xl hover:scale-[1.05] transition-all active:scale-[0.98] border border-slate-100 dark:border-slate-800">
                      <div className={`size-16 md:size-24 rounded-3xl ${item.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                        <span className="material-symbols-outlined text-3xl md:text-5xl">{item.icon}</span>
                      </div>
                      <span className="text-[12px] md:text-xl font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white text-center leading-none">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
                  <button onClick={() => setExtrasView('themes')} className="w-full flex items-center justify-between p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-5 md:gap-8">
                      <div className="size-12 md:size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined md:text-4xl">palette</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[14px] md:text-2xl font-black uppercase tracking-widest block leading-none mb-2">Theme</span>
                        <span className="text-[11px] md:text-base text-slate-500 uppercase font-bold tracking-widest">{themes.find(t => t.id === activeThemeId)?.name} Mode</span>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => { setIsExtrasMenuOpen(false); onNavigate(ScreenName.SETTINGS); }} className="w-full flex items-center justify-between p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-5 md:gap-8">
                      <div className="size-12 md:size-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined md:text-4xl">settings</span>
                      </div>
                      <span className="text-[14px] md:text-2xl font-black uppercase tracking-widest">Settings</span>
                    </div>
                  </button>
                  <button onClick={() => { setIsExtrasMenuOpen(false); onNavigate(ScreenName.SUPPORT); }} className="w-full flex items-center justify-between p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-5 md:gap-8">
                      <div className="size-12 md:size-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined md:text-4xl">help_center</span>
                      </div>
                      <span className="text-[14px] md:text-2xl font-black uppercase tracking-widest">Support</span>
                    </div>
                  </button>
                </div>

                <button onClick={() => { setIsExtrasMenuOpen(false); onNavigate(ScreenName.AUTH); }} className="w-full h-20 md:h-28 rounded-[2rem] md:rounded-[3rem] bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-[0.4em] text-[14px] md:text-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all mt-6">
                  <span className="material-symbols-outlined md:text-4xl">logout</span> Terminate Session
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-10 animate-fade-in">
                <div className="flex items-center gap-4">
                  <button onClick={() => setExtrasView('main')} className="size-12 md:size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-slate-900 dark:text-white md:text-4xl font-black">arrow_back</span>
                  </button>
                  <h3 className="text-[20px] md:text-[36px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">Appearance Labs</h3>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-14 border border-slate-100 dark:border-slate-800 flex items-center justify-between mb-4 shadow-xl">
                  <div className="flex items-center gap-6 md:gap-10">
                    <div className="size-14 md:size-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined md:text-5xl">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[16px] md:text-3xl font-black uppercase tracking-widest leading-none mb-2">Dark Mode Theme</span>
                      <p className="text-[11px] md:text-lg text-slate-500 uppercase font-bold tracking-widest">{isDarkMode ? 'Nightmode initialized' : 'Lumos active'}</p>
                    </div>
                  </div>
                  <button onClick={toggleMode} className={`w-16 md:w-28 h-9 md:h-14 rounded-full p-1 transition-colors duration-500 flex ${isDarkMode ? 'bg-primary justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start shadow-inner'}`}>
                    <div className="size-7 md:size-12 rounded-full bg-white shadow-2xl" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
                  {themes.map((theme) => (
                    <button key={theme.id} onClick={() => setActiveThemeId && setActiveThemeId(theme.id)} className={`flex flex-col items-center gap-6 p-8 md:p-14 rounded-[3rem] md:rounded-[4.5rem] border-4 transition-all active:scale-[0.98] ${activeThemeId === theme.id ? 'border-primary bg-primary/5 shadow-2xl scale-105' : 'border-slate-100 dark:border-slate-800 bg-surface-light dark:bg-surface-dark shadow-md'}`}>
                      <div className="size-20 md:size-32 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                        {activeThemeId === theme.id && <span className="material-symbols-outlined text-white text-4xl md:text-7xl font-black">verified</span>}
                      </div>
                      <div className="text-center">
                        <span className="text-[16px] md:text-2xl font-black uppercase tracking-tight block mb-2">{theme.name}</span>
                        <span className={`text-[11px] md:text-sm font-black uppercase tracking-[0.2em] px-3 py-1 md:px-5 md:py-2 rounded-full ${activeThemeId === theme.id ? 'bg-primary text-white' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                          {activeThemeId === theme.id ? 'Active' : 'Deploy'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isCreateMenuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsCreateMenuOpen(false)} />
          <div className="relative bg-background-light dark:bg-background-dark rounded-t-[3rem] md:rounded-t-[5rem] p-6 md:p-20 pb-24 shadow-2xl animate-[slideUp_0.3s_ease-out] border-t border-white/5 overflow-hidden md:max-w-4xl md:mx-auto md:w-full md:mb-4">
            <button onClick={() => setIsCreateMenuOpen(false)} className="absolute top-10 right-10 size-12 md:size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 active:scale-90 transition-all shadow-lg">
              <span className="material-symbols-outlined md:text-4xl font-black">close</span>
            </button>
            <div className="mt-8 flex flex-col gap-10 md:gap-16">
              <h3 className="text-[24px] md:text-[48px] font-black text-slate-900 dark:text-white text-center uppercase tracking-[0.3em] leading-none">Neural Input</h3>

              <div className="flex items-stretch gap-6 md:gap-12 px-2 h-56 md:h-96">
                <button onClick={() => { setIsCreateMenuOpen(false); onNavigate(ScreenName.CAPTURE_CHOICE); }} className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 rounded-[2.5rem] md:rounded-[4.5rem] bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-2xl active:scale-95 transition-all group hover:brightness-110">
                  <div className="size-20 md:size-40 rounded-full bg-white/20 flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 transition-transform shadow-inner">
                    <span className="material-symbols-outlined text-4xl md:text-8xl">sensors</span>
                  </div>
                  <h4 className="text-[18px] md:text-4xl font-bold uppercase tracking-[0.2em] leading-none mb-2 md:mb-4">Visual Lab</h4>
                  <p className="text-[10px] md:text-xl text-white/70 uppercase font-semibold tracking-widest text-center">Environmental Input</p>
                </button>

                <button onClick={() => { setIsCreateMenuOpen(false); onNavigate(ScreenName.LINGUASENSE); }} className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 rounded-[2.5rem] md:rounded-[4.5rem] bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-2xl active:scale-95 transition-all group hover:brightness-110">
                  <div className="size-20 md:size-40 rounded-full bg-white/20 flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 transition-transform shadow-inner">
                    <span className="material-symbols-outlined text-4xl md:text-8xl">neurology</span>
                  </div>
                  <h4 className="text-[18px] md:text-4xl font-bold uppercase tracking-[0.2em] leading-none mb-2 md:mb-4 text-center">Lingua Hub</h4>
                  <p className="text-[10px] md:text-xl text-white/70 uppercase font-semibold tracking-widest text-center px-1">Semantic Grounding</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Header: React.FC<{ title: string; onBack?: () => void; rightAction?: React.ReactNode; }> = ({ title, onBack, rightAction }) => {
  return (
    <div className="sticky top-0 z-40 w-full flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 md:px-12 py-4 md:py-8 justify-between border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center min-w-10 md:min-w-16">
        {onBack && (
          <button onClick={onBack} className="text-slate-900 dark:text-white flex size-12 md:size-20 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-2xl md:text-5xl font-black">arrow_back</span>
          </button>
        )}
      </div>
      <h2 className="text-slate-900 dark:text-white text-[18px] md:text-[36px] font-bold leading-tight tracking-tighter flex-1 text-center truncate px-4 uppercase">
        {title}
      </h2>
      <div className="flex items-center justify-end min-w-10 md:min-w-16">
        {rightAction || <div className="size-12 md:size-20" />}
      </div>
    </div>
  );
};
