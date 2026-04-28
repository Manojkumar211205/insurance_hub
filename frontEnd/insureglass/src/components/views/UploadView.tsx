import { motion } from 'motion/react';
import { RefreshCcw, UserCircle, Upload, MessageSquare, Briefcase, PlusSquare, User, Shield, Stars, CheckCircle, ChevronRight } from 'lucide-react';
import { ViewState } from '../../types';

interface UploadViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function UploadView({ onNavigate }: UploadViewProps) {
  return (
    <div className="bg-background font-sans text-on-background min-h-screen relative overflow-x-hidden">
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_10px_30px_rgba(0,82,204,0.08)] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="text-xl font-extrabold text-primary font-display tracking-tight">InsureGlass</div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors active:scale-95 duration-200">
              <RefreshCcw className="w-5 h-5 text-slate-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors active:scale-95 duration-200">
              <UserCircle className="w-6 h-6 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-48 px-6 max-w-3xl mx-auto relative z-10">
        <section className="mb-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-primary mb-3 font-display tracking-tight"
          >
            Upload your policy documents
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-secondary"
          >
            Our AI assistant will analyze your coverage details automatically.
          </motion.p>
        </section>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-xl p-8 glass-inner-glow relative overflow-hidden shadow-2xl"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="space-y-10 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Insurance Name</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 transition-all py-3 px-1 text-on-surface placeholder:text-outline/40" 
                placeholder="e.g. BlueShield Health Premium" 
                type="text"
              />
            </div>

            <div className="relative">
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-16 flex flex-col items-center justify-center text-center bg-white/30 hover:bg-white/50 transition-all cursor-pointer group">
                <input className="absolute inset-0 opacity-0 cursor-pointer" id="file-upload" type="file" />
                <div className="w-20 h-20 bg-primary-container/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <PlusSquare className="text-primary w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold text-on-surface mb-2 font-display">Drop your files here</h3>
                <p className="text-sm text-secondary">Supports PDF, DOCX, TXT (Max 20MB)</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                className="w-full bg-primary-container text-white text-sm font-bold py-5 rounded-xl shadow-[0_8px_20px_rgba(0,82,204,0.2)] hover:shadow-[0_12px_24px_rgba(0,82,204,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <Upload className="w-5 h-5" />
                Upload
              </button>
              <button className="w-full text-sm font-bold py-2 text-secondary hover:text-primary transition-colors flex items-center justify-center">
                Skip for now
              </button>
            </div>

            <div className="pt-4 border-t border-white/20">
              <button 
                onClick={() => onNavigate('assistant')}
                className="w-full border-2 border-primary/20 hover:border-primary/40 text-primary text-sm font-bold py-5 rounded-xl backdrop-blur-sm transition-all flex items-center justify-center gap-2"
              >
                Continue to Assistant
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-tertiary/10 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="text-tertiary w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-on-surface font-display">Secure Encryption</h4>
              <p className="text-sm text-secondary">Your data is encrypted with bank-grade security protocols.</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Stars className="text-primary w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-on-surface font-display">Instant Analysis</h4>
              <p className="text-sm text-secondary">AI extracts key dates, premiums, and coverage limits instantly.</p>
            </div>
          </div>
        </div>
      </main>

      <nav className="bg-white/70 backdrop-blur-xl fixed bottom-0 w-full z-50 rounded-t-3xl border-t border-white/20 shadow-[0_-10px_40px_rgba(0,82,204,0.1)]">
        <div className="max-w-7xl mx-auto flex justify-around items-center px-4 pb-8 pt-4">
          <div className="flex flex-col items-center justify-center text-slate-400 opacity-70 hover:opacity-100 transition-all cursor-pointer">
            <MessageSquare className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Assistant</span>
          </div>
          <div className="flex flex-col items-center justify-center text-slate-400 opacity-70 hover:opacity-100 transition-all cursor-pointer">
            <Briefcase className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Policies</span>
          </div>
          <div className="flex flex-col items-center justify-center text-primary-container scale-110 transition-transform cursor-pointer">
            <div className="p-3 bg-primary-container/10 rounded-xl mb-1">
              <PlusSquare className="w-6 h-6 fill-primary-container/20" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
          </div>
          <div className="flex flex-col items-center justify-center text-slate-400 opacity-70 hover:opacity-100 transition-all cursor-pointer">
            <User className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Account</span>
          </div>
        </div>
      </nav>

      {/* Decorative background shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-tertiary/10 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}
