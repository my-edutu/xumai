import { useState, useEffect } from 'react';
import './index.css';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Wallet,
  LogOut,
  Search,
  ExternalLink,
  Cpu,
  Database,
  BarChart3,
  Settings,
  Bell,
  Plus,
  Briefcase,
  Key,
  ShieldAlert
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from './supabaseClient';
import { financialService } from './utils/financialService';
import type { WorkerPayout } from './utils/financialService';
import { useAdmin } from './contexts/AdminContext';

type View = 'overview' | 'users' | 'tasks' | 'linguasense' | 'payouts' | 'companies' | 'api_keys' | 'featured_tasks' | 'settings';

// --- Shared Components ---
const AdminCard = ({ title, children, className = "" }: any) => (
  <div className={`glass-card p-6 ${className}`}>
    {title && <h3 className="text-[10px] font-semibold text-dim uppercase tracking-widest mb-4 outfit">{title}</h3>}
    {children}
  </div>
);

const EmptyState = ({ message, sub, icon: Icon = Search }: any) => (
  <div className="flex flex-col items-center justify-center p-20 text-center opacity-80">
    <div className="p-6 bg-white/5 rounded-3xl mb-4 text-dim">
      <Icon size={48} strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-medium outfit text-white">{message || 'No data found'}</h3>
    <p className="text-sm text-dim mt-2 max-w-xs mx-auto">{sub || 'System is currently waiting for new records to populate this module.'}</p>
  </div>
);

const StatIndicator = ({ label, value, trend, subLabel, icon: Icon, color = "blue" }: any) => {
  const colorMap: any = {
    blue: "from-blue-600/25 to-blue-900/5 text-blue-400 border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.08)]",
    emerald: "from-emerald-600/25 to-emerald-900/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.08)]",
    orange: "from-orange-600/25 to-orange-900/5 text-orange-400 border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.08)]",
    purple: "from-purple-600/25 to-purple-900/5 text-purple-400 border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.08)]",
    red: "from-red-600/25 to-red-900/5 text-red-400 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.08)]",
    violet: "from-violet-600/25 to-violet-900/5 text-violet-400 border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.08)]"
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <div className={`glass-card p-6 md:p-8 group cursor-default hover:border-${color}-500/50 transition-all duration-500 bg-gradient-to-br ${style} border border-white/10 relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]`}>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <p className="text-xs md:text-sm text-dim font-bold uppercase tracking-[-0.02em] opacity-80">{label}</p>
          {trend && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/5 uppercase tracking-tight ${trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {trend}
            </span>
          )}
        </div>
        <h4 className="text-3xl lg:text-4xl font-bold text-white outfit tracking-[-0.02em] drop-shadow-xl">{value}</h4>
        {subLabel && <p className="text-[10px] font-semibold text-white/30 mt-2 uppercase tracking-widest">{subLabel}</p>}
      </div>
      
      {/* Background Icon - High Impact Design */}
      <div className={`absolute -right-4 -bottom-6 opacity-[0.04] group-hover:opacity-[0.12] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 text-${color}-400`}>
        <Icon size={120} strokeWidth={1} />
      </div>
    </div>
  );
};

