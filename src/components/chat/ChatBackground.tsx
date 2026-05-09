import React from "react";
import { motion } from "framer-motion";

export const ChatBackground = React.memo(() => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-background">
            {/* Base Layer */}
            <div className="absolute inset-0 bg-[#fefefe] dark:bg-[#0c0d10]" />

            {/* Dynamic Mesh Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-white/[0.03] blur-[120px]"
            />

            <motion.div
                animate={{
                    scale: [1.1, 1, 1.1],
                    x: [0, -30, 0],
                    y: [0, 30, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] rounded-full bg-zinc-500/[0.03] blur-[100px]"
            />

            {/* Doodle Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-opacity grayscale invert dark:invert-0"
                style={{
                    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                    backgroundSize: '400px',
                }} />

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/40" />
        </div>
    );
});

ChatBackground.displayName = "ChatBackground";
