import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/downloads');
  };

  const handleBuyDatasets = () => {
    navigate('/business');
  };

  return (
    <section className="relative h-auto py-24 md:min-h-[90vh] flex items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
        <img
          src="/assets/hero-bg-new.jpg"
          className="w-full h-full object-cover scale-105 animate-[slow-zoom_20s_ease-in-out_infinite]"
          alt="Cinematic Background"
          style={{ filter: 'brightness(1.0)' }}
        />
        {/* Deep overlays for high-end cinematic blend */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] opacity-60"></div>
        <div className="absolute inset-0 bg-[#020617]/40 mix-blend-multiply"></div>
      </div>

      <div className="container max-w-6xl mx-auto text-center relative z-10 scale-[0.9] lg:scale-100">
        <div className="flex justify-center mb-10 opacity-0 animate-[fadeIn_1s_ease-out_0.3s_forwards]">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            <span className="text-[10px] font-bold text-blue-400 tracking-tight">Protocol Launching Soon</span>
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-hero-mobile md:text-hero-desktop font-bold mb-6 text-white max-w-[14ch] sm:max-w-[16ch] mx-auto tracking-tighter"
        >
          The global human intelligence network.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-subheading-mobile md:text-subheading-desktop text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed tracking-tight font-medium"
        >
          we deliver data creation, labeling, and RLHF at global scale — with cultural and linguistic coverage the world's models are missing.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <button
            onClick={onGetStarted || handleGetStarted}
            className="btn-base btn-primary btn-lg w-full sm:w-auto gap-3"
          >
            Download now
            <span className="material-symbols-outlined text-xl sm:text-2xl">bolt</span>
          </button>
          <button
            onClick={handleBuyDatasets}
            className="btn-base btn-secondary btn-lg w-full sm:w-auto text-body-base"
          >
            Buy datasets / API
          </button>
        </motion.div>
      </div>

      <style>{`
        @keyframes slow-zoom {
          0%, 100% { transform: scale(1.05) rotate(0deg); }
          50% { transform: scale(1.15) rotate(1deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
