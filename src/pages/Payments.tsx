/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Payment } from '../types';
import { 
  Plus, 
  CreditCard, 
  Search, 
  Check, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Printer, 
  FileText, 
  X,
  Send,
  AlertCircle,
  Building,
  Download,
  MessageSquare,
  Phone,
  Settings,
  Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeAllInlineStyles } from '../utils/oklchPatch';
import FormalReceiptGenerator from '../components/FormalReceiptGenerator';

export default function Payments() {
  const { 
    payments, 
    markPaymentPaid, 
    generateMonthlyFees, 
    triggerPaymentReminder, 
    config, 
    language,
    flats,
    currentUser,
    addPayment,
    updatePayment,
    updateConfig,
    deletePayment
  } = useSociety();

  const t = translations[language];

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  
  // Modals controllers
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [checkoutBill, setCheckoutBill] = useState<Payment | null>(null);
  const [showAddCustomBill, setShowAddCustomBill] = useState(false);
  const [alertingPayment, setAlertingPayment] = useState<Payment | null>(null);
  const [customMsgText, setCustomMsgText] = useState('');
  const [isGeneratingDirectPDFId, setIsGeneratingDirectPDFId] = useState<string | null>(null);
  const [directPDFPayment, setDirectPDFPayment] = useState<Payment | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getAlertMessageTemplate = (p: Payment) => {
    if (language === 'bn') {
      return `প্রিয় বাসিন্দা, আপনার ফ্ল্যাট ${p.flatNumber}-এর ${p.billingMonth} মাসের ${p.feeType} বিল ৳${p.amount} পরিশোধের অনুরোধ করা হচ্ছে। বিকাশ: ${config.bKashMerchant} অথবা নগদ: ${config.nagadMerchant}-এর মাধ্যমে পরিশোধ করুন। ধন্যবাদ - আস্থা টুইন টাওয়ার সোসাইটি`;
    }
    return `Dear Resident, please pay your ${p.feeType} bill of BDT ৳${p.amount} for Month: ${p.billingMonth} (Flat ${p.flatNumber}). We accept BKash merchant: ${config.bKashMerchant}, Nagad: ${config.nagadMerchant}. Thank you - Astha Twin Towers Administration`;
  };

  const openAlertCenter = (p: Payment) => {
    setAlertingPayment(p);
    setCustomMsgText(getAlertMessageTemplate(p));
  };

  useEffect(() => {
    if (activeReceipt) {
      document.body.classList.add('printing-receipt-active');
    } else {
      document.body.classList.remove('printing-receipt-active');
    }
    return () => {
      document.body.classList.remove('printing-receipt-active');
    };
  }, [activeReceipt]);

  // bKash Multi-step checkout states
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [checkoutMethod, setCheckoutMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Cash'>('bKash');
  const [mfsNumber, setMfsNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);

  // New States for MFS QR Code Generator
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showFormalReceiptGenerator, setShowFormalReceiptGenerator] = useState(false);
  const [qrWallet, setQrWallet] = useState<'bKash' | 'Nagad'>('bKash');
  const [qrFlat, setQrFlat] = useState('');
  const [qrAmount, setQrAmount] = useState(5000);
  const [qrReference, setQrReference] = useState('');
  const [copiedTextType, setCopiedTextType] = useState<'merchant' | 'reference' | 'amount' | null>(null);

  // Sub-tabs in Simulated checkout modal
  const [checkoutSubTab, setCheckoutSubTab] = useState<'qr' | 'form'>('qr');
  const [checkoutTxnId, setCheckoutTxnId] = useState('');

  const copyToClipboard = (text: string, type: 'merchant' | 'reference' | 'amount') => {
    navigator.clipboard.writeText(text);
    setCopiedTextType(type);
    setTimeout(() => {
      setCopiedTextType(null);
    }, 1500);
  };

  // Custom bill variables
  const [customFlat, setCustomFlat] = useState('1B');
  const [customTitle, setCustomTitle] = useState('June 2026 Monthly Bill');
  const [customFeeType, setCustomFeeType] = useState<Payment['feeType']>('Maintenance');
  const [customAmount, setCustomAmount] = useState(5000);
  const [customMonth, setCustomMonth] = useState('2026-06');

  const formatBDT = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  const getFilteredPayments = () => {
    return payments.filter(p => {
      const matchesSearch = p.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.id.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      
      // If resident is logged in, show ONLY their flat billings unless they search
      const matchesUser = currentUser?.role !== 'Resident' || p.flatNumber === currentUser.flatNumber;
      
      return matchesSearch && matchesStatus && matchesUser;
    });
  };

  const filteredPayments = getFilteredPayments();

  // Handle Monthly Bill Auto generation trigger
  const handleBulkGenerate = () => {
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    generateMonthlyFees(selectedMonth);
  };

  // Launch simulated checkout wizard
  const startCheckout = (bill: Payment) => {
    setCheckoutBill(bill);
    setPaymentAmount(bill.dueAmount);
    setCheckoutStep(1);
    setCheckoutError('');
    setMfsNumber(currentUser?.phone || '01712345678');
    setOtpCode('');
    setPinCode('');
    setCheckoutSubTab('qr');
    setCheckoutTxnId('');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (checkoutStep === 1) {
      if (mfsNumber.length < 11) {
        setCheckoutError(language === 'bn' ? 'দয়া করে সঠিক ওয়ালেট নম্বর দিন (১১ ডিজিট)' : 'Please enter active 11-digit mobile number');
        return;
      }
      setCheckoutStep(2);
    } else if (checkoutStep === 2) {
      if (otpCode.length < 4) {
        setCheckoutError(language === 'bn' ? 'সঠিক OTP কোড বা ৪ সংখ্যা প্রবেশ দিন' : 'Please input 4 to 6-digit confirmation OTP code');
        return;
      }
      setCheckoutStep(3);
    } else if (checkoutStep === 3) {
      if (pinCode.length < 4) {
        setCheckoutError(language === 'bn' ? 'PIN নম্বর প্রবেশ দিন' : 'Please input 4 to 5 digit security wallet PIN code');
        return;
      }

      // Complete checkout simulation
      if (checkoutBill) {
        let prefix = checkoutMethod === 'bKash' ? 'BKX' : checkoutMethod === 'Nagad' ? 'NGD' : 'RCK';
        let simulatedTxnID = `${prefix}${Math.floor(100000 + Math.random() * 900000)}Y`;

        markPaymentPaid(checkoutBill.id, checkoutMethod as any, simulatedTxnID, paymentAmount);
        setCheckoutBill(null);
      }
    }
  };

  const handleCustomBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    const targetFlat = flats.find(f => f.number === customFlat);
    const occupantName = targetFlat 
      ? (targetFlat.status === 'occupied_tenant' ? targetFlat.renterName : targetFlat.ownerName) 
      : 'Unknown Resident';

    addPayment({
      title: customTitle,
      flatNumber: customFlat,
      memberName: occupantName || 'Resident',
      amount: customAmount,
      dueAmount: customAmount,
      paidAmount: 0,
      feeType: customFeeType,
      billingMonth: customMonth,
      status: 'Pending'
    });

    setShowAddCustomBill(false);
  };

  // Late Fee Configuration and Automatic Operations
  const [showLateFeeModal, setShowLateFeeModal] = useState(false);
  const [localEnableLateFee, setLocalEnableLateFee] = useState(config.enableLateFee || false);
  const [localLateFeePercent, setLocalLateFeePercent] = useState(config.lateFeePercentage || 5);

  useEffect(() => {
    setLocalEnableLateFee(config.enableLateFee || false);
    setLocalLateFeePercent(config.lateFeePercentage || 5);
  }, [config.enableLateFee, config.lateFeePercentage]);

  const handleSaveLateRules = () => {
    updateConfig({
      enableLateFee: localEnableLateFee,
      lateFeePercentage: localLateFeePercent,
    });
    setShowLateFeeModal(false);
  };

  const handleToggleOverdue = (p: Payment) => {
    if (p.status !== 'Overdue') {
      let updatedPay = { ...p, status: 'Overdue' as const };
      if (config.enableLateFee) {
        const hasApplied = p.title.toLowerCase().includes('late fee') || p.title.toLowerCase().includes('বিলম্ব ফি');
        if (!hasApplied) {
          const rate = config.lateFeePercentage || 5;
          const fee = Math.round(p.amount * (rate / 100));
          if (fee > 0) {
            updatedPay.amount = p.amount + fee;
            updatedPay.dueAmount = p.dueAmount + fee;
            const lateLabelEn = ` (+${rate}% Late Fee)`;
            const lateLabelBn = ` (+${rate}% বিলম্ব ফি)`;
            updatedPay.title = `${p.title}${language === 'bn' ? lateLabelBn : lateLabelEn}`;
          }
        }
      }
      updatePayment(updatedPay);
    } else {
      let updatedPay = { ...p, status: 'Pending' as const };
      const matchEn = p.title.match(/\s\(\+(\d+)% Late Fee\)/);
      const matchBn = p.title.match(/\s\(\+(\d+)% বিলম্ব ফি\)/);
      const match = matchEn || matchBn;
      if (match) {
        const rate = parseInt(match[1]);
        const originalAmount = Math.round(p.amount / (1 + rate / 100));
        const diff = p.amount - originalAmount;
        updatedPay.amount = originalAmount;
        updatedPay.dueAmount = Math.max(0, p.dueAmount - diff);
        updatedPay.title = p.title.replace(/\s\(\+(\d+)% (Late Fee|বিলম্ব ফি)\)/, '');
      }
      updatePayment(updatedPay);
    }
  };

  const handleScanAndApplyLateFees = () => {
    let count = 0;
    const rate = config.lateFeePercentage || 5;

    payments.forEach(p => {
      if ((p.status === 'Pending' || p.status === 'Partial') && p.billingMonth < selectedMonth) {
        let updatedPay = { ...p, status: 'Overdue' as const };
        if (config.enableLateFee) {
          const hasApplied = p.title.toLowerCase().includes('late fee') || p.title.toLowerCase().includes('বিলম্ব ফি');
          if (!hasApplied) {
            const fee = Math.round(p.amount * (rate / 100));
            if (fee > 0) {
              updatedPay.amount = p.amount + fee;
              updatedPay.dueAmount = p.dueAmount + fee;
              const lateLabelEn = ` (+${rate}% Late Fee)`;
              const lateLabelBn = ` (+${rate}% বিলম্ব ফি)`;
              updatedPay.title = `${p.title}${language === 'bn' ? lateLabelBn : lateLabelEn}`;
            }
          }
        }
        updatePayment(updatedPay);
        count++;
      }
    });

    alert(
      language === 'bn'
        ? `সম্পন্ন হয়েছে! ${count}টি পূর্ববর্তী বকেয়া ইনভয়েসে বিলম্ব ফি প্রয়োগ করা হয়েছে ও ওভারডিউ হিসেবে চিহ্নিত করা হয়েছে।`
        : `Completed successfully! ${count} past-due invoices have been transitioned to Overdue with adjusted penalties applied.`
    );
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-receipt');
    if (!element) return;

    try {
      setIsGeneratingPDF(true);
      
      // Sanitize all inline styles to prevent oklch rendering exceptions
      sanitizeAllInlineStyles(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0a0a0a', // match the background
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
      pdf.save(`Receipt-${activeReceipt?.id || 'download'}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDirectDownloadPDF = async (p: Payment) => {
    try {
      setIsGeneratingDirectPDFId(p.id);
      setDirectPDFPayment(p);

      // Give it one render cycle to mount the hidden DOM element
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = document.getElementById('direct-printable-receipt');
      if (!element) {
        throw new Error('Element direct-printable-receipt not found');
      }

      // Sanitize all inline styles to prevent oklch rendering exceptions
      sanitizeAllInlineStyles(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 30; // 15mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
      pdf.save(`Receipt-${p.id.substring(2, 8).toUpperCase()}-${p.flatNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate direct secure PDF receipt:', error);
    } finally {
      setIsGeneratingDirectPDFId(null);
      setDirectPDFPayment(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className={activeReceipt ? "print:hidden space-y-6" : "space-y-6"}>
      
      {/* Page Title & Admin generation panel */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
              {t.payments} Dashboard
            </h2>
            

            <button
              onClick={() => {
                setQrFlat(flats[0]?.number || '1A');
                setQrAmount(5000);
                setQrReference(language === 'bn' ? 'জুন ২০২৬ সার্ভিস চার্জ' : 'June 2026 Service Charge');
                setShowQRGenerator(true);
              }}
              className="flex items-center gap-1.5 shrink-0 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 border border-rose-900 px-3 py-1.5 text-[10px] font-bold text-rose-400 hover:text-rose-350 cursor-pointer print:hidden transition-all duration-200"
              type="button"
            >
              <CreditCard className="h-3.5 w-3.5 text-rose-500" />
              <span>{language === 'bn' ? 'কিউআর কোড' : 'MFS QR Generator'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Collect, generate and organize residential billing certificates
          </p>
        </div>

        {/* Generate / add direct billing (Admin exclusive) */}
        {currentUser?.role === 'Admin' && (
          <div className="flex flex-wrap gap-2 items-center bg-neutral-950/45 border border-emerald-950 p-3 rounded-lg shrink-0">
            {/* Generate Bulk monthly maintenance utility card */}
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded border border-emerald-900 bg-neutral-900 py-1.5 px-2 text-xs text-white focus:outline-none"
              >
                <option value="2026-05">May 2026</option>
                <option value="2026-06">June 2026</option>
                <option value="2026-07">July 2026</option>
              </select>
              
              <button
                type="button"
                onClick={handleBulkGenerate}
                className="rounded-md bg-emerald-600 border border-[#D4AF37]/35 px-4.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                {t.generate_now}
              </button>
            </div>

            <div className="h-6 w-px bg-emerald-950" />

            <button
              onClick={() => setShowAddCustomBill(true)}
              className="flex items-center gap-1 px-3 py-1.5 border border-emerald-900 rounded-md text-xs font-bold text-emerald-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Charge Fine/Utility</span>
            </button>

            <div className="h-6 w-px bg-emerald-950" />

            <button
              onClick={() => setShowLateFeeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/30 border border-amber-900 rounded-md text-xs font-bold text-[#D4AF37] hover:text-white cursor-pointer transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-amber-500" />
              <span>{language === 'bn' ? 'বিলম্ব ফি কনফিগ' : 'Late Fee Engine'}</span>
            </button>

            <div className="h-6 w-px bg-emerald-950" />

            <button
              onClick={() => setShowFormalReceiptGenerator(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 rounded-md text-xs font-black text-[#D4AF37] hover:text-white cursor-pointer transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{language === 'bn' ? 'অফিসিয়াল রশিদ জেনারেটর' : 'Formal BDT Receipt'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Searching filters and search bars */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <input
            type="text"
            placeholder={language === 'bn' ? 'ফ্ল্যাট বা প্রদেয় নাম দিয়ে খুঁজুন...' : 'Search payments ledgers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded bg-neutral-950/45 border border-emerald-950 py-2 pl-10 pr-3 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="flex rounded p-1 bg-neutral-950/45 border border-emerald-950">
          {['All', 'Paid', 'Pending', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`rounded px-3 py-1 text-xs font-bold font-sans cursor-pointer ${
                statusFilter === st 
                  ? 'bg-[#059669]/65 border border-[#D4AF37]/20 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'All' ? t.all : st === 'Paid' ? 'Paid' : st === 'Pending' ? 'Pending' : 'Overdue'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ledger Table Cards */}
      <div className="rounded-xl border border-emerald-950 bg-neutral-950/35 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-emerald-950 bg-neutral-950/50">
                <th className="p-4 text-slate-400 font-semibold">{t.flat_no}</th>
                <th className="p-4 text-slate-400 font-semibold">{language === 'bn' ? 'আবাসিক বিবরণ' : 'Resident Ledger'}</th>
                <th className="p-4 text-slate-400 font-semibold">Bill Details</th>
                <th className="p-4 text-slate-400 font-semibold">Invoice Month</th>
                <th className="p-4 text-slate-400 font-semibold">{language === 'bn' ? 'মোট দাবি' : 'Fees (BDT)'}</th>
                <th className="p-4 text-slate-400 font-semibold">Paid Method</th>
                <th className="p-4 text-slate-400 font-semibold">{t.status}</th>
                <th className="p-4 text-right text-slate-400 font-semibold">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#059669]/10">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-mono">
                    Zero transaction bills matching filter. Everything is cleared!
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-950/10">
                    <td className="p-4 font-bold text-white font-mono">{p.flatNumber}</td>
                    <td className="p-4">
                      <span className="block font-medium text-slate-200">{p.memberName}</span>
                      <span className="block text-[8px] text-slate-500 font-mono">ID: {p.id.substring(2, 6)}</span>
                    </td>
                    <td className="p-4">
                      <span className="block font-semibold text-slate-300">{p.title}</span>
                      <span className="block text-[9px] text-[#D4AF37] font-mono">{p.feeType}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{p.billingMonth}</td>
                    <td className="p-4 font-mono">
                      <span className="block font-bold text-emerald-400">{formatBDT(p.amount)}</span>
                      {p.paidAmount > 0 && (
                        <span className="block text-[9px] text-slate-500">Paid: {formatBDT(p.paidAmount)}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {p.payMethod ? (
                        <span className="inline-flex rounded border border-[#D4AF37]/35 bg-emerald-950/30 px-1.5 py-0.5 text-[9px] font-bold text-[#D4AF37] font-mono">
                          {p.payMethod}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                        p.status === 'Paid' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900':
                        p.status === 'Partial' ? 'bg-amber-950/60 text-[#D4AF37] border-amber-900':
                        p.status === 'Overdue' ? 'bg-rose-950/80 text-rose-400 border-rose-900 font-black tracking-wide':
                        'bg-red-950/40 text-red-500 border-red-900'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      
                      {/* Show pay direct button for residents or admin payments */}
                      {(p.status === 'Pending' || p.status === 'Partial' || p.status === 'Overdue') && (
                        <button
                          type="button"
                          onClick={() => startCheckout(p)}
                          className="px-2.5 py-1 bg-emerald-600 border border-[#D4AF37]/35 rounded text-[10px] font-bold text-white hover:bg-emerald-500 cursor-pointer"
                        >
                          {t.pay_now}
                        </button>
                      )}

                      {/* Display formal Money Receipt for any payment transaction */}
                      <button
                        type="button"
                        onClick={() => setActiveReceipt(p)}
                        className="px-2.5 py-1 border border-emerald-900 rounded text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                      >
                        {language === 'bn' ? 'রসিদ / ইনভয়েস' : 'Invoice Receipt'}
                      </button>

                      {/* Branded Direct PDF download for paid transactions */}
                      {(p.status === 'Paid' || p.status === 'Partial') && (
                        <button
                          type="button"
                          disabled={isGeneratingDirectPDFId === p.id}
                          onClick={() => handleDirectDownloadPDF(p)}
                          className="px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold hover:bg-emerald-900/60 hover:text-white cursor-pointer inline-flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                          <Download className="h-3 w-3" />
                          <span>{isGeneratingDirectPDFId === p.id ? (language === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'PDF Gen...') : (language === 'bn' ? 'রসিদ ডাউনলোড' : 'Download PDF')}</span>
                        </button>
                      )}

                      {/* Toggle Overdue state / apply automatic late fee - Admin exclusive */}
                      {currentUser?.role === 'Admin' && (p.status === 'Pending' || p.status === 'Partial' || p.status === 'Overdue') && (
                        <button
                          type="button"
                          onClick={() => handleToggleOverdue(p)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all border ${
                            p.status === 'Overdue'
                              ? 'bg-amber-955 text-amber-300 hover:bg-amber-900 border border-amber-900/40'
                              : 'bg-red-950/60 text-red-400 hover:bg-red-900 border border-red-900/40'
                          }`}
                        >
                          {p.status === 'Overdue' 
                            ? (language === 'bn' ? 'পেন্ডিং করুন' : 'Mark Pending') 
                            : (language === 'bn' ? 'ওভারডিউ করুন' : 'Mark Overdue')}
                        </button>
                      )}

                      {/* Reminder alerts exclusive for Admins */}
                      {currentUser?.role === 'Admin' && (p.status === 'Pending' || p.status === 'Overdue') && (
                        <button
                          type="button"
                          onClick={() => openAlertCenter(p)}
                          className="px-2.5 py-1 border border-dashed border-[#D4AF37]/45 rounded text-[10px] font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-white cursor-pointer"
                        >
                          {language === 'bn' ? 'অ্যালার্ট পাঠান' : 'SMS / WA Alert'}
                        </button>
                      )}

                      {/* Delete payment details - Admin exclusive */}
                      {currentUser?.role === 'Admin' && (
                        confirmDeleteId === p.id ? (
                          <div className="inline-flex items-center gap-1.5 p-1 bg-red-950/20 border border-red-900/30 rounded-md animate-pulse">
                            <span className="text-[10px] text-[#D4AF37] font-bold font-mono">Sure?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deletePayment(p.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9px] font-extrabold cursor-pointer transition-all font-sans"
                            >
                              {language === 'bn' ? 'হ্যাঁ' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 bg-neutral-850 hover:bg-neutral-800 text-slate-350 rounded text-[9px] font-extrabold cursor-pointer transition-all font-sans border border-neutral-700/50"
                            >
                              {language === 'bn' ? 'না' : 'No'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="px-2.5 py-1 bg-red-950/40 text-red-400 border border-red-900 rounded text-[10px] font-bold hover:bg-red-900/60 hover:text-white cursor-pointer inline-flex items-center gap-1 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}</span>
                          </button>
                        )
                      )}

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* MOBILE BANKING SIMULATED CHECKOUT popover */}
      {checkoutBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-pink-900/40 bg-gradient-to-b from-[#e11d48]/10 via-[#0c0a09] to-[#0c0a09] p-6 relative shadow-2xl space-y-4">
            
            {/* Header close */}
            <button onClick={() => setCheckoutBill(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer select-none">
              <X className="h-5 w-5" />
            </button>

            {/* Wallet Selection logo */}
            <div className="text-center font-sans">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-xs border border-[#D4AF37]">
                MFS
              </div>
              <h3 className="text-sm font-bold text-white mt-2">
                {t.bKash_nagad_checkout}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Invoice: {checkoutBill.title} (Unit {checkoutBill.flatNumber})
              </p>
            </div>

            {/* MFS wallets pills */}
            <div className="flex rounded-lg bg-neutral-900/80 p-1 border border-neutral-800">
              {['bKash', 'Nagad', 'Rocket', 'Cash'].map((payM) => (
                <button
                  key={payM}
                  type="button"
                  onClick={() => {
                    setCheckoutMethod(payM as any);
                    setCheckoutStep(1);
                  }}
                  className={`flex-1 rounded py-1.5 text-center text-[10px] font-extrabold font-mono transition-all uppercase cursor-pointer ${
                    checkoutMethod === payM 
                      ? 'bg-rose-700 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {payM}
                </button>
              ))}
            </div>

            {/* Sub-tabs selector for QR vs Interactive Form (for bKash and Nagad) */}
            {(checkoutMethod === 'bKash' || checkoutMethod === 'Nagad') && (
              <div className="flex border-b border-neutral-850 text-[10px] font-bold font-sans gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCheckoutSubTab('qr')}
                  className={`flex-1 pb-1.5 border-b-2 transition-all ${
                    checkoutSubTab === 'qr'
                      ? 'border-rose-500 text-white font-extrabold cursor-pointer'
                      : 'border-transparent text-slate-500 hover:text-slate-300 cursor-pointer'
                  }`}
                >
                  {language === 'bn' ? 'স্ক্যান কিউআর কোড' : 'Scan QR Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutSubTab('form')}
                  className={`flex-1 pb-1.5 border-b-2 transition-all ${
                    checkoutSubTab === 'form'
                      ? 'border-rose-500 text-white font-extrabold cursor-pointer'
                      : 'border-transparent text-slate-500 hover:text-slate-300 cursor-pointer'
                  }`}
                >
                  {language === 'bn' ? 'ওটিপি গেইটওয়ে ফর্ম' : 'OTP Gate Form'}
                </button>
              </div>
            )}

            {/* Amount to pay display */}
            <div className="bg-neutral-900 border border-neutral-850 rounded-lg p-2.5 text-center">
              <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider font-mono">
                PAYMENT DEBITS CHARGE
              </span>
              <span className="text-lg font-extrabold text-[#D4AF37] font-mono">
                {formatBDT(paymentAmount)} BDT
              </span>
            </div>

            {/* QR Scanner Display tab (Only active for supported bKash/Nagad & QR Sub-tab selected) */}
            {checkoutSubTab === 'qr' && (checkoutMethod === 'bKash' || checkoutMethod === 'Nagad') ? (
              <div className="space-y-4 text-xs">
                {/* Visual QR Code Container */}
                <div className="relative rounded-xl border border-neutral-850 p-3 bg-black/40 flex flex-col items-center justify-center gap-2">
                  <div className={`absolute top-2 right-2 text-[8px] font-black tracking-widest font-mono select-none px-1 py-0.5 rounded uppercase ${
                    checkoutMethod === 'bKash' ? 'bg-rose-950/40 text-rose-450 border border-rose-900/30' : 'bg-orange-950/40 text-orange-450 border border-orange-900/30'
                  }`}>
                    {checkoutMethod} Official Merchant QR
                  </div>
                  
                  {/* Generated QR Code Image */}
                  <div className="p-1.5 bg-white rounded-lg shadow-inner overflow-hidden border border-neutral-800 flex items-center justify-center mt-2">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=${
                        checkoutMethod === 'bKash' ? '225-29-72' : '234-88-12'
                      }&data=${encodeURIComponent(
                        `mfs:${checkoutMethod.toLowerCase()}?merchant=${
                          checkoutMethod === 'Nagad' ? config.nagadMerchant : config.bKashMerchant
                        }&amount=${paymentAmount}&ref=${checkoutBill.flatNumber}&desc=${encodeURIComponent(checkoutBill.title)}`
                      )}`} 
                      alt="MFS Merchant QR Code" 
                      className="w-36 h-36 object-contain select-none shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  {/* Ledger configuration keys with quick copying keys */}
                  <div className="w-full space-y-1 text-[9px] font-mono">
                    <div className="flex justify-between items-center bg-neutral-900/50 p-1.5 rounded border border-neutral-850">
                      <span className="text-slate-500 font-sans">Merchant No:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-extrabold text-white text-xs">{checkoutMethod === 'Nagad' ? config.nagadMerchant : config.bKashMerchant}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(checkoutMethod === 'Nagad' ? config.nagadMerchant : config.bKashMerchant, 'merchant')}
                          className="text-emerald-500 hover:text-emerald-450 font-sans font-bold text-[8px] px-1 bg-emerald-950/40 border border-emerald-900/30 rounded"
                        >
                          {copiedTextType === 'merchant' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-neutral-900/50 p-1.5 rounded border border-neutral-850">
                      <span className="text-slate-500 font-sans">Ref Unit Flat:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-extrabold text-[#D4AF37] text-xs">Flat {checkoutBill.flatNumber}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(checkoutBill.flatNumber, 'reference')}
                          className="text-emerald-500 hover:text-emerald-450 font-sans font-bold text-[8px] px-1 bg-emerald-950/40 border border-emerald-900/30 rounded"
                        >
                          {copiedTextType === 'reference' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form to enter Verification Transaction ID (real confirmation) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                    {language === 'bn' ? 'পেমেন্ট ট্রানজেকশন আইডি (TxnID)' : 'Enter Transaction ID (TxnID)'}
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={checkoutTxnId}
                      onChange={(e) => setCheckoutTxnId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="যেমন: K8B2948X"
                      className="flex-1 rounded border border-neutral-855 bg-[#0c0a09] py-2 px-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!checkoutTxnId) {
                          alert(language === 'bn' ? 'অনুগ্রহ করে পেমেন্ট করার পর ট্রানজেকশন আইডি প্রবেশ করুন।' : 'Please enter payment Transaction ID first.');
                          return;
                        }
                        // Mark Paid
                        markPaymentPaid(checkoutBill.id, checkoutMethod as any, checkoutTxnId, paymentAmount);
                        setCheckoutBill(null);
                        setCheckoutTxnId('');
                      }}
                      className="px-3 rounded bg-rose-600 font-bold text-white hover:bg-rose-500 cursor-pointer text-[10px]"
                    >
                      {language === 'bn' ? 'নিশ্চিত করুন' : 'Verify'}
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-500 leading-tight block">
                    {language === 'bn' ? '*অ্যাপ দিয়ে স্ক্যান করে পেমেন্ট সম্পন্ন করার পর প্রাপ্ত ট্রানজেকশন আইডি লিখে বিল পরিশোধ নিশ্চিত করুন।' : '*Scan reference codes via bKash/Nagad scanner apps to transfer, then supply confirmation TxnID.'}
                  </p>
                </div>
              </div>
            ) : (
              // Wizard Steps Form Tab
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                
                {checkoutError && (
                  <p className="p-2.5 rounded bg-red-950/20 text-red-500 border border-red-900 text-[10px] flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {checkoutError}
                  </p>
                )}

                {/* Step 1: Input wallet phone */}
                {checkoutStep === 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                      {t.enter_wallet_no} ({checkoutMethod} Account)
                    </label>
                    <input
                      type="text"
                      required
                      value={mfsNumber}
                      onChange={(e) => setMfsNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="01712345678"
                      className="block w-full rounded border border-neutral-805 bg-[#0c0a09] py-2.5 px-3 text-xs text-white placeholder-slate-650 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Step 2: OTP verification code */}
                {checkoutStep === 2 && (
                  <div className="space-y-1.5 text-center">
                    <label className="text-[10px] uppercase font-bold text-[#D4AF37] font-mono block">
                      {t.enter_otp}
                    </label>
                    <p className="text-[9px] text-slate-500 mb-1.5 font-mono">6-digit payment code sent to: {mfsNumber}</p>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="489312"
                      className="block w-full rounded border border-neutral-850 bg-[#0c0a09] text-center tracking-widest py-2.5 px-3 font-mono text-base font-extrabold text-white placeholder-slate-750 focus:outline-none"
                    />
                  </div>
                )}

                {/* Step 3: PIN Secure confirmation */}
                {checkoutStep === 3 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block text-center">
                      {t.enter_pin}
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={5}
                      placeholder="•••••"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      className="block w-full rounded border border-neutral-855 bg-[#0c0a09] text-center tracking-widest py-2.5 px-3 text-base text-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Next Button / Submission */}
                <button
                  type="submit"
                  className="w-full text-center py-2.5 rounded bg-rose-600 font-black text-white hover:bg-rose-500 cursor-pointer"
                >
                  {checkoutStep === 3 ? t.verify_confirm : 'Proceed Verification'}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      {/* DETAILED MONEY RECEIPT INVOICE MODAL (PRINT READY PREVIEW) */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-[#D4AF37]/30 bg-[#0c0a09] p-6 shadow-2xl relative block font-sans space-y-6 max-h-[95vh] overflow-y-auto print:border-0 print:shadow-none print:w-full print:max-w-none print:p-0">
            
            {/* Modal Header & Controls (Hidden during print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950 pb-4 print:hidden">
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-widest uppercase font-sans flex items-center gap-1.5 mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {language === 'bn' ? 'টাকা প্রাপ্তির রশিদ / বিবরণী' : 'Invoice & Money Receipt'}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {language === 'bn' ? 'আস্থা টুইন টাওয়ার অফিসিয়াল রশিদ' : 'Astha Twin Towers Official Register'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded px-3 py-1.5 bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all duration-200 shadow-md transform active:scale-95"
                >
                  <Printer className="h-4 w-4" />
                  <span>{language === 'bn' ? 'প্রিন্ট করুন' : 'Print Receipt'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="rounded px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/30 hover:text-white flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer transition-all duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span>{isGeneratingPDF ? (language === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...') : (language === 'bn' ? 'পিডিএফ' : 'PDF')}</span>
                </button>
                <button 
                  onClick={() => setActiveReceipt(null)} 
                  className="rounded p-1.5 text-slate-400 hover:bg-neutral-800 hover:text-white transition-all duration-200"
                  title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Money Receipt Layout starts here */}
            <div id="printable-receipt" className="space-y-6 border border-emerald-950/40 bg-neutral-950 p-6 rounded-lg text-slate-300">
              
              {/* Receipt Header Seal */}
              <div className="flex justify-between items-start border-b border-emerald-950 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-emerald-700 border border-[#D4AF37]/40">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">{config.name}</h2>
                    <span className="text-[9px] text-[#D4AF37] tracking-widest block font-mono">OFFICIAL CASH REGISTER</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase font-bold text-slate-500 font-mono">Invoice reference</span>
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">#INV-{activeReceipt.id.substring(2,6)}</span>
                </div>
              </div>

              {/* Sub-Header address meta */}
              <div className="text-[10px] text-slate-500 font-mono leading-relaxed space-y-0.5">
                <p>Address: {config.address}</p>
                <p>Contact: {config.contactNo} • info: {config.email}</p>
                <p>Settlement Date: {activeReceipt.payDate || new Date().toISOString().split('T')[0]}</p>
              </div>

              {/* Central ledger details */}
              <div className="border border-emerald-950 rounded-lg p-3 bg-neutral-900/60 text-xs gap-3 space-y-2">
                <div className="flex justify-between border-b border-emerald-950/50 pb-1.5">
                  <span className="font-mono text-slate-500">RESIDENT PARTICULARS:</span>
                  <span className="font-bold text-white text-right">{activeReceipt.memberName}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-950/50 pb-1.5">
                  <span className="font-mono text-slate-500">APARTMENT BLOCK UNIT:</span>
                  <span className="font-bold text-[#D4AF37] font-mono">Flat {activeReceipt.flatNumber}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-950/50 pb-1.5">
                  <span className="font-mono text-slate-500">BILLING MONTH FOR:</span>
                  <span className="font-bold text-slate-200 font-mono">{activeReceipt.billingMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-slate-500">TRANSACTION TYPE:</span>
                  <span className="font-bold text-emerald-400">{activeReceipt.feeType}</span>
                </div>
              </div>

              {/* Financial columns */}
              <div className="space-y-2 border-t border-emerald-950 pt-4">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">Total Bill Cost:</span>
                  <span className="font-mono">{formatBDT(activeReceipt.amount)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">Amount Received:</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatBDT(activeReceipt.paidAmount)}</span>
                </div>
                {activeReceipt.dueAmount > 0 && (
                  <div className="flex justify-between items-baseline text-xs text-rose-400 font-mono">
                    <span>Dues Outstanding:</span>
                    <span>{formatBDT(activeReceipt.dueAmount)}</span>
                  </div>
                )}
                
                {/* Net payment badge block status */}
                <div className="flex justify-between items-center text-xs pt-3.5 border-t border-emerald-950/40 font-mono">
                  <span>METRIC STATUS:</span>
                  <span className={`font-black tracking-widest ${
                    activeReceipt.status === 'Paid' ? 'text-emerald-500' :
                    activeReceipt.status === 'Partial' ? 'text-amber-500' :
                    'text-rose-500'
                  }`}>
                    [ {activeReceipt.status.toUpperCase()} ]
                  </span>
                </div>
              </div>

              {/* Transaction hashes metadata */}
              {activeReceipt.transactionId && (
                <div className="bg-neutral-950 p-2.5 rounded border border-emerald-950 text-center font-mono text-[9px] text-slate-400">
                  <p>PAYMENT CLEARWAY VIA: {activeReceipt.payMethod?.toUpperCase()}</p>
                  <p className="font-bold text-emerald-400 mt-1 uppercase tracking-widest">GATEWAY TXN ID: {activeReceipt.transactionId}</p>
                </div>
              )}

              {/* Seal Footer */}
              <div className="flex justify-between items-center pt-8 text-[9px] font-mono text-slate-500 border-t border-emerald-950/20">
                <div className="text-center w-24">
                  <div className="border-b border-emerald-950 pb-1 mb-1" />
                  <span>PREPARED BY</span>
                </div>
                <p className="text-center text-[8px]">DIGITALLY GENERATED RECEIPT ONLY</p>
                <div className="text-center w-24">
                  <div className="border-b border-emerald-950 pb-1 mb-1" />
                  <span>AUTHORISED SEAL</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ADD CUSTOM BILL MODAL */}
      {showAddCustomBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-emerald-950 bg-neutral-950 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-sm font-bold text-white">Manual Utility Billing</h3>
              <button onClick={() => setShowAddCustomBill(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCustomBillSubmit} className="space-y-3.5 text-xs">
              
              {/* Flat select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Select Destination Flat</label>
                <select
                  value={customFlat}
                  onChange={(e) => setCustomFlat(e.target.value)}
                  className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-2 text-white focus:outline-none"
                >
                  {flats.map(f => (
                    <option key={f.id} value={f.number}>Flat {f.number}</option>
                  ))}
                </select>
              </div>

              {/* Fee type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Category Ledger</label>
                <select
                  value={customFeeType}
                  onChange={(e) => setCustomFeeType(e.target.value as any)}
                  className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-1.5 text-white focus:outline-none"
                >
                  <option value="Maintenance">Maintenance / রক্ষণাবেক্ষণ</option>
                  <option value="Gas">Gas Bill / গ্যাস বিল</option>
                  <option value="Electricity">Electricity / কমন বিদ্যুৎ বিল</option>
                  <option value="Water">Water Bill / ওয়াসা পানির বিল</option>
                  <option value="Security_Parking">Security & Parking Space</option>
                  <option value="Fine_Late_Fee">Late Fine Penalty / জরিমানা</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Amount (BDT)</label>
                <input
                  type="number"
                  required
                  value={customAmount}
                  onChange={(e) => setCustomAmount(parseInt(e.target.value) || 1200)}
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Title description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Billing Memo Name</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Utility Special Surcharge"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowAddCustomBill(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 rounded border border-[#D4AF37]/35 text-white hover:bg-emerald-500 font-bold"
                >
                  Confirm Bill Release
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DIRECT SMS & WHATSAPP ALERT CENTRAL HUB */}
      {alertingPayment && (() => {
        const matchFlat = flats.find(f => f.number === alertingPayment.flatNumber);
        const residentPhone = matchFlat?.phone || config.smsAlertPhone || '';
        const rawPhone = residentPhone.replace(/\D/g, '');
        const whatsappFormatted = rawPhone.startsWith('0') 
          ? '880' + rawPhone.substring(1) 
          : rawPhone.startsWith('880') 
            ? rawPhone 
            : rawPhone;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-emerald-950 bg-[#070e0a] p-6 relative shadow-2xl space-y-4">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-emerald-950 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      {language === 'bn' ? 'অ্যালার্ট ও পেমেন্ট রিমাইন্ডার সেন্টার' : 'Resident Alert Dispatch Center'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      UNIT {alertingPayment.flatNumber} • {alertingPayment.memberName}
                    </p>
                  </div>
                </div>
                <button onClick={() => setAlertingPayment(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Alert Meta details info */}
              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono p-3 bg-neutral-900/60 rounded border border-emerald-950/40">
                <div className="space-y-0.5">
                  <span className="text-slate-500 block">Resident Mobile:</span>
                  <span className="text-emerald-400 font-bold">{residentPhone || 'Not Set'}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block">Bill Outstanding:</span>
                  <span className="text-amber-500 font-bold">৳{alertingPayment.amount} BDT ({alertingPayment.feeType})</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block">SMS Gateway:</span>
                  <span className="text-slate-300">{config.smsAlertPhone || 'Default System'}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block">WhatsApp Gate:</span>
                  <span className="text-slate-300">{config.whatsappNo || 'Not Configured'}</span>
                </div>
              </div>

              {/* Message Template Customization Box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">
                  {language === 'bn' ? 'অ্যালার্ট বার্তা এডিট করুন:' : 'Customize Alert Message Body:'}
                </label>
                <textarea
                  rows={4}
                  value={customMsgText}
                  onChange={(e) => setCustomMsgText(e.target.value)}
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2.5 text-xs text-white focus:outline-none leading-relaxed font-sans"
                />
                <span className="text-[9px] text-slate-500 font-mono block">
                  * Note: Actions will launch device default apps to execute secure external alert transmissions.
                </span>
              </div>

              {/* Actions list */}
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-emerald-950">
                {/* 1. SMS action */}
                <button
                  type="button"
                  onClick={() => {
                    triggerPaymentReminder(alertingPayment.id);
                    const smsUrl = `sms:${residentPhone}?body=${encodeURIComponent(customMsgText)}`;
                    window.open(smsUrl, '_blank');
                    setAlertingPayment(null);
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-950/30 hover:bg-emerald-950 border border-emerald-900 text-center gap-1 cursor-pointer group transition-colors"
                >
                  <MessageSquare className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">SMS Alert</span>
                  <span className="text-[7.5px] text-slate-400 font-mono">Native App</span>
                </button>

                {/* 2. WhatsApp Action */}
                <button
                  type="button"
                  onClick={() => {
                    triggerPaymentReminder(alertingPayment.id);
                    const waUrl = `https://wa.me/${whatsappFormatted}?text=${encodeURIComponent(customMsgText)}`;
                    window.open(waUrl, '_blank');
                    setAlertingPayment(null);
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-green-950/25 hover:bg-green-950/50 border border-green-900/60 text-center gap-1 cursor-pointer group transition-colors"
                >
                  <Phone className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">WhatsApp</span>
                  <span className="text-[7.5px] text-slate-400 font-mono">Chat URL</span>
                </button>

                {/* 3. Local simulation */}
                <button
                  type="button"
                  onClick={() => {
                    triggerPaymentReminder(alertingPayment.id);
                    setAlertingPayment(null);
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-emerald-950/50 text-center gap-1 cursor-pointer group transition-colors"
                >
                  <Check className="h-5 w-5 text-teal-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Mock Log</span>
                  <span className="text-[7.5px] text-slate-400 font-mono">Database</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* HIDDEN BRANDED PDF PREVIEW CONTAINER */}
      <div className="absolute left-[-9999px] top-[-9999px] overflow-hidden" aria-hidden="true">
        {directPDFPayment && (
          <div 
            id="direct-printable-receipt" 
            className="w-[600px] p-8 text-neutral-800 border-4 border-double border-emerald-900 rounded-lg space-y-6 font-sans relative"
            style={{ color: '#1f2937', backgroundColor: '#ffffff' }}
          >
            {/* Top Gold & Emerald Bar Accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-800 via-[#D4AF37] to-emerald-900 rounded-t-sm" />
            
            {/* Receipt Header Seal */}
            <div className="flex justify-between items-start border-b-2 border-emerald-900/10 pb-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-800 border-2 border-[#D4AF37] shadow-sm">
                  <Building className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-emerald-900 uppercase tracking-tight">{config.name}</h2>
                  <span className="text-[9px] text-[#A27B00] tracking-widest block font-bold font-mono">OFFICIAL MONEY RECEIPT</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[8px] uppercase font-bold text-slate-400 font-mono">Receipt Reference No.</span>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-900/10 uppercase tracking-wider block mt-1">
                  #REC-{directPDFPayment.id.substring(2,8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Sub-Header address meta */}
            <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 font-mono leading-relaxed border-b border-emerald-900/15 pb-4">
              <div>
                <p className="font-bold text-emerald-900 uppercase text-[9px] mb-1">SOCIETY ADDRESS & CONTACT:</p>
                <p>{config.address}</p>
                <p>Contact No: {config.contactNo}</p>
                <p>Official Email: {config.email}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-900 uppercase text-[9px] mb-1">TRANSACTION DATE & METHOD:</p>
                <p>Date Generated: {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Payment Date: {directPDFPayment.payDate || new Date().toISOString().split('T')[0]}</p>
                <p>Verification Status: <span className="text-emerald-700 font-bold">VERIFIED SECURE</span></p>
              </div>
            </div>

            {/* Central ledger details */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider font-mono">Resident & Bill Details</h3>
              <div className="border border-emerald-900/15 rounded-lg p-4 bg-emerald-50/20 text-xs space-y-2.5">
                <div className="flex justify-between border-b border-emerald-900/5 pb-2">
                  <span className="font-mono text-slate-500 font-medium">RECEIVED FROM (MEMBER):</span>
                  <span className="font-extrabold text-slate-800 text-right text-sm">{directPDFPayment.memberName}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-900/5 pb-2">
                  <span className="font-mono text-slate-500 font-medium">APARTMENT UNIT / FLAT NO:</span>
                  <span className="font-bold text-emerald-900 font-mono bg-emerald-100/60 px-2 py-0.5 rounded text-right">Flat {directPDFPayment.flatNumber}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-900/5 pb-2">
                  <span className="font-mono text-slate-500 font-medium">BILL / TRANSACTION MEMO:</span>
                  <span className="font-bold text-slate-700 font-mono">{directPDFPayment.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-slate-500 font-medium">BILLING CYCLE MONTH:</span>
                  <span className="font-extrabold text-emerald-800 font-mono uppercase bg-emerald-100/50 px-2 py-0.5 rounded">{directPDFPayment.billingMonth}</span>
                </div>
              </div>
            </div>

            {/* Financial columns */}
            <div className="space-y-2 border-t-2 border-dashed border-emerald-900/10 pt-4">
              <div className="flex justify-between items-baseline text-xs pb-1.5 border-b border-emerald-900/5">
                <span className="text-slate-500 font-medium">Total Billed Amount:</span>
                <span className="font-mono font-semibold text-slate-700">{formatBDT(directPDFPayment.amount)}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs pb-1.5 border-b border-emerald-900/5">
                <span className="text-emerald-950 font-extrabold text-sm flex items-center gap-1">
                  Amount Received (Paid):
                </span>
                <span className="font-bold text-emerald-700 font-mono text-base">{formatBDT(directPDFPayment.paidAmount)}</span>
              </div>
              {directPDFPayment.dueAmount > 0 && (
                <div className="flex justify-between items-baseline text-xs text-rose-600 font-mono pb-1.5 border-b border-emerald-900/5">
                  <span className="font-semibold">Remaining Due Balance:</span>
                  <span className="font-bold">{formatBDT(directPDFPayment.dueAmount)}</span>
                </div>
              )}
              
              {/* Net payment badge block status */}
              <div className="flex justify-between items-center text-xs pt-3 font-mono">
                <span className="text-slate-500 font-bold">TRANSACTION CLASSIFICATION:</span>
                <span className="rounded bg-emerald-100/80 px-3 py-1 font-black text-emerald-800 border border-emerald-300 tracking-wider">
                  {directPDFPayment.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Transaction hashes metadata */}
            {(directPDFPayment.transactionId || directPDFPayment.payMethod) && (
              <div className="bg-emerald-50/30 p-3 rounded-lg border border-emerald-900/10 text-center font-mono text-[9px] text-slate-600 space-y-1">
                <p className="font-medium">SETTLED THROUGH GATEWAY: <span className="font-bold text-emerald-800">{directPDFPayment.payMethod?.toUpperCase() || 'CASH RECORD'}</span></p>
                {directPDFPayment.transactionId && (
                  <p className="font-bold text-emerald-700 tracking-widest mt-0.5">TRANSACTION ID: {directPDFPayment.transactionId}</p>
                )}
              </div>
            )}

            {/* Corporate Signatures */}
            <div className="flex justify-between items-center pt-8 text-[9px] font-mono text-slate-400">
              <div className="text-center w-28">
                <div className="text-slate-600 font-bold italic mb-5 font-sans">Astha Ledger Bot</div>
                <div className="border-b border-emerald-900/20 pb-1 mb-1" />
                <span className="text-emerald-900 font-bold">PREPARED BY</span>
              </div>
              <div className="text-center text-[8px] max-w-[150px] leading-relaxed text-slate-400">
                This document is generated securely by Astha Twin Towers Digital Management System. Genuine copies are verifiable on parent servers.
              </div>
              <div className="text-center w-28">
                <div className="text-emerald-800 font-bold italic mb-4 text-[12px] flex items-center justify-center -translate-y-2 select-none border border-emerald-800/10 rounded p-0.5 rotate-[-2deg] bg-emerald-50/40">
                  PAID
                </div>
                <div className="border-b border-emerald-900/20 pb-1 mb-1" />
                <span className="text-emerald-900 font-bold">AUTHORISED SEAL</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 CUSTOM GENERAL MFS QR GENERATOR MODAL */}
      {showQRGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-rose-950/60 bg-gradient-to-b from-[#e11d48]/10 via-[#0c0a09] to-[#0c0a09] p-6 relative shadow-2xl space-y-4">
            
            {/* Header Close Button */}
            <button 
              onClick={() => setShowQRGenerator(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title */}
            <div className="text-center font-sans space-y-1">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-rose-950/40 border border-rose-700/60 text-white font-extrabold">
                <Sparkles className="h-5 w-5 text-rose-500" />
              </div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase">
                {language === 'bn' ? 'MFS কিউআর কোড জেনারেটর' : 'MFS QR Code Generator'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {language === 'bn' ? 'বিকাশ ও নগদ দ্রুত স্ক্যান পেমেন্ট এর জন্য কিউআর তৈরি করুন' : 'Generate instant scanning cards with official merchant credentials'}
              </p>
            </div>

            {/* Wallet Selector */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-950/80 p-1 rounded-lg border border-neutral-850">
              <button
                type="button"
                onClick={() => setQrWallet('bKash')}
                className={`py-1.5 rounded text-center text-[10px] font-extrabold transition-all uppercase cursor-pointer ${
                  qrWallet === 'bKash'
                    ? 'bg-[#e11d48] text-white shadow font-sans'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                bKash (বিকাশ)
              </button>
              <button
                type="button"
                onClick={() => setQrWallet('Nagad')}
                className={`py-1.5 rounded text-center text-[10px] font-extrabold transition-all uppercase cursor-pointer ${
                  qrWallet === 'Nagad'
                    ? 'bg-[#ea580c] text-white shadow font-sans'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nagad (নগদ)
              </button>
            </div>

            {/* Two-Column configuration inputs */}
            <div className="space-y-3 text-xs">
              
              {/* Flat selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">
                  {language === 'bn' ? 'ফ্ল্যাট নম্বর সিলেক্ট করুন' : 'Destination Unit Flat'}
                </label>
                <select
                  value={qrFlat}
                  onChange={(e) => setQrFlat(e.target.value)}
                  className="w-full rounded border border-neutral-850 bg-[#0c0a09] py-1.5 px-2.5 text-xs text-white focus:outline-none"
                >
                  {flats.map((f) => (
                    <option key={f.id} value={f.number}>Flat {f.number} ({f.ownerName})</option>
                  ))}
                </select>
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">
                  {language === 'bn' ? 'পেমেন্ট রেফারেন্স / উদ্দেশ্য' : 'Billing Reference/Memo'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: সার্ভিস চার্জ' : 'e.g. Monthly Fee'}
                  value={qrReference}
                  onChange={(e) => setQrReference(e.target.value)}
                  className="w-full rounded border border-neutral-850 bg-[#0c0a09] py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Amount selector with custom input and presets */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">
                  {language === 'bn' ? 'টাকার পরিমাণ (BDT)' : 'Transfer Amount (BDT)'}
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="5000"
                  value={qrAmount || ''}
                  onChange={(e) => setQrAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded border border-[#1f1917] bg-[#0c0a09] py-1.5 px-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
                
                {/* Micro Preset buttons */}
                <div className="flex gap-1.5 pt-1">
                  {[1000, 2500, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQrAmount(preset)}
                      className={`flex-1 rounded py-1 px-0.5 border text-[9px] font-mono hover:text-white transition-all cursor-pointer ${
                        qrAmount === preset
                          ? 'border-[#e11d48] text-rose-400 bg-rose-950/20'
                          : 'border-neutral-850 text-slate-400 bg-neutral-950/40'
                      }`}
                    >
                      ৳{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE GENERATED VIEW */}
              <div className="bg-[#0c0a09] border border-neutral-850 rounded-xl p-4 flex flex-col items-center gap-3">
                
                <div className="relative p-2 bg-white rounded-lg shadow-inner overflow-hidden border border-neutral-800 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=${
                      qrWallet === 'bKash' ? '225-29-72' : '234-88-12'
                    }&data=${encodeURIComponent(
                      `mfs:${qrWallet.toLowerCase()}?merchant=${
                        qrWallet === 'Nagad' ? config.nagadMerchant : config.bKashMerchant
                      }&amount=${qrAmount}&ref=${qrFlat}&desc=${encodeURIComponent(qrReference)}`
                    )}`}
                    alt="Custom MFS QR Code"
                    className="w-36 h-36 object-contain select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Branded info */}
                <div className="w-full space-y-1 text-[9px] font-mono leading-none bg-black/40 p-2.5 rounded border border-neutral-850 text-slate-400">
                  <div className="flex justify-between">
                    <span>MFS GATEWAY:</span>
                    <span className={`font-bold uppercase ${qrWallet === 'bKash' ? 'text-rose-500' : 'text-orange-500'}`}>{qrWallet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MERCHANT ID:</span>
                    <span className="font-bold text-white">{qrWallet === 'Nagad' ? config.nagadMerchant : config.bKashMerchant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>REFERENCE UNIT:</span>
                    <span className="font-bold text-[#D4AF37]">Flat {qrFlat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>REQUISITE NET BDT:</span>
                    <span className="font-bold text-emerald-400">৳{qrAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Print and Save action triggers */}
                <div className="flex w-full gap-2 pt-1 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      const qrUrlStr = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=${
                        qrWallet === 'bKash' ? '225-29-72' : '234-88-12'
                      }&data=${encodeURIComponent(
                        `mfs:${qrWallet.toLowerCase()}?merchant=${
                          qrWallet === 'Nagad' ? config.nagadMerchant : config.bKashMerchant
                        }&amount=${qrAmount}&ref=${qrFlat}&desc=${encodeURIComponent(qrReference)}`
                      )}`;
                      window.open(qrUrlStr, '_blank');
                    }}
                    className="flex-1 py-1 px-2 border border-neutral-800 rounded hover:border-slate-400 text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer text-center font-bold"
                  >
                    {language === 'bn' ? 'ট্যাবে দেখুন' : 'Open Full QR'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 py-1 px-2 bg-rose-600 border border-rose-500 rounded text-[10px] text-white hover:bg-rose-500 transition-colors cursor-pointer text-center font-bold"
                  >
                    {language === 'bn' ? 'প্রিন্ট পোস্টার' : 'Print Poster'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 LATE FEE AUTOMATED OPERATIONS MODAL */}
      {showLateFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-amber-900 bg-[#0c0a09] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-amber-950">
              <div className="flex items-center gap-2 text-amber-400">
                <Settings className="h-4.5 w-4.5 animate-spin-slow text-amber-500" />
                <h3 className="text-sm font-bold tracking-tight text-white uppercase font-sans">
                  {language === 'bn' ? 'বিলম্ব ফি সেটিংস' : 'Late Fee Engine Configuration'}
                </h3>
              </div>
              <button 
                onClick={() => setShowLateFeeModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-350">
              <p className="text-[11px] leading-relaxed">
                {language === 'bn' 
                  ? 'মাসিক বিল পরিশোধে অবহেলাকারীদের জন্য নির্দিষ্ট হারের বিলম্ব ফি বা জরিমানা অটো-অ্যাপ্লাই করুন।' 
                  : 'Configure automated fine and interest charges for member invoices that are marked as Overdue.'}
              </p>

              {/* Toggle Enable-checkbox */}
              <div className="bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-850 flex items-center justify-between">
                <div>
                  <label className="font-extrabold text-slate-200 block">
                    {language === 'bn' ? 'বিলম্ব ফি সক্রিয় করুন' : 'Enable Late Fee Calculation'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {language === 'bn' ? 'স্ট্যাটাস পরিবর্তন করলেই ফি যুক্ত হবে' : 'Automatically adjust invoice on status transition'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localEnableLateFee}
                  onChange={(e) => setLocalEnableLateFee(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-amber-900 bg-neutral-950 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Percentage Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">
                  {language === 'bn' ? 'বিলম্ব ফি এর শতকরা হার (%)' : 'Late Fee Percentage Penalty (%)'}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    disabled={!localEnableLateFee}
                    value={localLateFeePercent}
                    onChange={(e) => setLocalLateFeePercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="block w-full rounded border border-neutral-850 bg-neutral-900 py-2 pl-3 pr-10 text-white font-mono focus:outline-none focus:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 mr-1">
                    <span className="text-slate-500 font-mono font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Automatic Scan & Bulk Update Action Banner */}
              <div className="bg-amber-955/20 p-3.5 rounded-lg border border-amber-900/40 space-y-2">
                <div className="flex items-start gap-2 text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-550" />
                  <div className="text-[10px] leading-relaxed text-slate-300">
                    <span className="font-bold block text-amber-400">
                      {language === 'bn' ? 'পূর্ববর্তী বকেয়া ইনভয়েসে এককালীন প্রয়োগ' : 'Batch Action Trigger'}
                    </span>
                    {language === 'bn' 
                      ? `চলতি মাস (${selectedMonth})-এর চেয়ে পুরানো বকেয়া (পেন্ডিং/আংশিক) ইনভয়েসগুলো চিহ্নিত করুন এবং অটো বিলম্ব ফি সহ ওভারডিউ করুন।`
                      : `Scans all outstanding invoices from prior months (older than ${selectedMonth}) and transitions them to 'Overdue' with the late fee penalty applied instantly.`}
                  </div>
                </div>

                <div className="pt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleScanAndApplyLateFees}
                    className="w-full text-center py-2 bg-amber-800 hover:bg-amber-700 border border-[#D4AF37]/50 rounded text-amber-100 hover:text-white font-bold cursor-pointer transition-all duration-200 uppercase font-sans text-[10px] tracking-wide"
                  >
                    🚀 {language === 'bn' ? 'বকেয়া বিলগুলোতে লেট-ফি প্রয়োগ করুন' : 'Scan & Apply Late Fees Now'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3.5 border-t border-amber-900/35">
                <button
                  type="button"
                  onClick={() => setShowLateFeeModal(false)}
                  className="px-4 py-1.5 border border-amber-905/30 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveLateRules}
                  className="px-4 py-1.5 bg-amber-600 rounded border border-[#D4AF37]/45 text-white hover:bg-amber-500 hover:scale-[1.01] transition-all font-bold cursor-pointer"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Configurations'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏅 FORMAL SOCIETY BDT RECEIPT GENERATOR WORKSPACE */}
      {showFormalReceiptGenerator && (
        <FormalReceiptGenerator onClose={() => setShowFormalReceiptGenerator(false)} />
      )}

    </div>
  );
}
