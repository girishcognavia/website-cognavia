import React from 'react';
import { Toaster } from 'sonner';
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
            <Toaster
                theme="dark"
                position="top-right"
                richColors
                toastOptions={{
                    style: {
                        background: '#0a0a0a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                }}
            />
        </div>
    );
};

export default Layout;
