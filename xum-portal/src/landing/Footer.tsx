
import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  onAdminClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("This feature is coming soon!");
  };

  return (
    <footer className="border-t border-white/5 py-16 px-6 bg-[#020617] relative overflow-hidden">
      {/* Background glow for consistency */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-600/5 blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-12 mb-16">
          <div className="max-w-xs">
            <Link className="flex items-center gap-2 mb-4" to="/">
              <span className="font-semibold text-2xl tracking-tighter text-white heading-font">XUM AI</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed opacity-60">
              Building the world's largest ethical human intelligence network.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-20">
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-medium text-white/50 mb-1">Ecosystem</h4>
              <Link className="text-sm lg:text-base text-slate-400 hover:text-white transition-colors" to="/downloads">Downloads</Link>
              <Link className="text-sm lg:text-base text-slate-400 hover:text-white transition-colors" to="/business">Business</Link>
              <a className="text-sm lg:text-base text-slate-400 hover:text-white transition-colors" href="#" onClick={handleComingSoon}>API Docs</a>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-medium text-white/50 mb-1">Support</h4>
              <Link className="text-sm lg:text-base text-slate-400 hover:text-white transition-colors" to="/privacy">Privacy</Link>
              <Link className="text-sm lg:text-base text-slate-400 hover:text-white transition-colors" to="/support">Support</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-medium text-white/50 mb-1">Company</h4>
              <Link className="text-sm lg:text-base text-slate-400 hover:text-white transition-colors" to="/about">About Us</Link>
              <Link to="/auth?intent=admin" className="text-sm lg:text-base text-slate-400 hover:text-white transition-colors">Admin Console</Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-6">
            <p>Copyright 2026 XUM AI.</p>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" onClick={handleComingSoon} className="hover:text-white transition-colors">Twitter</a>
            <a href="#" onClick={handleComingSoon} className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
