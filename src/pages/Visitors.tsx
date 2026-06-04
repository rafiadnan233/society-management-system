/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Visitor } from '../types';
import { Plus, Search, UserCheck, Shield, Users, Clock, LogOut, CheckCircle, X, Printer, QrCode } from 'lucide-react';
import VisitorPassModal from '../components/VisitorPassModal';

export default function Visitors() {
  const { visitors, addVisitor, exitVisitor, language, flats, currentUser } = useSociety();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVisitorForPass, setSelectedVisitorForPass] = useState<Visitor | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('Personal Meet');
  const [flatNumber, setFlatNumber] = useState('1B');
  const [nidNumber, setNidNumber] = useState('');

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    if (!name || !phone || !flatNumber) return;

    addVisitor({
      name,
      phone,
      purpose,
      flatNumber,
      nid: nidNumber || undefined,
      numVisitors: 1,
      recordedBy: 'Guard Jewel'
    });

    setName('');
    setPhone('');
    setPurpose('Personal Meet');
    setNidNumber('');
    setShowAddModal(false);
  };

  const filteredLogs = visitors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.phone.includes(searchQuery);
    const matchesActive = !filterActiveOnly || v.status === 'Inside';
    return matchesSearch && matchesActive;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
            {t.visitors_title}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Gate check-in registry ledger for security personnel and guards
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          
          {currentUser?.role === 'Admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 border border-[#D4AF37]/35 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
            >
              <UserCheck className="h-4.5 w-4.5" />
              <span>{t.check_in_visitor}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and search grids */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <input
            type="text"
            placeholder={language === 'bn' ? 'দর্শক নাম, মোবাইল বা ফ্ল্যাট দিন...' : 'Search visitor logs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded bg-neutral-950/45 border border-emerald-950 py-2 pl-10 pr-3 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Checkbox filter for Active guest sessions */}
        <label className="flex items-center gap-2 text-xs font-bold font-mono text-slate-400 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={filterActiveOnly}
            onChange={(e) => setFilterActiveOnly(e.target.checked)}
            className="rounded border border-emerald-950 bg-neutral-900 text-emerald-500 focus:ring-0 cursor-pointer h-4 w-4"
          />
          <span>Show Checked-In Guests Only</span>
        </label>
      </div>

      {/* Grid of registered logs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLogs.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-emerald-950 py-12 text-center text-xs text-slate-500 font-mono">
            Zero visitor entries logged matching current parameters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCheckedOut = log.status === 'Checked-Out';
            return (
              <div 
                key={log.id}
                className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all hover:border-[#D4AF37]/25 ${
                  isCheckedOut 
                    ? 'border-emerald-950/30 bg-neutral-950/20 text-slate-400' 
                    : 'border-[#D4AF37]/25 bg-gradient-to-tr from-black via-emerald-950/5 to-black text-white'
                }`}
              >
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`rounded px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider font-mono border ${
                      isCheckedOut ? 'bg-neutral-900 border-neutral-800 text-slate-500' : 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                    }`}>
                      {log.status === 'Inside' ? 'Active Guest' : 'Checked Out'}
                    </span>
                    
                    <span className="text-[9px] font-mono font-bold text-[#D4AF37]">
                      Host Flat: {log.flatNumber}
                    </span>
                  </div>

                  {/* bio info */}
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold text-white tracking-tight">{log.name}</h4>
                    <p className="font-mono text-[10px] text-slate-400">Mobile: {log.phone}</p>
                    <p className="text-slate-300">
                      <span className="font-mono text-[10px] text-slate-500">Purpose: </span>
                      {log.purpose}
                    </p>
                    {log.nid && (
                      <p className="font-mono text-[9px] text-slate-500">NID Card ID: {log.nid}</p>
                    )}
                  </div>
                </div>

                {/* Time stamping logs & Checkout controllers */}
                <div className="border-t border-emerald-950/50 pt-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <div className="space-y-0.5">
                      <p>In: {new Date(log.entryTime).toLocaleString(language === 'bn' ? 'bn' : 'en-US', {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}</p>
                      {log.exitTime && (
                        <p className="text-slate-400">Out: {new Date(log.exitTime).toLocaleString(language === 'bn' ? 'bn' : 'en-US', {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}</p>
                      )}
                    </div>

                    {!isCheckedOut && currentUser?.role === 'Admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser?.role !== 'Admin') return;
                          exitVisitor(log.id);
                        }}
                        className="flex items-center gap-1.5 rounded-md bg-rose-600 hover:bg-rose-500 border border-rose-900 px-3 py-1 text-[10px] font-black uppercase text-white shadow-lg shadow-rose-950/30 font-sans cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Check-out</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedVisitorForPass(log)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-neutral-900/80 hover:bg-neutral-800 border border-emerald-950 text-slate-350 hover:text-[#D4AF37] transition-all font-sans font-bold text-xs cursor-pointer shadow shadow-[#D4AF37]/5"
                  >
                    <QrCode className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{language === 'bn' ? 'গেট পাস জেনারেট' : 'Digital Entry Pass'}</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[#D4AF37]/35 bg-neutral-950 p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {t.check_in_visitor}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4 text-xs">
              
              {/* name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Visitor Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mohammad Harun-or-Rashid"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Mobile Contact (Dhaka/Local)</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01912345678"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Host flat select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Host Flat</label>
                  <select
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-1 text-white focus:outline-none"
                  >
                    {flats.map(f => (
                      <option key={f.id} value={f.number}>Flat {f.number}</option>
                    ))}
                  </select>
                </div>

                {/* Purpose select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Guest Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-1 text-white focus:outline-none"
                  >
                    <option value="Personal Delivery / Food">Food Delivery (Pathao/Foodpanda)</option>
                    <option value="Personal Meet">Friend or Relative</option>
                    <option value="Dhaka Wasa Technician">Dhaka WASA Maintenance</option>
                    <option value="Courier / Post">Courier (e-Commerce)</option>
                    <option value="Utility / Electric Repair">Electric Meter repairman</option>
                    <option value="Interviewer">Others Guest</option>
                  </select>
                </div>
              </div>

              {/* NID Card */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Visitor NID Number (Optional Gate-check)</label>
                <input
                  type="text"
                  value={nidNumber}
                  onChange={(e) => setNidNumber(e.target.value)}
                  placeholder="4012019481"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-500 font-bold"
                >
                  Authorize Entry
                </button>
              </div>

            </form>

          </div>
         </div>
       )}

      {/* 🎟️ DIGITAL VISITOR ENTRY PASS POPUP */}
      {selectedVisitorForPass && (
        <VisitorPassModal 
          visitor={selectedVisitorForPass} 
          onClose={() => setSelectedVisitorForPass(null)} 
        />
      )}

    </div>
  );
}
