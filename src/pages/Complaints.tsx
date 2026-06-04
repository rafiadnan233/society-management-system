/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Complaint } from '../types';
import SpeechDictationButton from '../components/SpeechDictationButton';
import { 
  Plus, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Trash2, 
  MessageSquare, 
  ShieldCheck, 
  Smile, 
  X,
  Printer
} from 'lucide-react';

export default function Complaints() {
  const { 
    complaints, 
    addComplaint, 
    updateComplaint, 
    deleteComplaint, 
    currentUser, 
    language,
    members
  } = useSociety();

  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'In-Progress' | 'Resolved'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Complaint['category']>('Water');
  const [priority, setPriority] = useState<Complaint['priority']>('Medium');

  // Resolution states
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolvingText, setResolvingText] = useState('');

  const getPriorityColor = (p: Complaint['priority']) => {
    switch (p) {
      case 'Emergency': return 'bg-red-950 text-red-400 border border-red-900';
      case 'High': return 'bg-orange-950 text-orange-400 border border-orange-900';
      case 'Medium': return 'bg-amber-950 text-amber-500 border border-amber-900';
      case 'Low': return 'bg-emerald-950 text-emerald-400 border border-emerald-900';
    }
  };

  const getStatusIcon = (s: Complaint['status']) => {
    switch (s) {
      case 'Pending': return <Clock className="h-4 w-4 text-rose-500" />;
      case 'In-Progress': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'Resolved': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    addComplaint({
      title,
      category,
      priority,
      description,
      flatNumber: currentUser?.flatNumber || '1B',
      phone: currentUser?.phone || '01711223344'
    });

    setTitle('');
    setDescription('');
    setCategory('Water');
    setPriority('Medium');
    setShowAddModal(false);
  };

  const startResolution = (comp: Complaint) => {
    setResolvingComplaint(comp);
    setResolvingText('');
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint || !resolvingText) return;

    updateComplaint({
      ...resolvingComplaint,
      status: 'Resolved',
      resolvedDate: new Date().toISOString().split('T')[0],
      adminResponse: resolvingText
    });

    setResolvingComplaint(null);
  };

  const handleUpdateStatus = (comp: Complaint, newStatus: Complaint['status']) => {
    updateComplaint({
      ...comp,
      status: newStatus
    });
  };

  const filteredComplaints = complaints.filter((c) => {
    // Search
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.flatNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    // Residents can only see their own tickets unless they are admin or staff
    const matchesRole = currentUser?.role === 'Admin' || 
                        currentUser?.role === 'Staff' || 
                        c.flatNumber === currentUser?.flatNumber;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
            {t.complaint_box}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            File water, power, or security reports, and track investigation milestones and ticket resolutions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          {currentUser?.role === 'Resident' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 border border-[#D4AF37]/35 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{t.add_complaint}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters ledger list */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <input
            type="text"
            placeholder={language === 'bn' ? 'ফ্ল্যাট বা অভিযোগ দিয়ে খুঁজুন...' : 'Search complaints board...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded bg-neutral-950/45 border border-emerald-950 py-2 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex rounded p-1 bg-neutral-950/45 border border-emerald-950">
          {['All', 'Pending', 'In-Progress', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`rounded px-3 py-1 text-xs font-bold font-sans cursor-pointer ${
                statusFilter === st 
                  ? 'bg-emerald-600 border border-[#D4AF37]/25 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tickets cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredComplaints.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-emerald-950 py-12 text-center text-xs text-slate-500 font-mono">
            Zero active complaints matching. Smooth, clean operations!
          </div>
        ) : (
          filteredComplaints.map((c) => {
            // Find member name from members directory
            const matchMember = members.find(m => m.flatNumber === c.flatNumber);
            const occupantName = matchMember ? matchMember.name : 'Occupant';

            return (
              <div 
                key={c.id}
                className="rounded-xl border border-emerald-950 bg-neutral-950/45 p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-[#D4AF37]/35 transition-all"
              >
                
                {/* Badge priorities */}
                <div className="flex justify-between items-baseline">
                  <span className={`rounded px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${getPriorityColor(c.priority)}`}>
                    {c.priority} Priority
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">{c.date}</span>
                </div>

                {/* Core Content */}
                <div className="space-y-1.5 flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#D4AF37] border border-[#D4AF37]/25 rounded-sm px-1.5 py-0.5 text-[8.5px] font-bold font-mono uppercase bg-[#D4AF37]/5">
                      {c.category}
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">{c.title}</h3>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{c.description}</p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Submitted by Flat {c.flatNumber} • {occupantName}
                  </div>
                </div>

                {/* Status details with Resolution summaries if present */}
                {c.status === 'Resolved' && c.adminResponse && (
                  <div className="bg-emerald-950/10 border border-emerald-950 rounded-lg p-3 text-xs leading-relaxed text-emerald-400 space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[8px] text-[#D4AF37] font-mono flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Administration Resolution Details
                    </p>
                    <p className="font-sans text-[11px] text-slate-200">{c.adminResponse}</p>
                    {c.resolvedDate && (
                      <p className="text-[9px] font-mono text-slate-500 mt-1">Resolved date: {c.resolvedDate}</p>
                    )}
                  </div>
                )}

                {/* Footer status markers & Admin action button triggers */}
                <div className="flex items-center justify-between border-t border-emerald-950/50 pt-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(c.status)}
                    <span className="font-bold text-white uppercase tracking-wider text-[9px] font-mono">{c.status}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Admin specific trigger markers */}
                    {currentUser?.role === 'Admin' && (
                      <>
                        {c.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(c, 'In-Progress')}
                            className="px-2 py-1 bg-amber-950/50 border border-amber-900 rounded text-[9.5px] font-bold text-[#D4AF37]"
                          >
                            Investigate
                          </button>
                        )}
                        {c.status !== 'Resolved' && (
                          <button
                            type="button"
                            onClick={() => startResolution(c)}
                            className="px-2 py-1 bg-emerald-700 hover:bg-emerald-650 border border-[#D4AF37]/35 rounded text-[9.5px] font-bold text-white shadow-lg cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </>
                    )}

                    {/* Admins delete options */}
                    {currentUser?.role === 'Admin' && (
                      <button
                        type="button"
                        onClick={() => deleteComplaint(c.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-950/15 cursor-pointer"
                        title="Delete complaint"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Residents lodge Complaint modal popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[#D4AF37]/35 bg-neutral-950 p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <MessageSquare className="h-4.5 w-4.5 text-emerald-400" />
                Lodge Incident Report
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs font-sans">
              
              {/* title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Incident Subject Heading</label>
                  <SpeechDictationButton onTranscript={(txt) => setTitle(p => p ? `${p} ${txt}` : txt)} />
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Water pressure leakage inside balcony"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-1 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Water">Water / পানির লাইন</option>
                    <option value="Electrical">Electrical / বিদ্যুৎ</option>
                    <option value="Elevator_Lift">Elevator or Lift / লিফটের সমস্যা</option>
                    <option value="Security">Security Patrol / নিরাপত্তা</option>
                    <option value="Noise_Spill">Noise or Spill / কোলাহল</option>
                    <option value="Staff_Misbehavior">Staff Misbehavior / স্টাফ আচরণ</option>
                    <option value="Others">Others / অন্যান্য</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Incident Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-1 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Low">Low / সাধারণ</option>
                    <option value="Medium">Medium / মাঝারি</option>
                    <option value="High">High / গুরুত্বপূর্ণ</option>
                    <option value="Emergency">Emergency / জরুরি বিপদজনক</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Provide details description</label>
                  <SpeechDictationButton onTranscript={(txt) => setDescription(p => p ? `${p} ${txt}` : txt)} />
                </div>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise location, floors details, or damage timelines to help repairing engineers..."
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer hover:bg-neutral-900"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-500 font-bold cursor-pointer"
                >
                  File Complaint
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Admin Resolution Dialog Popover */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-emerald-900/60 bg-neutral-950 p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Smile className="h-4.5 w-4.5 text-emerald-400" />
                Resolve Ticket #{resolvingComplaint.id.substring(2,6)}
              </h3>
              <button onClick={() => setResolvingComplaint(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Provide resolution actions log</label>
                  <SpeechDictationButton onTranscript={(txt) => setResolvingText(p => p ? `${p} ${txt}` : txt)} />
                </div>
                <p className="text-[9px] text-slate-500 mb-1.5">This memo will be immediately visible for the occupant.</p>
                <textarea
                  required
                  rows={4}
                  value={resolvingText}
                  onChange={(e) => setResolvingText(e.target.value)}
                  placeholder="E.g. Sent plumbing specialist Kabir, replaced the leaking elbow pipe on the balcony drain. Certified okay by tenant."
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-500 font-bold cursor-pointer"
                >
                  Mark as Resolved
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
