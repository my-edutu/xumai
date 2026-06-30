
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';
import Marquee from '../landing/Marquee';
import {
    Shield,
    Zap,
    Globe,
    Database,
    ArrowRight,
    BarChart3,
    Lock,
    Users,
    CheckCircle2,
    MessageSquare,
    Star,
    Layers,
    Cpu,
    User,
    ChevronDown
} from 'lucide-react';

const BusinessLanding: React.FC = () => {
    const navigate = useNavigate();
    const [currentWordIndex, setCurrentWordIndex] = React.useState(0);
    const words = ["Global Coverage.", "Real Humans.", "Structured Data."];
    const teamImageUrl = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80';

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
            <Navbar onGetStarted={() => navigate('/downloads')} />

            {/* Hero Section - Left Aligned & Premium */}
            <section className="relative pt-64 pb-48 px-6 overflow-hidden min-h-[90vh] flex items-center">
                <div className="absolute inset-0 z-0 bg-[#020617]">
                    <img
                        src="/assets/hero-bg-new.jpg"
                        className="w-full h-full object-cover opacity-60 scale-105 animate-[slow-zoom_20s_ease-in-out_infinite]"
                        alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/70 to-transparent"></div>
                </div>

                <div className="container max-w-7xl mx-auto relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-md">
                            <span className="text-[10px] font-bold tracking-tight text-slate-300">Enterprise Protocol v2.0</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-semibold mb-10 leading-[0.95] outfit tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-1000 text-white min-h-[1.8em] md:min-h-[2.1em]">
                            Power your models with <br />
                            <span className="text-slate-400 inline-block animate-[fade-in-up_0.5s_ease-out]" key={currentWordIndex}>
                                {words[currentWordIndex]}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 font-medium tracking-tight">
                            XUM Business provides high-fidelity, culturally diverse, and ethnically balanced datasets. We turn real people into
                            your specialized AI trainers, delivering precise data creation and RLHF services at a global scale.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                            <button
                                onClick={() => navigate('/downloads')}
                                className="btn-base btn-primary btn-lg"
                            >
                                Download App
                            </button>
                            <button
                                onClick={() => navigate('/downloads')}
                                className="btn-base btn-secondary btn-lg"
                            >
                                View Downloads
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Dashboard Illustration - Removed as requested */}

            {/* Logos Section */}
            <div className="py-20">
                <div className="text-center mb-10">
                    <p className="text-[10px] font-bold tracking-tight text-slate-500">TRUSTED BY GLOBAL COMPANIES</p>
                </div>
                <Marquee />
            </div>

            {/* How it Works - Steps */}
            <section className="py-32 px-6 bg-white/[0.02]">
                <div className="container max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-semibold mb-6 outfit text-white">The Path to <span className="text-blue-500 text-gradient">Better Data.</span></h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Three simple phases to integrate XUM's human intelligence into your AI workflow.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connection lines (desktop) */}
                        <div className="hidden md:block absolute top-1/4 left-1/3 right-1/4 h-0.5 bg-gradient-to-r from-blue-500/20 to-transparent -z-10"></div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-900/40">
                                <MessageSquare className="text-white w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 outfit text-white tracking-tight">1. Define</h3>
                            <p className="text-slate-400 leading-relaxed">Specify your data requirements, linguistic targets, or RLHF goals with our specialized team.</p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-[#0f172a] border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                                <Database className="text-blue-500 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 outfit text-white tracking-tight">2. Curate</h3>
                            <p className="text-slate-400 leading-relaxed">Our global network of 50K+ verified trainers produces and labels data with extreme precision.</p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-[#0f172a] border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                                <Cpu className="text-cyan-500 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-4 outfit text-white tracking-tight">3. Integrate</h3>
                            <p className="text-slate-400 leading-relaxed">Seamlessly pull data via API or S3 export directly into your active training pipelines.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Image Section */}
            <section className="py-32 px-6">
                <div className="container max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="relative aspect-square">
                            <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-full"></div>
                            <img
                                src={teamImageUrl}
                                alt="XUM Business Team"
                                className="absolute inset-0 h-full w-full object-cover rounded-[40px] border border-white/10 shadow-2xl"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 rounded-[40px] bg-gradient-to-t from-[#020617]/35 via-transparent to-transparent pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-semibold mb-8 outfit leading-none text-white">
                            Human-first <br /><span className="text-blue-500 text-gradient">Accuracy.</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed mb-8">
                            We believe AI is only as good as the humans who teach it. Our platform ensures that every data point is verified by a chain of trust, preventing hallucination and bias at the source.
                        </p>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <span className="text-2xl font-bold text-white outfit block mb-1">99.9%</span>
                                <span className="text-[10px] font-bold tracking-tight text-slate-500">ACCURACY RATE</span>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-white outfit block mb-1">100+</span>
                                <span className="text-[10px] font-bold tracking-tight text-slate-500">LANGUAGES</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className="py-32 px-6 bg-white/[0.01]">
                <div className="container max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-semibold mb-6 outfit text-white">Global <span className="text-blue-500 text-gradient">Voices.</span></h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Hear from the lead researchers and data scientists using XUM to build more equitable AI.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ReviewCard
                            name="Sarah Chen"
                            role="Lead AI Researcher"
                            company="Verity Labs"
                            image="https://i.pravatar.cc/150?u=sarah"
                            text="XUM provided us with high-quality Swahili voice data in record time. Their cultural grounding is unmatched in the industry."
                        />
                        <ReviewCard
                            name="Marcus Thorne"
                            role="CTO"
                            company="NeuralBridge"
                            image="https://i.pravatar.cc/150?u=marcus"
                            text="The API integration is flawless. We've automated our RLHF loop directly with XUM's global workforce."
                        />
                        <ReviewCard
                            name="Elena Rodriguez"
                            role="Head of ML"
                            company="Nexus AI"
                            image="https://i.pravatar.cc/150?u=elena"
                            text="Accessing multi-modal datasets from Africa and South America has never been easier. Truly global reach."
                        />
                        <ReviewCard
                            name="David Okafor"
                            role="Data Strategy Head"
                            company="OpenWorld AI"
                            image="https://i.pravatar.cc/150?u=david"
                            text="Finally, a platform that values the humans in the loop. The data ethics and quality control are top-tier."
                        />
                        <ReviewCard
                            name="Aiko Tanaka"
                            role="Product Lead"
                            company="Symmetry Tech"
                            image="https://i.pravatar.cc/150?u=aiko"
                            text="The precision in their image tagging and localization services is remarkable. A game changer for our vision models."
                        />
                        <ReviewCard
                            name="James Wilson"
                            role="Ethicist"
                            company="Civic Intelligence"
                            image="https://i.pravatar.cc/150?u=james"
                            text="XUM's commitment to bias reduction and fair trainer compensation aligns perfectly with our core values."
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-32 px-6">
                <div className="container max-w-4xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 outfit text-white tracking-tighter">Everything you need to <span className="text-blue-500">know</span></h2>
                        <p className="text-slate-500 font-bold tracking-tight text-xs">Plain answers for enterprise partners</p>
                    </div>

                    <div className="space-y-4">
                        <FAQItem
                            question="What exactly is XUM AI?"
                            answer="XUM AI is a global network of real people (trainers) who help make AI smarter. For businesses, we provide the high-quality human feedback and data needed to train models to understand different languages and cultures correctly."
                        />
                        <FAQItem
                            question="How do you make sure the data is accurate?"
                            answer="We use a 'consensus' system. This means multiple people check the same piece of data. If they all agree, it's verified. We also use our own AI to double-check for any mistakes."
                        />
                        <FAQItem
                            question="What languages and countries do you support?"
                            answer="We have a huge presence in Africa, Southeast Asia, and Latin America. We focus on 'under-represented' languages—the ones that big tech companies often forget about."
                        />
                        <FAQItem
                            question="How do we get the data into our systems?"
                            answer="It's easy. You can use our secure API to pull data automatically, or we can send it directly to your cloud storage (like Amazon S3 or Google Cloud)."
                        />
                        <FAQItem
                            question="How are the workers paid?"
                            answer="We believe in fair pay. Our workers (trainers) are paid instantly in their local currency. This ensures we have a happy, motivated, and highly accurate workforce."
                        />
                    </div>
                </div>
            </section>

            <Footer onAdminClick={() => navigate('/admin')} />
        </div>
    );
};

