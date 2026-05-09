import { Link } from "react-router-dom";
import { GraduationCap, Twitter, Github, Linkedin, Instagram, ArrowRight, Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-zinc-50 dark:bg-[#030303] text-zinc-600 dark:text-zinc-300 relative overflow-hidden transition-colors duration-300 border-t border-zinc-200 dark:border-transparent">
            {/* Background Art (Only visible in Dark Mode) */}
            <div className="absolute bottom-0 left-0 w-full z-0 pointer-events-none select-none hidden dark:block">
                <img
                    src="/footer-art.png"
                    alt="Footer Background Art"
                    className="w-full h-[180px] md:h-auto object-cover object-bottom"
                />
            </div>

            {/* Extremely thin subtle glow at the very top */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-60 z-10 dark:hidden"></div>

            <div className="container mx-auto px-6 pt-16 pb-32 md:pb-16 relative z-10 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
                    {/* Brand Column */}
                    <div className="lg:col-span-4 pr-4">
                        <Link to="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
                                <GraduationCap className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="font-display font-bold text-xl text-foreground">
                                Cred<span className="text-gradient">Swap</span>
                            </span>
                        </Link>
                        <p className="text-[13px] leading-6 text-zinc-600 dark:text-zinc-300 mb-10 font-medium max-w-[280px]">
                            The ultimate student companion. Empowering you to build, connect, and scale your ideas with world-class campus tools.
                        </p>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Stay Updated</h4>
                            <div className="relative max-w-[280px]">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800/80 rounded-[12px] px-4 py-3.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary/50 dark:focus:border-zinc-700 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                />
                                <button
                                    className="absolute right-[5px] top-[5px] bottom-[5px] w-9 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-[8px] transition-colors flex items-center justify-center"
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
                            <h3 className="font-semibold text-zinc-900 dark:text-white mb-6 text-[15px]">Platform</h3>
                            <ul className="space-y-4">
                                <li><Link to="/marketplace" className="text-[14px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-400 dark:text-zinc-500 font-bold">•</span> Marketplace</Link></li>
                                <li><Link to="/rooms" className="text-[14px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-400 dark:text-zinc-500 font-bold">•</span> Student Housing</Link></li>
                                <li><Link to="/community" className="text-[14px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-400 dark:text-zinc-500 font-bold">•</span> Community</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white mb-6 text-[15px]">Resources</h3>
                            <ul className="space-y-4">
                                <li><Link to="/about" className="text-[14px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-400 dark:text-zinc-500 font-bold">•</span> Documentation</Link></li>
                                <li><Link to="/careers" className="text-[14px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-400 dark:text-zinc-500 font-bold">•</span> Careers</Link></li>
                                <li><Link to="/blog" className="text-[14px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-400 dark:text-zinc-500 font-bold">•</span> Blog & News</Link></li>
                                <li><Link to="/admin" className="text-[14px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"><span className="text-zinc-400 dark:text-zinc-500 font-bold">•</span> Admin Console</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Connect Column */}
                    <div className="lg:col-span-3 mt-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-6 text-[15px]">Connect</h3>
                        <div className="flex gap-3.5 mb-6">
                            <a href="#" aria-label="Github Profile" className="w-12 h-12 rounded-[14px] bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all shadow-sm dark:shadow-none">
                                <Github className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </a>
                            <a href="#" aria-label="Twitter Profile" className="w-12 h-12 rounded-[14px] bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all shadow-sm dark:shadow-none">
                                <Twitter className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </a>
                            <a href="https://www.linkedin.com/company/credswap/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="Linkedin Profile" className="w-12 h-12 rounded-[14px] bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all shadow-sm dark:shadow-none">
                                <Linkedin className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </a>
                            <a href="#" aria-label="Instagram Profile" className="w-12 h-12 rounded-[14px] bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all shadow-sm dark:shadow-none">
                                <Instagram className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            </a>
                        </div>

                        <a href="mailto:credswap@gmail.com" className="inline-block text-[14px] text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-colors font-medium">
                            credswap@gmail.com
                        </a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-zinc-200 dark:border-transparent pt-8 flex flex-col md:flex-row justify-between items-center gap-5 md:gap-4 mt-8">
                    <p className="text-[10px] md:text-[12px] text-zinc-500 dark:text-white font-mono flex items-center flex-wrap gap-1.5 justify-center md:justify-start transition-colors">
                        © 2026 CredSwap. All rights reserved
                    </p>
                    <div className="flex gap-5 md:gap-8 text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.15em] text-zinc-500 dark:text-white uppercase transition-colors">
                        <Link to="/privacy" className="hover:text-zinc-400 dark:hover:text-zinc-300 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-zinc-400 dark:hover:text-zinc-300 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
