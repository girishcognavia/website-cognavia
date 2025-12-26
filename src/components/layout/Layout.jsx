import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AnimatedBackground from './AnimatedBackground';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col relative text-white">
            <AnimatedBackground />
            <Navbar />
            <main className="flex-grow pt-20 relative z-10">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
