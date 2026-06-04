/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSociety } from '../context/SocietyContext';

interface SpeechDictationButtonProps {
  onTranscript: (text: string) => void;
  lang?: 'en' | 'bn';
  placeholder?: string;
}

export default function SpeechDictationButton({ onTranscript, lang, placeholder }: SpeechDictationButtonProps) {
  const { language } = useSociety();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Determine language locale
  const activeLang = lang || (language === 'bn' ? 'bn' : 'en');
  const locale = activeLang === 'bn' ? 'bn-BD' : 'en-US';

  useEffect(() => {
    // Check compatibility with standard Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = locale;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    rec.onerror = (event: any) => {
      console.warn('Speech Recognition Error Level:', event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [locale, onTranscript]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported || !recognitionRef.current) {
      alert(
        language === 'bn'
          ? 'দুঃখিত, আপনার ব্রাউজার স্পিচ রিকগনিশন সমর্থন করে না। অনুগ্রহ করে ক্রোম ব্রাউজার ব্যবহার করুন।'
          : 'Speech recognition is not supported in this browser. Please try in Google Chrome.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = locale;
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech start error:', err);
      }
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className="p-1.5 rounded-md border border-neutral-850 bg-neutral-900/50 text-slate-600 cursor-not-allowed text-[10px]"
        title={language === 'bn' ? 'স্পিচ টু টেক্সট সমর্থিত নয়' : 'Speech-to-text not supported'}
      >
        <MicOff className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-1.5 rounded-md border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
        isListening
          ? 'bg-rose-950/60 border-rose-800/80 text-rose-400 animate-pulse shadow shadow-rose-950/20'
          : 'bg-neutral-950 border-emerald-950 text-slate-400 hover:text-white hover:border-[#D4AF37]/40'
      }`}
      title={
        isListening
          ? language === 'bn'
            ? 'শুনছি... বন্ধ করতে ক্লিক করুন'
            : 'Listening... click to stop'
          : language === 'bn'
          ? 'মাইক্রোফোন দিয়ে লিখুন'
          : 'Dictate using microphone'
      }
    >
      {isListening ? (
        <>
          <Mic className="h-3.5 w-3.5 text-rose-500" />
          <span className="text-[10px] font-bold font-mono tracking-wider animate-pulse">REC</span>
        </>
      ) : (
        <>
          <Mic className="h-3.5 w-3.5 text-emerald-500" />
          {placeholder && <span className="text-[9px] font-sans text-slate-500 font-normal">{placeholder}</span>}
        </>
      )}
    </button>
  );
}
