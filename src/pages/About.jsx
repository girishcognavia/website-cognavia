import React from 'react';
import { Brain, Users, Globe, Award, Shield } from 'lucide-react';
import { team } from '../data/team';

const About = () => {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative overflow-hidden pt-24 lg:pt-36 pb-24">
                {/* Removed radial gradient */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">Pioneering the Future of <br />Enterprise AI</h1>
                    <p className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
                        Cognavia.ai is dedicated to democratizing artificial intelligence for businesses worldwide. We bridge the gap between cutting-edge research and real-world application.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                            <p className="text-lg text-neutral-400 mb-6 leading-relaxed">
                                Founded with a vision to transform how enterprises operate, Cognavia.ai builds intelligent systems that enhance human capabilities rather than replacing them.
                            </p>
                            <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
                                We believe in ethical, transparent, and secure AI that drives tangible business value. Our suite of products addresses critical operational bottlenecks—from document processing to customer engagement.
                            </p>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="text-4xl font-bold text-violet-400 mb-2">50+</div>
                                    <div className="text-neutral-500">Enterprise Clients</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-violet-400 mb-2">10M+</div>
                                    <div className="text-neutral-500">Predictions Daily</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-3xl transform rotate-3 opacity-10 blur-xl"></div>
                            <div className="relative bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm">
                                <div className="grid gap-6">
                                    {[
                                        { icon: Brain, title: 'Innovation', desc: 'Pushing the boundaries of what is possible with AI.' },
                                        { icon: Shield, title: 'Security', desc: 'Enterprise-grade data protection and compliance.' },
                                        { icon: Globe, title: 'Scale', desc: 'Solutions built to handle global enterprise workloads.' },
                                        { icon: Users, title: 'Partnership', desc: 'We work alongside your team to ensure success.' }
                                    ].map((item, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                    <item.icon className="h-6 w-6 text-violet-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                                <p className="text-neutral-400 text-sm">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-24 bg-white/5 border-y border-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Leadership Team</h2>
                        <p className="text-lg text-neutral-400">The minds behind Cognavia.ai</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {team.map((member, index) => (
                            <div key={index} className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center hover:bg-white/10 transition-colors duration-300 backdrop-blur-sm">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-900/20">
                                    {member.initials}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                                <p className="text-violet-400 font-medium mb-4">{member.role}</p>
                                <p className="text-neutral-400 text-sm leading-relaxed">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
