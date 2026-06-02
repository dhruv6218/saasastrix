import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Check, HelpCircle, Loader2, Sparkles, Minus } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

export const Pricing = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollReveal(0.1);
  const { ref: tableRef, isVisible: tableVisible } = useScrollReveal(0.05);

  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: "Free",
      monthlyPrice: "$0",
      annualPrice: "$0",
      period: "/month",
      annualBilled: "Free forever",
      desc: "For solo founders and PMs completing their first evidence-based product loop.",
      features: [
        "1 workspace · 2 maker seats",
        "Up to 200 signals & 50 accounts",
        "Up to 10 active problems",
        "Top 5 opportunities (no compare)",
        "Max 1 active launch, 3 lifetime",
        "~100 AI calls/month",
        "Basic AI: signal suggestions & 1× memo per decision",
        "1 CSV upload per entity type",
      ],
      comingSoon: [],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Starter",
      monthlyPrice: "$59",
      annualPrice: "$49",
      period: "/month",
      annualBilled: "Billed $588 yearly",
      desc: "Run outcome-driven product rituals for a small team.",
      features: [
        "1 workspace · 3 maker seats",
        "Up to 3,000 signals & 500 accounts",
        "Up to 50 active problems",
        "Full opportunity list + compare mode",
        "Up to 5 active launches, unlimited completed",
        "~1,500 AI calls/month",
        "Decision memo, PRD & user story drafts",
        "Multiple CSV uploads + account matching",
        "Launch & verdict dashboard widgets",
        "Email support",
      ],
      comingSoon: [],
      cta: "Start with Starter",
      popular: true
    },
    {
      name: "Growth",
      monthlyPrice: "$179",
      annualPrice: "$149",
      period: "/month",
      annualBilled: "Billed $1,789 yearly",
      desc: "Make accountability a default in your product org.",
      features: [
        "Up to 3 workspaces · 8 maker seats",
        "Up to 15,000 signals & 2,000 accounts",
        "Up to 150 active problems",
        "Opportunity saved views & filters",
        "Decision tags (Theme, OKR link)",
        "Up to 15 active launches, unlimited completed",
        "~4,000 AI calls/month · higher-quality models",
        "Accountability dashboard (verdicts, ARR)",
        "Required verdict enforcement toggle",
        "Basic activity log",
        "Priority email support",
      ],
      comingSoon: [],
      cta: "Start with Growth",
      popular: false
    },
    {
      name: "Scale",
      monthlyPrice: "$449",
      annualPrice: "$374",
      period: "/month",
      annualBilled: "Billed $4,489 yearly",
      desc: "Evidence-backed bets and accountability, at org scale.",
      features: [
        "Unlimited workspaces · 20 maker seats",
        "Up to 100,000 signals & 10,000 accounts",
        "Up to 500 active problems",
        "Custom score views + opportunity export",
        "Decision & launch templates by squad",
        "Unlimited active launches",
        "~10,000 AI calls/month · top-tier models",
        "Executive & Board view (bets, win/loss, ARR)",
        "Granular roles (Owner, Admin, Maker, Read-only)",
        "Advanced activity log + audit trail export",
        "High-priority support + onboarding session",
      ],
      comingSoon: [
        "Jira Two-Way Sync"
      ],
      cta: "Start with Scale",
      popular: false
    }
  ];

  type CellValue = string | boolean | null;

  const comparisonCategories: {
    label: string;
    rows: { feature: string; values: CellValue[] }[];
  }[] = [
    {
      label: "Workspace & Seats",
      rows: [
        { feature: "Workspaces", values: ["1", "1", "Up to 3", "Unlimited"] },
        { feature: "Maker Seats", values: ["2", "3", "8", "20"] },
      ]
    },
    {
      label: "Signals & Data",
      rows: [
        { feature: "Signals", values: ["200", "3,000", "15,000", "100,000"] },
        { feature: "Accounts", values: ["50", "500", "2,000", "10,000"] },
        { feature: "Active Problems", values: ["10", "50", "150", "500"] },
        { feature: "CSV Uploads", values: ["1 per type", "Multiple", "Multiple", "Multiple"] },
        { feature: "Auto Account Matching", values: [false, true, true, true] },
      ]
    },
    {
      label: "Opportunities",
      rows: [
        { feature: "Opportunity Visibility", values: ["Top 5 only", "Full list", "Full list", "Full list"] },
        { feature: "Compare Mode", values: [false, true, true, true] },
        { feature: "Saved Views & Filters", values: [false, false, true, true] },
        { feature: "Custom Score Views", values: [false, false, false, true] },
        { feature: "Opportunity Export", values: [false, false, false, true] },
      ]
    },
    {
      label: "Launches & Outcomes",
      rows: [
        { feature: "Active Launches", values: ["1", "5", "15", "Unlimited"] },
        { feature: "Completed Launches", values: ["3 lifetime", "Unlimited", "Unlimited", "Unlimited"] },
        { feature: "Day 7 / 30 Outcome Reviews", values: [true, true, true, true] },
        { feature: "Verdict Dashboard Widgets", values: [false, true, true, true] },
        { feature: "Accountability Dashboard", values: [false, "Basic", "Full (ARR, segments)", "Exec + Board view"] },
        { feature: "Required Verdict Enforcement", values: [false, false, true, true] },
        { feature: "Decision Tags (Theme, OKR)", values: [false, false, true, true] },
        { feature: "Decision & Launch Templates", values: [false, false, false, true] },
      ]
    },
    {
      label: "AI",
      rows: [
        { feature: "AI Calls / Month", values: ["~100", "~1,500", "~4,000", "~10,000"] },
        { feature: "Signal Suggestions", values: [true, true, true, true] },
        { feature: "Decision Memo & PRD Drafts", values: ["1× per decision", true, true, "Bulk generation"] },
        { feature: "User Story Draft", values: [false, true, true, true] },
        { feature: "Model Quality", values: ["Standard", "Standard", "Higher-quality", "Top-tier"] },
      ]
    },
    {
      label: "Governance & Security",
      rows: [
        { feature: "Activity Log", values: [false, false, "Basic", "Advanced + Filters"] },
        { feature: "Audit Trail Export", values: [false, false, false, true] },
        { feature: "Granular Roles", values: [false, false, false, true] },
      ]
    },
    {
      label: "Support",
      rows: [
        { feature: "Support Level", values: ["Docs + Email", "Email", "Priority Email", "High-Priority"] },
        { feature: "Onboarding Session", values: [false, false, false, true] },
        { feature: "Weekly Summary Email", values: [false, false, true, true] },
        { feature: "Quarterly Check-in", values: [false, false, false, true] },
      ]
    },
  ];

  const faqs = [
    { q: "What counts as a 'signal'?", a: "A signal is any individual piece of feedback ingested into Astrix — a support ticket, app store review, interview note, or a row in a CSV upload." },
    { q: "What are the user roles?", a: "We keep it simple: Owners (billing & settings), Members (editors who can create decisions and artifacts), and Viewers (free, unlimited users who can read memos and track launch progress)." },
    { q: "How do I import data?", a: "Astrix supports CSV upload and manual signal entry on all plans. You can also start with a sample workspace to explore the full product loop before importing real data." },
    { q: "Does Astrix include a sample workspace?", a: "Yes. Every plan includes a sample workspace with pre-loaded signals, problems, opportunities, a decision memo, and an active launch so you can experience the full product loop immediately." },
    { q: "Is my data used to train your AI models?", a: "Absolutely not. We use enterprise APIs with strict zero-retention policies. Your workspace data is isolated and never used for training." },
    { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time from the billing settings. You will retain access until the end of your current billing period." }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCheckout = async (tier: any) => {
    if (!activeWorkspace) {
      addToast("Please log in or create an account to upgrade.", "warning");
      navigate('/signup');
      return;
    }
    setLoadingTier(tier.name);
    setTimeout(() => {
      setLoadingTier(null);
      addToast(`Redirecting to checkout for ${tier.name} plan...`, "success");
      navigate('/app/settings?tab=billing');
    }, 1500);
  };

  const renderCell = (val: CellValue, isPopular: boolean) => {
    if (val === true) return <Check className={`w-5 h-5 mx-auto ${isPopular ? 'text-brand-yellow' : 'text-brand-blue'}`} />;
    if (val === false) return <Minus className="w-4 h-4 mx-auto text-gray-300" />;
    if (val === null) return <Minus className="w-4 h-4 mx-auto text-gray-300" />;
    return <span className={`text-sm font-semibold ${isPopular ? 'text-white' : 'text-gray-700'}`}>{val}</span>;
  };

  const planColors = ['', 'bg-brand-blue', '', ''];

  return (
    <MainLayout>
      <div className="bg-gray-50 pt-20 md:pt-32 pb-24 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center" ref={headerRef}>
          <h1 className={`font-heading text-fluid-2 leading-[0.9] tracking-tighter text-gray-900 mb-6 transition-all duration-700 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Simple pricing. <br/>
            <span className="text-brand-blue">Serious value.</span>
          </h1>
          <p className={`text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto mb-10 transition-all duration-700 delay-100 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            The accountability loop for every stage of growth.
          </p>

          {/* Billing Toggle */}
          <div className={`flex items-center justify-center gap-4 transition-all duration-700 delay-200 ${headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <span className={`text-sm font-bold ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-7 bg-brand-blue rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30"
              aria-label="Toggle annual billing"
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annually <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Save ~20%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 -mt-12 relative z-10 mb-20" ref={cardsRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`relative rounded-3xl p-6 lg:p-8 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 ${cardsVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${tier.popular ? 'bg-brand-blue text-white shadow-glow-blue xl:scale-105 z-20 border-none' : 'bg-white text-gray-900 shadow-apple border border-gray-200'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-yellow text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-yellow-300/50 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <h3 className={`text-xl font-heading font-bold mb-2 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>{tier.name}</h3>
              <p className={`text-sm mb-6 h-16 font-medium ${tier.popular ? 'text-blue-100' : 'text-gray-500'}`}>{tier.desc}</p>

              <div className="mb-2">
                <span className="text-4xl lg:text-5xl font-heading font-black tracking-tighter">
                  {isAnnual ? tier.annualPrice : tier.monthlyPrice}
                </span>
                {tier.period && <span className={`text-sm font-bold ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>{tier.period}</span>}
              </div>
              <div className={`text-xs font-medium mb-8 h-4 ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>
                {isAnnual && tier.annualPrice !== "$0" ? tier.annualBilled : (tier.annualPrice === "$0" ? "Free forever" : "Billed monthly")}
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {tier.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm font-medium">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${tier.popular ? 'text-brand-yellow' : 'text-brand-blue'}`} />
                    <span className={tier.popular ? 'text-blue-50' : 'text-gray-600'}>{feat}</span>
                  </li>
                ))}
                {tier.comingSoon.map((feat, j) => (
                  <li key={`cs-${j}`} className="flex items-start gap-3 text-sm font-medium opacity-70">
                    <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${tier.popular ? 'text-blue-300' : 'text-gray-400'}`} />
                    <span className={tier.popular ? 'text-blue-100' : 'text-gray-500'}>
                      {feat} <span className="text-[10px] uppercase tracking-wider font-bold ml-1 opacity-80">(Coming Soon)</span>
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(tier)}
                disabled={loadingTier === tier.name}
                className={`w-full py-3.5 rounded-xl font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 flex items-center justify-center gap-2 ${tier.popular ? 'bg-white text-brand-blue hover:bg-gray-50 focus-visible:ring-white shadow-sm' : 'bg-gray-900 text-white hover:bg-brand-blue focus-visible:ring-brand-blue shadow-sm'} disabled:opacity-70`}
              >
                {loadingTier === tier.name ? <Loader2 className="w-5 h-5 animate-spin" /> : tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className={`max-w-[1200px] mx-auto px-4 md:px-6 mb-32 transition-all duration-700 ${tableVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} ref={tableRef}>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-bold tracking-tight text-gray-900 mb-3">Compare all features</h2>
          <p className="text-gray-500 font-medium">Everything that's included in each plan, side by side.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-apple">
          {/* Table Header */}
          <div className="grid grid-cols-5 border-b border-gray-100">
            <div className="p-5 col-span-1" />
            {tiers.map((tier, i) => (
              <div
                key={i}
                className={`p-5 text-center ${tier.popular ? 'bg-brand-blue' : ''}`}
              >
                <div className={`text-sm font-black uppercase tracking-widest mb-1 ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>{tier.name}</div>
                <div className={`text-2xl font-heading font-black tracking-tighter ${tier.popular ? 'text-white' : 'text-gray-900'}`}>
                  {isAnnual ? tier.annualPrice : tier.monthlyPrice}
                </div>
                {tier.period && (
                  <div className={`text-xs font-medium ${tier.popular ? 'text-blue-200' : 'text-gray-400'}`}>{tier.period}</div>
                )}
              </div>
            ))}
          </div>

          {/* Table Body */}
          {comparisonCategories.map((cat, ci) => (
            <div key={ci}>
              {/* Category Label */}
              <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-100">
                <div className="col-span-5 px-5 py-3">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">{cat.label}</span>
                </div>
              </div>
              {/* Rows */}
              {cat.rows.map((row, ri) => (
                <div
                  key={ri}
                  className={`grid grid-cols-5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors`}
                >
                  <div className="px-5 py-3.5 flex items-center">
                    <span className="text-sm font-medium text-gray-600">{row.feature}</span>
                  </div>
                  {row.values.map((val, vi) => (
                    <div
                      key={vi}
                      className={`px-4 py-3.5 flex items-center justify-center text-center ${tiers[vi].popular ? 'bg-brand-blue/5' : ''}`}
                    >
                      {renderCell(val, tiers[vi].popular)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          {/* CTA Row */}
          <div className="grid grid-cols-5 bg-gray-50 border-t border-gray-200">
            <div className="px-5 py-5" />
            {tiers.map((tier, i) => (
              <div key={i} className={`px-4 py-5 flex items-center justify-center ${tier.popular ? 'bg-brand-blue/5' : ''}`}>
                <button
                  onClick={() => handleCheckout(tier)}
                  disabled={loadingTier === tier.name}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none flex items-center justify-center gap-2 ${tier.popular ? 'bg-brand-blue text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-900 text-white hover:bg-brand-blue shadow-sm'} disabled:opacity-70`}
                >
                  {loadingTier === tier.name ? <Loader2 className="w-4 h-4 animate-spin" /> : tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-[800px] mx-auto px-6 md:px-12 mb-32">
        <div className="flex items-center justify-center gap-3 mb-12">
          <HelpCircle className="w-6 h-6 text-brand-blue" />
          <h3 className="text-3xl font-heading font-bold text-center tracking-tight">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-brand-blue/30 transition-colors">
              <button
                className="w-full p-6 text-left flex justify-between items-center focus-visible:outline-none focus-visible:bg-gray-50 group"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{faq.q}</span>
                <span className={`transform transition-transform duration-300 text-gray-400 group-hover:text-brand-blue ${openFaq === i ? 'rotate-180' : ''}`}>↓</span>
              </button>
              <div
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="text-gray-600 text-sm font-medium leading-relaxed px-6 pb-6 pt-2">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </MainLayout>
  );
};
