import { motion } from 'motion/react';
import { RefreshCcw, UserCircle, BadgeCheck, Shield, FileText, ChevronRight, MessageSquare, AlertCircle } from 'lucide-react';
import { ViewState } from '../../types';
import { useState } from 'react';

interface CoverageViewProps {
  onNavigate: (view: ViewState) => void;
}

const POLICIES = [
  {
    id: 'progressive',
    name: 'Progressive',
    description: 'Manage your auto and bundled policies.',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtaPyBwUakb7oIisYNjY9L5mF7evrZM_x2Sc4W0-wUzqX7wuMmiFe169ymBrLye6_tmK2Mmb2Y5SB1WOq9UWKQZQD7LoFgwEZGMtzj9lHscucKkkTq77zCKMTZW0k27CYahz8vJXQbSaSd0EtPGTPwx0fmuLixTnyRojkDd0JwZtH4f4H6s1ZjuPq_mp9uVxUFLFywNMo9mGk14GZwNVdMQqqovQLore0oLBLNYHy7HkcC7r9iAOwyGgUclLnvKpNd_82coSeJ9YM',
    types: ['Auto Insurance', 'Home Insurance', 'Life Insurance'],
    icon: BadgeCheck
  },
  {
    id: 'geico',
    name: 'Geico',
    description: 'Competitive rates for various coverages.',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaGJsEs3_JDW803eKhhZCUCUDFuXKRl3eA-mGsEYupm2EK_plzm5csS9D7ifkaAu40SLMjj2uGNcRVCeqkP0hyr-eU1y9IDU9F0snNQsVF-lDo1oQGCu7oJLkza5jxZb2_lD4V5BtRU2phzwrpPeePv0xDVSwi8sO8RhmY8CyDQW5tdrZpukg6Sdvd1M_LJKMtiC_lo2PFeXeFSsOmRtrTg4uwjGkjJ9-cxSDwqtgEReD6uv6CPTnjBzFIW_zOSLOhPIaNrYW_qNg',
    types: ['Auto Insurance', 'Home Insurance', 'Life Insurance'],
    icon: Shield
  },
  {
    id: 'statefarm',
    name: 'State Farm',
    description: 'Comprehensive local agent support.',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2RVFq2Mtge8BHMgk9YLTQrAHe3UmDYyH0RDZsxwZaW6EvCk9qmuO9M1v6yEohIO9SPcMZxb1DhoCjz86nP0UaXiC25ZOiLqrMjWkoJajNsGWFYiHhpyIVdn71236ZC2s2XOQBc2Fqa18qd-BQ27HeYAs2_XXnSMy0eBGV3jPDP1mIfu8ucHolSpxtsrRw6Jv2Q-asM9DgN4dONTuoSIEkQZ4NhXipYeSLs8C5cZHe01p5E0WKzehF_r_WjYJbwfGnO7qik8HnR90',
    types: ['Auto Insurance', 'Home Insurance', 'Life Insurance'],
    icon: FileText
  }
];

export default function CoverageView({ onNavigate }: CoverageViewProps) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({
    progressive: new Set(),
    geico: new Set(['Home Insurance']),
    statefarm: new Set(['Life Insurance']),
  });

  const toggleType = (policyId: string, type: string) => {
    const next = { ...selected };
    const set = new Set(next[policyId]);
    if (set.has(type)) set.delete(type);
    else set.add(type);
    next[policyId] = set;
    setSelected(next);
  };

  const totalSelected = Object.values(selected).reduce<number>((acc, set) => acc + (set as Set<string>).size, 0);

  return (
    <div className="bg-background font-sans text-on-background min-h-screen pb-40">
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_10px_30px_rgba(0,82,204,0.08)] fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-primary font-display tracking-tight">InsureGlass</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors active:scale-95 duration-200">
            <RefreshCcw className="w-5 h-5 text-slate-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors active:scale-95 duration-200">
            <UserCircle className="w-6 h-6 text-slate-500" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-16">
        <div className="mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card bg-error-container/20 border-error/20 p-4 px-6 flex items-center gap-3 rounded-xl"
          >
            <AlertCircle className="text-error w-5 h-5" />
            <p className="text-on-error-container text-[11px] font-bold uppercase tracking-widest">
              Please select at least one policy to proceed with the synchronization.
            </p>
          </motion.div>
        </div>

        <section className="mb-16 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-primary mb-2 tracking-tight font-display"
          >
            Your Coverage
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-secondary max-w-2xl"
          >
            Select the insurance policies you currently have. We&apos;ll use this to build your transparent financial dashboard.
          </motion.p>
          
          <div className="mt-8 flex items-center gap-1">
            <div className="h-1.5 w-12 liquid-progress rounded-full"></div>
            <div className="h-1.5 w-12 bg-surface-container rounded-full"></div>
            <div className="h-1.5 w-12 bg-surface-container rounded-full"></div>
            <span className="ml-3 text-[10px] font-bold text-secondary uppercase tracking-widest leading-none">STEP 1 OF 3</span>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {POLICIES.map((policy, idx) => (
            <motion.div 
              key={policy.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="glass-card rounded-2xl p-6 flex flex-col gap-6 transition-all hover:translate-y-[-4px] hover:shadow-xl group"
            >
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-xl bg-white border border-outline-variant/30 flex items-center justify-center p-2 shadow-sm overflow-hidden">
                  <img 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain" 
                    src={policy.logo} 
                    alt={policy.name} 
                  />
                </div>
                <policy.icon className="text-outline-variant group-hover:text-primary transition-colors w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-on-surface mb-1 font-display">{policy.name}</h3>
                <p className="text-secondary text-sm">{policy.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                {policy.types.map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-primary-container/10 transition-colors">
                    <input 
                      className="w-5 h-5 rounded border-outline-variant text-primary-container focus:ring-primary cursor-pointer" 
                      type="checkbox" 
                      checked={selected[policy.id]?.has(type)}
                      onChange={() => toggleType(policy.id, type)}
                    />
                    <span className="text-sm font-medium text-on-surface">{type}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-50 px-6 pb-8 pt-4">
        <div className="max-w-6xl mx-auto glass-card rounded-2xl p-6 px-10 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,82,204,0.1)] border-t border-white/30">
          <button className="text-sm font-bold text-secondary hover:text-primary transition-colors px-6 py-3 rounded-xl active:scale-95 duration-200">
            Skip for now
          </button>
          <div className="flex items-center gap-8">
            <p className="hidden md:block text-[11px] font-bold text-secondary uppercase tracking-widest">{totalSelected} Policies Selected</p>
            <button 
              onClick={() => onNavigate('upload')}
              className="bg-primary text-white text-sm font-bold px-10 py-4 rounded-full shadow-[0_8px_20px_rgba(0,61,155,0.3)] hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center gap-2"
            >
              <span>Add {totalSelected} Selected Policies</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

      <button className="fixed bottom-36 right-8 w-16 h-16 bg-white/70 backdrop-blur-xl border border-white/40 rounded-full shadow-[0_10px_30px_rgba(0,82,204,0.15)] flex items-center justify-center text-primary-container hover:scale-110 transition-all duration-300 active:scale-90 z-40 group">
        <MessageSquare className="w-8 h-8 fill-primary-container/20 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
