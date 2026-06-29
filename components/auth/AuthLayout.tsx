import React from 'react';
import { ArrowDown } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0c] text-[#FAFAFA] font-sans antialiased selection:bg-[#F49ACB]/30 overflow-hidden relative">
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        animation: 'bg-pan 30s linear infinite'
      }}></div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bg-pan {
          from { background-position: 0px 0px; }
          to { background-position: 24px 24px; }
        }
      `}} />

      {/* Ambient Light Source */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fad1e6] opacity-[0.06] rounded-full blur-[100px] pointer-events-none"></div>

      {/* Form Container Card */}
      <div className="w-full max-w-[400px] p-8 sm:p-10 flex flex-col bg-gradient-to-b from-[#111113] to-[#0d0d0f] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)] relative z-10 animate-in fade-in zoom-in-[0.97] slide-in-from-bottom-2 duration-300 ease-out fill-mode-both">
        
        {/* Diagonal Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-[2px] border-l-[2px] border-[#F49ACB] -translate-x-[1px] -translate-y-[1px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[2px] border-r-[2px] border-[#F49ACB] translate-x-[1px] translate-y-[1px] pointer-events-none"></div>

        {children}
      </div>
    </div>
  );
};
