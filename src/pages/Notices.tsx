/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Notice } from '../types';
import SpeechDictationButton from '../components/SpeechDictationButton';
import { Megaphone, Plus, Calendar, Bell, ShieldAlert, X, Eye, EyeOff, Printer, MessageSquareShare } from 'lucide-react';

export default function Notices() {
  const { notices, addNotice, updateNotice, deleteNotice, currentUser, language, members } = useSociety();
  const t = translations[language];

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Notice['type']>('Announcement');
  const [expiryDate, setExpiryDate] = useState('');
  const [isPermanent, setIsPermanent] = useState(true);

  const [smsMessage, setSmsMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingNotice(null);
    setTitle('');
    setContent('');
    setType('Announcement');
    setExpiryDate('');
    setIsPermanent(true);
    setShowAddModal(true);
  };

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setType(notice.type);
    setExpiryDate(notice.expiryDate || '');
    setIsPermanent(!notice.expiryDate);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    if (!title || !content) return;

    if (editingNotice) {
      updateNotice({
        ...editingNotice,
        title,
        content,
        type,
        expiryDate: isPermanent ? undefined : (expiryDate || undefined),
      });
    } else {
      addNotice({
        title,
        content,
        type,
        expiryDate: isPermanent ? undefined : (expiryDate || undefined),
        active: true
      });
    }

    setTitle('');
    setContent('');
    setType('Announcement');
    setExpiryDate('');
    setIsPermanent(true);
    setEditingNotice(null);
    setShowAddModal(false);
  };

  const toggleNoticeActive = (notice: Notice) => {
    updateNotice({
      ...notice,
      active: !notice.active
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
            {t.notice_title}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Important society updates, DNS spraying, water shutdowns, or building maintenance notices
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.role === 'Admin' && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 border border-[#D4AF37]/35 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{t.post_notice}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notices Feed List Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {notices.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-emerald-950 py-12 text-center text-xs text-slate-500 font-mono">
            Notice board empty. Excellent, peace reigns!
          </div>
        ) : (
          notices.map((notice) => (
            <div 
              key={notice.id}
              className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all hover:border-[#D4AF37]/30 ${
                !notice.active ? 'opacity-40 border-neutral-800 bg-neutral-950/20' : 
                notice.type === 'Emergency' ? 'border-red-950 bg-gradient-to-tr from-black via-red-950/10 to-black text-rose-100' :
                notice.type === 'Alert' ? 'border-[#D4AF37]/30 bg-neutral-950/40 text-amber-100' :
                'border-emerald-950 bg-neutral-950/40 text-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border ${
                    notice.type === 'Emergency' ? 'bg-red-950 text-red-400 border-red-900 animate-pulse' :
                    notice.type === 'Alert' ? 'bg-amber-950 text-amber-500 border-amber-900' :
                    'bg-emerald-950 text-emerald-400 border-emerald-900'
                  }`}>
                    {notice.type}
                  </span>
                  
                  <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {notice.date}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-white leading-snug tracking-tight">
                  {notice.title}
                </h3>
                
                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line pt-1">
                  {notice.content}
                </p>
              </div>

              {/* Expiry alerts & Admin controls footer block */}
              <div className="flex items-center justify-between pt-3 border-t border-emerald-950/50 text-[10px] font-mono">
                {notice.expiryDate ? (
                  <span className="text-[#D4AF37]/80 flex items-center gap-1.5 font-sans font-semibold">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{language === 'bn' ? `মেয়াদ: ${notice.expiryDate}` : `Expires: ${notice.expiryDate}`}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shadow-sm font-sans">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>{language === 'bn' ? 'স্থায়ী নোটিশ' : 'Permanent Notice'}</span>
                  </span>
                )}

                {currentUser?.role === 'Admin' && (
                  <div className="flex items-center gap-3 print:hidden">
                    {/* Hide notice selector toggle */}
                    <button
                      type="button"
                      onClick={() => toggleNoticeActive(notice)}
                      title={notice.active ? 'Archive notice' : 'Unhide notice'}
                      className="text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                    >
                      {notice.active ? <EyeOff className="h-3.5 w-3.5 text-slate-500" /> : <Eye className="h-3.5 w-3.5 text-emerald-500" />}
                      <span>{notice.active ? 'Hide' : 'Publish'}</span>
                    </button>
                    {/* Edit notice */}
                    <button
                      type="button"
                      onClick={() => openEditModal(notice)}
                      className="text-[#D4AF37] hover:underline"
                    >
                      {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                    </button>
                    {/* Delete notice */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই নোটিশটি মুছতে চান?' : 'Are you sure you want to delete this notice?')) {
                          deleteNotice(notice.id);
                        }
                      }}
                      className="text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Write Notice Modal Popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[#D4AF37]/35 bg-neutral-950 p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingNotice ? (language === 'bn' ? 'নোটিশ সংশোধন করুন' : 'Edit Bulletin Details') : t.post_notice}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingNotice(null);
                }} 
                className="text-slate-400 hover:text-white"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              {/* title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Notice Heading</label>
                  <SpeechDictationButton onTranscript={(txt) => setTitle(p => p ? `${p} ${txt}` : txt)} />
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="DNCC larvicide spraying timeline"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Type Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">
                    {language === 'bn' ? 'নোটিশ ক্যাটাগরি' : 'Bulletin Priority'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-1.5 text-white focus:outline-none"
                  >
                    <option value="Announcement">Announcement / সাধারণ নোটিশ</option>
                    <option value="Emergency">Emergency Alert / জরুরি ঘোষণা</option>
                    <option value="Alert">DNCC Alert / মশক নিধন নোটিশ</option>
                    <option value="Event">Community Event / সোসাইটি ইভেন্ট</option>
                  </select>
                </div>

                {/* Permanent Notice Toggle Container */}
                <div className="bg-neutral-900/60 p-3.5 rounded-lg border border-emerald-950/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-bold text-white block">
                        {language === 'bn' ? 'স্থায়ী নোটিশ (Permanent Notice)' : 'Mark as Permanent Notice'}
                      </label>
                      <span className="text-[9px] text-slate-400 block leading-tight">
                        {language === 'bn' 
                          ? 'এই নোটিশটির কোনো নির্দিষ্ট মেয়াদ থাকবে না এবং স্ক্রিন থেকে নিজে থেকে মুছবে না।'
                          : 'Notice has no expiry limit and will stay live indefinitely on the board.'
                        }
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPermanent}
                      onChange={(e) => {
                        setIsPermanent(e.target.checked);
                        if (e.target.checked) {
                          setExpiryDate('');
                        }
                      }}
                      className="h-5 w-5 rounded border-emerald-950 bg-neutral-950 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {!isPermanent && (
                    <div className="pt-2 border-t border-emerald-950/50 space-y-1 animate-fade-in">
                      <label className="text-[10px] font-bold text-[#D4AF37] block font-mono uppercase tracking-wide">
                        {language === 'bn' ? 'মেয়াদ শেষ হওয়ার শেষ সময়' : 'Expiry timeline date'}
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        required={!isPermanent}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-1.5 text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Notices Content body</label>
                  <SpeechDictationButton onTranscript={(txt) => setContent(p => p ? `${p} ${txt}` : txt)} />
                </div>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dear Residents, DNCC officials will be spraying larval disinfectant bushes this Friday scheduled at 4:30 PM..."
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNotice(null);
                  }}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-500 font-bold"
                >
                  {editingNotice ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Modifications') : 'Publish Notice'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
