
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlatformSections: React.FC = () => {
  const navigate = useNavigate();
  return (
    <>
      <section className="py-20 bg-white/[0.01] border-y border-white/5">
        <div className="container max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-section-mobile md:text-section-desktop font-bold mb-3 tracking-tighter">Two ways to connect.</h2>
            <p className="text-slate-500 text-body-base max-w-xl mx-auto">One network, two specific tools for data buyers and data creators.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Enterprise Card */}
            <div className="p-10 bg-white/[0.02] border border-white/10 rounded-[2rem] flex flex-col group hover:border-blue-500/20 transition-all">
              <h3 className="text-2xl font-bold mb-2 text-white heading-font">For businesses</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs font-medium tracking-tight capitalize">buy high-quality training data</p>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-blue-500 text-base">check</span> Dataset Creation
                </li>
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-blue-500 text-base">check</span> Safety Testing (RLHF)
                </li>
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-blue-500 text-base">check</span> Enterprise API Access
                </li>
              </ul>

              <button
                onClick={() => navigate('/business')}
                className="btn-base btn-primary btn-lg w-full"
              >
                Start project
              </button>
            </div>

            {/* App Card */}
            <div className="p-10 bg-blue-600/5 border border-blue-600/20 rounded-[2rem] flex flex-col group">
              <h3 className="text-2xl font-bold mb-2 text-white heading-font">For contributors</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs font-medium tracking-tight capitalize">earn by teaching AI</p>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-blue-500 text-base">check</span> Weekly USD Payouts
                </li>
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-blue-500 text-base">check</span> Level-Up Rewards
                </li>
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-blue-500 text-base">check</span> Flexible Interface
                </li>
              </ul>

              <button
                onClick={() => navigate('/downloads')}
                className="btn-base btn-secondary btn-lg w-full"
              >
                Download app
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Earn Section */}
      <section className="py-20 bg-slate-50 text-slate-900">
        <div className="container max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-section-mobile md:text-section-desktop font-bold mb-4 tracking-tighter text-slate-900">Earn by teaching AI.</h2>
            <p className="text-slate-700 text-subheading-mobile md:text-subheading-desktop max-w-lg font-medium">
              Your perspective is valuable. Share it with AI labs and get paid for your insight.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-50 via-white to-blue-100/70 border border-blue-200 shadow-sm">
              <h3 className="text-subheading-mobile md:text-subheading-desktop font-bold mb-8 flex items-center gap-3 tracking-tight capitalize">
                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] shadow-sm">1</span>
                Flexible work
              </h3>
              <div className="space-y-6">
                {[
                  { title: "Work Anywhere", detail: "Tasks take minutes, perfect for spare time." },
                  { title: "Verification Bonus", detail: "Check other's work for extra rewards." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="material-symbols-outlined text-blue-600 text-xl">done_all</span>
                    <div>
                      <p className="font-bold text-body-base text-slate-900 mb-1">{item.title}</p>
                      <p className="text-slate-600 text-small-base leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-violet-50 via-white to-violet-100/70 border border-violet-200 shadow-sm">
              <h3 className="text-subheading-mobile md:text-subheading-desktop font-bold mb-8 flex items-center gap-3 tracking-tight capitalize">
                <span className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] shadow-sm">2</span>
                Safe payouts
              </h3>
              <div className="space-y-6">
                {[
                  { title: "Fast Deposits", detail: "Weekly payments directly to your account." },
                  { title: "Global Access", detail: "Open to anyone with an internet connection." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="material-symbols-outlined text-violet-600 text-xl">verified</span>
                    <div>
                      <p className="font-bold text-body-base text-slate-900 mb-1">{item.title}</p>
                      <p className="text-slate-600 text-small-base leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PlatformSections;
