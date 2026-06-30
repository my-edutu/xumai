import React from 'react';
import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';
import { Mail, MessageCircle, BookOpen, Clock, ArrowRight, ExternalLink } from 'lucide-react';

const supportOptions = [
  {
    icon: Mail,
    title: 'Email Us',
    description: 'Get a response within 24 hours. Our support team is ready to help with account issues, billing, and technical questions.',
    action: { label: 'support@xumai.app', href: 'mailto:support@xumai.app' },
    highlight: 'support@xumai.app'
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with our team in real-time during business hours. Fastest way to get help with urgent issues.',
    action: { label: 'Coming soon', href: '#' },
    highlight: 'Coming soon'
  },
  {
    icon: BookOpen,
    title: 'FAQ & Guides',
    description: 'Browse our frequently asked questions and guides to find answers instantly.',
    action: { label: 'Visit FAQ', href: '/faq' },
    highlight: 'Visit FAQ'
  },
  {
    icon: Clock,
    title: 'Response Times',
    description: 'Email: within 24 hours. Live chat: instant during business hours. Critical account issues are prioritized.',
    action: null,
    highlight: null
  }
];

const SupportPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <div className="container max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <MessageCircle size={14} /> Support
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold mb-4 outfit tracking-tight">
              We're here to <span className="text-blue-500">help.</span>
            </h1>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Have a question or need assistance? Reach out to us through any of the channels below.
            </p>
          </div>

          {/* Support Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {supportOptions.map((option, idx) => {
              const Icon = option.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-8 hover:border-blue-500/20 transition-all duration-500 group"
                >
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold outfit text-white mb-2">{option.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{option.description}</p>
                  {option.action && (
                    option.action.href.startsWith('http') || option.action.href.startsWith('mailto') ? (
                      <a
                        href={option.action.href}
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                      >
                        {option.highlight} <ExternalLink size={14} />
                      </a>
                    ) : (
                      <a
                        href={option.action.href}
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                      >
                        {option.highlight} <ArrowRight size={14} />
                      </a>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Direct Contact CTA */}
          <div className="bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none"></div>
            <h2 className="text-2xl font-semibold mb-4 outfit">Still need help?</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Our specialized team is available 24/7 to assist with any questions or concerns.
            </p>
            <a
              href="mailto:support@xumai.app"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all shadow-lg shadow-blue-500/20"
            >
              <Mail size={18} />
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupportPage;
