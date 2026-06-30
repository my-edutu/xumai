import { useState, useEffect } from 'react';
import {
    Package,
    ShoppingCart,
    Download,
    Lock,
    CheckCircle2,
    Clock,
    FileText,
    Globe,
    Shield,
    AlertCircle,
    Search,
    Filter,
    ChevronRight,
    Sparkles
} from 'lucide-react';

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
    featured: boolean;
    requires_nda: boolean;
    sample_preview_url?: string;
    // Authorization info (if company is authorized)
    authorization?: {
        type: string;
        custom_price_usd?: number;
        discount_pct: number;
        valid_until: string;
    };
}

interface Purchase {
    id: string;
    transaction_ref: string;
    asset_name: string;
    purchase_price_usd: number;
    payment_status: string;
    delivery_status: string;
    access_token?: string;
    download_url?: string;
    purchased_at: string;
    expires_at: string;
    remaining_downloads?: number;
}

// Mock data - in production, fetch from Supabase
const mockAssets: DataAsset[] = [
    {
        id: '1', asset_name: 'Lagos Pidgin NLP Dataset', asset_slug: 'lagos-pidgin-nlp',
        description: 'High-quality conversational data with 42,000 verified samples from Lagos region. Perfect for building culturally-aware chatbots and NLP models.',
        data_type: 'text', target_languages: ['pcm', 'en'], sample_count: 42000,
        base_price_usd: 15000, license_type: 'non_exclusive', quality_tier: 'premium',
        featured: true, requires_nda: false,
        authorization: { type: 'purchase', custom_price_usd: 12000, discount_pct: 20, valid_until: '2025-02-01' }
    },
    {
        id: '2', asset_name: 'Swahili Voice Commands', asset_slug: 'swahili-voice-commands',
        description: 'Native Swahili voice recordings for voice assistant training. 18,500 audio clips with transcriptions.',
        data_type: 'voice', target_languages: ['sw'], sample_count: 18500,
        base_price_usd: 25000, license_type: 'exclusive', quality_tier: 'premium',
        featured: false, requires_nda: true,
        authorization: { type: 'view', discount_pct: 0, valid_until: '2025-01-15' }
    },
    {
        id: '3', asset_name: 'West African Street Signs', asset_slug: 'west-african-signs',
        description: 'Annotated street sign images from Ghana and Nigeria for autonomous vehicle training.',
        data_type: 'image', target_languages: ['en'], sample_count: 8400,
        base_price_usd: 8000, license_type: 'non_exclusive', quality_tier: 'standard',
        featured: false, requires_nda: false
        // No authorization - can view but needs to request access
    }
];

const mockPurchases: Purchase[] = [
    {
        id: '1', transaction_ref: 'XUM-TX-20241215-abc123',
        asset_name: 'Nairobi Tech Terms Dataset', purchase_price_usd: 5500,
        payment_status: 'paid', delivery_status: 'delivered',
        access_token: 'xum_dl_abc123xyz789',
        purchased_at: '2024-12-15', expires_at: '2025-12-15',
        remaining_downloads: 3
    }
];

