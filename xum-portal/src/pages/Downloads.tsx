import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Copy, Download } from 'lucide-react';

import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';

const DIRECT_DOWNLOAD_URL = 'https://expo.dev/artifacts/eas/aa7eCVVVNLRh2jB1R7SZH2.aab';

const Downloads: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(DIRECT_DOWNLOAD_URL);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 overflow-hidden">
            <Navbar />

            <main className="relative h-auto py-24 md:min-h-[90vh] flex items-center justify-center overflow-hidden px-6">
                <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
                    <img
                        src="/assets/hero-bg-new.jpg"
                        className="w-full h-full object-cover scale-105 animate-[slow-zoom_20s_ease-in-out_infinite]"
                        alt="Cinematic Background"
                        style={{ filter: 'brightness(1.12) saturate(1.05)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 via-transparent to-[#020617]/80 opacity-45"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.22),transparent_55%)]"></div>
                    <div className="absolute inset-0 bg-[#020617]/25 mix-blend-multiply"></div>
                </div>

                <div className="container max-w-6xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="max-w-3xl"
                    >
                        <h1 className="text-4xl md:text-6xl font-semibold mb-6 text-white max-w-[18ch] sm:max-w-[22ch] tracking-tighter leading-[0.95]">
                            Download the latest version of <span className="text-blue-500">Xum AI</span>
                        </h1>

                        <p className="text-subheading-mobile md:text-subheading-desktop text-slate-300 max-w-2xl mb-10 leading-relaxed tracking-tight font-medium">
                            Grab the newest Android release archive directly from the website. This page is meant for internal review,
                            release handoff, and quick access to the latest build artifact.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <a
                                href={DIRECT_DOWNLOAD_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-base btn-primary btn-lg gap-3 w-full sm:w-auto"
                            >
                                Download build
                                <ArrowRight className="w-5 h-5" />
                            </a>
                            <button
                                onClick={handleCopyLink}
                                className="btn-base btn-secondary btn-lg gap-3 w-full sm:w-auto"
                            >
                                <Copy className="w-5 h-5" />
                                {copied ? 'Link copied' : 'Copy download link'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Downloads;
