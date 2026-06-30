
import React from 'react';
import { useNavigate } from 'react-router-dom';

const CallToAction: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-auto py-24 md:min-h-[72vh] flex items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
        <img
          src="/assets/hero-bg-new.jpg"
          className="w-full h-full object-cover scale-105 animate-[slow-zoom_20s_ease-in-out_infinite]"
          alt="Cinematic background"
          style={{ filter: 'brightness(1.08) saturate(1.05)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 via-transparent to-[#020617]/82 opacity-55"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(59,130,246,0.22),transparent_56%)]"></div>
        <div className="absolute inset-0 bg-[#020617]/18 mix-blend-multiply"></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10 text-center">
        <h2 className="text-section-mobile md:text-section-desktop font-semibold mb-6 text-white tracking-tighter">
          Ready to build the future?
        </h2>
        <p className="text-slate-300 text-body-base mb-10 max-w-xl mx-auto font-normal">
          Join the thousands of partners and creators already powering the next generation of artificial intelligence.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/downloads')}
            className="btn-base btn-primary btn-lg w-full sm:w-auto px-10"
          >
            Download now
          </button>
          <button
            onClick={() => navigate('/business')}
            className="btn-base btn-secondary btn-lg w-full sm:w-auto px-10"
          >
            XUM Business
          </button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
