/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import building3dImg from '../assets/images/building_3d_view_1780387092893.png';
import constructionImg from '../assets/images/construction_progress_1780387114013.png';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Notice } from '../types';
import { 
  Shield, 
  Key, 
  Mail, 
  Building, 
  UserCheck, 
  AlertCircle, 
  Sparkles, 
  Megaphone, 
  Award, 
  Users, 
  Camera, 
  Calendar, 
  Globe, 
  Info, 
  CheckCircle,
  FileText,
  Settings,
  Plus,
  X
} from 'lucide-react';

interface LoginProps {
  onRegisterClick: () => void;
}

export default function Login({ onRegisterClick }: LoginProps) {
  const { 
    login, 
    language, 
    setLanguage, 
    notices, 
    config, 
    updateConfig, 
    addNotice, 
    updateNotice, 
    deleteNotice 
  } = useSociety();
  const t = translations[language];

  // Admin Live Customization Mode States
  const [adminEditorActive, setAdminEditorActive] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  // Customization Modals States
  const [show3dModal, setShow3dModal] = useState(false);
  const [showConstructionModal, setShowConstructionModal] = useState(false);
  
  // Leadership State Dialogs
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState<any | null>(null);
  
  // Notices Dialogs (Dynamic Notices Add/Edit on login page)
  const [showLoginNoticeModal, setShowLoginNoticeModal] = useState(false);
  const [editingLoginNotice, setEditingLoginNotice] = useState<Notice | null>(null);

  // Form Fields State: 3D Render
  const [valBuilding3dImg, setValBuilding3dImg] = useState('');
  const [valBuilding3dTitleEn, setValBuilding3dTitleEn] = useState('');
  const [valBuilding3dTitleBn, setValBuilding3dTitleBn] = useState('');
  const [valBuilding3dDescEn, setValBuilding3dDescEn] = useState('');
  const [valBuilding3dDescBn, setValBuilding3dDescBn] = useState('');

  // Form Fields State: Construction Progress
  const [valConstructionImg, setValConstructionImg] = useState('');
  const [valConstructionPercent, setValConstructionPercent] = useState(85);
  const [valConstructionDescEn, setValConstructionDescEn] = useState('');
  const [valConstructionDescBn, setValConstructionDescBn] = useState('');

  // Form Fields State: Leadership Card
  const [leaderInitials, setLeaderInitials] = useState('');
  const [leaderNameEn, setLeaderNameEn] = useState('');
  const [leaderNameBn, setLeaderNameBn] = useState('');
  const [leaderRoleEn, setLeaderRoleEn] = useState('');
  const [leaderRoleBn, setLeaderRoleBn] = useState('');
  const [leaderMsgEn, setLeaderMsgEn] = useState('');
  const [leaderMsgBn, setLeaderMsgBn] = useState('');

  // Form Fields State: Quick Notice Write on login page
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<Notice['type']>('Announcement');

  // Load Leaders List
  const rawLeaders = config.leadersJson ? JSON.parse(config.leadersJson) : [];
  const leadersList: any[] = rawLeaders.length > 0 ? rawLeaders : [
    {
      "id": "leader_1",
      "initials": "AR",
      "nameEn": "Alhaj Md. Abdur Rahman",
      "nameBn": "আলহাজ্ব মো: আব্দুর রহমান",
      "roleEn": "PROJECT CHAIRMAN",
      "roleBn": "চেয়ারম্যান",
      "msgEn": "The construction of our Astha Twin Towers project in Khetasar, Cumilla is progressing with exceptional quality. Inshallah, this will stand as a landmark architectural masterclass in our region.",
      "msgBn": "খেতাসার কুমিল্লায় আমাদের এই আস্থা টুইন টাওয়ার্স প্রকল্পের কাজ অত্যন্ত মানসম্মতভাবে এগিয়ে চলছে। এটি আমাদের অঞ্চলের এক অনন্য স্থাপত্যের স্মারক হিসেবে গড়ে উঠবে ইনশাল্লাহ।"
    },
    {
      "id": "leader_2",
      "initials": "RI",
      "nameEn": "Engr. Rafiqul Islam",
      "nameBn": "ইঞ্জিঃ রফিকুল ইসলাম",
      "roleEn": "SOCIETY PRESIDENT",
      "roleBn": "সভাপতি",
      "msgEn": "Equipped with state-of-the-art society technologies, our management guarantees sheer transparency and accountability. Ensuring safety, compliance, and joy for every resident is our core vision.",
      "msgBn": "ডিজিটাল আবাসন প্রযুক্তির সমন্বয়ে আমাদের এই সোসাইটি পরিচালিত হবে অত্যন্ত স্বচ্ছ ও নিয়মতান্ত্রিক উপায়ে। প্রতিটি বাসিন্দার নিরাপত্তা এবং সুখ-শান্তি নিশ্চিত করাই আমাদের প্রধান অঙ্গীকার।"
    },
    {
      "id": "leader_3",
      "initials": "AC",
      "nameEn": "Dr. Adnan Chowdhury",
      "nameBn": "ডাঃ আদনান চৌধুরী",
      "roleEn": "SOCIETY SECRETARY",
      "roleBn": "সাধারণ সম্পাদক",
      "msgEn": "With a modern fitness hub, rooftop gardens, 24/7 CCTV surveillance, and a dedicated maintenance workforce, Astha Twin Towers will offer the ultimate serene, safe, and modern lifestyle outside of Dhaka.",
      "msgBn": "আধুনিক ফিটনেস হাব, রুফটপ গার্ডেন, ২৪/৭ সিসিটিভি পাহারা এবং আমাদের নিজস্ব হেল্পার স্কোয়াড নিয়ে আস্থা টুইন টাওয়ার্স হবে ঢাকার বাইরে আধুনিক ও নিরুপদ্রব জীবনের শ্রেষ্ঠ ঠিকানা।"
    }
  ];

  // Action Triggers
  const open3dModal = () => {
    setValBuilding3dImg(config.building3dImg || "/src/assets/images/building_3d_view_1780387092893.png");
    setValBuilding3dTitleEn(config.building3dTitleEn || "Astha Twin Towers - Architectural Highlights");
    setValBuilding3dTitleBn(config.building3dTitleBn || "আস্থা টুইন টাওয়ার্স - স্থাপত্য মানদণ্ড");
    setValBuilding3dDescEn(config.building3dDescEn || "Astha Twin Towers is Cumilla’s pioneer dual-tower premium luxury high-rise condominium complex located in Khetasar...");
    setValBuilding3dDescBn(config.building3dDescBn || "এটি খেতাসার, কুমিল্লায় নির্মিতব্য...");
    setShow3dModal(true);
  };

  const save3dCustomizations = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      building3dImg: valBuilding3dImg,
      building3dTitleEn: valBuilding3dTitleEn,
      building3dTitleBn: valBuilding3dTitleBn,
      building3dDescEn: valBuilding3dDescEn,
      building3dDescBn: valBuilding3dDescBn
    });
    setShow3dModal(false);
  };

  const openConstructionModal = () => {
    setValConstructionImg(config.constructionImg || "/src/assets/images/construction_progress_1780387114013.png");
    setValConstructionPercent(config.constructionPercent !== undefined ? config.constructionPercent : 85);
    setValConstructionDescEn(config.constructionDescEn || "Sub-grade foundation and pile capping have been 100% completed...");
    setValConstructionDescBn(config.constructionDescBn || "মাটির পাইলিং এবং ফুটিং বেইসের কাজ ১০০% সুরক্ষায় সমাপ্ত হয়েছে...");
    setShowConstructionModal(true);
  };

  const saveConstructionCustomizations = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      constructionImg: valConstructionImg,
      constructionPercent: Number(valConstructionPercent),
      constructionDescEn: valConstructionDescEn,
      constructionDescBn: valConstructionDescBn
    });
    setShowConstructionModal(false);
  };

  const openEditLeader = (leader: any) => {
    setEditingLeader(leader);
    setLeaderInitials(leader.initials || '');
    setLeaderNameEn(leader.nameEn || '');
    setLeaderNameBn(leader.nameBn || '');
    setLeaderRoleEn(leader.roleEn || '');
    setLeaderRoleBn(leader.roleBn || '');
    setLeaderMsgEn(leader.msgEn || '');
    setLeaderMsgBn(leader.msgBn || '');
    setShowLeaderModal(true);
  };

  const openAddLeader = () => {
    setEditingLeader(null);
    setLeaderInitials('');
    setLeaderNameEn('');
    setLeaderNameBn('');
    setLeaderRoleEn('');
    setLeaderRoleBn('');
    setLeaderMsgEn('');
    setLeaderMsgBn('');
    setShowLeaderModal(true);
  };

  const saveLeaderCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    if (editingLeader) {
      updated = leadersList.map(item => item.id === editingLeader.id ? {
        ...item,
        initials: leaderInitials,
        nameEn: leaderNameEn,
        nameBn: leaderNameBn,
        roleEn: leaderRoleEn,
        roleBn: leaderRoleBn,
        msgEn: leaderMsgEn,
        msgBn: leaderMsgBn
      } : item);
    } else {
      updated = [...leadersList, {
        id: 'leader_' + Date.now(),
        initials: leaderInitials,
        nameEn: leaderNameEn,
        nameBn: leaderNameBn,
        roleEn: leaderRoleEn,
        roleBn: leaderRoleBn,
        msgEn: leaderMsgEn,
        msgBn: leaderMsgBn
      }];
    }
    updateConfig({ leadersJson: JSON.stringify(updated) });
    setShowLeaderModal(false);
    setEditingLeader(null);
  };

  const deleteLeaderFromDesk = (id: string) => {
    if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই বাণীটি মুছতে চান?' : 'Are you sure you want to remove this leader speech?')) {
      const updated = leadersList.filter(item => item.id !== id);
      updateConfig({ leadersJson: JSON.stringify(updated) });
    }
  };

  // Notice Quick management from login page
  const openLoginNoticeAdd = () => {
    setEditingLoginNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeType('Announcement');
    setShowLoginNoticeModal(true);
  };

  const openLoginNoticeEdit = (notice: Notice) => {
    setEditingLoginNotice(notice);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeType(notice.type);
    setShowLoginNoticeModal(true);
  };

  const saveLoginNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    if (editingLoginNotice) {
      updateNotice({
        ...editingLoginNotice,
        title: noticeTitle,
        content: noticeContent,
        type: noticeType
      });
    } else {
      addNotice({
        title: noticeTitle,
        content: noticeContent,
        type: noticeType,
        active: true
      });
    }
    setShowLoginNoticeModal(false);
    setEditingLoginNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
  };

  const [role, setRole] = useState<'Admin' | 'Resident' | 'Staff'>('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Active Tab for the info gallery
  const [activeTab, setActiveTab] = useState<'3d' | 'construction' | 'messages' | 'notices'>('3d');

  const permanentNotices = notices?.filter(n => n.active && !n.expiryDate) || [];
  const activeBulletins = notices?.filter(n => n.active) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(language === 'bn' ? 'দয়া করে সব ফিল্ড পূরণ করুন' : 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Direct login trigger
      const success = await login(email, role, password);
      if (!success) {
        setError(language === 'bn' ? 'লগইন ব্যর্থ হয়েছে। ইমেল এবং পাসওয়ার্ড চেক করুন।' : 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (selectedRole: 'Admin' | 'Resident' | 'Staff') => {
    setRole(selectedRole);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. Permanent Notice Announcement Scroller */}
      {permanentNotices.length > 0 && (
        <div className="bg-emerald-950/45 border-b border-emerald-900/40 h-10 flex items-center relative z-10 overflow-hidden shadow-inner select-none shrink-0">
          <div className="absolute left-0 top-0 bottom-0 px-4 bg-emerald-900 border-r border-[#D4AF37]/30 flex items-center gap-1.5 shadow-[2px_0_5px_rgba(0,0,0,0.5)] z-20">
            <Megaphone className="h-3.5 w-3.5 text-[#D4AF37] animate-bounce" />
            <span className="text-[9px] font-black tracking-widest text-[#D4AF37] uppercase font-mono">
              {language === 'bn' ? 'জরুরী নোটিশ' : 'ALERT TICKER'}
            </span>
          </div>
          
          <div className="w-full pl-36 flex items-center overflow-hidden">
            <div className="animate-marquee-scroll inline-block whitespace-nowrap text-xs font-semibold tracking-wide py-1">
              {permanentNotices.map((notice, index) => (
                <span key={notice.id} className="inline-flex items-center text-slate-200 hover:text-white">
                  <span className="font-extrabold text-[#D4AF37] uppercase font-mono">
                    [{notice.title}]
                  </span>
                  <span className="ml-2 pr-1 font-sans">{notice.content}</span>
                  {index < permanentNotices.length - 1 && (
                    <span className="mx-12 text-emerald-600 select-none">✦✦✦</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Brand & Utility Header Panel */}
      <header className="border-b border-emerald-950 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-900 border border-emerald-500/30 shadow-inner">
              <Building className="h-5.5 w-5.5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1 font-sans">
                {t.app_name}
              </h1>
              <p className="text-[10px] text-[#D4AF37] font-semibold tracking-wider font-mono">
                {language === 'bn' ? 'খেতাসার, কুমিল্লা • আধুনিক আবাসন গেটওয়ে' : 'Khetasar, Cumilla • Elite Smart Living Portal'}
              </p>
            </div>
          </div>

          {/* Bilingual Language Switcher with Admin Toggler */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (adminEditorActive) {
                  setAdminEditorActive(false);
                } else {
                  setShowPasscodeModal(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all uppercase border cursor-pointer font-bold ${
                adminEditorActive 
                  ? 'bg-amber-950/50 text-[#D4AF37] border-[#D4AF37]/50 shadow-lg shadow-amber-950/20' 
                  : 'bg-neutral-900 text-slate-400 border-emerald-950 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Shield className={`h-3.5 w-3.5 ${adminEditorActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span>
                {adminEditorActive 
                  ? (language === 'bn' ? 'এডমিন এডিটর: সচল' : 'Live Editor: ON') 
                  : (language === 'bn' ? 'এডমিন এডিটর' : 'Admin Editor')}
              </span>
            </button>

            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-emerald-950">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-black tracking-wider uppercase transition-all ${language === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-neutral-850'}`}
              >
                <Globe className="h-3 w-3" />
                <span>EN</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-black tracking-wider uppercase transition-all ${language === 'bn' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-neutral-850'}`}
              >
                <Globe className="h-3 w-3" />
                <span>বাংলা</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Split Body Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Highly Polished Society Info & Media desk */}
        <section className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="rounded-2xl border border-emerald-950 bg-neutral-950/40 p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
            
            {/* Gallery Navbar Control */}
            <div className="flex flex-wrap gap-2 border-b border-emerald-950 pb-4 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('3d')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === '3d' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{language === 'bn' ? '৩ডি প্রজেক্ট ভিউ' : '3D Project Render'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('construction')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'construction' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>{language === 'bn' ? 'নির্মাণ কাজের ছবি' : 'Construction Logs'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'messages' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-teal-400" />
                <span>{language === 'bn' ? 'নেতৃবৃন্দের বাণী' : 'Leadership desk'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notices')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'notices' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <Megaphone className="h-3.5 w-3.5 text-amber-500" />
                <span>{language === 'bn' ? 'নোটিশ বোর্ড' : 'Notice Board'}</span>
              </button>
            </div>

            {/* TAB CONTENT SCREEN */}
            <div className="pt-6">
              
              {/* TAB 1: 3D VIEW ARCHITECTURE */}
              {activeTab === '3d' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="relative rounded-xl border border-emerald-900/45 bg-neutral-950 overflow-hidden shadow-2xl">
                    <img 
                      src={(config.building3dImg && !config.building3dImg.startsWith('/src/assets/')) ? config.building3dImg : building3dImg} 
                      alt="Astha Twin Towers 3D Render View" 
                      className="w-full aspect-video object-cover transition-transform duration-700 hover:scale-[1.03]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10 pointer-events-none" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs bg-black/75 backdrop-blur-md p-2 rounded border border-emerald-900/30">
                      <span className="font-mono text-emerald-400 font-bold">● {language === 'bn' ? 'আধুনিক ৩ডি নকশার পরিকল্পিত প্রতিচ্ছবি' : 'Architectural 3D Virtual Concept Mockup'}</span>
                      <span className="text-[10px] text-[#D4AF37] uppercase font-mono font-bold tracking-widest">{language === 'bn' ? 'প্রস্তাবিত' : 'PROPOSED STATE'}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-emerald-950/15 border border-emerald-950 rounded-xl space-y-2 relative">
                    {adminEditorActive && (
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <button
                          type="button"
                          onClick={open3dModal}
                          className="flex items-center gap-1 text-[10px] bg-amber-950 font-bold border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-amber-900 rounded px-2.5 py-1 cursor-pointer"
                        >
                          <Settings className="h-3 w-3 animate-spin duration-1000" />
                          <span>{language === 'bn' ? '৩ডি প্রজেক্ট এডিট করুন' : 'Customize 3D Specs'}</span>
                        </button>
                      </div>
                    )}
                    <h3 className="text-xs font-bold text-[#D4AF37] font-mono tracking-wider uppercase flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {language === 'bn' 
                          ? (config.building3dTitleBn || "আস্থা টুইন টাওয়ার্স - স্থাপত্য মানদণ্ড") 
                          : (config.building3dTitleEn || "Astha Twin Towers - Architectural Highlights")}
                      </span>
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-300 pr-24">
                      {language === 'bn' 
                        ? (config.building3dDescBn || 'এটি খেতাসার, কুমিল্লায় নির্মিতব্য অঞ্চলের প্রথম দ্বৈত টাওয়ার বিশিষ্ট অভিজাত বহুতল আবাসন কমপ্লেক্স। উন্নতমানের গ্লাস ফেসাড, প্রতি ফ্লোরে ডাবল ভেন্টিলেশন, প্রতিটি ফ্ল্যাটে সবুজ বাউন্ডারি গার্ডেন, সর্বোচ্চ ভূমিকম্প প্রতিরোধক সহনশীলতা সম্পন্ন আন্তর্জাতিক মানের নির্মাণ ফর্মুলায় করা এই ভবনে থাকবে ৩টি ক্যাপসুল লিফট।')
                        : (config.building3dDescEn || 'Astha Twin Towers is Cumilla’s pioneer dual-tower premium luxury high-rise condominium complex located in Khetasar. Architected with high-strength triple glass structural facade, active safety protocols, earthquake resistance up to 7.8 Richter, 3 luxury spacious capsule elevators, and eco-friendly landscaping.')}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: CONSTRUCTION LOG PHOTOS */}
              {activeTab === 'construction' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="relative rounded-xl border border-emerald-900/45 bg-neutral-950 overflow-hidden shadow-2xl">
                    <img 
                      src={(config.constructionImg && !config.constructionImg.startsWith('/src/assets/')) ? config.constructionImg : constructionImg} 
                      alt="Current construction progress at Khetasar Cumilla" 
                      className="w-full aspect-video object-cover transition-transform duration-700 hover:scale-[1.03]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10 pointer-events-none" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs bg-black/75 backdrop-blur-md p-2 rounded border border-emerald-900/30">
                      <span className="font-mono text-emerald-400 font-bold">🛠 {language === 'bn' ? 'সাইট নির্মাণ কাজ এবং গুনমান পরীক্ষা' : 'Active Mechanical Layout and Civil Audits'}</span>
                      <span className="text-[10px] text-amber-500 uppercase font-mono font-bold tracking-widest">{language === 'bn' ? 'চলমান অগ্রগতি' : 'LIVE CONSTRUCTION'}</span>
                    </div>
                  </div>

                  {/* Dynamic Progress Bar widget */}
                  <div className="p-4 bg-emerald-950/15 border border-emerald-950 rounded-xl space-y-3 relative">
                    {adminEditorActive && (
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <button
                          type="button"
                          onClick={openConstructionModal}
                          className="flex items-center gap-1 text-[10px] bg-amber-950 font-bold border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-amber-900 rounded px-2.5 py-1 cursor-pointer"
                        >
                          <Settings className="h-3 w-3" />
                          <span>{language === 'bn' ? 'অগ্রগতি এডিট করুন' : 'Edit Live Status'}</span>
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs pr-24">
                      <span className="font-bold text-slate-200">{language === 'bn' ? 'সার্বিক ভৌত অবকাঠামো নির্মাণ অগ্রগতি' : 'Overall Civil Engineering Progress'}</span>
                      <span className="font-mono text-[#D4AF37] font-bold">
                        {config.constructionPercent !== undefined ? config.constructionPercent : 85}% Completed
                      </span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-emerald-950/50">
                      <div 
                        className="bg-gradient-to-r from-emerald-600 to-amber-500 h-full rounded-full animate-pulse" 
                        style={{ width: `${config.constructionPercent !== undefined ? config.constructionPercent : 85}%` }} 
                      />
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 pr-24">
                      {language === 'bn' 
                        ? (config.constructionDescBn || 'মাটির পাইলিং এবং ফুটিং বেইসের কাজ ১০০% সুরক্ষায় সমাপ্ত হয়েছে। ইতিমধ্যে প্রথম টাওয়ারের ১৩ম তলা এবং দ্বিতীয় টাওয়ারের ১১ম তলার ছাদ ঢালাইয়ের কাজ সম্পন্ন হয়েছে। গুণমান যাচাইকারী টিম দ্বারা প্রতি সপ্তাহে কংক্রিট পিউরিফিকেশন পরীক্ষা সম্পন্ন হয়।')
                        : (config.constructionDescEn || 'Sub-grade foundation and pile capping have been 100% completed. Currently, structural concrete slab castings of Tower 1 is completed up to the 13th tier, and Tower 2 is completed up to the 11th tier. Lab test compression checks are generated weekly to ensure ultimate reliability.')}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: LEADERS DESK WITH MESSAGES */}
              {activeTab === 'messages' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  
                  {leadersList.map((leader) => (
                    <div key={leader.id} className="p-4 bg-neutral-900/60 rounded-xl border border-emerald-950/40 flex flex-col sm:flex-row gap-4 items-start relative hover:border-emerald-900/40 transition-all">
                      {adminEditorActive && (
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditLeader(leader)}
                            className="bg-neutral-950 border border-amber-500/30 hover:border-amber-500 text-[#D4AF37] text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            {language === 'bn' ? 'সংশোধন' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLeaderFromDesk(leader.id)}
                            className="bg-neutral-950 border border-rose-500/30 hover:border-rose-500 text-rose-500 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            {language === 'bn' ? 'মুছুন' : 'Delete'}
                          </button>
                        </div>
                      )}
                      <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-emerald-700 to-amber-700 flex items-center justify-center font-bold text-white text-sm border-2 border-emerald-950">
                        {leader.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white leading-none">
                            {language === 'bn' ? leader.nameBn : leader.nameEn}
                          </h4>
                          <span className="text-[9px] px-2 py-0.5 bg-amber-950/30 text-[#D4AF37] border border-amber-800/40 font-mono font-bold rounded uppercase">
                            {language === 'bn' ? leader.roleBn : leader.roleEn}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-300 italic leading-relaxed pr-24">
                          &quot;{language === 'bn' ? leader.msgBn : leader.msgEn}&quot;
                        </p>
                      </div>
                    </div>
                  ))}

                  {adminEditorActive && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={openAddLeader}
                        className="flex items-center gap-1 text-[10px] bg-emerald-950 hover:bg-emerald-900 font-bold border border-emerald-500/50 text-emerald-400 rounded px-4 py-2 uppercase font-mono cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{language === 'bn' ? 'নতুন বক্তা যোগ করুন (+)' : 'Add Leader Address (+)'}</span>
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: COMPREHENSIVE NOTICE BOARD LIST */}
              {activeTab === 'notices' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                      <Megaphone className="h-4 w-4 text-emerald-400" />
                      <span>{language === 'bn' ? 'সিস্টেম এবং সোসাইটি নোটিশসমূহ' : 'Official Communications & Advisories'}</span>
                    </h3>
                    {adminEditorActive && (
                      <button
                        type="button"
                        onClick={openLoginNoticeAdd}
                        className="flex items-center gap-1.5 text-[9px] bg-emerald-900 border border-emerald-500/50 hover:bg-emerald-800 font-bold text-white px-2.5 py-1 rounded cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{language === 'bn' ? '+ নোটিশ যোগ করুন' : '+ Post Notice'}</span>
                      </button>
                    )}
                  </div>

                  {activeBulletins.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 font-mono bg-neutral-900/30 rounded-xl border border-dashed border-emerald-950">
                      {language === 'bn' ? 'এই মুহূর্তে নোটিশ বোর্ডে নতুন কোনো নোটিশ নেই।' : 'No active bulletins listed at this moment.'}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-950">
                      {activeBulletins.map(notice => (
                        <div key={notice.id} className="p-4 rounded-xl border border-emerald-950/40 bg-neutral-900/45 hover:border-emerald-850 transition-all space-y-2 relative group">
                          {adminEditorActive && (
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openLoginNoticeEdit(notice)}
                                className="bg-neutral-950 border border-amber-500/30 hover:border-amber-500 text-[#D4AF37] text-[8px] font-bold px-1 rounded cursor-pointer"
                              >
                                {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(language === 'bn' ? 'Are you sure?' : 'Confirm delete?')) {
                                    deleteNotice(notice.id);
                                  }
                                }}
                                className="bg-neutral-950 border border-rose-500/30 hover:border-rose-500 text-rose-500 text-[8px] font-bold px-1 rounded cursor-pointer"
                              >
                                {language === 'bn' ? 'মুছুন' : 'Delete'}
                              </button>
                            </div>
                          )}
                          <div className="flex items-center justify-between pr-24">
                            <span className="font-bold text-white text-xs">{notice.title}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                                notice.type === 'Emergency' 
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800/55' 
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800/55'
                              }`}>
                                {notice.type}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{notice.date}</span>
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{notice.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
          
          {/* Quick Stats Banner card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-neutral-950/30 border border-emerald-950/60 rounded-xl text-center">
              <span className="block text-slate-500 text-[9px] font-bold font-mono uppercase">{language === 'bn' ? 'মোট টাওয়ার্স' : 'DUAL TOWERS'}</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono whitespace-nowrap">02 Blocks</span>
            </div>
            <div className="p-3 bg-neutral-950/30 border border-emerald-950/60 rounded-xl text-center">
              <span className="block text-slate-500 text-[9px] font-bold font-mono uppercase">{language === 'bn' ? 'ফ্ল্যাট সংখ্যা' : 'SOCIETY APARTMENTS'}</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono whitespace-nowrap">72 Units</span>
            </div>
            <div className="p-3 bg-neutral-950/30 border border-emerald-950/60 rounded-xl text-center">
              <span className="block text-slate-500 text-[9px] font-bold font-mono uppercase">{language === 'bn' ? 'পার্কিং স্পেস' : 'UNDERGROUND PARKING'}</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono whitespace-nowrap">48 Bays</span>
            </div>
            <div className="p-3 bg-neutral-950/30 border border-emerald-950/60 rounded-xl text-center">
              <span className="block text-slate-500 text-[9px] font-bold font-mono uppercase">{language === 'bn' ? 'জরুরী জেনারেটর' : 'BACKUP GENERATORS'}</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono whitespace-nowrap">550 KVA</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Ultra-Premium Security Login Panel Form */}
        <section className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="rounded-2xl border border-emerald-900/60 bg-neutral-900 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            
            {/* watermark decoration */}
            <span className="absolute -top-10 -left-10 h-32 w-32 bg-emerald-500/[0.02] rounded-full pointer-events-none" />

            <div className="text-center pb-6 border-b border-emerald-950">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-955 border border-amber-500/35 ring-4 ring-amber-500/5">
                <Shield className="h-6 w-6 text-[#D4AF37] animate-pulse" />
              </div>
              <h2 className="mt-4 text-lg font-black tracking-tight text-white font-sans uppercase">
                {language === 'bn' ? 'সুরক্ষিত সিস্টেমে প্রবেশ' : 'Secure Resident Sign-In'}
              </h2>
              <p className="mt-1 text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-none">
                {language === 'bn' ? 'খেতাসার, কুমিল্লা পোর্টালে স্বাগত' : 'Khetasar, Cumilla Portal Access'}
              </p>
            </div>

            {/* Portal Role Selector pills */}
            <div className="space-y-2 mt-6">
              <label className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] font-mono flex items-center gap-1">
                <Info className="h-3 w-3 text-emerald-400" />
                <span>{language === 'bn' ? 'ইউজার রোল সিলেক্ট করুন' : 'SELECT SECURITY PORTAL ROLE'}</span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-emerald-950">
                <button
                  type="button"
                  onClick={() => handleRoleChange('Admin')}
                  className={`rounded-md py-2 text-center text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer ${role === 'Admin' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('Resident')}
                  className={`rounded-md py-2 text-center text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer ${role === 'Resident' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Resident
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('Staff')}
                  className={`rounded-md py-2 text-center text-[11px] font-black tracking-wider uppercase transition-all cursor-pointer ${role === 'Staff' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Staff
                </button>
              </div>
            </div>

            {/* Form */}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-450 border-r-4">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span className="font-sans font-semibold text-[11px]">{error}</span>
                </div>
              )}

              {forgotSent && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-900 bg-amber-950/20 p-3 text-xs text-amber-500 font-sans">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="text-[11px] font-semibold leading-tight">
                    {language === 'bn' 
                      ? 'পাসওয়ার্ড রিলেটড নোটিফিকেশন স্যান্ড করা হয়েছে!' 
                      : 'Security passcode instructions dispatched. Please check inbox logs.'}
                  </span>
                </div>
              )}

              {/* Email/ID Input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  {language === 'bn' ? 'রেজিস্টার্ড ইমেইল ঠিকানা' : 'Official Email Address'}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-emerald-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@astha.com"
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                    {language === 'bn' ? 'সিকিউরিটি পাসকোড' : 'Gate Passcode'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotSent(true)}
                    className="text-[10px] text-[#D4AF37] hover:underline font-bold"
                  >
                    {language === 'bn' ? 'কোড ভুলে গেছেন?' : 'Forgot Passcode?'}
                  </button>
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Key className="h-4 w-4 text-emerald-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* LogIn Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg border border-[#D4AF37]/35 bg-emerald-700 py-3 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-55"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    VERIFYING PERMIT CRIT...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 uppercase font-mono">
                    <UserCheck className="h-4 w-4 text-[#D4AF37]" />
                    <span>{language === 'bn' ? 'সিস্টেমে প্রবেশ করুন' : 'VALIDATE SECURITY ACCESS'}</span>
                  </span>
                )}
              </button>
            </form>

            {/* Route Transition Footer to Register */}
            <div className="text-center pt-4 border-t border-emerald-950/45 mt-6">
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {language === 'bn' 
                  ? 'আপনার ফ্ল্যাটের স্মার্ট ডিজিটাল অ্যাকাউন্ট নেই?' 
                  : "Don't have a secure dynamic flat account yet?"}
                <br />
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="text-[#D4AF37] hover:underline font-extrabold mt-1 uppercase tracking-wider text-[11px] font-mono block mx-auto cursor-pointer"
                >
                  {language === 'bn' ? 'নতুন ফ্ল্যাট অ্যাকাউন্ট খুলুন ➔' : 'Enrol New Apartment ➔'}
                </button>
              </p>
            </div>

          </div>

          <div className="mt-4 p-4 rounded-xl bg-neutral-900/20 border border-emerald-950 text-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            {language === 'bn' ? 'খসড়া ও ডাটা লোকাল ব্রাউজারে সংরক্ষিত' : 'SECURITY STANDARDS COMPLIANT'}
          </div>
        </section>

      </main>

      {/* 4. Portal Footer Section */}
      <footer className="mt-auto border-t border-emerald-950/80 bg-neutral-950/40 py-6 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-slate-450 uppercase text-[10px] tracking-widest">
            © 2026 Astha Twin Towers Association • All Rights Reserved
          </p>
          <p className="text-[10px] text-slate-500 tracking-wide font-sans">
            {language === 'bn' ? 'কারিগরি সহায়তায়: আস্থা ইঞ্জিনিয়ারিং গ্রুপ' : 'Power Engineering Support: Astha Systems Group'}
          </p>
        </div>
      </footer>

      {/* SECURITY ACCESS CODE PROMPT */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#D4AF37]" />
                <span>{language === 'bn' ? 'এডমিন ভেরিফিকেশন অ্যাক্সেস' : 'Admin Security Access'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowPasscodeModal(false);
                  setPasscode('');
                  setPasscodeError('');
                }} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (passcode === 'admin123') {
                setAdminEditorActive(true);
                setShowPasscodeModal(false);
                setPasscodeError('');
                setPasscode('');
              } else {
                setPasscodeError(language === 'bn' ? 'ভুল সিকিউরিটি কোড! পুনরায় চেষ্টা করুন।' : 'Incorrect security key. Hint: admin123');
              }
            }} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                  {language === 'bn' ? 'এডমিন সিকিউরিটি কোড লিখুন' : 'Enter Admin Passcode'}
                </label>
                <input
                  type="password"
                  required
                  placeholder="admin123"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                {passcodeError && <p className="text-[10px] text-rose-500 font-bold mt-1">{passcodeError}</p>}
                <p className="text-[9px] text-slate-500 italic mt-1 home-hint">
                  {language === 'bn' ? 'ডিমো এডমিন পাসকোড: admin123' : 'Demo administrator passcode is: admin123'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasscodeModal(false);
                    setPasscode('');
                    setPasscodeError('');
                  }}
                  className="px-3.5 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer font-bold"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold border border-[#D4AF37]/35 rounded cursor-pointer"
                >
                  {language === 'bn' ? 'নিশ্চিত করুন' : 'Unlock Editor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D RENDERING PANEL CONFIGURATION MODAL */}
      {show3dModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                <span>{language === 'bn' ? '৩ডি প্রজেক্ট ভিউ কাস্টমাইজেশন' : 'Edit 3D Structural View'}</span>
              </h3>
              <button type="button" onClick={() => setShow3dModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={save3dCustomizations} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">3D Image Path or Web URL</label>
                <input
                  type="text"
                  required
                  value={valBuilding3dImg}
                  onChange={(e) => setValBuilding3dImg(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Title (English)</label>
                  <input
                    type="text"
                    required
                    value={valBuilding3dTitleEn}
                    onChange={(e) => setValBuilding3dTitleEn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Title (বাংলা)</label>
                  <input
                    type="text"
                    required
                    value={valBuilding3dTitleBn}
                    onChange={(e) => setValBuilding3dTitleBn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Description (English)</label>
                <textarea
                  required
                  rows={3}
                  value={valBuilding3dDescEn}
                  onChange={(e) => setValBuilding3dDescEn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Description (বাংলা)</label>
                <textarea
                  required
                  rows={3}
                  value={valBuilding3dDescBn}
                  onChange={(e) => setValBuilding3dDescBn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShow3dModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-555 font-bold cursor-pointer"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Apply Specifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CIVIL WORK CONSTRUCTION MONITOR CONIFG MODAL */}
      {showConstructionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>{language === 'bn' ? 'নির্মাণ কাজের তথ্য পরিবর্তন' : 'Edit Construction Milestones'}</span>
              </h3>
              <button type="button" onClick={() => setShowConstructionModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveConstructionCustomizations} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Construction Photo URL</label>
                  <input
                    type="text"
                    required
                    value={valConstructionImg}
                    onChange={(e) => setValConstructionImg(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Progress Percentage (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={valConstructionPercent}
                    onChange={(e) => setValConstructionPercent(Number(e.target.value))}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Status Description (English)</label>
                <textarea
                  required
                  rows={3}
                  value={valConstructionDescEn}
                  onChange={(e) => setValConstructionDescEn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Status Description (বাংলা)</label>
                <textarea
                  required
                  rows={3}
                  value={valConstructionDescBn}
                  onChange={(e) => setValConstructionDescBn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowConstructionModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-500 font-bold cursor-pointer"
                >
                  {language === 'bn' ? 'অগ্রগতি হালনাগাদ করুন' : 'Confirm Milestones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEADERSHIP MEMBER OPINIONS MODAL */}
      {showLeaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#D4AF37]" />
                <span>
                  {editingLeader 
                    ? (language === 'bn' ? 'বাণী সংশোধন করুন' : 'Configure Executive Speech') 
                    : (language === 'bn' ? 'নতুন বক্তা ও বাণী সংযোজন' : 'Add Executive Panelist')}
                </span>
              </h3>
              <button type="button" onClick={() => setShowLeaderModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveLeaderCustomization} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Initials (e.g. AR)</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={leaderInitials}
                    onChange={(e) => setLeaderInitials(e.target.value.toUpperCase())}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Role/Designation (English)</label>
                  <input
                    type="text"
                    required
                    placeholder="SOCIETY PRESIDENT"
                    value={leaderRoleEn}
                    onChange={(e) => setLeaderRoleEn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Full Name (English)</label>
                  <input
                    type="text"
                    required
                    value={leaderNameEn}
                    onChange={(e) => setLeaderNameEn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">পদবি/পদমর্যাদা (বাংলা)</label>
                  <input
                    type="text"
                    required
                    placeholder="সভাপতি"
                    value={leaderRoleBn}
                    onChange={(e) => setLeaderRoleBn(e.target.value)}
                    className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">নাম (বাংলা)</label>
                <input
                  type="text"
                  required
                  value={leaderNameBn}
                  onChange={(e) => setLeaderNameBn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Message Speech (English)</label>
                <textarea
                  required
                  rows={2}
                  value={leaderMsgEn}
                  onChange={(e) => setLeaderMsgEn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">বক্তব্য বাণী (বাংলা)</label>
                <textarea
                  required
                  rows={2}
                  value={leaderMsgBn}
                  onChange={(e) => setLeaderMsgBn(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowLeaderModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-555 font-bold cursor-pointer"
                >
                  {editingLeader ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes') : (language === 'bn' ? 'বাণী প্রকাশ করুন' : 'Publish Speech')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK LOGIN BOARD BULLETIN MODAL */}
      {showLoginNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-xl border border-[#D4AF37]/40 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950 font-mono">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-emerald-400" />
                <span>
                  {editingLoginNotice 
                    ? (language === 'bn' ? 'নোটিশ সংশোধন' : 'Edit Live Advisory') 
                    : (language === 'bn' ? 'নতুন নোটিশ পোস্ট' : 'Publish Urgent Bulletin')}
                </span>
              </h3>
              <button type="button" onClick={() => setShowLoginNoticeModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveLoginNotice} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Notice Heading</label>
                <input
                  type="text"
                  required
                  placeholder="Water shut down notice / গ্যাস মেরামত কাজ"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Bulletin Category</label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value as Notice['type'])}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Announcement">Announcement (সাধারণ ঘোষণা)</option>
                  <option value="Emergency">Emergency (জরুরী নোটিশ)</option>
                  <option value="Meeting">Meeting (সাধারণ সভা)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Notice Description Contents</label>
                <textarea
                  required
                  rows={4}
                  placeholder="write details here..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="block w-full rounded-md border border-[#D4AF37]/30 bg-neutral-900 py-2.5 px-3 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowLoginNoticeModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-555 font-bold cursor-pointer"
                >
                  {editingLoginNotice ? (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Details') : (language === 'bn' ? 'বুলেটিন প্রকাশ করুন' : 'Announce Advisory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
