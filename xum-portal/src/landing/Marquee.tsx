
import React from 'react';

const logosLine1 = [
  { name: "OpenAI", slug: "openai" },
  { name: "Google Gemini", slug: "googlegemini" },
  { name: "Meta", slug: "meta" },
  { name: "NVIDIA", slug: "nvidia" },
  { name: "Anthropic", slug: "anthropic" }
];

const logosLine2 = [
  { name: "Mistral AI", slug: "mistralai" },
  { name: "Microsoft", slug: "windows" },
  { name: "Hugging Face", slug: "huggingface" },
  { name: "Tesla", slug: "tesla" }
];

const LogoItem: React.FC<{ logo: { name: string, slug: string } }> = ({ logo }) => (
  <div className="flex items-center gap-4 md:gap-6 px-10 md:px-14 group cursor-default">
    <div className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl shadow-sm group-hover:bg-slate-50 transition-all duration-300 p-2 md:p-3">
      <img
        src={`https://cdn.simpleicons.org/${logo.slug}`}
        alt={logo.name}
        className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500"
      />
    </div>
    <span className="text-sm md:text-base lg:text-xl font-bold tracking-tight text-slate-600 group-hover:text-slate-950 transition-all duration-300 heading-font">
      {logo.name}
    </span>
  </div>
);

const Marquee: React.FC = () => {
  return (
    <section className="py-8 md:py-12 relative overflow-hidden flex flex-col gap-6 md:gap-10 bg-white border-y border-slate-200">
      <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-white to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-white to-transparent z-10"></div>

      {/* Line 1 - Moving Left */}
      <div className="flex overflow-hidden whitespace-nowrap">
        <div className="marquee-track flex animate-scroll-left">
          <div className="flex items-center">
            {logosLine1.map((logo, i) => <LogoItem key={`l1a-${i}`} logo={logo} />)}
            {logosLine2.map((logo, i) => <LogoItem key={`l1b-${i}`} logo={logo} />)}
          </div>
          <div className="flex items-center">
            {logosLine1.map((logo, i) => <LogoItem key={`l1c-${i}`} logo={logo} />)}
            {logosLine2.map((logo, i) => <LogoItem key={`l1d-${i}`} logo={logo} />)}
          </div>
        </div>
      </div>

      {/* Line 2 - Moving Right */}
      <div className="flex overflow-hidden whitespace-nowrap">
        <div className="marquee-track flex animate-scroll-right">
          <div className="flex items-center">
            {logosLine2.map((logo, i) => <LogoItem key={`l2a-${i}`} logo={logo} />)}
            {logosLine1.map((logo, i) => <LogoItem key={`l2b-${i}`} logo={logo} />)}
          </div>
          <div className="flex items-center">
            {logosLine2.map((logo, i) => <LogoItem key={`l2c-${i}`} logo={logo} />)}
            {logosLine1.map((logo, i) => <LogoItem key={`l2d-${i}`} logo={logo} />)}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scrollLeft 60s linear infinite;
        }
        .animate-scroll-right {
          animation: scrollRight 60s linear infinite;
        }
        .marquee-track {
          display: flex;
          width: max-content;
        }
      `}</style>
    </section>
  );
};

export default Marquee;
