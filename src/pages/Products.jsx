import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { products } from '../data/products';

const Products = () => {
    return (
        <div className="min-h-screen">
            <div className="pt-24 lg:pt-36 pb-20 relative overflow-hidden">
                {/* Removed radial gradient */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Our Products</h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        A comprehensive suite of AI tools designed to solve complex enterprise challenges.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="grid gap-12">
                    {products.map((product, index) => (
                        <div
                            key={product.id}
                            className={`flex flex-col lg:flex-row gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                        >
                            <div className="flex-1">
                                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 mb-6 border border-white/10`}>
                                    <product.icon className="h-8 w-8 text-violet-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">{product.name}</h2>
                                <p className="text-xl text-violet-400 font-medium mb-4">{product.tagline}</p>
                                <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
                                    {product.description}
                                </p>

                                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                                    {product.features.slice(0, 4).map((feature, idx) => (
                                        <div key={idx} className="flex items-center text-neutral-300">
                                            <Check className="h-5 w-5 text-violet-500 mr-2 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4">
                                    <Link
                                        to={product.path}
                                        className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-colors"
                                    >
                                        View Details
                                    </Link>
                                    <span className="text-neutral-500 text-sm">
                                        Pricing: <span className="font-medium text-white">{product.pricing}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 w-full">
                                <div className="aspect-video bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group hover:bg-white/10 transition-colors duration-500">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Products;
