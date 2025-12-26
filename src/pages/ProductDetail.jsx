import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Check, ArrowRight, Shield, Zap, BarChart, MessageSquare, FileText, Search, Stethoscope, Activity, FileCheck, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { products } from '../data/products';

const ProductVisuals = ({ product }) => {
    const renderEffects = () => {
        switch (product.id) {
            case 'cogna-assist':
                return (
                    <>
                        <motion.div
                            animate={{ y: [-10, 10, -10], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-8 -right-8 p-4 bg-violet-600/20 backdrop-blur-md rounded-2xl border border-violet-500/30"
                        >
                            <MessageSquare className="w-8 h-8 text-violet-400" />
                        </motion.div>
                        <motion.div
                            animate={{ y: [10, -10, 10], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-4 -left-8 p-4 bg-indigo-600/20 backdrop-blur-md rounded-2xl border border-indigo-500/30"
                        >
                            <Bot className="w-8 h-8 text-indigo-400" />
                        </motion.div>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute top-1/2 right-0 w-32 h-32 bg-violet-500/30 rounded-full blur-3xl"
                        />
                    </>
                );
            case 'cogna-brief':
                return (
                    <>
                        <motion.div
                            animate={{ x: [-5, 5, -5], rotate: [0, 5, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-4 -left-4 p-4 bg-purple-600/20 backdrop-blur-md rounded-2xl border border-purple-500/30"
                        >
                            <FileText className="w-8 h-8 text-purple-400" />
                        </motion.div>
                        <motion.div
                            initial={{ height: "0%" }}
                            animate={{ height: "100%" }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute top-0 left-1/2 w-1 bg-gradient-to-b from-transparent via-purple-400/50 to-transparent h-full"
                        />
                        <motion.div
                            animate={{ y: [10, -10, 10] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute bottom-8 -right-8 p-4 bg-fuchsia-600/20 backdrop-blur-md rounded-2xl border border-fuchsia-500/30"
                        >
                            <FileCheck className="w-8 h-8 text-fuchsia-400" />
                        </motion.div>
                    </>
                );
            case 'cogna-filesearch':
                return (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-10 -right-10 w-24 h-24 border-2 border-dashed border-cyan-500/30 rounded-full"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-4 right-4 p-3 bg-cyan-600/20 backdrop-blur-md rounded-full border border-cyan-500/30"
                        >
                            <Search className="w-6 h-6 text-cyan-400" />
                        </motion.div>
                        <motion.div
                            animate={{ x: [-100, 100], opacity: [0, 1, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                        />
                    </>
                );
            case 'medibook-ai':
                return (
                    <>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -right-6 p-4 bg-emerald-600/20 backdrop-blur-md rounded-full border border-emerald-500/30"
                        >
                            <Activity className="w-8 h-8 text-emerald-400" />
                        </motion.div>
                        <motion.div
                            animate={{ y: [-10, 10, -10] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-4 -left-4 p-4 bg-teal-600/20 backdrop-blur-md rounded-2xl border border-teal-500/30"
                        >
                            <Stethoscope className="w-8 h-8 text-teal-400" />
                        </motion.div>
                        <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl animate-pulse" />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-3xl blur-2xl transform group-hover:scale-105 transition-transform duration-500" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-900/20 bg-black/40 backdrop-blur-sm"
            >
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </motion.div>
            {renderEffects()}
        </div>
    );
};

const ProductDetail = () => {
    const { productId } = useParams();
    const product = products.find(p => p.id === productId);

    if (!product) {
        return <Navigate to="/products" replace />;
    }

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative overflow-hidden pt-20 lg:pt-28 pb-12">
                {/* Removed radial gradient */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-violet-300 mb-6 backdrop-blur-sm">
                                <product.icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{product.name}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                {product.details.heroTitle}
                            </h1>
                            <p className="text-xl text-neutral-400 mb-8 leading-relaxed">
                                {product.details.heroSubtitle}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/contact"
                                    className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-colors"
                                >
                                    Schedule a Demo
                                </Link>
                                <a
                                    href="#features"
                                    className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold hover:bg-white/10 transition-colors backdrop-blur-sm"
                                >
                                    View Features
                                </a>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <ProductVisuals product={product} />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Key Features</h2>
                        <p className="text-lg text-neutral-400">Everything you need to succeed</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {product.features.map((feature, index) => (
                            <div key={index} className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 flex items-center justify-center mb-6 border border-white/5">
                                    <Check className="h-6 w-6 text-violet-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-3">{feature}</h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Advanced capability designed for enterprise scale and reliability.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-white/5 border-y border-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-16 text-center">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        {product.details.howItWorks.map((step, index) => (
                            <div key={index} className="relative group">
                                <div className="text-6xl font-bold text-white/5 mb-4 group-hover:text-violet-500/20 transition-colors">0{index + 1}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">{step.description}</p>
                                {index < product.details.howItWorks.length - 1 && (
                                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -ml-4"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits & Use Cases */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-8">Benefits</h2>
                            <div className="space-y-8">
                                {product.details.benefits.map((benefit, index) => (
                                    <div key={index} className="flex gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                                                <Zap className="h-6 w-6 text-violet-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                                            <p className="text-neutral-400 leading-relaxed">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-8">Use Cases</h2>
                            <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm">
                                <ul className="space-y-6">
                                    {product.details.useCases.map((useCase, index) => (
                                        <li key={index} className="flex items-center gap-4">
                                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3 text-violet-400" />
                                            </div>
                                            <span className="text-neutral-300 font-medium">{useCase}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/20 to-black/50 backdrop-blur-sm"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to get started with {product.name}?</h2>
                    <p className="text-xl text-neutral-400 mb-10">
                        Join leading companies transforming their operations with our AI solutions.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-block px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10"
                    >
                        Request a Demo
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default ProductDetail;
