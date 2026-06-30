
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  onGetStarted?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isBusinessPage = location.pathname === '/business';

  const handleAction = () => {
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    navigate('/downloads');
  };

  const handleHome = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl py-4' 
        : 'bg-transparent py-6'
    }`}>
      <nav className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex-shrink-0">
          <Link className="flex items-center" to="/">
            <span className="font-black text-2xl tracking-tighter uppercase text-white heading-font">XUM AI</span>
          </Link>
        </div>
        <div className="hidden lg:flex flex-grow justify-center items-center gap-10 text-sm font-medium text-slate-300 capitalize">
          <button onClick={handleHome} className="hover:text-white transition-colors">Home</button>
          <Link className="hover:text-white transition-colors" to="/about">About Us</Link>
          <Link className="hover:text-white transition-colors" to="/business">Enterprise</Link>
          <Link className="hover:text-white transition-colors" to="/downloads">Downloads</Link>
          <Link className="hover:text-white transition-colors" to="/faq">FAQ</Link>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={handleAction}
            className="btn-base btn-primary btn-md px-6 md:px-8"
          >
            {isBusinessPage ? 'Download App' : 'Download now'}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
