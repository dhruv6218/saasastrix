import React from 'react';
import { Lock, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description: string;
  requiredPlan?: 'Starter' | 'Growth' | 'Scale';
  bullets: string[];
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  feature,
  description,
  requiredPlan = 'Starter',
  bullets,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const planColors: Record<string, string> = {
    Starter: 'from-brand-blue to-blue-500',
    Growth: 'from-purple-600 to-purple-400',
    Scale: 'from-astrix-teal to-emerald-400',
  };

  const gradient = planColors[requiredPlan] || planColors['Starter'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out]">

        {/* Top accent bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Icon + plan badge */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}>
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-gradient-to-r ${gradient} text-white px-3 py-1 rounded-full mb-2`}>
                <Sparkles className="w-3 h-3" /> {requiredPlan} Plan
              </span>
              <h2 className="font-heading text-xl font-bold text-gray-900 leading-tight">{feature}</h2>
            </div>
          </div>

          <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">{description}</p>

          {/* Feature bullets */}
          <ul className="space-y-2.5 mb-8">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Check className="w-3 h-3 text-white" />
                </div>
                {b}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={() => { onClose(); navigate('/pricing'); }}
              className={`w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r ${gradient} hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md`}
            >
              See all plans <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
