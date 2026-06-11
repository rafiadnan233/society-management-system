import React, { useState, useEffect, useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import { MessageSquare, X, Send, Sparkles, User, HelpCircle, Loader2, RefreshCw, Volume2, Building, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function AIAssistantWidget() {
  const { language } = useSociety();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default welcome message based on selected language (bn/en)
  const defaultWelcomeMessage = (): ChatMessage => ({
    id: 'welcome-msg',
    role: 'model',
    text: language === 'bn' 
      ? 'স্বাগতম! আমি আস্থা টুইন টাওয়ারের (Astha Twin Tower) এআই অ্যাসিস্ট্যান্ট। আমি আপনাকে সোসাইটির নিয়মাবলী, ইউজার ড্যাশবোর্ড, পেমেন্ট ইনফো, এবং অভিযোগ মেটাতে সাহায্য করতে পারি। আপনি কীভাবে সাহায্য চান?'
      : 'Welcome! I am the Astha Twin Tower AI Assistant. I can help you with society rules, maintenance payments, visitor guidelines, and filing complaints. How can I assist you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  // Load default message if chat list is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([defaultWelcomeMessage()]);
    }
  }, [language]);

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle suggested prompt clicks
  const handleSuggestionClick = (promptText: string) => {
    if (loading) return;
    sendMessage(promptText);
  };

  // Main sending function
  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend) return;

    // Clear input if we are sending the user's typed input
    if (!overrideText) {
      setInput('');
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp
    };

    // Update list with User's message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Map history format for server endpoint proxy (excludes welcome message to prevent noise)
      const chatHistory = updatedMessages
        .filter(m => m.id !== 'welcome-msg')
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      // Call our secure Express full-stack proxy route
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textToSend,
          history: chatHistory.slice(-6) // Only send recent 6 messages to keep context efficient
        }),
      });

      if (!response.ok) {
        throw new Error('API server returned error status');
      }

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text || (language === 'bn' ? 'আমি দুঃখিত, সংযোগের সমস্যা হয়েছে।' : 'Sorry, connection failed.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error generating response:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: language === 'bn'
          ? 'দুঃখিত, আস্থা সার্ভার বা জেমিনি এআই রিকোয়েস্ট সফল হয়নি। অনুগ্রহ করে আপনার নেট সংযোগ পরীক্ষা করুন।'
          : 'Sorry, the request to Astha Twin Tower AI backend failed. Please check your connectivity.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Reset chat logic
  const resetChat = () => {
    setMessages([defaultWelcomeMessage()]);
  };

  // Highlight suggestion chips for rapid interaction
  const suggestions = language === 'bn' 
    ? [
        { label: 'পেমেন্টের শেষ সময় কবে?', text: 'সোসাইটি মেইনটেইন্যান্স পেমেন্ট করার শেষ সময় কখন এবং জরিমানা কত?' },
        { label: 'কুয়ায়েট আওয়ার্স কোনটি?', text: 'আস্থা টুইন টাওয়ারের কুয়ায়েট আওয়ার্স বা ঘুমের সময় সময়সূচী কী?' },
        { label: 'অভিযোগ দায়ের নিয়ম', text: 'কি কি ক্যাটাগরিতে এবং কিভাবে নতুন অভিযোগ সাবমিট করব?' },
        { label: 'ভিজিটর এন্ট্রি পাস', text: 'আমার ফ্ল্যাটে নতুন গেস্ট আসার জন্য পূর্বঅনুমতি বা ভিজিটর পাস কীভাবে তৈরি করতে পারি?' }
      ]
    : [
        { label: 'When is billing deadline?', text: 'When is the monthly maintenance fee due and are there late fees?' },
        { label: 'Visitor register guidelines', text: 'How do residents pre-approve or register visitors at Astha buildings?' },
        { label: 'Quiet hours boundaries', text: 'What are the quiet hours and general rules at Astha Twin Towers?' },
        { label: 'Filing a complaint', text: 'How do residents submit complaints and how long does investigation take?' }
      ];

  return (
    <div id="astha-ai-assistant-root" className="fixed bottom-6 right-6 z-50 font-sans print:hidden flex flex-col items-end">
      {/* Expanded Chat Box Window */}
      {isOpen && (
        <div 
          id="astha-ai-chat-window" 
          className="mb-4 w-[360px] sm:w-[410px] max-w-[calc(100vw-32px)] h-[520px] sm:h-[580px] bg-neutral-950 border border-emerald-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),_0_0_30px_rgba(16,185,129,0.1)] flex flex-col overflow-hidden animate-fade-in text-slate-200"
        >
          {/* Header Panel */}
          <div className="bg-gradient-to-r from-neutral-900 via-[#032e24] to-neutral-950 p-4 border-b border-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-400 p-0.5 flex items-center justify-center shadow-md animate-pulse">
                  <div className="h-full w-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
              </div>
              <div>
                <h3 className="font-mono text-[11.5px] font-black uppercase text-[#D4AF37] tracking-wider flex items-center gap-1">
                  <span>Astha AI Assistant</span>
                </h3>
                <span className="text-[9px] text-slate-400 font-mono block">
                  {language === 'bn' ? '● সর্বদা আপনার সেবায় নিয়োজিত' : '● Always active & secure'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={resetChat}
                title={language === 'bn' ? 'পুনরায় চ্যাট শুরু করুন' : 'Reset chat'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-neutral-900 transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-neutral-900 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Sub-Header Notice Bar */}
          <div className="bg-[#04211a]/40 border-b border-emerald-950/40 py-1.5 px-3 text-[9.5px] font-mono text-emerald-400/90 text-center flex items-center justify-center gap-1">
            <Building className="h-3 w-3 shrink-0" />
            <span>Khetasar, Cumilla, BD — Powered by Gemini AI</span>
          </div>

          {/* Message Area viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-neutral-950 to-neutral-900 scrollbar-thin scrollbar-thumb-emerald-950 pr-2">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* User/Bot Avatar Icon */}
                <div className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center ${
                  msg.role === 'user' 
                    ? 'bg-emerald-950 ring-1 ring-emerald-400' 
                    : 'bg-neutral-900 ring-1 ring-amber-500'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                  )}
                </div>

                {/* Message bubble outline */}
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed break-words whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-emerald-950/70 text-emerald-100 rounded-tr-none border border-emerald-900/30 shadow-md' 
                      : 'bg-neutral-900/95 text-slate-200 rounded-tl-none border border-slate-800/65 shadow-md shadow-emerald-950/5'
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`text-[8.5px] font-mono text-slate-500 block ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Simulated Gemini Typing Indicator */}
            {loading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="h-7 w-7 rounded-lg shrink-0 bg-neutral-900 ring-1 ring-amber-400/80 flex items-center justify-center">
                  <Loader2 className="h-3.5 w-3.5 text-[#D4AF37] animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="px-4 py-2 bg-neutral-900 border border-slate-800/40 rounded-2xl rounded-tl-none flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span className="animate-bounce delay-75">●</span>
                    <span className="animate-bounce delay-150">●</span>
                    <span className="animate-bounce delay-300">●</span>
                    <span className="text-[8.5px] text-slate-500 font-mono ml-1.5">
                      {language === 'bn' ? 'জেমিনি টাইপ করছে...' : 'Gemini is thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Inline Suggestion Quick Prompts Chips */}
          <div className="p-3 bg-neutral-950/95 border-t border-emerald-950/30">
            <span className="text-[9px] font-mono font-black uppercase text-[#D4AF37] tracking-wider block mb-2 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>{language === 'bn' ? 'ঘন ঘন জিজ্ঞাসিত প্রশ্ন (FAQ):' : 'Suggested Inquiries Panel:'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(sug.text)}
                  disabled={loading}
                  className="px-2.5 py-1.5 text-[9.5px] font-sans bg-neutral-900 hover:bg-emerald-950/40 hover:text-emerald-400 border border-emerald-950/60 hover:border-emerald-700/60 rounded-full transition-all text-slate-400 text-left truncate max-w-full cursor-pointer"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Input Area */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-neutral-950 border-t border-emerald-950 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'bn' ? 'এখানে যেকোনো প্রশ্ন লিখুন...' : 'Ask about Astha Twin Tower here...'}
              disabled={loading}
              className="flex-1 px-3 py-2 text-[11px] bg-neutral-900 border border-emerald-950 rounded-xl focus:outline-none focus:border-emerald-400 text-slate-100 font-sans placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                loading || !input.trim()
                  ? 'bg-neutral-900 text-slate-600 border border-slate-900'
                  : 'bg-emerald-950 border border-emerald-600 text-emerald-400 hover:bg-emerald-900 shadow-md shadow-emerald-950/20'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Sparkles Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={language === 'bn' ? 'আস্থা টুইন টাওয়ার এআই অ্যাসিস্ট্যান্ট' : 'Astha Twin Tower AI Assistant'}
        className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-400/10 ${
          isOpen 
            ? 'bg-neutral-950 text-emerald-400 border-2 border-red-500/70 hover:border-red-500' 
            : 'bg-gradient-to-tr from-neutral-900 via-[#043327] to-neutral-800 text-emerald-400 border-2 border-emerald-500/80 hover:border-[#D4AF37]/90 hover:text-[#D4AF37]'
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6 animate-pulse" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6" />
            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-amber-500 text-[8px] font-black font-mono flex items-center justify-center text-neutral-950 animate-bounce">
              AI
            </span>
          </div>
        )}
      </button>

    </div>
  );
}
