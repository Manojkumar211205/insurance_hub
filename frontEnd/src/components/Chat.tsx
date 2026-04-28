import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCcw, UserCircle, Stars, Send, Paperclip,
  ChevronRight, FileText, History, Star, Headset,
  ShieldCheck, X, LogOut
} from 'lucide-react';
import { agentAPI, ChatMessage, ChatResponse } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  insurance_obtained: Array<{ insurance_name: string; insurance_date: string }>;
}

interface Feedback { _id: string; [key: string]: any; }
interface ClaimRequest { _id: string; [key: string]: any; }
interface InsuranceApplication { _id: string; [key: string]: any; }

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [insuranceApplications, setInsuranceApplications] = useState<InsuranceApplication[]>([]);
  const [expandedSections, setExpandedSections] = useState({ feedbacks: false, claims: false, applications: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) { userId = 'user_' + Date.now(); localStorage.setItem('userId', userId); }
    return userId;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputMessage, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    setError('');

    try {
      const chatData: ChatMessage = { user_id: getUserId(), user_message: inputMessage };
      const response: ChatResponse = await agentAPI.chat(chatData);
      const agentMsg: Message = { id: (Date.now() + 1).toString(), text: response.reply, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, agentMsg]);
    } catch {
      setError('Failed to get response from agent. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleMemoryReset = async () => {
    if (!window.confirm('Reset conversation memory? This will clear all chat history and AI memory.')) return;
    try {
      setIsTyping(true);
      await agentAPI.clearMemory();
      setMessages([]);
      setError('');
    } catch {
      setError('Failed to clear memory. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleProfileClick = async () => {
    if (showProfile) { setShowProfile(false); return; }
    setLoadingProfile(true);
    setShowProfile(true);
    try {
      const [profile, fbRes, claimsRes, appsRes] = await Promise.all([
        agentAPI.getUserProfile(),
        agentAPI.getUserFeedbacks(),
        agentAPI.getUserClaimRequests(),
        agentAPI.getUserInsuranceApplications(),
      ]);
      setUserProfile(profile);
      setFeedbacks(fbRes.feedbacks);
      setClaimRequests(claimsRes.claim_requests);
      setInsuranceApplications(appsRes.insurance_applications);
    } catch {
      setError('Failed to load profile information');
      setShowProfile(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const profilePropertyLabels: Record<string, string> = {
    user_id: 'User ID', rating: 'Rating', comment: 'Comment',
    created_at: 'Created At', submitted_at: 'Submitted At', status: 'Status',
    insurance_name: 'Insurance', insurance_date: 'Date', description: 'Description', company_name: 'Company',
  };

  const formatProfileValue = (key: string, value: any) => {
    if (!value && value !== 0) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.includes('T') && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString();
    }
    return value;
  };

  const renderActivityDetails = (item: Record<string, any>) => (
    <div className="space-y-2">
      {Object.entries(item).filter(([k]) => k !== '_id').map(([key, value]) => (
        <div key={key} className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-secondary">{profilePropertyLabels[key] || key.replace(/_/g, ' ')}</span>
          <span className="text-sm text-on-surface break-words">{formatProfileValue(key, value)}</span>
        </div>
      ))}
    </div>
  );

  const renderMessageText = (text: string) =>
    text.split('\n').map((line, i) => <div key={i} className="leading-relaxed">{line || <br />}</div>);

  return (
    <div className="bg-background font-sans text-on-background min-h-screen flex flex-col lg:flex-row relative">

      {/* Profile Sidebar (desktop) */}
      <aside className="hidden lg:block w-80 h-screen fixed right-0 top-0 z-[60] glass-card border-l border-white/30 overflow-y-auto pt-24 px-6 space-y-8">
        {loadingProfile ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : userProfile ? (
          <>
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-primary to-blue-300 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {userProfile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface font-display">{userProfile.username}</h3>
                <p className="text-secondary text-sm">{userProfile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/50 p-4 rounded-xl text-center border border-white/40">
                <p className="text-primary font-bold text-xl">{userProfile.insurance_obtained.length}</p>
                <p className="text-[9px] font-bold text-secondary uppercase tracking-wider">ACTIVE POLICIES</p>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl text-center border border-white/40">
                <p className="text-primary font-bold text-xl">{claimRequests.length}</p>
                <p className="text-[9px] font-bold text-secondary uppercase tracking-wider">OPEN CLAIMS</p>
              </div>
            </div>

            {/* Accordion sections */}
            <div className="space-y-3">
              {/* Applications */}
              <div className="border border-white/60 rounded-xl overflow-hidden">
                <button onClick={() => toggleSection('applications')}
                  className="w-full flex items-center justify-between p-4 bg-white/40 hover:bg-white/70 transition-all">
                  <div className="flex items-center gap-3 text-on-surface">
                    <FileText className="text-primary w-5 h-5" />
                    <span className="font-semibold text-sm">Applications</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{insuranceApplications.length}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSections.applications ? 'rotate-90' : ''}`} />
                </button>
                {expandedSections.applications && (
                  <div className="border-t border-white/40 bg-white/20 p-3 space-y-2 max-h-56 overflow-y-auto">
                    {insuranceApplications.length > 0 ? insuranceApplications.map((app, i) => (
                      <div key={app._id || i} className="bg-white/70 rounded-lg p-3 border border-white/50 text-sm">
                        {renderActivityDetails(app)}
                      </div>
                    )) : <p className="text-secondary text-xs text-center py-4">No applications yet</p>}
                  </div>
                )}
              </div>

              {/* Claims */}
              <div className="border border-white/60 rounded-xl overflow-hidden">
                <button onClick={() => toggleSection('claims')}
                  className="w-full flex items-center justify-between p-4 bg-white/40 hover:bg-white/70 transition-all">
                  <div className="flex items-center gap-3 text-on-surface">
                    <History className="text-primary w-5 h-5" />
                    <span className="font-semibold text-sm">Claims History</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{claimRequests.length}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSections.claims ? 'rotate-90' : ''}`} />
                </button>
                {expandedSections.claims && (
                  <div className="border-t border-white/40 bg-white/20 p-3 space-y-2 max-h-56 overflow-y-auto">
                    {claimRequests.length > 0 ? claimRequests.map((c, i) => (
                      <div key={c._id || i} className="bg-white/70 rounded-lg p-3 border border-white/50 text-sm">
                        {renderActivityDetails(c)}
                      </div>
                    )) : <p className="text-secondary text-xs text-center py-4">No claims yet</p>}
                  </div>
                )}
              </div>

              {/* Feedbacks */}
              <div className="border border-white/60 rounded-xl overflow-hidden">
                <button onClick={() => toggleSection('feedbacks')}
                  className="w-full flex items-center justify-between p-4 bg-white/40 hover:bg-white/70 transition-all">
                  <div className="flex items-center gap-3 text-on-surface">
                    <Star className="text-primary w-5 h-5" />
                    <span className="font-semibold text-sm">Feedbacks</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{feedbacks.length}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSections.feedbacks ? 'rotate-90' : ''}`} />
                </button>
                {expandedSections.feedbacks && (
                  <div className="border-t border-white/40 bg-white/20 p-3 space-y-2 max-h-56 overflow-y-auto">
                    {feedbacks.length > 0 ? feedbacks.map((fb, i) => (
                      <div key={fb._id || i} className="bg-white/70 rounded-lg p-3 border border-white/50 text-sm">
                        {renderActivityDetails(fb)}
                      </div>
                    )) : <p className="text-secondary text-xs text-center py-4">No feedbacks yet</p>}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 space-y-4">
            <UserCircle className="w-16 h-16 text-outline mx-auto" />
            <p className="text-secondary text-sm">Click the profile button to load your info</p>
          </div>
        )}
      </aside>

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-[0_10px_30px_rgba(0,82,204,0.08)] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-6 py-4 w-full lg:pr-[calc(20rem+1.5rem)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary w-6 h-6" />
            <h1 className="text-xl font-extrabold text-primary font-display tracking-tight">InsureGlass</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleMemoryReset} title="Reset memory"
              className="p-2 rounded-full hover:bg-blue-50/50 transition-colors active:scale-95">
              <RefreshCcw className="w-5 h-5 text-slate-500" />
            </button>
            <button onClick={handleProfileClick} title="View profile"
              className="p-2 rounded-full hover:bg-blue-50/50 transition-colors active:scale-95">
              <UserCircle className="w-6 h-6 text-slate-500" />
            </button>
            <button onClick={handleLogout} title="Logout"
              className="p-2 rounded-full hover:bg-red-50 transition-colors active:scale-95">
              <LogOut className="w-5 h-5 text-slate-500 hover:text-error" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile profile modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-on-surface font-display">Your Profile</h3>
                <button onClick={() => setShowProfile(false)} className="p-2 rounded-full hover:bg-surface-container">
                  <X className="w-5 h-5 text-secondary" />
                </button>
              </div>
              {loadingProfile ? (
                <div className="flex justify-center py-10">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : userProfile ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-blue-300 flex items-center justify-center text-white text-2xl font-bold">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface text-lg">{userProfile.username}</h4>
                      <p className="text-secondary text-sm">{userProfile.email}</p>
                    </div>
                  </div>

                  {/* Policies */}
                  <div>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Insurance Policies</p>
                    {userProfile.insurance_obtained.length > 0 ? (
                      <div className="space-y-2">
                        {userProfile.insurance_obtained.map((ins, i) => (
                          <div key={i} className="bg-blue-50 rounded-lg p-3 flex justify-between items-center border border-blue-100">
                            <span className="font-medium text-on-surface text-sm">{ins.insurance_name}</span>
                            <span className="text-xs text-secondary">{new Date(ins.insurance_date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-secondary text-sm">No policies added yet</p>}
                  </div>

                  {/* Mobile accordions */}
                  <div className="space-y-3">
                    {[
                      { key: 'applications' as const, label: 'Applications', icon: FileText, data: insuranceApplications },
                      { key: 'claims' as const, label: 'Claims History', icon: History, data: claimRequests },
                      { key: 'feedbacks' as const, label: 'Feedbacks', icon: Star, data: feedbacks },
                    ].map(({ key, label, icon: Icon, data }) => (
                      <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => toggleSection(key)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-all">
                          <div className="flex items-center gap-3">
                            <Icon className="text-primary w-5 h-5" />
                            <span className="font-semibold text-sm text-on-surface">{label}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{data.length}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedSections[key] ? 'rotate-90' : ''}`} />
                        </button>
                        {expandedSections[key] && (
                          <div className="border-t border-gray-200 bg-white p-3 space-y-2 max-h-48 overflow-y-auto">
                            {data.length > 0 ? data.map((item: any, i: number) => (
                              <div key={item._id || i} className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-sm">
                                {renderActivityDetails(item)}
                              </div>
                            )) : <p className="text-secondary text-xs text-center py-4">No {label.toLowerCase()} yet</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-grow pt-24 pb-36 px-4 md:px-10 lg:mr-80 max-w-4xl mx-auto w-full space-y-6">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Stars className="w-10 h-10 text-primary fill-primary/20" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-on-surface font-display mb-2">Welcome to InsureGlass AI</h2>
              <p className="text-secondary text-lg">Your unified insurance assistant across multiple companies</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { label: 'Policy Comparison', desc: 'Compare policies across multiple insurance companies' },
                { label: 'Instant Recommendations', desc: 'Get personalized insurance recommendations' },
                { label: '24/7 Support', desc: 'Always available to answer your questions' },
              ].map(card => (
                <div key={card.label} className="glass-card glass-inner-glow rounded-xl p-4">
                  <h3 className="font-bold text-on-surface mb-1 text-sm">{card.label}</h3>
                  <p className="text-xs text-secondary">{card.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((message, i) => (
          <motion.div key={message.id}
            initial={{ opacity: 0, x: message.isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i === messages.length - 1 ? 0 : 0 }}
            className={`flex items-start gap-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            {!message.isUser && (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <Stars className="text-white w-5 h-5 fill-white" />
              </div>
            )}
            <div className={`max-w-[75%] space-y-1 ${message.isUser ? 'order-1' : 'order-2'}`}>
              <div className={`p-5 rounded-2xl shadow-sm ${
                message.isUser
                  ? 'bg-primary text-white rounded-tr-none shadow-primary/20'
                  : 'glass-card glass-inner-glow rounded-tl-none border-white/60'
              }`}>
                <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${message.isUser ? 'text-white' : 'text-on-surface'}`}>
                  {renderMessageText(message.text)}
                </div>
                <p className={`text-xs mt-2 ${message.isUser ? 'text-white/60' : 'text-secondary'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
            {message.isUser && (
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0 text-white font-bold order-2">
                U
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4 max-w-[75%]">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <Stars className="text-white w-5 h-5 fill-white" />
            </div>
            <div className="glass-card glass-inner-glow p-5 rounded-2xl rounded-tl-none border-dashed border-primary/30 flex items-center gap-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(d => (
                  <motion.div key={d} animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: d * 0.2 }}
                    className="w-2 h-2 bg-primary/60 rounded-full" />
                ))}
              </div>
              <p className="text-secondary text-xs italic font-semibold uppercase tracking-wider">Assistant is thinking...</p>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="glass-card bg-error-container/60 border-error/20 text-on-error-container px-5 py-3 rounded-xl max-w-md flex items-center gap-3">
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Floating action button */}
      <div className="fixed bottom-32 right-8 z-40 hidden lg:block">
        <button className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all">
          <Headset className="w-7 h-7" />
        </button>
      </div>

      {/* Input Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-t border-white/30 shadow-[0_-10px_40px_rgba(0,82,204,0.1)] pb-8 pt-4 px-6 lg:pr-[calc(20rem+1.5rem)]">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-4">
          <button type="button"
            className="w-12 h-12 flex items-center justify-center rounded-full glass-card border-white/60 text-slate-500 hover:text-primary transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Message InsureGlass assistant..."
              disabled={isTyping}
              className="w-full bg-white/50 border border-white/60 focus:border-primary focus:ring-0 focus:bg-white rounded-full px-8 py-4 text-base font-medium shadow-inner transition-all outline-none placeholder:text-slate-400 disabled:opacity-60"
            />
            <button type="submit" disabled={!inputMessage.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50">
              <Send className="w-5 h-5 fill-white" />
            </button>
          </div>
        </form>
        <p className="text-[10px] text-secondary text-center mt-2 uppercase tracking-widest opacity-60">
          Powered by multi-company insurance AI · Secure & Private
        </p>
      </footer>
    </div>
  );
};

export default Chat;
