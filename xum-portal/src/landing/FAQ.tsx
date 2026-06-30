
import React, { useState } from 'react';

const faqData = [
  {
    question: "Do creators upload anything they want?",
    answer: "Most tasks are specific and guided. We support high-quality data generation to ensure relevance. All submissions are verified by both automated systems and other human reviewers to guarantee quality."
  },
  {
    question: "Where does the data verification happen?",
    answer: "Verification occurs within our specialized review interface. Only contributors with a proven track record (High Trust Score) are invited to check and validate other users' data submissions."
  },
  {
    question: "Can I buy exclusive datasets?",
    answer: "Yes. While we have a general catalog, enterprise partners can request private pipelines where the data generated is proprietary and accessible only to their organization."
  },
  {
    question: "How secure is the platform?",
    answer: "We use enterprise-grade security protocols. All data points are encrypted, and we employ strict privacy filters to ensure no sensitive personal information is leaked during the training process."
  }
];

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 md:py-5 flex items-center justify-between text-left group focus:outline-none"
      >
        <span className={`text-base md:text-lg font-bold transition-colors ${isOpen ? 'text-blue-500' : 'text-white group-hover:text-blue-400'} heading-font`}>
          {question}
        </span>
        <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-600'}`}>
          expand_more
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-3xl">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  return (
    <section className="py-20 bg-black/20 border-t border-white/5 relative z-20">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-bold tracking-tight mb-4 capitalize">
            Support
          </div>
          <h2 className="text-section-mobile md:text-section-desktop font-bold mb-2 tracking-tighter">Common questions.</h2>
          <p className="text-slate-500 text-small-base max-w-md">
            Everything you need to know about joining our network.
          </p>
        </div>
        <div className="max-w-4xl">
          {faqData.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
