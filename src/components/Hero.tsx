import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      className="relative w-full min-h-screen text-white overflow-hidden flex items-center pt-24 md:pt-0 font-sans"
      style={{ background: 'transparent' }}
    >


      {/* Container */}
      <div className="container relative z-10 mx-auto px-4 md:px-8 lg:px-12 w-full flex flex-col-reverse lg:flex-row items-center justify-between gap-4 lg:gap-8">
        
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-start text-left max-w-2xl w-full"
        >
          {/* Massive Headline */}
          <h1 className="text-[42px] leading-[1.05] sm:text-[56px] md:text-[68px] lg:text-[76px] font-display font-bold tracking-tight mb-6 text-white">
            Smart. Fast. Future <br className="hidden sm:block" />
            Ready Campus.
          </h1>

          {/* Subheadline */}
          <p className="text-[15px] sm:text-[17px] md:text-lg text-zinc-400 mb-10 max-w-[540px] font-medium leading-[1.6]">
            We create innovative, fast, and scalable networks designed to empower students, boost their campus presence, and drive sustainable growth effectively.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-10 md:mb-12">
            <Link to="/auth">
              <Button className="relative overflow-hidden h-12 md:h-14 px-6 md:px-8 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 ring-1 ring-inset ring-white/5 text-white hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 text-sm font-semibold flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.4)] group">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                <div className="relative z-10 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:scale-125 transition-transform" />
                <span className="relative z-10">Join the Network</span>
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" className="relative overflow-hidden h-12 md:h-14 px-6 md:px-8 rounded-full bg-transparent border border-white/5 text-zinc-300 hover:text-white hover:bg-white/[0.02] hover:border-white/10 transition-all duration-300 text-sm font-semibold flex items-center gap-3 group">
                <div className="relative z-10 w-2 h-2 rounded-full bg-zinc-500 group-hover:bg-white transition-colors group-hover:scale-125" />
                <span className="relative z-10">Get In Touch</span>
              </Button>
            </Link>
          </div>

          {/* Checkmarks */}
          <div className="flex flex-wrap items-center gap-y-4 gap-x-6 sm:gap-x-8 text-sm md:text-[15px] font-medium text-zinc-300">
            {[
              "Fast & Optimized",
              "Fully Custom",
              "Student Focused",
              "Maintenance"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Graphic — Hero Video */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
          className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[580px] flex items-center justify-center lg:ml-auto"
        >


          {/* Wrapper with extreme foggy edges to seamlessly merge the video */}
          <div 
            className="relative z-10 w-full aspect-square overflow-hidden flex items-center justify-center lg:translate-y-0"
            style={{
              // Multi-layered mask: Radial fade + linear fade at the top to ensure no boundary is visible
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%), radial-gradient(circle at center, white 20%, rgba(255,255,255,0.5) 45%, transparent 65%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%), radial-gradient(circle at center, white 20%, rgba(255,255,255,0.5) 45%, transparent 65%)',
              maskComposite: 'intersect',
              WebkitMaskComposite: 'destination-in',
              mixBlendMode: 'screen',
              willChange: 'transform', // Hint for GPU acceleration
            }}
          >
              <video
                src="/hero-vid.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-[150%] h-[150%] max-w-none object-cover scale-110"
                style={{
                  filter: 'contrast(2.5) brightness(0.75)', // Even higher contrast to absolutely crush background greys to black
                }}
              />
          </div>
        </motion.div>
      </div>

    </section>
  );
}
