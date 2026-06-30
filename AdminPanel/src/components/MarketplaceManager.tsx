import { useState, useEffect } from 'react';
import {
    Package,
    ShieldCheck,
    Building2,
    DollarSign,
    Eye,
    EyeOff,
    Plus,
    Search,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    FileText,
    Globe,
    Lock,
    Unlock,
    AlertTriangle,
    TrendingUp,
    Users,
    ChevronRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';

// Types
interface DataAsset {
    id: string;
    asset_name: string;
    asset_slug: string;
    description: string;
    data_type: string;
    target_languages: string[];
    sample_count: number;
    base_price_usd: number;
    license_type: string;
    quality_tier: string;
    visibility: string;
    featured: boolean;
    requires_nda: boolean;
    created_at: string;
    approved_at: string | null;
}

interface Authorization {
    id: string;
    company_id: string;
    company_name?: string;
    asset_id: string;
    asset_name?: string;
    authorization_type: string;
    custom_price_usd: number | null;
    discount_pct: number;
    valid_until: string;
    status: string;
}

interface Purchase {
    id: string;
    transaction_ref: string;
    company_id: string;
    company_name?: string;
    asset_name?: string;
    purchase_price_usd: number;
    payment_status: string;
    delivery_status: string;
    purchased_at: string;
}

// Mock data for development
const mockAssets: DataAsset[] = [
    {
        id: '1', asset_name: 'Lagos Pidgin NLP Dataset', asset_slug: 'lagos-pidgin-nlp',
        description: 'High-quality conversational data from Lagos region',
        data_type: 'text', target_languages: ['pcm', 'en'], sample_count: 42000,
        base_price_usd: 15000, license_type: 'non_exclusive', quality_tier: 'premium',
        visibility: 'published', featured: true, requires_nda: false,
        created_at: '2024-12-01', approved_at: '2024-12-05'
    },
    {
        id: '2', asset_name: 'Swahili Voice Commands', asset_slug: 'swahili-voice-commands',
        description: 'Voice assistant training data in Swahili',
        data_type: 'voice', target_languages: ['sw'], sample_count: 18500,
        base_price_usd: 25000, license_type: 'exclusive', quality_tier: 'premium',
        visibility: 'draft', featured: false, requires_nda: true,
        created_at: '2024-12-15', approved_at: null
    },
    {
        id: '3', asset_name: 'West African Street Signs', asset_slug: 'west-african-signs',
        description: 'Labeled street sign images from Ghana and Nigeria',
        data_type: 'image', target_languages: ['en'], sample_count: 8400,
        base_price_usd: 8000, license_type: 'non_exclusive', quality_tier: 'standard',
        visibility: 'published', featured: false, requires_nda: false,
        created_at: '2024-11-20', approved_at: '2024-11-25'
    }
];

const mockAuthorizations: Authorization[] = [
    {
        id: '1', company_id: 'c1', company_name: 'TechCorp AI', asset_id: '1', asset_name: 'Lagos Pidgin NLP',
        authorization_type: 'purchase', custom_price_usd: 12000, discount_pct: 20, valid_until: '2025-02-01', status: 'active'
    },
    {
        id: '2', company_id: 'c2', company_name: 'DataMind Inc', asset_id: '2', asset_name: 'Swahili Voice Commands',
        authorization_type: 'exclusive', custom_price_usd: null, discount_pct: 0, valid_until: '2025-01-15', status: 'active'
    },
];

const mockPurchases: Purchase[] = [
    {
        id: '1', transaction_ref: 'XUM-TX-20241220-a1b2c3', company_id: 'c1', company_name: 'TechCorp AI',
        asset_name: 'Lagos Pidgin NLP', purchase_price_usd: 12000, payment_status: 'paid', delivery_status: 'delivered', purchased_at: '2024-12-20'
    },
    {
        id: '2', transaction_ref: 'XUM-TX-20241228-d4e5f6', company_id: 'c2', company_name: 'DataMind Inc',
        asset_name: 'West African Street Signs', purchase_price_usd: 8000, payment_status: 'pending', delivery_status: 'pending', purchased_at: '2024-12-28'
    },
];

// Components
const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
    <div className="glass-card p-6">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>
                <Icon size={24} strokeWidth={1.5} />
            </div>
            {trend && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{trend}</span>}
        </div>
        <p className="text-[10px] text-dim font-bold uppercase tracking-widest">{label}</p>
        <h4 className="text-3xl font-bold mt-1 text-white">{value}</h4>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        published: 'bg-emerald-500/10 text-emerald-500',
        draft: 'bg-slate-500/10 text-slate-400',
        archived: 'bg-red-500/10 text-red-500',
        active: 'bg-emerald-500/10 text-emerald-500',
        revoked: 'bg-red-500/10 text-red-500',
        paid: 'bg-emerald-500/10 text-emerald-500',
        pending: 'bg-orange-500/10 text-orange-500',
        delivered: 'bg-blue-500/10 text-blue-500',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles[status] || 'bg-slate-500/10 text-slate-400'}`}>
            {status}
        </span>
    );
};

// Main Component
export const MarketplaceManager = () => {
    const [activeTab, setActiveTab] = useState<'assets' | 'authorizations' | 'purchases' | 'audit'>('assets');
    const [assets, setAssets] = useState<DataAsset[]>(mockAssets);
    const [authorizations] = useState<Authorization[]>(mockAuthorizations);
    const [purchases] = useState<Purchase[]>(mockPurchases);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);

    // Stats
    const totalAssets = assets.length;
    const publishedAssets = assets.filter(a => a.visibility === 'published').length;
    const totalRevenue = purchases.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + p.purchase_price_usd, 0);
    const pendingAuths = authorizations.filter(a => a.status === 'active').length;

    const handlePublish = async (assetId: string, newVisibility: string) => {
        // In production, call supabase.rpc('admin_set_asset_visibility', {...})
        setAssets(prev => prev.map(a =>
            a.id === assetId ? { ...a, visibility: newVisibility, approved_at: newVisibility === 'published' ? new Date().toISOString() : a.approved_at } : a
        ));
    };

    const filteredAssets = assets.filter(a =>
        a.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.data_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-slide-up pb-12">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-white/5 pb-8 gap-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter text-white flex items-center gap-3">
                        <ShieldCheck className="text-orange-500" size={36} />
                        Marketplace Control
                    </h1>
                    <p className="text-dim mt-2 font-medium">Secure management of data assets and company authorizations.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-orange-900/30 transition-all"
                >
                    <Plus size={18} /> New Asset
                </button>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Assets" value={totalAssets} icon={Package} color="blue" />
                <StatCard label="Published" value={publishedAssets} icon={Globe} color="emerald" />
                <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="orange" trend="+24%" />
                <StatCard label="Active Authorizations" value={pendingAuths} icon={Building2} color="purple" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
                {(['assets', 'authorizations', 'purchases', 'audit'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-orange-600 text-white shadow-lg' : 'text-dim hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Assets Tab */}
            {activeTab === 'assets' && (
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Data Assets Inventory</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" size={18} />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm font-medium text-white outline-none focus:border-orange-500 w-64"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredAssets.map(asset => (
                            <div key={asset.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${asset.data_type === 'text' ? 'bg-blue-500/10 text-blue-500' :
                                                asset.data_type === 'voice' ? 'bg-purple-500/10 text-purple-500' :
                                                    asset.data_type === 'image' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        'bg-orange-500/10 text-orange-500'
                                            }`}>
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-base font-bold text-white">{asset.asset_name}</h4>
                                                {asset.featured && <span className="text-[8px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">FEATURED</span>}
                                                {asset.requires_nda && <Lock size={12} className="text-red-500" />}
                                            </div>
                                            <p className="text-xs text-dim mt-1">{asset.description}</p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="text-[10px] text-dim font-bold uppercase">{asset.data_type}</span>
                                                <span className="text-[10px] text-dim">{asset.sample_count.toLocaleString()} samples</span>
                                                <span className="text-[10px] text-dim">{asset.target_languages.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-white">${asset.base_price_usd.toLocaleString()}</p>
                                            <p className="text-[10px] text-dim uppercase">{asset.license_type}</p>
                                        </div>
                                        <StatusBadge status={asset.visibility} />
                                        <div className="flex gap-2">
                                            {asset.visibility === 'draft' ? (
                                                <button
                                                    onClick={() => handlePublish(asset.id, 'published')}
                                                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all"
                                                    title="Publish"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePublish(asset.id, 'archived')}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                                    title="Archive"
                                                >
                                                    <EyeOff size={16} />
                                                </button>
                                            )}
                                            <button className="p-2 bg-white/5 hover:bg-white/10 text-dim hover:text-white rounded-lg transition-all">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Authorizations Tab */}
            {activeTab === 'authorizations' && (
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Company Authorizations</h3>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Plus size={14} /> Grant Access
                        </button>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] text-dim font-bold uppercase tracking-widest border-b border-white/5">
                                <th className="pb-4">Company</th>
                                <th className="pb-4">Asset</th>
                                <th className="pb-4">Type</th>
                                <th className="pb-4">Pricing</th>
                                <th className="pb-4">Valid Until</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {authorizations.map(auth => (
                                <tr key={auth.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">
                                                {auth.company_name?.charAt(0)}
                                            </div>
                                            <span className="font-bold text-white">{auth.company_name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm text-dim">{auth.asset_name}</td>
                                    <td className="py-4">
                                        <span className={`text-[10px] font-bold uppercase ${auth.authorization_type === 'exclusive' ? 'text-purple-500' : 'text-blue-500'}`}>
                                            {auth.authorization_type}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        {auth.custom_price_usd ? (
                                            <span className="text-emerald-500 font-bold">${auth.custom_price_usd.toLocaleString()}</span>
                                        ) : auth.discount_pct > 0 ? (
                                            <span className="text-orange-500 font-bold">{auth.discount_pct}% off</span>
                                        ) : (
                                            <span className="text-dim">Standard</span>
                                        )}
                                    </td>
                                    <td className="py-4 text-sm text-dim">{new Date(auth.valid_until).toLocaleDateString()}</td>
                                    <td className="py-4"><StatusBadge status={auth.status} /></td>
                                    <td className="py-4 text-right">
                                        <button className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all" title="Revoke">
                                            <XCircle size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Purchase Transactions</h3>
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] text-dim font-bold uppercase tracking-widest border-b border-white/5">
                                <th className="pb-4">Transaction</th>
                                <th className="pb-4">Company</th>
                                <th className="pb-4">Asset</th>
                                <th className="pb-4">Amount</th>
                                <th className="pb-4">Payment</th>
                                <th className="pb-4">Delivery</th>
                                <th className="pb-4">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map(p => (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                                    <td className="py-4 font-mono text-xs text-dim">{p.transaction_ref}</td>
                                    <td className="py-4 font-bold text-white">{p.company_name}</td>
                                    <td className="py-4 text-sm text-dim">{p.asset_name}</td>
                                    <td className="py-4 font-bold text-emerald-500">${p.purchase_price_usd.toLocaleString()}</td>
                                    <td className="py-4"><StatusBadge status={p.payment_status} /></td>
                                    <td className="py-4"><StatusBadge status={p.delivery_status} /></td>
                                    <td className="py-4 text-sm text-dim">{new Date(p.purchased_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertTriangle className="text-orange-500" size={24} />
                        <h3 className="text-lg font-bold text-white">Security Audit Log</h3>
                    </div>
                    <div className="space-y-3">
                        {[
                            { type: 'asset_published', message: 'Lagos Pidgin NLP Dataset was published', actor: 'admin@xum.ai', time: '2 hours ago', severity: 'info' },
                            { type: 'authorization_granted', message: 'TechCorp AI granted purchase access to Swahili Voice Commands', actor: 'admin@xum.ai', time: '5 hours ago', severity: 'info' },
                            { type: 'purchase_initiated', message: 'DataMind Inc initiated purchase of West African Street Signs', actor: 'datamind@company.com', time: '1 day ago', severity: 'info' },
                            { type: 'authorization_revoked', message: 'Access revoked for InactiveCompany on all assets', actor: 'admin@xum.ai', time: '3 days ago', severity: 'warning' },
                        ].map((log, i) => (
                            <div key={i} className={`p-4 rounded-xl border ${log.severity === 'warning' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/5'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-white">{log.message}</p>
                                        <p className="text-[10px] text-dim mt-1">By {log.actor}</p>
                                    </div>
                                    <span className="text-[10px] text-dim">{log.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketplaceManager;
