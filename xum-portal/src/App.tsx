import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import { ClerkProvider, useUser, useClerk } from './context/ClerkProvider';
import LandingPage from './LandingPage';
import AuthPage from './pages/AuthPage';
import AdminPanelApp from '../AdminPanel/src/App';
import { AdminProvider } from '../AdminPanel/src/contexts/AdminContext';
import AboutUs from './pages/AboutUs';
import BusinessLanding from './pages/BusinessLanding';
import ProjectDetail from './pages/ProjectDetail';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import WorkerAnalytics from './pages/WorkerAnalytics';
import Marketplace from './pages/Marketplace';
import SettingsPage from './pages/Settings';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';
import SupportPage from './pages/SupportPage';
import Downloads from './pages/Downloads';
import XumDownload from './pages/XumDownload';
import LinguaLinkDownload from './pages/LinguaLinkDownload';
import NewWorkspaceModal from './components/NewWorkspaceModal';
import ScrollToTop from './components/ScrollToTop';
import { supabase } from './supabaseClient';
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Wallet,
    ShoppingBag,
    Settings as SettingsIcon,
    LogOut,
    Plus,
    Menu,
    X,
    TrendingUp,
    ChevronRight,
    Sparkles,
    Shield,
    Database,
    PiggyBank,
    PlusCircle,
    Loader2
} from 'lucide-react';

// --- Protected Route Wrappers ---

const MASTER_ADMINS = ['info@xumai.app', 'infoafrichainx@gmail.com'];

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const location = useLocation();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (isLoaded && user) {
            checkAdmin();
        } else if (isLoaded && !user) {
            setIsAuthorized(false);
        }
    }, [isLoaded, user]);

    async function checkAdmin() {
        const email = user?.emailAddresses[0]?.emailAddress;
        if (!email) {
            setIsAuthorized(false);
            return;
        }

        // 1. Check Master Admin list
        if (MASTER_ADMINS.includes(email)) {
            setIsAuthorized(true);
            return;
        }

        // 2. Check Clerk Metadata (the Clerk-native way)
        if (user?.publicMetadata?.role === 'admin') {
            setIsAuthorized(true);
            return;
        }

        // 3. Check Supabase Database
        const { data } = await supabase.from('users').select('role').eq('email', email).eq('role', 'admin').maybeSingle();
        setIsAuthorized(!!data);
    }

    if (!isLoaded || (user && isAuthorized === null)) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    // Not logged in - redirect to auth with admin intent
    if (!user) return <Navigate to="/auth?intent=admin" replace />;

    // Logged in but not admin - redirect to home page
    if (isAuthorized === false) return <Navigate to="/" replace />;

    return <>{children}</>;
}




