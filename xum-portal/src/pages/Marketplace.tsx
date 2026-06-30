import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ShoppingBag,
    Star,
    Download,
    Globe,
    Zap,
    Info
} from 'lucide-react';
import { companyDatasetService } from '../utils/datasetService';

export default function Marketplace() {
    const [activeType, setActiveType] = useState('All');
    const [datasets, setDatasets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        setIsLoading(true);
        try {
            const data = await companyDatasetService.getMarketplaceDatasets();
            setDatasets(data.length > 0 ? data : defaultDatasets);
        } catch (e) {
            console.error(e);
            setDatasets(defaultDatasets);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = async (ds: any) => {
        try {
            await companyDatasetService.purchaseDataset(ds.id, parseFloat(ds.price.replace('$', '').replace(',', '')));
            alert(`Successfully purchased ${ds.title}!`);
            loadDatasets();
        } catch (e) {
            alert("Purchase failed. Please check your balance.");
        }
    };

    const defaultDatasets = [
        {
            id: 'DS-001',
            title: 'East African Dialect Bundle',
            description: '10,000+ hours of semi-supervised Swahili & Luganda recordings with transcripts.',
            price: '$4,500',
            type: 'Audio',
            rating: 4.8,
            reviews: 124,
            size: '1.2 GB',
            tag: 'Premium'
        },
        {
            id: 'DS-002',
            title: 'West African Street Scenes',
            description: 'High-res annotated images of urban environments in Lagos and Accra for autonomous driving.',
            price: '$8,200',
            type: 'Image',
            rating: 4.9,
            reviews: 56,
            size: '14 GB',
            tag: 'Verified'
        },
        {
            id: 'DS-003',
            title: 'African Sentiment Lexicon',
            description: 'Multi-lingual sentiment labels for social media text in 15 African languages.',
            price: '$1,200',
            type: 'Text',
            rating: 4.5,
            reviews: 89,
            size: '450 MB',
            tag: 'Trending'
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold outfit">Dataset Marketplace</h1>
                    <p className="text-slate-400 mt-1">Acquire high-quality, pre-labeled African datasets for your models.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search datasets..."
                            className="bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 w-72 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                        />
                    </div>
                    <button className="p-3 bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                        <Filter size={20} />
                    </button>
                </div>
            </header>

            {/* Featured Header */}
            <div className="glass-card mb-10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent pointer-events-none" />
                <div className="relative p-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-orange-500 mb-4">
                            <Zap size={18} />
                            <span className="font-bold text-sm uppercase tracking-widest outfit">Featured Dataset</span>
                        </div>
                        <h2 className="text-4xl font-bold outfit mb-4 leading-tight">Universal African <br />NLP Foundation Pack</h2>
                        <p className="text-slate-300 text-lg mb-8 max-w-xl">
                            The most comprehensive collection of African linguistic data ever assembled.
                            Covers 50+ languages with morphological precision.
                        </p>
                        <div className="flex items-center gap-6">
                            <button className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-orange-900/40">
                                View Details
                            </button>
                            <div className="flex items-center gap-2 font-bold text-2xl">
                                $15,000 <span className="text-slate-500 text-sm font-medium line-through">$22,000</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-[40%] aspect-video bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                        <Globe size={120} className="text-orange-500/20 animate-spin-slow" />
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-orange-500 outfit text-xl">
                            DATA PREVIEW
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar">
                {['All', 'Image', 'Audio', 'Text', 'Video', 'Multimodal'].map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all border-2 ${activeType === type
                            ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-900/20'
                            : 'bg-white/5 border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Dataset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {datasets.map(ds => (
                    <DatasetCard key={ds.id} {...ds} />
                ))}
            </div>
        </div>
    );
}

function DatasetCard({ title, description, price, type, rating, reviews, size, tag }: any) {
    return (
        <div className="glass-card flex flex-col hover:border-orange-500/50 transition-all group">
            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-orange-500 px-2 py-1 bg-orange-500/10 rounded uppercase tracking-wider">{tag}</span>
                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                        <Star size={12} fill="currentColor" /> {rating} ({reviews})
                    </div>
                </div>
                <h3 className="text-xl font-bold outfit mb-2 group-hover:text-orange-500 transition-colors">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-2">{description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Download size={14} /> {size}</span>
                    <span className="flex items-center gap-1"><Info size={14} /> {type} Data</span>
                </div>
            </div>
            <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
                <div className="font-bold text-xl outfit">{price}</div>
                <button className="p-2.5 bg-white text-slate-900 rounded-xl hover:bg-orange-500 hover:text-white transition-all">
                    <ShoppingBag size={20} />
                </button>
            </div>
        </div>
    );
}
