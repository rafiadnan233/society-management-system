/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations, getFloorName } from '../utils/translations';
import { Building, User, Mail, Phone, Shield, FileText, AlertCircle, ShoppingBag, Megaphone } from 'lucide-react';

interface RegisterProps {
  onLoginClick: () => void;
}

export default function Register({ onLoginClick }: RegisterProps) {
  const { registerUser, language, setLanguage, flats, notices } = useSociety();
  const t = translations[language];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [flatNumber, setFlatNumber] = useState('1B');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const permanentNotices = notices?.filter(n => n.active && !n.expiryDate) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !phone || !nid || !password) {
      setError(language === 'bn' ? 'দয়া করে সব ফিল্ড পূরণ করুন' : 'Please fill in all fields');
      return;
    }

    if (phone.length < 11) {
      setError(language === 'bn' ? 'মোবাইল নম্বরটি ১১ ডিজিট হতে হবে' : 'Phone number must be at least 11 digits');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = await registerUser({
        name,
        email,
        phone,
        nid,
        role: 'Resident', // Default client self-registration
        flatNumber,
        password
      });
      
      if (success) {
        setRegisteredSuccess(true);
      } else {
        setError('Integration Error occurred during register.');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100">
        <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100/80 border border-emerald-500 shadow-md">
              <Shield className="h-8 w-8 text-emerald-600 animate-bounce" />
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-800 font-sans">
              {language === 'bn' ? 'নিবন্ধন সফলভাবে সম্পন্ন!' : 'Registration Completed Setup!'}
            </h2>
            
            <div className="text-xs text-slate-600 leading-relaxed font-sans space-y-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
              <p>
                {language === 'bn'
                  ? 'আপনার অনুরোধটি সফলভাবে জমা দেওয়া হয়েছে। আপনার অ্যাকাউন্টটি বর্তমানে এডমিনের সক্রিয়করণের অপেক্ষায় আছে।'
                  : 'Your access enrolment request has been dispatch verified in the database buffer.'}
              </p>
              <p className="font-semibold text-emerald-800">
                {language === 'bn'
                  ? 'এডমিন অনুমোদন দেওয়ার পর আপনি আপনার অ্যাকাউন্টে লগইন করতে পারবেন।'
                  : 'You will gain system-wide authorized access as soon as the Admin approves your account.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onLoginClick}
              className="flex w-full items-center justify-center rounded-lg border border-transparent bg-emerald-700 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-600 focus:outline-none cursor-pointer"
            >
              {language === 'bn' ? 'লগইন পেজে যান' : 'Access Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Permanent Notices Scrolling Marquee Bar */}
      {permanentNotices.length > 0 && (
        <div className="bg-[#051410] border-b border-emerald-900/60 h-12 flex items-center relative z-10 overflow-hidden shadow-inner select-none transition-all duration-300">
          {/* Static Title/Badge Pin */}
          <div className="absolute left-0 top-0 bottom-0 px-4 bg-emerald-950/95 border-r border-[#059669]/30 flex items-center gap-1.5 shadow-[2px_0_5px_rgba(0,0,0,0.5)] z-20 shrink-0">
            <Megaphone className="h-4 w-4 text-[#D4AF37] shrink-0" />
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-sans">
              {language === 'bn' ? 'স্থায়ী নোটিশ' : 'Notice Ticker'}
            </span>
          </div>
          
          {/* Overflow Frame with left padding preventing overlap */}
          <div className="w-full pl-36 flex items-center overflow-hidden">
            <div className="animate-marquee-scroll inline-block whitespace-nowrap text-[20px] font-bold py-1 tracking-wide">
              {permanentNotices.map((notice, index) => (
                <span key={notice.id} className="inline-flex items-center text-slate-200 transition-colors hover:text-white">
                  <span className="font-extrabold text-[#D4AF37] select-none font-sans">
                    {notice.title}:
                  </span>
                  <span className="ml-3 pr-1 font-sans">{notice.content}</span>
                  {index < permanentNotices.length - 1 && (
                    <span className="mx-10 text-emerald-800 font-extrabold select-none hover:text-emerald-500 font-sans">✦✦✦</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Language Toggle Floating Top Right */}
      <div className="absolute top-16 right-4 z-50 flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${language === 'en' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('bn')}
          className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${language === 'bn' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
        >
          BN
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        
        {/* Brand Link */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 border-2 border-amber-500 ring-4 ring-amber-500/10">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-800 font-sans">
            {language === 'bn' ? 'সোসাইটি আবাসিক নিবন্ধন' : 'Resident Portal Enrolment'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            {t.tagline} • ASTHA TWIN TOWERS
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-slate-500 font-mono block">
              {language === 'bn' ? 'পূর্ণ নাম (ইংরেজি)' : 'Full Name (English)'}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="h-4 w-4 text-emerald-600" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tanvir Ahmed Chowdhury"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-slate-500 font-mono block">
              {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="h-4 w-4 text-emerald-600" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reziar@gmail.com"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500 font-mono block">
                {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone className="h-4 w-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="01712345678"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* NID */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500 font-mono block">
                {language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)'}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  required
                  value={nid}
                  onChange={(e) => setNid(e.target.value.replace(/\D/g, ''))}
                  placeholder="4023901420951"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Flat assigned Selector */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-emerald-700 font-mono block">
                {language === 'bn' ? 'আপনার ফ্ল্যাট নম্বর' : 'Your Flat / Suite'}
              </label>
              <select
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                className="block w-full rounded-md border border-slate-200 bg-slate-55 py-2 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {flats.map(f => (
                  <option key={f.id} value={f.number}>
                    Flat {f.number} ({getFloorName(f.floor, language)})
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-500 font-mono block">
                {language === 'bn' ? 'পাসওয়ার্ড সেট করুন' : 'Setup Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg border border-transparent bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-600 focus:outline-none cursor-pointer disabled:opacity-55"
          >
            {loading ? (
              <span className="font-mono">ENROLLING RESIDENTIAL SLOT...</span>
            ) : (
              <span>{language === 'bn' ? 'নিবন্ধন সম্পন্ন করুন' : 'Confirm Portal Enrolment'}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            {language === 'bn' ? 'ইতিমধ্যে একাউন্ট আছে?' : 'Already have a dynamic account?'}{' '}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-amber-700 hover:underline font-bold"
            >
              {language === 'bn' ? 'লগইন করুন' : 'Access Sign In'}
            </button>
          </p>
        </div>

      </div>
    </div>
    </div>
  );
}
