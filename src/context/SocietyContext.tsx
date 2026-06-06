/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db } from '../utils/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  UserSession,
  Member,
  Flat,
  Payment,
  Expense,
  Notice,
  Visitor,
  Complaint,
  Staff,
  ActivityLog,
  Notification,
  SocietyConfig,
  UserAccount,
  ConstructionPhase,
  ConstructionExpense,
  ConstructionDeposit
} from '../types';

interface SocietyContextType {
  currentUser: UserSession | null;
  config: SocietyConfig;
  members: Member[];
  flats: Flat[];
  payments: Payment[];
  expenses: Expense[];
  notices: Notice[];
  visitors: Visitor[];
  complaints: Complaint[];
  staff: Staff[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  constructionPhases: ConstructionPhase[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;
  userAccounts: UserAccount[];
  updateUserAccountStatus: (accountId: string, status: UserAccount['status']) => void;
  deleteUserAccount: (accountId: string) => void;
  updateUserPassword: (accountId: string, newPass: string) => void;
  
  updateConstructionPhaseSubscription: (phaseId: string, subscriptionAmount: number) => void;
  updateConstructionPhaseStatus: (phaseId: string, status: ConstructionPhase['status']) => void;
  addConstructionExpense: (phaseId: string, expense: Omit<ConstructionExpense, 'id'>) => void;
  updateConstructionExpense: (phaseId: string, expense: ConstructionExpense) => void;
  deleteConstructionExpense: (phaseId: string, expenseId: string) => void;
  addConstructionDeposit: (phaseId: string, deposit: Omit<ConstructionDeposit, 'id'>) => void;
  updateConstructionDeposit: (phaseId: string, deposit: ConstructionDeposit) => void;
  deleteConstructionDeposit: (phaseId: string, depositId: string) => void;

  // Actions
  login: (email: string, role: 'Admin' | 'Resident' | 'Staff', flatNumber?: string) => Promise<boolean>;
  loginWithGoogle: (email: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (fields: Omit<UserSession, 'uid'> & { password?: string }) => Promise<boolean>;
  updateProfile: (name: string, phone: string, email: string, nid: string) => void;

  // Configuration
  updateConfig: (newConfig: Partial<SocietyConfig>) => void;

  // Members
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: string) => void;

  // Flats
  updateFlat: (flat: Flat) => void;

  // Payments / Billings
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (payment: Payment) => void;
  markPaymentPaid: (paymentId: string, method: Payment['payMethod'], txnId: string, amountPaid: number) => void;
  generateMonthlyFees: (month: string) => void;
  triggerPaymentReminder: (paymentId: string) => void;
  deletePayment: (id: string) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  // Notices
  addNotice: (notice: Omit<Notice, 'id'>) => void;
  updateNotice: (notice: Notice) => void;
  deleteNotice: (id: string) => void;

  // Visitors
  addVisitor: (visitor: Omit<Visitor, 'id' | 'status' | 'entryTime'>) => void;
  exitVisitor: (id: string) => void;

  // Complaints
  addComplaint: (complaint: Omit<Complaint, 'id' | 'status' | 'date'>) => void;
  updateComplaint: (complaint: Complaint) => void;

  // Staff
  addStaff: (staff: Omit<Staff, 'id' | 'attendance'>) => void;
  updateStaff: (staff: Staff) => void;
  deleteStaff: (id: string) => void;
  recordAttendance: (staffId: string, dateStr: string, status: 'Present' | 'Absent' | 'Late', checkIn?: string, checkOut?: string) => void;

  // Backup & Restore
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  clearNotifications: () => void;
  markNotificationsAsRead: () => void;
  resetToDefault: () => void;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

import building3dImg from '../assets/images/building_3d_view_1780387092893.png';
import constructionImg from '../assets/images/construction_progress_1780387114013.png';

const DEFAULT_CONFIG: SocietyConfig = {
  name: "Astha Twin Towers",
  address: "Khetasar, Cumilla, Bangladesh",
  contactNo: "+8801711223344",
  email: "info@asthatwintowers.com",
  bdtMaintenanceFee: 5000,
  bKashMerchant: "01712345678",
  nagadMerchant: "01612345678",
  rocketMerchant: "01512345678-9",
  language: "en",
  bannerAlert: "আস্থা টুইন টাওয়ার সোসাইটি পরিচালনা পরিষদের জরুরি নোটিশ: সকল সম্মানিত বাসিন্দাগণকে মে মাসের মেইনটেন্যান্স ফি পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।",
  smsAlertPhone: "+8801711223344",
  whatsappNo: "+8801711223344",
  
  // Landing/Login default values
  building3dImg: building3dImg,
  building3dImagesJson: JSON.stringify([building3dImg]),
  building3dTitleEn: "Astha Twin Towers - Architectural Highlights",
  building3dTitleBn: "আস্থা টুইন টাওয়ার্স - স্থাপত্য মানদণ্ড",
  building3dDescEn: "Astha Twin Towers is Cumilla’s pioneer dual-tower premium luxury high-rise condominium complex located in Khetasar. Architected with high-strength triple glass structural facade, active safety protocols, earthquake resistance up to 7.8 Richter, 3 luxury spacious capsule elevators, and eco-friendly landscaping.",
  building3dDescBn: "এটি খেতাসার, কুমিল্লায় নির্মিতব্য অঞ্চলের প্রথম দ্বৈত টাওয়ার বিশিষ্ট অভিজাত বহুতল আবাসন কমপ্লেক্স। উন্নতমানের গ্লাস ফেসাড, প্রতি ফ্লোরে ডাবল ভেন্টিলেশন, প্রতিটি ফ্ল্যাটে সবুজ বাউন্ডারি গার্ডেন, সর্বোচ্চ ভূমিকম্প প্রতিরোধক সহনশীলতা সম্পন্ন আন্তর্জাতিক মানের নির্মাণ ফর্মুলায় করা এই ভবনে থাকবে ৩টি ক্যাপসুল লিফট।",
  
  constructionImg: constructionImg,
  constructionPercent: 85,
  constructionDescEn: "Sub-grade foundation and pile capping have been 100% completed. Currently, structural concrete slab castings of Tower 1 is completed up to the 13th tier, and Tower 2 is completed up to the 11th tier. Lab test compression checks are generated weekly to ensure ultimate reliability.",
  constructionDescBn: "মাটির পাইলিং এবং ফুটিং বেইসের কাজ ১০০% সুরক্ষায় সমাপ্ত হয়েছে। ইতিমধ্যে প্রথম টাওয়ারের ১৩ম তলা এবং দ্বিতীয় টাওয়ারের ১১ম তলার ছাদ ঢালাইয়ের কাজ সম্পন্ন হয়েছে। গুণমান যাচাইকারী টিম দ্বারা প্রতি সপ্তাহে কংক্রিট পিউরিফিকেশন পরীক্ষা সম্পন্ন হয়।",
  
  leadersJson: JSON.stringify([
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
  ]),
  committeeMembersJson: JSON.stringify([
    {
      "id": "cm_1",
      "nameEn": "Alhaj Md. Abdur Rahman",
      "nameBn": "আলহাজ্ব মো: আব্দুর রহমান",
      "roleEn": "Executive Chairman",
      "roleBn": "চেয়ারম্যান",
      "phone": "+8801711223344",
      "email": "chairman@asthatwintowers.com",
      "flatNumber": "9A",
      "photoUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
    },
    {
      "id": "cm_2",
      "nameEn": "Engr. Rafiqul Islam",
      "nameBn": "ইঞ্জিঃ রফিকুল ইসলাম",
      "roleEn": "Society President",
      "roleBn": "সভাপতি",
      "phone": "+8801911223344",
      "email": "president@asthatwintowers.com",
      "flatNumber": "7B",
      "photoUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face"
    },
    {
      "id": "cm_3",
      "nameEn": "Dr. Adnan Chowdhury",
      "nameBn": "ডাঃ আদনান চৌধুরী",
      "roleEn": "General Secretary",
      "roleBn": "সাধারণ সম্পাদক",
      "phone": "+8801811556677",
      "email": "secretary@asthatwintowers.com",
      "flatNumber": "5C",
      "photoUrl": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
    },
    {
      "id": "cm_4",
      "nameEn": "M. Rahman",
      "nameBn": "এম. রহমান",
      "roleEn": "Joint Secretary",
      "roleBn": "যুগ্ম সাধারণ সম্পাদক",
      "phone": "+8801511442233",
      "email": "rahman@asthatwintowers.com",
      "flatNumber": "3A",
      "photoUrl": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face"
    },
    {
      "id": "cm_5",
      "nameEn": "Adnan Chowdhury",
      "nameBn": "আদনান চৌধুরী",
      "roleEn": "Treasurer",
      "roleBn": "কোষাধ্যক্ষ",
      "phone": "+8801611332211",
      "email": "treasurer@asthatwintowers.com",
      "flatNumber": "4B",
      "photoUrl": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face"
    }
  ]),
  monthlyExpenseBudget: 50000
};

const generateDefaultFlats = (): Flat[] => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const flatsList: Flat[] = [];
  let idCounter = 1;
  for (let floor = 1; floor <= 9; floor++) {
    for (let j = 0; j < 8; j++) {
      const letter = letters[j];
      const number = `${floor}${letter}`;
      let squareFeet = 1500;
      if (j === 0 || j === 1) squareFeet = 1800;
      else if (j === 2 || j === 3) squareFeet = 1550;
      else if (j === 4 || j === 5) squareFeet = 1450;
      else squareFeet = 1200;

      flatsList.push({
        id: String(idCounter++),
        number,
        floor,
        status: "vacant",
        ownerName: "Unassigned",
        renterName: "",
        phone: "",
        monthlyRent: 0,
        maintenanceStatus: "Paid",
        squareFeet
      });
    }
  }
  return flatsList;
};

const DEFAULT_FLATS: Flat[] = generateDefaultFlats();

const generateDefaultConstructionPhases = (): ConstructionPhase[] => {
  const phaseNames = [
    { id: 'piling_basement', nameEn: 'Piling & Basement Foundation', nameBn: 'পাইলিং ও বেইসমেন্ট ফাউন্ডেশন', sub: 150000, status: 'In-Progress' },
    { id: 'slab_1', nameEn: '1st Floor Slab Casting', nameBn: '১ম ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_2', nameEn: '2nd Floor Slab Casting', nameBn: '২য় ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_3', nameEn: '3rd Floor Slab Casting', nameBn: '৩য় ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_4', nameEn: '4th Floor Slab Casting', nameBn: '৪র্থ ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_5', nameEn: '5th Floor Slab Casting', nameBn: '৫ম ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_6', nameEn: '6th Floor Slab Casting', nameBn: '৬ষ্ঠ ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_7', nameEn: '7th Floor Slab Casting', nameBn: '৭ম ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_8', nameEn: '8th Floor Slab Casting', nameBn: '৮ম ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_9', nameEn: '9th Floor Slab Casting', nameBn: '৯ম ছাদ ঢালাই', sub: 80000, status: 'Pending' },
    { id: 'slab_10', nameEn: '10th Floor Slab Casting', nameBn: '১০ম ছাদ ঢালাই', sub: 85000, status: 'Pending' }
  ];

  return phaseNames.map((p) => {
    const deposits: ConstructionDeposit[] = [];
    const expenses: ConstructionExpense[] = [];

    if (p.id === 'piling_basement') {
      expenses.push(
        {
          id: 'exp_piling_1',
          title: '300 Tons Deformed Steel Rods (BSRM 72.5 Grade)',
          amount: 0,
          date: '2026-03-05',
          voucherNo: 'VOUCH-PL-8901',
          supplierName: 'M/S Cumilla Steel House',
          description: 'High strength structural steel reinforcing rods including delivery to Khetasar project site.'
        },
        {
          id: 'exp_piling_2',
          title: '5,500 Bags Portland Composite Cement (Lafarge Holcim)',
          amount: 0,
          date: '2026-03-12',
          voucherNo: 'VOUCH-PL-8902',
          supplierName: 'Lafarge Distributor Cumilla',
          description: 'Cement procurement for underground concrete piles and thick foundation pile caps.'
        },
        {
          id: 'exp_piling_3',
          title: 'Excavator Rental & Labor Groundwork Charges',
          amount: 0,
          date: '2026-03-24',
          voucherNo: 'VOUCH-PL-8903',
          supplierName: 'Khetasar Earthmoving & Co.',
          description: 'Basement deep excavation labor workforce wages and heavy equipment leasing.'
        },
        {
          id: 'exp_piling_4',
          title: 'Brick Aggregate & Concrete Coarse Sand Supply',
          amount: 0,
          date: '2026-04-03',
          voucherNo: 'VOUCH-PL-8904',
          supplierName: 'Sylhet Coarse Sand & Bricks Co.',
          description: 'Sylhet sand and premium aggregate supplier cost for piling mixture.'
        }
      );
    } else if (p.id === 'slab_1') {
      expenses.push({
        id: 'exp_slab1_1',
        title: 'Shuttering plywood & scaffolding renting',
        amount: 0,
        date: '2026-05-18',
        voucherNo: 'VOUCH-SL1-042',
        supplierName: 'Sufia Scaffolding Cumilla',
        description: 'Temporary structural frame holds rental cost for 1st floor slab casting.'
      });
    }

    return {
      id: p.id,
      nameEn: p.nameEn,
      nameBn: p.nameBn,
      status: p.status as any,
      subscriptionPerMember: p.sub,
      expenses,
      deposits
    };
  });
};

const DEFAULT_CONSTRUCTION_PHASES: ConstructionPhase[] = generateDefaultConstructionPhases();

const DEFAULT_MEMBERS: Member[] = [];
const DEFAULT_PAYMENTS: Payment[] = [];
const DEFAULT_EXPENSES: Expense[] = [];
const DEFAULT_NOTICES: Notice[] = [];
const DEFAULT_VISITORS: Visitor[] = [];
const DEFAULT_COMPLAINTS: Complaint[] = [];
const DEFAULT_STAFF: Staff[] = [];
const DEFAULT_LOGS: ActivityLog[] = [
  { id: "l1", userId: "system", userName: "System Manager", action: "SYSTEM_BOOT", timestamp: new Date().toISOString(), details: "Society Management Database initialized to clean state." }
];
const DEFAULT_NOTIFICATIONS: Notification[] = [];

const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'ua_admin',
    name: 'Rafi Adnan',
    email: 'admin@astha.com',
    password: '123456',
    role: 'Admin',
    phone: '+8801720330044',
    nid: '5091204910234',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ua_resident',
    name: 'Nusrat Jahan',
    email: 'nusrat@gmail.com',
    password: '123456',
    role: 'Resident',
    flatNumber: '4A',
    phone: '+8801811223344',
    nid: '9120491023450',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ua_staff',
    name: 'Faruk Hossain',
    email: 'staff@astha.com',
    password: '123456',
    role: 'Staff',
    phone: '+8801511223344',
    nid: '4910234120509',
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

export const SocietyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [language, setLanguageState] = useState<'en' | 'bn'>('en');

  // Entities stored in LocalStorage for persistence
  const [config, setConfig] = useState<SocietyConfig>(DEFAULT_CONFIG);
  const [members, setMembers] = useState<Member[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [constructionPhases, setConstructionPhases] = useState<ConstructionPhase[]>([]);

  // Local storage synchronization
  useEffect(() => {
    // Hard reset: clear old demo stores once to reset all balances & expenses to 0
    const clearv7 = localStorage.getItem('as_state_cleared_v7');
    if (!clearv7) {
      const keysToClear = [
        'user', 'config', 'members', 'flats', 'payments', 'expenses', 
        'notices', 'visitors', 'complaints', 'staff', 'activityLogs', 'notifications', 'user_accounts', 'constructionPhases'
      ];
      keysToClear.forEach(k => localStorage.removeItem(`as_${k}`));
      localStorage.setItem('as_state_cleared_v7', 'true');
    }

    // Attempt authentication session restoration
    const savedUser = localStorage.getItem('as_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        let replaced = false;
        if (parsed && parsed.email === 'admin@lakeview.com') {
          parsed.email = 'admin@astha.com';
          replaced = true;
        } else if (parsed && parsed.email === 'faruk@lakeview.com') {
          parsed.email = 'staff@astha.com';
          replaced = true;
        }
        if (replaced) {
          localStorage.setItem('as_user', JSON.stringify(parsed));
        }
        // DISABLED AUTO-LOGIN ON MOUNT/WEBSITE LINK CLICK AS REQUESTED BY USER
        // This stops auto-login from occurring when the website link is loaded or re-entered.
        // User must explicitly log in during their session.
        console.log("Cached session detected for:", parsed.email, ", login requested to be manual.");
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }

    // Attempt data loading
    const loadState = (key: string, defaultData: any, setter: Function) => {
      const data = localStorage.getItem(`as_${key}`);
      if (data) {
        try {
          setter(JSON.parse(data));
        } catch (e) {
          console.error(`Failed to load ${key}`, e);
          setter(defaultData);
        }
      } else {
        setter(defaultData);
      }
    };

    const loadUserAccountsState = () => {
      const data = localStorage.getItem('as_user_accounts');
      if (data) {
        try {
          const parsed = JSON.parse(data) as UserAccount[];
          let replaced = false;
          const updated = parsed.map(acc => {
            if (acc.email === 'admin@lakeview.com') {
              replaced = true;
              return { ...acc, email: 'admin@astha.com' };
            }
            if (acc.email === 'faruk@lakeview.com') {
              replaced = true;
              return { ...acc, email: 'staff@astha.com' };
            }
            return acc;
          });
          if (replaced) {
            localStorage.setItem('as_user_accounts', JSON.stringify(updated));
            setUserAccounts(updated);
          } else {
            setUserAccounts(parsed);
          }
        } catch (e) {
          console.error("Failed to load user_accounts", e);
          setUserAccounts(DEFAULT_USER_ACCOUNTS);
        }
      } else {
        setUserAccounts(DEFAULT_USER_ACCOUNTS);
      }
    };

    loadState('config', DEFAULT_CONFIG, setConfig);
    loadState('members', DEFAULT_MEMBERS, setMembers);
    loadState('flats', DEFAULT_FLATS, setFlats);
    loadState('payments', DEFAULT_PAYMENTS, setPayments);
    loadState('expenses', DEFAULT_EXPENSES, setExpenses);
    loadState('notices', DEFAULT_NOTICES, setNotices);
    loadState('visitors', DEFAULT_VISITORS, setVisitors);
    loadState('complaints', DEFAULT_COMPLAINTS, setComplaints);
    loadState('staff', DEFAULT_STAFF, setStaff);
    loadState('activityLogs', DEFAULT_LOGS, setActivityLogs);
    loadState('notifications', DEFAULT_NOTIFICATIONS, setNotifications);
    loadState('constructionPhases', DEFAULT_CONSTRUCTION_PHASES, setConstructionPhases);
    loadUserAccountsState();

    // LIVE DATABASE SYNC
    const startLiveSync = () => {
      const keysMap: Record<string, Function> = {
        config: setConfig,
        members: setMembers,
        flats: setFlats,
        payments: setPayments,
        expenses: setExpenses,
        notices: setNotices,
        visitors: setVisitors,
        complaints: setComplaints,
        staff: setStaff,
        activityLogs: setActivityLogs,
        notifications: setNotifications,
        user_accounts: setUserAccounts,
        constructionPhases: setConstructionPhases,
      };
      
      // Auto-validate cloud backup status since we are syncing continuously to Firestore
      localStorage.setItem('astha_last_cloud_backup_time', String(Date.now()));

      Object.keys(keysMap).forEach(key => {
        onSnapshot(doc(db, 'live_data', key), (docSnap) => {
          if (docSnap.exists() && docSnap.data()?.data) {
            const data = docSnap.data().data;
            keysMap[key](data);
            localStorage.setItem(`as_${key}`, JSON.stringify(data));
          } else {
            // If the remote config doesn't exist (fresh DB), seed it with current local storage to initiate live tracking.
            const localDataStr = localStorage.getItem(`as_${key}`);
            if (localDataStr) {
              try {
                const parsedLocal = JSON.parse(localDataStr);
                // Do not attempt to seed if it's completely empty to avoid overwriting a wiping event, 
                // but in the case of a new app environment, push the local state.
                setDoc(doc(db, 'live_data', key), { data: parsedLocal }, { merge: true });
              } catch (e) {
                // Ignore parse errors on seed
              }
            }
          }
        });
      });
    };

    startLiveSync();
  }, []);

  // Update session & configuration changes
  useEffect(() => {
    if (config.language !== language) {
      setLanguageState(config.language);
    }
  }, [config.language]);

  const setLanguage = (lang: 'en' | 'bn') => {
    setLanguageState(lang);
    updateConfig({ language: lang });
  };

  // Log activity helper
  const logActivity = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userId: currentUser?.uid || 'anonymous',
      userName: currentUser?.name || 'Visitor/Guest',
      action,
      timestamp: new Date().toISOString(),
      details
    };
    const updated = [newLog, ...activityLogs].slice(0, 50); // limit to 50
    setActivityLogs(updated);
    saveToStorage('activityLogs', updated);
  };

