/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import { Mic, MicOff, HelpCircle, Volume2, Sparkles, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VoiceNavigator() {
  const { activeTab, setActiveTab, language, currentUser, config } = useSociety();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showCommandsGuide, setShowCommandsGuide] = useState(false);
  const [successCommand, setSuccessCommand] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check SpeechRecognition API compatibility
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    // Set recognition language based on active context
    rec.lang = language === 'bn' ? 'bn-BD' : 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
      setStatusMessage(language === 'bn' ? 'শুনছি... কথা বলুন' : 'Listening... Speak now');
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);
      if (final) {
        const processed = final.trim().toLowerCase();
        setTranscript(processed);
        processVoiceCommand(processed);
      }
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setStatusMessage(language === 'bn' ? 'মাইক্রোফোন পারমিশন দেওয়া হয়নি!' : 'Microphone access denied!');
      } else if (event.error === 'no-speech') {
        setStatusMessage(language === 'bn' ? 'কোন শব্দ শোনা যায়নি' : 'No speech detected');
      } else {
        setStatusMessage(language === 'bn' ? 'ভয়েস প্রসেসিং ত্রুটি!' : 'Voice sync error!');
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language]);

  // Command-to-Tab Mapping Dictionary supporting English and Bengali spoken words, including phrase variations
  const voiceMap: Array<{ tabId: string; phrases: string[]; labelBn: string; labelEn: string; roles: string[] }> = [
    { 
      tabId: 'dashboard', 
      phrases: ['dashboard', 'ড্যাশবোর্ড', 'হোম', 'home', 'মূল পাতা', 'যাও ড্যাশবোর্ড', 'ওপেন ড্যাশবোর্ড', 'ড্যাশবোর্ডে যাও', 'dashboard panel', 'ড্যাশবোর্ড প্যানেল', 'main page', 'homepage', 'overview', 'ওভারভিউ'],
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      roles: ['Admin', 'Committee Member', 'Resident', 'Security Guard', 'Staff']
    },
    { 
      tabId: 'members', 
      phrases: ['members', 'সদস্য', 'সদস্যরা', 'member', 'ফ্ল্যাট মালিক', 'মালিক', 'ইউজার', 'যাও সদস্যর', 'সদস্য তালিকা', 'ফ্ল্যাট মেম্বার', 'মেম্বার্স', 'members list', 'member directory', 'committee members', 'কমিটি'],
      labelBn: 'সদস্যরা',
      labelEn: 'Members',
      roles: ['Admin', 'Committee Member', 'Resident']
    },
    { 
      tabId: 'flats', 
      phrases: ['flats', 'ফ্ল্যাট', 'ফ্ল্যাটসমূহ', 'flat', 'কামরা', 'ফ্ল্যাট তালিকা', 'ফ্ল্যাট দেখুন', 'ফ্ল্যাটের তথ্য', 'flats map', 'flat directory', 'ফ্ল্যাট ম্যাপ', 'isometric view', '৩ডি ম্যাপ'],
      labelBn: 'ফ্ল্যাটসমূহ',
      labelEn: 'Flats Map',
      roles: ['Admin', 'Committee Member', 'Resident', 'Security Guard']
    },
    { 
      tabId: 'construction', 
      phrases: ['construction', 'নির্মাণ', 'বিল্ডিং', 'কাজ', 'building progress', 'construction update', 'কন্সট্রাকশন', 'কাজের অগ্রগতি', 'progress meter', 'progress report', 'অগ্রগতি রিপোর্ট'],
      labelBn: 'নির্মাণ অগ্রগতি',
      labelEn: 'Construction',
      roles: ['Admin', 'Committee Member', 'Resident']
    },
    { 
      tabId: 'project-videos', 
      phrases: ['project videos', 'ভিডিও', 'লাইভ ভিডিও', 'ভিডিওর লিংক', 'ভিডিও গ্যালারি', 'project gallery', 'প্রজেক্ট ভিডিও', 'ভিডিও গ্যালারী', 'videos', 'live stream', 'live video', 'ভিডিওসমূহ'],
      labelBn: 'লাইভ ভিডিও',
      labelEn: 'Project Videos',
      roles: ['Admin', 'Committee Member', 'Resident', 'Security Guard', 'Staff']
    },
    { 
      tabId: 'payments', 
      phrases: ['payments', 'পেমেন্ট', 'টাকা', 'পরিশোধ', 'payment info', 'বিল', 'bills', 'bill', 'টাকা পরিশোধ', 'জমা করুন', 'payment', 'payment history', 'payments history', 'পেমেন্টস', 'জমা', 'bdt transaction', 'transaction list', 'বিল পরিশোধ'],
      labelBn: 'পেমেন্ট ও বিল',
      labelEn: 'Payments',
      roles: ['Admin', 'Resident', 'Committee Member']
    },
    { 
      tabId: 'expenses', 
      phrases: ['expenses', 'খরচ', 'হিসাব', 'ব্যয়', 'expense report', 'ব্যয়', 'খরচের খাতা', 'expense', 'expense list', 'ব্যয়সমূহ', 'আয় ব্যয়'],
      labelBn: 'ব্যয় হিসাব',
      labelEn: 'Expenses',
      roles: ['Admin']
    },
    { 
      tabId: 'notices', 
      phrases: ['notices', 'নোটিশ', 'ঘোষণা', 'notices board', 'নোটিশ বোর্ড', 'ঘোষণা সমুহ', 'notice', 'নোটিশসমূহ', 'announcements', 'announcement'],
      labelBn: 'নোটিশ বোর্ড',
      labelEn: 'Notices',
      roles: ['Admin', 'Committee Member', 'Resident']
    },
    { 
      tabId: 'complaints', 
      phrases: ['complaints', 'অভিযোগ', 'সমস্যা', 'complain', 'complaint', 'অভিযোগ বোর্ড', 'কমপ্লেন', 'complaints list', 'complain box', 'অভিযোগ বক্স', 'হেল্পডেস্ক'],
      labelBn: 'অভিযোগ',
      labelEn: 'Complaints',
      roles: ['Admin', 'Committee Member', 'Resident']
    },
    { 
      tabId: 'visitors', 
      phrases: ['visitors', 'ভিজিটর', 'মেহমান', 'visitor list', 'ভিজিটররা', 'ভিজিটর এন্ট্রি', 'দর্শনার্থী', 'visitor', 'মেহমান তালিকা', 'গেস্ট', 'guests'],
      labelBn: 'ভিজিটর',
      labelEn: 'Visitors',
      roles: ['Admin', 'Security Guard', 'Staff']
    },
    { 
      tabId: 'staff', 
      phrases: ['staff', 'স্টাফ', 'কর্মী', 'প্রহরী', 'guards', 'guard', 'কর্মচারী', 'গার্ড', 'স্টাফ ও প্রহরী'],
      labelBn: 'স্টাফ ও প্রহরী',
      labelEn: 'Staff',
      roles: ['Admin']
    },
    { 
      tabId: 'reports', 
      phrases: ['reports', 'রিপোর্ট', 'প্রতিবেদন', 'হিসাবপত্র', 'report', 'ফাইনান্সিয়াল রিপোর্ট', 'financial reports', 'reports list', 'audit logs'],
      labelBn: 'প্রতিবেদন',
      labelEn: 'Reports',
      roles: ['Admin']
    },
    { 
      tabId: 'settings', 
      phrases: ['settings', 'সেটিংস', 'কনফিগারেশন', 'ওয়েবসাইট সেটিংস', 'সিস্টেম সেটিংস', 'setting', 'কনফিগার', 'পাসওয়ার্ড'],
      labelBn: 'সেটিংস',
      labelEn: 'Settings',
      roles: ['Admin']
    },
    { 
      tabId: 'profile', 
      phrases: ['profile', 'প্রোফাইল', 'আমার প্রোফাইল', 'user profile', 'প্রোফাইল দেখুন', 'my profile', 'প্রোফাইলে যাও', 'নিজের প্রোফাইল'],
      labelBn: 'আমার প্রোফাইল',
      labelEn: 'My Profile',
      roles: ['Admin', 'Committee Member', 'Resident', 'Security Guard', 'Staff']
    },
    { 
      tabId: 'backup', 
      phrases: ['backup', 'ব্যাকআপ', 'ডাটা ব্যাকআপ', 'নিরাপদ ব্যাকআপ', 'system backup', 'restore', 'রিস্টোর'],
      labelBn: 'ব্যাকআপ',
      labelEn: 'Backup & Restore',
      roles: ['Admin']
    }
  ];

  // Dynamic Web Audio API sound generator for a pleasant, premium dual-toned soft chime
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      
      // Tone 1: Fundamental soft high chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      osc1.type = 'sine';
      // Harmonic scale note C6 (1046.50 Hz)
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime);
      
      // Extremely quick fade-in for softness, then exponential decay for a crisp finish
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Tone 2: Warm third offset (E6, 1318.51 Hz) delayed slightly for the double chime effect
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
      
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
      gain2.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      // Track playback lifetimes
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);
      
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (err) {
      console.warn('Web Audio Feedback omitted: browser session has not received user interaction yet / browser policies blocked auto-playback.', err);
    }
  };

  // Text-To-Speech audio feedback cue confirming processed tab navigation
  const playSpeechConfirmation = (label: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      
      // Cancel any outstanding speech immediately
      window.speechSynthesis.cancel();
      
      const isEnglish = language !== 'bn';
      const promptText = isEnglish 
        ? `Navigating to ${label}` 
        : `${label} এ নিয়ে যাওয়া হচ্ছে`;
        
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.lang = isEnglish ? 'en-US' : 'bn-BD';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Text-to-speech confirmation feedback was blocked by browser playback policies.', err);
    }
  };

  const processVoiceCommand = (rawSpeech: string) => {
    // Clean user speech from symbols and punctuation marks
    const textCleanSpace = rawSpeech.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
    
    // Core English and Bengali carrier phrases (fillers / trigger phrases) to strip away
    const carrierPhrases = [
      'take me to the',
      'take me to',
      'please take me to the',
      'please take me to',
      'show me the',
      'show me',
      'please show me the',
      'please show me',
      'go to the',
      'go to',
      'open the',
      'open',
      'view the',
      'view',
      'can you show me the',
      'can you show me',
      'navigate to the',
      'navigate to',
      'i want to see the',
      'i want to see',
      'display the',
      'display',
      
      // Bengali triggers
      'আমাকে নিয়ে চলুন',
      'আমাকে নিয়ে যাও',
      'আমাকে দেখাও',
      'নিয়ে চলুন',
      'নিয়ে যাও',
      'নিয়ে চলেন',
      'ওপেন করো',
      'ওপেন করুন',
      'দেখতে চাই',
      'দেখাও',
      'যাও',
      'যান',
      'খুলুন',
      'খুলো'
    ];

    let corePhrase = textCleanSpace;
    
    // Strip prefixes
    for (const carrier of carrierPhrases) {
      if (corePhrase.startsWith(carrier + " ")) {
        corePhrase = corePhrase.slice(carrier.length + 1).trim();
        break;
      }
    }
    
    // Strip suffixes
    for (const carrier of carrierPhrases) {
      if (corePhrase.endsWith(" " + carrier)) {
        corePhrase = corePhrase.slice(0, corePhrase.length - (carrier.length + 1)).trim();
        break;
      }
    }

    const sensitivity = config?.voiceSensitivity || 'standard';
    console.log("Analyzing speech command:", { raw: rawSpeech, cleaned: textCleanSpace, core: corePhrase, sensitivity });

    // Find matching tab
    let foundTab: string | null = null;
    let foundLabel = '';

    for (const mapping of voiceMap) {
      const match = mapping.phrases.some(phrase => {
        const cleanPhrase = phrase.toLowerCase().trim();
        
        if (sensitivity === 'high') {
          // Lenient & highly sensitive: Match exact, short partial substrings, or any significant sub-words
          if (corePhrase === cleanPhrase || textCleanSpace === cleanPhrase) {
            return true;
          }
          if (corePhrase.length >= 2 && (cleanPhrase.includes(corePhrase) || corePhrase.includes(cleanPhrase))) {
            return true;
          }
          // Word-by-word tokenized overlap check (e.g. "payment" matches "payment history" easily)
          const coreTokens = corePhrase.split(/\s+/).filter(tok => tok.length >= 2);
          const phraseTokens = cleanPhrase.split(/\s+/).filter(tok => tok.length >= 2);
          const hasOverlap = coreTokens.some(tok => phraseTokens.includes(tok));
          if (hasOverlap) {
            return true;
          }
          return textCleanSpace.includes(cleanPhrase);
        } else {
          // Standard sensitivity (default): Strict matching rules
          return (
            corePhrase === cleanPhrase ||
            textCleanSpace === cleanPhrase ||
            (corePhrase.length >= 4 && cleanPhrase.includes(corePhrase)) ||
            (cleanPhrase.length >= 4 && corePhrase.includes(cleanPhrase))
          );
        }
      });

      if (match) {
        // Role permission validation check
        const userRole = currentUser?.role || 'Resident';
        if (mapping.roles.includes(userRole)) {
          foundTab = mapping.tabId;
          foundLabel = language === 'bn' ? mapping.labelBn : mapping.labelEn;
          break;
        } else {
          setStatusMessage(language === 'bn' ? `ব্যর্থ: ${mapping.labelBn} দেখার অনুমতি নেই` : `Access denied to view ${mapping.labelEn}`);
          return;
        }
      }
    }

    if (foundTab) {
      setActiveTab(foundTab);
      setSuccessCommand(foundLabel);
      setStatusMessage(language === 'bn' ? `সফল: '${foundLabel}' ওপেন করা হয়েছে!` : `Navigated successfully to '${foundLabel}'!`);
      
      // Play soft chime audio feedback cue
      playSuccessChime();
      
      // Play Text-to-Speech confirmation feedback
      playSpeechConfirmation(foundLabel);
      
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        setSuccessCommand(null);
      }, 5000);
    } else {
      setStatusMessage(
        language === 'bn' 
          ? `কোড মেলেনি: "${textCleanSpace}"` 
          : `Command unrecognized: "${textCleanSpace}"`
      );
    }
  };

  const handleToggleListening = () => {
    if (!supported) return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Re-initialize language setting if language changed before click
      if (recognitionRef.current) {
        recognitionRef.current.lang = language === 'bn' ? 'bn-BD' : 'en-US';
      }
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Fallback for double starts
        setIsListening(false);
      }
    }
  };

  return (
    <div className="relative flex items-center font-sans tracking-normal select-none">
      
      {/* Help Command Sheet Icon */}
      <button
        id="voice-commands-help-btn"
        type="button"
        onClick={() => setShowCommandsGuide(!showCommandsGuide)}
        title={language === 'bn' ? 'ভয়েস কমান্ড ডিকশনারী' : 'Voice Command Helper Dictionary'}
        className="mr-2 p-1.5 rounded-full text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {/* Main Microphone Action Trigger */}
      <button
        id="voice-mic-trigger-btn"
        type="button"
        onClick={handleToggleListening}
        disabled={!supported}
        className={`relative p-2.5 rounded-full flex items-center justify-center transition-all ${
          !supported 
            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400' 
            : isListening
              ? 'bg-red-600 text-white shadow-md animate-pulse ring-4 ring-red-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
        } cursor-pointer`}
        title={
          !supported
            ? (language === 'bn' ? 'ভয়েস কমান্ড সমর্থিত নয়' : 'Speech recognition not supported')
            : (language === 'bn' ? 'ভয়েস নেভিগেশন' : 'Voice navigation search control')
        }
      >
        {!supported ? (
          <MicOff className="h-4 w-4" />
        ) : isListening ? (
          <Mic className="h-4 w-4 text-white scale-110" />
        ) : (
          <Mic className="h-4 w-4" />
        )}

        {/* Live Active Listening Indicator Ring */}
        {isListening && (
          <span className="absolute -inset-0.5 rounded-full bg-red-500 animate-ping opacity-30 pointer-events-none" />
        )}
      </button>

      {/* Status Overlay Float Message Bubble */}
      {(isListening || statusMessage || interimTranscript) && (
        <div 
          id="voice-status-bubble"
          className={`absolute right-0 top-12 mt-1 w-64 p-3 rounded-xl border bg-white shadow-xl z-50 transition-all ${
            successCommand 
              ? 'border-emerald-300 bg-emerald-50/90' 
              : 'border-slate-200 bg-white/95'
          }`}
        >
          <div className="flex gap-2 items-start">
            {successCommand ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : isListening ? (
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 text-left">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                <span>{language === 'bn' ? 'নির্দেশনা গেটওয়ে' : 'Voice Assistant'}</span>
                {isListening && <span className="h-1.5 w-1.5 rounded-full bg-red-610 animate-ping inline-block" />}
              </p>
              
              <p className="text-xs font-semibold text-slate-800 mt-1 font-sans">
                {statusMessage || (language === 'bn' ? 'কোড বলুন...' : 'Listening to command...')}
              </p>

              {/* Live interim spoken transcript feedback */}
              {interimTranscript && (
                <p className="text-[11px] italic text-emerald-600 font-mono mt-1 leading-normal border-l-2 border-emerald-400 pl-1.5 py-0.5">
                  &quot;{interimTranscript}&quot;
                </p>
              )}

              {transcript && !interimTranscript && (
                <p className="text-[11px] font-mono text-slate-500 mt-1 border-l border-slate-300 pl-1.5">
                  {language === 'bn' ? 'উচ্চারণ:' : 'Detected:'} &quot;{transcript}&quot;
                </p>
              )}
            </div>
          </div>
          
          <div className="text-[8px] text-slate-400 font-mono text-right mt-2 pt-1 border-t border-slate-100">
            {language === 'bn' ? 'ভাষা: বাংলা (বাংলাদেশ)' : 'Language: English (US)'}
          </div>
        </div>
      )}

      {/* Helper Information Cheat-sheet Popover */}
      {showCommandsGuide && (
        <div 
          id="voice-commands-guide-card"
          className="absolute right-0 top-12 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl z-50 font-sans"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'ভয়েস কমান্ড নির্দেশাবলী' : 'Voice Guide'}</span>
            </h4>
            <button 
              type="button"
              onClick={() => setShowCommandsGuide(false)}
              className="text-slate-400 hover:text-slate-650 text-[10px] font-bold font-mono uppercase"
            >
              [close]
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto mt-2 space-y-2 pr-1 text-[11px] scrollbar-thin">
            <p className="text-slate-500 leading-relaxed font-sans">
              {language === 'bn' 
                ? 'মাইক্রোফোন চালু হলে পরিষ্কারভাবে নিচের শব্দগুলো বলুন। আপনার ইউজার রোলের অনুমতি থাকা প্রয়োজন।' 
                : 'Say any of the listed active shortcut words cleanly to jump to that screen.'}
            </p>

            <div className="grid grid-cols-2 gap-1.5 font-sans pt-1">
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">home, dashboard, হোম</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'সদস্যরা' : 'Members'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">members, সদস্য</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'ফ্ল্যাট ম্যাপ' : 'Flats'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">flats, flat, ফ্ল্যাট</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'অগ্রগতি' : 'Construction'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">construct, নির্মাণ</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'লাইভ ভিডিও' : 'Videos'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">videos, ভিডিও</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'পেমেন্ট' : 'Payments'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">payments, পেমেন্ট</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'খরচ হিসাব' : 'Expenses'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">expenses, ব্যয়</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'নোটিশ বোর্ড' : 'Notices'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">notices, নোটিশ</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'অভিযোগ' : 'Complaints'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">complaints, অভিযোগ</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'ভিজিটর' : 'Visitors'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">visitors, ভিজিটর</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'প্রোফাইল' : 'Profile'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">profile, প্রোফাইল</code>
              </div>
              <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-left">
                <p className="font-bold text-slate-700">{language === 'bn' ? 'রিপোর্ট সমূহ' : 'Reports'}</p>
                <code className="text-[9px] text-[#047857] block mt-0.5">reports, রিপোর্ট</code>
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-[9px] bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-150 leading-normal flex items-center gap-1.5 justify-center">
            <Volume2 className="h-3 w-3 shrink-0" />
            <span>{language === 'bn' ? 'ভাষা বদল করতে উপরের EN/BN সিলেক্ট করুন' : 'Change lang via top EN/BN toggle'}</span>
          </div>
        </div>
      )}

    </div>
  );
}
