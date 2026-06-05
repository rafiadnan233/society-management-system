import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { initAuth, googleSignIn, getAccessToken, logoutGoogle } from '../lib/googleAuth';
import { 
  MessageSquare, 
  LogIn, 
  AlertCircle,
  Megaphone,
  Shield,
  Users,
  Wrench,
  ShieldAlert,
  Car,
  Landmark,
  Calendar,
  Layers,
  Send,
  CheckCircle2,
  Lock,
  User,
  ExternalLink,
  Flame,
  Plus,
  Compass,
  Pencil,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  Home,
  Edit,
  Camera
} from 'lucide-react';

interface Space {
  id: string;
  icon: any;
  displayName: string;
  displayNameBn: string;
  category: 'community' | 'management' | 'utilities' | 'emergency';
  categoryLabelBn: string;
  categoryLabelEn: string;
  objectiveBn: string;
  objectiveEn: string;
  membersBn: string;
  membersEn: string;
  permissions: {
    residents: string;
    committee: string;
    admin: string;
  };
  threadCategories?: string[];
  exampleFormat?: string;
  messages: Array<{
    id?: string;
    sender: string;
    role: string;
    roleLabelBn: string;
    roleLabelEn: string;
    bg: string;
    text: string;
    time?: string;
  }>;
}

function getFloorName(floor: number, lang: string) {
  if (lang === 'bn') {
    const bnFloors = ['গ্রাউন্ড ফ্লোর', '১ম তলা', '২য় তলা', '৩য় তলা', '৪র্থ তলা', '৫ম তলা', '৬ষ্ঠ তলা', '৭ম তলা', '৮ম তলা', '৯ম তলা'];
    return bnFloors[floor] || `${floor} তলা`;
  }
  const suffix = ["th", "st", "nd", "rd"];
  const v = floor % 100;
  const th = suffix[(v - 20) % 10] || suffix[v] || suffix[0];
  return floor === 0 ? "Ground Floor" : `${floor}${th} Floor`;
}

