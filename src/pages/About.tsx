import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GraduationCap, Heart, Shield, Users, Zap } from "lucide-react";

export default function About() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1">
                {/* Hero */}
                <section className="py-20 md:py-32 bg-secondary/20 text-center px-4">
                    <div className="max-w-3xl mx-auto">
                        <GraduationCap className="w-16 h-16 mx-auto text-primary mb-6" />
                        <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">Empowering Students Everywhere</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            CredSwap is on a mission to simplify student life by connecting you with verified housing, campus marketplace deals, and student communities in one seamless platform.
                        </p>
                    </div>
                </section>

                {/* Values */}
                <section className="py-20 container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold">Speed & Efficiency</h3>
                            <p className="text-muted-foreground">Access what you need instantly. From room listings to marketplace deals, we cut out the clutter.</p>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto text-blue-500">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold">Community First</h3>
                            <p className="text-muted-foreground">Built by students, for students. We understand your needs because we share them.</p>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto text-green-500">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold">Trust & Safety</h3>
                            <p className="text-muted-foreground">A secure marketplace and verified student housing ensure you can focus on your campus life.</p>
                        </div>
                    </div>
                </section>

                {/* Story */}
                <section className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4 max-w-4xl text-center">
                        <Heart className="w-12 h-12 text-red-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-display font-bold mb-6">Our Story</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            CredSwap started as a small project in a dorm room. We realized that finding verified housing and trusted marketplace deals near campus was harder than it should be.
                            So we built a solution. Today, we serve thousands of students, helping them find better stays and build a more connected campus community.
                        </p>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
