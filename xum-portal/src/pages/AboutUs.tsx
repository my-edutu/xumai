import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Users, Zap, CheckCircle, Download } from 'lucide-react';

import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';

const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 overflow-hidden">
      <Navbar />

      <main>
        {/* Header */}
        <section className="px-6 pt-36 pb-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              About Us header
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold mb-4 outfit tracking-tight text-white">
              We help make AI <span className="text-blue-500">smarter.</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
              XUM AI is a simple app that lets real people train AI. 
              You help teach AI to understand languages, voices, and pictures.
              In return, you get paid for your work.
            </p>
          </div>
        </section>

        {/* What We Do */}
        <section className="px-6 py-20 border-t border-white/5">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-semibold outfit text-white mb-4">
                What we do
              </h2>
              <p className="text-slate-400 text-base max-w-2xl mx-auto">
                We connect people who need AI help with people who can give it.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-center hover:border-blue-500/20 transition-all">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">For workers</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Do small tasks on your phone. Record your voice, take pictures, or answer questions. Get paid for every task you finish. No special skills needed.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-center hover:border-blue-500/20 transition-all">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Globe className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">For businesses</h3>
                <p className="text-slate-400 leading-relaxed">
                  Need data to train your AI? We get you real human feedback from real people. We cover over 100 languages. Fast, cheap, and high quality.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-center hover:border-blue-500/20 transition-all">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">For everyone</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We believe AI should work for all people, not just some. That is why we train AI to understand different languages and cultures from around the world.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="px-6 py-20 bg-blue-600/5 border-t border-white/5">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-semibold outfit text-white mb-4">
                Why people choose XUM AI
              </h2>
              <p className="text-slate-400 text-base max-w-2xl mx-auto">
                We keep things simple and fair.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="flex items-start gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white">Easy to use</h3>
                  <p className="text-slate-400 text-sm">Just open the app and start. No training needed.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white">Fair pay</h3>
                  <p className="text-slate-400 text-sm">You get paid for every task. No tricks, no hidden fees.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white">100+ languages</h3>
                  <p className="text-slate-400 text-sm">We cover languages from Africa, Asia, and beyond.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white">Safe and private</h3>
                  <p className="text-slate-400 text-sm">Your data is locked up tight. We never share your info.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-20 border-t border-white/5">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-semibold outfit text-white mb-4">
                How it works
              </h2>
              <p className="text-slate-400 text-base max-w-2xl mx-auto">
                Three simple steps to start earning.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-400">1</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Download the app</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Get the XUM AI app on your phone. It is free and takes one minute.</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-400">2</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Pick a task</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Choose from voice, picture, or text tasks. Do them on your own time.</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-400">3</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Get paid</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Complete tasks and earn rewards. The more you do, the more you make.</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => navigate('/downloads')}
                className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all shadow-lg shadow-blue-500/20"
              >
                <Download size={18} />
                Download Now
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="px-6 py-20 bg-blue-600/5 border-t border-white/5">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-semibold outfit text-white mb-4">
                Our mission
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              We want to build the biggest network of real people teaching AI. 
              We believe AI should understand everyone - no matter where you are from or what language you speak. 
              When you use XUM AI, you are not just earning money. 
              You are helping build technology that works for the whole world.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
