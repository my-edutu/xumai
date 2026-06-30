import React from 'react';
import { TestimonialsColumn, Testimonial } from "@/components/ui/testimonials-columns-1";
import { motion } from "framer-motion";

const testimonials: Testimonial[] = [
  {
    text: "This platform revolutionized our data labeling operations. The cultural coverage in their network is exactly what our LLMs were missing.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    name: "Briana Patton",
    role: "ML Operations Manager",
  },
  {
    text: "Implementing XUM was incredibly smooth. We managed to scale our RLHF throughput by 4x within the first month of integration.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    name: "Bilal Ahmed",
    role: "AI Research Lead",
  },
  {
    text: "The diversity of the contributor network is exceptional. We've seen a massive reduction in bias across our specialized regional models.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    name: "Saman Malik",
    role: "Trust & Safety Director",
  },
  {
    text: "XUM's API is robust and high-speed. It fits perfectly into our automated training pipelines, delivering verified data in near real-time.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
    name: "Omar Raza",
    role: "CTO @ AI Flow",
  },
  {
    text: "The consensus mechanism works brilliantly. Having multiple human eyes on every data point ensures practically zero noise in our training sets.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    name: "Zainab Hussain",
    role: "Lead Data Scientist",
  },
  {
    text: "Beyond just labeling, the creative generation tasks have helped us build datasets for complex reasoning that synthetic data couldn't touch.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
    name: "Aliza Khan",
    role: "LLM Fine-tuning Engineer",
  }
];

const firstColumn = testimonials.slice(0, 2);
const secondColumn = testimonials.slice(2, 4);
const thirdColumn = testimonials.slice(4, 6);

const Testimonials = () => {
  return (
    <section className="bg-transparent py-20 relative overflow-hidden">
      <div className="container z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[640px] mx-auto text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="border border-blue-500/30 bg-blue-500/10 py-1 px-4 rounded-full text-[10px] font-bold text-blue-500 capitalize tracking-widest">
              Social proof
            </div>
          </div>

          <h2 className="text-section-mobile md:text-section-desktop font-bold mb-4 tracking-tighter text-white">
            Trusted by global AI labs.
          </h2>
          <p className="text-subheading-mobile md:text-subheading-desktop text-slate-400 font-medium">
            See how the world's leading researchers are using our human intelligence network to build safer, smarter models.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[600px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={25} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={35} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={30} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
