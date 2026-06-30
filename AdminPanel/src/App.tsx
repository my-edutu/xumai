import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Wallet,
  ShieldAlert,
  LogOut,
  Scale,
  MessageSquare,
  Settings,
  Languages,
  TrendingUp,
  Archive,
  CreditCard,
  Bell,
  Search,
  ChevronRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Cpu,
  Database,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from './supabaseClient';
import { datasetService } from './utils/datasetService';

import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MarketplaceManager } from './components/MarketplaceManager';
import { financialService } from './utils/financialService';
import type { WorkerPayout, CompanyWallet, BillingRequest } from './utils/financialService';

// --- Types & Constants ---
type View = 'overview' | 'analytics' | 'marketplace' | 'users' | 'tasks' | 'lexicon' | 'appeals' | 'payouts' | 'billing' | 'escrow' | 'growth' | 'datasets' | 'support' | 'audit' | 'settings';

const CHART_DATA = [
  { name: '00:00', load: 32, tasks: 450 },
  { name: '04:00', load: 28, tasks: 310 },
  { name: '08:00', load: 85, tasks: 1200 },
  { name: '12:00', load: 92, tasks: 1800 },
  { name: '16:00', load: 74, tasks: 1400 },
  { name: '20:00', load: 56, tasks: 900 },
];

const PIE_DATA = [
  { name: 'Approved', value: 75, color: '#10b981' },
  { name: 'Pending', value: 20, color: '#f97316' },
  { name: 'Rejected', value: 5, color: '#ef4444' },
];

// --- Shared Components ---

const AdminCard = ({ title, children, className = "" }: any) => (
  <div className={`glass-card p-6 ${className}`}>
    {title && <h3 className="text-sm font-bold text-dim uppercase tracking-widest mb-4 outfit">{title}</h3>}
    {children}
  </div>
);

