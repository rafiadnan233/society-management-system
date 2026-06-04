/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations, getFloorName } from '../utils/translations';
import { Flat } from '../types';
import { 
  Building, 
  Layers, 
  Maximize, 
  User, 
  DollarSign, 
  CheckCircle2, 
  Settings, 
  Plus, 
  Home,
  AlertCircle,
  X,
  Printer
} from 'lucide-react';

export default function Flats() {
  const { flats, updateFlat, language, currentUser } = useSociety();
  const t = translations[language];

  const [activeFloor, setActiveFloor] = useState<number | 'All'>('All');
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states for updates
  const [squareFeet, setSquareFeet] = useState(1500);
  const [status, setStatus] = useState<Flat['status']>('vacant');
  const [ownerName, setOwnerName] = useState('');
  const [renterName, setRenterName] = useState('');
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [phone, setPhone] = useState('');

  // Sorter
  const floors = Array.from(new Set(flats.map(f => f.floor as number))).sort((a, b) => (a as number) - (b as number)) as number[];

  const filteredFlats = activeFloor === 'All' 
    ? flats 
    : flats.filter(f => f.floor === activeFloor);

  const openDetails = (flat: Flat) => {
    setSelectedFlat(flat);
    setSquareFeet(flat.squareFeet);
    setStatus(flat.status);
    setOwnerName(flat.ownerName);
    setRenterName(flat.renterName || '');
    setMonthlyRent(flat.monthlyRent);
    setPhone(flat.phone);
    setIsEditing(false);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    if (!selectedFlat) return;

    const updated: Flat = {
      ...selectedFlat,
      squareFeet,
      status,
      ownerName,
      renterName: status === 'occupied_tenant' ? renterName : '',
      monthlyRent: status === 'occupied_tenant' ? monthlyRent : 0,
      phone
    };

    updateFlat(updated);
    setSelectedFlat(updated);
    setIsEditing(false);
  };

  // Status mapping UI helpers
  const getStatusColor = (status: Flat['status']) => {
    switch (status) {
      case 'occupied_owner': return 'bg-emerald-950/60 border-emerald-500 hover:border-emerald-400 text-emerald-400';
      case 'occupied_tenant': return 'bg-teal-950/60 border-teal-500 hover:border-teal-400 text-teal-400';
      case 'vacant': return 'bg-neutral-900 border-neutral-700 hover:border-slate-500 text-slate-400';
      case 'under_maintenance': return 'bg-amber-950/60 border-[#D4AF37]/50 hover:border-[#D4AF37] text-[#D4AF37]';
      default: return 'bg-neutral-900 border-slate-700 text-slate-400';
    }
  };

  const getStatusLabel = (s: Flat['status']) => {
    switch (s) {
      case 'occupied_owner': return t.occupied_owner;
      case 'occupied_tenant': return t.occupied_tenant;
      case 'vacant': return t.vacant;
      case 'under_maintenance': return t.under_maintenance;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
            {t.flat_plan}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Overview of building units, dimensions, maintenance status and tenants
          </p>
        </div>
        <div className="flex items-center gap-2">
          
        </div>
      </div>

      {/* Floors selection bar filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        <button
          onClick={() => setActiveFloor('All')}
          className={`flex items-center gap-1.5 shrink-0 rounded-lg px-4 py-2 text-xs font-bold font-sans cursor-pointer ${
            activeFloor === 'All' 
              ? 'bg-emerald-600 border border-[#D4AF37]/35 text-white' 
              : 'bg-neutral-950/60 border border-emerald-950 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>{t.all} Floors ({flats.length} {language === 'bn' ? 'ফ্ল্যাটখাত' : 'units'})</span>
        </button>

        {floors.map((floor) => (
          <button
            key={floor}
            onClick={() => setActiveFloor(floor)}
            className={`flex items-center gap-1 shrink-0 rounded-lg px-4 py-2 text-xs font-bold font-sans cursor-pointer ${
              activeFloor === floor 
                ? 'bg-emerald-600 border border-[#D4AF37]/30 text-white' 
                : 'bg-neutral-950/60 border border-emerald-950 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>{getFloorName(floor, language)}</span>
          </button>
        ))}
      </div>

      {/* Color Guide Legends */}
      <div className="flex flex-wrap items-center gap-4 bg-emerald-950/5 border border-emerald-950 p-3 rounded-lg text-[10px] font-bold font-mono">
        <span className="text-slate-400 uppercase">LEGENDS:</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="h-3 w-3 rounded bg-emerald-950 border border-emerald-500" />
          {t.occupied_owner}
        </span>
        <span className="flex items-center gap-1.5 text-teal-400">
          <span className="h-3 w-3 rounded bg-teal-950 border border-teal-500" />
          {t.occupied_tenant}
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="h-3 w-3 rounded bg-neutral-900 border border-neutral-700" />
          {t.vacant}
        </span>
        <span className="flex items-center gap-1.5 text-[#D4AF37]">
          <span className="h-3 w-3 rounded bg-amber-950 border border-[#D4AF37]/50" />
          {t.under_maintenance}
        </span>
      </div>

      {/* Main Floor Grid Layout cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredFlats.map((flat) => (
          <button
            key={flat.id}
            type="button"
            onClick={() => openDetails(flat)}
            className={`
              rounded-xl border p-4 flex flex-col justify-between items-start text-left shrink-0 transition-all cursor-pointer h-32 relative group
              ${getStatusColor(flat.status)}
            `}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-black font-sans tracking-wide">
                Flat {flat.number}
              </span>
              <span className="text-[10px] opacity-70 font-mono">F-{flat.floor}</span>
            </div>

            <div className="space-y-0.5 mt-2">
              <span className="block text-[11px] font-medium truncate max-w-[120px] text-white">
                {flat.status === 'vacant' ? t.vacant : (flat.status === 'occupied_tenant' ? flat.renterName : flat.ownerName)}
              </span>
              <span className="block text-[9px] text-slate-400 font-mono">
                {flat.squareFeet} Sq. Ft.
              </span>
            </div>

            {/* Glowing due indicator */}
            <span className={`absolute bottom-3 right-3 text-[8px] font-sans rounded px-1 font-bold ${
              flat.maintenanceStatus === 'Paid' ? 'bg-emerald-950 border border-emerald-900 text-emerald-400' : 'bg-red-950 border border-red-900 text-red-500'
            }`}>
              {flat.maintenanceStatus}
            </span>

          </button>
        ))}
      </div>

      {/* Side Details Overlay Slider */}
      {selectedFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md h-[95vh] rounded-xl border border-[#D4AF37]/20 bg-neutral-950 p-6 shadow-2xl relative flex flex-col justify-between overflow-y-auto">
            <button 
              type="button" 
              onClick={() => setSelectedFlat(null)}
              className="absolute top-4 right-4 rounded-md p-1.5 text-slate-400 hover:bg-emerald-950/40 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content body */}
            <div className="space-y-6 overflow-y-auto flex-1">
              {/* Heading */}
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] tracking-widest uppercase font-mono mb-1 block">
                  FLAT SPEC MASTER
                </span>
                <h3 className="text-xl font-black text-white font-sans flex items-center gap-2">
                  <Home className="h-5.5 w-5.5 text-emerald-400" />
                  Flat {selectedFlat.number} ({getFloorName(selectedFlat.floor, language)})
                </h3>
              </div>

              {!isEditing ? (
                // View Mode
                <div className="space-y-5">
                  
                  {/* Detailed Spec Lists */}
                  <div className="grid grid-cols-2 gap-3 border border-emerald-950 rounded-lg p-3 bg-neutral-950/70 text-xs">
                    <div>
                      <span className="block text-slate-500 uppercase text-[9px] font-mono">Floor Level</span>
                      <span className="font-bold text-white leading-relaxed">{getFloorName(selectedFlat.floor, language)}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 uppercase text-[9px] font-mono">Dimensions</span>
                      <span className="font-bold text-white leading-relaxed">{selectedFlat.squareFeet} Sq. Feet</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 uppercase text-[9px] font-mono">Current Status</span>
                      <span className="font-bold text-emerald-400 leading-relaxed uppercase">{getStatusLabel(selectedFlat.status)}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 uppercase text-[9px] font-mono">Billing Reminders</span>
                      <span className={`font-bold leading-relaxed ${selectedFlat.maintenanceStatus === 'Paid' ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {selectedFlat.maintenanceStatus}
                      </span>
                    </div>
                  </div>

                  {/* Residents assigned detailed */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase font-bold text-[#D4AF37] font-mono tracking-wider ml-1">
                      Enrolled Identity details
                    </p>
                    <div className="border border-emerald-950 rounded-lg p-4 bg-[#059669]/5 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-mono text-slate-500">Flat Owner:</span>
                        <span className="font-semibold text-white">{selectedFlat.ownerName}</span>
                      </div>

                      {selectedFlat.status === 'occupied_tenant' && (
                        <>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="font-mono text-slate-500">Renter/Tenant:</span>
                            <span className="font-semibold text-white">{selectedFlat.renterName}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="font-mono text-slate-500">Monthly Rent:</span>
                            <span className="font-semibold text-emerald-400 font-mono">৳ {selectedFlat.monthlyRent.toLocaleString()} BDT</span>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-emerald-950/50">
                        <span className="font-mono text-slate-500">Contact Number:</span>
                        <span className="font-bold text-white">{selectedFlat.phone || 'Unavailable'}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                // Edit Form fields Mode
                <form onSubmit={handleUpdateSubmit} className="space-y-4 font-sans text-xs">
                  
                  {/* Sqft */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 font-mono block">Square Dimensions (SqFt)</label>
                    <input
                      type="number"
                      value={squareFeet}
                      onChange={(e) => setSquareFeet(parseInt(e.target.value) || 1200)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 font-mono block">Occupancy Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="block-select w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-2 text-white focus:outline-none"
                    >
                      <option value="occupied_owner">Occupied by Owner</option>
                      <option value="occupied_tenant">Occupied by Tenant</option>
                      <option value="vacant">Vacant Apartment</option>
                      <option value="under_maintenance">Reserved for Maintenance</option>
                    </select>
                  </div>

                  {/* Owner */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 font-mono block">Registered Owner Name</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Tahmina Islam"
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  {status === 'occupied_tenant' && (
                    <>
                      {/* Renter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 font-mono block">Tenant / Renter Name</label>
                        <input
                          type="text"
                          value={renterName}
                          onChange={(e) => setRenterName(e.target.value)}
                          placeholder="Faisal Bari"
                          className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                        />
                      </div>

                      {/* Rent */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 font-mono block">Monthly Rent Amount (BDT)</label>
                        <input
                          type="number"
                          value={monthlyRent}
                          onChange={(e) => setMonthlyRent(parseInt(e.target.value) || 0)}
                          className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 font-mono block">Occupant Contact Mobile</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full text-center py-2 bg-emerald-600 border border-[#D4AF37]/35 rounded font-black text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    Save Changes
                  </button>

                </form>
              )}
            </div>

            {/* Footer triggers */}
            <div className="flex gap-2 border-t border-emerald-950 pt-5 mt-4">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 text-center py-2.5 rounded border border-emerald-950 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Discard Changes
                </button>
              ) : (
                <>
                  {currentUser?.role === 'Admin' && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 text-center py-2.5 rounded border border-emerald-900 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Settings className="h-4 w-4 text-emerald-500" />
                      <span>Configure Specs</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedFlat(null)}
                    className="flex-1 text-center py-2.5 rounded bg-emerald-700 hover:bg-emerald-650 font-bold text-xs text-white cursor-pointer"
                  >
                    Close Sheet
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
