import React, { useState, useEffect, useRef } from 'react';
import { agentAPI, ChatMessage, ChatResponse } from '../services/api';

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
  insurance_obtained: Array<{
    insurance_name: string;
    insurance_date: string;
  }>;
}

interface Feedback {
  _id: string;
  [key: string]: any;
}

interface ClaimRequest {
  _id: string;
  [key: string]: any;
}

interface InsuranceApplication {
  _id: string;
  [key: string]: any;
}

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
  const [expandedSections, setExpandedSections] = useState({
    feedbacks: false,
    claims: false,
    applications: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close profile modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfile && !(event.target as Element).closest('.profile-modal')) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  // Generate a simple user ID (in a real app, this would come from auth)
  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now();
      localStorage.setItem('userId', userId);
    }
    return userId;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setError('');

    try {
      const chatData: ChatMessage = {
        user_id: getUserId(),
        user_message: inputMessage,
      };

      const response: ChatResponse = await agentAPI.chat(chatData);

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.reply,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (err: any) {
      setError('Failed to get response from agent');
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMemoryReset = async () => {
    if (!window.confirm('Are you sure you want to reset the conversation memory? This will clear all chat history and AI memory.')) {
      return;
    }

    try {
      setIsTyping(true);
      await agentAPI.clearMemory();
      setMessages([]);
      setError('');
      // Show success message
      setError(''); // Clear any existing errors
      // You could add a success toast here if desired
    } catch (err: any) {
      setError('Failed to clear memory. Please try again.');
      console.error('Memory reset error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleProfileClick = async () => {
    if (showProfile) {
      setShowProfile(false);
      return;
    }

    setLoadingProfile(true);
    setShowProfile(true);

    try {
      // Fetch all profile data in parallel
      const [profileResponse, feedbacksResponse, claimsResponse, applicationsResponse] = await Promise.all([
        agentAPI.getUserProfile(),
        agentAPI.getUserFeedbacks(),
        agentAPI.getUserClaimRequests(),
        agentAPI.getUserInsuranceApplications(),
      ]);

      setUserProfile(profileResponse);
      setFeedbacks(feedbacksResponse.feedbacks);
      setClaimRequests(claimsResponse.claim_requests);
      setInsuranceApplications(applicationsResponse.insurance_applications);
    } catch (err: any) {
      setError('Failed to load profile information');
      setShowProfile(false);
      console.error('Profile fetch error:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const profilePropertyLabels: Record<string, string> = {
    user_id: 'User ID',
    userid: 'User ID',
    rating: 'Rating',
    comment: 'Comment',
    created_at: 'Created At',
    submitted_at: 'Submitted At',
    status: 'Status',
    insurance_name: 'Insurance',
    insurance_date: 'Date',
    description: 'Description',
    company_name: 'Company',
  };

  const formatProfileValue = (key: string, value: any) => {
    if (!value && value !== 0) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') {
      const date = Date.parse(value);
      if (!Number.isNaN(date) && value.includes('T')) {
        return new Date(value).toLocaleString();
      }
    }
    return value;
  };

  const renderActivityDetails = (item: Record<string, any>) => (
    <div className="space-y-2">
      {Object.entries(item)
        .filter(([key]) => key !== '_id')
        .map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-gray-400">{profilePropertyLabels[key] || key.replace(/_/g, ' ')}</span>
            <span className="text-sm text-gray-800 break-words">{formatProfileValue(key, value)}</span>
          </div>
        ))}
    </div>
  );

  // Format message text with proper line breaks
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className="leading-relaxed">
        {line || <br />}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shadow-lg border-b border-indigo-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Insurance Hub AI</h1>
              <p className="text-sm text-indigo-100">Multi-Company Insurance Assistant</p>
            </div>
          </div>

          {/* Memory Reset Button */}
          <button
            onClick={handleMemoryReset}
            className="group relative px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg"
            title="Reset conversation memory"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Reset Memory</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* Profile Button */}
          <button
            onClick={handleProfileClick}
            className="group relative px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg"
            title="View profile"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Profile</span>
            </div>
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="profile-modal absolute top-20 right-6 z-50 w-96 max-w-sm">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-indigo-200 overflow-hidden">
            {loadingProfile ? (
              <div className="p-6 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading profile...</p>
              </div>
            ) : userProfile ? (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{userProfile.username}</h3>
                    <p className="text-gray-600">{userProfile.email}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Insurance Policies</h4>
                  {userProfile.insurance_obtained.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {userProfile.insurance_obtained.map((insurance, index) => (
                        <div key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{insurance.insurance_name}</h5>
                              <p className="text-sm text-gray-600">
                                Added: {new Date(insurance.insurance_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-gray-500">No insurance policies added yet</p>
                    </div>
                  )}
                </div>

                {/* Activity Sections */}
                <div className="space-y-3">
                  {/* Feedbacks Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => toggleSection('feedbacks')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors border border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">Feedbacks</h4>
                          <p className="text-sm text-gray-600">{feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.feedbacks ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.feedbacks && (
                      <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                        {feedbacks.length > 0 ? (
                          feedbacks.map((feedback, index) => (
                            <div key={feedback._id || index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-900">Feedback</span>
                                <span className="text-xs text-gray-500">ID: {feedback._id}</span>
                              </div>
                              {renderActivityDetails(feedback)}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-4">No feedbacks submitted yet</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Claim Requests Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => toggleSection('claims')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg hover:from-orange-100 hover:to-red-100 transition-colors border border-orange-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">Claim Requests</h4>
                          <p className="text-sm text-gray-600">{claimRequests.length} request{claimRequests.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.claims ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.claims && (
                      <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                        {claimRequests.length > 0 ? (
                          claimRequests.map((claim, index) => (
                            <div key={claim._id || index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-900">Claim Request</span>
                                <span className="text-xs text-gray-500">ID: {claim._id}</span>
                              </div>
                              {renderActivityDetails(claim)}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-4">No claim requests submitted yet</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Insurance Applications Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => toggleSection('applications')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-colors border border-green-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">Insurance Applications</h4>
                          <p className="text-sm text-gray-600">{insuranceApplications.length} application{insuranceApplications.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.applications ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.applications && (
                      <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                        {insuranceApplications.length > 0 ? (
                          insuranceApplications.map((application, index) => (
                            <div key={application._id || index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-900">Insurance Application</span>
                                <span className="text-xs text-gray-500">ID: {application._id}</span>
                              </div>
                              {renderActivityDetails(application)}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-4">No insurance applications submitted yet</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button
                    onClick={() => setShowProfile(false)}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-600 py-12">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Insurance Hub AI</h2>
                <p className="text-lg text-gray-600 mb-4">Your unified insurance assistant across multiple companies</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-100">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mb-2 mx-auto">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Policy Comparison</h3>
                  <p className="text-sm text-gray-600">Compare policies across multiple insurance companies</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mb-2 mx-auto">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Instant Recommendations</h3>
                  <p className="text-sm text-gray-600">Get personalized insurance recommendations</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mb-2 mx-auto">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">24/7 Support</h3>
                  <p className="text-sm text-gray-600">Always available to answer your questions</p>
                </div>
              </div>

              <p className="text-gray-500">Start a conversation by asking about insurance policies, coverage options, or get personalized recommendations.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`flex gap-3 max-w-2xl ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                  message.isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-green-400 to-green-600'
                }`}>
                  {message.isUser ? 'U' : 'A'}
                </div>

                {/* Message Bubble */}
                <div
                  className={`px-5 py-4 rounded-2xl ${
                    message.isUser
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${message.isUser ? 'text-white' : 'text-gray-800'}`}>
                    {renderMessageText(message.text)}
                  </div>
                  <p className={`text-xs mt-2 ${message.isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                  A
                </div>
                <div className="bg-white/90 backdrop-blur-sm border border-green-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">AI is analyzing your request...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50/90 backdrop-blur-sm border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-indigo-100 px-6 py-4 sticky bottom-0 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about insurance policies, compare coverage, or get recommendations..."
                className="w-full px-6 py-4 pr-12 border border-indigo-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-sm bg-white/90 backdrop-blur-sm"
                disabled={isTyping}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
              </svg>
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by multi-company insurance AI • Secure & Private
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;