const StatIndicator = ({ label, value, trend, icon: Icon, color = "primary" }: any) => (
  <div className="glass-card p-6 md:p-8 group cursor-default hover:border-orange-500/30 transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl bg-${color === 'orange' ? 'orange-500' : color === 'blue' ? 'blue-500' : color === 'green' ? 'emerald-500' : 'purple-500'}/10 text-${color === 'orange' ? 'orange-500' : color === 'blue' ? 'blue-500' : color === 'green' ? 'emerald-500' : 'purple-500'} group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={28} />
      </div>
      {trend && (
        <span className={`text-[10px] md:text-xs font-black px-3 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] md:text-xs text-dim font-black uppercase tracking-[0.2em]">{label}</p>
    <h4 className="text-3xl md:text-4xl lg:text-5xl font-black mt-2 text-white outfit tracking-tighter">{value}</h4>
  </div>
);

const EmptyState = ({ message, sub, icon: Icon = Search }: any) => (
  <div className="flex flex-col items-center justify-center p-20 text-center opacity-80">
    <div className="p-6 bg-white/5 rounded-3xl mb-4 text-dim">
      <Icon size={48} strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-bold outfit text-white">{message || 'No data found'}</h3>
    <p className="text-sm text-dim mt-2 max-w-xs mx-auto">{sub || 'System is currently waiting for new records to populate this module.'}</p>
  </div>
);

// --- Page Modules ---

const Overview = ({ setView }: { setView: (v: View) => void }) => {
  return (
    <div className="space-y-8 animate-slide-up pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-12 gap-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">Welcome back, Admin</h1>
          <p className="text-dim mt-2 text-sm md:text-base font-medium">Here's a quick look at how the ecosystem is performing today.</p>
        </div>
        <div className="hidden md:flex gap-4">
          <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all relative">
            <Bell size={24} strokeWidth={1.5} />
            <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-orange-500 rounded-full border-4 border-[#020617]" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatIndicator label="Engine Load" value="74.2%" trend="+5.4%" icon={Cpu} color="orange" />
        <StatIndicator label="Throughput" value="128.5k" trend="+12%" icon={Database} color="blue" />
        <StatIndicator label="Accuracy" value="98.1%" trend="+1.2%" icon={BarChart3} color="green" />
        <StatIndicator label="Capital Flow" value="$42.8k" trend="+18%" icon={TrendingUp} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 bg-gradient-to-br from-surface-dark to-bg-dark">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold">Network Pressure</h3>
              <p className="text-xs text-dim font-medium">Task submissions vs. Global Latency (last 24h)</p>
            </div>
            <div className="p-1 bg-white/5 rounded-xl flex gap-1">
              <button className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold">LIVE</button>
              <button className="px-4 py-1.5 hover:bg-white/5 rounded-lg text-xs font-semibold text-dim transition-all">7D</button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
                <Area type="monotone" dataKey="load" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorLoad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col border-orange-500/10">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <ShieldAlert size={28} className="text-orange-500" strokeWidth={1.5} /> Action Center
          </h3>
          <div className="space-y-5 flex-1 overflow-y-auto pr-2 no-scrollbar">
            <ControlModule icon={<AlertTriangle className="text-red-500" size={20} />} title="New Alerts" desc="12 flags in Swahili project" action="Review" onClick={() => setView('audit')} />
            <ControlModule icon={<Clock className="text-blue-500" size={20} />} title="Withdrawal Queue" desc="156 requests ready" action="Manage" onClick={() => setView('payouts')} />
            <ControlModule icon={<MessageSquare className="text-purple-500" size={20} />} title="Support Items" desc="8 messages need reply" action="Open" onClick={() => setView('support')} />
            <ControlModule icon={<Scale className="text-emerald-500" size={20} />} title="Pending Appeals" desc="42 rating disputes" action="Handle" onClick={() => setView('appeals')} />
          </div>
          <button onClick={() => setView('settings')} className="w-full mt-10 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-orange-900/20">
            <Settings size={18} /> System Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AccessModule title="Human Intelligence" items={[
          { icon: Languages, label: "Linguasense Dialects", count: "14 active", color: "orange", view: 'lexicon' },
          { icon: Archive, label: "Dataset Inventory", count: "84 sets", color: "blue", view: 'datasets' },
          { icon: TrendingUp, label: "Growth Retention", count: "92% rate", color: "green", view: 'growth' }
        ]} setView={setView} />

        <AccessModule title="Financial Core" items={[
          { icon: Wallet, label: "Settlement Ledger", count: "$14k pending", color: "purple", view: 'payouts' },
          { icon: CreditCard, label: "Company Accounts", count: "28 entities", color: "orange", view: 'billing' },
          { icon: ShieldAlert, label: "Escrow Vault", count: "$124k locked", color: "red", view: 'escrow' }
        ]} setView={setView} />

        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-dim uppercase tracking-widest mb-6">Submission Quality</h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {PIE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4">
            {PIE_DATA.map(d => (
              <div key={d.name} className="text-center">
                <div className="text-[10px] font-bold text-dim uppercase">{d.name}</div>
                <div className="font-black text-sm" style={{ color: d.color }}>{d.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ControlModule = ({ icon, title, desc, action, onClick }: any) => (
  <div className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4 hover:border-white/10 transition-all group">
    <div className="p-3 bg-black/30 rounded-2xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-sm truncate text-white">{title}</h4>
      <p className="text-[10px] text-dim truncate font-medium">{desc}</p>
    </div>
    <button onClick={onClick} className="px-4 py-2 bg-white/10 hover:bg-orange-600 text-[10px] font-bold uppercase rounded-xl transition-all text-white">
      {action}
    </button>
  </div>
);

const AccessModule = ({ title, items, setView }: any) => (
  <AdminCard title={title}>
    <div className="space-y-2 mt-4">
      {items.map((it: any, i: number) => (
        <button key={i} onClick={() => setView(it.view)} className="w-full group flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all text-left">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl bg-white/5 group-hover:text-${it.color === 'orange' ? 'orange-500' : it.color === 'blue' ? 'blue-500' : it.color === 'green' ? 'emerald-500' : 'red-500'} transition-all`}>
              <it.icon size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">{it.label}</p>
              <p className="text-[10px] text-dim">{it.count}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-dim opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      ))}
    </div>
  </AdminCard>
);

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    const from = page * pageSize;
    const to = from + pageSize - 1;

    supabase.from('users')
      .select('id, email, full_name, role, balance, trust_score, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
      .then(({ data, count }) => {
        if (data) setUsers(data);
        if (count !== null) setTotalCount(count);
        setLoading(false);
      });
  }, [page, pageSize]);

  return (
    <div className="animate-slide-up space-y-10">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-8 mb-12">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter">User Directory</h1>
          <p className="text-dim font-medium">A complete list of everyone working on the platform.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim group-focus-within:text-orange-500 transition-colors" size={20} />
            <input placeholder="Search users..." className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-full md:w-80 transition-all font-semibold text-white px-4" />
          </div>
          <button className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-orange-900/30 active:scale-95 transition-all whitespace-nowrap">
            Enroll User
          </button>
        </div>
      </header>

      {loading ? (
        <div className="p-40 text-center">
          <div className="size-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dim font-bold outfit uppercase tracking-[0.2em]">Synchronizing Records</p>
        </div>
      ) : users.length === 0 ? (
        <EmptyState message="Registry Empty" sub="No registered entities found in the global ledger." icon={Users} />
      ) : (
        <div className="table-container glass-card p-4 overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Registry Identity</th>
                <th>Access Tier</th>
                <th>Capital Focus</th>
                <th>Trust Integrity</th>
                <th>Registry Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="group">
                  <td>
                    <div className="flex items-center gap-4 py-2">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-bold text-xl border border-white/10 group-hover:border-orange-500/50 transition-all text-white text-center">
                        {u.full_name?.charAt(0) || u.email?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-base text-white group-hover:text-orange-500 transition-colors">{u.full_name || u.email}</div>
                        <div className="text-[10px] text-dim font-mono tracking-tighter opacity-60 uppercase">UID: {u.id.substring(0, 16)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {u.role} Access
                    </span>
                  </td>
                  <td>
                    <div className="font-black text-lg text-emerald-500">${u.balance?.toFixed(2) || '0.00'}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[120px] h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${(u.trust_score || 0) * 10}%` }} />
                      </div>
                      <span className="text-xs font-black outfit text-white">{u.trust_score || '0.0'} SI</span>
                    </div>
                  </td>
                  <td className="text-xs text-dim font-bold">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="text-right">
                    <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white">
                      <ExternalLink size={18} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="mt-8 flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-xs font-bold text-dim uppercase tracking-widest">
              Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} Entities
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black outfit text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * pageSize >= totalCount}
                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black outfit text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskGovernance = () => (
  <div className="animate-slide-up space-y-10">
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white gap-6">
      <div>
        <h1 className="text-3xl lg:text-4xl font-black outfit tracking-tighter">Task Management</h1>
        <p className="text-dim">Manage the quality and distribution of data tasks.</p>
      </div>
      <button className="w-full lg:w-auto px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/30 active:scale-95 transition-all">
        New Production Batch
      </button>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <MetricCard label="Active Batches" val="12" sub="Across 4 categories" color="blue" />
      <MetricCard label="Global Consensus" val="98.4%" sub="+2.1% efficiency" color="green" />
      <MetricCard label="Needs Arbitration" val="45" sub="Pending admin review" color="red" />
    </div>
    <AdminCard title="High Pressure Task Flows">
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="text-white">Project Focus</th>
              <th className="text-white">Engine type</th>
              <th className="text-white">Throughput</th>
              <th className="text-white">Capital locked</th>
              <th className="text-right text-white">Audit</th>
            </tr>
          </thead>
          <tbody>
            <FlowRow name="Swahili NLP Tuning" id="T-001" prog={78} Locked="$1.2k" color="orange" />
            <FlowRow name="Accra St. Detection" id="T-002" prog={92} Locked="$3.1k" color="blue" />
            <FlowRow name="RLHF Calibration" id="T-003" prog={14} Locked="$5.8k" color="purple" />
          </tbody>
        </table>
      </div>
    </AdminCard>
  </div>
);

const MetricCard = ({ label, val, sub, color }: any) => (
  <div className={`p-8 glass-card border-l-8 ${color === 'blue' ? 'border-l-blue-600' : color === 'green' ? 'border-l-emerald-600' : 'border-l-red-600'}`}>
    <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em]">{label}</p>
    <div className="flex items-end gap-3 mt-4">
      <h4 className="text-4xl font-black outfit text-white">{val}</h4>
      <p className="text-xs text-dim mb-1 font-bold">{sub}</p>
    </div>
  </div>
);

const FlowRow = ({ name, id, prog, Locked, color }: any) => (
  <tr className="group">
    <td className="py-4">
      <div className="font-bold text-base group-hover:text-orange-500 transition-colors text-white">{name}</div>
      <div className="text-[10px] text-dim uppercase tracking-widest font-bold">BATCH {id}</div>
    </td>
    <td><div className={`size-3 rounded-full ${color === 'orange' ? 'bg-orange-500' : color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'} animate-pulse`} /></td>
    <td className="w-1/3">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-orange-600 rounded-full" style={{ width: `${prog}%` }} />
        </div>
        <span className="text-xs font-black outfit text-white">{prog}%</span>
      </div>
    </td>
    <td className="font-black text-emerald-500 font-bold">{Locked}</td>
    <td className="text-right font-black uppercase text-[10px] hover:text-orange-500 cursor-pointer transition-all text-white">Inspect</td>
  </tr>
);

const Linguasense = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('Grounding');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);

  const templates = {
    'Grounding': 'Generate a prompt to collect natural dialect data for [Target Concept] in [Dialect].',
    'Validation': 'Create a verification task to confirm if [Submission] is accurate in [Region].',
    'Synthesis': 'Find a gap in the [Dataset] and generate a prompt for native speakers to fill it.',
    'Ambiguity': 'Resolve a consensus conflict where User A says "[Meaning A]" and User B says "[Meaning B]".'
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedPrompt('');

    // Simulate LLM Processing
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedPrompt(`### Task Guidance Generated by XUM-V5\n\n**Context**: Financial Micro-interactions\n**Target**: Street-level Pidgin (Lagos Cluster)\n\n**Guidance**: "When translating 'I need a small loan', avoid formal dictionary terms. Ask the user for the slang they would use with a close friend at a market. Ensure they explain the 'interest' concept using localized trade metaphors."\n\n**Grounding Status**: Verified against 14k historical tokens.`);
    }, 1500);
  };

  const handleSync = () => {
    setSyncProgress(1);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
  };

  return (
    <div className="animate-slide-up space-y-8 pb-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 text-white gap-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter">AI Orchestrator</h1>
          <p className="text-dim font-medium">Automated human intelligence guidance via XUM Synthetic Intelligence.</p>
        </div>
        <button className="w-full lg:w-auto px-8 py-3 bg-orange-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-orange-900/30 active:scale-95 transition-all" onClick={handleSync}>
          Sync Engine
        </button>
      </header>
      <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5">
        {Object.keys(templates).map(t => (
          <button
            key={t}
            onClick={() => setSelectedTemplate(t)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${selectedTemplate === t ? 'bg-orange-600 text-white shadow-lg' : 'text-dim hover:text-white hover:bg-white/5'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Factory Controls */}
        <div className="space-y-6">
          <AdminCard title="Engine Parameters">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-dim uppercase mb-2 block tracking-widest">Active Data Stream</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-orange-500 transition-all">
                  <option>West African NLP Cluster</option>
                  <option>East African Swahili Base</option>
                  <option>Southern Zulu Synthesis</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-dim uppercase mb-2 block tracking-widest">Synthesis Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-4 py-3 bg-orange-600/10 border border-orange-500/30 rounded-xl text-[10px] font-bold text-orange-500">ACCURACY</button>
                  <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-dim">CREATIVE</button>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-900/20 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-900/20"
              >
                {isGenerating ? (
                  <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Cpu size={16} />
                )}
                Generate Guidance
              </button>
            </div>
          </AdminCard>

          <div className="glass-card p-6 border-l-4 border-orange-600 bg-orange-600/5">
            <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">System Logic</h4>
            <p className="text-[11px] text-dim leading-relaxed font-medium">
              The AI tracks consistency across 42,000 human inputs. Manual guidance is only recommended for logic anomalies.
            </p>
          </div>
        </div>

        {/* Generation result */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Linguasense Output Preview">
            <div className="min-h-[300px] bg-black/40 rounded-2xl border border-white/5 p-8 relative overflow-hidden">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-full h-1 bg-white/5 absolute top-0 overflow-hidden">
                    <div className="h-full bg-orange-600 absolute animate-[shimmer_2s_infinite]" style={{ width: '40%' }} />
                  </div>
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] animate-pulse">Synthesizing Prompt...</span>
                </div>
              ) : generatedPrompt ? (
                <div className="animate-slide-up">
                  <div className="flex items-center gap-3 mb-6 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Ready for Deployment
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <pre className="text-xs font-mono text-dim whitespace-pre-wrap leading-relaxed">{generatedPrompt}</pre>
                  </div>
                  <div className="absolute bottom-6 right-6 flex gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-dim transition-all">Edit Logic</button>
                    <button
                      onClick={handleSync}
                      className="px-6 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/40"
                    >
                      Deploy to App
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                  <Cpu size={48} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Prompt Factory Idle</p>
                  <p className="text-[10px] mt-2 font-medium">Configure parameters and select a template to generate guidance.</p>
                </div>
              )}

              {syncProgress > 0 && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
                  <div className="size-24 border-8 border-white/5 border-t-orange-600 rounded-full animate-spin mb-8" />
                  <h3 className="text-2xl font-black outfit text-white mb-2">Syncing Data Models</h3>
                  <p className="text-dim text-xs font-bold uppercase tracking-widest mb-6">Distributing Instructions to 1,200+ Nodes</p>
                  <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-600 transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                  </div>
                  {syncProgress === 100 && (
                    <button
                      onClick={() => { setSyncProgress(0); setGeneratedPrompt(''); }}
                      className="mt-10 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest animate-slide-up"
                    >
                      Calibration Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          </AdminCard>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Languages size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-dim uppercase">Active Languages</p>
                <p className="text-lg font-black text-white">42 Dialects</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500"><CheckCircle2 size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-dim uppercase">Auto-Guidance</p>
                <p className="text-lg font-black text-white">88% Opt.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

const PayoutVaults = () => {
  const [payouts, setPayouts] = useState<WorkerPayout[]>([]);
  const [selectedItem, setSelectedItem] = useState<WorkerPayout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    const data = await financialService.getPendingPayouts();
    setPayouts(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      await financialService.approvePayout(id);
      setPayouts(payouts.filter(p => p.id !== id));
      setSelectedItem(null);
    } catch (e) {
      alert('Failed to approve payout');
    } finally {
      setProcessing(false);
    }
  };

  if (selectedItem) {
    return (
      <div className="animate-slide-up space-y-8">
        <button onClick={() => setSelectedItem(null)} className="flex items-center gap-2 text-dim hover:text-white transition-all font-bold text-sm">
          <ChevronRight size={18} className="rotate-180" /> Back to Payout Queue
        </button>

        <header className="flex flex-col lg:flex-row justify-between items-start text-white gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black outfit tracking-tighter text-white">Review Worker Payout</h1>
            <p className="text-dim mt-1">Reviewing revenue share for {selectedItem.user?.full_name || 'Worker'}</p>
          </div>
          <div className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">
            Pending Approval
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AdminCard title="Contribution Logic">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <p className="text-[10px] font-black text-dim uppercase mb-1">Samples Provided</p>
                  <p className="font-bold text-white text-xl">{selectedItem.contribution_count}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-dim uppercase mb-1">Global Weight</p>
                  <p className="font-bold text-emerald-500 text-xl">{(selectedItem.contribution_weight * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-dim uppercase mb-1">Submission Type</p>
                  <p className="font-bold text-white text-xl uppercase tracking-widest text-[#94a3b8]">Verified</p>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-dim leading-relaxed font-semibold">
                This payout is part of a dataset sale revenue split. The amount is calculated based on the number of verified contributions this worker made to the parent project before the batch was exported.
              </div>
            </AdminCard>

            <AdminCard title="Identity Trace">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-2xl font-black border border-white/10 text-white">
                  {selectedItem.user?.full_name?.charAt(0) || 'W'}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{selectedItem.user?.full_name || 'Anonymous Worker'}</p>
                  <p className="text-sm text-dim">{selectedItem.user?.email}</p>
                  <p className="text-[10px] text-dim uppercase mt-1 font-mono">UID: {selectedItem.user_id}</p>
                </div>
              </div>
            </AdminCard>
          </div>

          <div className="space-y-6">
            <AdminCard title="Payment Release">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-6">
                <p className="text-xs text-dim mb-2 uppercase font-black tracking-widest">Share Amount</p>
                <h2 className="text-4xl font-black text-emerald-500 outfit">${selectedItem.amount.toFixed(2)}</h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => handleApprove(selectedItem.id)}
                  disabled={processing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2"
                >
                  {processing ? <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Confirm & Release'}
                </button>
                <button className="w-full py-4 bg-white/5 hover:bg-red-600/20 text-dim hover:text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-transparent hover:border-red-500/20">
                  Decline Payout
                </button>
              </div>
            </AdminCard>
            <div className="glass-card p-6 bg-blue-500/5 border-blue-500/20">
              <p className="text-[10px] font-black text-blue-500 uppercase mb-2">Internal Check</p>
              <p className="text-xs text-dim leading-relaxed font-medium">Verified by Consensus Engine. All samples passed 0.85+ quality threshold. Direct audit recommended for payments over $500.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-8 pb-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 text-white gap-6">
        <div>
          <h1 className="text-4xl font-black outfit tracking-tighter text-white">Worker Settlement</h1>
          <p className="text-dim font-medium">Distribute revenue shares to workers from verified dataset sales.</p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim group-focus-within:text-orange-500 transition-colors" size={20} />
            <input
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-full lg:w-64 transition-all font-bold text-white px-4"
            />
          </div>
          <button className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-900/40 whitespace-nowrap">Auto-Distribute</button>
        </div>
      </header>

      {loading ? (
        <div className="p-40 text-center">
          <div className="size-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dim font-bold outfit uppercase tracking-[0.2em]">Calculating Revenue Shares</p>
        </div>
      ) : payouts.length === 0 ? (
        <EmptyState message="No Pending Settlements" sub="All revenue shares from available dataset sales have been distributed." icon={Wallet} />
      ) : (
        <AdminCard title="Worker Payout Queue">
          <div className="table-container shadow-2xl overflow-hidden">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="text-white">Worker Identity</th>
                  <th className="text-white">Contribution Share</th>
                  <th className="text-white">Amount</th>
                  <th className="text-white">Source</th>
                  <th className="text-right text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.filter(p => p.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase())).map(row => (
                  <tr key={row.id} className="group hover:bg-white/5 transition-all">
                    <td className="py-4">
                      <div className="font-black text-base group-hover:text-emerald-500 transition-colors text-white">{row.user?.full_name || 'Unknown Worker'}</div>
                      <div className="text-[10px] text-dim">{row.user?.email}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${row.contribution_weight * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-dim">{(row.contribution_weight * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="font-black text-emerald-500 text-lg font-bold">${row.amount.toFixed(2)}</td>
                    <td>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Dataset Sale
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedItem(row)}
                        className="px-4 py-2 bg-white/5 hover:bg-emerald-600 rounded-xl transition-all text-[10px] font-black uppercase text-white"
                      >
                        Review
                      </button>
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


const BusinessLedger = () => {
  const [wallets, setWallets] = useState<CompanyWallet[]>([]);
  const [billingRequests, setBillingRequests] = useState<BillingRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'wallets' | 'billing'>('billing');

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setLoading(true);
    const [w, b, s] = await Promise.all([
      financialService.getCompanyWallets(),
      financialService.getBillingRequests(),
      financialService.getFinancialStats()
    ]);
    setWallets(w);
    setBillingRequests(b);
    setStats(s);
    setLoading(false);
  };

  const handleApproveBilling = async (id: string) => {
    try {
      await financialService.approveDeposit(id);
      loadFinanceData();
    } catch (e) {
      alert('Failed to process deposit');
    }
  };

  return (
    <div className="animate-slide-up space-y-8 pb-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 text-white gap-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black outfit tracking-tighter text-white">Financial Core</h1>
          <p className="text-dim font-medium">Manage corporate liquidity, billing requests, and platform revenue.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
          <button
            onClick={() => setTab('billing')}
            className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'billing' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-dim hover:text-white'}`}
          >
            Billing Requests
          </button>
          <button
            onClick={() => setTab('wallets')}
            className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${tab === 'wallets' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-dim hover:text-white'}`}
          >
            Active Wallets
          </button>
        </div>
      </header>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-6 bg-blue-500/5 border-blue-500/20">
            <p className="text-[10px] font-black text-dim uppercase tracking-widest">Total Liquidity</p>
            <h2 className="text-3xl font-black outfit mt-1 text-white">${stats.totalLiquidity.toLocaleString()}</h2>
            <p className="text-[10px] text-emerald-500 font-bold mt-2">Available for tasks</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-[10px] font-black text-dim uppercase tracking-widest">Gross Deposits</p>
            <h2 className="text-3xl font-black outfit mt-1 text-white">${stats.totalDeposited.toLocaleString()}</h2>
            <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
              <div className="w-[85%] h-full bg-blue-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <p className="text-[10px] font-black text-dim uppercase tracking-widest">Worker Settlements</p>
            <h2 className="text-3xl font-black outfit mt-1 text-white">${stats.totalPaid.toLocaleString()}</h2>
            <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
              <div className="w-[40%] h-full bg-orange-500" />
            </div>
          </div>
          <div className="glass-card p-6 bg-emerald-500/5 border-emerald-500/10">
            <p className="text-[10px] font-black text-dim uppercase tracking-widest">Platform P&L</p>
            <h2 className="text-3xl font-black outfit mt-1 text-emerald-500">${stats.platformRevenue.toLocaleString()}</h2>
            <p className="text-[10px] text-emerald-500/60 font-medium mt-2">Est. fee accumulation</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-40 text-center">
          <div className="size-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dim font-bold outfit uppercase tracking-[0.2em]">Synchronizing Ledger</p>
        </div>
      ) : tab === 'billing' ? (
        <AdminCard title="Corporate Inbound Requests">
          <div className="space-y-4">
            {billingRequests.length === 0 ? (
              <p className="text-center py-10 text-dim font-medium uppercase tracking-widest text-[10px]">No pending billing requests</p>
            ) : (
              billingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <p className="font-black text-base group-hover:text-blue-500 transition-colors text-white">{req.company?.full_name || 'Inc.'}</p>
                      <p className="text-[10px] text-dim uppercase tracking-widest font-bold">{req.type} • {req.payment_method || 'manual'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="font-black text-xl text-white">${req.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-dim font-bold uppercase">{req.status}</p>
                    </div>
                    {req.status === 'pending' && (
                      <button
                        onClick={() => handleApproveBilling(req.id)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40"
                      >
                        Process
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      ) : (
        <AdminCard title="Corporate Financial Wallets">
          <div className="table-container shadow-2xl overflow-hidden">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="text-white">Organization</th>
                  <th className="text-white">Available Liquid</th>
                  <th className="text-white">Total Lifetime Flow</th>
                  <th className="text-white">Active Projects</th>
                  <th className="text-right text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map(w => (
                  <tr key={w.id} className="group hover:bg-white/5 transition-all">
                    <td className="py-4">
                      <div className="font-black text-base group-hover:text-blue-500 transition-colors text-white">{w.company?.full_name || 'Inc.'}</div>
                      <div className="text-[10px] text-dim">{w.company?.email}</div>
                    </td>
                    <td><div className="font-black text-xl text-white outline-none">${w.available_balance.toLocaleString()}</div></td>
                    <td><div className="text-xs font-bold text-dim">${w.total_deposited.toLocaleString()} Deposited</div></td>
                    <td><span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-dim">3 Active</span></td>
                    <td className="text-right">
                      <button className="p-2.5 bg-white/5 hover:bg-blue-600 rounded-xl transition-all text-white">
                        <TrendingUp size={16} />
                      </button>
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

const Datasets = () => {
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [assigningToCompany, setAssigningToCompany] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      // For now, we combine simulated and real data to ensure UI looks good
      // In a full production sync, we would only use the service
      const realData = await datasetService.getBatches();
      setBatches(realData.length > 0 ? realData : dataBatches);
    } catch (e) {
      console.warn("Sync failed, using simulated fallback", e);
      setBatches(dataBatches);
    } finally {
      setIsLoading(false);
    }
  };

  const dataBatches = [
    { id: 'B-821', type: 'Voice', count: '14,200', source: 'Lagos Market Swahili', price: '$4,200', status: 'Ready', lastSync: '2h ago' },
    { id: 'B-822', type: 'Image', count: '8,450', source: 'Nairobi Urban Objects', price: '$2,800', status: 'In Review', lastSync: '5h ago' },
    { id: 'B-823', type: 'Video', count: '1,200', source: 'Accra Street Interaction', price: '$12,500', status: 'Ready', lastSync: '1d ago' },
    { id: 'B-824', type: 'Text', count: '156,000', source: 'Pidgin NLP Cluster', price: '$1,500', status: 'Ready', lastSync: '4h ago' },
  ];

  const companies = [
    { id: 'C-01', name: 'OpenAI (Africa Research)' },
    { id: 'C-02', name: 'Google Brain Accra' },
    { id: 'C-03', name: 'Meta AI Nairobi' },
    { id: 'C-04', name: 'DeepMind Lagos' },
  ];

  return (
    <div className="animate-slide-up space-y-10">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white border-b border-white/5 pb-8 gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black outfit tracking-tighter">Dataset Inventory</h1>
          <p className="text-dim">Manage, download, and monetize batches collected from the worker app.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <button
            onClick={() => datasetService.auditStorage()}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Audit Storage
          </button>
          <button
            onClick={loadBatches}
            className={`px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-900/40 flex items-center justify-center gap-2 ${isLoading ? 'opacity-50' : ''}`}
          >
            {isLoading && <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
            Sync All Batches
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Samples" val="180k" sub="+12k today" color="blue" />
        <MetricCard label="Market Value" val="$21.5k" sub="Ready for sale" color="green" />
        <MetricCard label="Pending Audit" val="8.4k" sub="Awaiting review" color="orange" />
        <MetricCard label="Export Active" val="12" sub="Batches syncing" color="purple" />
      </div>

      <AdminCard title="Production Batches (Linguasense Source)">
        <div className="table-container shadow-2xl overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="text-white">Batch Identity</th>
                <th className="text-white">Sample Type</th>
                <th className="text-white">Volume</th>
                <th className="text-white">Est. Value</th>
                <th className="text-white">Status</th>
                <th className="text-right text-white">Operations</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(batch => (
                <tr key={batch.id} className="group hover:bg-white/5 transition-all">
                  <td className="py-5">
                    <div className="font-black text-white">{batch.id}</div>
                    <div className="text-[10px] text-dim">{batch.source}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${batch.type === 'Voice' ? 'bg-blue-500' :
                        batch.type === 'Image' ? 'bg-orange-500' :
                          batch.type === 'Video' ? 'bg-purple-500' : 'bg-emerald-500'
                        }`} />
                      <span className="text-xs font-bold text-white">{batch.type}</span>
                    </div>
                  </td>
                  <td className="font-black text-white">{batch.count}</td>
                  <td className="font-black text-emerald-500">{batch.price}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${batch.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                      }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-white" title="Download Samples">
                        <Archive size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className="px-4 py-2 bg-orange-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-orange-900/20 active:scale-95 transition-all"
                      >
                        Assign to Company
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Assignment Overlay */}
      {selectedBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl animate-scale-up">
            <AdminCard title={`Assign Batch ${selectedBatch.id} to Client`}>
              <p className="text-xs text-dim mb-8">This batch contains {selectedBatch.count} {selectedBatch.type} samples from "{selectedBatch.source}". Assigning it will transfer access rights to the target company.</p>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-dim uppercase mb-2 block tracking-widest">Target Company</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-orange-500 transition-all">
                    <option value="">Select a partner company...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-500 uppercase">Settlement Value</span>
                    <span className="text-2xl font-black text-white outfit">{selectedBatch.price}</span>
                  </div>
                  <p className="text-[10px] text-dim mt-2 italic">Proceeds will be automatically distributed to contributing workers and platform fees.</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedBatch(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setAssigningToCompany(true);
                      setTimeout(() => {
                        setAssigningToCompany(false);
                        setSelectedBatch(null);
                      }, 2000);
                    }}
                    className="flex-[2] py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-900/40 flex items-center justify-center gap-2"
                  >
                    {assigningToCompany ? (
                      <>
                        <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Processing Transfer...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Confirm Assignment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </AdminCard>
          </div>
        </div>
      )}
    </div>
  );
};

const LedgerItem = ({ company, amount, date, type }: any) => (
  <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl hover:border-blue-500/30 transition-all group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
        <CreditCard size={24} />
      </div>
      <div>
        <p className="font-black text-base group-hover:text-blue-500 transition-colors text-white">{company}</p>
        <p className="text-[10px] text-dim uppercase tracking-widest font-bold">{type}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-black text-xl text-white">{amount}</p>
      <p className="text-[10px] text-dim font-bold">{date}</p>
    </div>
  </div>
);

const GovernanceCore = () => (
  <div className="animate-slide-up space-y-8 pb-12">
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 text-white gap-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter">System Governance</h1>
        <p className="text-dim font-medium">Manage the platform’s core rules and system security parameters.</p>
      </div>
      <button className="w-full lg:w-auto px-8 py-3 bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Emergency Lockdown</button>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="space-y-6">
        <GovernanceToggle title="Maintenance Mode" desc="Restricts public access." active={false} />
        <GovernanceToggle title="Auto-Payout Liquidity" desc="Automates fund release." active={true} />
        <GovernanceToggle title="Neural Synthesis API" desc="Live dialectal streams." active={false} />
      </div>
      <AdminCard className="bg-gradient-to-br from-surface-dark to-slate-900 border-orange-500/10">
        <div className="space-y-8 mt-2">
          <IndicatorBar label="Cluster A Pressure" val={34} />
          <IndicatorBar label="Database IOPs" val={12} />
          <IndicatorBar label="WebSocket Streams" val={88} />
        </div>
      </AdminCard>
    </div>
  </div>
);

const GovernanceToggle = ({ title, desc, active }: any) => {
  const [isOn, setIsOn] = useState(active);
  return (
    <div className="p-6 glass-card flex items-center justify-between group hover:border-orange-500/30 transition-all border-[#1e293b]">
      <div className="max-w-[75%]">
        <h4 className="font-black text-sm tracking-tight text-white group-hover:text-orange-500 transition-colors uppercase mb-1">{title}</h4>
        <p className="text-xs text-dim leading-relaxed font-medium">{desc}</p>
      </div>
      <button
        onClick={() => setIsOn(!isOn)}
        className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isOn ? 'bg-orange-600' : 'bg-slate-800'}`}
      >
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${isOn ? 'left-8' : 'left-1'}`} />
      </button>
    </div>
  );
};

const IndicatorBar = ({ label, val }: any) => (
  <div>
    <div className="flex justify-between text-[10px] font-black text-dim mb-3 uppercase tracking-widest text-white">
      <span>{label}</span>
      <span className={val > 80 ? 'text-red-500' : 'text-orange-500'}>{val}%</span>
    </div>
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
      <div className={`h-full transition-all duration-1000 ${val > 80 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${val}%` }} />
    </div>
  </div>
);

const EmptyHub = ({ view }: any) => (
  <div className="animate-slide-up py-40 flex flex-col items-center justify-center">
    <div className="size-24 border-8 border-white/5 border-t-orange-600 rounded-full animate-spin-slow mb-10" />
    <h2 className="text-3xl font-black outfit capitalize mb-4 text-white">{view} in Calibration</h2>
    <p className="text-dim max-w-lg text-center font-medium leading-relaxed">
      Estimating session cycle sync...
    </p>
  </div>
);

// --- Main Layout Architecture ---

const SidebarLink = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
            ${active
        ? 'bg-orange-600 text-white font-bold shadow-xl shadow-orange-950/40'
        : 'text-dim hover:bg-white/5 hover:text-white'
      }`}
  >
    <Icon size={22} className={`transition-all ${active ? 'scale-110' : 'group-hover:text-orange-500 group-hover:scale-110'}`} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[13px] tracking-tight">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
  </button>
);

export default function App() {
  const [activeView, setActiveView] = useState<View>('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getActiveView = () => {
    switch (activeView) {
      case 'overview': return <AnalyticsDashboard />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'marketplace': return <MarketplaceManager />;
      case 'users': return <UserManagement />;
      case 'tasks': return <TaskGovernance />;
      case 'lexicon': return <Linguasense />;
      case 'payouts': return <PayoutVaults />;
      case 'billing': return <BusinessLedger />;
      case 'datasets': return <Datasets />;
      case 'settings': return <GovernanceCore />;
      default: return <EmptyHub view={activeView.replace(/_/g, ' ')} />;
    }
  };

  const navigateTo = (view: View) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-white">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-white/5 z-[60] flex items-center justify-between px-6 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center font-black text-[10px] outfit">X</div>
          <span className="font-black text-xs outfit tracking-tighter">XUM ADMIN</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 bg-white/5 rounded-xl text-white relative active:scale-95 transition-all">
            <Bell size={20} strokeWidth={2} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0f172a]" />
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-orange-600 rounded-xl text-white active:scale-95 transition-all shadow-lg shadow-orange-900/20"
          >
            {sidebarOpen ? <LogOut size={20} className="rotate-90" /> : <LayoutDashboard size={20} />}
          </button>
        </div>
      </div>

      {/* Background Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Structural Sidebar */}
      <aside className={`sidebar h-screen sticky top-0 ${sidebarOpen ? 'open' : ''}`}>
        <div className="flex items-center gap-4 px-4 mb-12">
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-2xl shadow-orange-900/40 border border-white/20">X</div>
          <div>
            <span className="block font-bold text-xl tracking-tighter leading-none">XUM ADM</span>
            <span className="block text-[8px] font-semibold text-orange-500 uppercase tracking-[0.2em] mt-2 opacity-80">Mission Control</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 flex flex-col px-1 overflow-y-auto no-scrollbar">

          <SidebarLink active={activeView === 'analytics'} onClick={() => navigateTo('analytics')} icon={BarChart3} label="Analytics" />

          <div className="mt-10 mb-5 px-6 text-[10px] font-semibold text-dim uppercase tracking-[0.2em] opacity-50">Intelligence</div>
          <SidebarLink active={activeView === 'users'} onClick={() => navigateTo('users')} icon={Users} label="User Directory" />
          <SidebarLink active={activeView === 'tasks'} onClick={() => navigateTo('tasks')} icon={ClipboardList} label="Task Management" />
          <SidebarLink active={activeView === 'lexicon'} onClick={() => navigateTo('lexicon')} icon={Languages} label="AI Orchestrator" />
          <SidebarLink active={activeView === 'datasets'} onClick={() => navigateTo('datasets')} icon={Archive} label="Data Inventory" />

          <div className="mt-10 mb-5 px-6 text-[10px] font-semibold text-dim uppercase tracking-[0.2em] opacity-50">Financials</div>
          <SidebarLink active={activeView === 'marketplace'} onClick={() => navigateTo('marketplace')} icon={ShieldAlert} label="Marketplace" />
          <SidebarLink active={activeView === 'payouts'} onClick={() => navigateTo('payouts')} icon={Wallet} label="Settlements" />
          <SidebarLink active={activeView === 'billing'} onClick={() => navigateTo('billing')} icon={CreditCard} label="Business Ledger" />

          <div className="mt-auto pt-8 border-t border-white/5 pb-8">
            <SidebarLink active={activeView === 'settings'} onClick={() => navigateTo('settings')} icon={Settings} label="System Settings" />
            <button className="w-full mt-5 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase bg-white/5 hover:bg-red-600/30 text-dim hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20">
              <LogOut size={14} /> Terminate Session
            </button>
          </div>
        </nav>
      </aside>

      {/* Primary Dashboard Logic */}
      <main className="main-layout flex-1 relative overflow-x-hidden">
        {getActiveView()}
      </main>
    </div>
  );
}
