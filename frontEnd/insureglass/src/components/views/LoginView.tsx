import { motion } from 'motion/react';
import { Mail, Lock, LogIn, RefreshCcw, UserCircle } from 'lucide-react';
import { ViewState } from '../../types';

interface LoginViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function LoginView({ onNavigate }: LoginViewProps) {
  return (
    <div className="bg-abstract min-h-screen flex flex-col font-sans text-on-background antialiased relative overflow-hidden">
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_10px_30px_rgba(0,82,204,0.08)] fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4">
        <div className="text-xl font-extrabold text-primary font-display tracking-tight">InsureGlass</div>
        <div className="flex gap-4">
          <button className="hover:bg-blue-50/50 p-2 rounded-full transition-colors active:scale-95 duration-200">
            <RefreshCcw className="w-5 h-5 text-primary" />
          </button>
          <button className="hover:bg-blue-50/50 p-2 rounded-full transition-colors active:scale-95 duration-200">
            <UserCircle className="w-6 h-6 text-primary" />
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-16 mt-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel w-full max-w-[480px] rounded-xl p-8 md:p-10 bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl glass-inner-glow"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-container/10 mb-6">
              <UserCircle className="w-10 h-10 text-primary-container" />
            </div>
            <h1 className="text-3xl font-bold text-on-background mb-1 font-display">Welcome Back</h1>
            <p className="text-secondary">Sign in to access your insurance assistant</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onNavigate('coverage'); }}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block ml-1" htmlFor="email">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-container transition-colors w-5 h-5" />
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-outline-variant focus:border-primary-container focus:ring-0 rounded-xl transition-all outline-none text-on-surface placeholder:text-outline/50" 
                  id="email" 
                  placeholder="name@example.com" 
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block" htmlFor="password">Password</label>
                <button type="button" className="text-[10px] font-bold text-primary-container hover:underline uppercase tracking-widest">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-container transition-colors w-5 h-5" />
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-outline-variant focus:border-primary-container focus:ring-0 rounded-xl transition-all outline-none text-on-surface placeholder:text-outline/50" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-1 py-1">
              <input 
                className="w-5 h-5 rounded border-outline-variant text-primary-container focus:ring-primary-container bg-white/50 cursor-pointer" 
                id="remember" 
                type="checkbox"
              />
              <label className="text-sm text-secondary select-none cursor-pointer" htmlFor="remember">Remember this device</label>
            </div>

            <button 
              className="liquid-gradient w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg" 
              type="submit"
            >
              <span>Sign in</span>
              <LogIn className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/30 text-center">
            <p className="text-secondary text-sm">
              Don't have an account? 
              <button onClick={() => onNavigate('signup')} className="text-primary-container font-bold hover:underline ml-2">Sign up</button>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Decorative segments */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-blue-100/30 blur-[100px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/20 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20 mask-linear-to-t">
          <img 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter grayscale brightness-150" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfm-2DUYZ-F47DG1cHE3WVIuP7bJTOG7a27z15f60_Htu5fKM9HXVE_gjR6s-K-F9K0ejbPYpswJ_sEk4sdgE2pT5bpeZu9wOwQt1GVfst1Y8V5c9aA2Yis5WIk6mVr1Q83rivbu6XVqNbvVGuFEa8yvFu7lBTiCfso8sWD4ZaCUAtvX35W0WiKysGuqr4dC1kHr4W6LDXh2fa04xQi6-l2n5dY8zf6rjOlVuMlFY8uBeC753UAXCvZo5dR2Ey5DTmF8oIM9kHJIE" 
            alt="Abstract Background"
          />
        </div>
      </div>

      <footer className="mt-auto py-8 text-center opacity-40 relative z-10">
        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-none">© 2024 InsureGlass. Secure Glassmorphic Insurance Solutions.</span>
      </footer>
    </div>
  );
}
