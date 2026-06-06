/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations, getFloorName } from '../utils/translations';
import { Member, FamilyMember } from '../types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle,
  Home,
  X,
  Mail,
  Locate,
  Printer,
  Download,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import MemberPaymentHistory from '../components/MemberPaymentHistory';

export default function Members() {
  const { 
    members, 
    addMember, 
    updateMember, 
    deleteMember, 
    flats, 
    payments,
    language,
    currentUser,
    config,
    updateConfig
  } = useSociety();

  const t = translations[language];

  // Tab State: 'residents' | 'committee' or similar
  const [activeSubTab, setActiveSubTab] = useState<'residents' | 'committee'>('residents');

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Owner' | 'Tenant'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [onlyOverdue30d, setOnlyOverdue30d] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Committee State
  const [showCommitteeModal, setShowCommitteeModal] = useState(false);
  const [editingCommitteeMember, setEditingCommitteeMember] = useState<any | null>(null);
  const [confirmDeleteCommitteeId, setConfirmDeleteCommitteeId] = useState<string | null>(null);
  
  // Committee Form Values
  const [cmNameEn, setCmNameEn] = useState('');
  const [cmNameBn, setCmNameBn] = useState('');
  const [cmRoleEn, setCmRoleEn] = useState('');
  const [cmRoleBn, setCmRoleBn] = useState('');
  const [cmPhone, setCmPhone] = useState('');
  const [cmEmail, setCmEmail] = useState('');
  const [cmFlatNumber, setCmFlatNumber] = useState('');

  const committeeMembers: any[] = config?.committeeMembersJson 
    ? JSON.parse(config.committeeMembersJson) 
    : [];
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [flatNumber, setFlatNumber] = useState('1B');
  const [memberType, setMemberType] = useState<'Owner' | 'Tenant'>('Tenant');
  const [memberStatus, setMemberStatus] = useState<'Active' | 'Inactive'>('Active');
  const [moveInDate, setMoveInDate] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [familyList, setFamilyList] = useState<FamilyMember[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Temporary family member state
  const [tmpFamName, setTmpFamName] = useState('');
  const [tmpFamRel, setTmpFamRel] = useState('');
  const [tmpFamAge, setTmpFamAge] = useState('');
  const [tmpFamPhone, setTmpFamPhone] = useState('');

  // Helper to find 30d+ overdue payments
  const getMemberOverduePaymentsExceeding30Days = (memberFlatNumber: string) => {
    return payments.filter(p => {
      if (p.flatNumber !== memberFlatNumber) return false;
      if (p.status === 'Paid') return false;
      
      const [yearStr, monthStr] = p.billingMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const billDate = new Date(year, month, 1);
      const currentDate = new Date(2026, 5, 3); // Current system date
      const diffDays = (currentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return diffDays > 30;
    });
  };

  // Search filter matches
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.phone.includes(searchQuery) || 
                          m.flatNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || m.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    
    // Check 30d+ overdue payments
    const overduePayments = getMemberOverduePaymentsExceeding30Days(m.flatNumber);
    const matchesOverdue30d = !onlyOverdue30d || overduePayments.length > 0;
    
    return matchesSearch && matchesType && matchesStatus && matchesOverdue30d;
  });

  const handleExportCSV = () => {
    const headers = [
      'Name', 'Flat Number', 'Phone', 'Email', 'Type', 'Status', 'Move-in Date', 'NID', 'Permanent Address', 'Family Members'
    ];
    
    const rows = filteredMembers.map(m => [
      `"${m.name}"`,
      `"${m.flatNumber}"`,
      `"${m.phone}"`,
      `"${m.email || ''}"`,
      `"${m.type}"`,
      `"${m.status}"`,
      `"${m.moveInDate || 'N/A'}"`,
      `"${m.nid}"`,
      `"${m.permanentAddress || ''}"`,
      `"${m.familyMembers?.length || 0}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Members_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddNewFamily = () => {
    if (!tmpFamName || !tmpFamRel) return;
    setFamilyList([...familyList, {
      name: tmpFamName,
      relation: tmpFamRel,
      age: parseInt(tmpFamAge) || 25,
      phone: tmpFamPhone
    }]);
    setTmpFamName('');
    setTmpFamRel('');
    setTmpFamAge('');
    setTmpFamPhone('');
  };

  const handleRemoveFamily = (index: number) => {
    setFamilyList(familyList.filter((_, idx) => idx !== index));
  };

  const openAddModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setNid('');
    setFlatNumber(flats[0]?.number || '1A');
    setMemberType('Tenant');
    setMemberStatus('Active');
    setMoveInDate('');
    setPermanentAddress('');
    setFamilyList([]);
    setPhotoUrl('');
    setEditingMember(null);
    setShowAddModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone);
    setNid(member.nid);
    setFlatNumber(member.flatNumber);
    setMemberType(member.type);
    setMemberStatus(member.status);
    setMoveInDate(member.moveInDate || '');
    setPermanentAddress(member.permanentAddress || '');
    setFamilyList(member.familyMembers || []);
    setPhotoUrl(member.photoUrl || '');
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMember(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(language === 'bn' ? 'ফাইল সাইজ ২ মেগাবাইটের কম হতে হবে।' : 'File size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    if (!name || !phone || !nid || !email) return;

    if (editingMember) {
      updateMember({
        ...editingMember,
        name,
        email,
        phone,
        nid,
        flatNumber,
        type: memberType,
        status: memberStatus,
        moveInDate,
        permanentAddress,
        familyMembers: familyList,
        photoUrl
      });
    } else {
      addMember({
        name,
        email,
        phone,
        nid,
        flatNumber,
        type: memberType,
        status: memberStatus,
        moveInDate,
        permanentAddress,
        familyMembers: familyList,
        photoUrl
      });
    }
    handleCloseModal();
  };

  const openAddCommitteeModal = () => {
    setEditingCommitteeMember(null);
    setCmNameEn('');
    setCmNameBn('');
    setCmRoleEn('');
    setCmRoleBn('');
    setCmPhone('');
    setCmEmail('');
    setCmFlatNumber('');
    setShowCommitteeModal(true);
  };

  const openEditCommitteeModal = (member: any) => {
    setEditingCommitteeMember(member);
    setCmNameEn(member.nameEn || '');
    setCmNameBn(member.nameBn || '');
    setCmRoleEn(member.roleEn || '');
    setCmRoleBn(member.roleBn || '');
    setCmPhone(member.phone || '');
    setCmEmail(member.email || '');
    setCmFlatNumber(member.flatNumber || '');
    setShowCommitteeModal(true);
  };

  const handleCommitteeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    if (!cmNameEn && !cmNameBn) return;

    let updatedList;
    if (editingCommitteeMember) {
      updatedList = committeeMembers.map((item: any) => 
        item.id === editingCommitteeMember.id 
          ? {
              ...item,
              nameEn: cmNameEn,
              nameBn: cmNameBn,
              roleEn: cmRoleEn,
              roleBn: cmRoleBn,
              phone: cmPhone,
              email: cmEmail,
              flatNumber: cmFlatNumber
            }
          : item
      );
    } else {
      updatedList = [
        ...committeeMembers,
        {
          id: 'cm_' + Date.now(),
          nameEn: cmNameEn,
          nameBn: cmNameBn,
          roleEn: cmRoleEn,
          roleBn: cmRoleBn,
          phone: cmPhone,
          email: cmEmail,
          flatNumber: cmFlatNumber
        }
      ];
    }

    updateConfig({ committeeMembersJson: JSON.stringify(updatedList) });
    setShowCommitteeModal(false);
    setEditingCommitteeMember(null);
  };

  const handleDeleteCommitteeMember = (id: string) => {
    const updatedList = committeeMembers.filter((item: any) => item.id !== id);
    updateConfig({ committeeMembersJson: JSON.stringify(updatedList) });
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {activeSubTab === 'residents' ? (
            <>
              <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
                {t.members} ({filteredMembers.length})
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Direct database directory of flat owners & tenants
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
                {language === 'bn' ? 'নির্বাচিত পরিচালনা পর্ষদ' : 'Elected Executive Committee'} ({committeeMembers.length})
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {language === 'bn' 
                  ? 'সোসাইটির নির্বাচিত কর্মকর্তা ও পরিচালনা পরিষদ সদস্যদের নামের তালিকা ও পদবি' 
                  : 'Official elected leaders and executive board members of the society'
                }
              </p>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'residents' ? (
            <>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-400 hover:text-white cursor-pointer print:hidden transition-colors"
                type="button"
              >
                <Download className="h-4 w-4" />
                <span>{language === 'bn' ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
              </button>
              
              {currentUser?.role === 'Admin' && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 border border-[#D4AF37]/30 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{language === 'bn' ? 'বাসিন্দা নিবন্ধন করুন' : 'Enroll Resident'}</span>
                </button>
              )}
            </>
          ) : (
            <>
              {currentUser?.role === 'Admin' && (
                <button
                  onClick={openAddCommitteeModal}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 border border-[#D4AF37]/30 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{language === 'bn' ? 'নিবাচিত সদস্য যোগ করুন' : 'Add Elected Officer'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-emerald-950/60 pb-px gap-6">
        <button
          onClick={() => setActiveSubTab('residents')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'residents'
              ? 'border-[#D4AF37] text-[#D4AF37] font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {language === 'bn' ? 'সাধারণ বাসিন্দা ডিরেক্টরি' : 'General Residents'}
        </button>
        <button
          onClick={() => setActiveSubTab('committee')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'committee'
              ? 'border-[#D4AF37] text-[#D4AF37] font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {language === 'bn' ? 'নির্বাচিত পরিচালনা পর্ষদ' : 'Elected Committee'}
        </button>
      </div>

      {activeSubTab === 'residents' && (
        <>
          {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <input
            type="text"
            placeholder={language === 'bn' ? 'নাম, মোবাইল নম্বর বা ফ্ল্যাট দিয়ে খুঁজুন...' : 'Search by name, mobile, flat...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-emerald-950 bg-neutral-950/40 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-col sm:flex-row gap-2 self-start md:self-auto">
          <div className="flex rounded-md bg-neutral-950/45 p-1 border border-emerald-950 h-fit">
            {['All', 'Active', 'Inactive'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status as any)}
                className={`rounded px-3 py-1.5 text-[11px] font-bold font-mono cursor-pointer transition-colors ${
                  statusFilter === status 
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex rounded-md bg-neutral-950/45 p-1 border border-emerald-950 h-fit">
            {['All', 'Owner', 'Tenant'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type as any)}
                className={`rounded px-3 py-1.5 text-xs font-bold font-sans cursor-pointer transition-colors ${
                  typeFilter === type 
                    ? 'bg-emerald-900 border border-[#D4AF37]/20 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'All' ? t.all : type === 'Owner' ? t.owner : t.tenant}
              </button>
            ))}
          </div>

          {/* Overdue exceeding 30 Days active filter button */}
          <button
            type="button"
            onClick={() => setOnlyOverdue30d(prev => !prev)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-bold font-sans cursor-pointer transition-all border flex items-center justify-center gap-1.5 ${
              onlyOverdue30d 
                ? 'bg-rose-950/60 border-rose-800/85 text-rose-400 shadow-lg shadow-rose-950/20' 
                : 'bg-neutral-950/45 border-emerald-950 text-slate-400 hover:text-white'
            }`}
          >
            <AlertCircle className={`h-3.5 w-3.5 ${onlyOverdue30d ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
            <span>{language === 'bn' ? '৩০+ দিন বকেয়া ফিল্টার' : 'Overdue 30d+'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-emerald-950 py-12 text-center text-xs text-slate-500 font-mono">
            No residents found matching your search. Add a new resident above.
          </div>
        ) : (
          filteredMembers.map((member) => {
            const overdue30dBills = getMemberOverduePaymentsExceeding30Days(member.flatNumber);
            const hasOverdue30d = overdue30dBills.length > 0;
            const totalOverdue30dAmount = overdue30dBills.reduce((sum, b) => sum + (b.dueAmount ?? b.amount), 0);

            return (
              <div 
                key={member.id} 
                className={`rounded-xl border bg-neutral-950/45 p-5 flex flex-col justify-between relative overflow-hidden group transition-all ${
                  hasOverdue30d 
                    ? 'border-rose-950/85 hover:border-rose-700/80 shadow-lg shadow-rose-950/10' 
                    : 'border-emerald-950 hover:border-[#D4AF37]/35'
                }`}
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 flex gap-1.5 items-center">
                  {hasOverdue30d && (
                    <span 
                      className="animate-pulse bg-rose-950/90 text-rose-400 border border-rose-800 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide flex items-center gap-1"
                      title={language === 'bn' ? '৩০+ দিন অতিবাহিত বকেয়া বিল' : '30+ Days Overdue Bill'}
                    >
                      <AlertCircle className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                      <span>30D+ DUE</span>
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase ${
                    member.type === 'Owner' ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {member.type}
                  </span>
                  <span className={`inline-flex rounded-full h-2 w-2 ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                </div>

              {/* User Bio header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-lg border border-[#D4AF37]/35 bg-neutral-900 flex items-center justify-center overflow-hidden relative group-hover:border-[#D4AF37]/65 transition-all duration-300">
                    {member.photoUrl ? (
                      <img 
                        src={member.photoUrl} 
                        alt={member.name} 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-emerald-900/60 to-neutral-950 flex flex-col items-center justify-center text-white font-extrabold text-sm font-mono tracking-tight select-none">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{member.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Home className="h-3 w-3 text-[#D4AF37]" />
                      <span>{language === 'bn' ? 'ফ্ল্যাট নম্বর:' : 'Flat No:'} {member.flatNumber}</span>
                    </p>
                  </div>
                </div>

                {/* Info Ledger */}
                <div className="space-y-1.5 text-xs border-t border-emerald-950 pt-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 truncate">
                    <Mail className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <FileText className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span className="font-mono text-[10px]">{member.nid || t.nid_not_provided}</span>
                  </div>
                  {member.moveInDate && (
                    <div className="flex items-center gap-2 text-slate-300 mt-1">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold">{language === 'bn' ? 'বাসা বদল:' : 'Move-in:'} {new Date(member.moveInDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {member.permanentAddress && (
                    <div className="flex items-start gap-2 text-slate-400 text-[10px] mt-1 leading-relaxed">
                      <Locate className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{member.permanentAddress}</span>
                    </div>
                  )}
                </div>

                {/* Family details box panel list */}
                {member.familyMembers && member.familyMembers.length > 0 && (
                  <div className="bg-emerald-950/10 border border-emerald-950 p-2.5 rounded-lg text-[11px] space-y-1">
                    <p className="font-bold text-[#D4AF37] text-[9px] uppercase tracking-wider font-mono flex items-center gap-1 mb-1">
                      <Users className="h-3 w-3" />
                      {t.family_members} ({member.familyMembers.length})
                    </p>
                    {member.familyMembers.map((fam, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>{fam.name} ({fam.relation})</span>
                        <span className="text-slate-500 font-mono">Age: {fam.age}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Overdue alert panel */}
                {hasOverdue30d && (
                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/60 text-xs text-rose-400 font-sans leading-normal space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[9px] uppercase tracking-wider font-mono">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse shrink-0" />
                      <span>{language === 'bn' ? '৩০+ দিন অতিবাহিত বকেয়া সতর্কবার্তা' : '30+ Days Overdue Warning'}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-200">
                      {language === 'bn'
                        ? `এই বাসিন্দার ${overdue30dBills.length}টি বিল ৩০ দিনের বেশি সময় ধরে পরিশোধ করা হয়নি। মোট বকেয়া: ৳${totalOverdue30dAmount}।`
                        : `This flat has ${overdue30dBills.length} bill(s) overdue for over 30 days. Total unpaid: ৳${totalOverdue30dAmount}.`
                      }
                    </p>
                  </div>
                )}

                {/* Financial History Quick-link */}
                <button
                  type="button"
                  onClick={() => setSelectedMemberForHistory(member)}
                  className="mt-4 w-full text-center py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 rounded-lg text-xs font-bold text-[#D4AF37] hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  id={`view-history-btn-${member.id}`}
                >
                  <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
                  <span>{language === 'bn' ? 'আর্থিক হিসাব ও পেমেন্ট হিস্ট্রি' : 'Financial Ledger & Chart'}</span>
                </button>
              </div>

              {/* Action Buttons footer */}
              {currentUser?.role === 'Admin' && (
                <div className="mt-4 pt-3 border-t border-emerald-950/60 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser?.role !== 'Admin') return;
                      openEditModal(member);
                    }}
                    className="p-1 px-2 border border-emerald-900 rounded text-[10px] font-bold text-slate-300 hover:text-white hover:border-[#D4AF37]/50 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="h-3 w-3 text-emerald-500" />
                    <span>{t.edit}</span>
                  </button>
                  {deleteConfirmId === member.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/20 border border-rose-900/40 p-0.5 px-1.5 rounded animate-fade-in relative z-10">
                      <span className="text-[9px] text-rose-400 font-extrabold font-sans uppercase tracking-wider">
                        {language === 'bn' ? 'মুছে ফেলবেন?' : 'Are you sure?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          deleteMember(member.id);
                          setDeleteConfirmId(null);
                        }}
                        className="p-1 px-1.5 bg-rose-900 hover:bg-rose-800 rounded text-[9px] font-extrabold text-white cursor-pointer uppercase font-sans border border-rose-700/60 transition-colors"
                      >
                        {language === 'bn' ? 'হ্যাঁ' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 rounded text-[9px] font-extrabold text-slate-300 cursor-pointer uppercase font-sans border border-emerald-950/80 transition-colors"
                      >
                        {language === 'bn' ? 'না' : 'No'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser?.role !== 'Admin') return;
                        setDeleteConfirmId(member.id);
                      }}
                      className="p-1 px-2 border border-rose-950 rounded text-[10px] font-bold text-rose-500 hover:bg-rose-950/15 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{t.delete}</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })
        )}
      </div>
    </>
  )}

  {activeSubTab === 'committee' && (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-neutral-950/45 border border-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          {language === 'bn'
            ? 'সোসাইটি পরিচালনা পরিষদের সকল নির্বাচিত পদাধিকারী কর্মকর্তা ও সদস্যদের নামের তথ্য নিচে প্রদর্শিত হলো। সাধারণ সদস্যরা এটি দেখতে পারবেন এবং শুধুমাত্র এডমিন তাদের যোগ, এডিট বা অপসারণ করতে পারবেন।'
            : 'Below are the official elected leaders and executive committee board members representing the society management. Residents can view, and only admins can add, edit, or delete them.'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {committeeMembers.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-emerald-950 py-12 text-center text-xs text-slate-500 font-mono">
            {language === 'bn'
              ? 'কোন নির্বাচিত কমিটির सदस्य তালিকাভুক্ত নেই। অনুগ্রহ করে উপরে বাটন ব্যবহার করে নতুন সদস্য যোগ করুন।'
              : 'No elected committee members listed yet. Select Add Elected Officer to enroll the executive board.'
            }
          </div>
        ) : (
          committeeMembers.map((cMember: any, index: number) => {
            const name = language === 'bn' ? (cMember.nameBn || cMember.nameEn) : (cMember.nameEn || cMember.nameBn);
            const role = language === 'bn' ? (cMember.roleBn || cMember.roleEn) : (cMember.roleEn || cMember.roleBn);
            
            // Initials for avatar
            const initials = (cMember.nameEn || cMember.nameBn || 'CM')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div 
                key={cMember.id || index}
                className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-300"
              >
                {/* Role Tag Accent */}
                <div className="absolute top-4 right-4">
                  <span className="rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider font-mono">
                    {language === 'bn' ? 'নির্বাচিত' : 'ELECTED'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Avatar & Identifiers */}
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full border-2 border-[#D4AF37]/45 bg-gradient-to-tr from-emerald-950 to-neutral-900 flex items-center justify-center font-extrabold text-[#D4AF37] text-sm tracking-tight shrink-0">
                      {initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight leading-tight">{name}</h4>
                      <p className="text-xs text-[#D4AF37] font-sans font-semibold mt-1">
                        {role}
                      </p>
                    </div>
                  </div>

                  {/* Multi-lingual names if both are written, transparent view */}
                  <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-emerald-950/60 pt-2.5 font-sans">
                    <div><span className="font-mono text-[9px] text-[#D4AF37]/60">EN:</span> <span className="text-slate-400 font-medium">{cMember.nameEn || 'N/A'}</span></div>
                    <div><span className="font-mono text-[9px] text-[#D4AF37]/60">BN:</span> <span className="text-slate-400 font-medium">{cMember.nameBn || 'N/A'}</span></div>
                    <div><span className="font-mono text-[9px] text-[#D4AF37]/60">ROLE EN:</span> <span className="text-slate-400 font-medium">{cMember.roleEn || 'N/A'}</span></div>
                    <div><span className="font-mono text-[9px] text-[#D4AF37]/60">ROLE BN:</span> <span className="text-slate-400 font-medium">{cMember.roleBn || 'N/A'}</span></div>
                  </div>

                  {/* Contact Ledger */}
                  <div className="space-y-1.5 text-xs border-t border-emerald-950/60 pt-3 text-slate-300">
                    {cMember.flatNumber && (
                      <div className="flex items-center gap-2">
                        <Home className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>{language === 'bn' ? 'ফ্ল্যাট নম্বর:' : 'Flat No:'} {cMember.flatNumber}</span>
                      </div>
                    )}
                    {cMember.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{cMember.phone}</span>
                      </div>
                    )}
                    {cMember.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-emerald-500 font-sans" />
                        <span className="truncate">{cMember.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Action Bar */}
                {currentUser?.role === 'Admin' && (
                  <div className="mt-5 pt-3 border-t border-emerald-950/60 flex justify-end gap-2 text-xs">
                    {/* Move Up/Down Hierarchy list order */}
                    <div className="mr-auto flex gap-1 items-center font-mono">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          if (index === 0) return;
                          const updated = [...committeeMembers];
                          const temp = updated[index];
                          updated[index] = updated[index - 1];
                          updated[index - 1] = temp;
                          updateConfig({ committeeMembersJson: JSON.stringify(updated) });
                        }}
                        className={`p-1 border border-emerald-950 rounded bg-neutral-950 text-slate-400 hover:text-[#D4AF37] cursor-pointer disabled:opacity-25`}
                        title={language === 'bn' ? 'উপরে নিন' : 'Move Up'}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={index === committeeMembers.length - 1}
                        onClick={() => {
                          if (index === committeeMembers.length - 1) return;
                          const updated = [...committeeMembers];
                          const temp = updated[index];
                          updated[index] = updated[index + 1];
                          updated[index + 1] = temp;
                          updateConfig({ committeeMembersJson: JSON.stringify(updated) });
                        }}
                        className={`p-1 border border-emerald-950 rounded bg-neutral-950 text-slate-400 hover:text-[#D4AF37] cursor-pointer disabled:opacity-25`}
                        title={language === 'bn' ? 'নিচে নিন' : 'Move Down'}
                      >
                        ▼
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditCommitteeModal(cMember)}
                      className="px-2 py-1 border border-emerald-900 rounded text-[10px] font-bold text-slate-300 hover:text-white hover:border-[#D4AF37]/50 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="h-3 w-3 text-emerald-500" />
                      <span>{t.edit}</span>
                    </button>
                    {confirmDeleteCommitteeId === cMember.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-950/20 border border-rose-900/40 p-0.5 px-1.5 rounded animate-fade-in relative z-10">
                        <span className="text-[9px] text-rose-400 font-extrabold font-sans uppercase tracking-wider">
                          {language === 'bn' ? 'অপসারণ?' : 'Sure?'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteCommitteeMember(cMember.id);
                            setConfirmDeleteCommitteeId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-900 hover:bg-rose-800 rounded text-[10px] font-extrabold text-white cursor-pointer uppercase font-sans border border-rose-700/60 transition-all"
                        >
                          {language === 'bn' ? 'হ্যাঁ' : 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCommitteeId(null)}
                          className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 rounded text-[10px] font-extrabold text-slate-300 cursor-pointer uppercase font-sans border border-emerald-950/80 transition-all"
                        >
                          {language === 'bn' ? 'না' : 'No'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCommitteeId(cMember.id)}
                        className="px-2 py-1 border border-rose-950 rounded text-[10px] font-bold text-rose-500 hover:bg-rose-950/15 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{t.delete}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  )}

      {/* Add / Edit Member Modal popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/30 bg-neutral-950 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-base font-bold text-white font-sans">
                {editingMember ? t.edit_member : t.add_member}
              </h3>
              <button onClick={handleCloseModal} className="rounded p-1 text-slate-400 hover:bg-emerald-950/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Profile Photo Uploader (Square Box Style) */}
              <div className="bg-neutral-900/50 border border-emerald-950 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                {/* Square Box Viewport */}
                <div className="relative group h-20 w-20 shrink-0 rounded-lg border-2 border-dashed border-emerald-900 bg-neutral-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/50">
                  {photoUrl ? (
                    <>
                      <img 
                        src={photoUrl} 
                        alt="Preview" 
                        className="h-full w-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-rose-400 font-sans transition-opacity duration-200 cursor-pointer"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-center p-1 font-mono">
                      <User className="h-7 w-7 text-emerald-500 mb-1" />
                      <span className="text-[8px] uppercase font-bold tracking-tight">
                        {language === 'bn' ? 'ছবি নেই' : 'No Photo'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]"></span>
                      {language === 'bn' ? 'প্রোফাইল পিকচার (স্কয়ার বক্স)' : 'Profile Picture (Square Box)'}
                    </h5>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {language === 'bn' 
                        ? 'ছবি সিলেক্ট করুন বা ডেমো অ্যাভাটার জেনারেট করুন।' 
                        : 'Upload photo or choose our elegant procedural design pattern.'
                      }
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {/* Hidden file input */}
                    <input 
                      id="profile-picture-input"
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="profile-picture-input"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded text-[9px] font-bold text-emerald-400 hover:text-white hover:border-emerald-600 transition-all cursor-pointer"
                    >
                      {language === 'bn' ? 'ছবি আপলোড' : 'Upload Image'}
                    </label>

                    {/* Pre-made Abstract Avatars */}
                    <button
                      type="button"
                      onClick={() => {
                        const seeds = ['adam', 'bob', 'charlie', 'lola', 'david', 'sam', 'emma', 'julia', 'sophia', 'leo', 'max'];
                        const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
                        const randomId = Math.floor(Math.random() * 1000);
                        setPhotoUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}-${randomId}`);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-950 border border-emerald-950 rounded text-[9px] font-bold text-slate-400 hover:text-white hover:border-emerald-800 transition-all cursor-pointer"
                    >
                      {language === 'bn' ? 'অটো জেনারেট ছবি' : 'Auto Avatar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Resident Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Subrata Roy"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Email ID</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="subrata@gmail.com"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01712345678"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* NID */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">NID Card</label>
                  <input
                    type="text"
                    required
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    placeholder="54210492190"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Flat Assigned selector */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#D4AF37] font-mono block">Flat Assigned</label>
                  <select
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-2 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {flats.map(f => (
                      <option key={f.id} value={f.number}>
                        Flat {f.number} ({getFloorName(f.floor, language)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenant / Owner Status Type */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Occupancy Type</label>
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value as any)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-2 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Tenant">Tenant / ভাড়াদাতা</option>
                    <option value="Owner">Owner / ফ্ল্যাট মালিক</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">{language === 'bn' ? 'বর্তমান অবস্থা' : 'Current Status'}</label>
                  <select
                    value={memberStatus}
                    onChange={(e) => setMemberStatus(e.target.value as any)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-2 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Active">{language === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</option>
                    <option value="Inactive">{language === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</option>
                  </select>
                </div>

                {/* Move In Date */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">{language === 'bn' ? 'বাসা বদলের তারিখ' : 'Move-in Date'}</label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Permanent Address */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Permanent Address (NID Match)</label>
                <textarea
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="Village, Post, Thana, District details"
                  rows={2}
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Family Members form fields */}
              <div className="border border-emerald-950 bg-emerald-950/5 p-4.5 rounded-lg space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-[#D4AF37] font-mono flex items-center gap-1 mb-2">
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  Family Members Directory ({familyList.length})
                </p>

                {/* Current families */}
                <div className="space-y-2">
                  {familyList.map((fam, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-200 border-b border-emerald-950/40 pb-1.5 last:border-0 last:pb-0">
                      <span>{fam.name} ({fam.relation}, Age: {fam.age})</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFamily(idx)}
                        className="text-rose-500 text-[10px] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Inline adder */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-950/45">
                  <input
                    type="text"
                    value={tmpFamName}
                    onChange={(e) => setTmpFamName(e.target.value)}
                    placeholder="Name"
                    className="rounded border border-emerald-950 bg-neutral-900 px-2 py-1.5 text-[10px] text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={tmpFamRel}
                    onChange={(e) => setTmpFamRel(e.target.value)}
                    placeholder="Relation (Wife, Son, daughter)"
                    className="rounded border border-emerald-950 bg-neutral-900 px-2 py-1.5 text-[10px] text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    value={tmpFamAge}
                    onChange={(e) => setTmpFamAge(e.target.value)}
                    placeholder="Age"
                    className="rounded border border-emerald-950 bg-neutral-900 px-2 py-1.5 text-[10px] text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={tmpFamPhone}
                    onChange={(e) => setTmpFamPhone(e.target.value)}
                    placeholder="Phone (Optional)"
                    className="rounded border border-emerald-950 bg-neutral-900 px-2 py-1.5 text-[10px] text-white focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddNewFamily}
                  className="w-full text-center py-1 bg-neutral-900 border border-emerald-900 rounded text-[10px] font-bold text-emerald-400 hover:text-white cursor-pointer"
                >
                  Confirm Family Addition
                </button>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-2.5 border-t border-emerald-950 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded border border-emerald-950 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 border border-[#D4AF37]/30 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  {editingMember ? t.save : t.add}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {selectedMemberForHistory && (
        <MemberPaymentHistory 
          member={selectedMemberForHistory} 
          onClose={() => setSelectedMemberForHistory(null)} 
        />
      )}

      {showCommitteeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/35 bg-neutral-950 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
              <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
                {editingCommitteeMember 
                  ? (language === 'bn' ? 'কমিটি সদস্য এডিট করুন' : 'Edit Committee Member') 
                  : (language === 'bn' ? 'নতুন নির্বাচিত কমিটি সদস্য যোগ করুন' : 'Add New Elected Committee Member')
                }
              </h3>
              <button 
                onClick={() => { setShowCommitteeModal(false); setEditingCommitteeMember(null); }} 
                className="rounded p-1 text-slate-400 hover:bg-emerald-950/40 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCommitteeFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name English */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                    Full Name (English) <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cmNameEn}
                    onChange={(e) => setCmNameEn(e.target.value)}
                    placeholder="e.g. Alhaj Md. Abdur Rahman"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                {/* Name Bangla */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#D4AF37] font-mono block">
                    নাম (বাংলা) <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cmNameBn}
                    onChange={(e) => setCmNameBn(e.target.value)}
                    placeholder="যেমন: আলহাজ্ব মো: আব্দুর রহমান"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Designation English */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                    Designation/Role (English) <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cmRoleEn}
                    onChange={(e) => setCmRoleEn(e.target.value)}
                    placeholder="e.g. Society President"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Designation Bangla */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#D4AF37] font-mono block">
                    পদবি (বাংলা) <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cmRoleBn}
                    onChange={(e) => setCmRoleBn(e.target.value)}
                    placeholder="যেমন: সভাপতি"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Mobile Number</label>
                  <input
                    type="text"
                    value={cmPhone}
                    onChange={(e) => setCmPhone(e.target.value)}
                    placeholder="+88017XXXXXXXX"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Email Address</label>
                  <input
                    type="email"
                    value={cmEmail}
                    onChange={(e) => setCmEmail(e.target.value)}
                    placeholder="prefix@asthatwintowers.com"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Flat Selector */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Associated Flat</label>
                <select
                  value={cmFlatNumber}
                  onChange={(e) => setCmFlatNumber(e.target.value)}
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-2 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- None / Select Flat --</option>
                  {flats.map(f => (
                    <option key={f.id} value={f.number}>
                      Flat {f.number} ({getFloorName(f.floor, language)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-2.5 border-t border-emerald-950 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowCommitteeModal(false); setEditingCommitteeMember(null); }}
                  className="rounded border border-emerald-950 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 border border-[#D4AF37]/30 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
