import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { RefreshCcw, UserCircle, BadgeCheck, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { insuranceAPI, AddInsuranceData } from '../services/api';

interface CompanyInsurance {
  company_name: string;
  insurance_available: string[];
}

const Setup: React.FC = () => {
  const [availableCompanies, setAvailableCompanies] = useState<CompanyInsurance[]>([]);
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchAvailableInsurances(); }, []);

  const fetchAvailableInsurances = async () => {
    setLoading(true);
    try {
      const response = await insuranceAPI.getAvailable();
      setAvailableCompanies(response.insurance_available);
    } catch {
      setError('Failed to load available insurances');
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceSelect = (name: string) => {
    setSelectedInsurances(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleConfirm = async () => {
    if (selectedInsurances.length === 0) { navigate('/add-insurance'); return; }
    setSubmitting(true);
    try {
      for (const insuranceName of selectedInsurances) {
        const data: AddInsuranceData = {
          insurance_name: insuranceName,
          insurance_date: new Date().toISOString().split('T')[0],
        };
        await insuranceAPI.addObtained(data);
      }
      navigate('/add-insurance');
    } catch {
      setError('Failed to add insurances. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-abstract min-h-screen flex items-center justify-center">
        <div className="glass-card glass-inner-glow rounded-2xl p-10 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-on-surface font-semibold">Loading available insurances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background font-sans text-on-background min-h-screen pb-40">
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_10px_30px_rgba(0,82,204,0.08)] fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary w-6 h-6" />
          <span className="text-xl font-extrabold text-primary font-display tracking-tight">InsureGlass</span>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAvailableInsurances} className="p-2 rounded-full hover:bg-blue-50/50 transition-colors">
            <RefreshCcw className="w-5 h-5 text-slate-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors">
            <UserCircle className="w-6 h-6 text-slate-500" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-16">
        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="mb-8 glass-card bg-error-container/20 border-error/20 p-4 px-6 flex items-center gap-3 rounded-xl">
            <AlertCircle className="text-error w-5 h-5" />
            <p className="text-on-error-container text-[11px] font-bold uppercase tracking-widest">{error}</p>
          </motion.div>
        )}

        <section className="mb-12 text-center md:text-left">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-primary mb-2 tracking-tight font-display">
            Your Coverage
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg text-secondary max-w-2xl">
            Select the insurance policies you currently have. We'll tailor guidance to your coverage.
          </motion.p>
          <div className="mt-6 flex items-center gap-1">
            <div className="h-1.5 w-12 liquid-progress rounded-full"></div>
            <div className="h-1.5 w-12 bg-surface-container rounded-full"></div>
            <div className="h-1.5 w-12 bg-surface-container rounded-full"></div>
            <span className="ml-3 text-[10px] font-bold text-secondary uppercase tracking-widest">STEP 1 OF 3</span>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availableCompanies.map((company, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.1 }}
              className="glass-card rounded-2xl p-6 flex flex-col gap-5 hover:-translate-y-1 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-xl bg-white border border-outline-variant/30 flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <BadgeCheck className="text-outline-variant group-hover:text-primary transition-colors w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface font-display capitalize">{company.company_name}</h3>
                <p className="text-secondary text-sm mt-1">Select your active policies</p>
              </div>
              <div className="flex flex-col gap-2">
                {company.insurance_available.map((insurance, i) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-primary/5 transition-colors">
                    <input type="checkbox"
                      checked={selectedInsurances.includes(insurance)}
                      onChange={() => handleInsuranceSelect(insurance)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-sm font-medium text-on-surface">
                      {insurance.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-50 px-6 pb-8 pt-4">
        <div className="max-w-6xl mx-auto glass-card rounded-2xl p-5 px-8 flex items-center justify-between">
          <button onClick={() => navigate('/add-insurance')}
            className="text-sm font-bold text-secondary hover:text-primary transition-colors px-6 py-3 rounded-xl active:scale-95">
            Skip for now
          </button>
          <div className="flex items-center gap-6">
            <p className="hidden md:block text-[11px] font-bold text-secondary uppercase tracking-widest">
              {selectedInsurances.length} Polic{selectedInsurances.length !== 1 ? 'ies' : 'y'} Selected
            </p>
            <button onClick={handleConfirm} disabled={submitting}
              className="bg-primary text-white text-sm font-bold px-8 py-4 rounded-full shadow-[0_8px_20px_rgba(0,61,155,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60">
              <span>{submitting ? 'Adding...' : selectedInsurances.length === 0 ? 'Continue' : `Add ${selectedInsurances.length} Selected`}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Setup;
