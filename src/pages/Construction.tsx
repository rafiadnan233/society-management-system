/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { jsPDF } from 'jspdf';
import { 
  ConstructionPhase, 
  ConstructionExpense, 
  ConstructionDeposit 
} from '../types';
import { 
  Building2, 
  CreditCard, 
  TrendingDown, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  DollarSign, 
  Calendar, 
  Filter, 
  X, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Layers, 
  User, 
  Briefcase, 
  PlusCircle, 
  Coins, 
  Wrench, 
  ArrowLeftRight,
  FileDown
} from 'lucide-react';

export default function Construction() {
  const { 
    constructionPhases, 
    updateConstructionPhaseSubscription, 
    updateConstructionPhaseStatus, 
    addConstructionExpense, 
    updateConstructionExpense, 
    deleteConstructionExpense, 
    addConstructionDeposit, 
    updateConstructionDeposit, 
    deleteConstructionDeposit, 
    flats, 
    language, 
    currentUser 
  } = useSociety();

  const t = translations[language];
  const isAdmin = currentUser?.role === 'Admin';

  // State Management
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('piling_basement');
  const [activeSubTab, setActiveSubTab] = useState<'deposits' | 'expenses'>('deposits');
  
  // Filtering & Search
  const [depositSearch, setDepositSearch] = useState('');
  const [depositFilter, setDepositFilter] = useState<'All' | 'Paid' | 'Due'>('All');
  const [expenseSearch, setExpenseSearch] = useState('');

  // Modal State
  const [showSubModal, setShowSubModal] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);

  // Editing state
  const [editingDeposit, setEditingDeposit] = useState<ConstructionDeposit | null>(null);
  const [editingExpense, setEditingExpense] = useState<ConstructionExpense | null>(null);

  // Form Fields State
  // Subscription form
  const [subAmount, setSubAmount] = useState<number>(0);
  
  // Deposit form
  const [depFlat, setDepFlat] = useState<string>('');
  const [depMember, setDepMember] = useState<string>('');
  const [depAmount, setDepAmount] = useState<number>(0);
  const [depDate, setDepDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [depMethod, setDepMethod] = useState<ConstructionDeposit['payMethod']>('Cash');
  const [depReceipt, setDepReceipt] = useState<string>('');
  const [depTrx, setDepTrx] = useState<string>('');
  const [depNotes, setDepNotes] = useState<string>('');

  // Expense form
  const [expTitle, setExpTitle] = useState<string>('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expVoucher, setExpVoucher] = useState<string>('');
  const [expSupplier, setExpSupplier] = useState<string>('');
  const [expDesc, setExpDesc] = useState<string>('');

  // Active Phase lookup
  const activePhase = constructionPhases.find(p => p.id === selectedPhaseId) || constructionPhases[0];

  // Helper formatting BDT
  const formatBDT = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  // Convert numbers to local script
  const formatNumber = (num: number) => {
    if (language === 'bn') {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d)]);
    }
    return String(num);
  };

  // Global calculations
  // Total 72 members
  const memberCount = 72; 
  
  // Total projected collection across all initialized phases
  const totalProjected = constructionPhases.reduce((sum, p) => sum + (p.subscriptionPerMember * memberCount), 0);
  
  // Total deposits/collections across all phases
  const totalDeposits = constructionPhases.reduce(
    (sum, p) => sum + p.deposits.reduce((pSum, d) => pSum + d.amountPaid, 0), 
    0
  );

  // Total expenses across all phases
  const totalExpenses = constructionPhases.reduce(
    (sum, p) => sum + p.expenses.reduce((pSum, e) => pSum + e.amount, 0), 
    0
  );

  const totalDues = totalProjected - totalDeposits;
  const currentNetFund = totalDeposits - totalExpenses;

  // Selected phase specific calculations
  const phaseTotalTarget = activePhase ? activePhase.subscriptionPerMember * memberCount : 0;
  const phaseTotalDeposited = activePhase ? activePhase.deposits.reduce((s, d) => s + d.amountPaid, 0) : 0;
  const phaseTotalSpent = activePhase ? activePhase.expenses.reduce((s, e) => s + e.amount, 0) : 0;
  const phaseRemainingDue = phaseTotalTarget - phaseTotalDeposited;
  const phaseBalance = phaseTotalDeposited - phaseTotalSpent;

  // Prepare ledger of 72 members/flats for the active phase
  // Let's generate a list of all 72 flats from standard structure to match payments
  const standardFlats = flats.length > 0 ? flats : Array.from({ length: 72 }, (_, i) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const floor = Math.floor(i / 8) + 1;
    const letter = letters[i % 8];
    return {
      id: String(i + 1),
      number: `${floor}${letter}`,
      floor,
      status: 'occupied_owner',
      ownerName: `Owner ${floor}${letter}`,
      renterName: '',
      phone: '',
      monthlyRent: 0,
      maintenanceStatus: 'Paid',
      squareFeet: 1540
    };
  });

  const memberLedger = standardFlats.map(f => {
    // Collect all deposits this flat has paid inside this phase
    const flatDeposits = activePhase ? activePhase.deposits.filter(d => d.flatNumber.toLowerCase() === f.number.toLowerCase()) : [];
    const totalPaid = flatDeposits.reduce((s, d) => s + d.amountPaid, 0);
    const required = activePhase ? activePhase.subscriptionPerMember : 0;
    const remaining = Math.max(0, required - totalPaid);
    const isPaidAll = totalPaid >= required;

    return {
      flatNo: f.number,
      ownerName: f.ownerName && f.ownerName !== 'Unassigned' ? f.ownerName : `Flat Owner ${f.number}`,
      required,
      paid: totalPaid,
      due: remaining,
      isPaidAll,
      deposits: flatDeposits
    };
  });

  // Filtering Member Ledger
  const filteredLedger = memberLedger.filter(m => {
    const matchesSearch = m.flatNo.toLowerCase().includes(depositSearch.toLowerCase()) || 
                          m.ownerName.toLowerCase().includes(depositSearch.toLowerCase());
    
    if (depositFilter === 'Paid') {
      return matchesSearch && m.isPaidAll;
    } else if (depositFilter === 'Due') {
      return matchesSearch && !m.isPaidAll;
    }
    return matchesSearch;
  });

  // Filtering Expenses List
  const filteredPhaseExpenses = activePhase ? activePhase.expenses.filter(e => {
    return e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
           e.supplierName.toLowerCase().includes(expenseSearch.toLowerCase()) ||
           e.voucherNo.toLowerCase().includes(expenseSearch.toLowerCase());
  }) : [];

  // Handlers
  const handleAnnounceSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    updateConstructionPhaseSubscription(selectedPhaseId, subAmount);
    setShowSubModal(false);
  };

  const handleUpdateStatus = (status: ConstructionPhase['status']) => {
    if (!isAdmin) return;
    updateConstructionPhaseStatus(selectedPhaseId, status);
  };

  const openAddDeposit = (flatNo?: string, owner?: string) => {
    setDepFlat(flatNo || flats[0]?.number || '1A');
    setDepMember(owner || `Member Owner ${flatNo || '1A'}`);
    setDepAmount(activePhase ? activePhase.subscriptionPerMember : 0);
    setDepDate(new Date().toISOString().split('T')[0]);
    setDepMethod('Cash');
    setDepReceipt(`REC-CS-${Date.now().toString().slice(-4)}`);
    setDepTrx('');
    setDepNotes('');
    setEditingDeposit(null);
    setShowDepModal(true);
  };

  const openEditDeposit = (dep: ConstructionDeposit) => {
    setEditingDeposit(dep);
    setDepFlat(dep.flatNumber);
    setDepMember(dep.memberName);
    setDepAmount(dep.amountPaid);
    setDepDate(dep.payDate);
    setDepMethod(dep.payMethod);
    setDepReceipt(dep.receiptNo || '');
    setDepTrx(dep.transactionId || '');
    setDepNotes(dep.notes || '');
    setShowDepModal(true);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই কাজটি সম্পন্ন করতে পারবেন।' : 'Only authorized admin can compile ledger audits.');
      return;
    }
    if (!depFlat || depAmount < 0) return;

    if (editingDeposit) {
      updateConstructionDeposit(selectedPhaseId, {
        id: editingDeposit.id,
        flatNumber: depFlat,
        memberName: depMember,
        amountPaid: depAmount,
        payDate: depDate,
        payMethod: depMethod,
        receiptNo: depReceipt || undefined,
        transactionId: depTrx || undefined,
        notes: depNotes || undefined
      });
    } else {
      addConstructionDeposit(selectedPhaseId, {
        flatNumber: depFlat,
        memberName: depMember,
        amountPaid: depAmount,
        payDate: depDate,
        payMethod: depMethod,
        receiptNo: depReceipt || undefined,
        transactionId: depTrx || undefined,
        notes: depNotes || undefined
      });
    }
    setShowDepModal(false);
  };

  const handleDeleteDeposit = (depId: string) => {
    if (!isAdmin) return;
    if (window.confirm(language === 'bn' ? 'আপনি কি এই জমা রশিদ মুছে ফেলতে চান?' : 'Are you sure you want to delete this construction deposit record?')) {
      deleteConstructionDeposit(selectedPhaseId, depId);
    }
  };

  const openAddExpense = () => {
    setExpTitle('');
    setExpAmount(0);
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpVoucher(`VOUCH-${Date.now().toString().slice(-4)}`);
    setExpSupplier('');
    setExpDesc('');
    setEditingExpense(null);
    setShowExpModal(true);
  };

  const openEditExpense = (exp: ConstructionExpense) => {
    setEditingExpense(exp);
    setExpTitle(exp.title);
    setExpAmount(exp.amount);
    setExpDate(exp.date);
    setExpVoucher(exp.voucherNo);
    setExpSupplier(exp.supplierName);
    setExpDesc(exp.description);
    setShowExpModal(true);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!expTitle || expAmount < 0) return;

    if (editingExpense) {
      updateConstructionExpense(selectedPhaseId, {
        id: editingExpense.id,
        title: expTitle,
        amount: expAmount,
        date: expDate,
        voucherNo: expVoucher,
        supplierName: expSupplier,
        description: expDesc
      });
    } else {
      addConstructionExpense(selectedPhaseId, {
        title: expTitle,
        amount: expAmount,
        date: expDate,
        voucherNo: expVoucher,
        supplierName: expSupplier,
        description: expDesc
      });
    }
    setShowExpModal(false);
  };

  const handleDeleteExpense = (expId: string) => {
    if (!isAdmin) return;
    if (window.confirm(language === 'bn' ? 'আপনি কি এই ভাউচার বা খরচ মুছে ফেলতে চান?' : 'Are you sure you want to delete this transaction voucher?')) {
      deleteConstructionExpense(selectedPhaseId, expId);
    }
  };

  const generatePDFStatement = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [15, 23, 42]; // Slate 900
      const textColor = [51, 65, 85]; // Slate 700

      let y = 15;

      const drawHeader = (isSubPage = false) => {
        doc.setFillColor(15, 23, 42); // Navy theme header bar
        doc.rect(15, 10, 180, 18, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("ASTHA TWIN TOWERS OWNERS SOCIETY", 20, 17);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text("BUILDING CONSTRUCTION LEDGER AUDIT STATEMENT", 20, 23);
        
        doc.setFont('helvetica', 'italic');
        doc.text(isSubPage ? `Page ${doc.internal.pages.length - 1}` : `Generated: ${new Date().toLocaleDateString()}`, 170, 20, { align: 'right' });
      };

      const checkNewPage = (needed: number) => {
        if (y + needed > 275) {
          doc.addPage();
          drawHeader(true); // Draw header on new page as well
          y = 35; // Start lower because of header
        }
      };

      // Draw first page header
      drawHeader();
      y = 35;

      // 1. PROJECT META / EXECUTIVE SUMMARY
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("1. EXECUTIVE CAPITAL SUMMARY", 15, y);
      y += 5;

      // Draw Summary Grid Boxes
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 25, 'FD'); // Outer box

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      
      // Column labels
      doc.text("EXPECTED TARGETS", 20, y + 6);
      doc.text("TOTAL DEPOSITS", 60, y + 6);
      doc.text("TOTAL EXPENDED", 100, y + 6);
      doc.text("OUTSTANDING DUES", 140, y + 6);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`BDT ${totalProjected.toLocaleString()}`, 20, y + 13);
      doc.setTextColor(16, 185, 129); // Green for deposits
      doc.text(`BDT ${totalDeposits.toLocaleString()}`, 60, y + 13);
      doc.setTextColor(239, 68, 68); // Red for expenses
      doc.text(`BDT ${totalExpenses.toLocaleString()}`, 100, y + 13);
      doc.setTextColor(217, 119, 6); // Amber for dues
      doc.text(`BDT ${totalDues.toLocaleString()}`, 140, y + 13);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 18, 195, y + 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`AVAILABLE CONSTRUCTION FUND SURPLUS: BDT ${currentNetFund.toLocaleString()}`, 20, y + 22.5);

      y += 33;

      // 2. PHASE-WISE BUDGET SEGREGATION
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("2. STRUCTURAL PHASES BUDGET DISTRIBUTION", 15, y);
      y += 5;

      // Draw table headers
      const colX = [15, 52, 74, 98, 122, 144, 168];
      
      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Phase Name", colX[0] + 2, y + 5);
      doc.text("Target/Unit", colX[1] + 2, y + 5);
      doc.text("Total Budget", colX[2] + 2, y + 5);
      doc.text("Deposited", colX[3] + 2, y + 5);
      doc.text("Spent", colX[4] + 2, y + 5);
      doc.text("Current Balance", colX[5] + 2, y + 5);
      doc.text("Status", colX[6] + 2, y + 5);
      
      y += 7;

      constructionPhases.forEach((phase) => {
        checkNewPage(8);
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 7, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y + 7, 195, y + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        
        const pName = phase.nameEn || phase.nameBn;
        doc.text(pName, colX[0] + 2, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.text(phase.subscriptionPerMember.toLocaleString(), colX[1] + 2, y + 4.5);
        
        const phaseBudget = phase.subscriptionPerMember * 72;
        doc.text(phaseBudget.toLocaleString(), colX[2] + 2, y + 4.5);

        const phaseDeposits = phase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
        doc.text(phaseDeposits.toLocaleString(), colX[3] + 2, y + 4.5);

        const phaseSpent = phase.expenses.reduce((sum, e) => sum + e.amount, 0);
        doc.text(phaseSpent.toLocaleString(), colX[4] + 2, y + 4.5);

        const currentBalance = phaseDeposits - phaseSpent;
        doc.text(currentBalance.toLocaleString(), colX[5] + 2, y + 4.5);

        // Status
        doc.setFont('helvetica', 'bold');
        let displayStatus = phase.status;
        if (phaseDeposits >= phaseBudget) {
          displayStatus = 'Completed';
        }

        if (displayStatus === 'Completed') {
          doc.setTextColor(16, 185, 129);
        } else if (displayStatus === 'In-Progress') {
          doc.setTextColor(59, 130, 246);
        } else {
          doc.setTextColor(100, 116, 139);
        }
        doc.text(displayStatus, colX[6] + 2, y + 4.5);

        y += 7;
      });

      y += 5;

      // 3. PHASE EXPENDITURE AUDIT LEDGER
      checkNewPage(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("3. PHASE-WISE DETAILED CAPITAL EXPENDITURES", 15, y);
      y += 6;

      // Iterate over active or all phases to list expenditure breakdown
      constructionPhases.forEach((phase) => {
        if (phase.expenses.length === 0) return;

        checkNewPage(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`${phase.nameEn || phase.nameBn} - Expenditures List`, 15, y);
        y += 4;

        // Draw Sub-table headers
        const expX = [15, 40, 85, 130, 160];

        doc.setFillColor(51, 65, 85);
        doc.rect(15, y, 180, 6, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("Date", expX[0] + 2, y + 4);
        doc.text("Title/Item Description", expX[1] + 2, y + 4);
        doc.text("Vendor/Supplier", expX[2] + 2, y + 4);
        doc.text("Voucher No", expX[3] + 2, y + 4);
        doc.text("Amount BDT", expX[4] + 2, y + 4);

        y += 6;

        phase.expenses.forEach(e => {
          checkNewPage(8);
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y + 6, 195, y + 6);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(51, 65, 85);
          
          doc.text(e.date, expX[0] + 2, y + 4);
          doc.text(e.title.substring(0, 32), expX[1] + 2, y + 4);
          doc.text(e.supplierName.substring(0, 32), expX[2] + 2, y + 4);
          doc.text(e.voucherNo || '-', expX[3] + 2, y + 4);

          doc.setFont('helvetica', 'bold');
          doc.text(e.amount.toLocaleString(), expX[4] + 2, y + 4);

          y += 6;
        });

        // Add Total Expense row under "Amount BDT"
        checkNewPage(8);
        doc.setDrawColor(15, 23, 42);
        doc.line(15, y + 1, 195, y + 1);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Total Amount:", expX[3] + 2, y + 5);
        
        const totalPhaseExpenses = phase.expenses.reduce((sum, e) => sum + e.amount, 0);
        doc.text(totalPhaseExpenses.toLocaleString(), expX[4] + 2, y + 5);

        y += 10; // Extra margin after each phase
      });

      // 4. UNPAID / DUE STATEMENT SUMMARY BY MEMBERS
      checkNewPage(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("4. UNRESOLVED MEMBER ARREARS SUMMARY (TOP UNITS)", 15, y);
      y += 5;

      const overdueLedger = standardFlats.map(f => {
        let totalPaid = 0;
        let totalRequired = 0;
        constructionPhases.forEach(p => {
          if (p.status !== 'Pending') {
            totalRequired += p.subscriptionPerMember;
            const pmts = p.deposits.filter(d => d.flatNumber.toLowerCase() === f.number.toLowerCase());
            totalPaid += pmts.reduce((sum, d) => sum + d.amountPaid, 0);
          }
        });
        const dueNum = Math.max(0, totalRequired - totalPaid);
        return {
          flatNo: f.number,
          ownerName: f.ownerName && f.ownerName !== 'Unassigned' ? f.ownerName : `Owner ${f.number}`,
          required: totalRequired,
          paid: totalPaid,
          due: dueNum
        };
      }).filter(m => m.due > 0);

      if (overdueLedger.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.text("All members are fully settled across all active and completed construction phases. No outstanding arrears.", 15, y + 4);
        y += 8;
      } else {
        const dx = [15, 45, 100, 140, 165];
        
        doc.setFillColor(239, 68, 68); // Red background for due table header
        doc.rect(15, y, 180, 6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("Flat", dx[0] + 2, y + 4);
        doc.text("Registered Owner", dx[1] + 2, y + 4);
        doc.text("Total Required", dx[2] + 2, y + 4);
        doc.text("Total Paid", dx[3] + 2, y + 4);
        doc.text("Outstanding Due", dx[4] + 2, y + 4);

        y += 6;

        overdueLedger.slice(0, 15).forEach((item) => {
          checkNewPage(8);
          doc.setDrawColor(241, 245, 249);
          doc.line(15, y + 6, 195, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(51, 65, 85);

          doc.text(item.flatNo, dx[0] + 2, y + 4);
          doc.text(item.ownerName.substring(0, 35), dx[1] + 2, y + 4);
          doc.text(`BDT ${item.required.toLocaleString()}`, dx[2] + 2, y + 4);
          doc.text(`BDT ${item.paid.toLocaleString()}`, dx[3] + 2, y + 4);
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(220, 38, 38); // red for due
          doc.text(`BDT ${item.due.toLocaleString()}`, dx[4] + 2, y + 4);
          doc.setTextColor(51, 65, 85); // reset

          y += 6;
        });

        if (overdueLedger.length > 15) {
          checkNewPage(7);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`... and ${overdueLedger.length - 15} more members with minor arrears. Refer to standard ledger in-app.`, 15, y + 4);
          y += 6;
        }
      }

      // Signoff section
      checkNewPage(35);
      y += 5;
      doc.setDrawColor(15, 23, 42);
      doc.line(15, y, 195, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text("ASTHA TWIN TOWERS JOINT DEVELOPMENT BOARD", 15, y);
      
      const userStr = currentUser ? `${currentUser.name} (${currentUser.role})` : 'System Administrator';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Audited & Compiled by: ${userStr}`, 15, y + 4);
      doc.text("Official ledger document certified under Astha Twin Towers Owners Association Charter.", 15, y + 8);

      // Signoff lines
      doc.line(145, y + 10, 190, y + 10);
      doc.setFont('helvetica', 'bold');
      doc.text("Authorized Signature", 145, y + 14);

      // Save document
      doc.save("Astha_Twin_Towers_Construction_Ledger_Statement.pdf");

    } catch (err) {
      console.error("PDF generation fail:", err);
      alert(language === 'bn' ? "পিডিএফ তৈরি করতে ত্রুটি ঘটেছে।" : "An error occurred while compiling the PDF audit.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight sm:text-2xl font-sans">
            {language === 'bn' ? 'বিল্ডিং নির্মাণ আর্থিক লেজার' : 'Building Construction Ledger'}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {language === 'bn' 
              ? 'পাইলিং, বেইসমেন্ট এবং ১ম হতে ১০ম ছাদ পর্যন্ত প্রতিটি ধাপের চাঁদা আদায় ও ব্যয়ের খতিয়ান' 
              : 'End-to-end accounting for Piling foundation, basement, and all 10 floor slabs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generatePDFStatement}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-4 py-2 text-xs font-bold cursor-pointer print:hidden transition-all duration-150"
            type="button"
          >
            <FileDown className="h-4 w-4 text-white" />
            <span>{language === 'bn' ? 'লেজার পিডিএফ ডাউনলোড' : 'Download PDF Statement'}</span>
          </button>

          
        </div>
      </div>

      {/* Overview Cards Container */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Total Projected Collection Targets */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100/80 hover:to-indigo-200/50 p-5 border border-indigo-200/40">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 font-sans">
              {language === 'bn' ? 'মোট লক্ষ্যমাত্রা' : 'Expected Targets'}
            </p>
            <Coins className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-4 text-2xl font-extrabold text-slate-900 font-sans leading-none">
            {formatBDT(totalProjected)}
          </p>
          <p className="mt-2 text-[10px] text-indigo-600 font-mono font-bold uppercase">
            {language === 'bn' ? `${formatNumber(memberCount)} জন সদস্যের চাঁদা` : `${memberCount} Unit Contributions`}
          </p>
        </div>

        {/* Total Deposited/Collected */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100/80 hover:to-emerald-200/50 p-5 border border-emerald-200/40">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-sans">
              {language === 'bn' ? 'মোট সংগৃহীত চাঁদা' : 'Total Deposits'}
            </p>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-4 text-2xl font-extrabold text-slate-900 font-sans leading-none">
            {formatBDT(totalDeposits)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-emerald-600 font-mono font-bold">
            <span>{formatNumber(totalProjected ? Math.round((totalDeposits / totalProjected) * 100) : 0)}% {language === 'bn' ? 'আদায় সম্পন্ন' : 'Collected'}</span>
          </div>
        </div>

        {/* Expenses incurred */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 hover:from-rose-100/80 hover:to-rose-200/50 p-5 border border-rose-200/40">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700 font-sans">
              {language === 'bn' ? 'মোট নির্মাণ ব্যয়' : 'Total Expended'}
            </p>
            <TrendingDown className="h-5 w-5 text-rose-600" />
          </div>
          <p className="mt-4 text-2xl font-extrabold text-slate-900 font-sans leading-none">
            {formatBDT(totalExpenses)}
          </p>
          <p className="mt-2 text-[10px] text-rose-600 font-mono font-bold uppercase">
            {language === 'bn' ? 'সবগুলো ধাপ মিলিয়ে' : 'All construction phases'}
          </p>
        </div>

        {/* Total Outstanding Dues */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100/80 hover:to-amber-200/50 p-5 border border-amber-200/40">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 font-sans">
              {language === 'bn' ? 'অবশিষ্ট বকেয়া' : 'Outstanding Dues'}
            </p>
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-4 text-2xl font-extrabold text-slate-900 font-sans leading-none">
            {formatBDT(totalDues)}
          </p>
          <p className="mt-2 text-[10px] text-amber-600 font-mono font-bold uppercase">
            {language === 'bn' ? 'বকেয়া চাঁদা আদায়যোগ্য' : 'Due for collection'}
          </p>
        </div>

        {/* Available Structural balance */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 hover:from-sky-100/80 hover:to-sky-200/50 p-5 border border-sky-200/40">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700 font-sans">
              {language === 'bn' ? 'তহবিল উদ্বৃত্ত' : 'Available Fund'}
            </p>
            <Building2 className="h-5 w-5 text-sky-600" />
          </div>
          <p className="mt-4 text-2xl font-extrabold text-slate-900 font-sans leading-none">
            {formatBDT(currentNetFund)}
          </p>
          <p className="mt-2 text-[10px] text-sky-600 font-mono font-bold uppercase">
            {language === 'bn' ? 'ট্রেজারি নেট ব্যালেন্স' : 'Net cash in hand'}
          </p>
        </div>

      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        
        {/* Left Side: Phase Timeline Selector */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600 whitespace-nowrap" />
              <span>{language === 'bn' ? 'নির্মাণের প্রধান ধাপসমূহ' : 'Construction Work Phases'}</span>
            </h3>
            <span className="rounded-full bg-slate-200/70 border border-slate-300 px-2 py-0.5 text-[9px] font-bold font-mono text-slate-600">
              {formatNumber(constructionPhases.length)} PHASES
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {constructionPhases.map((phase) => {
              const op = selectedPhaseId === phase.id;
              
              // Phase calculations
              const pTarget = phase.subscriptionPerMember * memberCount;
              const pDeposited = phase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
              const pPercent = pTarget > 0 ? Math.round((pDeposited / pTarget) * 100) : 0;
              const pSpent = phase.expenses.reduce((sum, e) => sum + e.amount, 0);

              return (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={`w-full text-left p-4 transition-all duration-200 flex flex-col gap-2 hover:bg-slate-50/80 cursor-pointer ${
                    op ? 'bg-emerald-50/45 border-l-4 border-emerald-600' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="pr-2">
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                        {language === 'bn' ? phase.nameBn : phase.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {language === 'bn' 
                          ? `সদস্য চাঁদা: ${formatBDT(phase.subscriptionPerMember)}` 
                          : `Per Member: ${formatBDT(phase.subscriptionPerMember)}`}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold leading-none font-sans uppercase tracking-wider ${
                      (pDeposited >= pTarget || phase.status === 'Completed') 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60' 
                        : phase.status === 'In-Progress' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {(pDeposited >= pTarget || phase.status === 'Completed') 
                        ? (language === 'bn' ? 'সম্পন্ন' : 'Completed') 
                        : phase.status === 'In-Progress' 
                          ? (language === 'bn' ? 'চলমান' : 'In-Progress') 
                          : (language === 'bn' ? 'বকেয়া' : 'Pending')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full mt-1">
                    <div className="flex justify-between items-center text-[9px] font-semibold text-slate-500 font-mono mb-1">
                      <span>{language === 'bn' ? 'সংগ্রহ:' : 'Collected:'} {formatBDT(pDeposited)}</span>
                      <span>{formatNumber(pPercent)}%</span>
                    </div>
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-350 ${
                          (pDeposited >= pTarget || phase.status === 'Completed') ? 'bg-emerald-600' : 'bg-indigo-600'
                        }`} 
                        style={{ width: `${Math.min(100, pPercent)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 mt-0.5 pt-1.5 border-t border-dashed border-slate-100">
                    <span>{language === 'bn' ? 'ব্যয়:' : 'Spent:'} <strong className="text-rose-600 font-semibold">{formatBDT(pSpent)}</strong></span>
                    <span>{language === 'bn' ? `বকেয়া: ${formatBDT(pTarget - pDeposited)}` : `Due: ${formatBDT(pTarget - pDeposited)}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Primary Phase Management Interface */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Phase Header Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider font-mono">
                  {language === 'bn' ? 'ধাপের বিস্তারিত বিবরণ' : 'Phase Details & Actions'}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  {language === 'bn' ? activePhase.nameBn : activePhase.nameEn}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold font-mono">
                  {language === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}
                </span>
                
                {isAdmin ? (
                  <select
                    value={(() => {
                      const activeTarget = activePhase.subscriptionPerMember * memberCount;
                      const activeDeposited = activePhase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
                      if (activeDeposited >= activeTarget) return 'Completed';
                      return activePhase.status;
                    })()}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none focus:border-emerald-600 shadow-sm transition-all duration-150 ${
                      (() => {
                        const activeTarget = activePhase.subscriptionPerMember * memberCount;
                        const activeDeposited = activePhase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
                        const isCompleted = activeDeposited >= activeTarget || activePhase.status === 'Completed';
                        return isCompleted 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : activePhase.status === 'In-Progress' 
                            ? 'bg-amber-100 text-amber-800 border-amber-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200';
                      })()
                    }`}
                  >
                    <option value="Pending">{language === 'bn' ? 'স্থগিত / পেন্ডিং' : 'Pending'}</option>
                    <option value="In-Progress">{language === 'bn' ? 'চলমান / ইন-প্রগ্রেস' : 'In-Progress'}</option>
                    <option value="Completed">{language === 'bn' ? 'সম্পন্ন / কমপ্লিটেড' : 'Completed'}</option>
                  </select>
                ) : (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    (() => {
                      const activeTarget = activePhase.subscriptionPerMember * memberCount;
                      const activeDeposited = activePhase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
                      const isCompleted = activeDeposited >= activeTarget || activePhase.status === 'Completed';
                      return isCompleted 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : activePhase.status === 'In-Progress' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-600';
                    })()
                  }`}>
                    {(() => {
                      const activeTarget = activePhase.subscriptionPerMember * memberCount;
                      const activeDeposited = activePhase.deposits.reduce((sum, d) => sum + d.amountPaid, 0);
                      const isCompleted = activeDeposited >= activeTarget || activePhase.status === 'Completed';
                      return isCompleted 
                        ? (language === 'bn' ? 'সম্পন্ন' : 'Completed') 
                        : activePhase.status === 'In-Progress' 
                          ? (language === 'bn' ? 'চলমান' : 'In-Progress') 
                          : (language === 'bn' ? 'স্থগিত' : 'Pending');
                    })()}
                  </span>
                )}
              </div>
            </div>

            {/* Sub Stats Dashboard */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-1">
              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'bn' ? 'ঘোষিত সদস্য চাঁদা' : 'Contribution Per Member'}
                </span>
                <p className="text-base font-extrabold text-slate-900 font-sans mt-1">
                  {formatBDT(activePhase.subscriptionPerMember)}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSubAmount(activePhase.subscriptionPerMember);
                      setShowSubModal(true);
                    }}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline mt-1 cursor-pointer block text-left"
                  >
                    {language === 'bn' ? 'চাঁদা পরিবর্তন করুন' : 'Change Amount'}
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'bn' ? 'সর্বমোট লক্ষ্যমাত্রা' : 'Target Collections'}
                </span>
                <p className="text-base font-extrabold text-slate-950 font-sans mt-1">
                  {formatBDT(phaseTotalTarget)}
                </p>
                <span className="text-[9px] text-slate-500 block font-mono">
                  {language === 'bn' ? `${formatNumber(memberCount)} জন সদস্য × ${formatBDT(activePhase.subscriptionPerMember)}` : `${memberCount} units × ${formatBDT(activePhase.subscriptionPerMember)}`}
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'bn' ? 'আদায়কৃত চাঁদা' : 'Total Collected'}
                </span>
                <p className="text-base font-extrabold text-slate-900 font-sans mt-1">
                  {formatBDT(phaseTotalDeposited)}
                </p>
                <span className="text-[9px] text-emerald-600 block font-bold font-sans">
                  {language === 'bn' ? `অবশিষ্ট বকেয়া: ${formatBDT(phaseRemainingDue)}` : `Remaining Due: ${formatBDT(phaseRemainingDue)}`}
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'bn' ? 'ধাপের ব্যয়' : 'Phase Expenditure'}
                </span>
                <p className="text-base font-extrabold text-slate-900 font-sans mt-1">
                  {formatBDT(phaseTotalSpent)}
                </p>
                <span className="text-[9px] text-slate-500 block font-bold">
                  {language === 'bn' ? `ব্যালেন্স: ${formatBDT(phaseBalance)}` : `Treasury Bal: ${formatBDT(phaseBalance)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Sub Tab Switcher */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveSubTab('deposits')}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'deposits' 
                  ? 'border-emerald-600 text-emerald-800' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Coins className="h-4 w-4" />
              <span>{language === 'bn' ? 'সদস্যদের চাঁদা আদায়ের খতিয়ান' : 'Residents Contribution Ledger'}</span>
              <span className="rounded-full bg-slate-100 border px-2 py-0.5 text-[9px] font-bold font-mono">
                {formatNumber(memberCount)}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('expenses')}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'expenses' 
                  ? 'border-emerald-600 text-emerald-800' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>{language === 'bn' ? 'নির্মাণ ব্যয় ও খরচ ভাউচার' : 'Material & Structural Expenses'}</span>
              <span className="rounded-full bg-slate-100 border px-2 py-0.5 text-[9px] font-bold font-sans">
                {formatNumber(activePhase.expenses.length)}
              </span>
            </button>
          </div>

          {/* Main SubTab Content Panels */}
          {activeSubTab === 'deposits' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
              
              {/* Collection Lists controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
                
                {/* Search Input */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'ফ্ল্যাট বা সদস্যের নাম অনুসন্ধান...' : 'Search by flat number or resident name...'}
                    value={depositSearch}
                    onChange={(e) => setDepositSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 font-sans shadow-sm"
                  />
                </div>

                {/* Filters and Add New */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Status filter button */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setDepositFilter('All')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        depositFilter === 'All' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'সব' : 'All'}
                    </button>
                    <button
                      onClick={() => setDepositFilter('Paid')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        depositFilter === 'Paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                    </button>
                    <button
                      onClick={() => setDepositFilter('Due')}
                      className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        depositFilter === 'Due' ? 'bg-amber-50 text-amber-800' : 'bg-white text-slate-500'
                      }`}
                    >
                      {language === 'bn' ? 'বকেয়া' : 'Due'}
                    </button>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => openAddDeposit()}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-[#D4AF37]/20 px-3.5 py-1.8 text-xs font-bold cursor-pointer text-white shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{language === 'bn' ? 'নতুন কিস্তি জমা যোগ করুন' : 'Collect New Instalment'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ledger Table listing 72 units */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase tracking-widest font-mono text-[10px] font-bold border-b border-slate-100">
                      <th className="py-3 px-4">{language === 'bn' ? 'ফ্ল্যাট নং' : 'Flat No'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'সদস্যের নাম' : 'Member Contributor'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'ধাপের পাওনা' : 'Required Share'}</th>
                      <th className="py-3 px-4 text-center">{language === 'bn' ? 'মোট সংগৃহীত' : 'Paid BDT'}</th>
                      <th className="py-3 px-4 text-right">{language === 'bn' ? 'অবশিষ্ট বকেয়া' : 'Pending Due'}</th>
                      <th className="py-3 px-4 text-center print:hidden">{language === 'bn' ? 'অবস্থা / রসিদ সংযোগ' : 'Receipt Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                          {language === 'bn' ? 'কোনো সদস্য জমা খতিয়ান রেকর্ড মেলেনি।' : 'No resident contributor logs matching search qualifiers found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((m) => (
                        <tr key={m.flatNo} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-extrabold text-slate-900 font-sans">{m.flatNo}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{m.ownerName}</td>
                          <td className="py-3 px-4 text-slate-500 font-bold font-sans">{formatBDT(m.required)}</td>
                          <td className="py-3 px-4 text-center font-extrabold text-slate-900 font-sans">
                            {formatBDT(m.paid)}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold font-sans">
                            {m.due > 0 ? (
                              <span className="text-amber-600 font-bold">{formatBDT(m.due)}</span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center print:hidden">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              {m.deposits.length > 0 ? (
                                <div className="space-y-1">
                                  {m.deposits.map(dep => (
                                    <div key={dep.id} className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                      <span className="font-mono text-[9px] font-bold">
                                        {formatBDT(dep.amountPaid)} ({dep.payMethod})
                                      </span>
                                      {isAdmin && (
                                        <div className="flex items-center gap-1">
                                          <button 
                                            onClick={() => openEditDeposit(dep)}
                                            className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                            title="Edit Deposit"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteDeposit(dep.id)}
                                            className="text-rose-600 hover:text-rose-800 cursor-pointer"
                                            title="Delete Invoice"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {isAdmin && m.due > 0 && (
                                    <button
                                      onClick={() => openAddDeposit(m.flatNo, m.ownerName)}
                                      className="text-[9px] font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center justify-center gap-0.5 hover:underline cursor-pointer"
                                    >
                                      <Plus className="h-2.5 w-2.5" />
                                      <span>{language === 'bn' ? 'বাকি অংশ আদায়' : 'Collect Balance'}</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                isAdmin ? (
                                  <button
                                    onClick={() => openAddDeposit(m.flatNo, m.ownerName)}
                                    className="rounded bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 text-[10px] font-extrabold hover:bg-rose-100 cursor-pointer"
                                  >
                                    {language === 'bn' ? 'চাঁদা আদায় করুন' : 'Collect Fee'}
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-500 tracking-wider">
                                    {language === 'bn' ? 'পরিশোধহীন' : 'Unpaid'}
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            // Material Expenditures Tab
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
              
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'খরচের বিবরণ, ভাউচার বা সরবরাহকারী...' : 'Search by voucher, supplier or materials...'}
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 font-sans shadow-sm"
                  />
                </div>

                {isAdmin && (
                  <button
                    onClick={openAddExpense}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-[#D4AF37]/20 px-4 py-2 text-xs font-bold cursor-pointer text-white shadow-sm"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>{language === 'bn' ? 'নতুন খরচ ভাউচার যোগ করুন' : 'Record New Venture Expense'}</span>
                  </button>
                )}
              </div>

              {/* Expenses table list */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase tracking-widest font-mono text-[10px] font-bold border-b border-slate-100">
                      <th className="py-3 px-4">{language === 'bn' ? 'তারিখ' : 'Voucher Date'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'ভাউচার নং' : 'Voucher ID'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'খরচের বিবরণ' : 'Description Header'}</th>
                      <th className="py-3 px-4">{language === 'bn' ? 'সরবরাহকারী' : 'Contractor / Supplier'}</th>
                      <th className="py-3 px-4 text-right">{language === 'bn' ? 'খরচের পরিমাণ' : 'Paid amount'}</th>
                      <th className="py-3 px-4 text-center print:hidden">{language === 'bn' ? 'সম্পাদনা' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPhaseExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                          {language === 'bn' ? 'এই ধাপে এখনো কোনো ব্যয়ের বিবরণ নিবন্ধিত হয়নি।' : 'No material procurement vouchers recorded for this selected work phase.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPhaseExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-600 font-bold whitespace-nowrap font-sans">{exp.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">{exp.voucherNo}</td>
                          <td className="py-3 px-4">
                            <h5 className="font-extrabold text-slate-900 leading-tight">{exp.title}</h5>
                            {exp.description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{exp.description}</p>}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{exp.supplierName}</td>
                          <td className="py-3 px-4 text-right font-extrabold font-sans text-rose-600">
                            {formatBDT(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-center print:hidden">
                            {isAdmin ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditExpense(exp)}
                                  className="rounded border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 p-1 hover:border-slate-350 cursor-pointer"
                                  title="Edit Ledger Item"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="rounded border border-slate-200 bg-white hover:bg-slate-50 text-rose-600 p-1 hover:border-slate-350 cursor-pointer"
                                  title="Delete Ledger Item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredPhaseExpenses.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr className="font-bold text-slate-800">
                        <td className="py-3 px-4" colSpan={3}></td>
                        <td className="py-3 px-4 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          {language === 'bn' ? 'মোট ব্যয়ের পরিমাণ:' : 'Total Expenditure:'}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 text-sm font-extrabold whitespace-nowrap font-sans">
                          {formatBDT(filteredPhaseExpenses.reduce((sum, e) => sum + e.amount, 0))}
                        </td>
                        <td className="py-3 px-4 text-center print:hidden"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* 1. Modal: Announced subscription per member */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h4 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'ধাপের নির্ধারিত চাঁদা ঘোষণা করুন' : 'Announce Phase Share Subscription'}
              </h4>
              <button 
                onClick={() => setShowSubModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAnnounceSubscription} className="p-5 space-y-4">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200/50 flex gap-2">
                <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                  {language === 'bn' 
                    ? 'এখানে ঘোষিত চাঁদাটি ৭২ জন সদস্যের প্রত্যেকের জন্য প্রযোজ্য হবে। নির্ধারিত চাঁদা পরিবর্তন করলে এই ধাপের মোট লক্ষ্যমাত্রা স্বয়ংক্রিয়ভাবে পুনঃহিসাব হবে।' 
                    : 'Setting this subscription amount instantly binds it across all 72 units. Changing this values recalculates targets dynamically.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {language === 'bn' ? 'সক্রিয় ধাপের নাম' : 'Current Active Phase'}
                </label>
                <p className="font-extrabold text-sm text-slate-900 bg-slate-50 border px-3 py-2 rounded-lg">
                  {language === 'bn' ? activePhase.nameBn : activePhase.nameEn}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'প্রতি সদস্যের চাঁদার পরিমাণ (৳)' : 'Subscription Amount per Member (BDT)'}
                </label>
                <input
                  type="number"
                  required
                  value={subAmount || ''}
                  onChange={(e) => setSubAmount(parseFloat(e.target.value) || 0)}
                  placeholder="যেমন: ৮০,০০০"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  {language === 'bn' ? 'চাঁদা ঘোষণা করুন' : 'Confirm Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Record Deposit Payment */}
      {showDepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h4 className="text-sm font-bold text-slate-800">
                {editingDeposit 
                  ? (language === 'bn' ? 'জমা কিস্তি বিবরণ সংশোধন' : 'Adjust Contribution Deposit') 
                  : (language === 'bn' ? 'নতুন কিস্তি জমা যোগ করুন' : 'Record Member Instalment Deposit')}
              </h4>
              <button 
                onClick={() => setShowDepModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleDepositSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Flat selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ফ্ল্যাট নম্বর নির্বাচন' : 'Target Unit Flat No.'}
                  </label>
                  {editingDeposit ? (
                    <p className="font-extrabold text-xs text-slate-900 bg-slate-100 px-3 py-2 rounded-lg border border-slate-150">
                      {depFlat}
                    </p>
                  ) : (
                    <select
                      value={depFlat}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDepFlat(val);
                        const matchedFlat = flats.find(f => f.number === val);
                        if (matchedFlat && matchedFlat.ownerName && matchedFlat.ownerName !== 'Unassigned') {
                          setDepMember(matchedFlat.ownerName);
                        } else {
                          setDepMember(`Member Owner ${val}`);
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                    >
                      {standardFlats.map(f => (
                        <option key={f.number} value={f.number}>
                          {language === 'bn' ? `ফ্ল্যাট ${f.number} (${f.ownerName || 'Unassigned'})` : `Flat ${f.number} (${f.ownerName || 'Owner'})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Member/Owner name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'সদস্যের নাম' : 'Member Contributor Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={depMember}
                    onChange={(e) => setDepMember(e.target.value)}
                    placeholder="সদস্যের পুরো নাম"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'জমা দেওয়ার পরিমাণ (৳)' : 'Deposited amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={depAmount}
                    onChange={(e) => setDepAmount(parseFloat(e.target.value) || 0)}
                    placeholder="যেমন: ৮০,০০০"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Deposit Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'অর্থ পরিশোধের তারিখ' : 'Payment Clearance Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={depDate}
                    onChange={(e) => setDepDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'লেনদেনের মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={depMethod}
                    onChange={(e) => setDepMethod(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  >
                    <option value="Cash">{language === 'bn' ? 'ক্যাশ / নগদ অর্থ' : 'Cash'}</option>
                    <option value="Bank">{language === 'bn' ? 'ব্যাংক লেনদেন' : 'Bank Transfer'}</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                  </select>
                </div>

                {/* Money receipt no */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'রসিদ / মানি রিসিট নং' : 'Money Receipt ID'}
                  </label>
                  <input
                    type="text"
                    value={depReceipt}
                    onChange={(e) => setDepReceipt(e.target.value)}
                    placeholder="যেমন: REC-204"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Bank / mobile transaction id */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ব্যাংক চালানি / TrxID (ঐচ্ছিক)' : 'Bank Draft / TrxID (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={depTrx}
                    onChange={(e) => setDepTrx(e.target.value)}
                    placeholder="যেমন: BK539050X1"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'অতিরিক্ত মন্তব্য (ঐচ্ছিক)' : 'Ledger Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={depNotes}
                    onChange={(e) => setDepNotes(e.target.value)}
                    placeholder="যেমন: ১ম কিস্তি পরিশোধ"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDepModal(false)}
                  className="rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  {editingDeposit ? (language === 'bn' ? 'সংশোধন চূড়ান্ত করুন' : 'Apply Adjustments') : (language === 'bn' ? 'জমা রশিদ তৈরি করুন' : 'Approve Settlement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Record Expense Invoice */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h4 className="text-sm font-bold text-slate-800">
                {editingExpense 
                  ? (language === 'bn' ? 'নির্মাণ ব্যয় চালান সংশোধন' : 'Adjust Construction Invoice') 
                  : (language === 'bn' ? 'নতুন খরচ ভাউচার যোগ করুন' : 'Journal Construction Expense Voucher')}
              </h4>
              <button 
                onClick={() => setShowExpModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'খরচের প্রধান খাত / বিবরণ' : 'Expense Category Description'}
                  </label>
                  <input
                    type="text"
                    required
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="যেমন: ৫০ টন রড ক্রয় (বিএসআরএম)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'খরচের পরিমাণ (৳)' : 'Expense Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    placeholder="যেমন: ৪৫,০০,০০০"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ভাউচারের তারিখ' : 'Invoice Clearance Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Voucher number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ভাউচার / সবুজ রশিদ নম্বর' : 'Voucher Receipt No.'}
                  </label>
                  <input
                    type="text"
                    required
                    value={expVoucher}
                    onChange={(e) => setExpVoucher(e.target.value)}
                    placeholder="যেমন: VOUCH-405"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Supplier name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'সরবরাহকারী বা প্রতিষ্ঠানের নাম' : 'Contractor / Supplier'}
                  </label>
                  <input
                    type="text"
                    required
                    value={expSupplier}
                    onChange={(e) => setExpSupplier(e.target.value)}
                    placeholder="যেমন: মেসার্স আবুল স্টীল কো."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'অতিরিক্ত বর্ণনা' : 'Detailed Narrative'}
                  </label>
                  <textarea
                    rows={2}
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="কাজের বিস্তারিত বিবরণ বা উপকরণের গুণমান..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 shadow-sm"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  {editingExpense ? (language === 'bn' ? 'খরচ সংশোধন নিশ্চিত করুন' : 'Confirm Amendment') : (language === 'bn' ? 'ভাউচার হিসাবভুক্ত করুন' : 'Post Voucher Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
