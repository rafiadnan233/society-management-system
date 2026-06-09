/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { 
  Database, 
  Download, 
  RotateCcw, 
  UploadCloud, 
  AlertTriangle, 
  ShieldCheck, 
  Cloud, 
  RefreshCw, 
  LogOut, 
  Trash2, 
  CheckCircle2,
  FileCode,
  HardDrive
} from 'lucide-react';
import { 
  googleSignIn, 
  getAccessToken, 
  logoutGoogle, 
  uploadBackupToDrive, 
  listDriveBackups, 
  downloadBackupFromDrive, 
  deleteBackupFromDrive,
  DriveBackupFile,
  auth
} from '../utils/googleDrive';
import { onAuthStateChanged, User } from 'firebase/auth';
import { backupToFirestoreCloud, restoreFromFirestoreCloud } from '../utils/firebaseSync';
import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function BackupRestore() {
  const { 
    exportData, 
    importData, 
    resetToDefault, 
    language,
    config,
    flats,
    members,
    payments,
    expenses,
    notices,
    visitors,
    complaints,
    staff,
    activityLogs,
    currentUser
  } = useSociety();
  const t = translations[language];

  // Global Alerts (Local & General)
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Tab State
  const [activeSection, setActiveSection] = useState<'local' | 'google'>('local');

  // Google Drive State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState('');
  const [driveError, setDriveError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks id/type of active google operations

  // Last Cloud Backup timestamp state & dynamic calculations
  const [lastCloudBackup, setLastCloudBackup] = useState<number | null>(() => {
    const saved = localStorage.getItem('astha_last_cloud_backup_time');
    return saved ? Number(saved) : null;
  });
  const [showBackupAlert, setShowBackupAlert] = useState(() => {
    return localStorage.getItem('astha_dismiss_backup_alert') !== 'true';
  });

  const isBackupAlertOverdue = () => {
    if (!lastCloudBackup) return true;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - lastCloudBackup) > sevenDaysInMs;
  };

  const getDaysSinceLastBackup = () => {
    if (!lastCloudBackup) return null;
    const diffTime = Math.abs(Date.now() - lastCloudBackup);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Listen to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const activeToken = getAccessToken();
        if (activeToken) {
          setToken(activeToken);
          fetchDriveBackups(activeToken);
        }

        // Dynamically probe Firestore to see if backups already exist there!
        // This resolves the warning automatically if they have backed up.
        try {
          const docRef = doc(db, 'config', 'latest');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const savedTime = localStorage.getItem('astha_last_cloud_backup_time');
            if (!savedTime) {
              const now = Date.now();
              localStorage.setItem('astha_last_cloud_backup_time', String(now));
              setLastCloudBackup(now);
            }
          }
        } catch (e) {
          console.warn("Could not probe Firestore backup dynamically on load.", e);
        }
      } else {
        setUser(null);
        setToken(null);
        setDriveBackups([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Drive Backups
  const fetchDriveBackups = async (accessToken: string) => {
    setLoadingDrive(true);
    setDriveError('');
    try {
      const files = await listDriveBackups(accessToken);
      setDriveBackups(files);

      // Dynamically sync and update the last cloud backup time if there are existing backups
      if (files && files.length > 0) {
        const sortedFiles = [...files].sort(
          (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
        );
        const newestTime = new Date(sortedFiles[0].createdTime).getTime();
        localStorage.setItem('astha_last_cloud_backup_time', newestTime.toString());
        setLastCloudBackup(newestTime);
      }
    } catch (err: any) {
      console.error(err);
      setDriveError(
        language === 'bn' 
          ? 'গুগল ড্রাইভ থেকে ব্যাকআপ ফাইলের তালিকা লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার কানেক্ট করুন।' 
          : 'Failed to fetch backup lists from Google Drive. Try connecting your account again.'
      );
    } finally {
      setLoadingDrive(false);
    }
  };

  // Google Login flow
  const handleGoogleLogin = async () => {
    setDriveError('');
    setDriveSuccess('');
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setDriveSuccess(
          language === 'bn'
            ? 'গুগল ড্রাইভ সফলভাবে সংযুক্ত হয়েছে!'
            : 'Google Drive successfully connected!'
        );
        setTimeout(() => setDriveSuccess(''), 3000);
        await fetchDriveBackups(result.accessToken);
      }
    } catch (err: any) {
      setDriveError(
        language === 'bn'
          ? 'গুগল ড্রাইভ সাইন-ইন সম্পন্ন করা যায়নি।'
          : 'Could not complete Google Drive sign-in.'
      );
    }
  };

  // Google Signout workflow
  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setToken(null);
      setDriveBackups([]);
      setDriveSuccess(
        language === 'bn'
          ? 'গুগল ড্রাইভ সংযোগ বিচ্ছিন্ন করা হয়েছে।'
          : 'Disconnected from Google Drive.'
      );
      setTimeout(() => setDriveSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Backup to Google Drive
  const handleBackupToDrive = async () => {
    if (!token) return;
    setDriveError('');
    setDriveSuccess('');
    setActionLoading('backup');
    try {
      const currentData = exportData();
      await uploadBackupToDrive(token, currentData);

      // Persist current timestamp locally for accurate QoL warnings
      const nowMs = Date.now();
      localStorage.setItem('astha_last_cloud_backup_time', nowMs.toString());
      setLastCloudBackup(nowMs);

      setDriveSuccess(
        language === 'bn'
          ? 'অভিনন্দন! গুগল ড্রাইভে সুরক্ষিতভাবে নতুন ব্যাকআপ তৈরি করা হয়েছে।'
          : 'Success! New database backup file securely saved to your Google Drive.'
      );
      setTimeout(() => setDriveSuccess(''), 3000);
      await fetchDriveBackups(token);
    } catch (err: any) {
      console.error(err);
      setDriveError(
        language === 'bn'
          ? 'গুগল ড্রাইভে ব্যাকআপ রাখতে ব্যর্থ হয়েছে। সেশন যাচাই করুন।'
          : 'Failed to upload backup to Google Drive. Check session status.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Restore from a Google Drive selected Backup file
  const handleRestoreFromDrive = async (file: DriveBackupFile) => {
    const isConfirmed = window.confirm(
      language === 'bn'
        ? `আপনি কি নিশ্চিত যে ব্যাকআপ ফাইল "${file.name}" থেকে ডাটাবেজ রিস্টোর করতে চান? এটি ড্যাশবোর্ডের সমস্ত বর্তমান তথ্য মুছে ফেলবে!`
        : `Are you sure you want to restore from "${file.name}"? This will overwrite your system's current database state!`
    );
    if (!isConfirmed) return;

    if (!token) return;
    setDriveError('');
    setDriveSuccess('');
    setActionLoading(`restore_${file.id}`);
    try {
      const fileContent = await downloadBackupFromDrive(token, file.id);
      
      // Verification Schema
      const parsed = JSON.parse(fileContent);
      if (!parsed || (!parsed.config && !parsed.flats && !parsed.members)) {
        throw new Error('Invalid schema structure');
      }

      const isImported = importData(fileContent);
      if (isImported) {
        setDriveSuccess(
          language === 'bn'
            ? 'সফলভাবে গুগল ড্রাইভ ব্যাকআপ থেকে তথ্য রিস্টোর করা হয়েছে! রিস্টার্ট হচ্ছে...'
            : 'Society data successfully restored from Google Drive backup! System reloading...'
        );
        setTimeout(() => {
          setDriveSuccess('');
          window.location.reload();
        }, 2000);
      } else {
        setDriveError(
          language === 'bn'
            ? 'ব্যাকআপ ফাইলটি রিস্টোর করতে ব্যর্থ হয়েছে।'
            : 'Fails to restore database parameters from file.'
        );
      }
    } catch (err: any) {
      console.error(err);
      setDriveError(
        language === 'bn'
          ? 'ত্রুটি: নির্বাচিত ব্যাকআপ ফাইলটি ত্রুটিপূর্ণ বা অবৈধ আস্তা টুইন টাওয়ার ফাইল!'
          : 'Error: The selected file does not contain a valid or compatible backup schema.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Firestore Database Cloud Backup
  const handleBackupToFirestore = async () => {
    try {
      setActionLoading('firestore_backup');
      setDriveError('');
      setDriveSuccess('');
      
      const payload = {
        config,
        flats,
        members,
        payments,
        expenses,
        notices,
        visitors,
        complaints,
        staff,
        activityLogs
      };
      
      const res = await backupToFirestoreCloud(payload);
      if (res.success) {
        // Record backup timestamp
        const now = Date.now();
        setLastCloudBackup(now);
        localStorage.setItem('astha_last_cloud_backup_time', String(now));
        
        setDriveSuccess(
          language === 'bn'
            ? `অনুপম সংযোগ! ফায়ারস্টোর ক্লাউড ডাটাবেজে সফলভাবে ${res.count}টি রেকর্ড ব্যাকআপ সংরক্ষণ করা হয়েছে!`
            : `Success! Successfully synchronized ${res.count} database schema records directly to your Firestore Cloud Database.`
        );
        setTimeout(() => setDriveSuccess(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setDriveError(
        language === 'bn'
          ? 'ফায়ারস্টোর ক্লাউড ব্যাকআপ ব্যর্থ হয়েছে: ' + (err.message || err)
          : 'Firestore Cloud Sync failed: ' + (err.message || err)
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Firestore Database Cloud Restore
  const handleRestoreFromFirestore = async () => {
    const isConfirmed = window.confirm(
      language === 'bn'
        ? 'আপনি কি নিশ্চিত যে ফায়ারস্টোর লাইভ ক্লাউড থেকে ডাটাবেজ রিস্টোর করতে চান? এটি আপনার বর্তমান ব্রাউজারের সমস্ত তথ্য মুছে ফেলবে!'
        : 'Are you sure you want to restore your database from Google Cloud Firestore? This will overwrite your system’s current local state!'
    );
    if (!isConfirmed) return;

    try {
      setActionLoading('firestore_restore');
      setDriveError('');
      setDriveSuccess('');
      
      const remoteData = await restoreFromFirestoreCloud();
      
      // Check if we received any real data from Firestore collections
      const totalDocs = 
        (remoteData.flats?.length || 0) + 
        (remoteData.members?.length || 0) + 
        (remoteData.payments?.length || 0);
        
      if (totalDocs === 0) {
        throw new Error(
          language === 'bn'
            ? 'ক্লাউড ফায়ারস্টোরে কোনো সচল ডাটাবেজ রেকর্ড খুঁজে পাওয়া যায়নি। অনুগ্রহ করে প্রথমে ব্যাকআপ লিংক করুন!'
            : 'No active records were found on your Firestore Cloud collections. Please create a cloud backup first!'
        );
      }
      
      // Convert to JSON string format to utilize existing importData helper safely
      const serialized = JSON.stringify(remoteData);
      const isImported = importData(serialized);
      
      if (isImported) {
        setDriveSuccess(
          language === 'bn'
            ? 'ফায়ারস্টোর ক্লাউড থেকে সফলভাবে ডাটাবেজ পুনরুদ্ধার সম্পন্ন হয়েছে! ড্যাশবোর্ড রিফ্রেশ হচ্ছে...'
            : 'Society database successfully restored from Google Cloud Firestore! Refreshing system...'
        );
        setTimeout(() => {
          setDriveSuccess('');
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Schema validation error import processing.');
      }
    } catch (err: any) {
      console.error(err);
      setDriveError(
        language === 'bn'
          ? 'ফায়ারস্টোর ক্লাউড পুনরুদ্ধার সমস্যা: ' + (err.message || err)
          : 'Firestore Cloud Restoration error: ' + (err.message || err)
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Backup File from Google Drive
  const handleDeleteFromDrive = async (file: DriveBackupFile) => {
    const isConfirmed = window.confirm(
      language === 'bn'
        ? `আপনি কি নিশ্চিত যে গুগল ড্রাইভ থেকে "${file.name}" ব্যাকআপ ফাইলটি স্থায়ীভাবে ডিলিট করতে চান?`
        : `Are you sure you want to permanently delete "${file.name}" from your Google Drive?`
    );
    if (!isConfirmed) return;

    if (!token) return;
    setDriveError('');
    setDriveSuccess('');
    setActionLoading(`delete_${file.id}`);
    try {
      await deleteBackupFromDrive(token, file.id);
      setDriveSuccess(
        language === 'bn'
          ? 'ব্যাকআপ ফাইল সফলভাবে ডিলিট করা হয়েছে।'
          : 'Backup file successfully deleted from drive.'
      );
      setTimeout(() => setDriveSuccess(''), 3000);
      await fetchDriveBackups(token);
    } catch (err: any) {
      console.error(err);
      setDriveError(
        language === 'bn'
          ? 'ফাইলটি গুগল ড্রাইভ থেকে ডিলিট করতে ব্যর্থ হয়েছে।'
          : 'Failed to delete backup file from Google Drive.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Export Local Backup
  const handleExport = () => {
    setError('');
    setSuccess('');
    const dataStr = exportData();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `astha-twin-towers-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    setSuccess(language === 'bn' ? 'ডাটাবেজ ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে!' : 'Database Backup JSON payload downloaded successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Handle local restoration
  const processJsonFile = (file: File) => {
    setError('');
    setSuccess('');
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError(language === 'bn' 
        ? 'ভুল ফাইল ফরম্যাট! অনুগ্রহ করে শুধুমাত্র একটি সলিড .json ফাইল আপলোড করুন।' 
        : 'Invalid file format! Please upload a valid JSON backup schema (.json) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textStr = event.target?.result as string;
        const parsed = JSON.parse(textStr);
        if (!parsed || (!parsed.config && !parsed.flats && !parsed.members)) {
          throw new Error('Invalid schema structure');
        }

        const successImport = importData(textStr);
        if (successImport) {
          setSuccess(language === 'bn' 
            ? 'অভিনন্দন! আপনার ব্যাকআপ ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে। সিস্টেমটি রিফ্রেশ হচ্ছে...' 
            : 'Congratulations! Your society database has been successfully restored from local backup payload. Refreshing system...');
          setTimeout(() => {
            setSuccess('');
            window.location.reload();
          }, 2000);
        } else {
          setError(language === 'bn' 
            ? 'ডাটাবেজ ইমপোর্ট ফিল্টার কাজ করতে ব্যর্থ হয়েছে।' 
            : 'The state restoration helper failed parsing the JSON parameters.');
        }
      } catch (err) {
        setError(language === 'bn' 
          ? 'ত্রুটি: পঠিত ফাইলটি একটি বৈধ আস্তা টুইন টাওয়ার ডাটাবেজ ব্যাকআপ ফাইল নয়!' 
          : 'Error: The selected file is not a valid Astha Twin Towers database schema or is corrupted.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processJsonFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processJsonFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setError('');
    setSuccess('');
    if (confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে সম্পূর্ণ ডেটা রিসেট করতে চান?' : 'Are you absolutely sure you want to trigger a factory demo reset? This restores all default flats, members, payments and notices.')) {
      resetToDefault();
      setSuccess(language === 'bn' ? 'ডাটাবেজ সফলভাবে রিসেট সম্পন্ন হয়েছে!' : 'Database factory demo values restored successfully!');
      setTimeout(() => {
        setSuccess('');
        window.location.reload();
      }, 1500);
    }
  };

  // Formatter helper for file sizes
  const formatBytes = (bytes?: string, decimals = 2) => {
    if (!bytes) return '0 B';
    const numBytes = parseInt(bytes, 10);
    if (isNaN(numBytes) || numBytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="rounded-xl border border-red-950 bg-[#0c0a09] p-8 text-center text-xs font-mono text-rose-500 max-w-sm mx-auto space-y-3 my-12 shadow-2xl">
        <p className="font-extrabold uppercase text-[#D4AF37] tracking-wider font-mono">Access Forbidden</p>
        <p className="text-slate-400 font-sans leading-relaxed">Only Admin is authorized to access Backup & Recovery controls.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans flex items-center gap-2">
            <Database className="h-6 w-6 text-[#D4AF37]" />
            <span>{language === 'bn' ? 'ডাটাবেজ ব্যাকআপ ও পুনরুদ্ধার প্রশাসন' : 'Database Administration & Recovery'}</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {language === 'bn' 
              ? 'নিবাসী ডাটাবেজ ব্যাকআপ রাখুন, ক্লাউড বা লোকাল ড্রাইভ থেকে রিস্টোর করুন এবং ফ্যাক্টরি মান সেটআপ করুন' 
              : 'Safeguard resident directories, backup to cloud or local systems, and manage database restore points'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="inline-flex rounded-lg bg-neutral-900 border border-emerald-950 p-1 self-start sm:self-center">
          <button
            onClick={() => setActiveSection('local')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSection === 'local'
                ? 'bg-emerald-800 text-white shadow-emerald-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>{language === 'bn' ? 'লোকাল ড্রাইভ' : 'Local Drive'}</span>
          </button>
          <button
            onClick={() => setActiveSection('google')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSection === 'google'
                ? 'bg-[#4285F4] text-white shadow-blue-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>{language === 'bn' ? 'গুগল ড্রাইভ (ক্লাউড)' : 'Google Drive (Cloud)'}</span>
          </button>
        </div>
      </div>

      {/* 7-Day Cloud Backup Overdue Warning */}
      {showBackupAlert && isBackupAlertOverdue() && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-sans text-xs animate-fade-in">
          <div className="flex gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/15 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-[#D4AF37] uppercase tracking-wide">
                {language === 'bn' ? 'ক্লাউড ব্যাকআপ সতর্কতা ও পরামর্শ' : 'Cloud Backup Advisory Alert'}
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px] max-w-2xl">
                {language === 'bn' ? (
                  <>
                    {lastCloudBackup ? (
                      <span>আপনার সর্বশেষ ক্লাউড ব্যাকআপ করা হয়েছে <strong>{getDaysSinceLastBackup() || 7} দিন আগে</strong>। রিকভারি ডাটাবেজ আপডেট নিশ্চিত করতে অনুগ্রহ করে একটি নতুন ক্লাউড ব্যাকআপ প্রস্তুত করুন।</span>
                    ) : (
                      <span>নিরাপত্তা সতর্কতা: এখনও কোনো ক্লাউড ব্যাকআপ প্রস্তুত করা হয়নি! যেকোনো আকস্মিক হারানো রোধে এখনই আস্থা টুইন টাওয়ারের ডেটা ক্লাউডে সুরক্ষিত করুন।</span>
                    )}
                  </>
                ) : (
                  <>
                    {lastCloudBackup ? (
                      <span>No secure cloud database backup has been registered in the last <strong>{getDaysSinceLastBackup() || 7} days</strong>. Access Google Drive to generate a fresh backup snapshot.</span>
                    ) : (
                      <span>Attention: No secure Cloud Backup has ever been logged on this system! Link your Google account and backup immediately to safeguard resident data.</span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 self-end md:self-center">
            {activeSection !== 'google' && (
              <button
                onClick={() => setActiveSection('google')}
                className="flex-1 md:flex-initial px-3.5 py-1.5 rounded bg-[#4285F4] hover:bg-blue-600 text-white font-bold transition-all text-center cursor-pointer text-[10px] uppercase tracking-wider"
              >
                {language === 'bn' ? 'ক্লাউড ব্যাকআপে যান' : 'Go to Cloud Backup'}
              </button>
            )}
            <button
              onClick={() => {
                localStorage.setItem('astha_dismiss_backup_alert', 'true');
                setShowBackupAlert(false);
              }}
              className="px-2.5 py-1.5 rounded bg-neutral-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs cursor-pointer font-bold shrink-0"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS & ERROR TOASTS */}
      {success && (
        <p className="p-3 bg-emerald-950/30 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold font-sans flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </p>
      )}

      {error && (
        <p className="p-3 bg-rose-950/30 text-rose-400 border border-rose-900 rounded-lg text-xs font-bold font-sans flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </p>
      )}

      {/* ======================================= */}
      {/* LOCAL STORAGE BACKUP SECTION            */}
      {/* ======================================= */}
      {activeSection === 'local' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Export Card */}
          <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4 font-sans text-xs flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1.5 pb-2 border-b border-emerald-950">
                <Download className="h-4.5 w-4.5" />
                {language === 'bn' ? 'লোকাল ড্রাইভে ব্যাকআপ ডাউনলোড করুন' : 'Download Local Backup Schema'}
              </h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {language === 'bn'
                  ? 'আপনার সমস্ত নিবাসী তথ্য ফ্ল্যাট লেআউট ম্যাপ, বিলিং শিট এবং অভিযোগ রেজিস্ট্রি সংবলিত একটি ব্যাকআপ ফাইল তৈরি করে তাৎক্ষণিকভাবে আপনার কম্পিউটার বা মোবাইল স্টোরেজে সেভ করুন।'
                  : 'Instantly download a structured JSON metadata archive representing your custom flats plan, resident lists, notices bulletin and ledger database to your local downloads directory.'
                }
              </p>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleExport}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 border border-[#D4AF37]/35 px-5 py-2.5 font-bold text-white hover:bg-emerald-600 transition-colors cursor-pointer text-xs"
              >
                <Download className="h-4.5 w-4.5 text-[#D4AF37]" />
                <span>{language === 'bn' ? 'ব্যাকআপ ফাইল সেভ করুন (.json)' : 'Save Backup File (.json)'}</span>
              </button>
            </div>
          </div>

          {/* Local Upload Uploader Card */}
          <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4 font-sans text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5 pb-2 border-b border-emerald-950">
              <UploadCloud className="h-4.5 w-4.5" />
              {language === 'bn' ? 'লোকাল ব্যাকআপ ফাইল থেকে রিস্টোর' : 'Restore from Local JSON File'}
            </h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {language === 'bn'
                ? 'পূর্বে ডাউনলোড করা আস্থা টুইন টাওয়ারের ব্যাকআপ (.json) ফাইলটি নির্বাচন করুন। এটি আপনার সিস্টেমের বিদ্যমান সকল ডেটাকে প্রতিস্থাপন করে উক্ত সেভ পয়েন্ট ডেটাসেট পুনরুদ্ধার করবে।'
                : 'Upload a previously generated Astha Twin Towers database backup (.json) file. Uploading will completely overwrite your current browser data parameters with your restored schema.'
              }
            </p>

            {/* Drag and Drop Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-6 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-pointer ${
                dragActive 
                  ? 'border-emerald-400 bg-emerald-950/20 shadow-emerald-500/10 shadow-lg' 
                  : 'border-emerald-950 hover:border-emerald-800 bg-[#0c0a09]/40'
              }`}
            >
              <input 
                type="file"
                id="json-file-uploader-v2"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="json-file-uploader-v2" className="w-full h-full cursor-pointer flex flex-col items-center justify-center space-y-2.5">
                <UploadCloud className={`h-8 w-8 transition-transform duration-300 ${dragActive ? 'scale-125 text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold text-white leading-relaxed">
                    {language === 'bn' 
                      ? 'ব্যাকআপ ফাইলটি এখানে ড্র্যাপ করুন অথবা ব্রাউজ করুন' 
                      : 'Drag & drop backup JSON file here, or click to browse'
                    }
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {language === 'bn' ? 'শুধুমাত্র বৈধ .JSON ফাইল সাপোর্ট করবে' : 'Only valid structured JSON backup formats are supported'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Reset Baseline values Card */}
          <div className="lg:col-span-2 rounded-xl border border-rose-950 bg-neutral-950/40 p-5 space-y-4 font-sans text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1.5 pb-2 border-b border-red-950">
              <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
              {language === 'bn' ? 'ফ্যাক্টরি ডেমো ডেটা রিসেট' : 'Factory Default Demo Reset'}
            </h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {language === 'bn'
                ? 'আপনার ডাটাবেজ সম্পূর্ণরূপে তার মূল ডিক্লেয়ার্ড বাংলাদেশী ডেমো ডেটাসেটে পুনরুদ্ধার করুন (যার মধ্যে আস্থা টুইন টাওয়ারের ৭২টি কাস্টম ফ্ল্যাট রেজিস্ট্রি এবং নোটিশ ভিজিটর ডেটা অন্তর্ভুক্ত)। এটি আপনার করা অন্য যেকোনো কাস্টম পরিবর্তন স্থায়ীভাবে মুছে ফেলবে।'
                : 'Revert your system completely to its original factory Bangladeshi placeholder dataset (including the complete Astha Twin Towers configurations, 72 units blueprint grid, pre-populated notices, and logs). WARNING: This will permanently delete any unsaved inputs.'
              }
            </p>
            <div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-rose-900 px-5 py-2.5 font-bold text-rose-400 cursor-pointer text-xs transition-colors"
              >
                <RotateCcw className="h-4.5 w-4.5" />
                <span>{language === 'bn' ? 'ফ্যাক্টরি ডেমো ডেটা রিস্টোর করুন' : 'Run Factory Demo Reset'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ======================================= */}
      {/* GOOGLE DRIVE CLOUD STORAGE SECTION       */}
      {/* ======================================= */}
      {activeSection === 'google' && (
        <div className="space-y-6">
          
          {/* Drive status messages */}
          {driveSuccess && (
            <p className="p-3 bg-emerald-950/30 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold font-sans flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{driveSuccess}</span>
            </p>
          )}

          {driveError && (
            <p className="p-3 bg-rose-950/30 text-rose-400 border border-rose-900 rounded-lg text-xs font-bold font-sans flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{driveError}</span>
            </p>
          )}

          {/* Conditional Rendering base Authenticated status */}
          {!user || !token ? (
            <div className="rounded-xl border border-[#4285F4]/30 bg-[#0c0a09]/50 p-6 space-y-5 font-sans text-xs flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
              <div className="bg-[#4285F4]/10 p-3.5 rounded-full">
                <Cloud className="h-10 w-10 text-[#4285F4]" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-black text-white leading-tight">
                  {language === 'bn' ? 'গুগল ড্রাইভ ক্লাউড ব্যাকআপ লিংক করুন' : 'Link Google Drive for Cloud Backups'}
                </h3>
                <p className="text-slate-400 leading-relaxed max-w-sm mx-auto text-[11px]">
                  {language === 'bn'
                    ? 'আপনার গুগল ড্রাইভ সংযোগ করার মাধ্যমে সম্পূর্ণ অটো-ব্যাকআপ সিকিউরড মেটাডাটা সরাসরি ক্লাউডে সেভ করুন। যেকোনো সময় যেকোনো ডিভাইস থেকে এক ক্লিকে রিস্টোর করুন।'
                    : 'Connect your personal Google Drive account to store backups securely in Google Drive. Take advantage of immediate restoration anytime from any active internet device.'
                  }
                </p>
              </div>

              {/* GSI Button layout styling adhering strictly to Guidelines */}
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-3 bg-white hover:bg-slate-100 text-[#1f1f1f] font-sans font-bold px-5 py-3 rounded-lg shadow-md border hover:border-slate-300 transition-all cursor-pointer text-xs"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{language === 'bn' ? 'গুগল অ্যাকাউন্টের সাথে সাইন-ইন' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Linked User Profile Header */}
              <div className="rounded-xl border border-blue-900 bg-[#0c0a09]/50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
                
                <div className="flex items-center gap-3.5">
                  {user.photoURL ? (
                    <img referrerPolicy="no-referrer" src={user.photoURL || null} alt={user.displayName || 'Google User'} className="h-10 w-10 rounded-full border border-blue-500 shadow-md shadow-blue-950 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-950 flex items-center justify-center border border-blue-500 font-bold text-blue-400 font-mono shrink-0">
                      {user.displayName?.substring(0, 1) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-white">{user.displayName || 'Google Cloud Administrator'}</span>
                      <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>LINKED</span>
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] font-mono block mt-0.5">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  
                  {/* Create Drive Backup Button */}
                  <button
                    onClick={handleBackupToDrive}
                    disabled={actionLoading === 'backup'}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-[#4285F4] hover:bg-blue-600 border border-blue-950 font-bold text-white px-4 py-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'backup' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Cloud className="h-4 w-4 text-emerald-400" />
                    )}
                    <span>{language === 'bn' ? 'নতুন ক্লাউড ব্যাকআপ রাখুন' : 'Backup to Google Drive'}</span>
                  </button>

                  <button
                    onClick={() => fetchDriveBackups(token!)}
                    disabled={loadingDrive}
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Refresh backups list"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingDrive ? 'animate-spin text-[#4285F4]' : ''}`} />
                  </button>

                  <button
                    onClick={handleGoogleLogout}
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-red-950/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    title="Disconnect google"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>

                </div>

              </div>

              {/* Firestore Native Cloud Database Replication Sync Controller */}
              <div className="rounded-xl border border-emerald-900 bg-[#071310]/50 p-5 space-y-4 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2 flex-wrap gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-[#D4AF37]" />
                    <span>{language === 'bn' ? 'ফায়ারস্টোর ডাইরেক্ট ক্লাউড ব্যাকআপ ও রিস্টোর' : 'Firestore Direct Cloud Sync & Active Restore'}</span>
                  </h3>
                  <span className="bg-emerald-950 text-[10px] text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded font-bold font-mono">
                    {language === 'bn' ? 'সুরক্ষিত ফায়ারস্টোর ক্লাউড' : 'REPLICATED CLOUD ENGINE'}
                  </span>
                </div>

                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {language === 'bn' 
                    ? 'এটি সরাসরি আপনার গুগল ক্লাউড ফায়ারস্টোর পয়েন্টের সাথে সংযুক্ত। ফাইল আপলোড বা পপআপ কনসেন্ট ছাড়াই ১-ক্লিকে ফায়ারস্টোর ক্লাউডে ব্যাকআপ রাখতে এবং সরাসরি রিস্টোর কোয়েরি করতে পারবেন।'
                    : 'This utility replicates your complete society database directly to and from your secure Google Cloud Firestore instance. It bypasses iframe browser popup restraints, storing real database schemas natively in isolated cloud collections.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  
                  {/* Backup button */}
                  <button
                    onClick={handleBackupToFirestore}
                    disabled={actionLoading !== null}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-emerald-900 hover:bg-emerald-850 border border-emerald-950 font-bold text-white px-5 py-2.5 cursor-pointer transition-colors text-xs disabled:opacity-40"
                  >
                    {actionLoading === 'firestore_backup' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4 text-[#D4AF37]" />
                    )}
                    <span>{language === 'bn' ? 'ফায়ারস্টোর ক্লাউড ব্যাকআপ সংরক্ষণ' : 'Sync Backup to Firestore'}</span>
                  </button>

                  {/* Restore button */}
                  <button
                    onClick={handleRestoreFromFirestore}
                    disabled={actionLoading !== null}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-amber-950/40 hover:bg-amber-950/70 border border-amber-900/60 font-bold text-amber-400 px-5 py-2.5 cursor-pointer transition-colors text-xs disabled:opacity-40"
                  >
                    {actionLoading === 'firestore_restore' ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-[#D4AF37]" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span>{language === 'bn' ? 'ক্লাউড রিস্টোর অপারেশন চালান' : 'Run Active Cloud Restore'}</span>
                  </button>

                </div>
              </div>

              {/* Backups Live List container */}
              <div className="rounded-xl border border-blue-950 bg-neutral-950/30 p-5 space-y-4 font-sans text-xs">
                
                <div className="flex items-center justify-between border-b border-blue-950/50 pb-2 flex-wrap gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1.5">
                    <FileCode className="h-4.5 w-4.5" />
                    <span>{language === 'bn' ? 'গুগল ড্রাইভ সেভ পয়েন্ট ব্যাকআপসমূহ' : 'Google Drive Backup Restore Points'}</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {language === 'bn' ? `মোট ব্যাকআপ ফাইল: ${driveBackups.length}` : `Backup count: ${driveBackups.length} file(s)`}
                  </span>
                </div>

                {loadingDrive ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#4285F4]" />
                    <span className="text-slate-400 text-[11px] font-mono">
                      {language === 'bn' ? 'গুগল ড্রাইভ সার্ভার লোড করা হচ্ছে...' : 'Querying Google Drive files storage index...'}
                    </span>
                  </div>
                ) : driveBackups.length === 0 ? (
                  <div className="text-center py-12 space-y-1.5 border border-dashed border-blue-950/40 rounded-lg">
                    <Cloud className="h-8 w-8 text-slate-500 mx-auto" />
                    <p className="text-slate-400 text-xs font-bold leading-relaxed">
                      {language === 'bn' ? 'কোনো ক্লাউড ব্যাকআপ পাওয়া যায়নি!' : 'No custom database backups found.'}
                    </p>
                    <p className="text-slate-500 text-[10px] leading-relaxed max-w-xs mx-auto">
                      {language === 'bn' 
                        ? 'উপরের "নতুন ক্লাউড ব্যাকআপ রাখুন" বাটনে ক্লিক করে প্রথম সুরক্ষিত স্ন্যাপশট ক্লাউভে সেভ করুন।'
                        : 'Secure your first system snapshot in Google Cloud by clicking "Backup to Google Drive" button.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-[#0c0a09]/10 rounded-lg overflow-hidden">
                      <thead className="bg-[#0c0a09]/50 font-mono text-[10px] uppercase text-slate-400 tracking-wider">
                        <tr>
                          <th className="p-3 font-semibold">{language === 'bn' ? 'ফাইলের নাম' : 'File Name'}</th>
                          <th className="p-3 font-semibold">{language === 'bn' ? 'তারিখ' : 'Created Time'}</th>
                          <th className="p-3 font-semibold">{language === 'bn' ? 'আকার' : 'File Size'}</th>
                          <th className="p-3 font-semibold text-center">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-950/20">
                        {driveBackups.map((file) => {
                          const isRestoring = actionLoading === `restore_${file.id}`;
                          const isDeleting = actionLoading === `delete_${file.id}`;
                          
                          return (
                            <tr key={file.id} className="hover:bg-blue-950/10 transition-colors">
                              <td className="p-3 font-medium text-white max-w-[200px] truncate" title={file.name}>
                                {file.name}
                              </td>
                              <td className="p-3 text-slate-400 font-mono text-[11px]">
                                {new Date(file.createdTime).toLocaleString(
                                  language === 'bn' ? 'bn-BD' : 'en-US',
                                  { dateStyle: 'medium', timeStyle: 'short' }
                                )}
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">
                                {formatBytes(file.size)}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  
                                  {/* Restore Trigger button */}
                                  <button
                                    onClick={() => handleRestoreFromDrive(file)}
                                    disabled={actionLoading !== null}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 hover:text-white transition-all cursor-pointer font-bold font-sans disabled:opacity-40"
                                  >
                                    {isRestoring ? (
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-3.5 w-3.5 text-[#D4AF37]" />
                                    )}
                                    <span>{language === 'bn' ? 'রিস্টোর' : 'Restore'}</span>
                                  </button>

                                  {/* Delete File Trigger Button */}
                                  <button
                                    onClick={() => handleDeleteFromDrive(file)}
                                    disabled={actionLoading !== null}
                                    className="p-1.5 rounded bg-neutral-900 text-slate-500 hover:text-rose-400 border border-red-950/20 hover:border-rose-900 transition-all cursor-pointer disabled:opacity-40"
                                    title="Delete from Drive"
                                  >
                                    {isDeleting ? (
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-rose-500" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>

                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
              
            </div>
          )}

          {/* Netlify Deployment & Configuration Guide Card */}
          <div className="rounded-xl border border-[#4285F4]/20 bg-blue-950/5 p-5 space-y-4 font-sans text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#4285F4] font-mono flex items-center gap-1.5 pb-2 border-b border-blue-950/30">
              <ShieldCheck className="h-4.5 w-4.5 text-[#4285F4]" />
              <span>
                {language === 'bn' 
                  ? 'নেটলিফাই হোস্টিং সেটআপ গাইড (গুগল অ্যাকাউন্টের সাথে লিংক করুন)' 
                  : 'Netlify Hosting: Google OAuth Connection Guide'}
              </span>
            </h3>
            
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {language === 'bn' 
                ? 'আস্থা টুইন টাওয়ার সাইটটি যদি নেটলিফাইতে হোস্টিং করা হয়, তবে গুগল অ্যাকাউন্টের মাধ্যমে ক্লাউড ব্যাকআপ সিঙ্ক করতে আপনাকে অবশ্যই ফায়ারবেস অথরাইজড ডোমেইনে আপনার নেটলিফাই সাইটটি যুক্ত করতে হবে। অন্যথায় সাইন-ইন রিকোয়েস্ট ব্লক হবে।'
                : 'If this Astha Twin Towers application is hosted on Netlify (e.g., your-app.netlify.app), you must whitelist your active Netlify domain in the Firebase developer settings. Without this step, Google login popups will fail with cross-origin or redirect errors.'}
            </p>

            <div className="bg-[#0c0a09]/50 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
              <h4 className="font-extrabold text-[#D4AF37] uppercase tracking-wider font-mono text-[10px]">
                {language === 'bn' ? 'ধাপসমূহ:' : 'Setup Instructions:'}
              </h4>
              <ul className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed pl-1 pb-1">
                <li>
                  {language === 'bn' 
                    ? 'আপনার ব্রাউজারে Firebase Console (https://console.firebase.google.com) এ প্রবেশ করুন।'
                    : 'Open the Firebase Console (https://console.firebase.google.com) in your web browser.'}
                </li>
                <li>
                  {language === 'bn' 
                    ? 'বিকাশকারী প্রজেক্ট "isometric-jar-h0bnn" নির্বাচন করে Authentication মেনুতে যান।'
                    : 'Select the primary Firebase project "isometric-jar-h0bnn" and navigate to the Authentication module.'}
                </li>
                <li>
                  {language === 'bn' 
                    ? 'Authentication এর Settings ট্যাবের অধীন Authorized domains অপশনে ক্লিক করুন।'
                    : 'Click on the Settings tab within the Authentication page and look for Authorized domains.'}
                </li>
                <li>
                  {language === 'bn' 
                    ? 'Add domain বাটনে ক্লিক করে আপনার সচল Netlify সাইটের ডোমেইনটি (যেমন astha-site.netlify.app) যুক্ত করুন।'
                    : 'Click Add Domain, enter your exact Netlify application domain name (e.g., your-site.netlify.app), and hit Add.'}
                </li>
              </ul>
            </div>

            <p className="text-[10px] text-slate-500 font-mono italic leading-relaxed">
              {language === 'bn'
                ? '* দ্রষ্টব্য: পপআপ সিকিউরিটি ফায়ারবেস authDomain (isometric-jar-h0bnn.firebaseapp.com) এর মাধ্যমে স্বয়ংক্রিয়ভাবে হ্যান্ডেল হয়। এই ধাপটি সম্পন্ন করলে নেটলিফাই থেকে ক্লাউড ব্যাকআপ পুরোপুরি সচল হয়ে যাবে।'
                : '* Note: Standard Google login is orchestrated securely through the Firebase authDomain. Completing this simple setting ensures seamless bi-directional cloud sync on Netlify platforms.'}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
