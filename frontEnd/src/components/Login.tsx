import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserCircle, ShieldCheck } from 'lucide-react';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.signin({ email, password });
      localStorage.setItem('token', response.access_token);
      navigate('/setup');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-abstract min-h-screen flex flex-col font-sans text-on-background antialiased relative overflow-hidden">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_10px_30px_rgba(0,82,204,0.08)] fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary w-6 h-6" />
          <span className="text-xl font-extrabold text-primary font-display tracking-tight">InsureGlass</span>
        </div>
        <UserCircle className="w-6 h-6 text-primary" />
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-16 mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card glass-inner-glow w-full max-w-[480px] rounded-2xl p-8 md:p-10"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <UserCircle className="w-10 h-10 text-primary-container" />
            </div>
            <h1 className="text-3xl font-bold text-on-background mb-1 font-display">Welcome Back</h1>
            <p className="text-secondary">Sign in to access your insurance assistant</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-container transition-colors w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-outline-variant focus:border-primary-container focus:ring-0 rounded-xl transition-all outline-none text-on-surface placeholder:text-outline/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-container transition-colors w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-outline-variant focus:border-primary-container focus:ring-0 rounded-xl transition-all outline-none text-on-surface placeholder:text-outline/50"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-error-container/60 border border-error/20 text-on-error-container px-4 py-3 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="liquid-gradient w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-60"
            >
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              {!loading && <LogIn className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/30 text-center">
            <p className="text-secondary text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-container font-bold hover:underline ml-1">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-blue-100/30 blur-[100px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/20 blur-[120px]"></div>
      </div>

      <footer className="mt-auto py-8 text-center opacity-40 relative z-10">
        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">© 2025 InsureGlass. Secure Insurance Solutions.</span>
      </footer>
    </div>
  );
};

export default Login;
