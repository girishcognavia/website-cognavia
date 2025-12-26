import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
    return (
        <div className="min-h-screen">
            <section className="relative overflow-hidden pt-24 lg:pt-36 pb-20">
                {/* Removed radial gradient */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Get in Touch</h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        Ready to transform your business? Let's start the conversation.
                    </p>
                </div>
            </section>

            <section className="pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Contact Info */}
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-8">Contact Information</h2>
                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 backdrop-blur-sm">
                                        <Mail className="h-6 w-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Email Us</h3>
                                        <p className="text-neutral-400">hello@cognavia.ai</p>
                                        <p className="text-neutral-500 text-sm mt-1">We'll respond within 24 hours.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 backdrop-blur-sm">
                                        <Phone className="h-6 w-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Call Us</h3>
                                        <p className="text-neutral-400">+91-9019538667</p>
                                        <p className="text-neutral-500 text-sm mt-1">Mon-Fri from 9am to 6pm.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 backdrop-blur-sm">
                                        <MapPin className="h-6 w-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Visit Us</h3>
                                        <p className="text-neutral-400">Kristal Jasper, Villa No.3J123</p>
                                        <p className="text-neutral-500 text-sm mt-1">Come say hello at our office.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder-neutral-600"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder-neutral-600"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Product Interest</label>
                                    <select className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all">
                                        <option value="" className="bg-black">Select a product...</option>
                                        <option value="cogna-assist" className="bg-black">CognaAssist</option>
                                        <option value="cogna-brief" className="bg-black">CognaBrief</option>
                                        <option value="cogna-filesearch" className="bg-black">CognaFileSearch</option>
                                        <option value="medibook-ai" className="bg-black">MediBook AI</option>
                                        <option value="other" className="bg-black">Other / General Inquiry</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Message</label>
                                    <textarea
                                        rows="4"
                                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder-neutral-600"
                                        placeholder="How can we help you?"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                                >
                                    Send Message <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
