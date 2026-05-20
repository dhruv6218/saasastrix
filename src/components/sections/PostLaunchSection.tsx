import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { TrendingUp } from 'lucide-react';

export const PostLaunchSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section className="py-24 md:py-40 bg-white relative overflow-hidden border-t border-gray-100" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        <div className="text-center mb-12 md:mb-20">
          <div className="text-green-600 font-mono text-sm tracking-widest uppercase mb-6 flex items-center justify-center gap-4 font-bold">
            <span className="w-8 h-[2px] bg-green-600"></span> Phase 11: The Loop <span className="w-8 h-[2px] bg-green-600"></span>
          </div>
          <h2 className="font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900">
            Did It <br/><span className="text-brand-blue">Actually Work?</span>
          </h2>
        </div>

        {/* Post Launch Card */}
        <div className={`max-w-4xl mx-auto bg-white shadow-2xl shadow-gray-200/60 border border-gray-200 rounded-3xl p-6 md:p-10 relative overflow-hidden transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-blue to-green-400"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4 md:gap-6 mt-2">
            <div>
              <h3 className="text-xl md:text-2xl font-heading font-bold text-gray-900 mb-2">SSO Integration Launch</h3>
              <p className="text-gray-500 font-mono text-xs md:text-sm font-semibold">Shipped: Oct 12 • 30-Day Measurement Window</p>
            </div>
            <div className="bg-green-50 text-green-700 border border-green-200 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-mono text-xs md:text-sm flex items-center gap-2 font-bold shadow-sm">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> Hypothesis Confirmed
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-200">
              <div className="text-gray-500 font-mono text-[10px] md:text-xs uppercase mb-3 md:mb-4 font-bold">Predicted Impact</div>
              <div className="text-lg md:text-xl font-bold text-gray-900 mb-2">Reduce Enterprise Churn</div>
              <p className="text-xs md:text-sm text-gray-600 font-medium">Expected 0 churns citing security compliance in Q4.</p>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-5 md:p-6 border border-blue-200 relative overflow-hidden shadow-inner">
              <div className="absolute -right-4 -bottom-4 opacity-10"><TrendingUp className="w-24 h-24 md:w-32 md:h-32 text-brand-blue" /></div>
              <div className="text-brand-blue font-mono text-[10px] md:text-xs uppercase mb-3 md:mb-4 font-bold">Actual Impact (30 Days)</div>
              <div className="text-2xl md:text-3xl font-heading font-black text-gray-900 mb-2">0 Churns</div>
              <p className="text-xs md:text-sm text-gray-700 font-medium relative z-10">Plus, $420k in expansion revenue unlocked from blocked accounts.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
