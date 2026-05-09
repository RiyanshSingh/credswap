import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, Database, Mail, Info, FileText, Globe, Bell, Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";

const policySections = [
    {
        title: "Introduction",
        icon: <Shield className="w-5 h-5" />,
        content: `At CredSwap, we value the trust you place in us when you share your personal information. This Privacy Policy describes how we collect, use, process, and disclose your information across the CredSwap Platform. The "Platform" includes our website, mobile applications, and other online products and services. By using our Platform, you consent to the data practices described in this statement.`,
        bullets: []
    },
    {
        title: "1. Information We Collect",
        icon: <Database className="w-5 h-5" />,
        content: "To provide you with a seamless experience, we collect information that you provide to us directly and information that is collected automatically through your use of the Platform.",
        subsections: [
            {
                subtitle: "A. Information You Provide",
                text: "Account registration (name, email, university), profile information, and any content you post in forums, marketplace, or notes."
            },
            {
                subtitle: "B. Information Collected Automatically",
                text: "Usage details, IP addresses, browser information, and information collected through cookies and other tracking technologies."
            }
        ]
    },
    {
        title: "2. How We Use Your Information",
        icon: <Info className="w-5 h-5" />,
        content: "We use the information we collect to operate, provide, and improve our services, including:",
        bullets: [
            "Facilitating academic resource sharing and event discovery.",
            "Personalizing your experience on the platform.",
            "Processing marketplace transactions between students.",
            "Analyzing usage patterns to enhance platform performance.",
            "Sending critical updates and platform-related notifications."
        ]
    },
    {
        title: "3. Sharing and Disclosure",
        icon: <Globe className="w-5 h-5" />,
        content: "We do not sell your personal information to third parties. We may share information in limited circumstances:",
        bullets: [
            "With your consent or at your direction.",
            "To comply with legal obligations and respond to valid legal processes.",
            "To protect the rights and safety of CredSwap users and the public.",
            "With service providers who perform services on our behalf (e.g., hosting, analytics)."
        ]
    },
    {
        title: "4. Data Security & Storage",
        icon: <Lock className="w-5 h-5" />,
        content: "We implement industry-standard security measures designed to protect your information from unauthorized access, loss, or alteration. Your data is stored securely on servers provided by our cloud infrastructure partners (Supabase/PostgreSQL).",
        bullets: [
            "End-to-end encryption for sensitive communications.",
            "Regular security audits and vulnerability patches.",
            "Restricted access to data for authorized personnel only."
        ]
    },
    {
        title: "5. Your Privacy Rights",
        icon: <Fingerprint className="w-5 h-5" />,
        content: "Depending on your location, you may have certain rights regarding your personal information, including:",
        bullets: [
            "The right to access and update your data.",
            "The right to request deletion of your account and associated data.",
            "The right to opt-out of marketing communications.",
            "The right to data portability in a structured format."
        ]
    },
    {
        title: "6. Cookies and Tracking",
        icon: <Eye className="w-5 h-5" />,
        content: "We use cookies and similar technologies to remember your preferences and analyze platform traffic. You can control cookie settings through your browser, although disabling them may impact some platform features.",
        bullets: []
    },
    {
        title: "7. Changes to this Policy",
        icon: <Bell className="w-5 h-5" />,
        content: "We may update this Privacy Policy from time to time. If we make significant changes, we will notify you by posting a notice on our site or sending an email notification.",
        bullets: []
    },
    {
        title: "8. Contact Us",
        icon: <Mail className="w-5 h-5" />,
        content: "For questions or concerns regarding your privacy, please contact us at info@credswap.com or reach out via our help center.",
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

export default function Privacy() {
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
                        Legal Compliance
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                        <TextReveal text="Privacy Policy" />
                    </h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed"
                    >
                        Last updated: March 2026. This policy outlines how CredSwap handles your data to ensure transparency and security for every user.
                    </motion.p>
                </header>

                {/* Content Section */}
                <div className="container mx-auto px-6 max-w-4xl space-y-12">
                    {policySections.map((section, idx) => (
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

                                    {section.subsections && (
                                        <div className="space-y-6 mt-6">
                                            {section.subsections.map((sub, i) => (
                                                <div key={i} className="pl-4 border-l-2 border-indigo-500/20">
                                                    <h3 className="font-bold text-[14px] mb-2">{sub.subtitle}</h3>
                                                    <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                        {sub.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
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
                        className="bg-indigo-600 rounded-3xl p-10 text-white relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform duration-1000 group-hover:scale-125" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-md">
                                <h3 className="text-2xl font-black mb-3">Privacy Matters</h3>
                                <p className="text-indigo-100 font-medium">
                                    Our commitment to your privacy is unwavering. We use your data ONLY to make your campus life better.
                                </p>
                            </div>
                            <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-zinc-100 transition-all active:scale-95 shadow-lg">
                                Download PDF
                            </button>
                        </div>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
