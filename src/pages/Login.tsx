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
  Upload,
  BookOpen,
  CreditCard
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

  // Helper to generate and download a robust, high-fidelity offline printable HTML brochure
  // This completely circumvents iframe printing restrictions and provides an extraordinarily
  // professional corporate booklet containing all modules of the Astha Twin Towers Application.
  const handleDownloadBrochureHtml = () => {
    setShowBrochureToast(true);
    setTimeout(() => {
      setShowBrochureToast(false);
    }, 7000);

    const brochureTitle = language === 'bn' 
      ? 'আস্থা টুইন টাওয়ার্স - গর্ভমেন্ট-স্ট্যান্ডার্ড ডিজিটাল আবাসন ব্রোশিয়ার' 
      : 'Astha Twin Towers - Corporate Digital Housing Portal Brochure';

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });

    const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brochureTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #022c22;
      --secondary: #064e3b;
      --gold: #b45309;
      --gold-light: #fef3c7;
      --dark: #0f172a;
      --light: #f8fafc;
      --border: #e2e8f0;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Hind Siliguri', 'Inter', sans-serif;
      background-color: #111827;
      color: #f3f4f6;
      line-height: 1.6;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }

    /* Screen Reader Mockup Controls */
    .screen-header-control {
      width: 100%;
      max-width: 900px;
      background: linear-gradient(135deg, #022c22 0%, #064e3b 100%);
      border: 1px solid #d4af37;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    .screen-header-control h2 {
      font-size: 14px;
      color: #fff;
      margin-bottom: 4px;
    }

    .screen-header-control p {
      font-size: 11px;
      color: #a7f3d0;
    }

    .btn-print {
      background-color: #d4af37;
      color: #022c22;
      border: none;
      padding: 10px 20px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 10px rgba(212, 175, 55, 0.3);
    }

    .btn-print:hover {
      background-color: #ffffff;
      transform: translateY(-1px);
    }

    /* A4 Portrait Brochure Wrapper */
    .brochure-container {
      background: #ffffff;
      color: #0f172a;
      width: 100%;
      max-width: 900px;
      padding: 60px 80px;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .page-break {
      page-break-after: always;
      position: relative;
    }

    /* Cover Page Elements */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 980px;
      padding: 40px 0;
    }

    .cover-top {
      text-align: center;
      border-bottom: 4px double #d4af37;
      padding-bottom: 25px;
    }

    .emblem {
      margin: 0 auto 15px auto;
      width: 80px;
      height: 80px;
      background-color: #022c22;
      border: 2px solid #d4af37;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #d4af37;
      font-weight: bold;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .cover-top h1 {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      color: #022c22;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }

    .cover-top h3 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #b45309;
      font-weight: 700;
    }

    .cover-middle {
      text-align: center;
      margin: 80px 0;
    }

    .banner-badge {
      display: inline-block;
      background-color: #fef3c7;
      color: #b45309;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 2.5px;
      padding: 6px 16px;
      border: 1.5px solid #f59e0b;
      border-radius: 9999px;
      margin-bottom: 30px;
    }

    .main-title {
      font-size: 42px;
      line-height: 1.25;
      font-weight: 800;
      color: #022c22;
      margin-bottom: 20px;
    }

    .main-subtitle {
      font-size: 18px;
      color: #475569;
      font-weight: 500;
      max-width: 600px;
      margin: 0 auto;
    }

    .building-graphic {
      margin-top: 50px;
      border: 1px solid #e2e8f0;
      padding: 10px;
      border-radius: 12px;
      background-color: #f8fafc;
    }

    .cover-bottom {
      border-top: 1px solid #cbd5e1;
      padding-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }

    .curator-stamp {
      font-weight: bold;
      color: #022c22;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    /* Page Titles & Hierarchy */
    .section-header {
      border-bottom: 2px solid #022c22;
      padding-bottom: 15px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-header h2 {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      color: #022c22;
      font-weight: bold;
    }

    .section-header .page-num {
      font-family: monospace;
      font-size: 14px;
      color: #b45309;
      font-weight: 700;
    }

    .toc-grid {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin: 40px 0;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 14px;
    }

    .toc-name {
      font-weight: 700;
      color: #022c22;
      flex-shrink: 0;
    }

    .toc-line {
      flex-grow: 1;
      border-bottom: 2px dotted #cbd5e1;
      margin: 0 15px;
    }

    .toc-page {
      font-weight: bold;
      color: #b45309;
    }

    .welcome-card {
      background-color: #f8fafc;
      border-left: 4px solid #022c22;
      padding: 25px;
      border-radius: 0 12px 12px 0;
      margin: 40px 0;
    }

    .welcome-card h4 {
      font-size: 16px;
      color: #022c22;
      margin-bottom: 10px;
      font-weight: 700;
    }

    /* Feature Module Pages Layout */
    .module-sheet {
      height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30px 0;
    }

    .module-title-bar {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
    }

    .module-pin {
      width: 45px;
      height: 45px;
      background-color: #fef3c7;
      border: 1.5px solid #d4af37;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      color: #b45309;
      font-weight: bold;
    }

    .module-meta {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #b45309;
      letter-spacing: 1.5px;
    }

    .module-title-bar h3 {
      font-size: 20px;
      font-weight: 800;
      color: #022c22;
    }

    .block-desc {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 22px;
      font-size: 13.5px;
      color: #334155;
      line-height: 1.7;
      margin-bottom: 30px;
    }

    .subtitle-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #022c22;
      letter-spacing: 2px;
      margin-bottom: 12px;
      display: block;
      border-left: 2.5px solid #b45309;
      padding-left: 10px;
    }

    .benefit-list {
      list-style-type: none;
      margin-bottom: 35px;
    }

    .benefit-list li {
      position: relative;
      padding-left: 30px;
      margin-bottom: 15px;
      font-size: 13px;
      color: #1e293b;
      font-weight: 500;
    }

    .benefit-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      top: -2px;
      width: 20px;
      height: 20px;
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 11px;
      font-weight: bold;
    }

    .value-card {
      background: linear-gradient(to right, #fefbf3, #fffdf9);
      border-left: 3px solid #b45309;
      padding: 18px 24px;
      border-radius: 0 8px 8px 0;
      margin-top: auto;
    }

    .value-card .label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 1px;
      margin-bottom: 4px;
      display: block;
    }

    .value-card p {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      color: #b45309;
      font-size: 14px;
      font-weight: 600;
    }

    /* Print Overrides */
    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .screen-header-control {
        display: none !important;
      }

      .brochure-container {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }

      .page-break {
        page-break-after: always !important;
        display: block !important;
        height: 100vh !important;
        box-sizing: border-box !important;
      }

      .cover {
        height: 100vh !important;
      }

      .module-sheet {
        height: 100vh !important;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Reader Friendly Top Bar (hidden on paper) -->
  <div class="screen-header-control">
    <div>
      <h2>📋 প্রফেশনাল ব্রোশিয়ার রেডি হয়েছে (Bilingual Digital Booklet)</h2>
      <p>আপনার ব্রাউজারের প্রিন্টিং ফ্রেমওয়ার্ক নিচে ওপেন হয়েছে। PDF হিসেবে সেভ করার জন্য 'Save as PDF' অপশন নির্বাচন করুন।</p>
    </div>
    <button class="btn-print" onclick="window.print()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      <span>ম্যানুয়ালি প্রিন্ট করুন</span>
    </button>
  </div>

  <!-- Main Multi-Page Printable Brochure -->
  <div class="brochure-container">
    
    <!-- PAGE 1: LUXURY COVER PAGE -->
    <div class="page-break cover">
      <div class="cover-top">
        <div class="emblem">ATT</div>
        <h1>ASTHA TWIN TOWERS</h1>
        <h3>Premium Gated Luxury Condominium कॉम्प्लेक्स</h3>
      </div>
      
      <div class="cover-middle">
        <span class="banner-badge">Official Resident Manual</span>
        <h2 class="main-title">ডিজিটাল আবাসনের স্মার্ট মানদণ্ড<br><span style="font-size: 26px; font-weight:500; font-family:'Playfair Display'; color: #475569;">Smart Resident Management & Operations Suite</span></h2>
        <p class="main-subtitle">আস্থা টুইন টাওয়ার পরিচালনা কমিটির সম্পূর্ণ ডিজিটাল গাইডবুক ও ফিচার বুকলেট। সোসাইটির স্বয়ংক্রিয় হিসাব, নিরাপত্তা প্রাচীর ও দৈনন্দিন আধুনিক নাগরিক জীবনযাত্রার সহায়ক টুলস।</p>
        
        <div class="building-graphic">
          <div style="font-family: monospace; font-size: 11px; color:#64748b; padding:10px 0;">
            [ ASTHA TWIN TOWERS • ARCHITECTURAL BLUEPRINT 2026 ]
          </div>
        </div>
      </div>
      
      <div class="cover-bottom">
        <span>সংকলক: আস্থা টুইন টাওয়ার্স পরিচালনা পর্ষদ</span>
        <span class="curator-stamp">Security & Transparency • 2026</span>
      </div>
    </div>

    <!-- PAGE 2: TABLE OF CONTENTS & PRESIDENT'S NOTE -->
    <div class="page-break" style="padding: 40px 0;">
      <div class="section-header">
        <h2>সূচিপত্র ও ডাইরেক্টরি গাইড (Table of Contents)</h2>
        <span class="page-num">Page 02</span>
      </div>

      <p style="font-size:13.5px; color:#334155; margin-bottom: 25px;">
        সম্মানিত আস্থা টুইন টাওয়ার্সের বাসিন্দা ও সদস্যবৃন্দ, আমাদের এই স্মার্ট ডিজিটাল কাস্টম পোর্টাল আপনার দৈনন্দিন আবাসন জীবনকে ঝামেলাহীন, নিরাপদ ও অর্থনৈতিকভাবে শতভাগ স্বচ্ছ করার জন্য একটি বিজ্ঞানসম্মত সমাধান। এই গাইডবুকে থাকা ০৭টি মূল আর্কিটেকচারাল ফিচার ইনডেক্স থেকে আপনি পোর্টালের কিকি সুবিধা পাবেন তা সুন্দরভাবে সাজানো রয়েছে।
      </p>

      <div class="toc-grid">
        <div class="toc-item">
          <span class="toc-name">১. সদস্য রেজিস্ট্রি ও স্মার্ট প্রোফাইল (Resident Directory & Family Registry)</span>
          <span class="toc-line"></span>
          <span class="toc-page">Page 03</span>
        </div>
        <div class="toc-item">
          <span class="toc-name">২. আর্থিক হিসাবনিকাশ ও ফি আদায় (Automated Ledger & Payments)</span>
          <span class="toc-line"></span>
          <span class="toc-page">Page 04</span>
        </div>
        <div class="toc-item">
          <span class="toc-name">৩. ডিজিটাল নোটিশবোর্ড ও লাইভ অ্যালার্ট (Smart Bulletins & Alerts)</span>
          <span class="toc-line"></span>
          <span class="toc-page">Page 05</span>
        </div>
        <div class="toc-item">
          <span class="toc-name">৪. ভিজিটর ও গেস্ট ম্যানেজমেন্ট (Front-Gate Digital Logbook)</span>
          <span class="toc-line"></span>
          <span class="toc-page">Page 06</span>
        </div>
        <div class="toc-item">
          <span class="toc-name">৫. কমন স্পেস অভিযোগ ও সমাধান (Incident Desk & Care Portal)</span>
          <span class="toc-line"></span>
          <span class="toc-page">Page 07</span>
        </div>
        <div class="toc-item">
          <span class="toc-name">৬. সিকিউরিটি স্টাফ ও শিফট রেজিস্টার (Duty Guards Operations Hub)</span>
          <span class="toc-line"></span>
          <span class="toc-page">Page 08</span>
        </div>
        <div class="toc-item">
          <span class="toc-name">৭. প্রজেক্ট ডেভেলপমেন্ট ও নির্মাণ খরচ ট্র্যাকার (Blueprints Expense audit)</span>
          <span class="toc-line"></span>
          <span class="toc-page">Page 09</span>
        </div>
      </div>

      <div class="welcome-card">
        <h4>✦ আস্থার ডিজিটাল রূপরেখা (Core Objective)</h4>
        <p style="font-size: 13px; color:#475569; line-height: 1.6;">
          এটি কুমিল্লার খেতাসারে নির্মিত দ্বৈত টাওয়ার বিশিষ্ট প্রথম আধুনিক গিজার কমপ্লেক্সেরই একটি ডিজিটাল প্রতিরূপ (Digital Twin)। আবাসন রক্ষণাবেক্ষণের সনাতনী ফাইল খাতা, ভুল-ত্রুটির হিসাবের ঝুঁকি এবং যোগাযোগের গ্যাপ চিরতরে বিদায় দিতে আমাদের এই সম্মিলিত প্রচেষ্টা।
        </p>
      </div>

      <div style="border-top:1px solid #e2e8f0; margin-top:150px; font-size:11px; color:#64748b; text-align:center; padding-top:20px;">
        Astha Twin Towers Association • Generated at ${timestamp} UTC
      </div>
    </div>


    <!-- PAGE 3: FEATURE 1: MEMBERS -->
    <div class="page-break module-sheet">
      <div>
        <div class="section-header">
          <h2>০১. সদস্য রেজিস্ট্রি ও স্মার্ট প্রোফাইল</h2>
          <span class="page-num">Page 03</span>
        </div>

        <div class="module-title-bar">
          <div class="module-pin">01</div>
          <div>
            <span class="module-meta">Resident Self-Service Dashboard</span>
            <h3>Member Registry & Smart Profiles</h3>
          </div>
        </div>

        <div class="block-desc">
          <strong>বাংলা বিবরণ:</strong><br>
          আস্থা টুইন টাওয়ার্সের (ব্লক এ এবং বি) প্রতিটি ফ্ল্যাটের মালিক, ভাড়াটিয়া এবং পরিবারের সদস্যদের সেন্ট্রাল ডিরেক্টরি। এর মাধ্যমে সহজে বাসিন্দাদের যোগাযোগের তথ্য ও প্রোফাইল ছবি স্বয়ংক্রিয়ভাবে আপডেট করা যায়। এডমিনদের দ্বারা অনুমোদিত এই ডেটাবেইসটি বাইরের যেকোনো অনাকাঙ্ক্ষিত প্রবেশের ঝুঁকিকে শূন্যে নামিয়ে আনে।
          <br><br>
          <strong>English Overview:</strong><br>
          A fully centralized directory mapping every Flat Owner, Family Member, and Tenant across the Dual Towers (Blocks A & B). It enables self-service updates for contact information and modern profile configurations with strict admin verification to secure resident privacy.
        </div>

        <span class="subtitle-label">বাসিন্দাদের প্রত্যক্ষ উপকারিতাসমূহ (Resident Advantages)</span>
        <ul className="benefit-list" style="list-style-type: none;">
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">ফ্ল্যাট ভিত্তিক ডিজিটাল ডেটা থাকায় কমিটির জবাবদিহিতা ও শতভাগ স্বচ্ছতা তৈরি হয়।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">জরুরি মুহূর্তে প্রতিবেশী ফ্ল্যাটের সাথে তাৎক্ষণিক যোগাযোগ স্থাপন সম্ভব।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">এডমিন ভেরিফিকেশন সিস্টেম দ্বারা সম্পূর্ণ ফাইল ও ব্যক্তিগত তথ্যের নিরাপত্তা শতভাগ বজায় থাকে।</li>
        </ul>
      </div>

      <div class="value-card">
        <span class="label">মূল ভিত্তি (Core Value Statement)</span>
        <p>"সকল অধিবাসীদের মধ্যে ঐক্যবদ্ধ, নিরাপদ এবং আধুনিক ডিজিটাল মেলবন্ধন তৈরি করে।"</p>
      </div>
    </div>


    <!-- PAGE 4: FEATURE 2: FINANCE -->
    <div class="page-break module-sheet">
      <div>
        <div class="section-header">
          <h2>০২. আর্থিক হিসাবনিকাশ ও ফি আদায়</h2>
          <span class="page-num">Page 04</span>
        </div>

        <div class="module-title-bar">
          <div class="module-pin">02</div>
          <div>
            <span class="module-meta">Anti-Fraud Ledger Engine</span>
            <h3>Ledgers & Automated Billing</h3>
          </div>
        </div>

        <div class="block-desc">
          <strong>বাংলা বিবরণ:</strong><br>
          সনাতন কাগজের হিসাব খাতা বাতিল করে এটি স্বয়ংক্রিয়ভাবে প্রতি মাসের মেইনটেন্যান্স ফি, ইউটিলিটি চার্জ এবং প্রজেক্টের জরুরি ফান্ড হিসাব করে। অধিবাসীরা নিজেদের বকেয়া দেখে মুহূর্তেই রশিদ সংগ্রহ করতে পারেন। এটি সোসাইটির ক্যাশবুকে সম্পূর্ণ স্বচ্ছতা বজায় রাখে।
          <br><br>
          <strong>English Overview:</strong><br>
          Eliminates manual paper-based accounts. It automatically generates monthly maintenance dues, community utility fees, and special project funds. Tracks real-time payments and allows downloading of instant digital receipts.
        </div>

        <span class="subtitle-label">বাসিন্দাদের প্রত্যক্ষ উপকারিতাসমূহ (Resident Advantages)</span>
        <ul className="benefit-list" style="list-style-type: none;">
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">বাসিন্দাগণ তাদের মোট বকেয়া, অগ্রিম এবং পূর্ববর্তী হিসাবের স্পষ্ট বিবরণ দেখতে পান।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">ডিজিটাল ক্যাশলেজার থাকার কারণে হিসাবের কোনো গড়মিল বা তছরুপ হবার সুযোগ থাকে না।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">ফি পরিশোধের সাথে সাথেই মোবাইল ও ইমেইলে কনফার্মেশন ও ডিজিটাল রসিদ ডাউনলোডের সুবিধা।</li>
        </ul>
      </div>

      <div class="value-card">
        <span class="label">মূল ভিত্তি (Core Value Statement)</span>
        <p>"সোসাইটির ফান্ড ব্যবস্থাপনায় শতভাগ সততা ও স্বচ্ছতা নিশ্চিত করে।"</p>
      </div>
    </div>


    <!-- PAGE 5: FEATURE 3: NOTICES -->
    <div class="page-break module-sheet">
      <div>
        <div class="section-header">
          <h2>০৩. ডিজিটাল নোটিশবোর্ড ও লাইভ অ্যালার্ট</h2>
          <span class="page-num">Page 05</span>
        </div>

        <div class="module-title-bar">
          <div class="module-pin">03</div>
          <div>
            <span class="module-meta">Instant Announcement Feed</span>
            <h3>Smart Notice Board & Alerts</h3>
          </div>
        </div>

        <div class="block-desc">
          <strong>বাংলা বিবরণ:</strong><br>
          একটি রিয়েল-টাইম নোটিশ পোর্টাল যার সাহায্যে কমিটির গুরুত্বপূর্ণ নোটিশ সবার কাছে দ্রুত পৌঁছায়। জরুরি ঘোষণাগুলো ভিন্ন রঙে বিশেষভাবে চিহ্নিত থাকে এবং আমাদের ওয়েবসাইটে সবসময় জ্বলজ্বল করে যেন প্রতিটি বাসিন্দা আবাসন কমপ্লেক্সের খবর ও মিটিং এর বিষয়ে সজাগ থাকেন।
          <br><br>
          <strong>English Overview:</strong><br>
          A real-time bulletin center ensuring no important decision goes unseen. Key announcements are highlighted with color-coded tags and scrolling ticker bars on the login screen for instant attention across both towers.
        </div>

        <span class="subtitle-label">বাসিন্দাদের প্রত্যক্ষ উপকারিতাসমূহ (Resident Advantages)</span>
        <ul className="benefit-list" style="list-style-type: none;">
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">সাধারণ নোটিশ ও জরুরি সতর্কবার্তার মধ্যে পার্থক্য সহজে বুঝে নেওয়া যায়।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">মৌখিক যোগাযোগের ভুল বোঝাবুঝি দূর করে এবং অতীতের সব নোটিশ আর্কাইভে সংরক্ষিত থাকে।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">নোটিশের সাথে প্রাসঙ্গিক ছবি বা ফাইল যুক্ত থাকায় সহজে নির্দেশাবলী বুঝা যায়।</li>
        </ul>
      </div>

      <div class="value-card">
        <span class="label">মূল ভিত্তি (Core Value Statement)</span>
        <p>"টাওয়ারের যেকোনো জরুরি সিদ্ধান্ত ও খবরাখবর তাৎক্ষণিকভাবে সবার কাছে পৌঁছে দেয়।"</p>
      </div>
    </div>


    <!-- PAGE 6: FEATURE 4: VISITORS -->
    <div class="page-break module-sheet">
      <div>
        <div class="section-header">
          <h2>০৪. ভিজিটর ও গেস্ট ম্যানেজমেন্ট</h2>
          <span class="page-num">Page 06</span>
        </div>

        <div class="module-title-bar">
          <div class="module-pin">04</div>
          <div>
            <span class="module-meta">Fortified Entrance Protocol</span>
            <h3>Visitor & Gate Pass Register</h3>
          </div>
        </div>

        <div class="block-desc">
          <strong>বাংলা বিবরণ:</strong><br>
          দারোয়ান বা গেটরক্ষকদের সনাতন খাতা পরিবর্তন করে ডিজিটালভাবে সকল অতিথি, ডেলিভারি কর্মী এবং গৃহকর্মীদের নাম, ফোন নম্বর, ফ্ল্যাট নম্বর, গাড়ির নম্বর ও প্রবেশের সময় নথিভুক্ত করার আধুনিক ব্যবস্থা। এটি সিকিউরিটি প্রটোকলকে আরো মজবুত করে।
          <br><br>
          <strong>English Overview:</strong><br>
          Digitizes building front-desk entrance diaries. Security staff logs visitor names, phone numbers, visiting flats, car numbers, entry reasons, and precise check-in/out timestamps to eliminate loopholes.
        </div>

        <span class="subtitle-label">বাসিন্দাদের প্রত্যক্ষ উপকারিতাসমূহ (Resident Advantages)</span>
        <ul className="benefit-list" style="list-style-type: none;">
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">কে কখন প্রবেশ করলো তা সহজে সার্চ ও মনিটর করার সুরক্ষিত ডেডিকেটেড লাইভ ড্যাশবোর্ড।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">ডেলিভারি ম্যান, টেকনিশিয়ান বা ক্যাজুয়াল শ্রমিকদের ব্লক-ভিত্তিক ট্র্যাকিং ব্যবস্থা।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">সন্দেহভাজন প্রবেশকারীদের চিহ্নিত করা সহজ হয় এবং ভবনের সামগ্রিক নিরাপত্তা বহুগুণ বৃদ্ধি পায়।</li>
        </ul>
      </div>

      <div class="value-card">
        <span class="label">মূল ভিত্তি (Core Value Statement)</span>
        <p>"টাওয়ারকে সিসিটিভি ক্যামেরার পাশাপাশি ডিজিটাল সিকিউরিটি চাদরে ও দুর্গে আবৃত করে।"</p>
      </div>
    </div>


    <!-- PAGE 7: FEATURE 5: COMPLAINTS -->
    <div class="page-break module-sheet">
      <div>
        <div class="section-header">
          <h2>০৫. মেরামত ও তাৎক্ষণিক অভিযোগ বক্স</h2>
          <span class="page-num">Page 07</span>
        </div>

        <div class="module-title-bar">
          <div class="module-pin">05</div>
          <div>
            <span class="module-meta">Resident Care Helpdesk</span>
            <h3>Incident Box & Service Portal</h3>
          </div>
        </div>

        <div class="block-desc">
          <strong>বাংলা বিবরণ:</strong><br>
          বাসিন্দাদের জন্য কমন স্পেসের সমস্যা (যেমন- লিফটের ক্রটি, পানির লাইনের লিকেজ, জেনারেটরের ত্রুটি বা পরিচ্ছন্নতার অভাব) সরাসরি ছবি ও বিবরণ সহ কমিটির কাছে ডিজিটাল অভিযোগ বক্সে সাবমিট করার সুবিধা। এতে দ্রুত মেরামত প্রক্রিয়া শুরু হয়।
          <br><br>
          <strong>English Overview:</strong><br>
          Allows residents to report physical maintenance issues (e.g., elevator glitches, pipe leaks, cleaning needs) directly with photos and priority status tags to keep committee members alert.
        </div>

        <span class="subtitle-label">বাসিন্দাদের প্রত্যক্ষ উপকারিতাসমূহ (Resident Advantages)</span>
        <ul className="benefit-list" style="list-style-type: none;">
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">কমিটি অভিযোগটি কদ্দূর সমাধান করলো তা লাইভ ট্র্যাক করার আধুনিক ড্যাশবোর্ড।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">সব ধরণের অভিযোগ লিখিত রেকর্ডে থাকায় তা এড়িয়ে যাওয়ার সুযোগ থাকে না।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">দ্রুত ও গুণগত মানসম্পন্ন মেরামতের নিশ্চয়তা নিশ্চিত করা ও সোসাইটির মান উন্নত করা।</li>
        </ul>
      </div>

      <div class="value-card">
        <span class="label">মূল ভিত্তি (Core Value Statement)</span>
        <p>"বাসিন্দাদের জীবনযাত্রার মান উন্নত করতে দ্রুত সেবা ও বিজ্ঞানসম্মত সমাধান নিশ্চিত করে।"</p>
      </div>
    </div>


    <!-- PAGE 8: FEATURE 6: STAFF -->
    <div class="page-break module-sheet">
      <div>
        <div class="section-header">
          <h2>০৬. নিরাপত্তা কর্মী ও শিফট রেজিস্টার</h2>
          <span class="page-num">Page 08</span>
        </div>

        <div class="module-title-bar">
          <div class="module-pin">06</div>
          <div>
            <span class="module-meta">Workforce Attendance Hub</span>
            <h3>Security & Shift Register</h3>
          </div>
        </div>

        <div class="block-desc">
          <strong>বাংলা বিবরণ:</strong><br>
          ভবনের সার্বক্ষণিক নিরাপত্তা প্রহরী, সুইপার এবং সুইমিংপুল-ফিটনেস ইনস্ট্রাক্টরদের বায়োডাটা, বেতন এবং প্রতিদিনের ডাবল-শিফট হাজিরা খাতা (চেক-ইন ও আউট সময় সহ) ট্র্যাক করার মডিউল। যা অরাজকতা বা দায়িত্বহীনতা রোধ করে।
          <br><br>
          <strong>English Overview:</strong><br>
          Maintains comprehensive records for security personnel, cleaning squads, and technical staff. Logs salary details and manages daily shifts with check-in/out timestamps.
        </div>

        <span class="subtitle-label">বাসিন্দাদের प्रत्यक्ष উপকারিতাসমূহ (Resident Advantages)</span>
        <ul className="benefit-list" style="list-style-type: none;">
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">কর্মীদের ডিউটি শিফটে অনুপস্থিতির কোনো সুযোগ থাকে না, ফলে গার্ড পাহারা নিশ্ছিদ্র থাকে।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">হাজিরা অনুযায়ী মাসের শেষ দিনে সঠিক বেতন প্রদান প্রক্রিয়া সুচারুভাবে মেইনটেইন করা।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">যেকোনো জরুরি ম্যালফাংশন পরিস্থিতিতে তাৎক্ষণিকভাবে অন-ডিউটি কর্মীদের ডাকার সুবিধা।</li>
        </ul>
      </div>

      <div class="value-card">
        <span class="label">মূল ভিত্তি (Core Value Statement)</span>
        <p>"সোসাইটির সেবকদের পরিচালনা শৃঙ্খলা ও কর্তব্যপরায়ণতার শীর্ষে নিয়ে যায়।"</p>
      </div>
    </div>


    <!-- PAGE 9: FEATURE 7: CONSTRUCTION -->
    <div class="page-break module-sheet" style="page-break-after: avoid;">
      <div>
        <div class="section-header">
          <h2>০৭. প্রজেক্ট ডেভেলপমেন্ট ও নির্মাণ খরচ ট্র্যাকার</h2>
          <span class="page-num">Page 09</span>
        </div>

        <div class="module-title-bar">
          <div class="module-pin">07</div>
          <div>
            <span class="module-meta">Project Cost & Timeline Audit</span>
            <h3>Digital Growth & Expense Audit</h3>
          </div>
        </div>

        <div class="block-desc">
          <strong>বাংলা বিবরণ:</strong><br>
          ভবন নির্মাণাধীন বা ডেভলপমেন্ট ধাপে থাকলে এই ডিজিটাল ক্যাটাগরির মাধ্যমে প্রজেক্টের লাইভ অগ্রগতি, ব্যয়কৃত খরচের লেজার এবং সদস্যদের প্রদত্ত জমা টাকার পরিমাণ স্বচ্ছভাবে ট্র্যাক করা সম্ভব। এটি প্রজেক্টের মূল চালিকাশক্তিকে বেগবান করে।
          <br><br>
          <strong>English Overview:</strong><br>
          Tracks the construction and developmental progress of the Twin Towers in real-time. Logs building phases, materials expenditure, and logs of deposits contributed by owner members.
        </div>

        <span class="subtitle-label">বাসিন্দাদের প্রত্যক্ষ উপকারিতাসমূহ (Resident Advantages)</span>
        <ul className="benefit-list" style="list-style-type: none;">
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">প্রজেক্টের কাজের প্রকৃত অগ্রগতি ছবির মাধ্যমে ঘরে বসেই দেখার পরম সুযোগ।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">আইটেম অনুযায়ী রড, সিমেন্ট ও নির্মাণ ব্যয়ের স্পষ্ট ও আইনি ডিজিটাল রূপরেখা।</li>
          <li style="position: relative; padding-left: 30px; margin-bottom: 12px; font-size:13px; color:#1e293b;">ভুল ধারণার অবসান ঘটিয়ে প্রজেক্টের দ্রুত বাস্তবায়ন ও সঠিক সময়ে ফ্ল্যাটের চাবি হস্তান্তর।</li>
        </ul>
      </div>

      <div class="value-card">
        <span class="label">মূল ভিত্তি (Core Value Statement)</span>
        <p>"প্রজেক্টের নির্মাণ শুরু থেকে ফ্ল্যাট হস্তান্তর পর্যন্ত আর্থিক ও নির্মাণ কাজের পরম স্বচ্ছতা এনে দেয়।"</p>
      </div>
    </div>

  </div>

  <div style="font-family: monospace; font-size: 11px; color:#64748b; margin-top:20px; text-align:center; padding-bottom: 40px;">
    © 2026 Astha Twin Towers Association • Khetasar, Cumilla • Verified Secure Document
  </div>

  <!-- Auto Initiates Print Dialogue On Load -->
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 1000);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = language === 'bn' 
      ? 'আস্থা_টুইন_টাওয়ার্স_প্রফেশনাল_ব্রোশিয়ার.html' 
      : 'Astha_Twin_Towers_Professional_Brochure.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  const [activeTab, setActiveTab] = useState<'3d' | 'construction' | 'messages' | 'notices' | 'about'>('3d');
  const [activeBrochureIndex, setActiveBrochureIndex] = useState(0);
  const [showBrochureToast, setShowBrochureToast] = useState(false);

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

              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all uppercase flex items-center gap-1.5 ${
                  activeTab === 'about' 
                    ? 'bg-emerald-950 border border-emerald-500/50 text-[#D4AF37] shadow-lg shadow-emerald-950/50' 
                    : 'text-slate-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>{language === 'bn' ? 'আমাদের সুবিধা (About)' : 'App Brochure'}</span>
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

              {/* TAB 5: DYNAMIC APP BROCHURE & FEATURES INDEX */}
              {activeTab === 'about' && (() => {
                const brochureFeatures = [
                  {
                    id: 'members',
                    titleEn: 'Member Registry & Smart Profiles',
                    titleBn: 'সদস্য রেজিস্ট্রি ও স্মার্ট প্রোফাইল',
                    icon: Users,
                    color: 'text-teal-400 border-teal-900/50 bg-teal-950/20',
                    badgeEn: 'Resident Gateway',
                    badgeBn: 'বাসিন্দা নিবন্ধন',
                    descEn: 'A fully centralized directory mapping every Flat Owner, Family Member, and Tenant across the Dual Towers (Blocks A & B). It enables self-service updates for contact information and modern profile configurations.',
                    descBn: 'আস্থা টুইন টাওয়ার্সের (ব্লক এ এবং বি) প্রতিটি ফ্ল্যাটের মালিক, ভাড়াটিয়া এবং পরিবারের সদস্যদের সেন্ট্রাল ডিরেক্টরি। এর মাধ্যমে সহজে নিজেদের যোগাযোগের তথ্য ও প্রোফাইল ছবি স্বয়ংক্রিয়ভাবে আপডেট করা যায়।',
                    benefitsEn: [
                      'Instant transparency with block-wise digital flat registers.',
                      'Immediate cross-communication with neighboring units in emergencies.',
                      'Secure authorization strictly guarded by admin approval protocols.'
                    ],
                    benefitsBn: [
                      'ফ্ল্যাট ভিত্তিক ডিজিটাল ডেটা থাকায় কমিটির জবাবদিহিতা ও শতভাগ স্বচ্ছতা তৈরি হয়।',
                      'জরুরি মুহূর্তে প্রতিবেশী ফ্ল্যাটের সাথে তাৎক্ষণিক যোগাযোগ স্থাপন।',
                      'এডমিন ভেরিফিকেশন সিস্টেম দ্বারা সম্পূর্ণ ফাইল ও ব্যক্তিগত তথ্যের নিরাপত্তা।'
                    ],
                    valueEn: 'Fosters a closely-knit, trusted, and digital-first neighborly community.',
                    valueBn: 'সকল অধিবাসীদের মধ্যে ঐক্যবদ্ধ, নিরাপদ এবং আধুনিক ডিজিটাল মেলবন্ধন তৈরি করে।'
                  },
                  {
                    id: 'finance',
                    titleEn: 'Ledgers & Automated Billing',
                    titleBn: 'আর্থিক হিসাবনিকাশ ও ফি আদায়',
                    icon: CreditCard,
                    color: 'text-amber-400 border-amber-900/50 bg-amber-950/20',
                    badgeEn: 'Automated Accounting',
                    badgeBn: 'স্বয়ংক্রিয় হিসাব',
                    descEn: 'Eliminates paper-based accounts. It automatically generates monthly maintenance dues, community utility fees, and special project funds. Tracks real-time payments and allows downloading of instant digital receipts.',
                    descBn: 'সনাতন কাগজের হিসাব খাতা বাতিল করে এটি স্বয়ংক্রিয়ভাবে প্রতি মাসের মেইনটেন্যান্স ফি, ইউটিলিটি চার্জ এবং প্রজেক্টের জরুরি ফান্ড হিসাব করে। অধিবাসীরা নিজেদের বকেয়া দেখে মুহূর্তেই রশিদ সংগ্রহ করতে পারেন।',
                    benefitsEn: [
                      'Provides real-time personal balance statements and transaction histories.',
                      'Secure digital ledgers leave zero room for accounting errors or transparency disputes.',
                      'Instant print-friendly or downloadable receipts for every paid quota.'
                    ],
                    benefitsBn: [
                      'বাসিন্দাগণ তাদের মোট বকেয়া, অগ্রিম এবং পূর্ববর্তী হিসাবের স্পষ্ট বিবরণ দেখতে পান।',
                      'ডিজিটাল ক্যাশলেজার থাকার কারণে হিসাবের কোনো গড়মিল বা তছরুপ হবার সুযোগ থাকে না।',
                      'ফি পরিশোধের সাথে সাথেই মোবাইলে কনফার্মেশন ও ডিজিটাল রসিদ ডাউনলোডের সুবিধা।'
                    ],
                    valueEn: 'Ensures absolute financial integrity and zero administrative delay.',
                    valueBn: 'সোসাইটির ফান্ড ব্যবস্থাপনায় শতভাগ সততা ও স্বচ্ছতা নিশ্চিত করে।'
                  },
                  {
                    id: 'notices',
                    titleEn: 'Smart Notice Board & Alerts',
                    titleBn: 'ডিজিটাল নোটিশবোর্ড ও লাইভ অ্যালার্ট',
                    icon: Megaphone,
                    color: 'text-rose-400 border-rose-900/50 bg-rose-950/20',
                    badgeEn: 'Live Broadcast',
                    badgeBn: 'তাৎক্ষণিক বার্তা',
                    descEn: 'A real-time bulletin center ensuring no important decision goes unseen. Key announcements are highlighted with color-coded tags and scrolling ticker bars on the login screen for instant attention.',
                    descBn: 'একটি রিয়েল-টাইম নোটিশ পোর্টাল যার সাহায্যে কমিটির গুরুত্বপূর্ণ নোটিশ সবার কাছে দ্রুত পৌঁছায়। জরুরি ঘোষণাগুলো ভিন্ন রঙে বিশেষভাবে চিহ্নিত থাকে এবং ওয়েবসাইটের ওপরে স্ক্রল আকারে সচল থাকে।',
                    benefitsEn: [
                      'Color category labels differentiate general alerts from high-priority developer memos.',
                      'Prevents verbal communication gaps and keeps all historical notices archived.',
                      'Responsive layout supports uploading dynamic diagrams and explanatory documents.'
                    ],
                    benefitsBn: [
                      'সাধারণ নোটিশ ও জরুরি সতর্কবার্তার মধ্যে পার্থক্য সহজে বুঝা যায়।',
                      'মৌখিক যোগাযোগের ভুল বোঝাবুঝি দূর করে এবং অতীতের সকল নোটিশ সংরক্ষিত থাকে।',
                      'নোটিশের সাথে প্রাসঙ্গিক ছবি বা নির্দেশাবলী যুক্ত করার আধুনিক সুবিধা।'
                    ],
                    valueEn: 'Drives maximum collaboration and awareness across Astha Twin Towers.',
                    valueBn: 'টাওয়ারের যেকোনো জরুরি সিদ্ধান্ত ও খবরাখবর তাৎক্ষণিকভাবে সবার কাছে পৌঁছে দেয়।'
                  },
                  {
                    id: 'visitors',
                    titleEn: 'Visitor & Gate Pass Register',
                    titleBn: 'ভিজিটর ও গেস্ট ম্যানেজমেন্ট',
                    icon: Shield,
                    color: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/20',
                    badgeEn: 'Fortified Security',
                    badgeBn: 'স্মার্ট গেট প্রটোকল',
                    descEn: 'Digitizes building front-desk entrance diaries. Security staff logs visitor names, phone numbers, visiting flats, car numbers, entry reasons, and precise check-in/out timestamps.',
                    descBn: 'দারোয়ান বা গেটরক্ষকদের সনাতন খাতা পরিবর্তন করে ডিজিটালভাবে সকল অতিথি, ডেলিভারি কর্মী এবং গৃহকর্মীদের নাম, ফোন নম্বর, ফ্ল্যাট নম্বর, গাড়ির নম্বর ও প্রবেশের সময় নথিভুক্ত করার আধুনিক ব্যবস্থা।',
                    benefitsEn: [
                      'A fully searchable log database to audit building foot traffic.',
                      'Identifies delivery personnel, technicians, and temporary laborers block-wise.',
                      'Provides residents peace of mind with documented guest records.'
                    ],
                    benefitsBn: [
                      'কে কখন প্রবেশ করলো তা সহজে সার্চ ও মনিটর করার সুরক্ষিত ডেডিকেটেড ড্যাশবোর্ড।',
                      'ডেলিভারি ম্যান, টেকনিশিয়ান বা ক্যাজুয়াল শ্রমিকদের ব্লক-ভিত্তিক ট্র্যাকিং ব্যবস্থা।',
                      'সন্দোহভাজন প্রবেশকারীদের চিহ্নিত করা সহজ হয় এবং ভবনের সামগ্রিক নিরাপত্তা বাড়ে।'
                    ],
                    valueEn: 'Transforms the Twin Towers into a secure, gated digital fortress.',
                    valueBn: 'টাওয়ারকে সিসিটিভি ক্যামেরার পাশাপাশি ডিজিটাল সিকিউরিটি চাদরে আবৃত করে।'
                  },
                  {
                    id: 'complaints',
                    titleEn: 'Incident Box & Service Portal',
                    titleBn: 'মেরামত ও তাৎক্ষণিক অভিযোগ বক্স',
                    icon: AlertCircle,
                    color: 'text-indigo-400 border-indigo-900/50 bg-indigo-950/20',
                    badgeEn: 'Resident Care',
                    badgeBn: 'কমিউনিটি সেবা',
                    descEn: 'Allows residents to report physical maintenance issues (e.g., elevator glitches, pipe leaks, dynamic cleaning requirements) with photo uploads and direct priority levels.',
                    descBn: 'বাসিন্দাদের জন্য কমন স্পেসের সমস্যা (যেমন- লিফটের ক্রটি, পানির লাইনের লিকেজ, বা ময়লার সমস্যা) সরাসরি ছবি ও বিবরণ সহ কমিটির কাছে ডিজিটাল অভিযোগ বক্সে সাবমিট করার সুবিধা।',
                    benefitsEn: [
                      'Transparent ticket statuses from "Pending Review" to "In Progress" and "Resolved".',
                      'Eliminates verbal forgetfulness or lost complaint slips.',
                      'Holds the building maintenance team accountable with timestamps.'
                    ],
                    benefitsBn: [
                      'কমিটি অভিযোগটি কদ্দূর সমাধান করলো তা লাইভ ট্র্যাক করার অটোমেটেড ড্যাশবোর্ড।',
                      'সব ধরণের অভিযোগ লিখিত রেকর্ডে থাকায় তা এড়িয়ে যাওয়ার কোনো সুযোগ থাকে না।',
                      'দ্রুত ও গুণগত মানসম্পন্ন মেরামতের নিশ্চয়তা নিশ্চিত করা যায়।'
                    ],
                    valueEn: 'Guarantees that your complaints are heard, acted upon, and resolved fast.',
                    valueBn: 'বাসিন্দাদের জীবনযাত্রার মান উন্নত করতে দ্রুত সেবা ও সমাধান নিশ্চিত করে।'
                  },
                  {
                    id: 'staff',
                    titleEn: 'Security & Shift Register',
                    titleBn: 'নিরাপত্তা কর্মী ও শিফট রেজিস্টার',
                    icon: UserCheck,
                    color: 'text-sky-400 border-sky-900/50 bg-sky-950/20',
                    badgeEn: 'Workforce Hub',
                    badgeBn: 'কর্মী তদারকি',
                    descEn: 'Maintains comprehensive records for security personnel, cleaning squads, and technical staff. Logs salary details and manages robust, daily attendance logs with check-in/out timestamps.',
                    descBn: 'ভবনের সার্বক্ষণিক নিরাপত্তা প্রহরী, সুইপার এবং সুইমিংপুল-ফিটনেস ইনস্ট্রাক্টরদের বায়োডাটা, বেতন এবং প্রতিদিনের ডাবল-শিফট হাজিরা খাতা (চেক-ইন ও আউট সময় সহ) ট্র্যাক করার মডিউল।',
                    benefitsEn: [
                      'Ensures constant perimeter security coverage with verified shift logs.',
                      'Transparent salary disbursement ledgers correlated to active attendance days.',
                      'Quick lookups during emergency staff re-allocations.'
                    ],
                    benefitsBn: [
                      'কর্মীদের ডিউটি শিফট শতভাগ ট্র্যাকিং থাকায় ঢিলেমি বা অনুপস্থিতির সুযোগ থাকে না।',
                      'হাজিরা অনুযায়ী মাসের শেষ দিনে সঠিক বেতন প্রদান প্রক্রিয়া মেইনটেইন করা।',
                      'যেকোনো জরুরি পরিস্থিতিতে দ্রুত সিকিউরিটি স্পেশালিস্টদের খুঁজে বের করা।'
                    ],
                    valueEn: 'Maintains elite operational discipline and top-tier hospitality standards.',
                    valueBn: 'সোসাইটির সেবকদের পরিচালনা শৃঙ্খলা ও কর্তব্যপরায়ণতার শীর্ষে নিয়ে যায়।'
                  },
                  {
                    id: 'construction',
                    titleEn: 'Digital Twin & Expense Audit',
                    titleBn: 'প্রজেক্ট ডেভলপমেন্ট ও নির্মাণ ট্র্যাকার',
                    icon: Sparkles,
                    color: 'text-violet-400 border-violet-900/50 bg-violet-950/20',
                    badgeEn: 'Project Transparency',
                    badgeBn: 'নির্মাণ উন্নয়ন',
                    descEn: 'Tracks the construction progress of the twin towers in real-time. Logs building phases, budget allocations, expenditure ledger, and records of deposits contributed by owner members.',
                    descBn: 'ভবন নির্মাণাধীন বা ডেভলপমেন্ট ধাপে থাকলে এই ডিজিটাল ক্যাটাগরির মাধ্যমে প্রজেক্টের লাইভ অগ্রগতি, ব্যয়কৃত খরচের লেজার এবং সদস্যদের প্রদত্ত জমা টাকার পরিমাণ স্বচ্ছভাবে ট্র্যাক করা সম্ভব।',
                    benefitsEn: [
                      'Shows overall progress percentages alongside real progress photos.',
                      'Itemized materials expense ledger ensures maximum budgetary transparency.',
                      'Maintains absolute trust between developers, committee members, and future buyers.'
                    ],
                    benefitsBn: [
                      'প্রজেক্টের কাজের প্রকৃত অগ্রগতি ছবির মাধ্যমে ঘরে বসেই দেখার সুযোগ।',
                      'আইটেম অনুযায়ী রড, সিমেন্ট ও নির্মাণ ব্যয়ের স্পষ্ট ডিজিটাল হিসাব।',
                      'ভুল ধারণার অবসান ঘটিয়ে প্রজেক্টের দ্রুত বাস্তবায়ন ও সঠিক সময় চাবি হস্তান্তর।'
                    ],
                    valueEn: 'Bridges physical blueprints to absolute clarity of fund utilization.',
                    valueBn: 'প্রজেক্টের নির্মাণ শুরু থেকে ফ্ল্যাট হস্তান্তর পর্যন্ত আর্থিক ও নির্মাণ কাজের পরম স্বচ্ছতা।'
                  }
                ];

                const currentFeature = brochureFeatures[activeBrochureIndex] || brochureFeatures[0];
                const IconComponent = currentFeature.icon;

                return (
                  <div className="space-y-6 animate-fade-in text-xs">
                    {/* Dynamic Success Toast for offline brochure formulation */}
                    {showBrochureToast && (
                      <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-[#D4AF37] relative overflow-hidden flex items-start gap-3 animate-fade-in shadow-lg">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0 animate-pulse">
                          <Award className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs font-sans text-white">
                            {language === 'bn' ? '🎉 ব্রোশিয়ার জেনারেশন সফল!' : '🎉 Brochure Formulated Successfully!'}
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-normal font-sans">
                            {language === 'bn' 
                              ? 'আপনার আস্থা টুইন টাওয়ার্সের স্মার্ট বুকলেট ফাইলটি ডাউনলোড হয়েছে। পিডিএফ আকারে সংরক্ষণের জন্য ফাইলটি ওপেন করে সরাসরি প্রিন্ট করুন।'
                              : 'The custom dual-tower booklet HTML file is downloaded. Double-click the file to open and instantly print to premium PDF format.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Header Banner inside Tab */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 to-neutral-900 border border-emerald-900/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#D4AF37] flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          {language === 'bn' ? 'আস্থা টুইন টাওয়ার সোসাইটি পরিচালনা পরিষদ' : 'Astha Twin Towers Management Committee'}
                        </span>
                        <h3 className="text-sm font-black text-white font-sans">
                          {language === 'bn' ? 'ফিচার নির্দেশিকা ও প্রফেশনাল ডিজিটাল বুশিয়ার' : 'Smart App Feature Index & Resident Guide'}
                        </h3>
                        <p className="text-[11px] text-slate-300 leading-normal max-w-xl font-sans">
                          {language === 'bn' 
                            ? 'আমাদের আবাসন কমপ্লেক্সের সামগ্রিক নিরাপত্তা, হিসাবের স্বচ্ছতা, পারস্পরিক ভ্রাতৃত্ব ও টেকসই অটোমেশন নিশ্চিত করতে তৈরি এই পোর্টালের প্রধান মডিউল ও অধিবাসীদের জন্য প্রত্যক্ষ উপকারিতাসমূহ নিচে উপস্থাপন করা হলো।'
                            : 'Explore how our integrated management portal establishes airtight building security, complete fiscal transparency, and flawless maintenance dispatching.'}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-emerald-850 text-center font-mono">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase">{language === 'bn' ? 'মোট অনুচ্ছেদ' : 'INDEX SECTIONS'}</span>
                          <span className="text-xs font-black text-[#D4AF37]">{brochureFeatures.length} Modules</span>
                        </div>
                      </div>
                    </div>

                    {/* Double-Split Interactive Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      
                      {/* Left: Interactive Tab Index Menu */}
                      <div className="md:col-span-12 lg:col-span-5 space-y-2">
                        <div className="text-[10px] uppercase font-mono font-bold text-[#D4AF37] pb-1.5 border-b border-emerald-950/40 flex items-center justify-between">
                          <span>{language === 'bn' ? 'ফিচার ইনডেক্স (সূচিপত্র)' : 'BROCHURE TABLE OF CONTENTS'}</span>
                          <span className="text-[9px] text-slate-500 font-normal">{language === 'bn' ? 'ক্লিক করে জানুন' : 'Click to read details'}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                          {brochureFeatures.map((feat, index) => {
                            const FeatIcon = feat.icon;
                            const isActive = activeBrochureIndex === index;
                            return (
                              <button
                                key={feat.id}
                                type="button"
                                onClick={() => setActiveBrochureIndex(index)}
                                className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer select-none group ${
                                  isActive
                                    ? 'bg-emerald-950/55 border-[#D4AF37]/80 text-white shadow-md shadow-emerald-950/50'
                                    : 'bg-neutral-900/40 border-emerald-950/40 text-slate-400 hover:text-white hover:border-emerald-900/60 hover:bg-neutral-900/80'
                                }`}
                              >
                                <div className={`p-2 rounded-lg border shrink-0 transition-transform ${
                                  isActive ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37] scale-105' : 'bg-neutral-950 border-emerald-950 text-slate-400 group-hover:scale-105'
                                }`}>
                                  <FeatIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider">0{index + 1} / {language === 'bn' ? feat.badgeBn : feat.badgeEn}</span>
                                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                                  </div>
                                  <p className="font-bold text-xs font-sans truncate tracking-tight">{language === 'bn' ? feat.titleBn : feat.titleEn}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Dynamic High-Contrast Editorial Content Page */}
                      <div className="md:col-span-12 lg:col-span-7 rounded-xl border border-emerald-900/30 bg-neutral-900/15 p-5 space-y-4 shadow-inner min-h-[360px] flex flex-col justify-between">
                        <div className="space-y-4">
                          {/* Feature Main Title Details */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2.5 rounded-xl border ${currentFeature.color}`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="inline-block text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 uppercase tracking-widest mb-0.5 animate-pulse">
                                  {language === 'bn' ? currentFeature.badgeBn : currentFeature.badgeEn}
                                </span>
                                <h4 className="text-sm font-black text-white font-sans tracking-tight">
                                  {language === 'bn' ? currentFeature.titleBn : currentFeature.titleEn}
                                </h4>
                              </div>
                            </div>
                          </div>

                          {/* App Scope Description */}
                          <div className="space-y-2">
                            <p className="text-xs font-mono text-[#D4AF37] font-bold uppercase tracking-wider select-none">
                              {language === 'bn' ? '✦ মডিউলের বিবরণ ও লক্ষ্য' : '✦ Module Overview & Purpose'}
                            </p>
                            <p className="text-slate-300 leading-relaxed font-sans font-medium text-[11px] sm:text-xs">
                              {language === 'bn' ? currentFeature.descBn : currentFeature.descEn}
                            </p>
                          </div>

                          {/* Key Core Member Benefits */}
                          <div className="space-y-2 pt-2 bg-gradient-to-b from-neutral-950/20 to-transparent p-3 rounded-lg border border-emerald-950/25">
                            <p className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider select-none flex items-center gap-1.5">
                              <Award className="h-4 w-4 text-[#D4AF37]" />
                              <span>{language === 'bn' ? 'বাসিন্দাদের প্রত্যক্ষ উপকারিতাসমূহ' : 'Core Resident Benefits'}</span>
                            </p>
                            <ul className="space-y-1.5 pl-0.5">
                              {(language === 'bn' ? currentFeature.benefitsBn : currentFeature.benefitsEn).map((benefit, bIndex) => (
                                <li key={bIndex} className="text-slate-300 flex items-start gap-2 font-sans font-medium text-[11px] leading-relaxed">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Value Proposition Statement */}
                          <div className="border-l-2 border-[#D4AF37] bg-[#D4AF37]/5 px-3 py-2.5 rounded-r">
                            <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-none">{language === 'bn' ? 'অভিজাত আবাসনের স্মার্ট মানদণ্ড' : 'Smart Living Standard'}</span>
                            <p className="text-[11px] text-[#D4AF37] font-serif italic leading-relaxed font-bold">
                              "{language === 'bn' ? currentFeature.valueBn : currentFeature.valueEn}"
                            </p>
                          </div>
                        </div>

                        {/* Interactive Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-emerald-950/40 text-[10px] font-mono">
                          <span className="text-slate-500 font-bold">
                            Astha Twin Towers • 2026
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleDownloadBrochureHtml}
                              className="px-3 py-1.5 rounded bg-amber-950/20 text-[#D4AF37] hover:text-white border border-[#D4AF37]/50 hover:bg-[#D4AF37]/20 hover:border-amber-400 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                            >
                              <span>{language === 'bn' ? '🖨️ প্রিন্ট ও বুশিয়ার ডাউনলোড' : '🖨️ Print & Download Booklet'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById('login-panel-anchor')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-3 py-1.5 rounded bg-emerald-900 border border-emerald-600/50 text-white font-bold hover:bg-emerald-800 transition-all cursor-pointer shadow hover:shadow-emerald-900/30"
                            >
                              {language === 'bn' ? 'লগইন করুন ➔' : 'Access Form ➔'}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}
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
        <section id="login-panel-anchor" className="lg:col-span-5 xl:col-span-4 sticky top-24">
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
