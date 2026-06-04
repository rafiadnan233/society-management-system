/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Save, User, Mail, Phone, FileText, Home, Award, Sparkles, Key } from 'lucide-react';

export default function Profile() {
  const { currentUser, language, updateProfile, updateUserPassword } = useSociety();
  const t = translations[language];

  // Forms
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [success, setSuccess] = useState('');

  // Password alteration states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      updateProfile(name, phone, email, currentUser.nid || '');
      setSuccess(language === 'bn' ? 'প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!' : 'Personal Profile details saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (!currentUser) return;

    if (newPassword.length < 4) {
      setPassError(
        language === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!'
          : 'Password must be at least 4 characters long!'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError(
        language === 'bn'
          ? 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি!'
          : 'New password and confirm password did not match!'
      );
      return;
    }

    try {
      updateUserPassword(currentUser.uid, newPassword);
      setPassSuccess(
        language === 'bn'
          ? 'আপনার সিকিউরিটি পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!'
          : 'Your security password has been successfully updated!'
      );
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(''), 4000);
    } catch (err: any) {
      setPassError(err.message || 'Failed to update passcode.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-400" />
          <span>My Profile Portal</span>
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Revise contact credentials, verify assigned apartment units and preview official digital resident credentials card
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column wrapper containing both Details and Security cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form edits profile */}
          <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5 pb-2 border-b border-emerald-950">
              Account Details Settings
            </h3>

            {success && (
              <p className="p-2.5 bg-emerald-950/25 border border-emerald-800 text-emerald-400 text-xs rounded-md">
                ✔ {success}
              </p>
            )}

            {currentUser?.role === 'Resident' && (
              <p className="p-2.5 bg-amber-950/25 border border-amber-800 text-amber-500 text-xs rounded-md mb-2 font-semibold">
                ℹ {language === 'bn' ? 'বাসিন্দা ব্যবহারকারীরা তাদের প্রোফাইল এডিট করতে পারবেন না।' : 'Resident users are not authorized to edit profile details.'}
              </p>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Full Name (English)</label>
                  <input
                    type="text"
                    required
                    disabled={currentUser?.role === 'Resident'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none disabled:opacity-50"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Profile Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={currentUser?.role === 'Resident'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Mobile Contact Number</label>
                  <input
                    type="text"
                    required
                    disabled={currentUser?.role === 'Resident'}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none disabled:opacity-50"
                  />
                </div>

                {/* Immutable info display */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block font-mono">Clearance Role</label>
                  <div className="block w-full rounded border border-neutral-900 bg-neutral-950 px-3 py-2 text-slate-500 font-bold uppercase tracking-wider font-mono">
                    {currentUser?.role}
                  </div>
                </div>
              </div>

              {/* save */}
              {currentUser?.role !== 'Resident' && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4.5 py-2 hover:bg-emerald-500 rounded-lg bg-emerald-600 border border-[#D4AF37]/35 text-white font-bold cursor-pointer transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save credentials</span>
                  </button>
                </div>
              )}

            </form>
          </div>

          {/* Change Password Portal Section */}
          <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1.5 pb-2 border-b border-emerald-950">
              <Key className="h-4 w-4 text-emerald-400" />
              <span>{language === 'bn' ? 'সিকিউরিটি পাসওয়ার্ড পরিবর্তন' : 'Change Account Password Code'}</span>
            </h3>

            {passSuccess && (
              <p className="p-2.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900 text-xs rounded-md font-bold font-sans">
                ✔ {passSuccess}
              </p>
            )}
            {passError && (
              <p className="p-2.5 bg-rose-950/20 text-rose-400 border border-rose-900 text-xs rounded-md font-bold font-sans">
                ⚠ {passError}
              </p>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">
                    {language === 'bn' ? 'নতুন পাসওয়ার্ড দিন' : 'Enter New Secure Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    placeholder="Min 4 characters"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">
                    {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4.5 py-2 hover:bg-amber-600 rounded-lg bg-amber-700/60 border border-amber-800 text-white font-extrabold cursor-pointer transition-colors"
                >
                  <Key className="h-4 w-4" />
                  <span>{language === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* DIGITAL PASS CARD VISUAL */}
        <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
              Digital Resident Passport
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Self-authorizing identity permit card</p>
          </div>

          <div className="relative rounded-xl border border-[#D4AF37]/50 bg-gradient-to-tr from-emerald-950 via-neutral-950 to-neutral-950 p-5 shadow-2xl space-y-4 overflow-hidden mt-4 shrink-0 font-sans">
            
            {/* watermark badge */}
            <span className="absolute -bottom-10 -right-10 h-32 w-32 bg-emerald-500/5 rounded-full select-none" />

            {/* upper block seal */}
            <div className="flex justify-between items-baseline">
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-[#D4AF37] font-mono leading-none">
                  ASTHA TWIN TOWERS
                </span>
                <span className="text-[7.5px] text-slate-500 font-mono">Khetasar, Cumilla.</span>
              </div>
              <Sparkles className="h-4.5 w-4.5 text-[#D4AF37]/60" />
            </div>

            {/* Bio info */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-emerald-900 rounded-full border border-emerald-700 font-mono font-bold text-white text-xs flex items-center justify-center">
                  {currentUser?.name.charAt(0) || 'R'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{currentUser?.name || 'Resident guest'}</h4>
                  <p className="text-[9px] text-[#D4AF37] font-semibold font-mono tracking-wider">{currentUser?.role.toUpperCase()} PORTAL Access</p>
                </div>
              </div>

              {/* spec indicators */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-emerald-950/40 pt-3">
                <div>
                  <span className="block text-[8px] text-slate-500 font-bold">FLAT SUITE:</span>
                  <span className="font-bold text-slate-200">Suite {currentUser?.flatNumber || 'TBA'}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-500 font-bold">CONTACT DIRECT:</span>
                  <span className="font-bold text-slate-200">{currentUser?.phone}</span>
                </div>
              </div>
            </div>

            {/* Card verification barcode lines */}
            <div className="border-t border-emerald-950/40 pt-3 font-mono text-[8.5px] text-emerald-400/70 text-right">
              AUTHENTIC APARTMENT MEMBER SYSTEM SECURE
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
