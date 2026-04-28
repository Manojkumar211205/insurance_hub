import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Stars, Info } from 'lucide-react';
import { authAPI } from '../services/api';

const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.signup({ username, email, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased bg-abstract">
      <header className="w-full px-6 py-8 flex justify-center items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary w-8 h-8" />
          <h1 className="text-3xl font-bold text-primary tracking-tight font-display">InsureGlass</h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-[480px] space-y-6"
        >
          <div className="glass-card glass-inner-glow rounded-2xl p-6 md:p-10">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-bold text-on-surface mb-2 font-display">Create your account</h2>
              <p className="text-secondary">Join InsureGlass for crystal clear coverage.</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-error-container/50 border border-error/20 flex items-start gap-3">
                <Info className="text-error w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-on-error-container uppercase tracking-wider">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1 uppercase tracking-wider" htmlFor="username">
                  Username
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="w-full bg-white/50 border-b-2 border-outline-variant focus:border-primary focus:bg-white focus:ring-0 transition-all pl-12 pr-4 py-3 rounded-t-lg outline-none text-on-surface placeholder:text-outline/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1 uppercase tracking-wider" htmlFor="email">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/50 border-b-2 border-outline-variant focus:border-primary focus:bg-white focus:ring-0 transition-all pl-12 pr-4 py-3 rounded-t-lg outline-none text-on-surface placeholder:text-outline/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant block ml-1 uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/50 border-b-2 border-outline-variant focus:border-primary focus:bg-white focus:ring-0 transition-all pl-12 pr-12 py-3 rounded-t-lg outline-none text-on-surface placeholder:text-outline/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl shadow-[0_4px_12px_rgba(0,61,155,0.3)] hover:shadow-[0_6px_20px_rgba(0,61,155,0.4)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-outline-variant/30 text-center">
              <p className="text-secondary">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4 ml-1">
                  Log in
                </Link>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 opacity-80">
            <div className="glass-card glass-inner-glow p-3 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">256-bit Encryption</span>
            </div>
            <div className="glass-card glass-inner-glow p-3 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 bg-tertiary rounded-full"></div>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Privacy First</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Decorative sidebar card */}
      <div className="hidden lg:block fixed left-16 bottom-16 max-w-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="glass-card glass-inner-glow p-6 rounded-xl space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Stars className="text-primary w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-on-surface font-display">Meet your AI Assistant</h3>
          <p className="text-secondary">InsureGlass uses advanced AI to translate complex policy jargon into simple, actionable insights.</p>
        </motion.div>
      </div>

      <footer className="w-full py-8 text-center opacity-50 mt-auto">
        <p className="text-[10px] font-semibold text-outline uppercase tracking-[0.1em]">© 2025 InsureGlass. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Signup;
