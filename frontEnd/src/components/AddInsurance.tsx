import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Upload, PlusSquare, Shield, Stars, ChevronRight, ShieldCheck, RefreshCcw, UserCircle, Info } from 'lucide-react';
import { insuranceAPI } from '../services/api';

const AddInsurance: React.FC = () => {
  const [insuranceName, setInsuranceName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(file.type)) {
      setError('Please select a PDF, DOCX, or TXT file');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insuranceName || !selectedFile) {
      setError('Please provide both insurance name and file');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await insuranceAPI.addInsurance(insuranceName, selectedFile);
      setSuccess('Insurance document uploaded successfully!');
      setInsuranceName('');
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload insurance document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-background font-sans text-on-background min-h-screen relative overflow-x-hidden">
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_10px_30px_rgba(0,82,204,0.08)] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary w-6 h-6" />
            <span className="text-xl font-extrabold text-primary font-display tracking-tight">InsureGlass</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors">
              <RefreshCcw className="w-5 h-5 text-slate-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors">
              <UserCircle className="w-6 h-6 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-48 px-6 max-w-3xl mx-auto relative z-10">
        <section className="mb-10 text-center">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-primary mb-3 font-display tracking-tight">
            Upload your policy documents
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-lg text-secondary">
            Our AI assistant will analyze your coverage details automatically.
          </motion.p>
          <div className="mt-6 flex items-center justify-center gap-1">
            <div className="h-1.5 w-12 liquid-progress rounded-full"></div>
            <div className="h-1.5 w-12 liquid-progress rounded-full"></div>
            <div className="h-1.5 w-12 bg-surface-container rounded-full"></div>
            <span className="ml-3 text-[10px] font-bold text-secondary uppercase tracking-widest">STEP 2 OF 3</span>
          </div>
        </section>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-xl p-8 glass-inner-glow relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                Insurance Name
              </label>
              <input
                value={insuranceName}
                onChange={(e) => setInsuranceName(e.target.value)}
                placeholder="e.g. BlueShield Health Premium"
                type="text"
                required
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 transition-all py-3 px-1 text-on-surface placeholder:text-outline/40 outline-none"
              />
            </div>

            <div className="relative">
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center text-center bg-white/30 hover:bg-white/50 transition-all cursor-pointer group">
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PlusSquare className="text-primary w-8 h-8" />
                </div>
                {selectedFile ? (
                  <>
                    <h3 className="text-xl font-bold text-on-surface font-display">{selectedFile.name}</h3>
                    <p className="text-sm text-secondary mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-on-surface mb-2 font-display">Drop your file here</h3>
                    <p className="text-sm text-secondary">Supports PDF, DOCX, TXT (Max 20MB)</p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error-container/50 border border-error/20 flex items-start gap-3">
                <Info className="text-error w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-on-error-container">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                <ShieldCheck className="text-green-600 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-green-800">{success}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button type="submit" disabled={uploading}
                className="w-full bg-primary-container text-white text-sm font-bold py-5 rounded-xl shadow-[0_8px_20px_rgba(0,82,204,0.2)] hover:shadow-[0_12px_24px_rgba(0,82,204,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60">
                <Upload className="w-5 h-5" />
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
              <button type="button" onClick={() => navigate('/chat')}
                className="w-full text-sm font-bold py-2 text-secondary hover:text-primary transition-colors flex items-center justify-center">
                Skip for now
              </button>
            </div>

            <div className="pt-4 border-t border-white/20">
              <button type="button" onClick={() => navigate('/chat')}
                className="w-full border-2 border-primary/20 hover:border-primary/40 text-primary text-sm font-bold py-5 rounded-xl backdrop-blur-sm transition-all flex items-center justify-center gap-2">
                Continue to Assistant
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-tertiary/10 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="text-tertiary w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-on-surface font-display">Secure Encryption</h4>
              <p className="text-sm text-secondary">Your data is encrypted with bank-grade security protocols.</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Stars className="text-primary w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-on-surface font-display">Instant Analysis</h4>
              <p className="text-sm text-secondary">AI extracts key dates, premiums, and coverage limits instantly.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-tertiary/10 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
};

export default AddInsurance;
