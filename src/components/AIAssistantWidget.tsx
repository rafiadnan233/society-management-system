import React, { useState, useEffect, useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import { MessageSquare, X, Send, Sparkles, User, HelpCircle, Loader2, RefreshCw, Volume2, Building, ArrowRight, Smile, Hand, BookOpen, ChevronDown, ChevronUp, ChevronRight, CreditCard, ShieldCheck, AlertCircle, Clock, Key } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// System instruction representing the Astha Twin Tower AI Assistant for Client Side Direct Fallback
const ASTHA_SYSTEM_INSTRUCTION = `You are Astha Twin Tower AI Assistant.
Always answer in Bengali (Bangla) default unless the user asks to use English.
Help residents, visitors, staff, and administrators.
Provide accurate information about society services at Astha Twin Tower (located in Khetasar, Cumilla, Bangladesh).
Keep responses context-aware, polite, warm, concise, and professional.

Key facts about Astha Twin Tower:
1. Contact & Location: Khetasar, Cumilla, Bangladesh.
2. Apartment Management: There are multiple flats across tower blocks.
3. Maintenance Bills: The monthly maintenance fee should be paid via local mobile wallets (bKash/Nagad) or Cash by the 10th of every month. Late fees may apply after the 15th of the month.
4. Security & Visitors: All visitors/guests, vehicles, and delivery partners must register at the reception/gate. Residents can submit pre-arrival visitor entry request passes online.
5. Voice Navigation: Astha Twin Tower system has a state-of-the-art Voice Navigator supporting voice commands (e.g. 'take me to the dashboard', 'show me payments') to help quick navigation.
6. Complaints Desk: If there are complaints (leakage, plumbing, security, common lights, garbage), residents can file them online. The administration processes them immediately.
7. Quiet Hours: 10:00 PM to 6:00 AM (to ensure comfort for children and elderly residents).
8. Common Areas: Community room, play area, and rooftop gardens must be reserved ahead of events with the society committee.

Format your responses with neat markdown lists or bold markers where relevant. Always keep instructions short, helpful, and friendly.`;

const FAQ_CATEGORIES = [
  {
    id: 'payments',
    titleBn: '💳 মেইনটেইন্যান্স ও বিল',
    titleEn: '💳 Payment Issues',
    faqs: [
      {
        qBn: 'মাসিক মেইনটেইন্যান্স ফি প্রদানের শেষ সময় কবে?',
        qEn: 'When is the monthly maintenance fee due and what is late fee?',
        aBn: 'প্রতি মাসের ১০ তারিখের মধ্যে আপনার নির্ধারিত ফ্ল্যাটের মেইনটেইন্যান্স বিল পরিশোধ করতে হবে। ১৫ তারিখ পার হয়ে গেলে বিলম্বে শাস্তিমূলক ফি বা চার্জ প্রযোজ্য হতে পারে।',
        aEn: 'The monthly maintenance fee must be paid by the 10th of every month. Late feeds/charges may apply after the 15th.'
      },
      {
        qBn: 'কোন কোন মাধ্যমে ফি পরিশোধ করা যাবে?',
        qEn: 'What payment methods are supported for bills?',
        aBn: 'আপনি সরাসরি আপনার ড্যাশবোর্ডের "Payments" ট্যাব থেকে bKash, Nagad মোবাইল ওয়ালেট অথবা সরাসরি ক্যাশ ট্রানজেকশন পেইমেন্ট হিসেবে সোসাইটিতে অর্থ জমা দিতে পারবেন।',
        aEn: 'You can pay directly through your resident portal dashboard using mobile wallets like bKash/Nagad, or via Cash.'
      },
      {
        qBn: 'পেমেন্ট রশিদ বা মানি রিসিট কীভাবে পাব?',
        qEn: 'How can I collect my formal payment receipt?',
        aBn: 'পেমেন্ট সম্পন্ন হওয়ার পর সিস্টেম স্বয়ংক্রিয়ভাবে একটি প্রিন্টযোগ্য ফর্মাল ডিজিটাল রিসিট জেনারেট করে যা আপনি যেকোনো সময় ডাউনলোড করতে পারেন।',
        aEn: 'After a successful payment, the system automatically generates a printable digital receipt for download.'
      }
    ]
  },
  {
    id: 'visitors',
    titleBn: '🚧 গেট ও সিকিউরিটি নিয়মনীতি',
    titleEn: '🚧 Gate Rules & Visitors',
    faqs: [
      {
        qBn: 'মেহমান বা গেস্ট আসার কি কোনো পূর্বঅনুমোদন লাগবে?',
        qEn: 'Do visitors need any prior approval from residents?',
        aBn: 'নিরাপত্তা নিশ্চিত করার জন্য গেটে মেহমানদের রেজিষ্ট্রেশন করতে হয়। বাসিন্দারা চাইলে যেকোনো পূর্বপ্রস্তুতির জন্য আগেই Online Visitor Pass টিকিট তৈরি করে রাখতে পারেন।',
        aEn: 'To ensure campus security, all guests must register at the gate. Residents can optionally generate an online pre-arrival Pass to bypass delay.'
      },
      {
        qBn: 'ডেলিভারি পার্টনার বা বা কুরিয়ার কীভাবে ফ্ল্যাট পর্যন্ত পৌঁছাবে?',
        qEn: 'How do delivery riders and couriers reach the flat?',
        aBn: 'সকল কুরিয়ার ও ডেলিভারি পার্টনারদের মেইন গেট কাউন্টারে এন্ট্রি দিতে হবে এবং ইন্টারকম বা সিকিউরিটি কর্তাদের মাধ্যমে বাসিন্দা সবুজ সংকেত দিলে তবেই প্রবেশাধিকার পাবে।',
        aEn: 'All delivery partners must report at the main entrance gate. Security will verify with the resident via intercom/system before entry.'
      }
    ]
  },
  {
    id: 'complaints',
    titleBn: '🛠️ অভিযোগ ও সেবা টিকিট',
    titleEn: '🛠️ Complaints Box',
    faqs: [
      {
        qBn: 'পানির লাইনে লিকেজ বা প্লাম্বিং সমস্যা হলে কী ব্যবস্থা আছে?',
        qEn: 'What should I do if there is a water leak or plumbing issue?',
        aBn: 'আপনি ড্যাশবোর্ড থেকে "Complaints" সেকশনে গিয়ে পানির লাইন, বৈদ্যুতিক ত্রুটি বা লিফট বিষয়ক যেকোনো সমস্যার টিকিট ওপেন করতে পারেন।',
        aEn: 'You can go to the "Complaints" section of your resident panel and submit an immediate ticket for plumbing, electric, or utility issues.'
      },
      {
        qBn: 'তদন্ত কতক্ষণের মধ্যে সম্পন্ন করা হয়?',
        qEn: 'How long does complaint investigation and repair take?',
        aBn: 'সাধারণত টিকিট জেনারেশনের ১২ ঘণ্টার মধ্যে আমাদের সাপোর্ট কারিগর বা ইলেক্ট্রিশিয়ান দল তদন্ত শুরু করে এবং অগ্রাধিকার ভিত্তিতে সমাধান করে।',
        aEn: 'Our technical support staff or plumber team typically initiates an investigation within 12 hours of priority ticket submission.'
      }
    ]
  },
  {
    id: 'rules',
    titleBn: '🌙 কুয়ায়েট আওয়ার্স ও কমন এরিয়া',
    titleEn: '🌙 Quiet Hours & Shared Areas',
    faqs: [
      {
        qBn: 'শান্ত ঘন্টা বা Quiet Hours এর সময়সূচী কোনটি?',
        qEn: 'What are the quiet hours in Astha Twin Towers?',
        aBn: 'আমাদের আবাসিক এলাকায় প্রতিদিন রাত ১০:০০ টা থেকে সকাল ৬:০০ টা পর্যন্ত শান্ত ঘন্টা বলবৎ থাকে। এই সময় উচ্চ শব্দকারী সকল কার্যক্রম নিষিদ্ধ।',
        aEn: 'Quiet hours are observed daily from 10:00 PM to 6:00 AM. Loud sounds, music, or disturbances are strictly prohibited during this frame.'
      },
      {
        qBn: 'কমিউনিটি হল রুম বুক করার নিয়ম কী?',
        qEn: 'How do I book the community room or rooftop for an event?',
        aBn: 'ব্যক্তিগত অনুষ্ঠান বা সামাজিক সভার জন্য অন্তত ৭ দিন পূর্বে ক্যালেন্ডার শিডিউল চেক করে সোসাইটি কার্যনির্বাহী কমিটির মাধ্যমে আবেদন করুন।',
        aEn: 'To reserve the community hall or rooftop garden, please check scheduling availability and submit an application to the society committee 7 days prior.'
      }
    ]
  }
];

export default function AIAssistantWidget() {
  const { 
    language,
    currentUser,
    config,
    members,
    flats,
    payments,
    expenses,
    notices,
    visitors,
    complaints,
    staff,
    constructionPhases
  } = useSociety();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelloTooltip, setShowHelloTooltip] = useState(true);
  const [activeTab, setActiveTab] = useState<'help' | 'chat'>('help');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>('payments');
  const [expandedFaqIdx, setExpandedFaqIdx] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('ASTHA_USER_GEMINI_KEY') || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate real-time system context to feed to Gemini AI
  const generateSystemContext = () => {
    let context = ``;
    
    // 1. Current Session Context
    if (currentUser) {
      context += `[User Session]: Logged in user is ${currentUser.name} (${currentUser.role}). `;
      if (currentUser.role === 'Resident') {
        context += `Flat No: ${currentUser.flatNo || 'N/A'}. `;
      }
      context += `\n`;
    } else {
      context += `[User Session]: Public/Anonymous guest visitor.\n`;
    }

    // 2. Society Config & Financial Specs
    if (config) {
      context += `[Society Setup]: Name: ${config.name || 'Astha Twin Towers'}, Address: ${config.address || 'Khetasar, Cumilla'}, Email: ${config.email || 'info@astha.com'}, Phone: ${config.contactNo || ''}. `;
      context += `Monthly Maintenance Fee: BDT ${config.bdtMaintenanceFee || 5000}. Payment Channels: bKash (${config.bKashMerchant || '01712345678'}), Nagad (${config.nagadMerchant || '01612345678'}), Rocket (${config.rocketMerchant || '01512345678'}).\n`;

      // 3. Construction Highlights
      const percent = config.constructionPercent !== undefined ? config.constructionPercent : 85;
      context += `[Construction Phase]: Progress: ${percent}% Completed. Description (EN): "${config.constructionDescEn || ''}". Description (BN): "${config.constructionDescBn || ''}".\n`;
    }

    // 4. Flats Statistics
    if (flats && flats.length > 0) {
      const occupied = flats.filter(f => f.status === 'Occupied').length;
      const vacant = flats.filter(f => f.status === 'Vacant').length;
      context += `[Flats Summary]: Total Flats: ${flats.length} (Occupied: ${occupied}, Vacant: ${vacant}).\n`;
    }

    // 5. Active Notices
    if (notices && notices.length > 0) {
      context += `[Active Notices]:\n`;
      notices.slice(0, 5).forEach((n, idx) => {
        context += `  - Notice #${idx + 1}: Date: ${n.date || 'unknown'}, Priority: ${n.priority || 'Normal'}, Title: "${n.title || ''}", Content: "${n.message || ''}"\n`;
      });
    }

    // 6. Support Staff / Contacts
    if (staff && staff.length > 0) {
      context += `[Duty Support Staff List]:\n`;
      staff.forEach((s) => {
        context += `  - Name: ${s.name} | Role: ${s.role} | Phone: ${s.phone || 'N/A'} | Status: ${s.status || 'Active'}\n`;
      });
    }

    // 7. Core Committee / Members Info
    if (members && members.length > 0) {
      const committee = members.filter(m => m.tag === 'Committee' || m.role === 'President' || m.role === 'Secretary');
      if (committee.length > 0) {
        context += `[Committee Members]:\n`;
        committee.forEach(c => {
          context += `  - Name: ${c.name} | Designation: ${c.role || 'Member'} | Phone: ${c.phone || 'N/A'}\n`;
        });
      }
      context += `[Total Registered Resident Members]: ${members.length}\n`;
    }

    // 8. Complaints Tracking
    if (complaints && complaints.length > 0) {
      const pending = complaints.filter(c => c.status === 'Pending').length;
      const investigating = complaints.filter(c => c.status === 'Investigating').length;
      const resolved = complaints.filter(c => c.status === 'Resolved').length;
      context += `[Complaints Status]: Total filed issues: ${complaints.length} (Pending: ${pending}, Investigating: ${investigating}, Resolved: ${resolved}).\n`;
      
      context += `[Recent Public Complaints]:\n`;
      complaints.slice(0, 5).forEach((c, idx) => {
        context += `  - Complaint #${idx+1}: Category: ${c.category}, Title: "${c.title}", Status: ${c.status}, Filed Date: ${c.date || ''}. By: Flat ${c.flatNo}\n`;
      });
    }

    // 9. Payment Logs Overview
    if (payments && payments.length > 0) {
      const totalPaid = payments.filter(p => p.status === 'Paid').length;
      const totalPending = payments.filter(p => p.status === 'Pending').length;
      context += `[Maintenance Payments Overview]: Total invoices tracked: ${payments.length} (${totalPaid} Paid, ${totalPending} Pending/Unpaid).\n`;
    }

    return context;
  };

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

    const systemContext = generateSystemContext();

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
          history: chatHistory.slice(-6), // Only send recent 6 messages to keep context efficient
          systemContext: systemContext
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
      console.warn('Error generating response from backend, checking for client-side Gemini options:', err);
      
      const apiKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MOCK_OR_MISSING_KEY") {
        try {
          // Construct chat history format mapping for @google/genai SDK
          const sdkContents = updatedMessages
            .filter(m => m.id !== 'welcome-msg')
            .map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.text }]
            }));

          const ai = new GoogleGenAI({ apiKey });
          const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest"];
          let clientResponseText = "";
          
          for (const modelName of modelsToTry) {
            try {
              const res = await ai.models.generateContent({
                model: modelName,
                contents: sdkContents,
                config: {
                  systemInstruction: ASTHA_SYSTEM_INSTRUCTION + 
                    `\n\n[Real-time Operational Context of Astha Twin Towers]:\n${systemContext}\n\nPlease use this live data from the Society Management System to answer the user's questions confidently and accurately. Refer to staff names, phone numbers, flats, committee designations, active notices, construction progress, or complaints whenever they ask. Default to Bangla unless specified otherwise.`,
                  temperature: 0.7,
                }
              });
              
              if (res && res.text) {
                clientResponseText = res.text;
                break;
              }
            } catch (modelErr) {
              console.warn(`[Client Gemini SDK Fallback] model ${modelName} failed:`, modelErr);
            }
          }
          
          if (clientResponseText) {
            const botMessage: ChatMessage = {
              id: `bot-client-${Date.now()}`,
              role: 'model',
              text: clientResponseText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMessage]);
            return; // Successfully resolved client-side direct real-time response!
          }
        } catch (directErr) {
          console.error("Direct client-side Gemini run encountered fatal error:", directErr);
        }
      }

      // High-fidelity local offline assistant client-side responder if direct client fails or has no key
      const getClientOfflineResponse = (query: string, lang: 'bn' | 'en'): string => {
        const q = query.toLowerCase();
        
        if (lang === 'bn') {
          if (q.includes("বিল") || q.includes("পেমেন্ট") || q.includes("টাকা") || q.includes("payment") || q.includes("bill") || q.includes("fee") || q.includes("maint")) {
            return `**আস্থা টুইন টাওয়ার পেমেন্ট গাইডলাইন (অফলাইন মোড):**\n\n১. **শেষ সময়:** প্রতি মাসের ১০ তারিখের মধ্যে মাসিক মেইনটেইন্যান্স ফি পরিশোধ করতে হবে।\n২. **বিলম্ব ফি:** ১৫ তারিখ পার হয়ে গেলে অতিরিক্ত বিলম্ব ফি যুক্ত হতে পারে।\n৩. **পরিশোধ পদ্ধতি:** ড্যাশবোর্ডের "Payments" থেকে bKash, Nagad অথবা সরাসরি ক্যাশ পেমেন্ট করতে পারেন।`;
          }
          if (q.includes("quiet") || q.includes("ঘুম") || q.includes("শান্ত") || q.includes("শব্দ") || q.includes("night") || q.includes("silent") || q.includes("রাত")) {
            return `**আস্থা টুইন টাওয়ার শব্দহীন প্রবিধান (Quiet Hours):**\n\n- **সময়সূচী:** প্রতিদিন রাত ১০:০০ টা থেকে সকাল ০৬:০০ টা পর্যন্ত শান্ত ঘন্টা বলবৎ থাকে।\n- এই ক্ষণে উচ্চ শব্দ সৃষ্টিকারী কাজ বা জোরে উৎসব করা বারণ যাতে বৃদ্ধ বা শিশুদের ঘুমের ব্যাঘাত না ঘটে।`;
          }
          if (q.includes("visitor") || q.includes("guest") || q.includes("ভিজিটর") || q.includes("মেহমান") || q.includes("গেস্ট") || q.includes("passes")) {
            return `**ভিজিটর এন্ট্রি পাস গাইড (অফলাইন মোড):**\n\n১. নিরাপত্তার স্বার্থে বহিরাগত মেহমানদের মেইন গেটে রেজিষ্ট্রেশন করতে হবে।\n২. বাসিন্দারা Resident ড্যাশবোর্ডে গিয়ে পূর্বেই **Visitor Entry Request** টিকিট জেনারেট করে গেস্টদের নির্বিঘ্ন প্রবেশ নিশ্চিত করতে পারেন।`;
          }
          if (q.includes("complaint") || q.includes("অভিযোগ") || q.includes("নষ্ট") || q.includes("ত্রুটি") || q.includes("পানির") || q.includes("লিঙ্ক")) {
            return `**অভিযোগ ও সমাধান সেবা (অফলাইন মোড):**\n\n- পানির লিকেজ বা প্লাম্বিং সমস্যার জন্য আপনি বাসিন্দা প্যানেল থেকে **Complaint Management** টিকিট সাবমিট করতে পারেন। আমাদের নিয়োজিত সেবা টেকনিশিয়ান ১২ ঘণ্টার মধ্যে এর সমাধান করবে।`;
          }
          if (q.includes("location") || q.includes("ঠিকানা") || q.includes("কোথায়") || q.includes("কুমিল্লা") || q.includes("cumilla") || q.includes("address")) {
            return `**আস্থা টুইন টাওয়ারের অবস্থান:**\n\n- **ঠিকানা:** খেতাসার, কুমিল্লা, বাংলাদেশ (Khetasar, Cumilla, Bangladesh)।`;
          }
          return `আস্থা টুইন টাওয়ার এআই সহযোগী (অফলাইন মোড):\nসার্ভারে উচ্চ ট্রাফিক বা নেট সংযোগের বিঘ্নতার কারণে আমি আপনাকে সাহায্য করছি অফলাইন প্রক্সি থেকে!\n\n**নিম্নলিখিত বিষয়ে যেকোনো তথ্য জানতে লিখুন:**\n- মেইনটেইন্যান্স পেমেন্ট এবং বিলের নিয়মনীতি\n- কুয়ায়েট আওয়ার্স বা ঘুমের সময়সূচী\n- নতুন গেস্ট এন্ট্রি পাস ও মেইন গেট রেজিষ্ট্রেশন\n- যেকোনো অভিযোগ সাবমিট ও ট্র্যাক ট্র্যাকিং`;
        } else {
          if (q.includes("bill") || q.includes("pay") || q.includes("maint") || q.includes("fee") || q.includes("money")) {
            return `**Astha Maintenance Billing Guidelines (Offline Mode):**\n\n1. **Deadline:** Must pay monthly maintenance fees by the 10th of each month.\n2. **Late Fee:** Late fees apply after the 15th of the month.\n3. **Method:** Support bKash, Nagad, or Cash payments via the "Payments" panel.`;
          }
          if (q.includes("quiet") || q.includes("night") || q.includes("sound") || q.includes("silent") || q.includes("sleep")) {
            return `**Astha Twin Towers Quiet Hours Policy (Offline Mode):**\n\n- **Hours:** Observed daily from 10:00 PM to 6:00 AM.\n- No high-decibel music, sounds, or heavy construction are permitted during this timeframe.`;
          }
          if (q.includes("visitor") || q.includes("guest") || q.includes("gate") || q.includes("pass")) {
            return `**Visitor Entry & Pass Registry (Offline Mode):**\n\n1. Security registration is mandatory at the entrance for all external guests.\n2. Residents can pre-approve visitors through the dashboard's **Visitor Entry Request** panel.`;
          }
          if (q.includes("complaint") || q.includes("leak") || q.includes("plumb") || q.includes("issue")) {
            return `**Complaint & Ticket Board (Offline Mode):**\n\n- Submit plumbing, electrical, or generic helper complaints through your resident panel. A maintenance helper will inspect within 12 hours.`;
          }
          if (q.includes("location") || q.includes("address") || q.includes("where") || q.includes("cumilla")) {
            return `**Location of Astha Twin Towers:**\n\n- **Address:** Khetasar, Cumilla, Bangladesh.`;
          }
          return `Astha Twin Tower Assistant (Offline Local Mode):\nDue to server downtime or connectivity delays, I am assisting you from the local database.\n\n**Ask me about:**\n- Monthly maintenance billing & payments\n- Quiet hours & night regulations\n- Resident complaint ticketing\n- Visitor passes & security`;
        }
      };

      const localResponseText = getClientOfflineResponse(textToSend, language);
      const offlineMsgText = language === 'bn' 
        ? `⚠️ *[নেটওয়ার্কFallback] ${localResponseText}*`
        : `⚠️ *[NetworkFallback] ${localResponseText}*`;

      const botMessage: ChatMessage = {
        id: `offline-${Date.now()}`,
        role: 'model',
        text: offlineMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
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

            <div className="flex items-center gap-1.5 font-mono">
              <button 
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                title={language === 'bn' ? 'এপিআই কী কনফিগারেশন' : 'API Key Config'}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${showConfig ? 'text-amber-400 bg-neutral-900 border border-emerald-900' : 'text-slate-400 hover:text-[#D4AF37] hover:bg-neutral-900'}`}
              >
                <Key className="h-4 w-4" />
              </button>
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

          {/* API Key Configuration Dropdown */}
          {showConfig && (
            <div className="bg-neutral-900/95 border-b border-emerald-950 p-3.5 space-y-2.5 animate-slide-down">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  <span>{language === 'bn' ? 'জেমিনি কী কনফিগারেশন (GitHub Pages)' : 'Client Gemini API Key Config'}</span>
                </span>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="text-slate-400 hover:text-red-400 text-[10px]"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-normal font-sans">
                {language === 'bn' 
                  ? 'GitHub Pages-এর মতো স্ট্যাটিক হোস্টিং-এ সরাসরি রিয়েল-টাইম জেমিনি এআই কাজ করার জন্য নিচে আপনার নিজস্ব Gemini API Key পেস্ট করুন। এটি আপনার ব্রাউজারের লোকাল স্টোরেজে সম্পূর্ণ নিরাপদে রাখা হবে।' 
                  : 'To enable real-time replies on static hostings like GitHub Pages, paste your temporary Gemini API key below. It remains secure in your browser localStorage.'}
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={userApiKey}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setUserApiKey(val);
                    localStorage.setItem('ASTHA_USER_GEMINI_KEY', val);
                  }}
                  placeholder="AIzaSy..."
                  className="flex-1 px-2.5 py-1.5 text-[10px] bg-neutral-950 border border-emerald-950 focus:border-emerald-500 focus:outline-none rounded-lg text-slate-100 font-mono"
                />
                {userApiKey && (
                  <button
                    onClick={() => {
                      setUserApiKey('');
                      localStorage.removeItem('ASTHA_USER_GEMINI_KEY');
                    }}
                    className="px-2.5 py-1.5 text-[9.5px] bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 text-red-400 rounded-lg font-mono transition-all"
                  >
                    {language === 'bn' ? 'মুছুন' : 'Clear'}
                  </button>
                )}
              </div>
              <div className="text-[8.5px] text-slate-500 leading-normal bg-neutral-950/40 p-2 rounded-lg border border-emerald-950/30 font-sans">
                💡 <span className="font-bold">{language === 'bn' ? 'বিকল্প পথ:' : 'Alternative option:'}</span>{' '}
                {language === 'bn' 
                  ? 'আপনার রিপোসিটরির build ফোল্ডারে VITE_GEMINI_API_KEY এনভায়রনমেন্ট ভ্যারিয়েবল ব্যবহার করে এটি সেট করতে পারেন।' 
                  : 'You can also set the VITE_GEMINI_API_KEY environment variable during your GitHub build actions.'}
              </div>
            </div>
          )}

          {/* Quick Help Menu vs AI Chat Tab Controller Bar */}
          <div className="flex bg-neutral-900/95 border-b border-emerald-950/70 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('help')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase font-black tracking-wider transition-all rounded-lg cursor-pointer ${
                activeTab === 'help'
                  ? 'bg-gradient-to-r from-emerald-950/60 to-neutral-900 text-emerald-400 border border-emerald-800/40 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900/50'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{language === 'bn' ? 'সহায়তা মেনু' : 'Quick Help'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase font-black tracking-wider transition-all rounded-lg cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-emerald-950/60 to-neutral-900 text-emerald-400 border border-emerald-800/40 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900/50'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{language === 'bn' ? 'এআই চ্যাট' : 'AI Chat'}</span>
            </button>
          </div>

          {/* Quick Help Menu Directory Panel */}
          {activeTab === 'help' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-neutral-950 to-neutral-900 scrollbar-thin scrollbar-thumb-emerald-950 pr-2 animate-fade-in">
              {/* Introduction Header banner inside Help */}
              <div className="p-3 bg-emerald-950/15 border border-emerald-900/30 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#D4AF37] tracking-widest uppercase flex items-center justify-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  <span>{language === 'bn' ? 'আস্থা গাইডবুক (Quick FAQ)' : 'Astha Quick FAQ Directory'}</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  {language === 'bn' 
                    ? 'নিচে ক্যাটাগরি অনুযায়ী সাধারণ প্রশ্নগুলোর সমাধান রয়েছে। যেকোনো প্রশ্নে ক্লিক করে সরাসরি উত্তর দেখুন।' 
                    : 'Browse through our structured categories below. Click on any question to view formal instructions.'}
                </p>
              </div>

              {/* Categories Wrapper */}
              <div className="space-y-2.5">
                {FAQ_CATEGORIES.map((category) => {
                  const isCatExpanded = expandedCategoryId === category.id;
                  return (
                    <div 
                      key={category.id} 
                      className="border border-emerald-950/80 bg-[#02100b]/45 rounded-xl overflow-hidden transition-all"
                    >
                      {/* Category Row Trigger header */}
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedCategoryId(isCatExpanded ? null : category.id);
                          setExpandedFaqIdx(null); // Reset active internal faq
                        }}
                        className={`w-full flex items-center justify-between p-3 text-left transition-colors cursor-pointer select-none ${
                          isCatExpanded ? 'bg-emerald-950/30 border-b border-emerald-950/40 text-emerald-400' : 'text-slate-300 hover:bg-neutral-900/40'
                        }`}
                      >
                        <span className="text-[11px] font-bold font-sans tracking-wide">
                          {language === 'bn' ? category.titleBn : category.titleEn}
                        </span>
                        {isCatExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#D4AF37]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                      </button>

                      {/* List of FAQs under Category */}
                      {isCatExpanded && (
                        <div className="p-2.5 space-y-2 bg-neutral-950/30 divide-y divide-emerald-950/25">
                          {category.faqs.map((faq, idx) => {
                            const isFaqExpanded = expandedFaqIdx === idx;
                            return (
                              <div key={idx} className={`${idx > 0 ? 'pt-2.5' : ''} space-y-1.5`}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedFaqIdx(isFaqExpanded ? null : idx)}
                                  className="w-full flex items-start gap-2 text-left text-[10.5px] font-medium text-slate-300 hover:text-emerald-400 cursor-pointer select-none"
                                >
                                  <HelpCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                                  <span className="flex-1">{language === 'bn' ? faq.qBn : faq.qEn}</span>
                                  {isFaqExpanded ? (
                                    <ChevronUp className="h-3 w-3 mt-1 text-slate-500" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 mt-1 text-slate-500" />
                                  )}
                                </button>

                                {isFaqExpanded && (
                                  <div className="pl-5.5 space-y-2 text-[10.5px] leading-relaxed text-slate-400 animate-slide-down">
                                    <p className="bg-neutral-900/85 border-l-2 border-amber-500 py-1.5 px-2.5 rounded-r-lg text-slate-300 font-sans">
                                      {language === 'bn' ? faq.aBn : faq.aEn}
                                    </p>
                                    
                                    {/* Interactive Prompt Sender Button */}
                                    <div className="pt-0.5 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const questionText = language === 'bn' ? faq.qBn : faq.qEn;
                                          setActiveTab('chat');
                                          sendMessage(questionText);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1 bg-emerald-950/80 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-400 hover:text-emerald-300 rounded-lg text-[9.5px] font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                      >
                                        <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                                        <span>{language === 'bn' ? 'এআই কে বিস্তারিত জিজ্ঞাসা করুন' : 'Ask AI to elaborate'}</span>
                                        <ArrowRight className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Area viewport */}
          {activeTab === 'chat' && (
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
          )}

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

      {/* Hello Greeting Tooltip Bubble */}
      {!isOpen && showHelloTooltip && (
        <div className="absolute right-18 bottom-1 flex items-center gap-2 bg-neutral-950 border border-emerald-400/90 text-emerald-300 py-2 px-3 rounded-xl shadow-[0_10px_30px_rgba(16,185,129,0.35)] animate-bounce select-none whitespace-nowrap z-50">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 animate-pulse text-[12px]">👋</span>
            <span className="font-mono text-[10.5px] font-black tracking-widest text-[#D4AF37]">
              {language === 'bn' ? 'হ্যালো! প্রশ্ন করুন' : 'HELLO! ASK AI'}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowHelloTooltip(false);
            }}
            className="p-1 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            title={language === 'bn' ? 'বন্ধ করুন' : 'Hide'}
          >
            <X className="h-3 w-3" />
          </button>
          {/* Tooltip Corner Arrow */}
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-950 border-r border-t border-emerald-400/90 rotate-45" />
        </div>
      )}

      {/* Floating Sparkles Trigger Button with Glowing Protective Halo Aura */}
      <div className="relative group/trigger">
        {!isOpen && (
          <>
            {/* Double Radiant "Halo" Rings */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 opacity-75 blur animate-pulse" />
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-400/20 to-amber-400/20 opacity-40 blur-md animate-ping" />
          </>
        )}
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={language === 'bn' ? 'আস্থা টুইন টাওয়ার এআই অ্যাসিস্ট্যান্ট' : 'Astha Twin Tower AI Assistant'}
          className={`h-15 w-15 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-emerald-400/20 relative z-10 ${
            isOpen 
              ? 'bg-neutral-950 text-emerald-400 border-2 border-red-500/70 hover:border-red-500' 
              : 'bg-gradient-to-tr from-neutral-950 via-[#043d30] to-neutral-900 text-emerald-400 border-2 border-emerald-400/80 hover:border-amber-400 hover:text-amber-400'
          }`}
        >
          {isOpen ? (
            <X className="h-5.5 w-5.5 animate-pulse" />
          ) : (
            <div className="relative flex flex-col items-center justify-center">
              <Smile className="h-5 w-5 text-amber-300 animate-pulse" />
              <Sparkles className="h-3 w-3 text-emerald-400 absolute -top-1.5 -right-2 animate-bounce" />
              <span className="text-[7.5px] font-mono font-black tracking-widest text-[#D4AF37] mt-0.5 uppercase">
                Hello
              </span>
            </div>
          )}
        </button>
      </div>

    </div>
  );
}
