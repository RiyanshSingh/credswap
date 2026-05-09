import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
    return (
        <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#050505] flex flex-col transition-colors duration-300">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
                    {/* Left: Info */}
                    <div>
                        <h1 className="text-4xl font-display font-bold mb-6">Get in touch</h1>
                        <p className="text-lg text-muted-foreground mb-12">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Email</h3>
                                    <p className="text-muted-foreground">support@credswap.com</p>
                                    <p className="text-muted-foreground">partners@credswap.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Phone</h3>
                                    <p className="text-muted-foreground">+91 98765 43210</p>
                                    <p className="text-xs text-muted-foreground mt-1">Mon-Fri from 8am to 5pm.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Office</h3>
                                    <p className="text-muted-foreground">
                                        University Campus, Block A<br />
                                        Student Innovation Center<br />
                                        New Delhi, India
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First name</Label>
                                    <Input id="firstName" placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last name</Label>
                                    <Input id="lastName" placeholder="Doe" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="How can we help you?"
                                    className="min-h-[150px]"
                                />
                            </div>
                            <Button type="submit" size="lg" className="w-full">
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