const ReviewCard = ({ name, role, company, image, text }: any) => (
    <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:border-slate-500/50 transition-all group backdrop-blur-sm">
        <div className="flex gap-1 mb-6 text-blue-500">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
        </div>
        <p className="text-slate-300 mb-8 leading-relaxed font-medium">"{text}"</p>
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/10">
                {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <User size={20} />
                    </div>
                )}
            </div>
            <div>
                <h4 className="text-white font-bold leading-none mb-1 outfit tracking-tight">{name}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold tracking-tight text-slate-500">{role}</span>
                    <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                    <span className="text-[9px] font-bold tracking-tight text-blue-500/80">{company}</span>
                </div>
            </div>
        </div>
    </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className={`transition-all duration-300 border border-white/5 rounded-3xl mb-4 overflow-hidden ${isOpen ? 'bg-white/[0.03] border-blue-500/30' : 'bg-white/[0.01]'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 px-8 flex items-center justify-between text-left group"
            >
                <span className={`text-lg font-bold outfit tracking-tight transition-colors ${isOpen ? 'text-blue-500' : 'text-white'}`}>{question}</span>
                <div className={`p-2 rounded-xl transition-all ${isOpen ? 'bg-blue-500/20 text-blue-500 rotate-180' : 'bg-white/5 text-slate-500'}`}>
                    <ChevronDown size={20} />
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-60 opacity-100 px-8 pb-8' : 'max-h-0 opacity-0'}`}>
                <p className="text-slate-400 leading-relaxed font-medium text-base">{answer}</p>
            </div>
        </div>
    );
};

export default BusinessLanding;
