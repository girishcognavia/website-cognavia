import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Twitter, Linkedin, Github, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-black border-t border-white/10 text-neutral-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div>
                        <Link to="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Brain className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">Cognavia.ai</span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6">
                            Pioneering the future of enterprise AI. We build intelligent systems that drive growth, efficiency, and innovation.
                        </p>
                        <div className="flex space-x-4">
                            {[Twitter, Linkedin, Github].map((Icon, index) => (
                                <a
                                    key={index}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-violet-600 hover:text-white transition-all duration-300"
                                >
                                    <Icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold mb-6">Product</h3>
                        <ul className="space-y-4">
                            {['CognaAssist', 'CognaBrief', 'CognaFileSearch', 'MediBook AI'].map((item) => (
                                <li key={item}>
                                    <Link to="/products" className="hover:text-violet-400 transition-colors text-sm">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white font-bold mb-6">Company</h3>
                        <ul className="space-y-4">
                            {['About Us', 'Careers', 'Blog', 'Contact'].map((item) => (
                                <li key={item}>
                                    <Link to={`/${item.toLowerCase().replace(' ', '-')}`} className="hover:text-violet-400 transition-colors text-sm">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-bold mb-6">Contact</h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-violet-500 shrink-0" />
                                <span>Kristal Jasper, Villa No.3J123<br />Near Amrita Engineering College, Bangalore</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-violet-500 shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-violet-500 shrink-0" />
                                <span>hello@cognavia.ai</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <p>&copy; {new Date().getFullYear()} Cognavia.ai. All rights reserved.</p>
                    <div className="flex space-x-8">
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
