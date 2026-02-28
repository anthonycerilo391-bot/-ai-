import React from 'react';
import { Loader2, X, ExternalLink } from 'lucide-react';

interface Props {
  message: string;
  onCancel?: () => void;
  showLink?: boolean;
}

const LoadingOverlay: React.FC<Props> = ({ message, onCancel, showLink }) => {
  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/90 backdrop-blur-sm z-[300] flex flex-col items-center justify-center text-white">
      <div className="bg-white text-black p-10 comic-border max-w-md w-full text-center relative overflow-visible">
          {/* Cancel Button - Moved inside top-right corner for better reliability */}
          {onCancel && (
            <button 
                onClick={onCancel}
                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full border-2 border-black shadow-md z-50 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Stop / Cancel"
            >
                <X size={24} strokeWidth={3} />
            </button>
          )}

          <div className="halftone-pattern absolute inset-0 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center mt-2">
              <Loader2 className="w-16 h-16 animate-spin text-black mb-6" strokeWidth={2.5} />
              <h3 className="text-4xl font-bangers tracking-widest uppercase mb-2 animate-pulse">{message}</h3>
              <p className="text-black font-bold font-sans">AI IS THINKING... PLEASE WAIT...</p>
              
              {showLink && (
                <a 
                  href="https://www.jiguangmanying.xyz/console/task" 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-6 bg-[#FACC15] hover:bg-[#EAB308] text-black px-6 py-3 font-bold border-2 border-black hover:translate-y-1 transition-all flex items-center gap-2 uppercase tracking-wide"
                >
                  查询进度 / Check Progress <ExternalLink size={18} />
                </a>
              )}
          </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;