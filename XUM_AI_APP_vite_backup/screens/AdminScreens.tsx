import React from 'react';
import { ScreenName } from '../types';

interface ScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export const AdminLoginScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="size-10 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
             <span className="material-symbols-outlined text-white text-2xl">admin_panel_settings</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">XUM Admin</h1>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 block">Admin ID</label>
            <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all" placeholder="admin@xum.ai" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 block">Security Key</label>
            <input type="password" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all" placeholder="••••••••" />
          </div>
          <button onClick={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-12 rounded-xl transition-colors shadow-lg shadow-red-600/20 mt-4">
            Authenticate
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] font-display text-slate-900 dark:text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-red-600 text-3xl">admin_panel_settings</span>
          <h1 className="text-lg font-bold">Internal Ops</h1>
        </div>
        <div className="flex items-center gap-4">
           <span className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
             <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
             System Healthy
           </span>
           <button onClick={() => onNavigate(ScreenName.AUTH)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
             <span className="material-symbols-outlined">logout</span>
           </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 fixed h-[calc(100vh-64px)] hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 p-4 gap-2">
            <button onClick={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-xl font-medium">
                <span className="material-symbols-outlined">dashboard</span> Dashboard
            </button>
            <button onClick={() => onNavigate(ScreenName.ADMIN_USER_MANAGEMENT)} className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                <span className="material-symbols-outlined">group</span> Users
            </button>
            <button onClick={() => onNavigate(ScreenName.ADMIN_TASK_MODERATION)} className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                <span className="material-symbols-outlined">gavel</span> Moderation
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">12</span>
            </button>
            <button onClick={() => onNavigate(ScreenName.ADMIN_PAYOUTS)} className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                <span className="material-symbols-outlined">payments</span> Payouts
            </button>
        </aside>

        {/* Mobile Nav Overlay (Simulated for this view) */}
        <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-[#151922] border-t border-slate-200 dark:border-slate-800 flex justify-around p-3 z-50">
             <button onClick={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} className="flex flex-col items-center text-red-500"><span className="material-symbols-outlined">dashboard</span></button>
             <button onClick={() => onNavigate(ScreenName.ADMIN_USER_MANAGEMENT)} className="flex flex-col items-center text-slate-400"><span className="material-symbols-outlined">group</span></button>
             <button onClick={() => onNavigate(ScreenName.ADMIN_TASK_MODERATION)} className="flex flex-col items-center text-slate-400 relative">
                 <span className="material-symbols-outlined">gavel</span>
                 <span className="absolute top-0 right-2 bg-red-500 text-white text-[8px] size-3 flex items-center justify-center rounded-full">!</span>
             </button>
             <button onClick={() => onNavigate(ScreenName.ADMIN_PAYOUTS)} className="flex flex-col items-center text-slate-400"><span className="material-symbols-outlined">payments</span></button>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-6 pb-24">
           {/* Stats Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
               <div className="bg-white dark:bg-[#151922] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                       <span className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg material-symbols-outlined">groups</span>
                       <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">+124</span>
                   </div>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Users</p>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">42,892</p>
               </div>
               <div className="bg-white dark:bg-[#151922] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                       <span className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg material-symbols-outlined">task_alt</span>
                       <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">+2.4k</span>
                   </div>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tasks Done</p>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">1.2M</p>
               </div>
               <div className="bg-white dark:bg-[#151922] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                       <span className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg material-symbols-outlined">flag</span>
                       <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">High</span>
                   </div>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Flagged Content</p>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">48</p>
               </div>
               <div className="bg-white dark:bg-[#151922] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                       <span className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-lg material-symbols-outlined">account_balance_wallet</span>
                   </div>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Payouts</p>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white">$14,250</p>
               </div>
           </div>

           {/* Alerts Section */}
           <h2 className="text-lg font-bold mb-4">Urgent Alerts</h2>
           <div className="flex flex-col gap-3">
               <div className="flex items-center gap-4 bg-white dark:bg-[#151922] p-4 rounded-xl border-l-4 border-red-500 shadow-sm">
                   <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600"><span className="material-symbols-outlined">warning</span></div>
                   <div className="flex-1">
                       <h3 className="font-bold text-sm">Suspicious Payout Activity detected</h3>
                       <p className="text-xs text-slate-500">Multiple withdrawals to same wallet address from different accounts.</p>
                   </div>
                   <button className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors">Investigate</button>
               </div>
               <div className="flex items-center gap-4 bg-white dark:bg-[#151922] p-4 rounded-xl border-l-4 border-yellow-500 shadow-sm">
                   <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full text-yellow-600"><span className="material-symbols-outlined">dns</span></div>
                   <div className="flex-1">
                       <h3 className="font-bold text-sm">High Load on Validation Service</h3>
                       <p className="text-xs text-slate-500">Response time &gt; 200ms. Consider scaling nodes.</p>
                   </div>
                   <button className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors">Details</button>
               </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export const UserManagementScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] font-display text-slate-900 dark:text-white pb-20">
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                <button onClick={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><span className="material-symbols-outlined">arrow_back</span></button>
                <h1 className="font-bold text-lg">User Management</h1>
            </header>
            <div className="p-4">
                <div className="bg-white dark:bg-[#151922] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-2">
                        <input type="text" placeholder="Search user by email or ID..." className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-4 py-2 text-sm" />
                        <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold">Filter</button>
                    </div>
                    {[
                        { name: "Alex Rivera", email: "alex.r@gmail.com", role: "Contributor", status: "Active", risk: "Low", earnings: "$1,240" },
                        { name: "John Doe", email: "j.doe99@yahoo.com", role: "Validator", status: "Active", risk: "Low", earnings: "$450" },
                        { name: "Bot Farm 01", email: "temp.mail@xyz.com", role: "Contributor", status: "Suspended", risk: "High", earnings: "$12" },
                    ].map((user, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${user.risk === 'High' ? 'bg-red-500' : 'bg-primary'}`}>
                                    {user.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{user.name}</h4>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${user.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {user.status}
                                </span>
                                <p className="text-xs font-mono mt-1">{user.earnings}</p>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><span className="material-symbols-outlined">more_vert</span></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const TaskModerationScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] font-display text-slate-900 dark:text-white pb-20">
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                <button onClick={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><span className="material-symbols-outlined">arrow_back</span></button>
                <h1 className="font-bold text-lg">Moderation Queue</h1>
            </header>
            <div className="p-4 max-w-2xl mx-auto">
                <div className="bg-white dark:bg-[#151922] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold uppercase text-red-500 tracking-wider">Flagged by Validator</span>
                            <h3 className="font-bold">Image Validation Task #8291</h3>
                        </div>
                        <span className="text-xs font-mono text-slate-400">ID: 8291-AZ</span>
                    </div>
                    <div className="aspect-video bg-black relative">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6jQI1SVFQKsWIVhB0dF5vmaSv9H45QazmXY7ybiIz1o4fdDLK2vqJ55-Cou3PCzi3P4UgNzdphUjEL_8l-9lgKVNbAoYAV6FeTpjcHdfQp_qx4zdscQ5KUd0LWc6mcssEjOgUL91H7_qPL5HCcxICu7B1BL936ir364nPkVOjtKFd5_7ziyGZ6e6R2D_Z58tkgrKKD5pdU7GcDqYfma_AsSSwAAEg-u90MT6yTPAUhT3MwAwFfsjQVOcf47neN_iEP6w1dNRewbfn" alt="Task" className="w-full h-full object-contain" />
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">Bounding Box Malformed</div>
                    </div>
                    <div className="p-6">
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">User</p>
                                <p className="font-medium text-sm">User #4921</p>
                            </div>
                             <div className="flex-1">
                                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Reason</p>
                                <p className="font-medium text-sm">Box does not cover full vehicle</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                                Reject & Penalize
                            </button>
                            <button className="h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                                Override & Approve
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AdminPayoutsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] font-display text-slate-900 dark:text-white pb-20">
             <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                <button onClick={() => onNavigate(ScreenName.ADMIN_DASHBOARD)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><span className="material-symbols-outlined">arrow_back</span></button>
                <h1 className="font-bold text-lg">Payout Requests</h1>
            </header>
            <div className="p-4 space-y-4">
                 {[
                     { user: "Sarah Jenkins", amount: "$150.00", method: "PayPal", risk: "Low" },
                     { user: "CryptoKing99", amount: "$2,400.00", method: "USDT", risk: "Medium" },
                     { user: "New User 01", amount: "$10.50", method: "Mobile Money", risk: "Low" }
                 ].map((payout, i) => (
                     <div key={i} className="bg-white dark:bg-[#151922] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center">
                         <div>
                             <h4 className="font-bold">{payout.user}</h4>
                             <p className="text-xs text-slate-500">{payout.method} • Risk: <span className={payout.risk === 'Medium' ? 'text-yellow-500' : 'text-green-500'}>{payout.risk}</span></p>
                         </div>
                         <div className="flex items-center gap-3">
                             <span className="font-bold text-lg">{payout.amount}</span>
                             <button className="bg-primary text-white p-2 rounded-lg hover:bg-blue-600"><span className="material-symbols-outlined text-lg">check</span></button>
                         </div>
                     </div>
                 ))}
            </div>
        </div>
    );
};