export default function GoogleChat() {
  const { language, config, updateConfig, currentUser, flats, members, addMember, updateMember } = useSociety();
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Tab Control
  const [activeMainTab, setActiveMainTab] = useState<'chat' | 'committee' | 'photogallery'>('chat');

  // Resident Photo Gallery State
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryFloorFilter, setGalleryFloorFilter] = useState<number | null>(null);
  const [selectedGalleryFlat, setSelectedGalleryFlat] = useState<any | null>(null);
  const [flatFormName, setFlatFormName] = useState('');
  const [flatFormPhone, setFlatFormPhone] = useState('');
  const [flatFormPhoto, setFlatFormPhoto] = useState('');
  const [flatFormType, setFlatFormType] = useState<'Owner' | 'Tenant'>('Owner');
  const [flatFormNid, setFlatFormNid] = useState('');
  const [flatFormEmail, setFlatFormEmail] = useState('');

  // Committee State & Forms inside Google Chat
  const [showCommitteeModal, setShowCommitteeModal] = useState(false);
  const [editingCommitteeMember, setEditingCommitteeMember] = useState<any | null>(null);
  const [cmNameEn, setCmNameEn] = useState('');
  const [cmNameBn, setCmNameBn] = useState('');
  const [cmRoleEn, setCmRoleEn] = useState('');
  const [cmRoleBn, setCmRoleBn] = useState('');
  const [cmPhone, setCmPhone] = useState('');
  const [cmEmail, setCmEmail] = useState('');
  const [cmFlatNumber, setCmFlatNumber] = useState('');
  const [cmPhotoUrl, setCmPhotoUrl] = useState('');

  const [photoEditMember, setPhotoEditMember] = useState<any | null>(null);
  const [photoEditUrl, setPhotoEditUrl] = useState('');

  const committeeMembers: any[] = config?.committeeMembersJson 
    ? JSON.parse(config.committeeMembersJson) 
    : [];

  const openAddCommitteeModal = () => {
    setEditingCommitteeMember(null);
    setCmNameEn('');
    setCmNameBn('');
    setCmRoleEn('');
    setCmRoleBn('');
    setCmPhone('');
    setCmEmail('');
    setCmFlatNumber('');
    setCmPhotoUrl('');
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
    setCmPhotoUrl(member.photoUrl || '');
    setShowCommitteeModal(true);
  };

  const handleCommitteeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    if (!cmNameEn && !cmNameBn) return;

    const fallbackPhoto = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face`;

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
              flatNumber: cmFlatNumber,
              photoUrl: cmPhotoUrl || item.photoUrl || fallbackPhoto
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
          flatNumber: cmFlatNumber,
          photoUrl: cmPhotoUrl || fallbackPhoto
        }
      ];
    }

    updateConfig({ committeeMembersJson: JSON.stringify(updatedList) });
    setShowCommitteeModal(false);
    setEditingCommitteeMember(null);
  };

  const handleDeleteCommitteeMember = (id: string) => {
    const confirmMsg = language === 'bn' 
      ? 'আপনি কি নিশ্চিতভাবে এই নির্বাচিত সদস্যকে অপসারণ করতে চান?'
      : 'Are you sure you want to remove this elected committee member?';
    if (!window.confirm(confirmMsg)) return;

    const updatedList = committeeMembers.filter((item: any) => item.id !== id);
    updateConfig({ committeeMembersJson: JSON.stringify(updatedList) });
  };

  // Active simulated space for sandbox testing
  const [activeSpaceId, setActiveSpaceId] = useState<string>('announcements');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  
  // Simulated interactive reply state
  const [chatInput, setChatInput] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Resident');

  // Pre-configured list of channels requested by the user
  const [simulatedSpaces, setSimulatedSpaces] = useState<Space[]>([
    {
      id: 'announcements',
      icon: Megaphone,
      displayName: 'Society Announcements',
      displayNameBn: 'ঘোষণা ও জরুরি নোটিশ (Announcements)',
      category: 'community',
      categoryLabelBn: 'মূল হাব',
      categoryLabelEn: 'Main Hub',
      objectiveBn: 'অফিসিয়াল নোটিশ, জরুরি ঘোষণা, মেইনটেন্যান্স আপডেট এবং AGM/EGM মিটিং নোটিশ শেয়ার করা।',
      objectiveEn: 'Publish official notices, emergency updates, maintenance declarations, and general meeting (AGM/EGM) summaries.',
      membersBn: 'কমিটির এডমিন টিম এবং সাধারণ বাসিন্দারা',
      membersEn: 'Admin Team, Committee Board, and all Residents',
      permissions: {
        residents: language === 'bn' ? 'শুধুমাত্র রিড / প্রতিক্রিয়া' : 'Read Only / Reaction Only',
        committee: language === 'bn' ? 'পোস্ট করার অনুমতি' : 'Post Permits',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      messages: [
        { 
          id: 'ann-1',
          sender: language === 'bn' ? 'আলহাজ্ব মো: আব্দুর রহমান' : 'Alhaj Md. Abdur Rahman', 
          role: 'Secretary', 
          roleLabelBn: 'সাধারণ সম্পাদক',
          roleLabelEn: 'General Secretary',
          bg: 'bg-emerald-950 text-[#D4AF37]', 
          text: language === 'bn' 
            ? 'জনাব ও মহোদয়গণ, আগামী শুক্রবার ৫ই জুন বিকাল ৪:০০ টায় ভবনের সাধারণ পরিষদের জরুরি সভা (EGM) অনুষ্ঠিত হবে। সকলকে উপস্থিত থাকার জন্য অনুরোধ করা হচ্ছে।' 
            : 'Dear Residents, an Extraordinary General Meeting (EGM) is scheduled for next Friday, June 5th at 4:00 PM. High priority attendance recommended.',
          time: '10:14 AM'
        },
        { 
          id: 'ann-2',
          sender: language === 'bn' ? 'নাসির উদ্দিন' : 'Nasir Uddin', 
          role: 'Treasurer', 
          roleLabelBn: 'কোষাধ্যক্ষ',
          roleLabelEn: 'Treasurer',
          bg: 'bg-slate-900 text-indigo-300', 
          text: language === 'bn' 
            ? 'মে মাসের মাসিক মেইনটেন্যান্স হিসাব ও পরিশোধ বিলে পেমেন্ট অপশন ও ক্লোস বাটন সফলভাবে যুক্ত করা হয়েছে। সদস্যবৃন্দ পেমেন্ট সেকশন থেকে রশিদ প্রিন্ট করতে পারবেন।' 
            : 'Payment options and close triggers have been successfully deployed in May billing registers. All residents can now download or direct-print formal cash receipts.',
          time: 'Yesterday'
        }
      ]
    },
    {
      id: 'admin_team',
      icon: Shield,
      displayName: 'Society Admin Team',
      displayNameBn: 'কমিটি ও সোসাইটি প্রশাসন (Admin Team)',
      category: 'management',
      categoryLabelBn: 'কমিটি ও ব্যবস্থাপনা',
      categoryLabelEn: 'Management Board',
      objectiveBn: 'প্রশাসনিক সিদ্ধান্ত, বাজেট অনুমোদন, জরুরি ব্যবস্থাপনা এবং ভেন্ডর পরিচালনা বিষয়াদি আলোচনা।',
      objectiveEn: 'Administrative directives, budget allocations, emergency management, and third-party vendor audits.',
      membersBn: 'প্রেসিডেন্ট, সেক্রেটারি, ট্রেজারার এবং সিস্টেম এডমিন',
      membersEn: 'President, Secretary, Treasurer, and System Administrator',
      permissions: {
        residents: language === 'bn' ? 'প্রবেশাধিকার নেই' : 'No Access',
        committee: language === 'bn' ? 'পোস্ট করার অনুমতি' : 'Post Permits',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      messages: [
        { 
          id: 'adm-1',
          sender: language === 'bn' ? 'মোঃ রফিকুল ইসলাম' : 'Mr. Rafiqul Islam', 
          role: 'President', 
          roleLabelBn: 'সভাপতি',
          roleLabelEn: 'President',
          bg: 'bg-emerald-900 text-emerald-100', 
          text: language === 'bn' 
            ? 'সোসাইটির নতুন সিসিটিভি ক্যামেরা ক্রয়ের বাজেট ক্যাবেনেট ফাইলে শেয়ার করা হয়েছে। অ্যাকাউন্টস টিম দয়া করে এটি যাচাই করুন।' 
            : 'The detailed capital budget for security CCTV expansion has been uploaded to the shared folder. Accounts Team please audit.',
          time: '09:30 AM'
        }
      ]
    },
    {
      id: 'residents_discussion',
      icon: Users,
      displayName: 'Residents Discussion',
      displayNameBn: 'বাসিন্দাদের সাধারণ আলোচনা (Discussion)',
      category: 'community',
      categoryLabelBn: 'মূল হাব',
      categoryLabelEn: 'Main Hub',
      objectiveBn: 'সাধারণ আলোচনা, ঘরোয়া কমিউনিটি ইভেন্ট, সামাজিক গেদারীং, পরামর্শ এবং পারস্পরিক মতামত বিনিময়।',
      objectiveEn: 'General neighbor chit-chat, society events, mutual assistance, compound rules suggestions, and general feedback.',
      membersBn: 'সকল ফ্ল্যাট মালিক এবং ভাড়াটিয়াবৃন্দ',
      membersEn: 'All Flat Owners, Landlords, and registered Tenants',
      permissions: {
        residents: language === 'bn' ? 'পোস্ট করতে পারবেন' : 'Post Enabled',
        committee: language === 'bn' ? 'পোস্ট করতে পারবেন' : 'Post Enabled',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      messages: [
        { 
          id: 'res-1',
          sender: 'Hasnat Karim (A-302)', 
          role: 'Resident', 
          roleLabelBn: 'বাসিন্দা',
          roleLabelEn: 'Resident',
          bg: 'bg-zinc-800 text-slate-300', 
          text: language === 'bn' 
            ? 'আমাদের ভবনের সি ব্লকের ৩য় তলার সিঁড়ির বাতিটি কয়েকদিন ধোরে জ্বলছে না। দয়া করে রক্ষণাবেক্ষণ টিমে কেউ একটা টিকিট খুলুন।' 
            : 'The safety bulb in Stairwell C (3rd floor) is out. Could someone raise a fast ticket with our maintenance panel?',
          time: '02:15 PM'
        },
        { 
          id: 'res-2',
          sender: language === 'bn' ? 'আলহাজ্ব মো: আব্দুর রহমান' : 'Alhaj Md. Abdur Rahman', 
          role: 'Secretary', 
          roleLabelBn: 'সাধারণ সম্পাদক',
          roleLabelEn: 'General Secretary',
          bg: 'bg-emerald-950 text-[#D4AF37]', 
          text: language === 'bn' 
            ? 'জনাব করিম, আপনার নোটিশের জন্য ধন্যবাদ। আমরা অলরেডি প্লাম্বিং ও ইলেকট্রিক্যাল উইং-এ টিকিট ফরোয়ার্ড করেছি।' 
            : 'Thanks for bringing this up Mr. Karim. A formal dispatch order has been sent to our electrical technician.',
          time: '02:20 PM'
        }
      ]
    },
    {
      id: 'maintenance_requests',
      icon: Wrench,
      displayName: 'Maintenance Requests',
      displayNameBn: 'রক্ষণাবেক্ষণ ও টেকনিক্যাল সাপোর্ট',
      category: 'utilities',
      categoryLabelBn: 'হ্যান্ডিম্যান ও সাহায্য',
      categoryLabelEn: 'Utilities Wing',
      objectiveBn: 'প্লাম্বিং, ইলেকট্রিক্যাল, লিফটের ত্রুটি, ক্লিনারের জরুরি প্রয়োজন ও পানি সরবরাহ সংক্রান্ত সমস্যা সমাধান।',
      objectiveEn: 'Technical assistance logs, plumbing leaks, electrical diagnostics, elevator complaints, cleanliness and water supply lines support.',
      membersBn: 'সকল বাসিন্দা এবং সোসাইটি টেকনিক্যাল সাপোর্ট স্টাফ',
      membersEn: 'All Residents and designated Compound Technical Handymen',
      permissions: {
        residents: language === 'bn' ? 'টিকিট তৈরি করতে পারবেন' : 'Create Tickets',
        committee: language === 'bn' ? 'ব্যবস্থাপনা ও সমাধান' : 'Manage & Resolve',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      threadCategories: ['Plumbing', 'Electrical', 'Lift Issues', 'Cleaning', 'Water Supply', 'Common Area Repair'],
      exampleFormat: "Flat No: A-503\nIssue Type: Electrical\nPriority: High\nDescription: Hallway light not working.",
      messages: [
        { 
          id: 'maint-1',
          sender: 'Zahid Hossain (B-501)', 
          role: 'Resident', 
          roleLabelBn: 'বাসিন্দা',
          roleLabelEn: 'Resident',
          bg: 'bg-zinc-800 text-slate-300', 
          text: "Flat No: B-501\nIssue Type: Plumbing\nPriority: High\nDescription: Main kitchen water valve leakage.",
          time: '11:00 AM'
        },
        { 
          id: 'maint-2',
          sender: 'Siddik Ali', 
          role: 'Maintenance Lead', 
          roleLabelBn: 'টেকনিশিয়ান লিড',
          roleLabelEn: 'Maintenance Lead',
          bg: 'bg-emerald-900 text-emerald-100', 
          text: language === 'bn' 
            ? 'Zahid ভাই, আপনার অভিযোগটি আমাদের টিকেট খাতা #১২০-এ নথিভুক্ত করা হয়েছে। দুপুর ১২টার মধ্যে মিস্ত্রি পাঠানো হচ্ছে।' 
            : 'Ticket #120 has been opened for Unit B-501. Plumber Siddique scheduled to arrive by 12:00 PM today.',
          time: '11:15 AM'
        }
      ]
    },
    {
      id: 'security_ops',
      icon: ShieldAlert,
      displayName: 'Security Operations',
      displayNameBn: 'নিরাপত্তা ও উইং গার্ডস (Security Team)',
      category: 'utilities',
      categoryLabelBn: 'হ্যান্ডিম্যান ও সাহায্য',
      categoryLabelEn: 'Utilities Wing',
      objectiveBn: 'গেস্ট এলার্ট, জরুরি বিপত্তি, সন্দেহভাজন গতিবিধি এবং নাইট গার্ডদের শিফট কো-অর্ডিনেশন।',
      objectiveEn: 'Gate visitor updates, overnight incident logging, suspect activity notifications, guard rotations and patrolling alignment.',
      membersBn: 'নিরাপত্তা সুপারভাইজার, নাইট গার্ড এবং এডমিন কন্ট্রোলার',
      membersEn: 'Security Supervisor, Compound Gate Guards, Committee Coordinators',
      permissions: {
        residents: language === 'bn' ? 'সীমাবদ্ধ ভিউ' : 'Limited View',
        committee: language === 'bn' ? 'রিড ও পর্যবেক্ষণ' : 'View & Audit',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      messages: [
        { 
          id: 'sec-1',
          sender: 'Supervisor Salam', 
          role: 'Security Supervisor', 
          roleLabelBn: 'সিকিউরিটি ইন-চার্জ',
          roleLabelEn: 'Security Supervisor',
          bg: 'bg-zinc-900 text-amber-500', 
          text: language === 'bn' 
            ? 'শিফট পরিবর্তন সম্পন্ন। রাত ৮:০০ টা থেকে নতুন ৪ জন নাইট গার্ড ডিউটিতে যোগদান করেছেন এবং সিসিটিভি সিঙ্ক ওকে।' 
            : 'Shift handover successful. Night patrol crew of 4 security guards is active. All boundary gates verified locked.',
          time: '08:05 PM'
        }
      ]
    },
    {
      id: 'parking_mgmt',
      icon: Car,
      displayName: 'Parking Management',
      displayNameBn: 'পার্কিং ও গাড়ি ব্যবস্থাপনা (Parking)',
      category: 'utilities',
      categoryLabelBn: 'হ্যান্ডিম্যান ও সাহায্য',
      categoryLabelEn: 'Utilities Wing',
      objectiveBn: 'পার্কিং স্লট বরাদ্দকরণ, ভিজিটর বুকিং, গাড়ি রেজিস্ট্রেশন ডাটাবেজ এবং গাড়ি পার্কিং নিয়ে বিরোধ সমাধান।',
      objectiveEn: 'Compound parking slot allocations, overnight visitor car registers, sticker distributions, and blockage resolution.',
      membersBn: 'গাড়ির মালিকবৃন্দ এবং সিকিউরিটি সুপারভাইজার টিম',
      membersEn: 'Vehicle Owners, Parking Committee, Gate Guard Staff',
      permissions: {
        residents: language === 'bn' ? 'পোস্ট করতে পারবেন' : 'Post Allowed',
        committee: language === 'bn' ? 'পোস্ট করতে পারবেন' : 'Post Allowed',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      messages: [
        { 
          id: 'park-1',
          sender: 'Imran Zakaria (C-201)', 
          role: 'Resident', 
          roleLabelBn: 'বাসিন্দা',
          roleLabelEn: 'Resident',
          bg: 'bg-zinc-800 text-slate-300', 
          text: language === 'bn' 
            ? 'আমার ভাই আজ রাতে বাড়ি আসবেন। ওনার ব্যক্তিগত গাড়িটি সাময়িকভাবে ভিজিটর স্লট নং ০৪ এ পার্ক করতে দেওয়ার জন্য গেস্ট অ্যাপ্রুভাল চাচ্ছি।' 
            : 'My family is driving in tonight. Requesting a provisional permit to utilize Visitor Parking Space #04 overnight.',
          time: '03:10 PM'
        }
      ]
    },
    {
      id: 'finance_updates',
      icon: Landmark,
      displayName: 'Finance Updates',
      displayNameBn: 'অর্থ ও ফান্ড ট্র্যাকিং (Finance Updates)',
      category: 'management',
      categoryLabelBn: 'কমিটি ও ব্যবস্থাপনা',
      categoryLabelEn: 'Management Board',
      objectiveBn: 'বিল বকেয়া তাগিদ, ফান্ড ব্যালেন্সের সাপ্তাহিক স্থিতি বিলি এবং বাৎসরিক অডিট রিপোর্ট প্রকাশ।',
      objectiveEn: 'Outstanding bill collection prompts, treasury summaries, monthly expenditure disclosures, and balance sheet publications.',
      membersBn: 'কোষাধ্যক্ষ, একাউন্টিং সার্ভিস এবং সাধারণ সদস্য',
      membersEn: 'Treasurer, Accounting Team, and audited Members',
      permissions: {
        residents: language === 'bn' ? 'শুধুমাত্র ভিউ' : 'View Only',
        committee: language === 'bn' ? 'ব্যবস্থাপনা ও অডিট' : 'Manage & Audit',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      messages: [
        { 
          id: 'fin-1',
          sender: language === 'bn' ? 'কোষাধ্যক্ষ (নাসির উদ্দিন)' : 'Treasurer (Nasir Uddin)', 
          role: 'Treasurer', 
          roleLabelBn: 'কোষাধ্যক্ষ',
          roleLabelEn: 'Treasurer',
          bg: 'bg-slate-900 text-[#D4AF37]', 
          text: language === 'bn' 
            ? 'সোসাইটির ফান্ড খাতা হতে মোট ৫,৮০,০০০ টাকার ব্যালেন্স সফলভাবে সংরক্ষিত স্থায়ী ব্যাংকিং একাউন্টে মেয়াদি আমানত হিসেবে ডিপোজিট করা হয়েছে।' 
            : 'A ledger sum of 580,000 BDT from the reserve capital has been successfully placed into our banks high-yield fixed depot account.',
          time: 'Wednesday'
        }
      ]
    },
    {
      id: 'community_events',
      icon: Calendar,
      displayName: 'Community Events',
      displayNameBn: 'উৎসব ও সামাজিক অনুষ্ঠানাবলী (Events)',
      category: 'community',
      categoryLabelBn: 'মূল হাব',
      categoryLabelEn: 'Main Hub',
      objectiveBn: 'ঈদ পুনর্মিলনী, জাতীয় দিবস উদযাপন, ক্রীড়া ইভেন্ট, শীতকালীন মেলা এবং ভবনের চ্যারিটি কার্যক্রম পরিকল্পনা।',
      objectiveEn: 'Eid receptions, national day galas, compound sports events, voluntary blood drives, and children color contents coordination.',
      membersBn: 'সকল বাসিন্দা এবং কালচারাল উপকমিটি',
      membersEn: 'All Residents and Volunteer Cultural Subcommittees',
      permissions: {
        residents: language === 'bn' ? 'পোস্ট করতে পারবেন' : 'Post Permitted',
        committee: language === 'bn' ? 'পোস্ট করতে পারবেন' : 'Post Permitted',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      messages: [
        { 
          id: 'eve-1',
          sender: 'Tasnim Sultana (D-101)', 
          role: 'Resident', 
          roleLabelBn: 'বাসিন্দা',
          roleLabelEn: 'Resident',
          bg: 'bg-zinc-800 text-slate-300', 
          text: language === 'bn' 
            ? 'বাচ্চাদের জন্য আর্ট কম্পিটিশন এর রেজিস্ট্রেশন ফর্মটি ডাউনলোড লিঙ্ক বা প্রিন্ট কপি কি গার্ড রুমে পাওয়া যাবে?' 
            : 'Will the physical registration form for the children sketch contest be made available at the reception desk?',
          time: 'Friday'
        }
      ]
    },
    {
      id: 'emergency_alert',
      icon: Flame,
      displayName: 'Emergency Alert',
      displayNameBn: 'জরুরি সতর্কতা সংকেত (Emergency)',
      category: 'emergency',
      categoryLabelBn: 'জরুরি অবস্থা',
      categoryLabelEn: 'Emergency Response',
      objectiveBn: 'অগ্নি নিরাপত্তা সতর্কতা, গুরুতর বিদ্যুৎ বিপর্যয়, পানি সংকট বা কোনো প্রাকৃতিক দুর্যোগে দ্রুত সচেতনতা তৈরি।',
      objectiveEn: 'Fire drills, instant utility outages warnings, medical contact coordination, and immediate security threat awareness.',
      membersBn: 'সোসাইটি রেসপন্স টিম, সিকিউরিটি গার্ডস এবং সাধারণ বাসিন্দা',
      membersEn: 'Administrative board, on-duty Security supervisors, and all registered Residents',
      permissions: {
        residents: language === 'bn' ? 'শুধুমাত্র ভিউ' : 'View Only',
        committee: language === 'bn' ? 'পোস্ট করার অনুমতি' : 'Post Allowed',
        admin: language === 'bn' ? 'সব ধরণের নিয়ন্ত্রণ' : 'Full Control'
      },
      messages: [
        { 
          id: 'emerg-1',
          sender: 'Emergency Dispatcher', 
          role: 'System Bot', 
          roleLabelBn: 'সিস্টেম বট',
          roleLabelEn: 'System Bot',
          bg: 'bg-red-950 text-red-200', 
          text: language === 'bn' 
            ? 'জরুরি নোটিশ: আগামীকাল সকাল ৯:০০ টা থেকে দুপুর ১:০০ টা পর্যন্ত ভবনের প্রধান সাব-স্টেশন নিয়মিত সংস্কারের জন্য সম্পূর্ণ বিদ্যুৎ সরবরাহ বন্ধ থাকবে।' 
            : 'Critical Outage: Society primary power substation will undergo scheduled hardware maintenance tomorrow from 9:00 AM to 1:00 PM. Elevators will run on backup generators.',
          time: '04:11 PM'
        }
      ]
    }
  ]);

  // Hook into our live sign-in state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, t) => {
        setToken(t);
        setNeedsAuth(false);
      },
      () => {
        setToken(null);
        setNeedsAuth(true);
        setSpaces([]);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (token && !needsAuth) {
      fetchSpaces(token);
    }
  }, [token, needsAuth]);

  const fetchSpaces = async (t: string) => {
    setLoading(true);
    setError(null);
    setIsSimulated(false);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        throw new Error(language === 'bn' ? 'ফলাফল আনতে ব্যর্থ হয়েছে' : 'Failed to retrieve spaces.');
      }
      const data = await res.json();
      setSpaces(data.spaces || []);
      setIsSimulated(false);
    } catch (err: any) {
      console.warn('Google Chat Live API returned error, showing simulated sandbox channels.', err);
      setIsSimulated(true);
      setError(null);
      // We fall back automatically to the custom pre-configured society channels specified
      setSpaces(simulatedSpaces);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError(language === 'bn' 
          ? 'সাইন-ইন উইন্ডোটি বন্ধ করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন এবং সাইন-ইন প্রক্রিয়াটি সম্পন্ন করুন।' 
          : 'The sign-in popup was closed before completion. Please try again and complete the sign-in.');
      } else if (err.code === 'auth/blocked-by-popup-blocker') {
        setError(language === 'bn'
          ? 'পপ-আপ ব্লকার দ্বারা সাইন-ইন উইন্ডোটি ব্লক করা হয়েছে। অনুগ্রহ করে আপনার ব্রাউজারে পপ-আপ চালুর অনুমতি দিন।'
          : 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setError(language === 'bn' ? 'লগইন ব্যর্থ হয়েছে।' : 'Login failed. Provide correct permissions.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
  };

  // Switch sandbox channel helper
  const handleSelectSimulatedSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
  };

  const getFilteredSpaces = () => {
    const spacesList = needsAuth ? simulatedSpaces : (spaces.length > 0 ? spaces : simulatedSpaces);
    if (activeCategoryFilter === 'all') return spacesList;
    return spacesList.filter(s => s.category === activeCategoryFilter);
  };

  // Live sandbox simulated message poster helper
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const handleEditMessage = (msgId: string, oldText: string) => {
    setEditingMsgId(msgId);
    setEditingText(oldText);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editingText.trim()) return;
    setSimulatedSpaces(prev => {
      return prev.map(ch => {
        if (ch.id === activeSpaceId) {
          return {
            ...ch,
            messages: ch.messages.map(m => {
              const currentId = m.id || `${m.sender}-${m.time}`;
              if (currentId === msgId) {
                return { ...m, text: editingText };
              }
              return m;
            })
          };
        }
        return ch;
      });
    });
    setEditingMsgId(null);
    setEditingText('');
  };

  const handleDeleteMessage = (msgId: string) => {
    const confirmMsg = language === 'bn'
      ? 'আপনি কি নিশ্চিতভাবে এই বার্তাটি মুছে ফেলতে চান?'
      : 'Are you sure you want to delete this message?';
    if (!window.confirm(confirmMsg)) return;

    setSimulatedSpaces(prev => {
      return prev.map(ch => {
        if (ch.id === activeSpaceId) {
          return {
            ...ch,
            messages: ch.messages.filter(m => {
              const currentId = m.id || `${m.sender}-${m.time}`;
              return currentId !== msgId;
            })
          };
        }
        return ch;
      });
    });
  };

  const handleSendSimulatedMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const targetName = userName.trim() || (language === 'bn' ? 'নামহীন মেম্বার' : 'Astha Resident');
    const targetRole = userRole;

    const newMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      sender: targetName,
      role: targetRole,
      roleLabelBn: targetRole === 'Resident' ? 'বাসিন্দা' : targetRole === 'Committee' ? 'কমিটি মেম্বার' : 'এডমিন',
      roleLabelEn: targetRole,
      bg: targetRole === 'Admin' ? 'bg-red-950 text-red-100' : targetRole === 'Committee' ? 'bg-[#D4AF37]/35 text-slate-100 border border-[#D4AF37]/50' : 'bg-slate-850 text-slate-200',
      text: chatInput,
      time: new Date().toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setSimulatedSpaces(prev => {
      return prev.map(ch => {
        if (ch.id === activeSpaceId) {
          return {
            ...ch,
            messages: [...ch.messages, newMessage]
          };
        }
        return ch;
      });
    });

    setChatInput('');
  };

  // Helper template injector
  const injectTemplate = (text: string) => {
    setChatInput(text);
  };

  const getActiveSpace = (): Space => {
    return simulatedSpaces.find(s => s.id === activeSpaceId) || simulatedSpaces[0];
  };

  const activeSpace = getActiveSpace();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950 p-6 rounded-2xl border border-emerald-950/50">
        <div>
          <h1 className="text-2xl font-black text-[#D4AF37] tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-emerald-500" />
            {language === 'bn' ? 'ডিজিটাল সোসাইটি চ্যাট রুম' : 'Astha Google Chat Core'}
          </h1>
          <p className="text-xs font-bold text-slate-400 font-mono mt-1 uppercase tracking-wider">
            {language === 'bn' ? 'কমিউনিটি এলার্ট এবং পারস্পরিক আলোচনা উইজার্ড' : 'SOCIETY SPACES & CORE EMERGENCIES CONTROL CENTER'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
          {/* Main admin panel menu bar inside digital society chat room */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-emerald-950 px-5 py-3.5 rounded-2xl shadow-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveMainTab('chat')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                  activeMainTab === 'chat'
                    ? 'bg-emerald-600 border-[#D4AF37]/35 text-white font-extrabold shadow-lg shadow-emerald-950/40'
                    : 'bg-neutral-950 text-slate-300 border-emerald-950/65 hover:border-[#D4AF37]/30 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4 text-emerald-405" />
                <span>{language === 'bn' ? 'ডিজিটাল চ্যাট রুম' : 'Digital Chat Space'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('committee')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                  activeMainTab === 'committee'
                    ? 'bg-emerald-600 border-[#D4AF37]/35 text-white font-extrabold shadow-lg shadow-emerald-950/40'
                    : 'bg-neutral-950 text-slate-300 border-emerald-950/65 hover:border-[#D4AF37]/30 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4 text-[#D4AF37]" />
                <span>{language === 'bn' ? 'পরিচালনা পর্ষদ গ্যালারী' : 'Committee Board Gallery'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab('photogallery')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                  activeMainTab === 'photogallery'
                    ? 'bg-emerald-600 border-[#D4AF37]/35 text-white font-extrabold shadow-lg shadow-emerald-950/40'
                    : 'bg-neutral-950 text-slate-300 border-emerald-950/65 hover:border-[#D4AF37]/30 hover:text-white'
                }`}
              >
                <Camera className="h-4 w-4 text-rose-500 animate-pulse" />
                <span>{language === 'bn' ? 'বাসিন্দা ফটোগ্যালারী (৭২ ফ্ল্যাট)' : 'Resident Photo Gallery (72 Flats)'}</span>
              </button>
            </div>

            {/* Quick action for Admin inside top menu bar */}
            {activeMainTab === 'committee' && currentUser?.role === 'Admin' && (
              <button
                type="button"
                onClick={openAddCommitteeModal}
                className="flex items-center gap-2 rounded-xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black px-4.5 py-2.5 text-xs font-black uppercase tracking-wider shadow-md transform active:scale-95 transition-all cursor-pointer border border-[#D4AF37]/30"
              >
                <Plus className="h-4 w-4 text-black stroke-[3]" />
                <span>{language === 'bn' ? 'সদস্য যোগ করুন' : 'Add Elected Officer'}</span>
              </button>
            )}

            {/* General Admin status bar */}
            {currentUser?.role === 'Admin' && activeMainTab !== 'committee' && (
              <div className="flex items-center gap-2 text-[10px] font-mono bg-emerald-950/60 border border-emerald-900/60 px-3 py-1.5 rounded-lg text-emerald-400 font-bold uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>{language === 'bn' ? 'এডমিন উইং সক্রিয়' : 'Admin Control Panel Active'}</span>
              </div>
            )}
          </div>

          {activeMainTab === 'chat' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* LEFT SIDEBAR: Channels Categories and List */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                
                {/* Category selection */}
                <div className="bg-neutral-900 border border-emerald-950/40 p-4 rounded-xl space-y-2">
                  <span className="block text-[10px] font-mono text-[#D4AF37] uppercase font-black tracking-wider mb-2">
                    {language === 'bn' ? 'অনুসন্ধান ফিল্টার' : 'FILTER SPACES'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'all', title: language === 'bn' ? 'সকল স্পেস ({count})' : 'All ({count})', val: 'all' },
                      { id: 'community', title: language === 'bn' ? 'কমিউনিটি' : 'Community', val: 'community' },
                      { id: 'management', title: language === 'bn' ? 'ব্যবস্থাপনা' : 'Management', val: 'management' },
                      { id: 'utilities', title: language === 'bn' ? 'সহায়তা' : 'Support', val: 'utilities' },
                      { id: 'emergency', title: language === 'bn' ? 'জরুরি' : 'Emergency', val: 'emergency' }
                    ].map(cat => {
                      const count = cat.val === 'all' 
                        ? simulatedSpaces.length 
                        : simulatedSpaces.filter(s => s.category === cat.val).length;
                      const isActive = activeCategoryFilter === cat.val;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategoryFilter(cat.val)}
                          className={`text-[11px] font-bold text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                            isActive 
                              ? 'bg-emerald-600 text-white shadow-md font-black' 
                              : 'bg-neutral-950 text-slate-400 hover:text-white hover:bg-neutral-850'
                          }`}
                        >
                          <span>{cat.title.replace('{count}', String(count))}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* List of Spaces */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col" style={{ minHeight: '400px' }}>
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-xs font-black text-slate-700 tracking-tight flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-emerald-600" />
                      {language === 'bn' ? 'সোসাইটি ড্রয়ার চ্যানেল' : 'Pre-configured Channels'}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded">
                      {getFilteredSpaces().length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/50">
                    {getFilteredSpaces().map(space => {
                      const IconComp = space.icon || MessageSquare;
                      const isActive = space.id === activeSpaceId;
                      return (
                        <button
                          key={space.id}
                          onClick={() => handleSelectSimulatedSpace(space.id)}
                          className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer border ${
                            isActive 
                              ? 'bg-emerald-950 border-emerald-900 text-white shadow-md' 
                              : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-700'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-emerald-900 border border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                              {language === 'bn' ? space.displayNameBn : space.displayName}
                            </h4>
                            <p className={`text-[9.5px] mt-0.5 font-mono capitalize tracking-wider ${isActive ? 'text-emerald-400 font-extrabold' : 'text-[#856404] font-bold'}`}>
                              {space.category === 'emergency' ? (language === 'bn' ? '🚨 জরুরি' : '🚨 EMERGENCY') : space.category.toUpperCase()}
                            </p>
                            <p className={`text-[10.5px] line-clamp-1 mt-1 leading-none ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                              {language === 'bn' ? space.objectiveBn : space.objectiveEn}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT VIEW: Space Details & Live Discussion Playground */}
              <div className="lg:col-span-8 flex flex-col space-y-4">
                
                {/* Master Detail Banner of active Space */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-emerald-950 border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-md">
                        {React.createElement(activeSpace.icon || MessageSquare, { className: "h-6 w-6" })}
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">
                          {language === 'bn' ? activeSpace.displayNameBn : activeSpace.displayName}
                        </h2>
                        <p className="text-[10px] text-[#856404] font-mono tracking-widest font-black uppercase mt-0.5">
                          {language === 'bn' ? `কমিউনিটি গ্রুপ • শ্রেণী: ${activeSpace.category.toUpperCase()}` : `COMMUNITY HUB • TYPE: ${activeSpace.category}`}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <span className="text-[9px] font-mono font-bold bg-[#D4AF37]/10 text-[#856404] px-2.5 py-1 rounded border border-[#D4AF37]/20 uppercase">
                        {language === 'bn' ? 'ভার্চুয়াল গ্রুপ সক্রিয়' : 'SOCIETY BOUND'}
                      </span>
                    </div>
                  </div>

                  {/* Objective Box */}
                  <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-900/10 text-xs">
                    <p className="text-slate-700 leading-relaxed">
                      <strong className="text-emerald-950 uppercase tracking-wider font-bold block mb-1">
                        {language === 'bn' ? 'গ্রুপের উদ্দেশ্য ও ব্যবহারের পরিধি:' : 'SPACE OBJECTIVE & PROTOCOL:'}
                      </strong>
                      {language === 'bn' ? activeSpace.objectiveBn : activeSpace.objectiveEn}
                    </p>
                    <p className="text-slate-500 mt-2 font-mono text-[10.5px]">
                      <strong>{language === 'bn' ? 'অংশগ্রহণকারী সদস্যবৃন্দ:' : 'Target Audience:'}</strong> {language === 'bn' ? activeSpace.membersBn : activeSpace.membersEn}
                    </p>
                  </div>

                  {/* Recommended Matrix Table Visualized */}
                  <div>
                    <span className="block text-[8px] font-mono text-slate-400 uppercase font-black tracking-widest mb-2.5">
                      {language === 'bn' ? 'অনুমতি বিন্যাস এবং ম্যাট্রিক্স রোল' : 'RECOMMENDED PERMISSION MATRIX'}
                    </span>
                    
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="bg-slate-50 hover:bg-slate-100 p-2 text-center rounded-xl border border-slate-200/60 transition-all flex flex-col justify-between">
                        <span className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wide">
                          {language === 'bn' ? 'বাসিন্দা' : 'Residents'}
                        </span>
                        <span className="text-xs font-black text-slate-800 mt-1 block">
                          {activeSpace.permissions.residents}
                        </span>
                      </div>

                      <div className="bg-emerald-50/60 p-2 text-center rounded-xl border border-[#D4AF37]/20 flex flex-col justify-between">
                        <span className="block text-[9px] font-mono font-black text-[#856404] uppercase tracking-wide">
                          {language === 'bn' ? 'কমিটি সদস্য' : 'Committee'}
                        </span>
                        <span className="text-xs font-black text-emerald-950 mt-1 block">
                          {activeSpace.permissions.committee}
                        </span>
                      </div>

                      <div className="bg-emerald-950 hover:bg-emerald-900 p-2 text-center rounded-xl border border-emerald-900 text-white transition-all flex flex-col justify-between">
                        <span className="block text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wide">
                          {language === 'bn' ? 'এডমিন উইং' : 'Site Admin'}
                        </span>
                        <span className="text-xs font-black text-[#D4AF37] mt-1 block">
                          {activeSpace.permissions.admin}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance categories thread template if exists */}
                  {activeSpace.threadCategories && (
                    <div className="bg-neutral-950 p-4 rounded-xl border border-emerald-950/30 text-xs">
                      <span className="block text-[9.5px] font-mono text-[#D4AF37] uppercase font-black tracking-widest mb-2">
                        {language === 'bn' ? 'টিকিট ক্যাটাগরি এবং ক্যাপিটাল লেজার' : 'SUPPORT CATEGORIES & THREAD bluePRINT'}
                      </span>
                      
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        {activeSpace.threadCategories.map((tCat, i) => (
                          <span key={i} className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-[10px] text-emerald-400 font-mono font-bold rounded border border-emerald-900">
                            📁 {tCat}
                          </span>
                        ))}
                      </div>

                      {activeSpace.exampleFormat && (
                        <div className="mt-1 space-y-1 p-2 bg-neutral-900 rounded border border-slate-850">
                          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            {language === 'bn' ? 'নমুনা টিকিট ফরম্যাট (ইনপুট বক্সে কপি করতে ক্লিক করুন):' : 'Suggested ticket format (Click to load template):'}
                          </span>
                          <button
                            type="button"
                            onClick={() => activeSpace.exampleFormat && injectTemplate(activeSpace.exampleFormat)}
                            className="w-full text-left font-mono text-[10.5px] text-emerald-400 whitespace-pre-wrap p-2 bg-black/60 rounded border border-emerald-950/40 hover:bg-black/80 transition-all cursor-pointer block"
                          >
                            {activeSpace.exampleFormat}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Simulated Live Thread conversation component */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 flex flex-col overflow-hidden shadow-sm flex-1" style={{ minHeight: '380px' }}>
                  
                  {/* Thread header */}
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-250 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                      <span className="text-[10px] font-mono font-black text-emerald-700 tracking-wider uppercase">
                        {language === 'bn' ? 'সরাসরি ফোরাম স্যান্ডবক্স রিঅ্যাক্ট' : 'LIVE FORUM DISCUSSION SANDBOX'}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-mono text-slate-600">
                      {activeSpace.messages.length} {language === 'bn' ? 'টি অ্যাক্টিভ বার্তা' : 'Live Statements'}
                    </span>
                  </div>

                  {/* Chat messages viewport */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 flex flex-col justify-end bg-white">
                    {activeSpace.messages.map((msg, idx) => {
                      const msgId = msg.id || `${msg.sender}-${msg.time}-${idx}`;
                      const isEditing = editingMsgId === msgId;

                      return (
                        <div key={idx} className="flex gap-3 items-start animate-fadeIn max-w-[85%] self-start text-left group">
                          <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${msg.bg || 'bg-slate-800 text-white'}`}>
                            {msg.sender.charAt(0)}
                          </div>
                          
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-800">
                                {msg.sender}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] leading-none font-black tracking-wide bg-emerald-950/80 text-emerald-400 border border-emerald-900/60 font-mono uppercase">
                                {language === 'bn' ? msg.roleLabelBn : msg.roleLabelEn}
                              </span>
                              {msg.time && (
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {msg.time}
                                </span>
                              )}

                              {/* Admin controls */}
                              {userRole === 'Admin' && !isEditing && (
                                <div className="flex items-center gap-1 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditMessage(msgId, msg.text)}
                                    className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-all cursor-pointer"
                                    title={language === 'bn' ? 'এডিট করুন' : 'Edit message'}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msgId)}
                                    className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-all cursor-pointer"
                                    title={language === 'bn' ? 'ডিলিট করুন' : 'Delete message'}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="bg-slate-50 border border-emerald-500/30 p-2.5 rounded-xl space-y-2 mt-1 min-w-[240px] sm:min-w-[320px]">
                                <textarea
                                  rows={2}
                                  className="w-full text-[14px] bg-white border border-slate-300 rounded p-1.5 focus:outline-none focus:border-emerald-500 text-slate-900 font-sans resize-none"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(msgId)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 px-2.5 rounded text-xs font-bold cursor-pointer flex items-center gap-1 shadow-sm transition-all"
                                  >
                                    <Check className="h-3 w-3" />
                                    {language === 'bn' ? 'সংরক্ষণ' : 'Save'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMsgId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1 px-2.5 rounded text-xs font-bold cursor-pointer flex items-center gap-1 transition-all"
                                  >
                                    <X className="h-3 w-3" />
                                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-r-xl rounded-bl-xl text-black text-[16px] leading-relaxed font-sans font-normal whitespace-pre-wrap">
                                {msg.text}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message inputs form panels */}
                  <form onSubmit={handleSendSimulatedMessage} className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
                    
                    {/* Meta controllers: Set current test author identities */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-1.5">
                      <div>
                        <label className="block text-[8px] font-mono text-slate-500 uppercase font-black tracking-wider mb-1">
                          {language === 'bn' ? 'ব্যবহারকারী নাম' : 'YOUR MOCK NAME'}
                        </label>
                        <input
                          type="text"
                          className="w-full text-[11px] font-sans font-bold bg-white border border-slate-300 text-slate-800 p-1 px-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
                          placeholder={language === 'bn' ? 'যেমন: রাফি আদনান' : 'e.g. Rafi Adnan'}
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-mono text-slate-500 uppercase font-black tracking-wider mb-1">
                          {language === 'bn' ? 'সদস্যের ডেসিগনেশন' : 'ROLE DESIG'}
                        </label>
                        <select
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value)}
                          className="w-full text-[11px] font-bold bg-white border border-slate-300 text-slate-850 p-1 px-2 rounded-lg focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Resident">{language === 'bn' ? 'Resident (স্থায়ী বাসিন্দা)' : 'Resident'}</option>
                          <option value="Committee">{language === 'bn' ? 'Committee (কমিটি মেম্বার)' : 'Committee'}</option>
                          <option value="Admin">{language === 'bn' ? 'Adviser (এডমিন স্তর)' : 'Admin'}</option>
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex items-end">
                        <span className="text-[10px] text-slate-550 block leading-tight pb-1 italic font-sans font-medium">
                          * {language === 'bn' ? 'আইডেন্টিটি স্যান্ডবক্স অ্যাক্টিভ।' : 'Identity sandbox active.'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <textarea
                        required
                        style={{ minHeight: '44px' }}
                        className="flex-1 bg-white border border-slate-305 p-2.5 px-3.5 rounded-xl text-[16px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-left font-sans resize-none"
                        placeholder={
                          activeSpace.id === 'maintenance_requests' 
                            ? (language === 'bn' ? 'নমুনা ফরম্যাটে টিকিট তথ্য লিখুন...' : 'Enter ticket information in requested formula...')
                            : (language === 'bn' ? 'আলোচনা মেসেজ টাইপ করুন এবং পুশ করুন...' : `Chat directly inside #${activeSpace.displayName}...`)
                        }
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="h-11 w-11 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-550 text-white flex items-center justify-center transform active:scale-95 transition-all shadow-md cursor-pointer border border-emerald-500/30"
                        title={language === 'bn' ? 'মন্তব্য পেস্ট করুন' : 'Push comment to thread'}
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          ) : activeMainTab === 'committee' ? (
            <div className="space-y-6">
              {/* Admin Panel / Menu Bar inside the gallery */}
              <div className="p-4 rounded-xl bg-neutral-950/45 border border-emerald-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans font-medium">
                  {language === 'bn'
                    ? 'আস্থা টুইন টাওয়ার্সের নির্বাচিত কমিটির সদস্য ও কর্মকর্তাদের পূর্ণাঙ্গ প্রোফাইল গ্যালারী। যেকোনো বাসিন্দা ছবির নিচে প্রদর্শিত নাম ও পর্ষদ পদের মাধ্যমে সহজেই যেকোনো কর্মকর্তার সাথে যোগাযোগ করতে পারবেন।'
                    : 'A rich visual showcase of the officially elected committee and administrative executive members. Residents can easily view their digital cards containing headshots, credentials, and contact shortcuts.'
                  }
                </p>
                
                {currentUser?.role === 'Admin' && (
                  <button
                    type="button"
                    onClick={openAddCommitteeModal}
                    className="shrink-0 text-xs font-black bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black px-4 py-2 border border-[#D4AF37]/25 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{language === 'bn' ? 'কর্মকর্তা যোগ করুন' : 'Add Executive Officer'}</span>
                  </button>
                )}
              </div>

              {/* Photo Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {committeeMembers.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-dashed border-emerald-950 py-16 text-center text-xs text-slate-500 font-mono">
                    {language === 'bn'
                      ? 'কোনো নির্বাচিত কর্মকর্তা বা কমিটির সদস্য প্রকল্প ডাটাবেজে পাওয়া যায়নি।'
                      : 'No elected committee officers found in the database. Please enlist profiles.'
                    }
                  </div>
                ) : (
                  committeeMembers.map((cMember: any, index: number) => {
                    const name = language === 'bn' ? (cMember.nameBn || cMember.nameEn) : (cMember.nameEn || cMember.nameBn);
                    const role = language === 'bn' ? (cMember.roleBn || cMember.roleEn) : (cMember.roleEn || cMember.roleBn);
                    const photo = cMember.photoUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face`;

                    return (
                      <div 
                        key={cMember.id || index}
                        className="rounded-2xl border border-emerald-950 bg-neutral-950/45 overflow-hidden flex flex-col justify-between group hover:border-[#D4AF37]/60 hover:shadow-xl hover:shadow-black/60 transition-all duration-300 relative"
                      >
                        {/* Elite Golden Ring Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-widest font-mono">
                            {language === 'bn' ? 'নির্বাচিত' : 'ELECTED'}
                          </span>
                        </div>

                        <div>
                          {/* Image Display Frame */}
                          <div className="relative aspect-square w-full bg-slate-900 border-b border-emerald-950 overflow-hidden">
                            <img 
                              src={photo} 
                              alt={name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop`;
                              }}
                            />
                            
                            {/* Photo Change Overlay Trigger */}
                            {currentUser?.role === 'Admin' && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPhotoEditMember(cMember);
                                    setPhotoEditUrl(cMember.photoUrl || '');
                                  }}
                                  className="bg-neutral-900 text-white hover:text-[#D4AF37] border border-emerald-900/50 hover:border-[#D4AF37]/60 rounded-xl px-3 py-2 text-xs font-bold font-sans flex flex-col items-center gap-1.5 shadow-xl transform transition-all cursor-pointer active:scale-95"
                                  title={language === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Photo'}
                                >
                                  <Camera className="h-5 w-5" />
                                  <span>{language === 'bn' ? 'ছবি পরিবর্তন' : 'Change Photo'}</span>
                                </button>
                              </div>
                            )}

                            {/* Linear dark gradient overlay */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 pt-10">
                              <h4 className="text-sm font-black text-white tracking-tight drop-shadow-md leading-tight">{name}</h4>
                              <p className="text-[11px] text-[#D4AF37] font-semibold mt-1 uppercase tracking-wide font-sans">{role}</p>
                            </div>
                          </div>

                          {/* Info Body */}
                          <div className="p-4 space-y-2.5">
                            {/* Multi-language view */}
                            <div className="text-[10px] text-slate-550 space-y-0.5 border-b border-emerald-950/60 pb-2.5 font-sans">
                              {cMember.nameEn && cMember.nameBn && (
                                <div className="truncate"><span className="font-mono text-[8.5px] text-[#D4AF37]/65 uppercase font-bold mr-1">BN:</span> <span className="text-slate-400 font-medium">{cMember.nameBn}</span></div>
                              )}
                              {cMember.roleEn && cMember.roleBn && (
                                <div className="truncate"><span className="font-mono text-[8.5px] text-[#D4AF37]/65 uppercase font-bold mr-1">ROLE EN:</span> <span className="text-slate-400 font-medium">{cMember.roleEn}</span></div>
                              )}
                            </div>

                            {/* Contact Details beneath headshots */}
                            <div className="space-y-1.5 text-xs text-slate-300 pt-0.5 font-sans">
                              {cMember.flatNumber && (
                                <div className="flex items-center gap-2">
                                  <Home className="h-3.5 w-3.5 text-[#D4AF37]/80 shrink-0" />
                                  <span className="font-medium text-slate-200">{language === 'bn' ? 'ফ্ল্যাট নম্বর:' : 'Flat No:'} {cMember.flatNumber}</span>
                                </div>
                              )}
                              
                              {cMember.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 text-emerald-400/80 shrink-0" />
                                  <span className="font-mono text-[11px] font-medium text-slate-300">{cMember.phone}</span>
                                </div>
                              )}

                              {cMember.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5 text-emerald-400/80 shrink-0" />
                                  <span className="truncate text-slate-300 block" title={cMember.email}>{cMember.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Row inside card */}
                        {currentUser?.role === 'Admin' && (
                          <div className="px-4 pb-4 pt-3 border-t border-emerald-950/50 flex justify-between items-center gap-2 bg-black/25 shrink-0">
                            {/* Sequence Sorting arrows */}
                            <div className="flex items-center gap-1 font-mono">
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
                                className="p-1 px-2 border border-emerald-950 rounded hover:border-[#D4AF37]/45 bg-neutral-900 text-slate-400 hover:text-[#D4AF37] cursor-pointer disabled:opacity-20"
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
                                className="p-1 px-2 border border-emerald-950 rounded hover:border-[#D4AF37]/45 bg-neutral-900 text-slate-400 hover:text-[#D4AF37] cursor-pointer disabled:opacity-20"
                                title={language === 'bn' ? 'নিচে নিন' : 'Move Down'}
                              >
                                ▼
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditCommitteeModal(cMember)}
                                className="p-1.5 border border-emerald-900 hover:border-[#D4AF37]/40 rounded text-slate-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all cursor-pointer block"
                                title={language === 'bn' ? 'এডিট করুন' : 'Edit Member'}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCommitteeMember(cMember.id)}
                                className="p-1.5 border border-rose-950 text-rose-500 hover:bg-rose-950/20 rounded transition-all cursor-pointer"
                                title={language === 'bn' ? 'অপসারণ করুন' : 'Remove Member'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Roles and Responsibilities Grid */}
              <div className="mt-8 space-y-6 pt-8 border-t border-emerald-950/80">
                <div className="flex flex-col gap-2">
                  <h2 className="text-[18px] font-black text-white font-sans tracking-tight flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                    {language === 'bn' ? 'প্রস্তাবিত পদবী ও দায়িত্বসমূহ' : 'Proposed Designations & Responsibilities'}
                  </h2>
                  <p className="text-[13px] text-slate-400 font-sans">
                    {language === 'bn' 
                      ? 'আস্থা টুইন টাওয়ারসের ডিজিটাল কমিউনিটি চ্যাটরুমের স্পেস বা সেকশনের জন্য প্রস্তাবিত ৯টি পদবী ও তাদের দায়িত্বের তালিকা:' 
                      : 'Proposed designations and responsibilities for the sections of Astha Twin Towers Digital Community Chatroom:'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: '1', rank: '১', bn: 'চেয়ারম্যান (Chairman)', en: 'Chairman', descBn: 'সামগ্রিক তদারকি ও নীতি নির্ধারণ।', descEn: 'Overall supervision and policy making.' },
                    { id: '2', rank: '২', bn: 'প্রেসিডেন্ট (President)', en: 'President', descBn: 'প্রশাসনিক ও উন্নয়নমূলক কার্যক্রমের নেতৃত্ব।', descEn: 'Leadership in administrative and developmental activities.' },
                    { id: '3', rank: '৩', bn: 'সেক্রেটারি (Secretary)', en: 'Secretary', descBn: 'অফিসিয়াল নথিপত্র ও পরিচালনা পর্ষদের সমন্বয়।', descEn: 'Coordination of official documents and board of directors.' },
                    { id: '4', rank: '৪', bn: 'ম্যানেজমেন্ট অ্যাডমিন (Management Admin)', en: 'Management Admin', descBn: 'দৈনন্দিন কার্যক্রম ও অ্যাপ পরিচালনা।', descEn: 'Daily operations and app management.' },
                    { id: '5', rank: '৫', bn: 'নিরাপত্তা সুপারভাইজার (Security Supervisor)', en: 'Security Supervisor', descBn: 'সার্বিক নিরাপত্তা ও সিসিটিভি তদারকি।', descEn: 'Overall security and CCTV supervision.' },
                    { id: '6', rank: '৬', bn: 'অপারেশনস ম্যানেজার (Operations Manager)', en: 'Operations Manager', descBn: 'জেনারেটর, লিফট ও ইউটিলিটি রক্ষণাবেক্ষণ।', descEn: 'Generator, lift and utility maintenance.' },
                    { id: '7', rank: '৭', bn: 'হিসাব রক্ষক (Accounts Officer)', en: 'Accounts Officer', descBn: 'লেজার ও আর্থিক লেনদেন ব্যবস্থাপনা।', descEn: 'Ledger and financial transaction management.' },
                    { id: '8', rank: '৮', bn: 'কমিউনিটি রিলেশনস অফিসার (Community Relations Officer)', en: 'Community Relations Officer', descBn: 'বাসিন্দা ও স্টাফদের মধ্যে যোগাযোগ সমন্বয়।', descEn: 'Communication coordination among residents and staff.' },
                    { id: '9', rank: '৯', bn: 'সাপোর্ট সার্ভিসেস (Support Services)', en: 'Support Services', descBn: 'জরুরি অভিযোগ ও সাধারণ সেবা প্রদান।', descEn: 'Emergency complaints and general service provision.' }
                  ].map(role => (
                    <div key={role.id} className="rounded-xl border border-emerald-950/70 bg-neutral-950/40 p-5 flex flex-col items-start hover:border-[#D4AF37]/40 hover:bg-neutral-900/60 hover:shadow-[0_0_15px_rgba(34,197,94,0.05)] transition-all group relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-900/10 blur-xl group-hover:bg-[#D4AF37]/10 transition-all"></div>
                      <div className="text-[10px] font-black font-mono text-emerald-500/80 uppercase tracking-widest mb-1.5 group-hover:text-[#D4AF37] transition-colors">
                        {language === 'bn' ? `পদবী - ${role.rank}` : `ROLE 0${role.id}`}
                      </div>
                      <h4 className="text-[15px] font-black text-white font-sans tracking-tight mb-3 flex-1 flex items-center">
                        {language === 'bn' ? role.bn : role.en}
                      </h4>
                      <p className="text-[12px] text-slate-400 font-sans leading-relaxed border-t border-emerald-950/50 pt-2.5 w-full mt-auto group-hover:text-slate-300 transition-colors">
                        {language === 'bn' ? role.descBn : role.descEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn pb-16">
              {/* Header Info Block */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-950 border border-[#D4AF37]/35 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-990/10 blur-3xl rounded-full -z-10"></div>
                <div className="flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
                  <div>
                    <h2 className="text-[19px] font-black font-sans text-white tracking-tight flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)] animate-pulse" />
                      {language === 'bn' ? 'আস্থা টুইন টাওয়ার্স - বাসিন্দা ফটোগ্যালারী (৭২ ফ্ল্যাট)' : 'Astha Twin Towers - Resident Photo Gallery (72 Units)'}
                    </h2>
                    <p className="text-slate-400 text-xs font-sans mt-1.5 leading-relaxed max-w-3xl">
                      {language === 'bn' 
                        ? 'আস্থা টুইন টাওয়ার্সের ৭২টি ফ্ল্যাটের সম্মানিত মালিক এবং বাসিন্দাদের ছবি ও যোগাযোগের ডিরেক্টরি। ফ্ল্যাট বক্সে ক্লিক করে ছবি ও তথ্য আপলোড করে প্রোফাইল সাজাতে পারবেন।' 
                        : 'A rich visual showcase of the residents and flat owners across all 72 individual flat units. Click on any flat block below to edit/assign ownership details, contact info, or upload portrait photos.'}
                    </p>
                  </div>
                  
                  <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 px-4 rounded-xl shrink-0 text-center">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest block uppercase">
                      {language === 'bn' ? 'মোট আপলোডকৃত ছবি' : 'UPLOAD QUANTITY'}
                    </span>
                    <span className="text-xl font-mono font-black text-[#D4AF37]">
                      {members ? members.filter((m: any) => m.photoUrl && m.photoUrl.trim() !== '').length : 0} / 72
                    </span>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mt-6 pt-5 border-t border-emerald-950/80">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md">
                    <input 
                      type="text" 
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                      placeholder={language === 'bn' ? 'ফ্ল্যাট নম্বর বা নাম দিয়ে খুঁজুন...' : 'Search by flat number or name...'}
                      className="w-full bg-neutral-950 border border-emerald-950/70 p-2.5 pl-9 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#D4AF37]/50 focus:outline-none"
                    />
                    <span className="absolute left-3 top-3 text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </span>
                  </div>

                  {/* Floor Quick Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setGalleryFloorFilter(null)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        galleryFloorFilter === null 
                          ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37]' 
                          : 'bg-neutral-900 text-slate-400 border-emerald-950 hover:text-white'
                      }`}
                    >
                      {language === 'bn' ? 'সব ফ্লোর' : 'All Floors'}
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(floorNum => (
                      <button
                        key={floorNum}
                        type="button"
                        onClick={() => setGalleryFloorFilter(floorNum)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black font-mono transition-all cursor-pointer border ${
                          galleryFloorFilter === floorNum 
                            ? 'bg-emerald-600 border-[#D4AF37]/40 text-white' 
                            : 'bg-neutral-900 text-slate-400 border-emerald-950 hover:text-white'
                        }`}
                      >
                        {floorNum} {language === 'bn' ? 'তলা' : 'F'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid with exactly 72 custom styled boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {(() => {
                  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                  const renderedSlots: any[] = [];

                  for (let floor = 1; floor <= 9; floor++) {
                    for (let j = 0; j < 8; j++) {
                      const letter = letters[j];
                      const flatNum = `${floor}${letter}`;
                      
                      // Find flat details
                      const flatSpec = flats ? (flats.find((f: any) => f.number === flatNum) || {
                        number: flatNum,
                        floor: floor,
                        squareFeet: j === 0 || j === 1 ? 1800 : j === 2 || j === 3 ? 1550 : j === 4 || j === 5 ? 1450 : 1200,
                        status: 'vacant',
                        ownerName: 'Unassigned',
                        renterName: '',
                        phone: ''
                      }) : {
                        number: flatNum,
                        floor: floor,
                        squareFeet: j === 0 || j === 1 ? 1800 : j === 2 || j === 3 ? 1550 : j === 4 || j === 5 ? 1450 : 1200,
                        status: 'vacant',
                        ownerName: 'Unassigned',
                        renterName: '',
                        phone: ''
                      };

                      // Get any active registered member of this flat, priority to Owner
                      const flatMembers = members ? members.filter((m: any) => m.flatNumber === flatNum && m.status === 'Active') : [];
                      const flatOwner = flatMembers.find((m: any) => m.type === 'Owner') || flatMembers[0];

                      // Apply filters
                      if (galleryFloorFilter !== null && floor !== galleryFloorFilter) {
                        continue;
                      }

                      if (gallerySearch.trim() !== '') {
                        const searchLower = gallerySearch.toLowerCase();
                        const matchesFlat = flatNum.toLowerCase().includes(searchLower);
                        const matchesOwner = flatSpec.ownerName && flatSpec.ownerName.toLowerCase().includes(searchLower);
                        const matchesRenter = flatSpec.renterName && flatSpec.renterName.toLowerCase().includes(searchLower);
                        const matchesMember = flatOwner && flatOwner.name.toLowerCase().includes(searchLower);
                        if (!matchesFlat && !matchesOwner && !matchesRenter && !matchesMember) {
                          continue;
                        }
                      }

                      renderedSlots.push({ flatNum, flatSpec, flatOwner });
                    }
                  }

                  if (renderedSlots.length === 0) {
                    return (
                      <div className="col-span-full py-20 text-center text-xs text-slate-500 font-mono border border-dashed border-emerald-950 rounded-2xl">
                        {language === 'bn' ? 'কোনো মেলানো ফ্ল্যাট পাওয়া যায়নি!' : 'No matching flats found.'}
                      </div>
                    );
                  }

                  return renderedSlots.map(({ flatNum, flatSpec, flatOwner }) => {
                    const hasPhoto = flatOwner && flatOwner.photoUrl && flatOwner.photoUrl.trim() !== '';
                    const photo = hasPhoto ? flatOwner.photoUrl : null;
                    const residentName = flatOwner 
                      ? flatOwner.name 
                      : (flatSpec.ownerName !== 'Unassigned' ? flatSpec.ownerName : (language === 'bn' ? 'খালি / বরাদ্দ নেই' : 'Unassigned'));
                    
                    const isOccupied = flatSpec.status !== 'vacant' || flatOwner;
                    const typeBadge = flatOwner 
                      ? (flatOwner.type === 'Owner' ? (language === 'bn' ? 'মালিক' : 'Owner') : (language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant'))
                      : (flatSpec.status === 'occupied_owner' ? (language === 'bn' ? 'মালিক' : 'Owner') : flatSpec.status === 'occupied_tenant' ? (language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant') : null);

                    return (
                      <div 
                        key={flatNum}
                        onClick={() => {
                          const existing = flatOwner || (members && members.find((m: any) => m.flatNumber === flatNum));
                          setSelectedGalleryFlat({ flatNum, flatSpec, member: existing });
                          setFlatFormName(existing ? existing.name : (flatSpec.ownerName !== 'Unassigned' ? flatSpec.ownerName : ''));
                          setFlatFormPhone(existing ? existing.phone : flatSpec.phone || '');
                          setFlatFormPhoto(existing ? (existing.photoUrl || '') : '');
                          setFlatFormType(existing ? existing.type : 'Owner');
                          setFlatFormNid(existing ? (existing.nid || '') : '');
                          setFlatFormEmail(existing ? (existing.email || '') : '');
                        }}
                        className="rounded-2xl border border-emerald-950/80 bg-neutral-950/45 overflow-hidden flex flex-col justify-between group hover:border-[#D4AF37] hover:shadow-xl hover:shadow-black/75 hover:bg-neutral-900/60 transition-all duration-300 relative cursor-pointer"
                      >
                        {/* Elegant Corner Flat Number Label */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="rounded bg-neutral-950 text-[#D4AF37] border border-emerald-900/60 px-2 py-0.5 text-[10px] font-mono font-black shadow-md tracking-wider">
                            {flatNum}
                          </span>
                        </div>

                        {typeBadge && (
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <span className={`rounded px-1.5 py-0.5 text-[8.5px] font-black shadow-md uppercase tracking-wide border ${
                              typeBadge === 'Owner' || typeBadge === 'মালিক'
                                ? 'bg-amber-950/90 text-[#D4AF37] border-[#D4AF37]/35'
                                : 'bg-[#032e2c]/90 text-emerald-300 border-emerald-900/40'
                            }`}>
                              {typeBadge}
                            </span>
                          </div>
                        )}

                        <div>
                          {/* Image Box */}
                          <div className="relative aspect-square w-full bg-slate-950/80 border-b border-emerald-950/60 overflow-hidden flex items-center justify-center">
                            {photo ? (
                              <img 
                                src={photo} 
                                alt={residentName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop`;
                                }}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                                <div className="h-11 w-11 rounded-full bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-center text-[#D4AF37]/75">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                <span className="text-[8px] font-mono tracking-widest uppercase text-slate-500 group-hover:text-[#D4AF37] transition-all">
                                  {language === 'bn' ? 'ছবি নেই' : 'NO PROFILE'}
                                </span>
                              </div>
                            )}

                            {/* Camera Hover Trigger Overlay */}
                            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-neutral-950/80 backdrop-blur-[2px]">
                              <span className="text-[10px] font-bold text-white font-sans border border-[#D4AF37]/50 rounded-xl bg-[#D4AF37]/10 px-3 py-1.5 flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5 text-[#D4AF37]" />
                                {language === 'bn' ? 'যোগাযোগ ও ছবি' : 'DETAILS & PHOTO'}
                              </span>
                            </div>
                          </div>

                          {/* Details Wrapper */}
                          <div className="p-3.5 text-left space-y-1">
                            <div className="text-[12px] font-extrabold text-white truncate max-w-full group-hover:text-[#D4AF37] transition-colors leading-tight" title={residentName}>
                              {residentName}
                            </div>
                            <div className="text-[9.5px] text-slate-400 font-sans flex items-center justify-between">
                              <span>
                                {language === 'bn' ? `${flatSpec.floor} তলা` : `Floor ${flatSpec.floor}`}
                              </span>
                              <span className="font-mono text-slate-500">
                                {flatSpec.squareFeet} sft
                              </span>
                            </div>
                            
                            {isOccupied && (
                              <div className="text-[9px] font-mono text-emerald-400 font-semibold truncate pt-0.5">
                                {flatOwner?.phone || flatSpec.phone || (language === 'bn' ? 'যোগাযোগ নম্বর নেই' : 'No Phone')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Dynamic Pop-up Modal to Add or Edit Committee Members with Picture URLs */}
          {showCommitteeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
              <div className="w-full max-w-lg rounded-2xl border border-[#D4AF37]/35 bg-neutral-950 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black text-left">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
                  <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    {editingCommitteeMember 
                      ? (language === 'bn' ? 'কমিটি সদস্য এডিট করুন (গ্যালারি)' : 'Edit Member Gallery Details') 
                      : (language === 'bn' ? 'নতুন নির্বাচিত কমিটি সদস্য যোগ করুন (গ্যালারি)' : 'Add New Committee Member to Gallery')
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
                        className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none font-sans"
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
                        className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none font-sans"
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
                        className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
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
                        className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
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
                        className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans font-mono"
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
                        className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Photo URL Input & Live Preview Shortcut presets */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#D4AF37] font-mono block mb-1.5">Profile Picture Photo URL</label>
                      <input
                        type="url"
                        value={cmPhotoUrl}
                        onChange={(e) => setCmPhotoUrl(e.target.value)}
                        placeholder="Paste URL, e.g., https://images.unsplash.com/photo-..."
                        className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-emerald-950/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-neutral-950 px-2 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                          {language === 'bn' ? 'অথবা' : 'OR'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-400 font-mono block mb-1.5">
                        {language === 'bn' ? 'ডিভাইস থেকে ছবি নির্বাচন করুন' : 'Upload Local Photo'}
                      </label>
                      <label className="flex items-center justify-center w-full min-h-[36px] px-3 py-2 border border-dashed border-emerald-800 rounded bg-neutral-900/50 hover:bg-neutral-900 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold group-hover:text-[#D4AF37]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          {language === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন' : 'Click to Upload Image'}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCmPhotoUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Preset Avatar Selectors */}
                    <div className="p-2.5 bg-neutral-900 border border-emerald-950 rounded-xl flex flex-col gap-1.5 leading-none mt-2">
                      <span className="text-[9.5px] font-bold text-slate-400 block">{language === 'bn' ? 'অথবা নমুনা প্রফেশনাল ফটো সিলেক্ট করুন:' : 'Or tap a beautiful preset avatar headshot:'}</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          { name: 'Male A', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
                          { name: 'Male B', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
                          { name: 'Male C', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
                          { name: 'Male D', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face' },
                          { name: 'Male E', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face' },
                          { name: 'Female F', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face' },
                          { name: 'Female G', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face' }
                        ].map((presetPic, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setCmPhotoUrl(presetPic.url)}
                            className={`px-2 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                              cmPhotoUrl === presetPic.url 
                                ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                                : 'bg-neutral-950 text-slate-400 border-emerald-950 hover:border-slate-500'
                            }`}
                          >
                            {presetPic.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Associated Flat */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Associated Flat</label>
                    <select
                      value={cmFlatNumber}
                      onChange={(e) => setCmFlatNumber(e.target.value)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-2 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                    >
                      <option value="">-- None / Select Flat --</option>
                      {flats?.map((f: any) => (
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
                      className="rounded bg-emerald-600 border border-[#D4AF37]/35 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>

      {/* Dedicated Photo Edit Modal */}
      {photoEditMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl border border-[#D4AF37]/35 bg-neutral-950 p-6 space-y-4 shadow-2xl shadow-black text-left">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-[16px] font-black tracking-tight text-white flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#D4AF37]" />
                {language === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Photo'}
              </h3>
              <button
                type="button"
                onClick={() => setPhotoEditMember(null)}
                className="rounded p-1 text-slate-400 hover:bg-rose-950 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#D4AF37] font-mono block mb-1.5">
                    {language === 'bn' ? 'ডাটাবেজে যুক্ত ছবির URL' : 'New Photo URL'}
                  </label>
                  <input
                    type="url"
                    value={photoEditUrl}
                    onChange={(e) => setPhotoEditUrl(e.target.value)}
                    placeholder="https://..."
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-emerald-950/50"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-neutral-950 px-2 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                      {language === 'bn' ? 'অথবা' : 'OR'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-emerald-400 font-mono block mb-1.5">
                    {language === 'bn' ? 'অথবা ডিভাইস থেকে ছবি নির্বাচন করুন' : 'Or Upload Local Photo'}
                  </label>
                  <label className="flex items-center justify-center w-full min-h-[36px] px-3 py-2 border border-dashed border-emerald-800 rounded bg-neutral-900/50 hover:bg-neutral-900 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold group-hover:text-[#D4AF37]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      {language === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন' : 'Click to Upload Image'}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhotoEditUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Preset avatars could go here, or we can just keep the same presets as in add member */}
              <div className="grid grid-cols-4 gap-2">
                {[
                   { name: 'Male A', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face' },
                   { name: 'Male B', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
                   { name: 'Male C', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop&crop=face' },
                   { name: 'Male D', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
                   { name: 'Female E', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
                   { name: 'Female F', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
                   { name: 'Female G', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face' }
                ].map((presetPic, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setPhotoEditUrl(presetPic.url)}
                    className={`h-10 w-10 mx-auto rounded-full border-2 transition-all cursor-pointer ${
                      photoEditUrl === presetPic.url 
                        ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' 
                        : 'border-transparent hover:border-emerald-500 hover:scale-110'
                    }`}
                    style={{ backgroundImage: `url(${presetPic.url})`, backgroundSize: 'cover' }}
                    title={presetPic.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-emerald-950 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setPhotoEditMember(null)}
                className="rounded border border-emerald-950 bg-transparent px-4 py-2 text-xs font-bold text-slate-300 hover:bg-neutral-900 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedList = committeeMembers.map((item: any) => 
                    item.id === photoEditMember.id ? { ...item, photoUrl: photoEditUrl.trim() } : item
                  );
                  updateConfig({ committeeMembersJson: JSON.stringify(updatedList) });
                  setPhotoEditMember(null);
                }}
                className="rounded bg-emerald-600 border border-[#D4AF37]/35 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                {language === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 72 Flat Profile Detail & Photo Upload Drawer/Modal */}
      {selectedGalleryFlat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-[#D4AF37]/35 bg-neutral-950 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black text-left">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <h3 className="text-[16px] font-black tracking-tight text-white flex items-center gap-2">
                <span className="h-6.5 w-12 bg-neutral-900 border border-[#D4AF37]/45 text-[#D4AF37] px-2 py-0.5 rounded text-xs font-mono font-black flex items-center justify-center">
                  #{selectedGalleryFlat.flatNum}
                </span>
                <span className="text-white hover:text-[#D4AF37] transition-all">
                  {language === 'bn' ? 'ফ্ল্যাট মালিক ও আবাসিক প্রোফাইল আপডেট' : 'Flat Owner & Resident Entry Control'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedGalleryFlat(null)}
                className="rounded p-1 text-slate-400 hover:bg-rose-950 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedGalleryFlat) return;

                const { flatNum, flatSpec, member } = selectedGalleryFlat;

                if (member) {
                  // Update existing member record
                  const updatedRecord = {
                    ...member,
                    name: flatFormName.trim(),
                    phone: flatFormPhone.trim(),
                    photoUrl: flatFormPhoto.trim(),
                    type: flatFormType,
                    nid: flatFormNid.trim(),
                    email: flatFormEmail.trim()
                  };
                  updateMember(updatedRecord);
                } else {
                  // Add new member record to database
                  const newRecord = {
                    name: flatFormName.trim(),
                    flatNumber: flatNum,
                    type: flatFormType,
                    phone: flatFormPhone.trim(),
                    nid: flatFormNid.trim(),
                    email: flatFormEmail.trim() || `${flatNum.toLowerCase()}@asthatwintowers.com`,
                    familyMembers: [],
                    status: 'Active' as const,
                    photoUrl: flatFormPhoto.trim()
                  };
                  addMember(newRecord);
                }

                setSelectedGalleryFlat(null);
              }}
              className="space-y-4 text-xs font-sans"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resident Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                    {language === 'bn' ? 'বাসিন্দার সম্পূর্ণ নাম' : 'Full Resident Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={flatFormName}
                    onChange={(e) => setFlatFormName(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: মোঃ আতিকুর রহমান' : 'e.g. Atiqur Rahman'}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                  />
                </div>

                {/* Mobile Phone Number */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                    {language === 'bn' ? 'মোবাইল নাম্বার' : 'Contact Phone'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={flatFormPhone}
                    onChange={(e) => setFlatFormPhone(e.target.value)}
                    placeholder="+8801---------"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resident Type */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                    {language === 'bn' ? 'বাসিন্দার ধরণ' : 'Resident Type'}
                  </label>
                  <select
                    value={flatFormType}
                    onChange={(e) => setFlatFormType(e.target.value as 'Owner' | 'Tenant')}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                  >
                    <option value="Owner">{language === 'bn' ? 'ফ্ল্যাট মালিক (Owner)' : 'Flat Owner'}</option>
                    <option value="Tenant">{language === 'bn' ? 'ভাড়াটিয়া (Tenant)' : 'Registered Tenant'}</option>
                  </select>
                </div>

                {/* Email address */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                    {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={flatFormEmail}
                    onChange={(e) => setFlatFormEmail(e.target.value)}
                    placeholder="resident@example.com"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* National Identity Card NID */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  {language === 'bn' ? 'জাতীয় পরিচয়পত্র নম্বর (NID)' : 'National ID Card (NID)'}
                </label>
                <input
                  type="text"
                  value={flatFormNid}
                  onChange={(e) => setFlatFormNid(e.target.value)}
                  placeholder="e.g. 199XXXXXXXXXXXX"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              {/* Photos Panel */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#D4AF37] font-mono block mb-1.5">
                    {language === 'bn' ? 'ছবি ও প্রতিকৃতির ইউআরএল (Photo URL)' : 'Passport Portrait Image URL'}
                  </label>
                  <input
                    type="url"
                    value={flatFormPhoto}
                    onChange={(e) => setFlatFormPhoto(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-emerald-950/50"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-neutral-950 px-2 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                      {language === 'bn' ? 'অথবা' : 'OR'}
                    </span>
                  </div>
                </div>

                {/* Upload Local Image */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-emerald-400 font-mono block mb-1.5">
                    {language === 'bn' ? 'ডিভাইসের মেমোরি থেকে আপলোড করুন' : 'Upload Image File'}
                  </label>
                  <label className="flex items-center justify-center w-full min-h-[38px] px-3 py-2 border border-dashed border-emerald-800 rounded bg-neutral-900/50 hover:bg-neutral-900 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold group-hover:text-[#D4AF37]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      {language === 'bn' ? 'ছবি নির্বাচন করতে ক্লিক করুন' : 'Click to Select & Crop Pic'}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFlatFormPhoto(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-emerald-950/50"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-neutral-950 px-2 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                      {language === 'bn' ? 'অথবা সিস্টেমের ডেমো ছবি দিন' : 'OR CHOOSE PRESETS'}
                    </span>
                  </div>
                </div>

                {/* Preset Avatars Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {[
                     { name: 'Male A', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face' },
                     { name: 'Male B', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
                     { name: 'Male C', url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop&crop=face' },
                     { name: 'Male D', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
                     { name: 'Female E', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face' },
                     { name: 'Female F', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
                     { name: 'Female G', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face' }
                  ].map((presetPic, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setFlatFormPhoto(presetPic.url)}
                      className={`h-10 w-10 mx-auto rounded-full border-2 transition-all cursor-pointer ${
                        flatFormPhoto === presetPic.url 
                          ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' 
                          : 'border-transparent hover:border-emerald-500 hover:scale-110'
                      }`}
                      style={{ backgroundImage: `url(${presetPic.url})`, backgroundSize: 'cover' }}
                      title={presetPic.name}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-emerald-950 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedGalleryFlat(null)}
                  className="rounded border border-emerald-950 bg-transparent px-4 py-2 text-xs font-bold text-slate-300 hover:bg-neutral-900 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 border border-[#D4AF37]/35 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer shadow-md"
                >
                  {language === 'bn' ? 'সংরক্ষণ ও আপডেট' : 'Save & Sync Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
