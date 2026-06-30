import React, { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Plus,
    Download,
    ShieldCheck,
    History,
    AlertCircle,
    ExternalLink,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { billingService, WalletInfo, Transaction } from '../services/billingService';

export default function Billing() {
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [depositAmount, setDepositAmount] = useState('1000');
    const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paystack'>('stripe');
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [w, t] = await Promise.all([
                billingService.getWallet(),
                billingService.getTransactions()
            ]);
            setWallet(w);
            setTransactions(t);
        } catch (error) {
            console.error("Failed to load billing data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        setProcessing(true);
        try {
            await billingService.initiateDeposit(Number(depositAmount), selectedMethod);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                loadData();
            }, 3000);
        } catch (e) {
            alert('Deposit failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
                <p className="text-slate-400 font-medium outfit uppercase tracking-widest">Loading billing info...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black outfit text-white tracking-tighter">Billing & Payments</h1>
                    <p className="text-slate-400 mt-2 font-medium text-sm">Manage your account balance and transactions</p>
                </div>
            </header>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="glass-card p-10 border-orange-500/20 bg-orange-600/5 relative overflow-hidden group col-span-1 md:col-span-2 shadow-2xl shadow-orange-950/20">
                    <div className="absolute -right-8 -bottom-8 text-orange-500/10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <Wallet size={160} />
                    </div>
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="p-4 bg-orange-600 rounded-2xl text-white shadow-xl shadow-orange-900/40 border border-white/20">
                            <Wallet size={28} />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Available Funds</h3>
                    <p className="text-5xl md:text-6xl font-black outfit text-white tracking-tighter">${wallet?.available_balance.toLocaleString() || '0.00'}</p>
                </div>

                <div className="glass-card p-10 bg-[#0f172a]/40 border-white/5 relative overflow-hidden flex flex-col justify-end">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <History size={80} />
                    </div>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Spent</h3>
                    <p className="text-4xl font-black outfit text-white">${wallet?.total_spent.toLocaleString() || '0.00'}</p>
                    <div className="mt-6 flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={14} /> Account Active
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Deposit Section */}
                <div className="lg:col-span-1">
                    <div className="glass-card overflow-hidden border-blue-500/20 shadow-2xl shadow-blue-900/10">
                        <div className="p-8 border-b border-white/5 bg-white/5">
                            <h3 className="text-xl font-black outfit text-white flex items-center gap-3">
                                <Plus className="text-blue-500" /> Add Money
                            </h3>
                            <p className="text-slate-500 text-xs mt-1 font-bold">Add funds to your account balance</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Deposit Amount ($)</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</div>
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-white font-black text-xl outline-none focus:border-blue-500/50 transition-all focus:bg-white/10"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Payment Method</label>
                                <div
                                    onClick={() => setSelectedMethod('stripe')}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'stripe' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                                >
                                    <div className={`p-2 rounded-xl ${selectedMethod === 'stripe' ? 'bg-blue-600' : 'bg-slate-700'} text-white`}>
                                        <CreditCard size={20} />
                                    </div>
                                    <span className={`font-bold text-sm ${selectedMethod === 'stripe' ? 'text-white' : 'text-slate-400'}`}>Stripe / Credit Card</span>
                                </div>
                                <div
                                    onClick={() => setSelectedMethod('paystack')}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'paystack' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                                >
                                    <div className={`p-2 rounded-xl ${selectedMethod === 'paystack' ? 'bg-blue-600' : 'bg-slate-700'} text-white`}>
                                        <ArrowUpRight size={20} />
                                    </div>
                                    <span className={`font-bold text-sm ${selectedMethod === 'paystack' ? 'text-white' : 'text-slate-400'}`}>Wire Transfer</span>
                                </div>
                            </div>

                            <button
                                onClick={handleDeposit}
                                disabled={processing}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black outfit text-lg transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                            >
                                {processing ? (
                                    <Loader2 className="animate-spin mx-auto" />
                                ) : (
                                    `Add $${Number(depositAmount).toLocaleString()}`
                                )}
                            </button>

                            {showSuccess && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500 animate-in zoom-in-95 duration-300">
                                    <CheckCircle2 size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Funds Added Successfully</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="lg:col-span-2">
                    <div className="glass-card overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-xl font-black outfit text-white">Transaction History</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Your recent payments</p>
                            </div>
                            <button className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-5 py-3 rounded-xl text-slate-400 hover:text-white flex items-center gap-2 transition-all border border-white/5 hover:bg-white/10">
                                <Download size={14} /> Download
                            </button>
                        </div>
                        <div className="divide-y divide-white/5 bg-[#020617]/50 min-h-[400px]">
                            {transactions.length === 0 ? (
                                <div className="p-32 text-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-20">
                                        <History size={40} />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-600">No transactions yet</p>
                                </div>
                            ) : (
                                transactions.map(t => (
                                    <TransactionItem
                                        key={t.id}
                                        title={`${t.type.replace(/_/g, ' ').toUpperCase()}`}
                                        date={new Date(t.created_at).toLocaleDateString()}
                                        amount={`${t.amount >= 0 ? '+' : ''} $${Math.abs(t.amount).toLocaleString()}`}
                                        type={t.amount >= 0 ? 'in' : 'out'}
                                        status="Completed"
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TransactionItem({ title, date, amount, type, status }: any) {
    return (
        <div className="p-6 md:p-8 flex justify-between items-center hover:bg-white/[0.02] transition-all group">
            <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl border ${type === 'in' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800/50 text-slate-400 border-white/5'
                    }`}>
                    {type === 'in' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                    <h5 className="font-bold text-xl group-hover:text-orange-500 transition-colors text-white tracking-tight outfit">{title}</h5>
                    <div className="flex items-center gap-4 mt-1.5 font-bold uppercase tracking-[0.1em]">
                        <span className="text-[10px] text-slate-500">{date}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full ${status === 'Authorized' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                            {status}
                        </span>
                    </div>
                </div>
            </div>
            <span className={`text-2xl font-black outfit ${type === 'in' ? 'text-emerald-500' : 'text-slate-100'}`}>
                {amount}
            </span>
        </div>
    );
}
