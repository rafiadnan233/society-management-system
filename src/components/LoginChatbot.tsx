import React, { useState, useRef, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { MessageSquare, Send, X, Bot, Sparkles, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function LoginChatbot() {
  const { language } = useSociety();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting based on language
  useEffect(() => {
    const greetingTextEn = "Hello! I am Astha Copilot, your virtual smart assistant. I can guide you through our architectural details, current construction status, leadership messages, or portal sign-in. What would you like to know?";
    const greetingTextBn = "হ্যালো! আমি আস্থা কো-পাইলট, আপনার স্মার্ট ভার্চুয়াল অ্যাসিস্ট্যান্ট। আমি আপনাকে আমাদের স্থাপত্য নকশা, চলমান নির্মাণ অগ্রগতি, নিরাপত্তা বা এখানে সাইন-ইন সংক্রান্ত সকল তথ্য দিয়ে সাহায্য করতে পারি। আপনি কী জানতে চান?";
    
    setMessages([
      {
        id: 'welcome-msg',
        role: 'model',
        text: language === 'bn' ? greetingTextBn : greetingTextEn,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [language]);

  // Handle auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const starterPrompts = language === 'bn' ? [
    { text: "স্থাপত্যের ৩ডি সুযোগ-সুবিধা বলুন", prompt: "Astha Twin Towers এর স্থাপত্যের ৩ডি প্রজেক্ট ভিউ এবং বিভিন্ন সুযোগ-সুবিধা বলুন" },
    { text: "সোসাইটির কমিটির সদস্যদের সম্পর্কে বলুন", prompt: "আস্থা টুইন টাওয়ার্সের পরিচালনা বা সোসাইটি কমিটির নেতৃবৃন্দের কথা বলুন" },
    { text: "নির্মাণ কাজের অগ্রগতি দেখতে চাই", prompt: "আস্থা টুইন টাওয়ার্সের নির্মাণ কাজের বর্তমান সার্বিক অগ্রগতি কতটুকু?" },
    { text: "এখানে রেজিস্ট্রেশন করব কীভাবে?", prompt: "আস্থা সোসাইটি অ্যাপে নতুন বাসিন্দা বা স্টাফ হিসেবে কীভাবে রেজিস্ট্রেশন বা লগইন করব?" }
  ] : [
    { text: "Tell me about building features", prompt: "What are the architectural highlights and features of Astha Twin Towers?" },
    { text: "Who is in the Management Board?", prompt: "Who are the leaders and committee members of Astha Twin Towers?" },
    { text: "What is construction progress?", prompt: "What is the overall civil construction progress of Astha Twin Towers?" },
    { text: "How to register or sign-in?", prompt: "How can a new resident or staff register and login to the society portal?" }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorHeader(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build history of last 6 messages to keep context short and clear
      const historyPayload = messages
        .filter(m => m.id !== 'welcome-msg')
        .slice(-6)
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error occurred');
      }

      const responseData = await response.json();
      
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: 'model',
        text: responseData.text || (language === 'bn' ? "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।" : "Sorry, no response retrieved."),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
      console.error("Chatbot query failed:", error);
      setErrorHeader(error.message || (language === 'bn' ? "কানেকশন সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।" : "Connection error. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="login-chatbot-container">
      {/* Floating Toggle Bubble */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-emerald-400 ring-4 ring-emerald-500/10 cursor-pointer group relative"
          title={language === 'bn' ? 'আস্থা কো-পাইলট' : 'Astha Copilot'}
        >
          <Bot className="h-6 w-6 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4AF37]"></span>
          </span>
          {/* Subtle Label Popover */}
          <div className="absolute right-16 bg-neutral-900 border border-emerald-800 text-white text-[10px] py-1 px-3.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none font-semibold uppercase tracking-wider font-mono">
            {language === 'bn' ? 'সহায়তা নিন 🤖' : 'Need Help? 🤖'}
          </div>
        </button>
      )}

      {/* Main Collapsible Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[550px] bg-neutral-950 rounded-2xl border border-emerald-900/60 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          
          {/* Header section */}
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-emerald-950/80 px-4 py-3.5 border-b border-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-950 flex items-center justify-center border border-emerald-500/30">
                <Bot className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white tracking-wide uppercase flex items-center gap-1">
                  <span>{language === 'bn' ? 'আস্থা কো-পাইলট' : 'Astha Copilot'}</span>
                  <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">
                  {language === 'bn' ? 'স্মার্ট ভার্চুয়াল অ্যাসিস্ট্যান্ট' : 'SMART COMMUNITY ASSISTANT'}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white rounded-full p-1 hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Logs Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/40 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {msg.role === 'model' && (
                  <div className="h-7 w-7 rounded-md bg-emerald-950/80 shrink-0 flex items-center justify-center border border-emerald-900/50">
                    <Bot className="h-4 w-4 text-emerald-400" />
                  </div>
                )}
                
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl leading-relaxed text-[11.5px] ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-neutral-900 text-slate-200 border border-emerald-950/40 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`block text-[9px] text-slate-500 font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Simulated AI Typing Loader */}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[80%] mr-auto">
                <div className="h-7 w-7 rounded-md bg-emerald-950/80 shrink-0 flex items-center justify-center border border-emerald-900/50">
                  <Bot className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="bg-neutral-900 p-3 rounded-2xl rounded-tl-none border border-emerald-950/40 text-slate-450 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
                  <span>{language === 'bn' ? 'উত্তর তৈরি হচ্ছে...' : 'Formulating Response...'}</span>
                </div>
              </div>
            )}

            {/* Error Header */}
            {errorHeader && (
              <div className="p-3 bg-rose-950/30 border border-rose-900/60 text-rose-400 rounded-xl text-[10.5px] leading-relaxed flex gap-2 items-start font-medium">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span>{errorHeader}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                      if (lastUserMsg) {
                        handleSend(lastUserMsg.text);
                      }
                    }}
                    className="block text-[9.5px] text-emerald-400 hover:text-emerald-350 underline underline-offset-2 font-bold uppercase cursor-pointer"
                  >
                    {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry' }
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter prompt chips (visible when only 1 greeting message exists or inactive) */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 pb-3 pt-1 border-t border-emerald-950 bg-neutral-950/20">
              <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2 font-black">
                {language === 'bn' ? 'সহজে জিজ্ঞেস করুন:' : 'Suggested Questions:'}
              </span>
              <div className="flex flex-col gap-1.5">
                {starterPrompts.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip.prompt)}
                    className="w-full text-left bg-neutral-900 hover:bg-emerald-950 hover:text-white hover:border-emerald-700/60 px-3 py-1.5 rounded-lg text-[10.5px] text-slate-300 font-medium transition-all duration-200 border border-emerald-950 text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer flex items-center gap-1.5 group"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500 group-hover:scale-110 shrink-0" />
                    <span className="truncate">{chip.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input control box */}
          <div className="p-3.5 bg-neutral-950 border-t border-emerald-950 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend(inputMessage);
                }
              }}
              placeholder={language === 'bn' ? 'কো-পাইলটকে বাংলায় কিছু জিজ্ঞাসা করুন...' : 'Ask Copilot anything...'}
              disabled={isLoading}
              className="flex-1 bg-neutral-900 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => handleSend(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              className="h-9 w-9 shrink-0 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition-all duration-250 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