// Components
const DataTypeBadge = ({ type }: { type: string }) => {
    const styles: Record<string, string> = {
        text: 'bg-blue-500/10 text-blue-500',
        voice: 'bg-purple-500/10 text-purple-500',
        image: 'bg-emerald-500/10 text-emerald-500',
        video: 'bg-orange-500/10 text-orange-500',
        mixed: 'bg-slate-500/10 text-slate-400'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles[type]}`}>
            {type}
        </span>
    );
};

const QualityBadge = ({ tier }: { tier: string }) => {
    if (tier === 'premium') {
        return (
            <span className="flex items-center gap-1 text-amber-500 text-[10px] font-bold uppercase">
                <Sparkles size={12} /> Premium
            </span>
        );
    }
    return <span className="text-dim text-[10px] font-bold uppercase">{tier}</span>;
};

// Main Component
export const DataMarketplace = () => {
    const [assets, setAssets] = useState<DataAsset[]>(mockAssets);
    const [purchases] = useState<Purchase[]>(mockPurchases);
    const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'browse' | 'purchases'>('browse');

    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.asset_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || a.data_type === filterType;
        return matchesSearch && matchesType;
    });

    const getEffectivePrice = (asset: DataAsset): number => {
        if (asset.authorization?.custom_price_usd) {
            return asset.authorization.custom_price_usd;
        }
        if (asset.authorization?.discount_pct) {
            return asset.base_price_usd * (1 - asset.authorization.discount_pct / 100);
        }
        return asset.base_price_usd;
    };

    const canPurchase = (asset: DataAsset): boolean => {
        return asset.authorization?.type === 'purchase' || asset.authorization?.type === 'exclusive';
    };

    const handleRequestAccess = async (assetId: string) => {
        // In production, this would send a request to the admin
        alert('Access request sent to XUM admin team. You will be notified when approved.');
    };

    const handlePurchase = async (asset: DataAsset) => {
        // In production, this would call supabase.rpc('company_purchase_asset', { p_asset_id: asset.id })
        alert(`Purchase initiated for ${asset.asset_name}. You will receive payment instructions.`);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                                <Package className="text-orange-500" size={28} />
                                Data Marketplace
                            </h1>
                            <p className="text-dim text-sm mt-1">Browse and purchase verified datasets for your AI models</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('browse')}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'browse' ? 'bg-orange-600 text-white' : 'text-dim hover:text-white'}`}
                            >
                                Browse Assets
                            </button>
                            <button
                                onClick={() => setActiveTab('purchases')}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'purchases' ? 'bg-orange-600 text-white' : 'text-dim hover:text-white'}`}
                            >
                                My Purchases
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'browse' ? (
                    <>
                        {/* Search & Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search datasets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-orange-500 transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'text', 'voice', 'image', 'video'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filterType === type ? 'bg-orange-600 text-white' : 'bg-white/5 text-dim hover:text-white'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Featured Banner */}
                        {filteredAssets.some(a => a.featured) && (
                            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-orange-600/20 to-purple-600/20 border border-orange-500/20">
                                <div className="flex items-center gap-2 text-orange-500 text-sm font-bold mb-2">
                                    <Sparkles size={16} /> Featured Dataset
                                </div>
                                {filteredAssets.filter(a => a.featured).map(asset => (
                                    <div key={asset.id} className="flex flex-col lg:flex-row justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold">{asset.asset_name}</h2>
                                            <p className="text-dim text-sm mt-1 max-w-2xl">{asset.description}</p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <DataTypeBadge type={asset.data_type} />
                                                <span className="text-dim text-sm">{asset.sample_count.toLocaleString()} samples</span>
                                                <span className="text-dim text-sm">{asset.target_languages.join(', ')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                {asset.authorization?.custom_price_usd && (
                                                    <p className="text-dim text-sm line-through">${asset.base_price_usd.toLocaleString()}</p>
                                                )}
                                                <p className="text-2xl font-bold text-emerald-500">${getEffectivePrice(asset).toLocaleString()}</p>
                                            </div>
                                            {canPurchase(asset) ? (
                                                <button
                                                    onClick={() => handlePurchase(asset)}
                                                    className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl shadow-orange-900/30"
                                                >
                                                    <ShoppingCart size={18} /> Purchase
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRequestAccess(asset.id)}
                                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm flex items-center gap-2"
                                                >
                                                    <Lock size={18} /> Request Access
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Asset Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAssets.filter(a => !a.featured).map(asset => (
                                <div key={asset.id} className="bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden group">
                                    {/* Preview Area */}
                                    <div className="h-32 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
                                        <FileText size={48} className="text-white/10 group-hover:text-white/20 transition-all" />
                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-white group-hover:text-orange-500 transition-all">{asset.asset_name}</h3>
                                            {asset.requires_nda && <Lock size={14} className="text-red-500 shrink-0" />}
                                        </div>
                                        <p className="text-dim text-xs line-clamp-2">{asset.description}</p>

                                        <div className="flex items-center gap-3 mt-4">
                                            <DataTypeBadge type={asset.data_type} />
                                            <QualityBadge tier={asset.quality_tier} />
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                            <div>
                                                <span className="text-dim text-[10px] uppercase">From</span>
                                                <p className="text-lg font-bold text-white">${getEffectivePrice(asset).toLocaleString()}</p>
                                            </div>

                                            {canPurchase(asset) ? (
                                                <button
                                                    onClick={() => handlePurchase(asset)}
                                                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl transition-all"
                                                >
                                                    <ShoppingCart size={18} />
                                                </button>
                                            ) : asset.authorization ? (
                                                <span className="text-[10px] text-dim font-bold uppercase">View Only</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleRequestAccess(asset.id)}
                                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-[10px] uppercase"
                                                >
                                                    Get Access
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* Purchases Tab */
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Your Purchased Datasets</h2>

                        {purchases.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-2xl">
                                <Package size={48} className="mx-auto text-dim mb-4" />
                                <p className="text-dim font-medium">No purchases yet</p>
                                <p className="text-dim text-sm mt-1">Browse the marketplace to find datasets for your AI models</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {purchases.map(p => (
                                    <div key={p.id} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                                            <div>
                                                <h3 className="font-bold text-lg">{p.asset_name}</h3>
                                                <p className="text-dim text-xs font-mono mt-1">{p.transaction_ref}</p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className={`flex items-center gap-1 text-xs font-bold ${p.payment_status === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                        {p.payment_status === 'paid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                                        {p.payment_status}
                                                    </span>
                                                    <span className={`flex items-center gap-1 text-xs font-bold ${p.delivery_status === 'delivered' ? 'text-blue-500' : 'text-orange-500'}`}>
                                                        {p.delivery_status === 'delivered' ? <Download size={14} /> : <Clock size={14} />}
                                                        {p.delivery_status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-white">${p.purchase_price_usd.toLocaleString()}</p>
                                                    {p.remaining_downloads && (
                                                        <p className="text-dim text-xs">{p.remaining_downloads} downloads left</p>
                                                    )}
                                                </div>

                                                {p.delivery_status === 'delivered' && (
                                                    <button className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2">
                                                        <Download size={18} /> Download
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Security Notice */}
            <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5">
                <div className="flex items-start gap-4 text-dim text-sm">
                    <Shield size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-white">Secure Transactions</p>
                        <p className="mt-1">All purchases are processed through secure payment channels. Dataset access is granted via time-limited, encrypted download tokens. Your data is protected by enterprise-grade security.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataMarketplace;
