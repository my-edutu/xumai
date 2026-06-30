import React, { useState, useEffect } from 'react';
import {
    User,
    Shield,
    Bell,
    Key,
    Users,
    Globe,
    Mail,
    Lock,
    Save,
    Plus,
    Trash2,
    Copy,
    Check,
    Info
} from 'lucide-react';
import { useUser, UserButton } from '../context/ClerkProvider';

export default function Settings() {
    const [activeSection, setActiveSection] = useState('profile');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState(() => localStorage.getItem('xum_company_name') || 'My Company');
    const { user } = useUser();

    const userEmail = user?.primaryEmailAddress?.emailAddress || 'admin@company.com';

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleUpdateProfile = () => {
        localStorage.setItem('xum_company_name', companyName);
        window.location.reload();
    };

    const renderProfile = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-6 p-6 glass-card border-white/5">
                <div className="relative group">
                    {user?.imageUrl ? (
                        <img src={user.imageUrl} className="w-24 h-24 rounded-2xl object-cover border border-white/10" alt="Profile" />
                    ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-orange-950/40 outfit text-white">
                            {companyName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute -bottom-2 -right-2">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white outfit tracking-tight">{companyName}</h3>
                    <p className="text-slate-400 text-sm mt-1">Company Account • Member since Jan 2025</p>
                    <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-green-500/20">Verified</span>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Admin</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                <div className="space-y-6">
                    <label className="block">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Company Name</span>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-orange-500/50 transition-all font-bold focus:bg-white/10"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </label>
                    <label className="block">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Email Address</span>
                        <div className="relative">
                            <input
                                type="email"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-slate-400 outline-none font-bold cursor-not-allowed"
                                value={userEmail}
                                disabled
                                readOnly
                            />
                            <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        </div>
                        <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
                            <Info size={12} />
                            Email is managed by your login provider. Click your profile picture to change it.
                        </p>
                    </label>
                </div>
                <div className="space-y-6">
                    <label className="block">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Industry</span>
                        <select className="w-full bg-[#1e293b] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-orange-500/50 transition-all font-bold appearance-none">
                            <option>Artificial Intelligence</option>
                            <option>Data Analytics</option>
                            <option>Autonomous Systems</option>
                            <option>Media & Entertainment</option>
                            <option>Healthcare</option>
                            <option>Finance</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Timezone</span>
                        <select className="w-full bg-[#1e293b] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-orange-500/50 transition-all font-bold appearance-none">
                            <option>Lagos, Nigeria (GMT+1)</option>
                            <option>Nairobi, Kenya (GMT+3)</option>
                            <option>San Francisco, USA (PST)</option>
                            <option>London, UK (GMT)</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="flex justify-end pt-8 mt-8 border-t border-white/5">
                <button
                    onClick={handleUpdateProfile}
                    className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black outfit flex items-center gap-2 hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/40 active:scale-95"
                >
                    <Save size={18} /> Save Changes
                </button>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="glass-card p-10 border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-white outfit tracking-tight">Security Settings</h3>
                        <p className="text-slate-500 text-xs mt-1">Protect your account with additional security</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
                        <Shield size={28} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                                <Lock size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-white">Two-Factor Authentication</p>
                                <p className="text-sm text-slate-500">Add an extra layer of security with SMS or authenticator app.</p>
                            </div>
                        </div>
                        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">Enable</button>
                    </div>

                    <button className="w-full flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-orange-500/30 transition-all group">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                                <Key size={24} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-lg text-white">Change Password</p>
                                <p className="text-sm text-slate-500">Update your account password.</p>
                            </div>
                        </div>
                        <Plus size={24} className="text-slate-500 group-hover:text-white transition-all group-hover:rotate-90" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderApiKeys = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-black text-white outfit tracking-tight">API Keys</h3>
                    <p className="text-slate-500 text-xs mt-1">Manage your API access keys for integrations</p>
                </div>
                <button className="px-6 py-3 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-900/40 hover:bg-orange-500 transition-all">
                    <Plus size={18} /> Create New Key
                </button>
            </div>

            <div className="space-y-4">
                {[
                    { id: '1', name: 'Production Key', key: 'xk_live_51P8...9w21', lastUsed: '2 mins ago', created: 'Jan 12, 2025' },
                    { id: '2', name: 'Test Key', key: 'xk_test_51P8...k8s0', lastUsed: '5 days ago', created: 'Jan 15, 2025' }
                ].map((key) => (
                    <div key={key.id} className="p-8 glass-card border-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-3xl -mr-16 -mt-16" />
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h4 className="font-bold text-xl text-white group-hover:text-orange-500 transition-colors outfit tracking-tight">{key.name}</h4>
                                <div className="flex items-center gap-3 mt-4">
                                    <code className="bg-black/60 px-5 py-3 rounded-2xl text-orange-400 font-mono text-sm border border-white/10 flex items-center gap-4 shadow-inner">
                                        {key.key}
                                        <button
                                            onClick={() => copyToClipboard(key.key, key.id)}
                                            className="text-slate-500 hover:text-white transition-colors"
                                        >
                                            {copiedKey === key.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                        </button>
                                    </code>
                                </div>
                            </div>
                            <button className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div className="flex gap-8 mt-6 pt-6 border-t border-white/5 text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] relative z-10">
                            <span>Last used: <span className="text-slate-300 ml-2">{key.lastUsed}</span></span>
                            <span>Created: <span className="text-slate-300 ml-2">{key.created}</span></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="glass-card p-10 border-white/5">
                <h3 className="text-2xl font-black text-white outfit tracking-tight mb-8">Notification Preferences</h3>
                <div className="space-y-4">
                    {[
                        { title: 'Project Updates', desc: 'Get notified when your projects reach milestones.', icon: Globe },
                        { title: 'Quality Alerts', desc: 'Receive alerts when data quality drops below threshold.', icon: Shield },
                        { title: 'Billing Notifications', desc: 'Weekly summaries of spending and balance.', icon: Mail },
                        { title: 'Platform News', desc: 'Updates about new features and improvements.', icon: Bell }
                    ].map((pref, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-white/[0.03] rounded-[2rem] group hover:bg-white/[0.06] transition-all border border-white/[0.02]">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <pref.icon size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-white">{pref.title}</p>
                                    <p className="text-sm text-slate-500 max-w-sm">{pref.desc}</p>
                                </div>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked={i < 3} />
                                <div className="w-14 h-8 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black outfit tracking-tighter text-white">Settings</h1>
                    <p className="text-slate-400 mt-2 font-medium text-sm">Manage your account and preferences</p>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-12">
                {/* Navigation */}
                <div className="lg:w-80 space-y-3">
                    {[
                        { id: 'profile', label: 'Profile', icon: User },
                        { id: 'security', label: 'Security', icon: Shield },
                        { id: 'api', label: 'API Keys', icon: Key },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'team', label: 'Team Members', icon: Users }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all relative ${activeSection === item.id
                                ? 'bg-orange-600 text-white shadow-2xl shadow-orange-950/40 translate-x-3 scale-[1.02]'
                                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={activeSection === item.id ? 'animate-pulse' : ''} />
                            {item.label}
                            {activeSection === item.id && <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 min-h-[700px] shadow-2xl backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none -mr-40 -mt-20" />
                    <div className="relative z-10">
                        {activeSection === 'profile' && renderProfile()}
                        {activeSection === 'security' && renderSecurity()}
                        {activeSection === 'api' && renderApiKeys()}
                        {activeSection === 'notifications' && renderNotifications()}
                        {activeSection === 'team' && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-32">
                                <div className="w-24 h-24 bg-orange-600/10 rounded-[2.5rem] flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-2xl shadow-orange-500/10">
                                    <Users size={48} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black outfit text-white tracking-tight">Team Members</h3>
                                    <p className="text-slate-500 mt-2 max-w-sm font-medium">Invite team members to collaborate on your projects. Coming soon!</p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coming Soon</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

