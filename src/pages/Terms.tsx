import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Scale, Users, FileText, ShoppingBag, ArrowRight, CheckCircle2, AlertCircle, ShieldAlert, Gavel } from "lucide-react";

const termSections = [
    {
        title: "1. Acceptance of Terms",
        icon: <Scale className="w-5 h-5" />,
        content: "By accessing or using the CredSwap platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.",
        bullets: [
            "Acceptance applies to all browsers and devices.",
            "Terms cover all features, including notes and marketplace.",
            "Agreement is legally binding between user and CredSwap."
        ]
    },
    {
        title: "2. User Conduct",
        icon: <Users className="w-5 h-5" />,
        content: "Users must adhere to a code of conduct that promotes a safe and academic environment. Prohibited actions include:",
        bullets: [
            "Uploading copyrighted material without permission.",
            "Harassment or bullying of other students.",
            "Posting fraudulent listings in the marketplace.",
            "Attempting to compromise platform security."
        ]
    },
    {
        title: "3. Academic Integrity",
        icon: <ShieldAlert className="w-5 h-5" />,
        content: "CredSwap is designed as a collaborative tool. Users must not use the platform for academic dishonesty, such as sharing answers to active exams or proprietary course materials.",
        bullets: []
    },
    {
        title: "4. Intellectual Property",
        icon: <FileText className="w-5 h-5" />,
        content: "When you upload content, you retain your ownership rights. However, you grant CredSwap a worldwide, non-exclusive license to host, store, and share that content with other users of the platform.",
        bullets: [
            "CredSwap retains all rights to its original UI/UX design.",
            "Users may not scrape data from the platform.",
            "Reporting mechanisms are in place for IP violations."
        ]
    },
    {
        title: "5. Marketplace Transactions",
        icon: <ShoppingBag className="w-5 h-5" />,
        content: "CredSwap acts as a facilitator for peer-to-peer transactions. We do not guarantee the quality or delivery of items and are not liable for losses incurred during student-to-student sales.",
        bullets: []
    },
    {
        title: "6. Limitation of Liability",
        icon: <Gavel className="w-5 h-5" />,
        content: "In no event shall CredSwap or its developers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the platform.",
        bullets: []
    }
];

const TextReveal = ({ text }: { text: string }) => {
    return (
        <motion.span
            initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {text}
        </motion.span>
    );
};

export default function Terms() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#030303] text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-indigo-500/20">
            <Navbar />

            <main className="flex-1 pt-24 pb-32">
                {/* Header Section */}
                <header className="container mx-auto px-6 max-w-4xl mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold tracking-widest text-[10px] uppercase mb-4"
                    >
                        <div className="w-8 h-[2px] bg-indigo-500/30" />
                        Platform Governance
                    </motion.div>
                    
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                        <TextReveal text="Terms of Service" />
                    </h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed"
                    >
                        Please read these terms carefully. They govern your use of the CredSwap ecosystem and establish your legal rights.
                    </motion.p>
                </header>

                {/* Content Section */}
                <div className="container mx-auto px-6 max-w-4xl space-y-12">
                    {termSections.map((section, idx) => (
                        <motion.section
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, ease: [0.21, 0.45, 0.32, 0.9] }}
                            className="relative group pb-12 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                        >
                            <div className="flex items-start gap-5">
                                <div className="mt-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                                    {section.icon}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <h2 className="text-xl font-bold tracking-tight">
                                        {section.title}
                                    </h2>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[15px]">
                                        {section.content}
                                    </p>

                                    {section.bullets && section.bullets.length > 0 && (
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                                            {section.bullets.map((bullet, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-[14px] text-zinc-600 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-100/50 dark:border-zinc-800/30">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    ))}
                </div>

                {/* FAQ Style Footer */}
                <section className="container mx-auto px-6 max-w-4xl mt-24">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 dark:bg-zinc-100 rounded-3xl p-10 text-white dark:text-zinc-900 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-md">
                                <h3 className="text-2xl font-black mb-3">Legal Overview</h3>
                                <p className="text-zinc-400 dark:text-zinc-500 font-medium">
                                    We believe in fair use and community-driven safety. These terms ensure everyone can build safely.
                                </p>
                            </div>
                            <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-lg">
                                Contact Legal
                            </button>
                        </div>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
