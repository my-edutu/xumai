import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Copy, Check, Smartphone } from 'lucide-react';
import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';

const XUM_DOWNLOAD_URL = 'https://expo.dev/artifacts/eas/aa7eCVVVNLRh2jB1R7SZH2.aab';

const XumDownload: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(XUM_DOWNLOAD_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 overflow-hidden">
      <Navbar />

      <main className="relative min-h-[90vh] flex items-center justify-center px-6 py-32">
        {/* Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
          <img
            src="/assets/hero-bg-new.jpg"
            className="w-full h-full object-cover scale-105 animate-[slow-zoom_20s_ease-in-out_infinite]"
            alt=""
            style={{ filter: 'brightness(0.6) saturate(1.1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617]/60 to-[#020617]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(59,130,246,0.18),transparent_65%)]" />
        </div>

        <div className="container max-w-3xl mx-auto relative z-10 text-center">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-400/20">
              <Smartphone className="text-white" size={36} strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-white"
          >
            Download{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              XUM AI
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto mb-12 leading-relaxed font-medium"
          >
            The global human intelligence network. Earn rewards by contributing data that powers AI models worldwide.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href={XUM_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-base btn-primary btn-lg gap-3 w-full sm:w-auto"
            >
              Download for Android
              <ArrowRight className="w-5 h-5" />
            </a>
            <button
              onClick={handleCopy}
              className="btn-base btn-secondary btn-lg gap-3 w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
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
            className="mt-10 text-xs text-slate-500 font-medium"
          >
            Free · Available on Android · Requires Android 8.0+
          </motion.p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default XumDownload;