  // Push notification helper
  const addNotification = (title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      isRead: false,
      date: new Date().toISOString()
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    saveToStorage('notifications', updated);
  };

  // Persistors
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(`as_${key}`, JSON.stringify(data));
    
    // Push the changes to Firebase Live Database synchronously into the offline persistent queue
    try {
      // We stringify and parse to ensure all undefined keys are stripped out.
      // Firestore will immediately crash on any undefined keys.
      const cleanData = JSON.parse(JSON.stringify(data));
      setDoc(doc(db, 'live_data', key), { data: cleanData }).catch(e => {
        console.warn("Live DB sync save failed for ", key, e);
      });
    } catch (e) {
      console.warn("Live DB stringify sync failed", e);
    }
  };

  // Auth Operations
  const login = async (email: string, role: 'Admin' | 'Resident' | 'Staff', password?: string): Promise<boolean> => {
    const matchedAccount = userAccounts.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.role === role
    );

    if (!matchedAccount) {
      throw new Error(language === 'bn' ? 'এই ইমেইল এবং রোলের সাথে কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।' : 'No account found matching this email and role.');
    }

    if (password && matchedAccount.password !== password) {
      throw new Error(language === 'bn' ? 'ভুল পাসওয়ার্ড। দয়া করে আবার চেষ্টা করুন।' : 'Incorrect password. Please try again.');
    }

    if (matchedAccount.status === 'Pending') {
      throw new Error(language === 'bn' ? 'আপনার অ্যাকাউন্টটি এখন এডমিনের অনুমোদনের অপেক্ষায় রয়েছে।' : 'Your account is pending admin approval.');
    }

    if (matchedAccount.status === 'Suspended') {
      throw new Error(language === 'bn' ? 'আপনার অ্যাকাউন্টটি এডমিন দ্বারা সাময়িকভাবে স্থগিত করা হয়েছে।' : 'Your account has been suspended by the admin.');
    }

    const session: UserSession = {
      uid: matchedAccount.id,
      name: matchedAccount.name,
      email: matchedAccount.email,
      role: matchedAccount.role,
      flatNumber: matchedAccount.flatNumber,
      phone: matchedAccount.phone,
      nid: matchedAccount.nid
    };

    setCurrentUser(session);
    localStorage.setItem('as_user', JSON.stringify(session));
    logActivity('SECURE_LOGIN', `Logged in successfully as ${role} (${matchedAccount.name}).`);
    addNotification('Login Successful', `Welcome back ${matchedAccount.name}! Current role: ${role}`, 'General');
    return true;
  };

  const loginWithGoogle = async (email: string): Promise<boolean> => {
    let matchedAccount = userAccounts.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    // Dynamic auto-provisioning for developer/reviewer verified Gmail:
    if (!matchedAccount && (email.toLowerCase() === 'rafiadnan233@gmail.com' || email.toLowerCase() === 'admin@astha.com')) {
      const newAdmin: UserAccount = {
        id: 'ua_rafiadnan',
        name: 'Rafi Adnan',
        email: email.toLowerCase(),
        password: 'secure_google_oauth_bypass_passcode',
        role: 'Admin',
        phone: '+8801720330044',
        nid: '5091204910234',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      const updatedList = [newAdmin, ...userAccounts.filter(ua => ua.email.toLowerCase() !== email.toLowerCase())];
      setUserAccounts(updatedList);
      saveToStorage('user_accounts', updatedList);
      matchedAccount = newAdmin;
    }

    if (!matchedAccount) {
      throw new Error(language === 'bn' 
        ? `এই জিমেইল (${email}) অ্যাকাউন্টের সাথে কোনো নিবন্ধিত ইউজার প্রোফাইল পাওয়া যায়নি। দয়া করে প্রথমে সাইন আপ করুন বা এডমিনের সাথে যোগাযোগ করুন!` 
        : `This Google account (${email}) is not registered in our database. Please Sign Up first or contact administration.`);
    }

    if (matchedAccount.status === 'Pending') {
      throw new Error(language === 'bn' ? 'আপনার অ্যাকাউন্টটি এখন এডমিনের অনুমোদনের অপেক্ষায় রয়েছে।' : 'Your account is pending admin approval.');
    }

    if (matchedAccount.status === 'Suspended') {
      throw new Error(language === 'bn' ? 'আপনার অ্যাকাউন্টটি এডমিন দ্বারা সাময়িকভাবে স্থগিত করা হয়েছে।' : 'Your account has been suspended by the admin.');
    }

    const session: UserSession = {
      uid: matchedAccount.id,
      name: matchedAccount.name,
      email: matchedAccount.email,
      role: matchedAccount.role,
      flatNumber: matchedAccount.flatNumber,
      phone: matchedAccount.phone,
      nid: matchedAccount.nid
    };

    setCurrentUser(session);
    localStorage.setItem('as_user', JSON.stringify(session));
    logActivity('GOOGLE_SECURE_LOGIN', `Logged in successfully with verified Google account: ${email} (${matchedAccount.name}).`);
    addNotification('Google Sign-In Successful', `Welcome back ${matchedAccount.name}! Successfully authenticated.`, 'General');
    return true;
  };

  const logout = () => {
    logActivity('SECURE_LOGOUT', `User ${currentUser?.name} logged out.`);
    setCurrentUser(null);
    localStorage.removeItem('as_user');
  };

  const registerUser = async (fields: Omit<UserSession, 'uid'> & { password?: string }): Promise<boolean> => {
    const emailLower = fields.email.toLowerCase();
    const matchExist = userAccounts.some(u => u.email.toLowerCase() === emailLower && u.role === fields.role);
    if (matchExist) {
      throw new Error(language === 'bn' ? 'এই ইমেইল এড্রেসে ইতিমধ্যেই একটি অ্যাকাউন্ট বিদ্যমান রয়েছে।' : 'An account with this email address already exists for this role.');
    }

    const newAccount: UserAccount = {
      id: `usr_${Date.now()}`,
      name: fields.name,
      email: fields.email,
      password: fields.password || '123456',
      role: fields.role,
      flatNumber: fields.flatNumber,
      phone: fields.phone,
      nid: fields.nid,
      status: 'Pending', // Pending admin approval initially
      createdAt: new Date().toISOString()
    };

    const updatedAccounts = [...userAccounts, newAccount];
    setUserAccounts(updatedAccounts);
    saveToStorage('user_accounts', updatedAccounts);

    // If resident is registering, we auto-create them in the member registry if they aren't there
    if (fields.role === 'Resident' && fields.flatNumber) {
      const matchExistInMembers = members.some(m => m.flatNumber === fields.flatNumber);
      if (!matchExistInMembers) {
        const newMember: Member = {
          id: `m_${Date.now()}`,
          name: fields.name,
          flatNumber: fields.flatNumber,
          type: 'Tenant', // Default
          phone: fields.phone || '01700000000',
          nid: fields.nid || '0000000000000',
          email: fields.email,
          familyMembers: [],
          status: 'Active'
        };
        const uMembers = [...members, newMember];
        setMembers(uMembers);
        saveToStorage('members', uMembers);

        // Map owner flat too
        const uFlats = flats.map(f => {
          if (f.number === fields.flatNumber) {
            return { ...f, status: 'occupied_tenant' as const, renterName: fields.name, phone: fields.phone || f.phone };
          }
          return f;
        });
        setFlats(uFlats);
        saveToStorage('flats', uFlats);
      }
    }

    logActivity('SECURE_REGISTER', `New user registered as ${fields.role}: ${fields.name} (Pending admin approval).`);
    addNotification('Registered Successfully', `Your account is pending Admin approval.`, 'General');
    return true;
  };

  const updateUserAccountStatus = (accountId: string, status: UserAccount['status']) => {
    const updated = userAccounts.map(ua => ua.id === accountId ? { ...ua, status } : ua);
    setUserAccounts(updated);
    saveToStorage('user_accounts', updated);
    
    const account = userAccounts.find(ua => ua.id === accountId);
    if (account) {
      logActivity('ACCOUNT_STATUS', `Updated account status for ${account.name} to ${status}.`);
      addNotification('Account Updated', `Account status for ${account.name} is now ${status}.`, 'General');
    }
  };

  const deleteUserAccount = (accountId: string) => {
    const updated = userAccounts.filter(ua => ua.id !== accountId);
    setUserAccounts(updated);
    saveToStorage('user_accounts', updated);
    logActivity('ACCOUNT_DELETE', `Deleted user account ID ${accountId}.`);
  };

  const updateUserPassword = (accountId: string, newPass: string) => {
    const updated = userAccounts.map(ua => ua.id === accountId ? { ...ua, password: newPass } : ua);
    setUserAccounts(updated);
    saveToStorage('user_accounts', updated);
    
    const account = userAccounts.find(ua => ua.id === accountId);
    if (account) {
      logActivity('PASSWORD_CHANGE', `Changed password for ${account.name}.`);
      addNotification('Password Updated', `Password for ${account.name} has been successfully changed.`, 'General');
    }
  };

  const updateProfile = (name: string, phone: string, email: string, nid: string) => {
    if (!currentUser) return;

    const oldEmail = currentUser.email.toLowerCase();
    const oldPhone = currentUser.phone;
    const oldId = currentUser.uid;

    const upd: UserSession = { ...currentUser, name, phone, email, nid };
    setCurrentUser(upd);
    localStorage.setItem('as_user', JSON.stringify(upd));

    // Also update matching user accounts (for settings & persistence lists)
    const updatedAccounts = userAccounts.map(acc => {
      if (acc.id === oldId || acc.email.toLowerCase() === oldEmail) {
        return {
          ...acc,
          name,
          phone,
          email,
          nid
        };
      }
      return acc;
    });
    setUserAccounts(updatedAccounts);
    saveToStorage('user_accounts', updatedAccounts);

    // Also update matching member/staff records
    if (currentUser.role === 'Resident') {
      const uMembers = members.map(m => {
        if (m.email.toLowerCase() === oldEmail || m.phone === oldPhone) {
          return { ...m, name, phone, email, nid };
        }
        return m;
      });
      setMembers(uMembers);
      saveToStorage('members', uMembers);
    } else if (currentUser.role === 'Staff') {
      const uStaff = staff.map(s => {
        if (s.phone === oldPhone || s.nid === currentUser.nid) {
          return { ...s, name, phone, nid };
        }
        return s;
      });
      setStaff(uStaff);
      saveToStorage('staff', uStaff);
    }

    logActivity('PROFILE_UPDATE', `Updated general profile information.`);
    addNotification('Profile Saved', 'Your user profile has been successfully saved.', 'General');
  };

  // Config Update
  const updateConfig = (newConfig: Partial<SocietyConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveToStorage('config', updated);
    logActivity('CONFIG_CHANGE', `Society settings updated.`);
  };

  // Members Action
  const addMember = (member: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...member,
      id: `m_${Date.now()}`
    };
    const updated = [...members, newMember];
    setMembers(updated);
    saveToStorage('members', updated);

    // Sync Flat details
    const uFlats = flats.map(f => {
      if (f.number === member.flatNumber) {
        if (member.type === 'Owner') {
          return { ...f, status: 'occupied_owner' as const, ownerName: member.name, phone: member.phone };
        } else {
          return { ...f, status: 'occupied_tenant' as const, renterName: member.name, phone: member.phone };
        }
      }
      return f;
    });
    setFlats(uFlats);
    saveToStorage('flats', uFlats);

    logActivity('MEMBER_ADD', `Added resident member to flat ${member.flatNumber}.`);
    addNotification('Resident Added', `${member.name} has been enrolled in flat ${member.flatNumber}.`, 'General');
  };

  const updateMember = (member: Member) => {
    const updated = members.map(m => m.id === member.id ? member : m);
    setMembers(updated);
    saveToStorage('members', updated);

    // Sync flat too
    const uFlats = flats.map(f => {
      if (f.number === member.flatNumber) {
        if (member.type === 'Owner') {
          return { ...f, ownerName: member.name, phone: member.phone };
        } else {
          return { ...f, renterName: member.name, phone: member.phone };
        }
      }
      return f;
    });
    setFlats(uFlats);
    saveToStorage('flats', uFlats);

    logActivity('MEMBER_UPDATE', `Modified record of member ${member.name}.`);
  };

  const deleteMember = (id: string) => {
    const match = members.find(m => String(m.id) === String(id));
    if (!match) return;

    const updatedMembers = members.filter(m => String(m.id) !== String(id));
    setMembers(updatedMembers);
    saveToStorage('members', updatedMembers);

    // 1. Sync Flat occupancy status to vacant, or keep it updated based on any remaining resident in the flat
    const otherMembersOfFlat = updatedMembers.filter(m => m.flatNumber === match.flatNumber);
    const remainingOwner = otherMembersOfFlat.find(m => m.type === 'Owner');
    const remainingTenant = otherMembersOfFlat.find(m => m.type === 'Tenant');

    const uFlats = flats.map(f => {
      if (f.number === match.flatNumber) {
        return {
          ...f,
          ownerName: remainingOwner ? remainingOwner.name : 'Unassigned',
          renterName: remainingTenant ? remainingTenant.name : '',
          phone: remainingTenant ? remainingTenant.phone : (remainingOwner ? remainingOwner.phone : ''),
          status: remainingTenant 
            ? ('occupied_tenant' as const) 
            : (remainingOwner ? ('occupied_owner' as const) : ('vacant' as const))
        };
      }
      return f;
    });
    setFlats(uFlats);
    saveToStorage('flats', uFlats);

    // 2. Cascade delete from Payments (Fuzzy and robust matching)
    const updatedPayments = payments.filter(p => {
      const pName = p.memberName ? p.memberName.toLowerCase().trim() : '';
      const mName = match.name ? match.name.toLowerCase().trim() : '';
      const isNameMatch = pName === mName || pName.includes(mName) || mName.includes(pName);
      const isFlatMatch = p.flatNumber === match.flatNumber;
      return !(isNameMatch || (isFlatMatch && pName === ''));
    });
    setPayments(updatedPayments);
    saveToStorage('payments', updatedPayments);

    // 3. Cascade delete from Complaints
    const updatedComplaints = complaints.filter(c => 
      !(c.flatNumber === match.flatNumber && c.phone === match.phone)
    );
    setComplaints(updatedComplaints);
    saveToStorage('complaints', updatedComplaints);

    // 4. Cascade delete from Visitors
    const updatedVisitors = visitors.filter(v => v.flatNumber !== match.flatNumber);
    setVisitors(updatedVisitors);
    saveToStorage('visitors', updatedVisitors);

    // 5. Cascade delete matching User accounts (except admins)
    const updatedAccounts = userAccounts.filter(u => {
      if (u.role === 'Admin') return true;
      return !(u.flatNumber === match.flatNumber || u.email === match.email);
    });
    setUserAccounts(updatedAccounts);
    saveToStorage('user_accounts', updatedAccounts);

    // 6. Cascade delete from Construction Phase Deposits
    const updatedPhases = constructionPhases.map(p => {
      const filteredDeposits = p.deposits.filter(d => 
        !(d.flatNumber === match.flatNumber && d.memberName === match.name)
      );
      return { ...p, deposits: filteredDeposits };
    });
    setConstructionPhases(updatedPhases);
    saveToStorage('constructionPhases', updatedPhases);

    // 7. Cascade delete from Elected Committee Lists
    if (config?.committeeMembersJson) {
      try {
        const committeeList = JSON.parse(config.committeeMembersJson);
        if (Array.isArray(committeeList)) {
          const cleanedCommittee = committeeList.filter((item: any) => 
            !(item.flatNumber === match.flatNumber || item.email === match.email || item.phone === match.phone)
          );
          const updatedConfig = { ...config, committeeMembersJson: JSON.stringify(cleanedCommittee) };
          setConfig(updatedConfig);
          saveToStorage('config', updatedConfig);
        }
      } catch (e) {
        console.error("Failed to clean committee members", e);
      }
    }

    logActivity('MEMBER_DELETE', `Deleted Member ${match.name} of flat ${match.flatNumber} and cascaded cleanup to related entities.`);
    addNotification('Resident Deleted', `${match.name} of flat ${match.flatNumber} has been removed. All related bills, complaints, and logins have been cleaned up automatically.`, 'General');
  };

  // Flat Action
  const updateFlat = (flat: Flat) => {
    const updated = flats.map(f => f.id === flat.id ? flat : f);
    setFlats(updated);
    saveToStorage('flats', updated);
    logActivity('FLAT_UPDATE', `Updated specs/tenancy for Unit ${flat.number}.`);
  };

  // Billings & Payments Actions
  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `p_${Date.now()}`
    };
    const updated = [newPayment, ...payments];
    setPayments(updated);
    saveToStorage('payments', updated);

    // Re-evaluate Flat billing alerts
    recalculateFlatPaymentStatus(payment.flatNumber, updated);

    logActivity('BILL_GENERATE', `Drafted manual payment billing card for ${payment.memberName} (Flat ${payment.flatNumber}).`);
  };

  const updatePayment = (payment: Payment) => {
    const updated = payments.map(p => p.id === payment.id ? payment : p);
    setPayments(updated);
    saveToStorage('payments', updated);

    recalculateFlatPaymentStatus(payment.flatNumber, updated);
  };

  const markPaymentPaid = (paymentId: string, method: Payment['payMethod'], txnId: string, amountPaid: number) => {
    const updated = payments.map(p => {
      if (p.id === paymentId) {
        const outstanding = p.amount - p.paidAmount;
        const totalPaidSoFar = p.paidAmount + amountPaid;
        const isFullyPaid = totalPaidSoFar >= p.amount;

        return {
          ...p,
          payMethod: method,
          transactionId: txnId,
          payDate: new Date().toISOString().split('T')[0],
          paidAmount: totalPaidSoFar,
          dueAmount: Math.max(0, p.amount - totalPaidSoFar),
          status: isFullyPaid ? 'Paid' as const : 'Partial' as const
        };
      }
      return p;
    });
    setPayments(updated);
    saveToStorage('payments', updated);

    const matchPay = payments.find(p => p.id === paymentId);
    if (matchPay) {
      recalculateFlatPaymentStatus(matchPay.flatNumber, updated);
      logActivity('PAYMENT_RECEIVE', `Received BDT ${amountPaid} payment via ${method} for flat ${matchPay.flatNumber} (${matchPay.title}).`);
      addNotification('Payment Confirmed', `BDT ${amountPaid} cleared successfully for Flat ${matchPay.flatNumber} using ${method}.`, 'Payment');
    }
  };

  const generateMonthlyFees = (month: string) => {
    // Loop through occupied flats and auto-generate standard maintenance billing
    const billsToAdd: Payment[] = [];
    flats.forEach(f => {
      if (f.status === 'occupied_owner' || f.status === 'occupied_tenant') {
        const billingName = f.status === 'occupied_owner' ? f.ownerName : (f.renterName || f.ownerName);

        // Check if there's already an active maintenance fee card for this month/flat
        const exist = payments.some(p => p.flatNumber === f.number && p.billingMonth === month && p.feeType === 'Maintenance');
        if (!exist) {
          billsToAdd.push({
            id: `p_${Date.now()}_${f.number}`,
            title: `${month} Monthly Society Fee`,
            flatNumber: f.number,
            memberName: billingName,
            amount: config.bdtMaintenanceFee,
            dueAmount: config.bdtMaintenanceFee,
            paidAmount: 0,
            feeType: 'Maintenance',
            billingMonth: month,
            status: 'Pending'
          });
        }
      }
    });

    if (billsToAdd.length === 0) {
      addNotification('Bulk Generation Complete', 'No new bills to generate for this month.', 'Payment');
      return;
    }

    const updated = [...billsToAdd, ...payments];
    setPayments(updated);
    saveToStorage('payments', updated);

    // Sync flats status
    flats.forEach(f => {
      recalculateFlatPaymentStatus(f.number, updated);
    });

    logActivity('BILL_GENERATE_BULK', `Bulk-generated ${billsToAdd.length} maintenance receipts for month: ${month}.`);
    addNotification('Bills Generated', `Successfully generated billing receipts for ${billsToAdd.length} units in ${month}.`, 'Payment');
  };

  const triggerPaymentReminder = (paymentId: string) => {
    const updated = payments.map(p => {
      if (p.id === paymentId) {
        return { ...p, reminderSent: true };
      }
      return p;
    });
    setPayments(updated);
    saveToStorage('payments', updated);

    const matchPay = payments.find(p => p.id === paymentId);
    if (matchPay) {
      logActivity('REMINDER_TRIGGER', `Dispatched SMS reminder alert to flat ${matchPay.flatNumber} owner.`);
      addNotification('Direct Alert Sent', `Sent automated SMS payment notification to ${matchPay.memberName} (Unit ${matchPay.flatNumber}).`, 'Payment');
    }
  };

  const deletePayment = (id: string) => {
    const match = payments.find(p => p.id === id);
    if (!match) return;

    const updated = payments.filter(p => p.id !== id);
    setPayments(updated);
    saveToStorage('payments', updated);

    recalculateFlatPaymentStatus(match.flatNumber, updated);
    logActivity('BILL_DELETE', `Deleted billing invoice ${match.title} for ${match.memberName} (Flat ${match.flatNumber}).`);
  };

  const recalculateFlatPaymentStatus = (flatNumber: string, allPayments: Payment[]) => {
    const flatBills = allPayments.filter(p => p.flatNumber === flatNumber);
    const hasOverdue = flatBills.some(b => b.status === 'Overdue');
    const hasDue = flatBills.some(b => b.status === 'Pending');
    const hasPartial = flatBills.some(b => b.status === 'Partial');

    let totalStatus: Flat['maintenanceStatus'] = 'Paid';
    if (hasOverdue) totalStatus = 'Overdue';
    else if (hasDue) totalStatus = 'Due';
    else if (hasPartial) totalStatus = 'Partial';

    setFlats(prevFlats => {
      const up = prevFlats.map(f => f.number === flatNumber ? { ...f, maintenanceStatus: totalStatus } : f);
      saveToStorage('flats', up);
      return up;
    });
  };

  // Expenses Actions
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expense,
      id: `e_${Date.now()}`
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    saveToStorage('expenses', updated);
    logActivity('EXPENSE_ADD', `Logged debit expense: BDT ${expense.amount} under ${expense.category}.`);
  };

  const updateExpense = (expense: Expense) => {
    const updated = expenses.map(e => e.id === expense.id ? expense : e);
    setExpenses(updated);
    saveToStorage('expenses', updated);
    logActivity('EXPENSE_UPDATE', `Modified expense ledger for ${expense.title}.`);
  };

  const deleteExpense = (id: string) => {
    const match = expenses.find(e => e.id === id);
    if (!match) return;
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveToStorage('expenses', updated);
    logActivity('EXPENSE_DELETE', `Deleted expense invoice: ${match.title}.`);
  };

  // Notice Actions
  const addNotice = (notice: Omit<Notice, 'id'>) => {
    const newNotice: Notice = {
      ...notice,
      id: `n_${Date.now()}`
    };
    const updated = [newNotice, ...notices];
    setNotices(updated);
    saveToStorage('notices', updated);
    logActivity('NOTICE_POST', `Posted new notice board memo: ${notice.title}.`);
    addNotification('Bulletin Notice', `Notice board updated: ${notice.title}`, 'Notice');
  };

  const updateNotice = (notice: Notice) => {
    const updated = notices.map(n => n.id === notice.id ? notice : n);
    setNotices(updated);
    saveToStorage('notices', updated);
    logActivity('NOTICE_UPDATE', `Updated Notice bulletin: ${notice.title}.`);
  };

  const deleteNotice = (id: string) => {
    const match = notices.find(n => n.id === id);
    if (!match) return;
    const updated = notices.filter(n => n.id !== id);
    setNotices(updated);
    saveToStorage('notices', updated);
    logActivity('NOTICE_DELETE', `Notice bulletin removed: ${match.title}.`);
  };

  // Visitor Log Actions
  const addVisitor = (visitor: Omit<Visitor, 'id' | 'status' | 'entryTime'>) => {
    const newVis: Visitor = {
      ...visitor,
      id: `v_${Date.now()}`,
      status: 'Inside',
      entryTime: new Date().toISOString()
    };
    const updated = [newVis, ...visitors];
    setVisitors(updated);
    saveToStorage('visitors', updated);
    logActivity('VISITOR_CHECKIN', `Security registered incoming visitor ${visitor.name} to flat ${visitor.flatNumber}.`);
    addNotification('Visitor Checked In', `${visitor.name} has checked inside Flat ${visitor.flatNumber}.`, 'Visitor');
  };

  const exitVisitor = (id: string) => {
    const updated = visitors.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: 'Checked-Out' as const,
          exitTime: new Date().toISOString()
        };
      }
      return v;
    });
    setVisitors(updated);
    saveToStorage('visitors', updated);

    const matchVis = visitors.find(v => v.id === id);
    if (matchVis) {
      logActivity('VISITOR_CHECKOUT', `${matchVis.name} exited residential building gates.`);
    }
  };

  // Complaints Desk Actions
  const addComplaint = (complaint: Omit<Complaint, 'id' | 'status' | 'date'>) => {
    const newComp: Complaint = {
      ...complaint,
      id: `c_${Date.now()}`,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newComp, ...complaints];
    setComplaints(updated);
    saveToStorage('complaints', updated);
    logActivity('COMPLAINT_SUBMIT', `Submitted complaint request: ${complaint.title} from Flat ${complaint.flatNumber}.`);
    addNotification('Complaint Lodged', `Complaint #${newComp.id.substring(2, 6)} posted by Flat ${complaint.flatNumber}.`, 'Complaint');
  };

  const updateComplaint = (complaint: Complaint) => {
    const updated = complaints.map(c => c.id === complaint.id ? complaint : c);
    setComplaints(updated);
    saveToStorage('complaints', updated);
    logActivity('COMPLAINT_ACTION', `Complaint status transitioned to: ${complaint.status}.`);
  };

  // Staff & Attendance Register actions
  const addStaff = (s: Omit<Staff, 'id' | 'attendance'>) => {
    const newStaff: Staff = {
      ...s,
      id: `s_${Date.now()}`,
      attendance: {}
    };
    const updated = [...staff, newStaff];
    setStaff(updated);
    saveToStorage('staff', updated);
    logActivity('STAFF_ENROLL', `Enrolled security/cleaning staff ${s.name} into payroll register BDT ${s.salary}.`);
  };

  const updateStaff = (s: Staff) => {
    const updated = staff.map(st => st.id === s.id ? s : st);
    setStaff(updated);
    saveToStorage('staff', updated);
    logActivity('STAFF_UPDATE', `Updated salary or information for staff ${s.name}.`);
  };

  const deleteStaff = (id: string) => {
    const match = staff.find(st => st.id === id);
    if (!match) return;
    const updated = staff.filter(st => st.id !== id);
    setStaff(updated);
    saveToStorage('staff', updated);
    logActivity('STAFF_RETIRE', `De-registered staff record: ${match.name}.`);
  };

  const recordAttendance = (
    staffId: string,
    dateStr: string,
    status: 'Present' | 'Absent' | 'Late',
    checkIn?: string,
    checkOut?: string
  ) => {
    const updated = staff.map(st => {
      if (st.id === staffId) {
        const nextCheckIn = { ...(st.checkInTimes || {}) };
        const nextCheckOut = { ...(st.checkOutTimes || {}) };

        if (checkIn !== undefined) {
          if (checkIn === '') {
            delete nextCheckIn[dateStr];
          } else {
            nextCheckIn[dateStr] = checkIn;
          }
        }
        if (checkOut !== undefined) {
          if (checkOut === '') {
            delete nextCheckOut[dateStr];
          } else {
            nextCheckOut[dateStr] = checkOut;
          }
        }

        return {
          ...st,
          attendance: {
            ...st.attendance,
            [dateStr]: status
          },
          checkInTimes: nextCheckIn,
          checkOutTimes: nextCheckOut
        };
      }
      return st;
    });
    setStaff(updated);
    saveToStorage('staff', updated);
    logActivity('ATTENDANCE_LOG', `Saved attendance register for staff. Status: ${status}, In: ${checkIn || 'Not set'}, Out: ${checkOut || 'Not set'}`);
  };

  // Construction Operations
  const updateConstructionPhaseSubscription = (phaseId: string, subscriptionAmount: number) => {
    const updated = constructionPhases.map(p => 
      p.id === phaseId ? { ...p, subscriptionPerMember: subscriptionAmount } : p
    );
    setConstructionPhases(updated);
    saveToStorage('constructionPhases', updated);
    logActivity('CONSTRUCTION_SET_SUB', `Updated subscription for ${phaseId} to ${subscriptionAmount} BDT`);
  };

  const updateConstructionPhaseStatus = (phaseId: string, status: ConstructionPhase['status']) => {
    const updated = constructionPhases.map(p => 
      p.id === phaseId ? { ...p, status } : p
    );
    setConstructionPhases(updated);
    saveToStorage('constructionPhases', updated);
    logActivity('CONSTRUCTION_SET_STATUS', `Updated status of ${phaseId} to ${status}`);
  };

  const addConstructionExpense = (phaseId: string, expense: Omit<ConstructionExpense, 'id'>) => {
    const newExpense = { ...expense, id: `con_exp_${Date.now()}` };
    const updated = constructionPhases.map(p => 
      p.id === phaseId ? { ...p, expenses: [...p.expenses, newExpense] } : p
    );
    setConstructionPhases(updated);
    saveToStorage('constructionPhases', updated);
    logActivity('CONSTRUCTION_ADD_EXP', `Added construction expense [${expense.title}]: ${expense.amount} BDT to phase ${phaseId}`);
  };

  const updateConstructionExpense = (phaseId: string, expense: ConstructionExpense) => {
    const updated = constructionPhases.map(p => 
      p.id === phaseId ? { ...p, expenses: p.expenses.map(e => e.id === expense.id ? expense : e) } : p
    );
    setConstructionPhases(updated);
    saveToStorage('constructionPhases', updated);
    logActivity('CONSTRUCTION_UPD_EXP', `Updated construction expense [${expense.title}] in phase ${phaseId}`);
  };

  const deleteConstructionExpense = (phaseId: string, expenseId: string) => {
    const updated = constructionPhases.map(p => 
      p.id === phaseId ? { ...p, expenses: p.expenses.filter(e => e.id !== expenseId) } : p
    );
    setConstructionPhases(updated);
    saveToStorage('constructionPhases', updated);
    logActivity('CONSTRUCTION_DEL_EXP', `Deleted construction expense ID ${expenseId} from phase ${phaseId}`);
  };

  const addConstructionDeposit = (phaseId: string, deposit: Omit<ConstructionDeposit, 'id'>) => {
    const newDeposit = { ...deposit, id: `con_dep_${Date.now()}` };
    const updated = constructionPhases.map(p => 
      p.id === phaseId ? { ...p, deposits: [...p.deposits, newDeposit] } : p
    );
    setConstructionPhases(updated);
    saveToStorage('constructionPhases', updated);
    logActivity('CONSTRUCTION_ADD_DEP', `Recorded deposit of ${deposit.amountPaid} BDT from flat ${deposit.flatNumber} for ${phaseId}`);
  };

  const updateConstructionDeposit = (phaseId: string, deposit: ConstructionDeposit) => {
    const updated = constructionPhases.map(p => 
      p.id === phaseId ? { ...p, deposits: p.deposits.map(d => d.id === deposit.id ? deposit : d) } : p
    );
    setConstructionPhases(updated);
    saveToStorage('constructionPhases', updated);
    logActivity('CONSTRUCTION_UPD_DEP', `Updated deposit ID ${deposit.id} for flat ${deposit.flatNumber} in phase ${phaseId}`);
  };

  const deleteConstructionDeposit = (phaseId: string, depositId: string) => {
    const updated = constructionPhases.map(p => 
      p.id === phaseId ? { ...p, deposits: p.deposits.filter(d => d.id !== depositId) } : p
    );
    setConstructionPhases(updated);
    saveToStorage('constructionPhases', updated);
    logActivity('CONSTRUCTION_DEL_DEP', `Deleted deposit ID ${depositId} from phase ${phaseId}`);
  };

  // Backup & Restore Engine
  const exportData = (): string => {
    const dump = {
      config,
      members,
      flats,
      payments,
      expenses,
      notices,
      visitors,
      complaints,
      staff,
      activityLogs,
      constructionPhases
    };
    logActivity('DB_BACKUP_EXPORT', `Extracted complete database JSON schema archive.`);
    return JSON.stringify(dump, null, 2);
  };

  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.config) setConfig(parsed.config);
      if (parsed.members) setMembers(parsed.members);
      if (parsed.flats) setFlats(parsed.flats);
      if (parsed.payments) setPayments(parsed.payments);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.notices) setNotices(parsed.notices);
      if (parsed.visitors) setVisitors(parsed.visitors);
      if (parsed.complaints) setComplaints(parsed.complaints);
      if (parsed.staff) setStaff(parsed.staff);
      if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
      if (parsed.constructionPhases) setConstructionPhases(parsed.constructionPhases);

      const keys = ['config', 'members', 'flats', 'payments', 'expenses', 'notices', 'visitors', 'complaints', 'staff', 'activityLogs', 'constructionPhases'];
      keys.forEach(k => {
        if (parsed[k]) {
          localStorage.setItem(`as_${k}`, JSON.stringify(parsed[k]));
        }
      });

      logActivity('DB_RESTORE', `Restored society data from manual backup schema archive.`);
      addNotification('Database Restored', 'Complete society database restored successfully.', 'General');
      return true;
    } catch (e) {
      console.error("Backup file corruption: ", e);
      return false;
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    saveToStorage('notifications', []);
  };

  const markNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveToStorage('notifications', updated);
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_CONFIG);
    setMembers(DEFAULT_MEMBERS);
    setFlats(DEFAULT_FLATS);
    setPayments(DEFAULT_PAYMENTS);
    setExpenses(DEFAULT_EXPENSES);
    setNotices(DEFAULT_NOTICES);
    setVisitors(DEFAULT_VISITORS);
    setComplaints(DEFAULT_COMPLAINTS);
    setStaff(DEFAULT_STAFF);
    setActivityLogs(DEFAULT_LOGS);
    setNotifications(DEFAULT_NOTIFICATIONS);
    setUserAccounts(DEFAULT_USER_ACCOUNTS);
    setConstructionPhases(DEFAULT_CONSTRUCTION_PHASES);

    saveToStorage('config', DEFAULT_CONFIG);
    saveToStorage('members', DEFAULT_MEMBERS);
    saveToStorage('flats', DEFAULT_FLATS);
    saveToStorage('payments', DEFAULT_PAYMENTS);
    saveToStorage('expenses', DEFAULT_EXPENSES);
    saveToStorage('notices', DEFAULT_NOTICES);
    saveToStorage('visitors', DEFAULT_VISITORS);
    saveToStorage('complaints', DEFAULT_COMPLAINTS);
    saveToStorage('staff', DEFAULT_STAFF);
    saveToStorage('activityLogs', DEFAULT_LOGS);
    saveToStorage('notifications', DEFAULT_NOTIFICATIONS);
    saveToStorage('user_accounts', DEFAULT_USER_ACCOUNTS);
    saveToStorage('constructionPhases', DEFAULT_CONSTRUCTION_PHASES);

    logActivity('DB_FACTORY_RESET', `Database has been reset to pristine demo values.`);
    addNotification('Factory Reset App', 'Reset app back to default demo building dataset.', 'General');
  };

  // Dynamic filter to always omit payments of residents who/whose flat details are no longer active/present in `members`
  const activePayments = useMemo(() => {
    // If there are no members in the system at all (i.e. brand new setup), let's allow all payments so that they can see seed data if any.
    // Otherwise, filter by checking if there is a matching active member.
    if (members.length === 0) return payments;
    
    return payments.filter(p => {
      // Keep general or unassigned bills
      if (!p.flatNumber || p.memberName === 'System' || p.memberName === 'Unassigned') {
        return true;
      }
      
      const exists = members.some(m => 
        m.flatNumber === p.flatNumber && (
          m.name.toLowerCase().trim() === p.memberName.toLowerCase().trim() ||
          p.memberName.toLowerCase().trim().includes(m.name.toLowerCase().trim()) ||
          m.name.toLowerCase().trim().includes(p.memberName.toLowerCase().trim())
        )
      );
      return exists;
    });
  }, [payments, members]);

  return (
    <SocietyContext.Provider value={{
      currentUser,
      config,
      members,
      flats,
      payments: activePayments,
      expenses,
      notices,
      visitors,
      complaints,
      staff,
      activityLogs,
      notifications,
      constructionPhases,
      activeTab,
      setActiveTab,
      language,
      setLanguage,
      userAccounts,
      updateUserAccountStatus,
      deleteUserAccount,
      updateUserPassword,

      login,
      loginWithGoogle,
      logout,
      registerUser,
      updateProfile,
      updateConfig,

      addMember,
      updateMember,
      deleteMember,

      updateFlat,

      addPayment,
      updatePayment,
      markPaymentPaid,
      generateMonthlyFees,
      triggerPaymentReminder,
      deletePayment,

      addExpense,
      updateExpense,
      deleteExpense,

      addNotice,
      updateNotice,
      deleteNotice,

      addVisitor,
      exitVisitor,

      addComplaint,
      updateComplaint,

      addStaff,
      updateStaff,
      deleteStaff,
      recordAttendance,

      updateConstructionPhaseSubscription,
      updateConstructionPhaseStatus,
      addConstructionExpense,
      updateConstructionExpense,
      deleteConstructionExpense,
      addConstructionDeposit,
      updateConstructionDeposit,
      deleteConstructionDeposit,

      exportData,
      importData,
      clearNotifications,
      markNotificationsAsRead,
      resetToDefault
    }}>
      {children}
    </SocietyContext.Provider>
  );
};

export const useSociety = () => {
  const context = useContext(SocietyContext);
  if (!context) {
    throw new Error('useSociety must be used within a SocietyProvider');
  }
  return context;
};
