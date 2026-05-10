import { Link } from "react-router-dom";
import { GraduationCap, Twitter, Github, Linkedin, Instagram, ArrowRight } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative bg-transparent text-zinc-400 overflow-hidden border-t border-zinc-900 font-sans">
            {/* ── Premium Shining Top Border ── */}
            {/* Base soft spread */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent z-10" />
            {/* Intense inner core */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10 blur-[1px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[20%] h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent z-10" />

            {/* ── Ambient Background Glows ── */}
            {/* Soft upward bloom from the bottom */}
            <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[100%] h-[150%] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-white/[0.04] via-zinc-500/[0.015] to-transparent blur-[100px] pointer-events-none" />
            {/* Downward bloom from the shiny border */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[80%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.04] via-zinc-400/[0.01] to-transparent blur-[120px] pointer-events-none" />

            {/* Background Art */}
            <div className="absolute bottom-0 left-0 w-full z-0 pointer-events-none select-none opacity-90 overflow-hidden h-fit">
                <img
                    src="/footer-art.png"
                    alt="Footer Background Art"
                    className="w-full h-auto object-top"
                />
            </div>

            <div className="container mx-auto px-6 pt-16 pb-32 md:pb-16 relative z-10 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
                    {/* Brand Column */}
                    <div className="lg:col-span-4 pr-4">
                        <Link to="/" className="flex items-center gap-3 mb-6 group">
                            <div className="w-8 h-8 rounded flex items-center justify-center border-2 border-white text-white">
                                <div className="w-3 h-3 bg-white rounded-[1px] transform rotate-45" />
                            </div>
                            <span className="font-semibold text-lg tracking-tight text-white">
                                CredSwap
                            </span>
                        </Link>
                        <p className="text-[13px] leading-6 text-zinc-400 mb-10 font-medium max-w-[280px]">
                            The ultimate student companion. Empowering you to build, connect, and scale your ideas with world-class campus tools.
                        </p>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Stay Updated</h4>
                            <div className="relative max-w-[280px]">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-[#111] border border-zinc-800 rounded-[12px] px-4 py-3.5 text-sm text-white focus:outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600"
                                />
                                <button
                                    className="absolute right-[5px] top-[5px] bottom-[5px] w-9 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-[8px] transition-colors flex items-center justify-center"
                                    aria-label="Subscribe to newsletter"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-8 lg:px-12 mt-1">
                        <div>
                            <h3 className="font-semibold text-white mb-6 text-[15px]">Platform</h3>
                            <ul className="space-y-4">
                                <li><Link to="/marketplace" className="text-[14px] text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-600 font-bold">•</span> Marketplace</Link></li>
                                <li><Link to="/rooms" className="text-[14px] text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-600 font-bold">•</span> Student Housing</Link></li>
                                <li><Link to="/community" className="text-[14px] text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-600 font-bold">•</span> Community</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-6 text-[15px]">Resources</h3>
                            <ul className="space-y-4">
                                <li><Link to="/about" className="text-[14px] text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-600 font-bold">•</span> Documentation</Link></li>
                                <li><Link to="/careers" className="text-[14px] text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-600 font-bold">•</span> Careers</Link></li>
                                <li><Link to="/blog" className="text-[14px] text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-600 font-bold">•</span> Blog & News</Link></li>
                                <li><Link to="/admin" className="text-[14px] text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-600 font-bold">•</span> Admin Console</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Connect Column */}
                    <div className="lg:col-span-3 mt-1">
                        <h3 className="font-semibold text-white mb-6 text-[15px]">Connect</h3>
                        <div className="flex gap-3.5 mb-6">
                            <a href="#" aria-label="Github Profile" className="w-12 h-12 rounded-[14px] bg-[#111] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white hover:border-zinc-700 text-zinc-400 transition-all">
                                <Github className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </a>
                            <a href="#" aria-label="Twitter Profile" className="w-12 h-12 rounded-[14px] bg-[#111] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white hover:border-zinc-700 text-zinc-400 transition-all">
                                <Twitter className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </a>
                            <a href="https://www.linkedin.com/company/credswap/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="Linkedin Profile" className="w-12 h-12 rounded-[14px] bg-[#111] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white hover:border-zinc-700 text-zinc-400 transition-all">
                                <Linkedin className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </a>
                            <a href="#" aria-label="Instagram Profile" className="w-12 h-12 rounded-[14px] bg-[#111] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white hover:border-zinc-700 text-zinc-400 transition-all">
                                <Instagram className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </a>
                        </div>

                        <a href="mailto:credswap@gmail.com" className="inline-block text-[14px] text-zinc-400 hover:text-white transition-colors font-medium">
                            credswap@gmail.com
                        </a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-5 md:gap-4 mt-8">
                    <p className="text-[10px] md:text-[12px] text-zinc-500 font-mono flex items-center flex-wrap gap-1.5 justify-center md:justify-start transition-colors">
                        © 2026 CredSwap. All rights reserved
                    </p>
                    <div className="flex gap-5 md:gap-8 text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.15em] text-zinc-500 uppercase transition-colors">
                        <Link to="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
