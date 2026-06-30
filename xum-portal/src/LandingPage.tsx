import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import Marquee from './landing/Marquee';
import Features from './landing/Features';
import PlatformSections from './landing/PlatformSections';
import CallToAction from './landing/CallToAction';
import FAQ from './landing/FAQ';
import Testimonials from './landing/Testimonials';
import Footer from './landing/Footer';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp: any = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: "easeOut" }
};

const StatCounter = ({ value, label }: { value: string, label: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const target = parseInt(value.replace(/\D/g, ''));
    const suffix = value.replace(/[\d]/g, '');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const duration = 2000;
                const startTime = performance.now();

                const animate = (now: number) => {
                    const progress = Math.min((now - startTime) / duration, 1);
                    setDisplayValue(Math.floor(progress * target));
                    if (progress < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        }, { threshold: 0.1 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return (
        <div ref={ref} className="text-center group">
            <div className="text-2xl md:text-3xl font-semibold mb-1 heading-font text-white group-hover:text-blue-400 transition-colors">
                {displayValue}{suffix}
            </div>
            <div className="text-xs font-medium tracking-tight text-slate-500">
                {label}
            </div>
        </div>
    );
};

interface LandingPageProps {
    onAdminClick?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAdminClick }) => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/downloads');
    };

    const handleAdminClick = () => {
        if (onAdminClick) {
            onAdminClick();
        } else {
            navigate('/auth?intent=admin');
        }
    };

    return (
        <div className="min-h-screen bg-[#020617]/50 selection:bg-blue-600/30">
            <Navbar onGetStarted={handleGetStarted} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                <Hero onGetStarted={handleGetStarted} />
            </motion.div>

            <motion.div {...fadeUp}>
                <Marquee />
            </motion.div>

            {/* Network in Motion Stats */}
            <motion.div
                {...fadeUp}
                className="py-12 md:py-16 border-t border-white/5 relative overflow-hidden"
            >
                <div className="container max-w-6xl mx-auto px-6 relative z-10">
                    <h2 className="text-center text-sm font-semibold text-blue-500/80 mb-8 md:mb-12 tracking-tight">Live ecosystem activity.</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatCounter value="50K+" label="Active Creators" />
                        <StatCounter value="12M+" label="Data Points" />
                        <StatCounter value="99%" label="Accuracy Rate" />
                        <StatCounter value="2M+" label="Total Rewards" />
                    </div>
                </div>
            </motion.div>

            <motion.div id="features" {...fadeUp}>
                <Features />
            </motion.div>

            <motion.div id="ecosystem" {...fadeUp}>
                <PlatformSections />
            </motion.div>

            <motion.div {...fadeUp}>
                <Testimonials />
            </motion.div>

            <motion.div {...fadeUp}>
                <CallToAction />
            </motion.div>

            <motion.div {...fadeUp}>
                <FAQ />
            </motion.div>

            <Footer onAdminClick={handleAdminClick} />
        </div>
    );
};

export default LandingPage;
