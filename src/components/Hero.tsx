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
      <div className="container relative z-10 mx-auto px-4 md:px-8 lg:px-12 w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
        
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
              <Button className="h-12 md:h-14 px-6 md:px-8 rounded-full bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all text-sm font-semibold flex items-center gap-3 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-white" />
                Join the Network
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" className="h-12 md:h-14 px-6 md:px-8 rounded-full bg-transparent border border-zinc-800 text-white hover:bg-zinc-900 hover:border-zinc-700 transition-all text-sm font-semibold flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-500" />
                Get In Touch
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
          className="relative w-full max-w-[420px] lg:max-w-[580px] flex items-center justify-center lg:ml-auto"
        >


          {/* Wrapper to cleanly crop the video and fade its edges */}
          <div 
            className="relative z-10 w-full aspect-square overflow-hidden flex items-center justify-center"
            style={{
              mixBlendMode: 'screen',
              transform: 'translateY(-40px)',
              maskImage: 'radial-gradient(circle, black 50%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 75%)'
            }}
          >
            <video
              src="/hero-vid.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-[140%] h-[140%] max-w-none object-cover"
              style={{
                filter: 'contrast(1.3) brightness(0.95)', // Crush blacks to #000000 so screen blend works flawlessly
              }}
            />
          </div>
        </motion.div>
      </div>

    </section>
  );
}
