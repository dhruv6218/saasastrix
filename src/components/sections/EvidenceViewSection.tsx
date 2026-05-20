import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Quote } from 'lucide-react';

export const EvidenceViewSection = () => {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <section className="py-24 md:py-40 bg-white relative overflow-hidden border-t border-gray-100" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
        
        {/* Left: Narrative */}
        <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
          <div className="text-brand-yellow font-mono text-sm tracking-widest uppercase mb-6 flex items-center gap-4 font-bold">
            <span className="w-8 h-[2px] bg-brand-yellow"></span> Phase 07: The Receipts
          </div>
          <h2 className="font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900 mb-6 md:mb-8">
            Never Lose <br/>
            <span className="text-brand-blue">The Context.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 font-medium mb-8">
            Every canonical problem is backed by raw, traceable evidence. Drill down into exact quotes, sentiment distribution, and affected accounts before making a call.
          </p>
        </div>

        {/* Right: Evidence Card */}
        <div className={`relative bg-white border border-gray-200 shadow-2xl shadow-gray-200/60 rounded-3xl p-6 md:p-10 overflow-hidden transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/20 blur-3xl rounded-full"></div>
          
          <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-gray-100 pb-6">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-brand-blue to-blue-400 flex items-center justify-center font-bold text-white text-lg md:text-xl shadow-lg shadow-brand-blue/30">SJ</div>
            <div>
              <div className="text-gray-900 font-bold text-base md:text-lg">Sarah Jenkins • CloudScale</div>
              <div className="text-yellow-600 font-mono text-[10px] md:text-xs uppercase font-bold mt-1">$240k ARR • Enterprise</div>
            </div>
          </div>

          <div className="relative">
            <Quote className="absolute -top-4 -left-4 md:-top-6 md:-left-6 w-12 h-12 md:w-16 md:h-16 text-gray-100" />
            <p className="text-lg md:text-2xl text-gray-700 font-medium leading-relaxed relative z-10 italic">
              "We've been trying to integrate the new API endpoints for three weeks, but the rate limits keep blocking our massive data syncs. We cannot renew if this isn't fixed."
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
            <div className="flex flex-wrap gap-2 md:gap-3">
              <span className="bg-brand-red/10 text-brand-red text-[10px] md:text-xs px-3 py-1.5 rounded-full font-mono font-bold">Sentiment: 0.12</span>
              <span className="bg-gray-100 text-gray-600 text-[10px] md:text-xs px-3 py-1.5 rounded-full font-mono font-bold">Source: Slack</span>
            </div>
            <span className="text-gray-400 text-[10px] md:text-xs font-mono font-bold">2 days ago</span>
          </div>
        </div>

      </div>
    </section>
  );
};
