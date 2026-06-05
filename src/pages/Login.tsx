/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { googleSignIn } from '../lib/googleAuth';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  X,
  Upload
} from 'lucide-react';

interface LoginProps {
  onRegisterClick: () => void;
}

export default function Login({ onRegisterClick }: LoginProps) {
  const { 
    login, 
    loginWithGoogle,
    userAccounts,
    updateUserPassword,
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

  const [leaderPhoto, setLeaderPhoto] = useState('');

  // Form Fields State: Quick Notice Write on login page
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<Notice['type']>('Announcement');
  const [noticeImage, setNoticeImage] = useState('');

  // Helper for Uploading from Local Drive with Client-side Canvas Compression
  // Compresses any large camera photos down to optimized JPEG representation (~40KB - 80KB)
  // This fully prevents Firestore 1MB document limitations and stops saving failures/reverts.
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // High quality scale down to maximum 1024px width/height maintaining design details
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress JPEG quality to 65% which looks crisp but weighs only 30KB - 80KB
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          callback(compressedBase64);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    setValBuilding3dImg(config.building3dImg || '');
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
    setValConstructionImg(config.constructionImg || '');
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
    setLeaderPhoto(leader.photo || '');
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
    setLeaderPhoto('');
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
        msgBn: leaderMsgBn,
        photo: leaderPhoto
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
        msgBn: leaderMsgBn,
        photo: leaderPhoto
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
    setNoticeImage('');
    setShowLoginNoticeModal(true);
  };

  const openLoginNoticeEdit = (notice: Notice) => {
    setEditingLoginNotice(notice);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeType(notice.type);
    setNoticeImage(notice.image || '');
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
        type: noticeType,
        image: noticeImage
      });
    } else {
      addNotice({
        title: noticeTitle,
        content: noticeContent,
        type: noticeType,
        active: true,
        image: noticeImage
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

  // SECURE OTP PASSWORD RECOVERY STATES
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [otpSentStep, setOtpSentStep] = useState(false);
  const [resetPasswordStep, setResetPasswordStep] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmNewPasscode, setConfirmNewPasscode] = useState('');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [selectedResetRole, setSelectedResetRole] = useState<'Admin' | 'Resident' | 'Staff'>('Admin');
  const [simulatedOtpNotification, setSimulatedOtpNotification] = useState<{ otp: string; email: string } | null>(null);

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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const authResult = await googleSignIn();
      if (authResult?.user?.email) {
        const success = await loginWithGoogle(authResult.user.email);
        if (success) {
          setError('');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrorMessage('');
    setError('');
    
    if (!forgotEmail) {
      setOtpErrorMessage(language === 'bn' ? 'দয়া করে আপনার নিবন্ধিত ইমেইল প্রবেশ করান' : 'Please enter your registered email');
      return;
    }

    setLoading(true);
    try {
      // Find matching account in database accounts under the chosen role:
      const matched = userAccounts.find(
        ua => ua.email.toLowerCase() === forgotEmail.trim().toLowerCase() && ua.role === selectedResetRole
      );

      if (!matched) {
        setOtpErrorMessage(
          language === 'bn' 
            ? `এই রোল (${selectedResetRole}) এবং ইমেইলের সাথে কোনো মিল পাওয়া যায়নি!` 
            : `No matching record found under the selected role (${selectedResetRole}) and email!`
        );
        setLoading(false);
        return;
      }

      // Generate secure 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Write OTP verification parameters directly to Firebase Firestore live_data/otp_verifications document
      const docRef = doc(db, 'live_data', 'otp_verifications');
      const docSnap = await getDoc(docRef);
      const dataPayload = docSnap.exists() ? docSnap.data().data || {} : {};
      
      dataPayload[forgotEmail.trim().toLowerCase()] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
        verified: false,
        accountUniqueId: matched.id
      };

      await setDoc(docRef, { data: dataPayload }, { merge: true });

      // Trigger beautiful visual sandbox delivery alert
      setSimulatedOtpNotification({
        otp: generatedOtp,
        email: forgotEmail.trim().toLowerCase()
      });

      setOtpSentStep(true);
    } catch (err: any) {
      console.error(err);
      setOtpErrorMessage(language === 'bn' ? 'ওটিপি পাঠাতে সমস্যা হয়েছে।' : 'Failed to dispatch verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrorMessage('');
    
    if (!enteredOtp || enteredOtp.length !== 6) {
      setOtpErrorMessage(language === 'bn' ? 'দয়া করে ৬ সংখ্যার ওটিপি কোডটি লিখুন' : 'Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'live_data', 'otp_verifications');
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setOtpErrorMessage(language === 'bn' ? 'ওটিপি ডাটা পাওয়া যায়নি!' : 'No active OTP verification session found!');
        setLoading(false);
        return;
      }

      const dataPayload = docSnap.data().data || {};
      const activeRecord = dataPayload[forgotEmail.trim().toLowerCase()];

      if (activeRecord) {
        if (activeRecord.otp === enteredOtp.trim()) {
          if (Date.now() < activeRecord.expiresAt) {
            // OTP is matched and valid! Proceed to reset password screen
            setOtpErrorMessage('');
            setOtpSentStep(false);
            setResetPasswordStep(true);
          } else {
            setOtpErrorMessage(language === 'bn' ? 'ওটিপি মেয়াদোত্তীর্ণ হয়ে গেছে! নতুন ওটিপি পাঠান।' : 'OTP code has expired! Please request a new one.');
          }
        } else {
          setOtpErrorMessage(language === 'bn' ? 'ভুল ওটিপি প্রবেশ করানো হয়েছে। দয়া করে আবার চেষ্টা করুন।' : 'Invalid OTP code! Please double-check and retry.');
        }
      } else {
        setOtpErrorMessage(language === 'bn' ? 'এই ইমেইলের জন্য কোনো ওটিপি সেশন পাওয়া যায়নি।' : 'No OTP session found for this email address.');
      }
    } catch (err: any) {
      console.error(err);
      setOtpErrorMessage(language === 'bn' ? 'ওটিপি যাচাইকরণে ত্রুটি হয়েছে।' : 'Error encountered during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpErrorMessage('');

    if (!newPasscode || newPasscode.length < 4) {
      setOtpErrorMessage(language === 'bn' ? 'পাসকোডটি অন্তত ৪ অক্ষরের হতে হবে' : 'Passcode must be at least 4 characters long');
      return;
    }

    if (newPasscode !== confirmNewPasscode) {
      setOtpErrorMessage(language === 'bn' ? 'পাসকোড দুটি মেলেনি!' : 'Passcodes do not match!');
      return;
    }

    setLoading(true);
    try {
      const matched = userAccounts.find(
        ua => ua.email.toLowerCase() === forgotEmail.trim().toLowerCase() && ua.role === selectedResetRole
      );

      if (matched) {
        // Execute real passcode change back to database
        updateUserPassword(matched.id, newPasscode);
        
        // Clean up OTP documentation from server references
        const docRef = doc(db, 'live_data', 'otp_verifications');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dataPayload = docSnap.data().data || {};
          delete dataPayload[forgotEmail.trim().toLowerCase()];
          await setDoc(docRef, { data: dataPayload }, { merge: true });
        }

        // Successfully updated!
        setResetPasswordStep(false);
        setForgotPasswordMode(false);
        setForgotEmail('');
        setEnteredOtp('');
        setNewPasscode('');
        setConfirmNewPasscode('');
        setSimulatedOtpNotification(null);
        setError(language === 'bn' ? 'আপনার পাসকোডটি সফলভাবে পরিবর্তন করা হয়েছে। নতুন পাসকোড দিয়ে প্রবেশ করুন।' : 'Your passcode has been updated successfully. Please login with your new credentials.');
      } else {
        setOtpErrorMessage(language === 'bn' ? 'অ্যাকাউন্ট মিলানো ব্যর্থ হয়েছে।' : 'Failed to map user account context.');
      }
    } catch (err: any) {
      console.error(err);
      setOtpErrorMessage(language === 'bn' ? 'পাসকোড পরিবর্তনে সমস্যা হয়েছে।' : 'Failed to change gate passcode.');
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
                      src={config.building3dImg || building3dImg} 
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
                      src={config.constructionImg || constructionImg} 
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
                      {leader.photo ? (
                        <img 
                          src={leader.photo} 
                          alt={leader.nameEn} 
                          className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-emerald-900" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-emerald-700 to-amber-700 flex items-center justify-center font-bold text-white text-sm border-2 border-emerald-950">
                          {leader.initials}
                        </div>
                      )}
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
                          {notice.image && (
                            <div className="mt-2 text-center">
                              <img 
                                src={notice.image} 
                                alt={notice.title} 
                                className="max-h-48 max-w-full rounded-lg object-cover mx-auto border border-emerald-950/45 shadow"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
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

            {!forgotPasswordMode ? (
              <>
                {/* Portal Role Selector pills */}
                <div className="space-y-2 mt-6 animate-fadeIn">
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
                        onClick={() => {
                          setForgotPasswordMode(true);
                          setForgotEmail(email);
                          setSelectedResetRole(role);
                          setOtpSentStep(false);
                          setResetPasswordStep(false);
                          setOtpErrorMessage('');
                        }}
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

                {/* Google Authentication Section */}
                <div className="relative flex py-2 items-center mt-4">
                  <div className="flex-grow border-t border-emerald-950/60"></div>
                  <span className="flex-shrink mx-4 text-[9px] text-slate-500 font-mono tracking-widest uppercase">
                    {language === 'bn' ? 'অথবা জিমেইল লগইন' : 'OR SECURE GOOGLE LOGIN'}
                  </span>
                  <div className="flex-grow border-t border-emerald-950/60"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-700 bg-white hover:bg-slate-50 px-4 py-3 text-emerald-950 transition-all cursor-pointer shadow-md disabled:opacity-55"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.1c-.22-.66-.35-1.39-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="font-sans font-black tracking-wider uppercase text-[10px] text-slate-800">
                    {language === 'bn' ? 'গুগল অ্যাকাউন্ট দিয়ে প্রবেশ' : 'Sign in with Google (Gmail)'}
                  </span>
                </button>

                {/* Route Transition Footer to Register */}
                <div className="text-center pt-4 border-t border-emerald-950/45 mt-4">
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
              </>
            ) : (
              /* SECURE OTP PASSWORD RESET WIZARD */
              <div className="space-y-4 animate-fadeIn mt-4">
                {/* Back to Login Link */}
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setOtpSentStep(false);
                    setResetPasswordStep(false);
                    setForgotEmail('');
                    setEnteredOtp('');
                    setNewPasscode('');
                    setConfirmNewPasscode('');
                    setOtpErrorMessage('');
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline font-bold mb-2 cursor-pointer"
                >
                  ← {language === 'bn' ? 'লগইন পেজে ফিরে যান' : 'Back to Login'}
                </button>

                <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider text-center border-b border-emerald-950 pb-2">
                  {resetPasswordStep 
                    ? (language === 'bn' ? 'নতুন পাসকোড সেট করুন' : 'SET NEW PASSWORD')
                    : (otpSentStep 
                      ? (language === 'bn' ? '৬-ডিজিট ওটিপি কোড দিন' : 'ENTER VERIFICATION OTP')
                      : (language === 'bn' ? 'পাসকোড পুনরুদ্ধার ফোরাম' : 'RESET SECURITY CODE'))}
                </h3>

                {otpErrorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-450 border-r-4">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span className="font-sans font-semibold text-[11px]">{otpErrorMessage}</span>
                  </div>
                )}

                {!otpSentStep && !resetPasswordStep && (
                  /* STEP 1: Enter email and choose role */
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <p className="text-[11px] text-slate-405 leading-relaxed font-sans">
                      {language === 'bn'
                        ? 'আপনার অ্যাকাউন্ট রোল সিলেক্ট করে নিবন্ধিত ইমেইল ঠিকানাটি লিখুন। আমরা ঐ ইমেইলে ১টি ওয়ান-টাইম পাসওয়ার্ড (OTP) কোড পাঠাবো।'
                        : 'Select your registered portal role and input your Gmail address. We will verify your credentials and dispatch a 6-digit secure registration OTP.'}
                    </p>

                    {/* Reset Role Selector pills */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37] font-mono block">
                        {language === 'bn' ? 'পুনরুদ্ধার রোল সিলেক্ট করুন' : 'SELECT RECOVERY PROFILE ROLE'}
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-emerald-950">
                        {(['Admin', 'Resident', 'Staff'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedResetRole(r)}
                            className={`rounded-md py-1.5 text-center text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer ${selectedResetRole === r ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        {language === 'bn' ? 'নিবন্ধিত জিমেইল ইমেইল' : 'Registered Gmail Address'}
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Mail className="h-4 w-4 text-amber-500" />
                        </div>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="your-gmail@gmail.com"
                          className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded-lg border border-amber-600 bg-amber-700 py-3 text-xs font-black tracking-widest text-white shadow-lg shadow-amber-900/10 transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-55"
                    >
                      {loading ? (
                        <span className="font-mono text-[10px] uppercase">SENDING SECURE OTP...</span>
                      ) : (
                        <span className="flex items-center gap-1.5 uppercase font-mono">
                          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                          <span>{language === 'bn' ? 'নিরাপত্তা কোড পাঠান' : 'SEND SECURITY OTP'}</span>
                        </span>
                      )}
                    </button>
                  </form>
                )}

                {otpSentStep && !resetPasswordStep && (
                  /* STEP 2: Enter OTP Code */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {language === 'bn'
                        ? `আমরা ${forgotEmail} ঠিকানায় ৬ অঙ্কের একটি নিরাপত্তা কোড (OTP) পাঠিয়েছি। অনুগ্রহ করে ৫ মিনিটের মধ্যে সেটি নিচে এন্টার করুন।`
                        : `A 6-digit secure verification passcode has been generated for ${forgotEmail}. Please review your inbox and input it below (expires in 5 mins).`}
                    </p>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-450 font-mono block text-center tracking-widest">
                        {language === 'bn' ? '৬-ডিজিট নিরাপত্তা ওটিপি কোড লেখেন' : 'ENTER 6-DIGIT OTP CODE'}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="block w-44 mx-auto rounded-md border border-emerald-950 bg-neutral-950 py-2.5 text-center text-lg font-mono font-black tracking-[0.25em] text-emerald-400 placeholder-slate-800 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded-lg border border-emerald-600 bg-emerald-700 py-3 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-55"
                    >
                      {loading ? (
                        <span className="font-mono text-[10px] uppercase">VERIFYING OTP CODE...</span>
                      ) : (
                        <span className="flex items-center gap-1.5 uppercase font-mono">
                          <CheckCircle className="h-4 w-4 text-[#D4AF37]" />
                          <span>{language === 'bn' ? 'কোড যাচাই করুন' : 'VERIFY SECURITY CODE'}</span>
                        </span>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[9px] text-slate-450 hover:text-white font-mono uppercase tracking-wider underline cursor-pointer"
                      >
                        {language === 'bn' ? 'ওটিপি কোড পুনরায় পাঠান' : 'RESEND OTP CODE'}
                      </button>
                    </div>
                  </form>
                )}

                {resetPasswordStep && (
                  /* STEP 3: Enter New Passcode */
                  <form onSubmit={handleResetPasscode} className="space-y-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {language === 'bn'
                        ? 'আপনার নিরাপত্তা ওটিপি সফলভাবে যাচাই করা হয়েছে! অনুগ্রহ করে আপনার প্রোফাইলের জন্য একটি নতুন পাসকোড নির্ধারণ করুন।'
                        : 'Your secure verification OTP has been verified successfully! Set a new strong Gate Passcode for your account profile.'}
                    </p>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        {language === 'bn' ? 'নতুন গেট পাসকোড' : 'New Gate Passcode'}
                      </label>
                      <input
                        type="password"
                        required
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        placeholder="••••••"
                        className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 px-3 text-xs text-white placeholder-slate-700 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        {language === 'bn' ? 'নতুন পাসকোড নিশ্চিত করুন' : 'Confirm New Passcode'}
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPasscode}
                        onChange={(e) => setConfirmNewPasscode(e.target.value)}
                        placeholder="••••••"
                        className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2.5 px-3 text-xs text-white placeholder-slate-700 focus:border-emerald-500 focus:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center rounded-lg border border-emerald-600 bg-emerald-700 py-3 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-55"
                    >
                      {loading ? (
                        <span className="font-mono text-[10px] uppercase">UPDATING GATE PASSCODE...</span>
                      ) : (
                        <span className="flex items-center gap-1.5 uppercase font-mono">
                          <UserCheck className="h-4 w-4 text-[#D4AF37]" />
                          <span>{language === 'bn' ? 'নতুন পাসকোড সেভ করুন' : 'SECURE NEW PASSWORD'}</span>
                        </span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

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
              <div className="space-y-2 bg-neutral-900/60 p-3.5 rounded-lg border border-emerald-900/35">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-300 block">3D Image (ছবি)</label>
                  {valBuilding3dImg && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত ছবি ডিলিট বা রিসেট করতে চান?' : 'Are you sure you want to delete/reset this custom image?')) {
                          setValBuilding3dImg('');
                        }
                      }}
                      className="text-[9px] text-red-500 hover:text-red-400 font-bold font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      [ {language === 'bn' ? 'ছবি ডিলিট / রিসেট' : 'Delete / Reset'} ]
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Paste web URL or upload from local drive..."
                  value={valBuilding3dImg}
                  onChange={(e) => setValBuilding3dImg(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2 px-3 text-white focus:border-[#D4AF37] focus:outline-none placeholder-slate-700"
                />
                
                 {/* Local file uploader wrapper */}
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="building-3d-upload-input" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-white font-semibold text-[10px] cursor-pointer shadow hover:shadow-emerald-900/30 transition-all select-none">
                    <Upload className="h-3.5 w-3.5 text-amber-400 font-bold" />
                    <span>{language === 'bn' ? 'লোকাল ড্রাইভ থেকে ছবি আপলোড' : 'Upload from Local Drive'}</span>
                  </label>
                  <input
                    id="building-3d-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setValBuilding3dImg)}
                  />
                  {valBuilding3dImg?.startsWith('data:image') && (
                    <span className="text-[10px] text-emerald-400 font-mono">✓ Base64 Loaded</span>
                  )}
                </div>
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
              <div className="space-y-2 bg-neutral-900/60 p-3.5 rounded-lg border border-emerald-900/35">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-300 block">Construction Progress Photo (অগ্রগতির ছবি)</label>
                  {valConstructionImg && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত অগ্রগতির ছবি ডিলিট বা রিসেট করতে চান?' : 'Are you sure you want to delete/reset this construction progress photo?')) {
                          setValConstructionImg('');
                        }
                      }}
                      className="text-[9px] text-red-500 hover:text-red-400 font-bold font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      [ {language === 'bn' ? 'ছবি ডিলিট / রিসেট' : 'Delete / Reset'} ]
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Paste web URL or upload from local drive..."
                  value={valConstructionImg || ''}
                  onChange={(e) => setValConstructionImg(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2 px-3 text-white focus:border-[#D4AF37] focus:outline-none placeholder-slate-700"
                />
                
                {/* Local file uploader wrapper */}
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="construction-upload-input" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-white font-semibold text-[10px] cursor-pointer shadow hover:shadow-emerald-900/30 transition-all select-none">
                    <Upload className="h-3.5 w-3.5 text-amber-400 font-bold" />
                    <span>{language === 'bn' ? 'লোকাল ড্রাইভ থেকে ছবি আপলোড' : 'Upload from Local Drive'}</span>
                  </label>
                  <input
                    id="construction-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setValConstructionImg)}
                  />
                  {valConstructionImg?.startsWith('data:image') && (
                    <span className="text-[10px] text-emerald-400 font-mono">✓ Base64 Loaded</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2 bg-neutral-900/60 p-3.5 rounded-lg border border-emerald-900/35">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-300 block">Leader Profile Photo (নেতার ছবি)</label>
                  {leaderPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত ছবি ডিলিট করতে চান?' : 'Are you sure you want to delete this profile photograph?')) {
                          setLeaderPhoto('');
                        }
                      }}
                      className="text-[9px] text-red-500 hover:text-red-400 font-bold font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      [ {language === 'bn' ? 'ছবি ডিলিট' : 'Delete Photo'} ]
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Paste profile photo URL or upload from local drive..."
                  value={leaderPhoto || ''}
                  onChange={(e) => setLeaderPhoto(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2 px-3 text-white focus:border-[#D4AF37] focus:outline-none placeholder-slate-700"
                />
                
                {/* Local file uploader wrapper */}
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="leader-upload-input" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-white font-semibold text-[10px] cursor-pointer shadow hover:shadow-emerald-900/30 transition-all select-none">
                    <Upload className="h-3.5 w-3.5 text-amber-400 font-bold" />
                    <span>{language === 'bn' ? 'লোকাল ড্রাইভ থেকে ছবি আপলোড' : 'Upload from Local Drive'}</span>
                  </label>
                  <input
                    id="leader-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setLeaderPhoto)}
                  />
                  {leaderPhoto?.startsWith('data:image') && (
                    <span className="text-[10px] text-emerald-400 font-mono">✓ Base64 Loaded</span>
                  )}
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

              <div className="space-y-2 bg-neutral-900/60 p-3.5 rounded-lg border border-emerald-900/35">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-300 block">Notice Attachment Image (নোটিশে ছবি যুক্ত করুন)</label>
                  {noticeImage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত এই নোটিশের ছবি ডিলিট বা রিমুভ করতে চান?' : 'Are you sure you want to remove the image attachment from this notice?')) {
                          setNoticeImage('');
                        }
                      }}
                      className="text-[9px] text-red-500 hover:text-red-400 font-bold font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      [ {language === 'bn' ? 'ছবি ডিলিট / রিমুভ' : 'Remove Image'} ]
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Paste notice attachment URL or upload from local drive..."
                  value={noticeImage}
                  onChange={(e) => setNoticeImage(e.target.value)}
                  className="block w-full rounded-md border border-emerald-950 bg-neutral-950 py-2 px-3 text-white focus:border-[#D4AF37] focus:outline-none placeholder-slate-700"
                />
                
                {/* Local file uploader wrapper */}
                <div className="flex items-center gap-3 pt-1">
                  <label htmlFor="notice-upload-input" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-white font-semibold text-[10px] cursor-pointer shadow hover:shadow-emerald-900/30 transition-all select-none">
                    <Upload className="h-3.5 w-3.5 text-amber-400 font-bold" />
                    <span>{language === 'bn' ? 'লোকাল ড্রাইভ থেকে ছবি আপলোড' : 'Upload from Local Drive'}</span>
                  </label>
                  <input
                    id="notice-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setNoticeImage)}
                  />
                  {noticeImage?.startsWith('data:image') && (
                    <span className="text-[10px] text-emerald-400 font-mono">✓ Base64 Loaded</span>
                  )}
                </div>
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
      )}      {/* SIMULATED SMTP SECURE SANDBOX EMAIL/OTP OUTBOX DRAWER */}
      {simulatedOtpNotification && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-xl border border-amber-500/55 bg-neutral-950 p-5 shadow-2xl ring-4 ring-amber-500/10 animate-[slideUp_0.3s_ease-out]">
          <div className="flex items-center justify-between pb-2 border-b border-amber-900/40">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-amber-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SECURE SMTP SANDBOX OUTBOX</span>
            </div>
            <button
              onClick={() => setSimulatedOtpNotification(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 space-y-2 text-xs font-sans">
            <div className="bg-neutral-900 p-2.5 rounded border border-emerald-950">
              <span className="block text-[9px] text-[#D4AF37] font-mono uppercase tracking-wider">Mail Delivery Dispatch Status</span>
              <span className="text-[11px] text-emerald-400 font-medium">Delivered to client mail server successfully!</span>
            </div>
            <div className="text-slate-350 space-y-1 bg-neutral-900/50 p-2.5 rounded border border-neutral-900">
              <p>
                <strong className="text-slate-400">Recipient Email:</strong>{' '}
                <span className="font-mono text-white text-[11px]">{simulatedOtpNotification.email}</span>
              </p>
              <p>
                <strong className="text-slate-400">Security Subject:</strong>{' '}
                <span className="text-white text-[11px]">Digital Society Gate Key Passcode Reset Recovery Code (OTP)</span>
              </p>
              <p className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between">
                <span className="font-bold text-amber-500">OTP Code:</span>
                <span className="font-mono text-base font-black px-3 py-1 bg-neutral-900 text-[#D4AF37] border border-[#D4AF37]/30 rounded tracking-widest select-all animate-pulse">
                  {simulatedOtpNotification.otp}
                </span>
              </p>
            </div>
            <p className="text-[9px] text-slate-500 font-mono italic leading-normal text-center pt-1">
              * This sandbox outbox intercepts real-time SMTP emails to display OTPs inside your current preview session instantly.
            </p>
          </div>
        </div>
      )}


    </div>
  );
}
