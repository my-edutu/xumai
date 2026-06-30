/**
 * XUM AI - LinguaLink Landing Page
 * AI-Powered Language Learning Platform
 */

import React, { useEffect, useState } from 'react';

// Set via VITE_LINGUALINK_APK_URL env var, or defaults to local path (place .apk in public/)
const APK_URL = import.meta.env.VITE_LINGUALINK_APK_URL || '{APK_URL}';

// Free stock images (Unsplash)
const HERO_IMG = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&q=80';
const FEATURE_1_IMG = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80';
const FEATURE_2_IMG = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80';
const FEATURE_3_IMG = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80';
const FEATURE_4_IMG = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80';
const CTA_IMG = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80';

export function LinguaLinkLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">

      {/* ===== NAVBAR ===== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold tracking-tight">LinguaLink</span>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-gray-600">
            <button onClick={() => scrollTo('features')} className="hover:text-cyan-600 transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-cyan-600 transition-colors">How It Works</button>
            <button onClick={() => scrollTo('cta')} className="hover:text-cyan-600 transition-colors">Download</button>
          </div>
          <a
            href={APK_URL}
            download="LinguaLink.apk"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Download APK
          </a>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              Empowering AI with the world's languages and cultures.
            </h1>
            <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-2xl leading-relaxed">
              XUM AI powers LLMs and vision models with verified human data. LinguaLink lets you preserve and share your mother tongue. Download both and start shaping the future.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/"
                className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Download XUM AI
              </a>
              <a
                href="/lingualink"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-2xl hover:shadow-cyan-500/30 hover:scale-105 transition-all duration-200 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Download LinguaLink
              </a>
            </div>
            <div className="flex items-center gap-6 mt-12 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy First
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Offline Mode
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-cyan-600 font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">Everything You Need to Learn</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From beginner to fluent — LinguaLink adapts to your skill level and learning style.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {[
              {
                img: FEATURE_1_IMG,
                title: 'Personalized Lessons',
                desc: 'AI adapts each lesson to your skill level, learning speed, and goals — just like a personal tutor.',
              },
              {
                img: FEATURE_2_IMG,
                title: 'Real-Time Pronunciation',
                desc: 'Speak and get instant feedback. Our voice AI analyzes your accent and guides you to native fluency.',
              },
              {
                img: FEATURE_3_IMG,
                title: 'Immersive Conversations',
                desc: 'Practice with AI conversation partners that simulate real-world dialogues and scenarios.',
              },
              {
                img: FEATURE_4_IMG,
                title: 'Offline Learning',
                desc: 'Download lessons and practice anywhere — no internet connection required. Perfect for travel.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={f.img}
                    alt={f.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-cyan-600 font-semibold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">Start Learning in 3 Simple Steps</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Getting started with LinguaLink is as easy as 1-2-3.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: '01',
                title: 'Download the App',
                desc: 'Install LinguaLink on your Android device with one tap. No sign-up required to get started.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                ),
              },
              {
                step: '02',
                title: 'Set Your Goal',
                desc: 'Tell us which language you want to learn and your current level. Our AI builds your custom curriculum.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                ),
              },
              {
                step: '03',
                title: 'Practice Daily',
                desc: 'Complete bite-sized lessons, track your progress, and watch your fluency grow day by day.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    {s.icon}
                  </svg>
                </div>
                <div className="text-cyan-500 font-bold text-sm mb-2">{s.step}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-gradient-to-r from-cyan-600 to-teal-600 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '25+', label: 'Languages' },
              { value: '100K+', label: 'Active Users' },
              { value: '4.8★', label: 'App Rating' },
              { value: '10M+', label: 'Lessons Completed' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-extrabold">{s.value}</div>
                <div className="text-cyan-100 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section id="cta" className="relative py-20 sm:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${CTA_IMG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/75 to-gray-900/60" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to Start Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-300">
              Language Journey?
            </span>
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
            Join thousands of learners worldwide. Download LinguaLink for free and start speaking a new language today.
          </p>
          <a
            href={APK_URL}
            download="LinguaLink.apk"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-10 py-4 rounded-xl text-xl font-bold shadow-2xl hover:shadow-cyan-500/30 hover:scale-105 transition-all duration-200 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0-4-4m4 4 4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Download LinguaLink APK
          </a>
          <p className="text-gray-400 text-sm mt-4">Free · No registration required · ~25MB</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="text-white font-bold">LinguaLink</span>
              <span className="text-gray-600 text-sm ml-2">by XUM AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href={APK_URL} download="LinguaLink.apk" className="hover:text-white transition-colors">Download</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} XUM AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
