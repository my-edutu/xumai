
import React from 'react';
import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';
import { ChevronDown, Mail } from 'lucide-react';

const faqs = [
    {
        question: "What exactly is XUM AI?",
        answer: "XUM AI is a global network of real people (trainers) who help make AI smarter. For businesses, we provide high-quality human feedback and datasets needed to train models to understand different languages and cultures accurately."
    },
    {
        question: "How do you ensure data accuracy?",
        answer: "We use a multi-stage consensus protocol. Every data point is verified by multiple independent humans. Only when they reach a predetermined agreement threshold is the data approved. We also employ automated quality checks to filter out noise."
    },
    {
        question: "Which languages and regions do you cover?",
        answer: "We specialize in under-represented markets, including Africa, Southeast Asia, and Latin America. We cover over 100+ languages and dialects that are often neglected by traditional data providers."
    },
    {
        question: "How do I integrate XUM data into my workflow?",
        answer: "XUM provides a robust Enterprise API and supports direct S3 exports. Whether you need a one-time dataset or a continuous RLHF feedback loop, our infrastructure is built to scale with your production pipelines."
    },
    {
        question: "Is XUM AI based on ethical data sourcing?",
        answer: "Yes. Ethics is at our core. We ensure fair, living-wage compensation for all our global trainers and maintain full transparency in our data collection practices. We believe ethical AI starts with ethical data."
    },
    {
        question: "Can I request a custom dataset?",
        answer: "Absolutely. Most of our enterprise partners use XUM for specialized tasks. You can define your own parameters, narrow down linguistic targets, and specify the exact formatting your model requires."
    },
    {
        question: "How long does it take to complete a project?",
        answer: "Speed is one of our key advantages. Thanks to our 50K+ active workforce, we can often deliver thousands of high-fidelity data points within hours or days, where traditional methods take weeks."
    },
    {
        question: "What is RLHF and why do I need it?",
        answer: "Reinforcement Learning from Human Feedback (RLHF) is what makes models like GPT feel 'human'. It involves humans ranking and correcting AI responses to align them with human values, safety, and helpfulness."
    },
    {
        question: "Do you support image and audio data?",
        answer: "Yes, we are multi-modal. We handle text classification, image tagging, audio transcription, and video sentiment analysis across a wide variety of cultural contexts."
    },
    {
        question: "How is user privacy handled?",
        answer: "We employ strict PII (Personally Identifiable Information) filtering and enterprise-grade encryption. Data is anonymized before it reaches our workforce, ensuring researcher and subject privacy."
    },
    {
        question: "How do I pay for XUM services?",
        answer: "XUM Business offers flexible pricing based on the complexity and volume of the project. We support standard corporate invoicing as well as pay-as-you-go models via our treasury system."
    },
    {
        question: "Who are the AI Trainers?",
        answer: "Our trainers are verified individuals from across the globe. They range from university students and linguists to specialized domain experts, all vetted via our trust-score system."
    }
];

const FAQPage: React.FC = () => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-24 px-6">
                <div className="container max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-black mb-6 outfit tracking-tighter">Everything you need to <span className="text-blue-500">know.</span></h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Got questions about the XUM network? We've got the answers. If you don't find what you're looking for, our team is always ready to help.
                        </p>
                    </div>

                    <div className="space-y-4 mb-20">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`transition-all duration-300 border border-white/5 rounded-3xl overflow-hidden ${openIndex === index ? 'bg-white/[0.03] border-blue-500/30' : 'bg-white/[0.01]'}`}
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full py-6 px-8 flex items-center justify-between text-left group"
                                >
                                    <span className={`text-lg font-bold outfit tracking-tight transition-colors ${openIndex === index ? 'text-blue-500' : 'text-white'}`}>{faq.question}</span>
                                    <div className={`p-2 rounded-xl transition-all ${openIndex === index ? 'bg-blue-500/20 text-blue-500 rotate-180' : 'bg-white/5 text-slate-600'}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </button>
                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100 px-8 pb-8' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-slate-400 leading-relaxed font-medium">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-600/5 border border-blue-500/20 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none"></div>
                        <h2 className="text-3xl font-bold mb-4 outfit">Still have questions?</h2>
                        <p className="text-slate-400 mb-8 max-w-lg mx-auto">Our specialized support team is available 24/7 to assist with enterprise integrations and data requests.</p>
                        <a
                            href="mailto:info@xumai.app"
                            className="inline-flex items-center gap-2 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-full transition-all shadow-xl shadow-blue-500/20"
                        >
                            <Mail size={20} />
                            Contact Us
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default FAQPage;