// --- Company Onboarding Component ---
function Onboarding({ onComplete }: { onComplete: (data: { companyName: string; industry: string; teamSize: string }) => void }) {
    const [step, setStep] = useState(1);
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const { user } = useUser();

    const handleContinue = () => {
        if (companyName && industry && teamSize) {
            setStep(2);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-[#020617] flex items-center justify-center p-6 overflow-auto">
            {/* Spotlights */}
            <div className="fixed top-20 left-1/4 w-[400px] h-[400px] bg-orange-500/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed bottom-10 right-1/4 w-[300px] h-[300px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-lg relative z-10">
                {step === 1 ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white">1</div>
                            <div className="flex-1 h-1 bg-white/10 rounded-full"><div className="w-1/2 h-full bg-orange-500 rounded-full" /></div>
                            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-bold text-slate-500">2</div>
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2 outfit">Let's get you started</h1>
                        <p className="text-slate-500 mb-8 text-sm">Tell us a bit about your company so we can personalize your experience.</p>

                        <div className="space-y-5">
                            <label className="block">
                                <span className="text-xs font-bold text-slate-400 mb-2 block">Company Name</span>
                                <input
                                    type="text"
                                    placeholder="e.g., Acme Technologies"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-orange-500/50 transition-all font-medium placeholder:text-slate-600 focus:bg-white/10"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs font-bold text-slate-400 mb-2 block">Industry</span>
                                <select
                                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-orange-500/50 transition-all font-medium appearance-none cursor-pointer"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                >
                                    <option value="">Select your industry...</option>
                                    <option value="ai">Artificial Intelligence / Machine Learning</option>
                                    <option value="tech">Technology / Software</option>
                                    <option value="finance">Finance / Fintech</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="media">Media / Entertainment</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="text-xs font-bold text-slate-400 mb-2 block">Team Size</span>
                                <select
                                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-orange-500/50 transition-all font-medium appearance-none cursor-pointer"
                                    value={teamSize}
                                    onChange={(e) => setTeamSize(e.target.value)}
                                >
                                    <option value="">How big is your team?</option>
                                    <option value="1-10">1-10 people</option>
                                    <option value="11-50">11-50 people</option>
                                    <option value="51-200">51-200 people</option>
                                    <option value="200+">200+ people</option>
                                </select>
                            </label>
                        </div>

                        <button
                            onClick={handleContinue}
                            disabled={!companyName || !industry || !teamSize}
                            className="w-full mt-8 py-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                        >
                            Continue <ChevronRight size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold text-white">✓</div>
                            <div className="flex-1 h-1 bg-orange-500 rounded-full" />
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white">2</div>
                        </div>

                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/30">
                            <Sparkles className="text-white" size={36} />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2 outfit">Welcome, {companyName}!</h1>
                        <p className="text-slate-400 mb-8">Your dashboard is ready. Start by creating your first task or exploring the platform.</p>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left">
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Quick Stats</p>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div><p className="text-2xl font-bold text-white">0</p><p className="text-[10px] text-slate-500 uppercase">Tasks</p></div>
                                <div><p className="text-2xl font-bold text-white">0</p><p className="text-[10px] text-slate-500 uppercase">Workers</p></div>
                                <div><p className="text-2xl font-bold text-white">$0</p><p className="text-[10px] text-slate-500 uppercase">Spent</p></div>
                            </div>
                        </div>

                        <button
                            onClick={() => onComplete({ companyName, industry, teamSize })}
                            className="w-full py-4 bg-white text-black hover:bg-slate-100 rounded-xl font-bold text-lg transition-all"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [activeTab, setActiveTab] = useState('analytics');
    const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    const [companyName, setCompanyName] = useState(() => localStorage.getItem('xum_company_name') || 'My Company');
    const [balance, setBalance] = useState(() => Number(localStorage.getItem('xum_balance')) || 0);
    const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('xum_onboarded'));

    // Close sidebar on mobile when navigating
    const handleNavigation = (tab: string) => {
        setActiveTab(tab);
        setSelectedProject(null);
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const handleOnboardingComplete = (data: { companyName: string; industry: string; teamSize: string }) => {
        setCompanyName(data.companyName);
        localStorage.setItem('xum_company_name', data.companyName);
        localStorage.setItem('xum_industry', data.industry);
        localStorage.setItem('xum_team_size', data.teamSize);
        localStorage.setItem('xum_balance', '0');
        localStorage.setItem('xum_onboarded', 'true');
        setShowOnboarding(false);
    };

    const handleLogout = async () => {
        await signOut();
        localStorage.clear();
        navigate('/');
    };

    const handleSubmitTask = () => {
        setActiveTab('projects');
        setIsSubmitModalOpen(true);
    };

    if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

    return (
        <div className="flex min-h-screen bg-[#020617] text-slate-100 font-inter">
            <NewWorkspaceModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} onComplete={(d) => console.log(d)} />

            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-[400] lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Header - Always visible above sidebar */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#020617]/95 backdrop-blur-xl border-b border-white/5 z-[600] flex items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <Link to="/" className="flex flex-col">
                        <span className="text-xl md:text-2xl font-black tracking-tighter outfit leading-none text-white">XUM <span className="text-orange-500">AI</span></span>
                        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500">Business</span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-sm font-bold text-slate-400 truncate max-w-[150px]">{companyName}</span>
                    <div
                        className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center font-bold outfit text-white cursor-pointer text-sm shadow-lg shadow-orange-500/20"
                        onClick={() => handleNavigation('settings')}
                    >
                        {user?.imageUrl ? <img src={user.imageUrl} className="w-full h-full rounded-xl object-cover" alt="" /> : companyName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Sidebar - Responsive */}
            <aside className={`fixed inset-y-0 left-0 z-[500] bg-[#020617] border-r border-white/5 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'} flex flex-col pt-20`}>
                <nav className="flex-1 p-3 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'analytics'} onClick={() => handleNavigation('analytics')} collapsed={!sidebarOpen} />
                    <SidebarItem icon={<Briefcase size={20} />} label="Tasks" active={activeTab === 'projects'} onClick={() => handleNavigation('projects')} collapsed={!sidebarOpen} />
                    <SidebarItem icon={<Users size={20} />} label="Participants" active={activeTab === 'workforce'} onClick={() => handleNavigation('workforce')} collapsed={!sidebarOpen} />
                    <SidebarItem icon={<Wallet size={20} />} label="Finance" active={activeTab === 'budget'} onClick={() => handleNavigation('budget')} collapsed={!sidebarOpen} />
                    {user?.primaryEmailAddress?.emailAddress && MASTER_ADMINS.includes(user.primaryEmailAddress.emailAddress) && (
                        <SidebarItem icon={<Shield size={20} />} label="Admin Console" onClick={() => window.open('http://localhost:3002/', '_blank')} collapsed={!sidebarOpen} className="mt-4 border-t border-white/5 pt-4 text-orange-500 hover:text-orange-400" />
                    )}
                </nav>
                <div className="p-3 border-t border-white/5 space-y-2">
                    <SidebarItem icon={<SettingsIcon size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => handleNavigation('settings')} collapsed={!sidebarOpen} />
                    <SidebarItem icon={<LogOut size={20} />} label="Logout" onClick={handleLogout} collapsed={!sidebarOpen} className="text-slate-500 hover:text-red-400" />
                </div>
            </aside>

            {/* Main Content - Adjusted for smaller collapsed sidebar */}
            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} p-4 md:p-8 pt-32 md:pt-40`}>
                {selectedProject ? (
                    <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />
                ) : activeTab === 'projects' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold outfit text-white">My Tasks</h1>
                                <p className="text-slate-500 mt-1 text-sm">Manage your data collection tasks</p>
                            </div>
                            <button onClick={() => setIsSubmitModalOpen(true)} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-400 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/20">
                                <Plus size={18} /> Submit Task
                            </button>
                        </header>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                            <Database size={48} className="mb-4 text-slate-600" />
                            <p className="font-bold text-lg text-slate-400">No tasks yet</p>
                            <p className="text-slate-600 text-sm mt-1">Create your first task to get started</p>
                        </div>
                    </div>
                ) : activeTab === 'budget' ? <Billing /> : activeTab === 'analytics' ? <Analytics onNavigate={handleNavigation} onSubmitTask={handleSubmitTask} /> : activeTab === 'workforce' ? <WorkerAnalytics onBack={() => handleNavigation('analytics')} /> : activeTab === 'market' ? <Marketplace /> : activeTab === 'settings' ? <SettingsPage /> : <Analytics />}
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active = false, onClick, className = "", collapsed = false }: any) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 transition-all duration-200 group rounded-xl ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'} ${collapsed ? 'justify-center p-3' : 'px-4 py-3'} ${className}`}>
            <div className={`transition-transform duration-200 ${active ? 'scale-105' : 'group-hover:scale-105'}`}>{icon}</div>
            {!collapsed && <span className="font-bold text-xs truncate">{label}</span>}
        </button>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <ClerkProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/waitlist" element={<Navigate to="/downloads" replace />} />
    <Route path="/business" element={<BusinessLanding />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/admin/dashboard" element={
                        <AdminProvider>
                            <AdminPanelApp />
                        </AdminProvider>
    } />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/downloads" element={<Downloads />} />
                    <Route path="/xum" element={<XumDownload />} />
                    <Route path="/lingualink" element={<LinguaLinkDownload />} />
    {/* Catch-all: redirect unknown routes to home */}
    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
            </ClerkProvider>
        </BrowserRouter>
    );
}
