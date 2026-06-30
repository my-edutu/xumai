import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Copy, Check, Languages } from 'lucide-react';


const LINGUALINK_DOWNLOAD_URL = '#'; // Update with actual download link

const LinguaLinkDownload: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LINGUALINK_DOWNLOAD_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-orange-100 bg-white/80 backdrop-blur-xl">
        <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="font-black text-2xl tracking-tighter uppercase text-slate-900">XUM</span>
            <span className="text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-md">AI</span>
          </a>
          <a href="/" className="text-sm font-semibold text-slate-500 hover:text-orange-500 transition-colors">
            ← Back to XUM AI
          </a>
        </nav>
      </div>

      <main className="relative min-h-screen flex items-center justify-center px-6 py-32">
        {/* Background accent */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-100/60 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-orange-50/80 rounded-full blur-[100px]" />
        </div>

        <div className="container max-w-3xl mx-auto relative z-10 text-center">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30 border border-orange-400/20">
              <Languages className="text-white" size={36} strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-slate-900"
          >
            Download{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              LinguaLink
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Translate the world's languages. Contribute your linguistic expertise and earn rewards for every verified dialect sample.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href={LINGUALINK_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl font-bold text-base text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all w-full sm:w-auto gap-3"
            >
              Download for Android
              <ArrowRight className="w-5 h-5" />
            </a>
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl font-bold text-base text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all w-full sm:w-auto gap-3"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy link
                </>
              )}
            </button>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 text-xs text-slate-400 font-medium"
          >
            Free · Available on Android · Requires Android 8.0+
          </motion.p>
        </div>
      </main>

      {/* Light footer */}
      <footer className="border-t border-orange-100 py-10 px-6 bg-orange-50/50">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
          <p>© 2026 XUM AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:text-orange-500 transition-colors">XUM AI Home</a>
            <a href="/about" className="hover:text-orange-500 transition-colors">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LinguaLinkDownload;
