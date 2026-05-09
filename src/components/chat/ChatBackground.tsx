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
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[140px] dark:bg-primary/10"
            />

            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-400/5 blur-[120px] dark:bg-blue-400/10"
            />

            <motion.div
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.8, 1, 0.8],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-[40%] left-[20%] w-[40%] h-[40%] rounded-full bg-purple-400/[0.03] blur-[100px] dark:bg-purple-400/[0.05]"
            />

            {/* WhatsApp Doodle Pattern */}
            <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12] pointer-events-none transition-opacity grayscale invert-0 dark:invert"
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
