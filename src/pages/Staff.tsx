/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Staff } from '../types';
import { Plus, Search, Shield, Wrench, Trash2, Edit, CalendarDays, CheckCircle, Clock, Award, Phone, UserPlus, X, Heart, MapPin, Contact, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeAllInlineStyles } from '../utils/oklchPatch';

export default function StaffPage() {
  const { 
    staff, 
    addStaff, 
    updateStaff, 
    deleteStaff, 
    recordAttendance,
    addExpense,
    language,
    currentUser 
  } = useSociety();

  const t = translations[language];

  const todayStr = new Date().toISOString().split('T')[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form states 
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Staff['role']>('Security_Guard');
  const [salary, setSalary] = useState(12000);
  const [nid, setNid] = useState('');
  const [address, setAddress] = useState('');
  const [joinDate, setJoinDate] = useState(todayStr);

  // Local state simulating tracking paid employees in memory for convenience
  const [disbursedEmployees, setDisbursedEmployees] = useState<{ [key: string]: boolean }>({});
  const [attendanceDate, setAttendanceDate] = useState(todayStr);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (showPrintModal) {
      document.body.classList.add('printing-receipt-active');
    } else {
      document.body.classList.remove('printing-receipt-active');
    }
    return () => {
      document.body.classList.remove('printing-receipt-active');
    };
  }, [showPrintModal]);

  const handleDownloadAttendancePDF = async () => {
    const element = document.getElementById('printable-attendance');
    if (!element) return;

    try {
      setIsGeneratingPDF(true);
      
      // Sanitize all inline styles to prevent oklch rendering exceptions
      sanitizeAllInlineStyles(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0a0a0a', // align with the printable black bg context
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Attendance-Report-${attendanceDate}.pdf`);
    } catch (error) {
      console.error('Failed to generate Attendance PDF', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const staffRoles: { [key: string]: string } = {
    Security_Guard: language === 'bn' ? 'নিরাপত্তা প্রহরী' : 'Security Guard',
    Cleaner: language === 'bn' ? 'পরিচ্ছন্নতাকর্মী' : 'Cleaning Crew',
    Manager: language === 'bn' ? 'সোসাইটি ব্যবস্থাপক' : 'Building Manager',
    Lift_Operator: language === 'bn' ? 'লিফট চালক' : 'Lift Operator',
    Electrician_Plumber: language === 'bn' ? 'ইলেকট্রিশিয়ান ও প্লাম্বার' : 'Electrician & Plumber',
    Others: language === 'bn' ? 'অন্যান্য' : 'Others'
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'All' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalMonthlyWageBill = staff.reduce((sum, s) => sum + s.salary, 0);

  const formatBDT = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  const openAddModal = () => {
    setName('');
    setPhone('');
    setRole('Security_Guard');
    setSalary(12000);
    setNid('');
    setAddress('');
    setJoinDate(todayStr);
    setEditingStaff(null);
    setShowAddModal(true);
  };

  const openEditModal = (st: Staff) => {
    setEditingStaff(st);
    setName(st.name);
    setPhone(st.phone);
    setRole(st.role);
    setSalary(st.salary);
    setNid(st.nid);
    setAddress(st.address);
    setJoinDate(st.joinDate);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    if (!name || !phone || salary <= 0) return;

    if (editingStaff) {
      updateStaff({
        ...editingStaff,
        name,
        phone,
        role,
        salary,
        nid,
        address,
        joinDate
      });
    } else {
      addStaff({
        name,
        phone,
        role,
        salary,
        nid,
        address,
        joinDate,
        status: 'Active'
      });
    }
    setShowAddModal(false);
  };

  const toggleAttendance = (st: Staff) => {
    const currentStatus = st.attendance[todayStr] || 'Absent';
    const nextAttendance = currentStatus === 'Present' ? 'Absent' : 'Present';
    recordAttendance(st.id, todayStr, nextAttendance);
  };

  const handleDisburseSalary = (st: Staff) => {
    // Record salary payout as a local society expense
    addExpense({
      title: `Salary payout: ${st.name} (${staffRoles[st.role]})`,
      category: 'Staff_Salary',
      amount: st.salary,
      date: todayStr,
      description: `Wages disbursed electronically for the month of May 2026. Ref NID ID: ${st.nid}`
    });

    setDisbursedEmployees(prev => ({
      ...prev,
      [st.id]: true
    }));
  };

  const handleStampCheckIn = (st: Staff, dateStr: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentStatus = st.attendance[dateStr] || 'Present';
    const currentOut = st.checkOutTimes?.[dateStr] || '';
    recordAttendance(st.id, dateStr, currentStatus, timeStr, currentOut);
  };

  const handleStampCheckOut = (st: Staff, dateStr: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentStatus = st.attendance[dateStr] || 'Present';
    const currentIn = st.checkInTimes?.[dateStr] || '';
    recordAttendance(st.id, dateStr, currentStatus, currentIn, timeStr);
  };

  const handleManualTimeChange = (st: Staff, dateStr: string, field: 'checkIn' | 'checkOut', val: string) => {
    const currentStatus = st.attendance[dateStr] || 'Present';
    const currentIn = field === 'checkIn' ? val : (st.checkInTimes?.[dateStr] || '');
    const currentOut = field === 'checkOut' ? val : (st.checkOutTimes?.[dateStr] || '');
    recordAttendance(st.id, dateStr, currentStatus, currentIn, currentOut);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
            {t.staff_management} LEDGER
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Administer gatekeepers, cleaning crews, shifts allocation, and monthly BDT wage disbursements
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          
          {currentUser?.role === 'Admin' && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 border border-[#D4AF37]/35 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
            >
              <UserPlus className="h-4.5 w-4.5" />
              <span>{language === 'bn' ? 'স্টাফ যুক্ত করুন' : 'Enroll Staff'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI blocks detailings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-emerald-950 bg-neutral-950/45 p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Staff Registered</span>
          <span className="text-2xl font-black text-white font-sans mt-2">{staff.length} Employees</span>
        </div>

        <div className="rounded-xl border border-emerald-950 bg-neutral-950/45 p-4 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Estimated Monthly Wages Bill</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-2">{formatBDT(totalMonthlyWageBill)}</span>
        </div>

        <div className="rounded-xl border border-emerald-950 bg-neutral-950/45 p-4 flex flex-col justify-between text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Today's Presence Status</span>
          <span className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5 font-sans">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            {staff.filter(s => s.attendance[todayStr] === 'Present').length} Present of {staff.length}
          </span>
        </div>
      </div>

      {/* Filters panels */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <input
            type="text"
            placeholder={language === 'bn' ? 'স্টাফের নাম বা মোবাইল দিয়ে খুঁজুন...' : 'Search staff directory...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded bg-neutral-950/45 border border-emerald-950 py-2 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-neutral-950/45 border border-emerald-950 p-2 rounded-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono pl-1">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded border border-emerald-900 bg-neutral-900 py-1 px-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Roles</option>
            {Object.keys(staffRoles).map(k => (
              <option key={k} value={k}>{staffRoles[k]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of employees */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-emerald-950 py-12 text-center text-xs text-slate-500 font-mono">
            No employees match filter. Enroll a new staff member above.
          </div>
        ) : (
          filteredStaff.map((st) => {
            const isPresent = st.attendance[todayStr] === 'Present';
            const isDisbursed = disbursedEmployees[st.id];

            return (
              <div 
                key={st.id}
                className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all font-sans"
              >
                
                {/* Header items */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider border ${
                    st.status === 'Active' ? 'bg-emerald-955 text-emerald-400 border-emerald-900' : 'bg-slate-900 border-neutral-800 text-slate-500'
                  }`}>
                    {st.status}
                  </span>

                  {/* Toggle attendance button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser?.role !== 'Admin') {
                        alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
                        return;
                      }
                      toggleAttendance(st);
                    }}
                    className={`inline-flex items-center gap-1 text-[9px] font-bold font-mono px-2 py-0.5 rounded border transition-colors ${
                      currentUser?.role !== 'Admin' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      isPresent 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/60 text-red-400'
                    }`}
                    title={currentUser?.role === 'Admin' ? 'Click to toggle attendance today' : 'Attendance modification is locked for Admin only'}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isPresent ? 'bg-emerald-400' : 'bg-red-500'}`} />
                    <span>{isPresent ? 'Present / উপস্থিত' : 'Absent / অনুপস্থিত'}</span>
                  </button>
                </div>

                {/* Body details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-900/30 border border-[#D4AF37]/30 flex items-center justify-center text-white font-bold uppercase text-sm">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white leading-tight">{st.name}</h4>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide font-semibold text-[#D4AF37]">
                        {staffRoles[st.role]}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-emerald-950/60 pt-3 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{st.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Contact className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>NID: {st.nid}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{st.address}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-950/50">
                      <span className="font-mono text-slate-500">Monthly package:</span>
                      <span className="font-bold text-emerald-400 font-mono">{formatBDT(st.salary)}</span>
                    </div>
                  </div>
                </div>

                {/* Disbursement Trigger */}
                {currentUser?.role === 'Admin' && (
                  <div className="border-t border-emerald-950/60 pt-3.5 flex justify-end gap-2 text-xs">
                    {!isDisbursed ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser?.role !== 'Admin') return;
                          handleDisburseSalary(st);
                        }}
                        className="w-full text-center py-1.5 bg-emerald-600 border border-[#D4AF37]/35 rounded text-[10.5px] font-black text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                      >
                        Disburse salary (May 2026)
                      </button>
                    ) : (
                      <span className="w-full text-center py-1.5 bg-neutral-900 border border-emerald-950 rounded text-[10.5px] font-bold text-slate-500 uppercase font-mono">
                        ✔ Salary cleared (May 2026)
                      </span>
                    )}
                    
                    {/* Actions */}
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser?.role !== 'Admin') return;
                        openEditModal(st);
                      }}
                      className="p-1 px-2 border border-emerald-900 text-slate-400 hover:text-white rounded font-sans"
                    >
                      <Edit className="h-3.5 w-3.5 text-emerald-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser?.role !== 'Admin') return;
                        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই স্টাফ মুছে ফেলতে চান?' : 'Are you sure you want to delete this staff?')) {
                          deleteStaff(st.id);
                        }
                      }}
                      className="p-1 px-2 border border-rose-950 rounded text-rose-500 hover:bg-rose-950/10 font-sans"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* DAILY ATTENDANCE & SHIFT CLOCK-IN/OUT ROSTER */}
      <div className="rounded-xl border border-emerald-950 bg-neutral-950/45 p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-emerald-950/50 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/30 text-emerald-400 mt-0.5 animate-pulse">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight font-sans">
                {language === 'bn' ? 'ডেইলি শিফট এটেনডেন্স ও ক্লক-ইন/আউট ট্র্যাকার' : 'DAILY SHIFT CLOCK-IN & OUT TRACKER'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {language === 'bn' 
                  ? 'নিরাপত্তা প্রহরী ও রক্ষণাবেক্ষণ স্টাফদের প্রতিদিনের সঠিক কর্মঘণ্টা রিয়েল-টাইমে নজরদারি করুন।'
                  : 'Record, monitor, and audit actual check-in/check-out timestamps and shift statuses.'}
              </p>
            </div>
          </div>

          {/* Date Picker & PRINT/PDF Export controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-start sm:self-auto print:hidden">
            <div className="flex items-center gap-2 bg-neutral-900 border border-emerald-950 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                {language === 'bn' ? 'তারিখ নির্বাচন:' : 'Duty Register Date:'}
              </span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-emerald-950 rounded-lg text-xs font-bold text-[#D4AF37] hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 text-emerald-500" />
              <span>{language === 'bn' ? 'প্রতিবেদন প্রিন্ট/পিডিএফ' : 'Print / Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Selected Date Stats overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-sans">
          <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-850">
            <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wide">Duty Date</span>
            <span className="text-white font-mono font-bold block mt-1">{attendanceDate}</span>
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-850">
            <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wide">On Duty Count</span>
            <span className="text-emerald-400 font-mono font-black block mt-1">
              {staff.filter(st => {
                const isSecMaint = ['Security_Guard', 'Cleaner', 'Lift_Operator', 'Electrician_Plumber', 'Others'].includes(st.role);
                const hasIn = st.checkInTimes?.[attendanceDate];
                const hasOut = st.checkOutTimes?.[attendanceDate];
                return isSecMaint && hasIn && !hasOut && st.attendance[attendanceDate] === 'Present';
              }).length} Staff
            </span>
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-850">
            <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wide">Shift Completed</span>
            <span className="text-blue-400 font-mono font-black block mt-1">
              {staff.filter(st => {
                const isSecMaint = ['Security_Guard', 'Cleaner', 'Lift_Operator', 'Electrician_Plumber', 'Others'].includes(st.role);
                const hasIn = st.checkInTimes?.[attendanceDate];
                const hasOut = st.checkOutTimes?.[attendanceDate];
                return isSecMaint && hasIn && hasOut && st.attendance[attendanceDate] === 'Present';
              }).length} Staff
            </span>
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-850">
            <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wide">Scheduled Staff</span>
            <span className="text-[#D4AF37] font-mono font-black block mt-1">
              {staff.filter(st => ['Security_Guard', 'Cleaner', 'Lift_Operator', 'Electrician_Plumber', 'Others'].includes(st.role)).length} Members
            </span>
          </div>
        </div>

        {/* Attendance Register Register Table */}
        <div className="overflow-x-auto border border-emerald-950 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider border-b border-emerald-950">
                <th className="p-3 pl-4">{language === 'bn' ? 'স্টাফ বিবরণ' : 'Staff Employee Details'}</th>
                <th className="p-3 text-center">{language === 'bn' ? 'হাজিরা স্থিতি' : 'Attendance State'}</th>
                <th className="p-3 text-center">{language === 'bn' ? 'চেক-ইন সময় ' : 'Check-In'}</th>
                <th className="p-3 text-center">{language === 'bn' ? 'চেক-আউট সময় ' : 'Check-Out'}</th>
                <th className="p-3 text-center">{language === 'bn' ? 'ডিউটি স্থিতি' : 'Duty Active Log'}</th>
                <th className="p-3 pr-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/40 bg-neutral-950/20">
              {(() => {
                const securityAndMaintenance = staff.filter(st => 
                  ['Security_Guard', 'Cleaner', 'Lift_Operator', 'Electrician_Plumber', 'Others'].includes(st.role)
                );

                if (securityAndMaintenance.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-550 font-mono">
                        {language === 'bn' ? 'কোনো নিরাপত্তা বা রক্ষণাবেক্ষণ কর্মী নিবন্ধিত নেই।' : 'No security or maintenance personnel enrolled yet.'}
                      </td>
                    </tr>
                  );
                }

                return securityAndMaintenance.map((st) => {
                  const stateStatus = st.attendance[attendanceDate] || 'Absent';
                  const clockIn = st.checkInTimes?.[attendanceDate] || '';
                  const clockOut = st.checkOutTimes?.[attendanceDate] || '';

                  // Calculate simple shift status
                  let dutyBadge = (
                    <span className="inline-flex items-center gap-1 rounded bg-neutral-900 border border-neutral-850 px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase">
                      ⏹ Off-Duty
                    </span>
                  );
                  if (stateStatus === 'Present') {
                    if (clockIn && !clockOut) {
                      dutyBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-955 text-emerald-400 border-emerald-900 px-2 py-0.5 text-[9px] font-bold uppercase animate-pulse">
                          🟢 On-Duty
                        </span>
                      );
                    } else if (clockIn && clockOut) {
                      dutyBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-950/60 border border-blue-900/60 px-2 py-0.5 text-[9px] font-black text-blue-400 uppercase">
                          ✅ Completed
                        </span>
                      );
                    } else {
                      dutyBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-955 text-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase">
                          ⚠️ Pending Time
                        </span>
                      );
                    }
                  } else if (stateStatus === 'Late') {
                    if (clockIn && !clockOut) {
                      dutyBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-955 text-amber-450 px-2 py-0.5 text-[9px] font-bold uppercase animate-pulse">
                          ⏳ Late (Active)
                        </span>
                      );
                    } else if (clockIn && clockOut) {
                      dutyBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-950/30 border border-amber-900 px-2 py-0.5 text-[9px] font-bold text-yellow-550 uppercase">
                          ✅ Late (Complete)
                        </span>
                      );
                    } else {
                      dutyBadge = (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-900/20 border border-amber-950 px-2 py-0.5 text-[9px] font-semibold text-amber-500 uppercase">
                          ⚠️ Late (No Time)
                        </span>
                      );
                    }
                  }

                  return (
                    <tr key={st.id} className="hover:bg-neutral-900/20 transition-all font-sans">
                      {/* Name / Role details */}
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 shrink-0 rounded-full bg-emerald-900/20 border border-[#D4AF37]/20 flex items-center justify-center text-[11px] text-[#D4AF37] font-extrabold uppercase">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-xs">{st.name}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wide font-semibold">
                              {staffRoles[st.role]}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Presence toggle buttons */}
                      <td className="p-3 text-center">
                        <div className="inline-flex rounded p-0.5 bg-neutral-900 border border-neutral-850">
                          {(['Present', 'Absent', 'Late'] as const).map((status) => {
                            const isCurrent = stateStatus === status;
                            let btnStyle = 'text-slate-500 hover:text-slate-300';
                            if (isCurrent) {
                              if (status === 'Present') btnStyle = 'bg-emerald-600 font-bold text-white';
                              if (status === 'Absent') btnStyle = 'bg-rose-950/80 border border-rose-900 font-bold text-rose-400';
                              if (status === 'Late') btnStyle = 'bg-amber-600 font-bold text-white';
                            }
                            return (
                              <button
                                key={status}
                                type="button"
                                disabled={currentUser?.role !== 'Admin'}
                                onClick={() => recordAttendance(st.id, attendanceDate, status, clockIn, clockOut)}
                                className={`text-[9.5px] px-2 py-0.5 rounded transition-all duration-150 ${btnStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {status === 'Present' ? (language === 'bn' ? 'উপস্থিত' : 'Present') :
                                 status === 'Absent' ? (language === 'bn' ? 'অনুপস্থিত' : 'Absent') : 
                                 (language === 'bn' ? 'বিলম্বে' : 'Late')}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Check-In input field and Stamp control */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 max-w-[130px] mx-auto">
                          <input
                            type="text"
                            placeholder="e.g. 08:00 AM"
                            value={clockIn}
                            disabled={currentUser?.role !== 'Admin' || stateStatus === 'Absent'}
                            onChange={(e) => handleManualTimeChange(st, attendanceDate, 'checkIn', e.target.value)}
                            className="w-20 rounded bg-neutral-900 border border-neutral-850 px-2 py-1 text-[11px] text-center text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            title="Stamp Current Time"
                            disabled={currentUser?.role !== 'Admin' || stateStatus === 'Absent'}
                            onClick={() => handleStampCheckIn(st, attendanceDate)}
                            className="p-1 rounded bg-emerald-950/50 hover:bg-emerald-900/40 border border-emerald-900/60 text-emerald-400 hover:text-emerald-350 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Check-Out input field and Stamp control */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 max-w-[130px] mx-auto">
                          <input
                            type="text"
                            placeholder="e.g. 05:00 PM"
                            value={clockOut}
                            disabled={currentUser?.role !== 'Admin' || stateStatus === 'Absent'}
                            onChange={(e) => handleManualTimeChange(st, attendanceDate, 'checkOut', e.target.value)}
                            className="w-20 rounded bg-neutral-900 border border-neutral-850 px-2 py-1 text-[11px] text-center text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            title="Stamp Current Time"
                            disabled={currentUser?.role !== 'Admin' || stateStatus === 'Absent'}
                            onClick={() => handleStampCheckOut(st, attendanceDate)}
                            className="p-1 rounded bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/35 text-[#D4AF37] hover:text-[#fff] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Active Status Badge */}
                      <td className="p-3 text-center">
                        {dutyBadge}
                      </td>

                      {/* Clear / Reset action */}
                      <td className="p-3 pr-4 text-right">
                        <button
                          type="button"
                          disabled={currentUser?.role !== 'Admin' || (!clockIn && !clockOut && stateStatus === 'Absent')}
                          onClick={() => {
                            if (window.confirm(language === 'bn' ? 'আপনি কি আজকের দৈনিক ডেটা রিসেট করতে চান?' : 'Are you sure you want to reset times for this employee on this date?')) {
                              recordAttendance(st.id, attendanceDate, 'Absent', '', '');
                            }
                          }}
                          className="text-[9.5px] font-black uppercase text-slate-500 hover:text-red-400 font-mono transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          {language === 'bn' ? 'মুছুন' : 'Clear'}
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[#D4AF37]/35 bg-neutral-950 p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingStaff ? 'Update employee registry' : 'Enroll Building Employee'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
              
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kafil Uddin"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Mobile Contact</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712345678"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* role */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Duty Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-1 text-white focus:outline-none"
                  >
                    {Object.keys(staffRoles).map(k => (
                      <option key={k} value={k}>{staffRoles[k]}</option>
                    ))}
                  </select>
                </div>

                {/* salary */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Wage Bill (BDT/month)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(parseInt(e.target.value) || 0)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* NID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">National ID Card (NID)</label>
                  <input
                    type="text"
                    required
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    placeholder="4091204910291"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                {/* Join Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-1.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Permanent Home Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Village, Post, Thana info"
                  rows={2}
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
                  Save Employee Info
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 🚨 ATTENDANCE REPORT PRINT PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-[#D4AF37]/30 bg-[#0c0a09] p-6 shadow-2xl relative block font-sans space-y-6 max-h-[95vh] overflow-y-auto print:border-0 print:shadow-none print:w-full print:max-w-none print:p-0">
            
            {/* Modal Header & Controls (Hidden during print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950 pb-4 print:hidden">
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-widest uppercase font-sans flex items-center gap-1.5 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {language === 'bn' ? 'দৈনিক হাজিরা প্রতিবেদন প্রিভিউ' : 'Daily Attendance Report Preview'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {language === 'bn' ? 'প্রিন্ট এবং পিডিএফ এক্সপোর্ট করার উপযুক্ত ফরম্যাট' : 'High-fidelity formatted sheet optimized for printing and PDF export.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAttendancePDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 border border-[#D4AF37]/35 text-white rounded text-xs font-bold hover:bg-emerald-550 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Printer className="h-3.5 w-3.5 text-white" />
                  <span>{isGeneratingPDF ? (language === 'bn' ? 'পিডিএফ তৈরি হচ্ছে...' : 'Generating PDF...') : (language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF')}</span>
                </button>
                
                <button 
                  onClick={() => setShowPrintModal(false)} 
                  className="p-1 px-1.5 text-slate-450 hover:text-white cursor-pointer bg-neutral-900 border border-emerald-950 rounded transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Daily Attendance Layout starts here */}
            <div id="printable-attendance" className="space-y-6 border border-emerald-950/45 bg-neutral-950 p-6 rounded-lg text-slate-300">
              
              {/* Receipt Header Seal */}
              <div className="flex justify-between items-start border-b border-emerald-950 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-emerald-700 border border-[#D4AF37]/40 shadow-sm shadow-emerald-900/50">
                    <span className="text-white font-serif font-extrabold text-lg">A</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight text-white uppercase sm:text-base font-sans">
                      {language === 'bn' ? 'আস্থা টুইন টাওয়ারস সোসাইটি' : 'Astha Twin Towers Society'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
                      Dhaka-1212, Bangladesh • Admin Office
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="inline-block text-[9px] font-extrabold tracking-widest text-[#D4AF37] uppercase border border-[#D4AF37]/40 px-2.5 py-0.5 rounded bg-[#D4AF37]/5 font-mono">
                    {language === 'bn' ? 'অফিসিয়াল হাজিরা শীট' : 'OFFICIAL DUTY ROSTER'}
                  </span>
                  <div className="text-[10.5px] mt-1.5 font-mono font-bold text-white">
                    {language === 'bn' ? `তারিখ: ${attendanceDate}` : `Date: ${attendanceDate}`}
                  </div>
                </div>
              </div>

              {/* Stats overview banner inside sheet */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="py-2.5 px-1.5 rounded-md bg-neutral-900 border border-neutral-850">
                  <span className="text-slate-500 block text-[9.5px] font-mono uppercase tracking-wider">{language === 'bn' ? 'মোট স্টাফ' : 'TOTAL STAFF'}</span>
                  <span className="text-white font-mono font-extrabold text-sm block mt-1">
                    {staff.filter(st => ['Security_Guard', 'Cleaner', 'Lift_Operator', 'Electrician_Plumber', 'Others'].includes(st.role)).length}
                  </span>
                </div>
                <div className="py-2.5 px-1.5 rounded-md bg-emerald-955/20 border border-emerald-900/40">
                  <span className="text-emerald-500 block text-[9.5px] font-mono uppercase tracking-wider">{language === 'bn' ? 'উপস্থিত' : 'PRESENT'}</span>
                  <span className="text-emerald-400 font-mono font-extrabold text-sm block mt-1">
                    {staff.filter(st => {
                      const isSecMaint = ['Security_Guard', 'Cleaner', 'Lift_Operator', 'Electrician_Plumber', 'Others'].includes(st.role);
                      return isSecMaint && (st.attendance[attendanceDate] === 'Present' || st.attendance[attendanceDate] === 'Late');
                    }).length}
                  </span>
                </div>
                <div className="py-2.5 px-1.5 rounded-md bg-rose-955/20 border border-rose-900/40">
                  <span className="text-rose-500 block text-[9.5px] font-mono uppercase tracking-wider">{language === 'bn' ? 'অনুপস্থিত' : 'ABSENT'}</span>
                  <span className="text-rose-450 font-mono font-extrabold text-sm block mt-1">
                    {staff.filter(st => {
                      const isSecMaint = ['Security_Guard', 'Cleaner', 'Lift_Operator', 'Electrician_Plumber', 'Others'].includes(st.role);
                      return isSecMaint && (st.attendance[attendanceDate] === 'Absent' || !st.attendance[attendanceDate]);
                    }).length}
                  </span>
                </div>
              </div>

              {/* Roster Items Table */}
              <div className="border border-emerald-900/40 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-900/80 text-[9.5px] text-slate-400 uppercase font-mono tracking-wider border-b border-emerald-950">
                      <th className="p-3 pl-4">{language === 'bn' ? 'স্টাফের নাম' : 'Employee Name'}</th>
                      <th className="p-3">{language === 'bn' ? 'পদবী / রোল' : 'Duty Role'}</th>
                      <th className="p-3 text-center">{language === 'bn' ? 'হাজিরা স্থিতি' : 'Attendance Status'}</th>
                      <th className="p-3 text-center">{language === 'bn' ? 'চেক-ইন' : 'Check-In'}</th>
                      <th className="p-3 text-center">{language === 'bn' ? 'চেক-আউট' : 'Check-Out'}</th>
                      <th className="p-3 pr-4 text-right">{language === 'bn' ? 'স্ট্যাটাস' : 'Shift Log'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/40">
                    {(() => {
                      const list = staff.filter(st => ['Security_Guard', 'Cleaner', 'Lift_Operator', 'Electrician_Plumber', 'Others'].includes(st.role));
                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-500 font-mono">
                              No records found for staff attendance.
                            </td>
                          </tr>
                        );
                      }
                      return list.map(st => {
                        const stateStatus = st.attendance[attendanceDate] || 'Absent';
                        const ckIn = st.checkInTimes?.[attendanceDate] || '—';
                        const ckOut = st.checkOutTimes?.[attendanceDate] || '—';

                        let statusBadge = (
                          <span className="rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-rose-950/30 text-rose-500 border border-rose-900/30">
                            {language === 'bn' ? 'অনুপস্থিত' : 'Absent'}
                          </span>
                        );
                        if (stateStatus === 'Present') {
                          statusBadge = (
                            <span className="rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-emerald-950/30 text-emerald-400 border border-emerald-900/30">
                              {language === 'bn' ? 'উপস্থিত' : 'Present'}
                            </span>
                          );
                        } else if (stateStatus === 'Late') {
                          statusBadge = (
                            <span className="rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-amber-950/30 text-amber-500 border border-amber-900/30">
                              {language === 'bn' ? 'বিলম্বে' : 'Late'}
                            </span>
                          );
                        }

                        let shiftText = language === 'bn' ? 'অফ-ডিউটি' : 'Off-Duty';
                        if (stateStatus !== 'Absent') {
                          if (ckIn !== '—' && ckOut === '—') {
                            shiftText = language === 'bn' ? 'ডিউটি চলছে' : 'Active Duty';
                          } else if (ckIn !== '—' && ckOut !== '—') {
                            shiftText = language === 'bn' ? 'শিফট সম্পন্ন' : 'Shift Completed';
                          } else {
                            shiftText = language === 'bn' ? 'সময় অপূর্ণ' : 'Incomplete Times';
                          }
                        }

                        return (
                          <tr key={st.id} className="hover:bg-neutral-900/10 font-sans">
                            <td className="p-3 pl-4 font-bold text-white text-xs">{st.name}</td>
                            <td className="p-3 text-[10.5px] text-slate-350">{staffRoles[st.role]}</td>
                            <td className="p-3 text-center">{statusBadge}</td>
                            <td className="p-3 text-center font-mono text-[10.5px]">{ckIn}</td>
                            <td className="p-3 text-center font-mono text-[10.5px]">{ckOut}</td>
                            <td className="p-3 pr-4 text-right font-mono text-[9px] uppercase tracking-wide text-slate-400">{shiftText}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Signature section */}
              <div className="pt-8 flex justify-between items-end border-t border-emerald-950 text-[10px] font-mono text-slate-500">
                <div>
                  <div className="h-10 w-32 border-b border-emerald-950/40"></div>
                  <div className="mt-1.5 uppercase font-bold tracking-wider">{language === 'bn' ? 'সোসাইটি সুপারভাইজার স্বাক্ষর' : 'Supervisor Signature'}</div>
                </div>
                <div className="text-right">
                  <div className="h-10 w-32 border-b border-emerald-950/40 ml-auto"></div>
                  <div className="mt-1.5 uppercase font-bold tracking-wider">{language === 'bn' ? 'সোসাইটি সভাপতি / সাধারণ সম্পাদক' : 'Admin Authority Signature'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
