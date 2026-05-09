import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";

export default function Careers() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1">
                {/* Hero */}
                <section className="py-20 bg-secondary/20 text-center px-4">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">Join Our Team</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                            We're building the future of student life. If you're passionate about education, technology, and community, we want to hear from you.
                        </p>
                        <Button size="xl">View Open Positions</Button>
                    </div>
                </section>

                {/* Values */}
                <section className="py-20 container mx-auto px-4">
                    <h2 className="text-3xl font-display font-bold mb-12 text-center">Open Positions</h2>

                    <div className="space-y-4 max-w-4xl mx-auto">
                        {[
                            { title: "Campus Ambassador", dept: "Marketing", type: "Part-time", location: "Remote / On-Campus" },
                            { title: "React Native Developer", dept: "Engineering", type: "Internship", location: "Remote" },
                            { title: "Community Manager", dept: "Operations", type: "Full-time", location: "New Delhi" },
                        ].map((job, i) => (
                            <div key={i} className="p-6 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.dept}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.type}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                                    </div>
                                </div>
                                <Button variant="outline" className="shrink-0">
                                    Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