// --- Overview Dashboard ---
const Overview = () => {
  const [stats, setStats] = useState({ users: 0, tasks: 0, payouts: 0, companies: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Users Count
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      // Fetch Tasks Count
      const { count: tasksCount } = await supabase.from('task_submissions').select('*', { count: 'exact', head: true });
      // Fetch Companies Count
      const { count: companiesCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      // Fetch Pending Payouts
      const pendingPayouts = await financialService.getPendingPayouts();
      const payoutSum = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

      setStats({
        users: usersCount || 0,
        tasks: tasksCount || 0,
        payouts: payoutSum,
        companies: companiesCount || 0
      });

      // Real Time-Series Data Improvement: Fetch task distribution by hour
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentWork } = await supabase.from('task_submissions').select('created_at').gt('created_at', dayAgo);
      
      const hourlyDistribution: any = {};
      recentWork?.forEach(w => {
         const hour = new Date(w.created_at).getHours();
         hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });

      const processedChart = Array.from({ length: 6 }).map((_, i) => {
         const h = i * 4;
         return {
            name: `${String(h).padStart(2, '0')}:00`,
            submissions: hourlyDistribution[h] || 0
         };
      });
      setChartData(processedChart);
      
      // Real Activity Feed - Combining latest users and latest submissions
      const { data: latestSubmissions } = await supabase
        .from('task_submissions')
        .select('id, user_id, status, created_at, users(email)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentLogs(latestSubmissions || []);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-slide-up pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 gap-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-white outfit">XUM AI Dashboard</h1>
          <p className="text-dim mt-2 text-xs md:text-sm font-normal">Core platform statistics and recent activity.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatIndicator label="Active Users" value={stats.users.toLocaleString()} icon={Users} color="blue" trend="+12%" subLabel="Worker Fleet" />
        <StatIndicator label="Tasks Completed" value={stats.tasks.toLocaleString()} icon={ClipboardList} color="emerald" trend="+5.4k" subLabel="Records" />
        <StatIndicator label="Platform Revenue" value={`$${(stats.payouts * 0.15).toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={BarChart3} color="violet" trend="+8.2%" subLabel="Fee (15%)" />
        <StatIndicator label="Enterprises" value={stats.companies.toString()} icon={Briefcase} color="orange" trend="Active" subLabel="Partners" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 bg-gradient-to-br from-[#0f172a] to-[#020617]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Daily Task Submissions</h3>
              <p className="text-[10px] text-dim font-normal">Last 24 hours of completed work</p>
            </div>
            <div className="p-1 bg-white/5 rounded-xl flex gap-1">
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold">24H</button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="submissions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSub)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col border-white/5">
          <h3 className="text-lg font-bold mb-6 text-white flex gap-2 items-center"><Bell size={18} className="text-orange-500" /> Recent Activity</h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 no-scrollbar">
            {recentLogs.map((log: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${log.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {log.status === 'approved' ? 'OK' : 'QA'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{log.users?.email || 'System Operation'}</h4>
                    <p className="text-[10px] text-dim">{log.status ? `Submission ${log.status}` : 'Account Activity'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white font-bold">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[9px] text-dim font-medium uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && <EmptyState message="No recent activity" icon={Bell} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- User Management ---
const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    supabase.from('users')
      .select('id, email, full_name, role, balance, trust_score, created_at, is_banned')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setUsers(data);
        setLoading(false);
      });
  }, []);

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('users').update({ is_banned: !currentStatus }).eq('id', userId);
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">User Directory</h1>
          <p className="text-xs text-dim font-normal">Manage platform workers and agents.</p>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..." 
            className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-5 text-xs w-full outline-none focus:border-blue-500 font-medium text-white transition-all shadow-inner" 
          />
        </div>
      </header>

      {loading ? (
        <div className="p-20 text-center"><div className="size-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState message="No Users Found" icon={Users} />
      ) : (
        <AdminCard title={`Global Worker Fleet (${filteredUsers.length})`}>
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-dim text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-5 py-4">Identity</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Balance</th>
                  <th className="px-5 py-4">Trust</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 group transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 text-xs shadow-inner uppercase">
                          {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white tracking-tight">{u.full_name || 'Anonymous'}</p>
                          <p className="text-[10px] text-dim">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {u.role || 'worker'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-emerald-500 font-bold text-xs">
                      ${u.balance?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-5 py-4 font-mono text-white/80 font-bold text-xs">
                      {u.trust_score?.toFixed(1) || '0.0'}/10
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleBan(u.id, u.is_banned)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${u.is_banned ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 text-dim hover:bg-white/10 hover:text-white'}`}
                        >
                          {u.is_banned ? 'Lift' : 'Ban'}
                        </button>
                        <button className="p-1.5 text-dim hover:text-white hover:bg-white/5 rounded-lg transition-all" title="View Profile">
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
};

// --- Task Management ---
const TaskManagement = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setCampaigns(data);
      setLoading(false);
    });
  }, []);

  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
    }
  };

  const createDummyCampaign = async () => {
    const newCampaign = {
      name: `New Campaign ${Math.floor(Math.random() * 1000)}`,
      type: 'Text Collection',
      status: 'draft',
      total_budget: 100,
      target_submissions: 500
    };
    const { data, error } = await supabase.from('campaigns').insert(newCampaign).select().single();
    if (data && !error) {
       setCampaigns([data, ...campaigns]);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-xs text-dim font-normal">Configure and monitor worker tasks.</p>
        </div>
        <button onClick={createDummyCampaign} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
          <Plus size={16} /> New Task
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatIndicator label="Active Campaigns" value={campaigns.filter(c => c.status === 'active').length.toString()} icon={ClipboardList} color="blue" />
        <StatIndicator label="Total Submissions" value="-" icon={Database} color="emerald" />
        <StatIndicator label="Pending Review" value="-" icon={Bell} color="orange" />
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="p-20 text-center"><div className="size-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
        ) : campaigns.length === 0 ? (
          <EmptyState message="No Active Campaigns" sub="Create a new task campaign to get started." icon={ClipboardList} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map(c => (
              <div key={c.id} className="glass-card p-5 flex flex-col gap-4 border-white/5 hover:border-blue-500/20 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{c.name}</h3>
                    <p className="text-[9px] text-dim font-semibold uppercase tracking-[0.2em]">{c.type || 'Data Collection'}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-dim'}`}>
                    {c.status || 'Draft'}
                  </span>
                </div>
                
                <div className="flex justify-between items-end gap-10 mt-2">
                   <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-bold text-dim uppercase tracking-widest mb-2">
                        <span>Allocation</span>
                        <span className="text-white">${c.total_budget || 0}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => toggleCampaignStatus(c.id, c.status)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                      >
                        {c.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                      <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"><ExternalLink size={14} /></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Company Management ---
const CompanyManagement = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState<string | null>(null);

  const fetchCompanies = () => {
    setLoading(true);
    supabase.from('companies').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => {
      if (data) setCompanies(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDeposit = async (companyId: string) => {
    const amountStr = prompt("Enter deposit amount ($):");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount");

    setDepositing(companyId);
    try {
      const { error } = await supabase.rpc('handle_company_deposit', {
        p_company_id: companyId,
        p_amount: amount,
        p_reference: `ADMIN-MANUAL-${Date.now().toString().slice(-6)}`,
        p_provider: 'manual_admin'
      });

      if (error) throw error;
      alert(`Successfully credited $${amount} to enterprise wallet.`);
      fetchCompanies();
    } catch (err: any) {
      console.error("Deposit failed:", err);
      alert("Search failed or database error: " + (err.message || "Unknown error"));
    } finally {
      setDepositing(null);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Enterprises</h1>
          <p className="text-xs text-dim font-normal">Manage B2B partners and client organizations.</p>
        </div>
      </header>
      
      {loading ? (
        <div className="p-20 text-center"><div className="size-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : companies.length === 0 ? (
        <EmptyState message="No Companies Found" sub="No enterprises registered yet." icon={Briefcase} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map(c => (
            <div key={c.id} className="glass-card p-6 flex flex-col gap-5 border-white/5 hover:border-emerald-500/20 transition-all group">
               <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-xl group-hover:bg-emerald-500/20 transition-all uppercase tracking-tight">
                    {c.name?.substring(0, 2) || 'CX'}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeposit(c.id)}
                      disabled={depositing === c.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20"
                    >
                      {depositing === c.id ? 'Processing...' : 'Add Funds'}
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"><ExternalLink size={16} /></button>
                  </div>
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white outfit tracking-tight group-hover:text-emerald-400 transition-colors uppercase">{c.name}</h3>
                  <p className="text-[10px] text-dim font-semibold uppercase tracking-[0.2em] mt-1">{c.industry || 'Global Partner'}</p>
               </div>
               <div className="flex gap-4 pt-4 border-t border-white/5">
                  <div className="flex-1">
                    <p className="text-[9px] text-dim font-semibold uppercase tracking-widest mb-1">Contract Status</p>
                    <p className="text-xs font-semibold text-white">Active MSA</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[9px] text-dim font-semibold uppercase tracking-widest mb-1">Fleet Count</p>
                    <p className="text-xs font-semibold text-white">12 Nodes</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- API Keys Management ---
const ApiKeysManagement = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('id, client_name, company_id, environment, status, created_at, last_used_at, users!company_id(email)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setKeys(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleRevoke = async (keyId: string) => {
    if (!window.confirm("Are you sure you want to revoke this key? All integrations using it will break.")) return;
    try {
      const { error } = await supabase.from('api_keys').update({ status: 'revoked' }).eq('id', keyId);
      if (error) throw error;
      setKeys(keys.map(k => k.id === keyId ? { ...k, status: 'revoked' } : k));
    } catch (err: any) {
      alert("Error revoking key: " + err.message);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-xs text-dim font-normal">Monitor organization API access and credentials.</p>
        </div>
        <button onClick={fetchKeys} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
          Refresh List
        </button>
      </header>

      {loading ? (
        <div className="p-20 text-center"><div className="size-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mx-auto" /></div>
      ) : keys.length === 0 ? (
        <EmptyState message="No API Keys Generated" sub="API keys are generated by companies via their portal." icon={Key} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {keys.map(k => (
            <div key={k.id} className="glass-card p-5 flex flex-col gap-4 border-white/5 hover:border-purple-500/20 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500 group-hover:bg-purple-500/20 transition-all">
                    <Key size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">{k.client_name || 'Production Key'}</h3>
                    <p className="text-[9px] text-dim font-semibold uppercase tracking-widest mt-0.5">
                      Company: {k.users?.email || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${k.environment === 'live' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {k.environment || 'test'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${k.status === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                    {k.status}
                    </span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 font-mono text-[9px] text-dim overflow-hidden truncate">
                sk_{k.environment}_************************{k.id.substring(k.id.length - 4)}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                   <p className="text-[9px] text-dim font-medium uppercase tracking-widest">Issued: {new Date(k.created_at).toLocaleDateString()}</p>
                   {k.last_used_at && <p className="text-[9px] text-dim font-medium uppercase tracking-widest mt-0.5">Last Used: {new Date(k.last_used_at).toLocaleDateString()}</p>}
                </div>
                {k.status === 'active' && (
                    <button onClick={() => handleRevoke(k.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all">Revoke</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Submission Review Queue ---
const SubmissionReviewQueue = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('task_submissions')
      .select('id, user_id, task_type, status, created_at, base_reward, file_url, users(email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setSubmissions(data);
        setLoading(false);
      });
  }, []);

  const updateSubmissionStatus = async (id: string, newStatus: 'approved' | 'rejected', userId: string, reward: number) => {
    try {
      // 1. Update the submission record
      const { error: submissionError } = await supabase.from('task_submissions').update({ status: newStatus }).eq('id', id);
      if (submissionError) throw submissionError;

      // 2. If approved, credit the user's balance
      if (newStatus === 'approved') {
        // Fetch current balance first to be safe (or use a stored procedure if available)
        const { data: userData, error: userError } = await supabase.from('users').select('balance').eq('id', userId).single();
        if (userError) throw userError;

        const newBalance = (userData?.balance || 0) + reward;
        const { error: balanceError } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
        if (balanceError) throw balanceError;
      }

      // Remove from visual queue
      setSubmissions(submissions.filter(s => s.id !== id));
    } catch (err) {
      console.error("Financial operation failed:", err);
      alert("Error processing submission. Database rolled back.");
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="text-xs text-dim font-normal">Review and approve worker task submissions.</p>
        </div>
      </header>

      {loading ? (
        <div className="p-20 text-center"><div className="size-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : submissions.length === 0 ? (
        <EmptyState message="No Pending Submissions" sub="The review queue is currently empty." icon={ClipboardList} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map(s => (
            <div key={s.id} className="glass-card p-5 flex flex-col gap-5 border-white/5 hover:border-blue-500/20 transition-all group">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500/20 transition-all"><Database size={18} /></div>
                     <div>
                        <h4 className="text-sm font-bold text-white outfit tracking-tight">{s.users?.email || 'Worker '+s.user_id.substring(0,8)}</h4>
                        <p className="text-[9px] text-dim font-semibold uppercase tracking-widest mt-0.5">{s.task_type || 'General Task'}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-dim font-semibold uppercase tracking-widest mb-1">Reward</p>
                    <p className="text-base font-bold text-emerald-500 outfit">${s.base_reward?.toFixed(2) || '0.00'}</p>
                  </div>
               </div>

               <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {s.file_url && (
                        <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shadow-lg shadow-blue-600/10">
                          <ExternalLink size={16} />
                        </a>
                    )}
                    <span className="text-[9px] text-dim font-medium uppercase tracking-widest">{new Date(s.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateSubmissionStatus(s.id, 'rejected', s.user_id, s.base_reward)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider text-dim hover:text-red-500 transition-all">Reject</button>
                    <button onClick={() => updateSubmissionStatus(s.id, 'approved', s.user_id, s.base_reward)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[9px] font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-600/10 transition-all">Approve</button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Payouts Queue ---
const PayoutsQueue = () => {
  const [payouts, setPayouts] = useState<WorkerPayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financialService.getPendingPayouts().then(data => {
      setPayouts(data);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (payoutId: string) => {
    try {
      await financialService.approvePayout(payoutId);
      // Remove or update the approved payout from the list
      setPayouts(payouts.filter(p => p.id !== payoutId));
    } catch (err) {
      console.error("Failed to approve payout", err);
      alert("Failed to approve payout. Check console.");
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-xs text-dim font-normal">Review and process worker withdrawal requests.</p>
        </div>
      </header>

      {loading ? (
        <div className="p-20 text-center"><div className="size-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mx-auto" /></div>
      ) : payouts.length === 0 ? (
        <EmptyState message="No Pending Settlements" sub="All worker withdrawal requests have been processed." icon={Wallet} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payouts.map(p => (
            <div key={p.id} className="glass-card p-5 flex flex-col gap-5 border-white/5 hover:border-emerald-500/20 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-lg shadow-inner">
                    {p.user?.full_name?.charAt(0) || p.user?.email?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white outfit tracking-tight group-hover:text-emerald-400 transition-colors uppercase">{p.user?.full_name || 'Worker'}</h3>
                    <p className="text-[9px] text-dim font-semibold uppercase tracking-widest mt-0.5">Withdrawal Request</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-dim font-semibold uppercase tracking-widest mb-1">Status</p>
                  <span className="px-2.5 py-0.5 bg-orange-500/10 text-orange-500 rounded-full text-[9px] font-bold uppercase tracking-wider">Pending</span>
                </div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-dim font-semibold uppercase tracking-widest mb-1">Transfer Amount</p>
                  <p className="text-xl font-bold text-white outfit tracking-tight">${p.amount.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => handleApprove(p.id)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/10 transition-all"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



const DatasetsManagement = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('company_campaigns').select('*, users(full_name)').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setCampaigns(data);
    });
  }, []);

  const downloadDataset = async (campaignId: string, title: string) => {
    setExporting(campaignId);
    try {
      // In a real production system, we'd fetch from task_submissions linked to this campaign
      // For now, we'll fetch all 'approved' submissions to demonstrate the export logic
      const { data, error } = await supabase
        .from('task_submissions')
        .select('*, users(email)')
        .eq('status', 'approved')
        .limit(1000);

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data || [], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset_${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export dataset. Check console.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <header className="text-white flex justify-between items-end">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Data Campaigns</h1>
          <p className="text-xs text-dim font-normal">Monitoring ground truth collection and exporting results.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map(c => (
           <div key={c.id} className="p-6 rounded-[2.5rem] bg-slate-900 border border-white/5 group hover:border-blue-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-500 transition-colors uppercase tracking-tight">{c.title}</h3>
                    <p className="text-xs text-dim font-medium uppercase tracking-widest">{c.users?.full_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.status === 'active' ? 'bg-blue-500/20 text-blue-500' : 'bg-white/10 text-dim'}`}>
                    {c.status}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[10px] font-bold text-dim uppercase tracking-widest">
                    <span>Progress: {Math.round((c.completed_count / c.target_count) * 100)}%</span>
                    <span className="text-emerald-500">Purity Goal: 99.8%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${(c.completed_count / c.target_count) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => downloadDataset(c.id, c.title)}
                  disabled={exporting === c.id}
                  className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10"
                >
                  {exporting === c.id ? 'Bundling...' : 'Download Results'}
                </button>
                <div className="px-5 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-emerald-500 text-sm italic">
                  ${c.total_cost?.toLocaleString()}
                </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

// ─── Featured Tasks Management ─────────────────────────────────────────────────
const FeaturedTasksManagement = () => {
  // ── State ─────────────────────────────────────────────────────────────────
  const [featuredCards, setFeaturedCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [cardTasks, setCardTasks] = useState<any[]>([]);
  const [cardSubs, setCardSubs] = useState<any[]>([]);
  const [cardLoading, setCardLoading] = useState(false);
  const [subTab, setSubTab] = useState<'tasks' | 'submissions' | 'analytics'>('tasks');
  const [processing, setProcessing] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);

  // ── Add-task form ─────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    reward: 0.5,
    task_type: 'text',
    estimated_time: '5M',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // ── Edit featured card form ───────────────────────────────────────────────
  const [editCard, setEditCard] = useState<any | null>(null);
  const [savingCard, setSavingCard] = useState(false);

  // ── Fetch all featured cards ──────────────────────────────────────────────
  const loadFeatured = async () => {
    setLoading(true);
    // 1. Fetch the basic featured cards
    const { data: cards, error } = await supabase
      .from('featured_tasks')
      .select('*')
      .order('display_order', { ascending: true });

    if (!cards) {
      setFeaturedCards([]);
      setLoading(false);
      return;
    }

    // 2. Aggregate stats for each card
    const cardsWithStats = await Promise.all(cards.map(async (card) => {
      const [{ count: taskCount }, { count: pendingCount }] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('target_screen', card.target_screen),
        supabase.from('task_submissions').select('id, tasks!inner(target_screen)', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('tasks.target_screen', card.target_screen)
      ]);

      return {
        ...card,
        stats: {
          tasks: taskCount || 0,
          pending: pendingCount || 0
        }
      };
    }));

    setFeaturedCards(cardsWithStats);
    setLoading(false);
  };

  useEffect(() => { loadFeatured(); }, []);

  // ── Drill into a card ─────────────────────────────────────────────────────
  const openCard = async (card: any) => {
    setSelectedCard(card);
    setSubTab('tasks');
    setShowAddForm(false);
    setCardLoading(true);

    const [tasksResult, subsResult, analyticsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('target_screen', card.target_screen)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('task_submissions')
        .select('id, user_id, status, submitted_at, submission_data, users(full_name, email), tasks!inner(title, task_type, reward, target_screen)')
        .eq('status', 'pending')
        .eq('tasks.target_screen', card.target_screen)
        .order('submitted_at', { ascending: false })
        .limit(30),
      // Mock analytics data based on timeRange (real impl would hit a view or rpc)
      new Promise(resolve => {
        const mock = Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          submissions: Math.floor(Math.random() * 50) + 10,
          completed: Math.floor(Math.random() * 30) + 5
        }));
        resolve({ data: mock });
      })
    ]);

    setCardTasks(tasksResult.data || []);
    setCardSubs(subsResult.data || []);
    setAnalyticsData((analyticsResult as any).data || []);
    setCardLoading(false);
  };

  // ── Add a task under the card's screen ───────────────────────────────────
  const handleAddTask = async () => {
    if (!newTask.title.trim() || !selectedCard) return;
    setSaving(true);
    const { error } = await supabase.from('tasks').insert({
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      reward: newTask.reward,
      task_type: newTask.task_type,
      estimated_time: newTask.estimated_time,
      is_active: newTask.is_active,
      target_screen: selectedCard.target_screen,
      status: 'active',
    });
    setSaving(false);
    if (!error) {
      setNewTask({ title: '', description: '', reward: 0.5, task_type: 'text', estimated_time: '5M', is_active: true });
      setShowAddForm(false);
      openCard(selectedCard);
    } else {
      alert('Failed to create task: ' + error.message);
    }
  };

  // ── Toggle task active/inactive ───────────────────────────────────────────
  const toggleTaskActive = async (taskId: string, current: boolean) => {
    await supabase.from('tasks').update({ is_active: !current }).eq('id', taskId);
    setCardTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_active: !current } : t));
  };

  // ── Approve / Reject submission ───────────────────────────────────────────
  const handleApprove = async (subId: string) => {
    setProcessing(subId);
    const { error } = await supabase.from('task_submissions').update({ status: 'approved' }).eq('id', subId);
    if (!error) setCardSubs(prev => prev.filter(s => s.id !== subId));
    else alert('Error: ' + error.message);
    setProcessing(null);
  };

  const handleReject = async (subId: string) => {
    setProcessing(subId);
    const { error } = await supabase.from('task_submissions').update({ status: 'rejected' }).eq('id', subId);
    if (!error) setCardSubs(prev => prev.filter(s => s.id !== subId));
    else alert('Error: ' + error.message);
    setProcessing(null);
  };

  // ── Toggle featured card active ───────────────────────────────────────────
  const toggleCardActive = async (id: string, current: boolean) => {
    await supabase.from('featured_tasks').update({ is_active: !current }).eq('id', id);
    setFeaturedCards(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    if (selectedCard?.id === id) setSelectedCard((prev: any) => ({ ...prev, is_active: !current }));
  };

  // ── Save card edits ───────────────────────────────────────────────────────
  const handleSaveCard = async () => {
    if (!editCard) return;
    setSavingCard(true);
    const { error } = await supabase.from('featured_tasks').update({
      title: editCard.title,
      subtitle: editCard.subtitle,
      display_order: editCard.display_order,
      gradient_start: editCard.gradient_start,
      gradient_end: editCard.gradient_end,
    }).eq('id', editCard.id);
    setSavingCard(false);
    if (!error) {
      setFeaturedCards(prev => prev.map(c => c.id === editCard.id ? { ...c, ...editCard } : c));
      if (selectedCard?.id === editCard.id) setSelectedCard((prev: any) => ({ ...prev, ...editCard }));
      setEditCard(null);
    } else {
      alert('Failed to save: ' + error.message);
    }
  };

  // ── Export functionality ─────────────────────────────────────────────────
  const downloadData = async () => {
    if (!selectedCard) return;
    setProcessing('exporting');
    
    const { data: allSubs, error } = await supabase
      .from('task_submissions')
      .select('id, submitted_at, status, submission_data, users(full_name, email), tasks!inner(title, task_type, target_screen)')
      .eq('tasks.target_screen', selectedCard.target_screen);
      
    if (error || !allSubs) {
      alert("Export failed: " + (error?.message || "No data found"));
      setProcessing(null);
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Date,User,Email,Task,Type,Status,Content"].join(",") + "\n"
      + allSubs.map(s => [
          new Date(s.submitted_at).toLocaleDateString(),
          s.users?.full_name?.replace(/,/g, ''),
          s.users?.email,
          s.tasks?.title?.replace(/,/g, ''),
          s.tasks?.task_type,
          s.status,
          JSON.stringify(s.submission_data).replace(/"/g, '""').replace(/,/g, ';')
        ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedCard.target_screen}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setProcessing(null);
  };

  // ── Gradient TASK_TYPE icon map ───────────────────────────────────────────
  const CARD_COLORS: Record<string, string> = {
    XUM_JUDGE: 'from-violet-600/30 to-purple-900/20 border-violet-500/20 shadow-violet-500/5',
    LEXICON_TASK: 'from-blue-600/30 to-sky-900/20 border-blue-500/20 shadow-blue-500/5',
    VOICE_TASK: 'from-pink-600/30 to-rose-900/20 border-pink-500/20 shadow-pink-500/5',
    IMAGE_TASK: 'from-amber-600/30 to-yellow-900/20 border-amber-500/20 shadow-amber-500/5',
    VIDEO_TASK: 'from-teal-600/30 to-emerald-900/20 border-teal-500/20 shadow-teal-500/5',
    default: 'from-slate-600/30 to-slate-900/20 border-slate-500/20',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW (card drilled into)
  if (selectedCard) {
    return (
      <div className="animate-slide-up space-y-6">
        {/* Back header */}
        <header className="flex items-center gap-4">
          <button
            onClick={() => { setSelectedCard(null); setShowAddForm(false); }}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-dim hover:text-white transition-all"
          >
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">{selectedCard.title}</h1>
            <p className="text-xs text-dim mt-0.5">{selectedCard.subtitle}</p>
          </div>
          <button
            onClick={() => toggleCardActive(selectedCard.id, selectedCard.is_active)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedCard.is_active
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            }`}
          >
            {selectedCard.is_active ? '● Live' : '○ Hidden'}
          </button>
          <button
            onClick={() => setEditCard({ ...selectedCard })}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
          >
            Edit Card
          </button>
        </header>

        {/* Edit form overlay */}
        {editCard && (
          <div className="glass-card p-6 border-blue-500/20 bg-blue-600/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Edit Featured Card</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Title</label>
                <input
                  value={editCard.title}
                  onChange={e => setEditCard({ ...editCard, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Subtitle</label>
                <input
                  value={editCard.subtitle}
                  onChange={e => setEditCard({ ...editCard, subtitle: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Gradient Start</label>
                <input
                  value={editCard.gradient_start || ''}
                  onChange={e => setEditCard({ ...editCard, gradient_start: e.target.value })}
                  placeholder="#1349ec"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Gradient End</label>
                <input
                  value={editCard.gradient_end || ''}
                  onChange={e => setEditCard({ ...editCard, gradient_end: e.target.value })}
                  placeholder="#4338ca"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Display Order</label>
                <input
                  type="number"
                  value={editCard.display_order || 0}
                  onChange={e => setEditCard({ ...editCard, display_order: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveCard}
                disabled={savingCard}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                {savingCard ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditCard(null)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl w-fit">
            <button
              onClick={() => setSubTab('tasks')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${subTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-dim hover:text-white'}`}
            >
              Tasks ({cardTasks.length})
            </button>
            <button
              onClick={() => setSubTab('submissions')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${subTab === 'submissions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-dim hover:text-white'}`}
            >
              Pending ({cardSubs.length})
            </button>
            <button
              onClick={() => setSubTab('analytics')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${subTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-dim hover:text-white'}`}
            >
              Analytics
            </button>
          </div>

          <button
            onClick={downloadData}
            disabled={processing === 'exporting'}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2"
          >
            {processing === 'exporting' ? 'Exporting...' : '↓ Download Data'}
          </button>
        </div>

        {cardLoading ? (
          <div className="p-20 text-center"><div className="size-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
        ) : subTab === 'tasks' ? (
          <div className="space-y-4">
            {/* Add new task button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                <Plus size={16} /> Add Task
              </button>
            </div>

            {/* Add task form */}
            {showAddForm && (
              <div className="glass-card p-6 border-blue-500/20 bg-blue-600/5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">New Task for {selectedCard.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Task Title *</label>
                    <input
                      value={newTask.title}
                      onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="e.g. Yoruba Greeting Definitions"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                      rows={2}
                      placeholder="Instructions for workers..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Task Type</label>
                    <select
                      value={newTask.task_type}
                      onChange={e => setNewTask({ ...newTask, task_type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="voice">Voice</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="lexicon">Lexicon</option>
                      <option value="rlhf">RLHF</option>
                      <option value="validation">Validation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Reward ($)</label>
                    <input
                      type="number" step="0.01" min="0.01"
                      value={newTask.reward}
                      onChange={e => setNewTask({ ...newTask, reward: parseFloat(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Estimated Time</label>
                    <input
                      value={newTask.estimated_time}
                      onChange={e => setNewTask({ ...newTask, estimated_time: e.target.value })}
                      placeholder="e.g. 5M, 10M, 30M"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="task_active"
                      checked={newTask.is_active}
                      onChange={e => setNewTask({ ...newTask, is_active: e.target.checked })}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <label htmlFor="task_active" className="text-xs text-white font-semibold">Publish immediately</label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddTask}
                    disabled={saving || !newTask.title.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    {saving ? 'Creating…' : 'Create Task'}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Task list */}
            {cardTasks.length === 0 ? (
              <EmptyState message="No tasks yet" sub="Use the button above to add tasks for this featured section." icon={ClipboardList} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cardTasks.map((task: any) => (
                  <div key={task.id} className="glass-card p-5 border-white/5 hover:border-blue-500/20 transition-all group flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mr-2 ${task.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-dim'}`}>
                          {task.is_active ? 'Active' : 'Hidden'}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/10 text-blue-400">
                          {task.task_type}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">${Number(task.reward).toFixed(2)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{task.title}</h3>
                    {task.description && <p className="text-[11px] text-dim leading-relaxed line-clamp-2">{task.description}</p>}
                    <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                      <button
                        onClick={() => toggleTaskActive(task.id, task.is_active)}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider transition-all"
                      >
                        {task.is_active ? 'Hide' : 'Publish'}
                      </button>
                      <span className="text-[9px] text-dim self-center">{task.estimated_time || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : subTab === 'analytics' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-6 bg-blue-600/5">
                <p className="text-[10px] font-bold text-dim uppercase tracking-widest mb-1">Total Contributions</p>
                <p className="text-2xl font-bold text-white">4,281</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-1">+12% from last {timeRange}</p>
              </div>
              <div className="glass-card p-6 bg-purple-600/5">
                <p className="text-[10px] font-bold text-dim uppercase tracking-widest mb-1">Active Workers</p>
                <p className="text-2xl font-bold text-white">842</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-1">Real-time pulse</p>
              </div>
              <div className="glass-card p-6 bg-emerald-600/5">
                <p className="text-[10px] font-bold text-dim uppercase tracking-widest mb-1">Quality Score</p>
                <p className="text-2xl font-bold text-white">98.4%</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-1">High Accuracy</p>
              </div>
            </div>

            <div className="glass-card p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Submission Trends</h3>
                  <p className="text-[10px] text-dim">Volume of data collection over time</p>
                </div>
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                  {['day', 'week', 'month', 'year'].map((r: any) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${timeRange === r ? 'bg-blue-600 text-white' : 'text-dim hover:text-white'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="submissions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSub)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          // Submissions tab
          <div className="space-y-4">
            {cardSubs.length === 0 ? (
              <EmptyState message="No pending submissions" sub="All submissions for this section have been reviewed." icon={ClipboardList} />
            ) : (
              cardSubs.map((sub: any) => (
                <div
                  key={sub.id}
                  className="glass-card p-5 border-white/5 hover:border-emerald-500/10 transition-all"
                  style={{ opacity: processing === sub.id ? 0.5 : 1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">{sub.users?.full_name || 'Unknown Worker'}</p>
                      <p className="text-[10px] text-dim">{sub.users?.email}</p>
                      <p className="text-[9px] text-dim mt-0.5 uppercase tracking-widest">{new Date(sub.submitted_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 uppercase">
                        {sub.tasks?.task_type || 'task'}
                      </span>
                      <p className="text-emerald-400 font-bold text-sm mt-1">${Number(sub.tasks?.reward || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  {sub.tasks?.title && (
                    <p className="text-[11px] text-dim italic mb-3">Task: {sub.tasks.title}</p>
                  )}
                  {sub.submission_data?.text_value && (
                    <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/5">
                      <p className="text-[10px] text-dim font-bold uppercase tracking-widest mb-1">Submission Content</p>
                      <p className="text-xs text-white">{sub.submission_data.text_value}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(sub.id)}
                      disabled={processing === sub.id}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(sub.id)}
                      disabled={processing === sub.id}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-red-500/20"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CARD GRID (main view)
  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Featured Tasks</h1>
          <p className="text-xs text-dim font-normal mt-1">Manage featured task categories shown in the mobile app. Click any card to add tasks or review submissions.</p>
        </div>
      </header>

      {loading ? (
        <div className="p-20 text-center"><div className="size-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : featuredCards.length === 0 ? (
        <EmptyState message="No Featured Cards" sub="No featured task cards found in the database. Add entries to the 'featured_tasks' table in Supabase." icon={ClipboardList} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCards.map(card => {
            const colorClass = CARD_COLORS[card.target_screen] || CARD_COLORS.default;
            return (
              <button
                key={card.id}
                onClick={() => openCard(card)}
                className={`glass-card p-6 text-left flex flex-col gap-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group bg-gradient-to-br ${colorClass}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg"
                    style={{ background: card.gradient_start ? `linear-gradient(135deg, ${card.gradient_start}, ${card.gradient_end || card.gradient_start})` : 'rgba(255,255,255,0.1)' }}
                  >
                    {card.icon_name === 'balance' ? '⚖️' :
                     card.icon_name === 'translate' ? '🌐' :
                     card.icon_name === 'mic' ? '🎙' :
                     card.icon_name === 'image' ? '🖼' :
                     card.icon_name === 'videocam' ? '🎬' : '📋'}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    card.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {card.is_active ? 'Live' : 'Hidden'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors uppercase tracking-tight">{card.title}</h3>
                  <p className="text-[11px] text-dim mt-1 leading-relaxed line-clamp-2">{card.subtitle}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                   <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[8px] font-bold text-dim uppercase tracking-widest">Active Tasks</p>
                      <p className="text-lg font-bold text-white">{card.stats?.tasks || 0}</p>
                   </div>
                   <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-[8px] font-bold text-dim uppercase tracking-widest">Pending Subs</p>
                      <p className="text-lg font-bold text-emerald-400">{card.stats?.pending || 0}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                  <span className="text-[9px] font-bold text-dim uppercase tracking-widest">Target: {card.target_screen}</span>
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">Analytics & Ops →</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const LinguasenseView = () => {
  const [tab, setTab] = useState<'campaigns' | 'submissions'>('campaigns');

  return (
    <div className="space-y-8">
      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl w-fit">
        <button 
          onClick={() => setTab('campaigns')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'campaigns' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-dim hover:text-white'}`}
        >
          Data Campaigns
        </button>
        <button 
          onClick={() => setTab('submissions')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'submissions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-dim hover:text-white'}`}
        >
          Submissions
        </button>
      </div>

      {tab === 'campaigns' ? <DatasetsManagement /> : <SubmissionReviewQueue />}
    </div>
  );
};


// --- Admin Settings ---
const AdminSettings = () => {
  const [apiCost, setApiCost] = useState<string>('20');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('platform_settings').select('value').eq('key', 'api_base_cost').single()
      .then(({ data }) => {
        if (data?.value?.amount) {
          setApiCost(data.value.amount.toString());
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const numCost = parseFloat(apiCost);
    if (isNaN(numCost) || numCost < 0) {
      alert("Invalid base cost");
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from('platform_settings').upsert({
        key: 'api_base_cost',
        value: { amount: numCost, currency: 'USD' },
        description: 'The base flat fee charged to an Enterprise API user when creating a new task programmatically.'
      });
      if (error) throw error;
      alert("Settings saved successfully.");
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-xs text-dim font-normal">Configure global platform variables and fees.</p>
        </div>
      </header>

      {loading ? (
        <div className="p-20 text-center"><div className="size-10 border-4 border-slate-600/20 border-t-slate-600 rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="max-w-xl">
          <div className="glass-card p-6 border-white/5 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4">API & Billing</h3>
            
            <div>
              <label className="block text-[10px] text-dim font-bold uppercase tracking-widest mb-2">Base Task Creation Fee (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dim font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={apiCost}
                  onChange={(e) => setApiCost(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-dim font-medium mt-2">
                This flat fee is automatically deducted from a company's wallet whenever they create a new task programmatically via the API (in addition to the item rewards).
              </p>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Main Layout Components ---

const SidebarLink = ({ active, onClick, icon: Icon, label }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group w-full
        ${active ? 'bg-blue-600/10 text-blue-500 border-l-2 border-blue-600' : 'text-dim hover:bg-white/5 hover:text-white'}`}
    >
      <Icon size={16} className={`transition-all ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className={`text-[11px] uppercase tracking-wider ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
    </button>
);

const Sidebar = ({ activeView, navigateTo, signOut }: any) => (
  <aside className="fixed left-0 top-0 h-screen w-64 bg-[#020617] border-r border-white/5 flex flex-col p-6 z-50">
    <div className="flex items-center gap-3 mb-10 px-2 group">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
        <LayoutDashboard size={16} />
      </div>
      <span className="font-bold text-lg tracking-tight text-white outfit uppercase">XUM <span className="text-blue-500 font-semibold italic">AI</span></span>
    </div>

    <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
      <p className="text-[9px] text-dim font-bold uppercase tracking-[0.2em] mb-4 px-4 opacity-40">Main Ops</p>
      <SidebarLink active={activeView === 'overview'} onClick={() => navigateTo('overview')} icon={BarChart3} label="Dashboard" />
      <SidebarLink active={activeView === 'users'} onClick={() => navigateTo('users')} icon={Users} label="Worker Directory" />
      <SidebarLink active={activeView === 'companies'} onClick={() => navigateTo('companies')} icon={Briefcase} label="Enterprises" />
      <SidebarLink active={activeView === 'tasks'} onClick={() => navigateTo('tasks')} icon={ClipboardList} label="Task Engine" />
      <SidebarLink active={activeView === 'featured_tasks'} onClick={() => navigateTo('featured_tasks')} icon={Bell} label="Featured Tasks" />
      
      <p className="text-[10px] text-dim font-black uppercase tracking-[0.2em] mt-8 mb-4 px-4 opacity-50">Discovery</p>
      <SidebarLink active={activeView === 'linguasense'} onClick={() => navigateTo('linguasense')} icon={Database} label="Linguasense" />
      <SidebarLink active={activeView === 'api_keys'} onClick={() => navigateTo('api_keys')} icon={Key} label="API Access" />
      
      <p className="text-[10px] text-dim font-black uppercase tracking-[0.2em] mt-8 mb-4 px-4 opacity-50">Platform</p>
      <SidebarLink active={activeView === 'payouts'} onClick={() => navigateTo('payouts')} icon={BarChart3} label="Payments" />
      <SidebarLink active={activeView === 'settings'} onClick={() => navigateTo('settings')} icon={Settings} label="Settings" />
    </nav>

    <div className="pt-6 border-t border-white/5 space-y-2">
      <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-dim hover:text-red-500 transition-colors w-full">
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  </aside>
);

export default function App() {
  const [activeView, setActiveView] = useState<View>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { admin, isAdmin, loading, signOut } = useAdmin();

  const getActiveView = () => {
    switch (activeView) {
      case 'overview': return <Overview />;
      case 'users': return <UserManagement />;
      case 'tasks': return <TaskManagement />;
      case 'featured_tasks': return <FeaturedTasksManagement />;
      case 'linguasense': return <LinguasenseView />;
      case 'payouts': return <PayoutsQueue />;
      case 'companies': return <CompanyManagement />;
      case 'api_keys': return <ApiKeysManagement />;
      case 'settings': return <AdminSettings />;
      default: return <Overview />;
    }
  };

  const navigateTo = (view: View) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-card p-10 border-white/10">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <LogOut size={24} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white outfit mb-2">Authentication Required</h2>
          <p className="text-sm text-dim mb-8">Please log in through the main Business Hub to access the Admin Console.</p>
          <a href="http://localhost:3001/auth?intent=admin" className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-card p-10 border-red-500/20">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex flex-col items-center justify-center mx-auto mb-6 text-red-500">
             <ShieldAlert size={40} />
          </div>
          <h2 className="text-3xl font-black text-white outfit mb-2">Access Denied</h2>
          <p className="text-sm text-dim mb-8">Your profile does not hold administrative clearance to access the Root Node.</p>
          <button onClick={signOut} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all border border-white/10">
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeView={activeView} navigateTo={navigateTo} signOut={signOut} />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full h-16 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
            <LayoutDashboard size={14} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white uppercase">XUM <span className="text-blue-500 font-semibold italic">AI</span></span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-dim hover:text-white transition-colors">
          <LayoutDashboard size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-[#020617] p-6 animate-slide-right shadow-2xl" onClick={e => e.stopPropagation()}>
             <Sidebar activeView={activeView} navigateTo={navigateTo} signOut={signOut} />
          </div>
        </div>
      )}

      {/* Main Content Scrollable Area */}
      <main className="flex-1 lg:ml-64 min-h-screen relative overflow-hidden">
        <div className="p-8 md:p-12 lg:p-20 max-w-7xl mx-auto w-full pt-32 lg:pt-24 relative z-10 transition-all duration-500">
          {getActiveView()}
        </div>
        
        {/* Ambient Decorative Background */}
        <div className="fixed top-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
        <div className="fixed bottom-[-15%] left-[-15%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      </main>
    </div>
  );
}
