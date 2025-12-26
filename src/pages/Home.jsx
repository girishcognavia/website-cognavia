import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Zap, Users, Brain, Network, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { products } from '../data/products';
import { team } from '../data/team';
import heroImage from '../assets/home-hero-ai.png';
import aboutImage from '../assets/abstract_ai_illustration_1.png';

const Home = () => {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 lg:pt-32 pb-20 lg:pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center lg:text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-violet-300 mb-6 backdrop-blur-sm mx-auto lg:mx-0">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-sm font-medium">Next-Gen Enterprise AI</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight">
                                Enterprise AI Solutions <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                                    That Transform Business
                                </span>
                            </h1>
                            <p className="text-xl text-neutral-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                                From intelligent customer support to document processing - AI-powered tools built for scale, security, and performance.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Link
                                    to="/products"
                                    className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                                >
                                    Explore Products <ArrowRight className="h-5 w-5" />
                                </Link>
                                <Link
                                    to="/contact"
                                    className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/10 rounded-full font-bold hover:bg-white/20 transition-all backdrop-blur-sm"
                                >
                                    Request Demo
                                </Link>
                            </div>
                        </motion.div>

                        {/* Animated Visuals */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative hidden lg:block"
                        >
                            <div className="relative w-full aspect-square max-w-[600px] mx-auto">
                                {/* Main Image with Float Animation */}
                                <motion.div
                                    animate={{ y: [-15, 15, -15] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/20"
                                >
                                    <img
                                        src={heroImage}
                                        alt="Enterprise AI"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Glass Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-transparent pointer-events-none"></div>
                                </motion.div>

                                {/* Floating Elements */}
                                <motion.div
                                    animate={{ x: [-10, 10, -10], y: [10, -10, 10] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-10 -right-10 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-20"
                                >
                                    <Brain className="w-8 h-8 text-violet-400" />
                                </motion.div>

                                <motion.div
                                    animate={{ x: [10, -10, 10], y: [-10, 10, -10] }}
                                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-5 -left-5 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-20"
                                >
                                    <Network className="w-8 h-8 text-indigo-400" />
                                </motion.div>

                                {/* Background Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-violet-500/20 blur-[100px] -z-10"></div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Intelligent Suite</h2>
                        <p className="text-lg text-neutral-400">Powerful AI products designed for specific enterprise needs</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5`}>
                                    <product.icon className="h-7 w-7 text-violet-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{product.name}</h3>
                                <p className="text-neutral-400 text-sm mb-6 line-clamp-3 leading-relaxed">{product.description}</p>
                                <Link
                                    to={product.path}
                                    className="inline-flex items-center text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                                >
                                    Learn More <ArrowRight className="h-4 w-4 ml-1" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 border-y border-white/5 bg-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: 'Documents Processed', value: '50,000+', icon: CheckCircle },
                            { label: 'AI Accuracy', value: '90%+', icon: Zap },
                            { label: 'Deployment Time', value: '2 Weeks', icon: Shield },
                            { label: 'Support', value: '24/7 AI', icon: Users },
                        ].map((stat, index) => (
                            <div key={index} className="group">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-violet-500/20 transition-colors">
                                        <stat.icon className="h-6 w-6 text-violet-400" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                                <div className="text-neutral-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-4xl font-bold text-white mb-6">Pioneering the Future of AI</h2>
                            <p className="text-lg text-neutral-400 mb-6 leading-relaxed">
                                Cognavia.ai is a brand of Kognavion AI Labs that stands at the intersection of innovation and practical application. Founded with a vision to democratize AI technology, we bridge the gap between cutting-edge research and real-world business solutions.
                            </p>
                            <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
                                Our mission is to empower organizations of all sizes to harness the transformative power of artificial intelligence, driving growth, efficiency, and innovation across industries.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-3xl font-bold text-violet-400 mb-2">50+</div>
                                    <div className="text-neutral-400 text-sm">Projects Completed</div>
                                </div>
                                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-3xl font-bold text-violet-400 mb-2">100+</div>
                                    <div className="text-neutral-400 text-sm">Professionals Trained</div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 rounded-3xl blur-2xl"></div>
                            <img src={aboutImage} alt="AI Innovation" className="relative rounded-3xl shadow-2xl border border-white/10" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section id="team" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Leadership Team</h2>
                        <p className="text-lg text-neutral-400">The minds behind Cognavia.ai</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {team.map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                            >
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-900/20">
                                    {member.initials}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                                <p className="text-violet-400 font-medium mb-4">{member.role}</p>
                                <p className="text-neutral-400 text-sm leading-relaxed">{member.bio}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-black/50 backdrop-blur-sm"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Transform Your Business?
                    </h2>
                    <p className="text-xl text-neutral-400 mb-10">
                        Join forward-thinking enterprises using Cognavia.ai's AI solutions to drive growth and efficiency.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-block px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10"
                    >
                        Schedule a Consultation
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
