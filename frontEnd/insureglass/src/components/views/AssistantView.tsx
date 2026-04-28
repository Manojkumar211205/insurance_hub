import { motion } from 'motion/react';
import { RefreshCcw, UserCircle, Stars, Send, Paperclip, CloudOff, ChevronRight, FileText, History, Star, Headset } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AssistantView() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hello! I'm your InsureGlass assistant. How can I help you manage your policies today? You can ask about claims, premium dates, or update your information.",
      suggestions: ['Check Claim Status', 'View Policy']
    },
    {
      id: 2,
      role: 'user',
      content: "I'd like to check the status of my recent auto glass claim #AG-8821."
    }
  ]);

  const [isThinking, setIsThinking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsThinking(false);
      setMessages(prev => [...prev, {
        id: 3,
        role: 'assistant',
        content: "I've found your claim. Here is the current status:",
        claim: {
          id: '#AG-8821',
          type: 'AUTO GLASS REPLACEMENT',
          status: 'IN REVIEW',
          progress: 65,
          label: 'Verification'
        }
      }]);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-background font-sans text-on-background min-h-screen flex flex-col lg:flex-row relative">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:block w-80 h-screen fixed right-0 top-0 z-[60] glass-card border-l border-white/30 overflow-y-auto pt-24 px-6 space-y-10">
        {/* Profile */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full mx-auto p-1 bg-gradient-to-tr from-primary to-blue-300 shadow-xl">
            <img 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3ymuMZgFJXUTnoMRHztPOSquVJFombexas6Kq8_FhSkhBI-NFCGHT4NpY19D-YZU-cQxxz3vdDXOoamJNjCvt-QtSS1Gpw_lzbhk-ry9VM9wXy4ZDAFds30vf8cN7W5L2Q4FIFAFcXvJWhdOOhVo39Xv01nGrBA6grnSCaKcpn0y7B6H8pXKv419l-3RbE4Dd1tiHxbyDrU1Y4-jBglZil4LO0WITC-v-sC_JFQNYvz76JVKgZ9AD6jvUx5rfCyqpkPjSpRSLm_8" 
              alt="Alex Thompson" 
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-on-surface font-display">Alex Thompson</h3>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] mt-1">MEMBER SINCE 2021</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50/50 p-4 rounded-xl text-center border border-white/40">
            <p className="text-primary font-bold text-xl">3</p>
            <p className="text-[9px] font-bold text-secondary uppercase tracking-wider">ACTIVE POLICIES</p>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-xl text-center border border-white/40">
            <p className="text-primary font-bold text-xl">1</p>
            <p className="text-[9px] font-bold text-secondary uppercase tracking-wider">OPEN CLAIMS</p>
          </div>
        </div>

        {/* Action Links */}
        <div className="space-y-3">
          {[
            { icon: FileText, label: 'Applications' },
            { icon: History, label: 'Claims History' },
            { icon: Star, label: 'Give Feedback' }
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-xl hover:bg-white/80 transition-all group">
              <div className="flex items-center gap-3 text-on-surface">
                <item.icon className="text-primary w-5 h-5" />
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>

        {/* Promo Card */}
        <div className="rounded-2xl overflow-hidden relative h-40 flex items-end p-6 group cursor-pointer shadow-xl">
          <img 
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAowsvJewGWmqZh-W6qe5sAmWRSGW9MQO-d9_Tar2ye8TPWS9sbGndFeD95chHo6JJpDtch2RJWbd8xNMYi28sdWX4GZOXq_3rIP8HZJFXcKSPKLneXA_F7EUHieoUw3ACllCvL0BLKxeipicN61PMNQ4iRK8_qYcr30iaXP-UjXOxrYHiK6KtBgbXKgpi7uRmZ2rkRQ5sbfgGFPiS3pNt2xlMur7hS-webiKdeKNbNoX9OyDJuRCUw48WJXcu_q31F8tlUUuOlfFU" 
            alt="Promotion" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="relative z-10 space-y-1">
            <p className="text-white text-[10px] font-bold uppercase tracking-wider">Upgrade Policy</p>
            <p className="text-white/80 text-[12px] font-medium leading-tight">Home insurance with glass protection premium.</p>
          </div>
        </div>
      </aside>

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_10px_30px_rgba(0,82,204,0.08)] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-6 py-4 w-full">
          <h1 className="text-xl font-extrabold text-primary font-display tracking-tight">InsureGlass</h1>
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

      {/* Main Chat Area */}
      <main className="flex-grow pt-32 pb-40 px-4 md:px-10 lg:mr-80 max-w-4xl mx-auto w-full space-y-8">
        {/* Warning Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card bg-error-container/80 border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse shadow-sm"
        >
          <CloudOff className="text-error w-5 h-5" />
          <p className="text-on-error-container text-[11px] font-bold uppercase tracking-[0.1em]">Syncing connection... Some features may be limited.</p>
        </motion.div>

        {messages.map((msg, i) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <Stars className="text-white w-5 h-5 fill-white" />
              </div>
            )}

            <div className={`space-y-4 max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
              <div className={`p-6 rounded-2xl shadow-sm glass-inner-glow ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none shadow-primary/20' 
                  : 'glass-card rounded-tl-none border-white/60'
              }`}>
                <p className="text-sm md:text-base font-medium leading-relaxed">{msg.content}</p>
                
                {msg.suggestions && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.suggestions.map(s => (
                      <button key={s} className="px-4 py-1.5 border border-primary/20 rounded-full text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/5 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.claim && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/50 border border-white/40 rounded-2xl p-6 shadow-sm relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-primary font-display leading-none">{msg.claim.id}</h4>
                      <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mt-1">{msg.claim.type}</p>
                    </div>
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">
                      {msg.claim.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-secondary uppercase tracking-widest">
                      <span>{msg.claim.label}</span>
                      <span>{msg.claim.progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden p-[2px] border border-white/40">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${msg.claim.progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-400 to-primary rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container shrink-0 border-2 border-white shadow-md order-2">
                <img 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxLuLo4HroLQ_WIXsFXDemMNyobMrB_ZgHTSKhmeUQanU_Np1RVkp8cVordGu3xoHziNByOdMRRGotnBjjzRGc4XX5ERYgfEduYHzDOginxcgdXZGC2p-Y1h3D8AviWdMPmsnPNyivR_ZHuHqz4buHjNbFpQ9h-g8X7X9Ufj7tW8Uo4WIdWVcumaZ6d0DSENGKvslgOMhC8y_fbBzUCpdXRLZeNaYavlnGO-23AxGvEaH_BBX2BRvwhTS8wYV5z4b1VePreAac8m8" 
                  alt="User" 
                />
              </div>
            )}
          </motion.div>
        ))}

        {isThinking && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4 max-w-[85%]"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <Stars className="text-white w-5 h-5 fill-white" />
            </div>
            <div className="glass-card inner-glow p-6 rounded-2xl rounded-tl-none border-dashed border-primary/30 flex items-center gap-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(d => (
                  <motion.div 
                    key={d}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: d * 0.2 }}
                    className="w-2 h-2 bg-primary/60 rounded-full"
                  />
                ))}
              </div>
              <p className="text-secondary text-xs italic font-semibold uppercase tracking-wider">Assistant is thinking...</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-32 right-8 z-40 hidden lg:block">
        <button className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all">
          <Headset className="w-8 h-8" />
        </button>
      </div>

      {/* Interactive Input Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-t border-white/30 shadow-[0_-10px_40px_rgba(0,82,204,0.1)] pb-10 pt-4 px-6 lg:pr-80">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button className="w-14 h-14 flex items-center justify-center rounded-full glass-card border-white/60 text-slate-500 hover:text-primary transition-colors">
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <input 
              className="w-full bg-white/50 border border-white/60 focus:border-primary focus:ring-0 focus:bg-white rounded-full px-8 py-5 text-base font-medium shadow-inner transition-all outline-none placeholder:text-slate-400" 
              placeholder="Message InsureGlass assistant..." 
              type="text"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
              <Send className="w-6 h-6 fill-white" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
