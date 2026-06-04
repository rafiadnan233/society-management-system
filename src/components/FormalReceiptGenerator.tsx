/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import { Payment } from '../types';
import { 
  X, 
  Download, 
  CheckCircle2, 
  FileText, 
  Percent, 
  User, 
  Settings, 
  Printer, 
  ShieldCheck, 
  Edit3, 
  Info,
  Layers,
  Award
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { sanitizeAllInlineStyles } from '../utils/oklchPatch';

interface FormalReceiptGeneratorProps {
  onClose: () => void;
}

// English/Bengali Number to Words converter
function amountToWords(amount: number, lang: 'en' | 'bn'): string {
  if (lang === 'bn') {
    if (amount === 0) return "শূণ্য";
    const onesBn = ["", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়"];
    const tensBn = ["", "দশ", "বিশ", "ত্রিশ", "চল্লিশ", "পঞ্চাশ", "ষাট", "সত্তর", "আশি", "নব্বই"];
    
    // Fast semantic mapping for usual billing segments, otherwise generic tag
    if (amount === 1500) return "এক হাজার পাঁচশত টাকা মাত্র";
    if (amount === 2000) return "দুই হাজার টাকা মাত্র";
    if (amount === 2500) return "দুই হাজার পাঁচশত টাকা মাত্র";
    if (amount === 3000) return "তিন হাজার টাকা মাত্র";
    if (amount === 4000) return "চার হাজার টাকা মাত্র";
    if (amount === 5000) return "পাচ হাজার টাকা মাত্র";
    if (amount === 6000) return "ছয় হাজার টাকা মাত্র";
    if (amount === 8000) return "আট হাজার টাকা মাত্র";
    if (amount === 10000) return "দশ হাজার টাকা মাত্র";
    return `${amount.toLocaleString('bn-BD')} টাকা মাত্র`;
  } else {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const convert = (num: number): string => {
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
      if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + convert(num % 100) : "");
      if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + convert(num % 1000) : "");
      if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + convert(num % 100000) : "");
      return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + convert(num % 10000000) : "");
    };

    if (amount === 0) return "Zero Taka Only";
    return convert(amount) + " Taka Only";
  }
}

export default function FormalReceiptGenerator({ onClose }: FormalReceiptGeneratorProps) {
  const { payments, config, language, flats } = useSociety();

  // Find all payments that have been Paid or Partially paid
  const paidPayments = useMemo(() => {
    return payments.filter(p => p.status === 'Paid' || p.status === 'Partial');
  }, [payments]);

  // Selected State
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(paidPayments[0]?.id || '');
  const activeBasePayment = useMemo(() => {
    return payments.find(p => p.id === selectedPaymentId) || paidPayments[0];
  }, [payments, selectedPaymentId, paidPayments]);

  // Form Fields Customization Overrides
  const [receiptNo, setReceiptNo] = useState<string>(
    activeBasePayment ? `AST-${activeBasePayment.id.substring(2, 8).toUpperCase()}` : `AST-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [societyName, setSocietyName] = useState<string>(config.name || 'Astha Twin Towers Building Society');
  const [societySub, setSocietySub] = useState<string>(language === 'bn' ? 'নিবন্ধিত বহুমুখী সমবায় সমিতি লিমিটেড' : 'Registered Residential Welfare Association');
  const [address, setAddress] = useState<string>(config.address || 'Dhaka, Bangladesh');
  const [memberName, setMemberName] = useState<string>(activeBasePayment?.memberName || 'Resident Member');
  const [flatNumber, setFlatNumber] = useState<string>(activeBasePayment?.flatNumber || '1A');
  const [billingMonth, setBillingMonth] = useState<string>(activeBasePayment?.billingMonth || '2026-06');
  const [feeType, setFeeType] = useState<string>(activeBasePayment?.feeType || 'Maintenance');
  const [paidAmount, setPaidAmount] = useState<number>(activeBasePayment?.paidAmount || activeBasePayment?.amount || 5000);
  const [payMethod, setPayMethod] = useState<string>(activeBasePayment?.payMethod || 'bKash');
  const [txnId, setTxnId] = useState<string>(activeBasePayment?.txnId || 'N/A');
  const [notes, setNotes] = useState<string>(
    language === 'bn' 
      ? 'মেইনটেন্যান্স চার্জ ও লিফট রক্ষণাবেক্ষণ বিল তহবিল জমা।' 
      : 'Receipt issued towards general society services and apartment monthly building charges.'
  );

  // Authority configuration
  const [authorityTitle, setAuthorityTitle] = useState<string>(language === 'bn' ? 'কোষাধ্যক্ষ' : 'Treasurer / Accounts Manager');
  const [authorityName, setAuthorityName] = useState<string>('S. K. Majumder');
  const [sealStyle, setSealStyle] = useState<'gold' | 'emerald' | 'none'>('gold');
  const [includeBar, setIncludeBar] = useState<boolean>(true);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  // Synchronize when a new payment is chosen from the dropdown list
  const handlePaymentSelect = (id: string) => {
    setSelectedPaymentId(id);
    const selected = payments.find(p => p.id === id);
    if (selected) {
      setReceiptNo(`AST-${selected.id.substring(2, 8).toUpperCase()}`);
      setMemberName(selected.memberName);
      setFlatNumber(selected.flatNumber);
      setBillingMonth(selected.billingMonth);
      setFeeType(selected.feeType);
      setPaidAmount(selected.paidAmount || selected.amount);
      setPayMethod(selected.payMethod || 'bKash');
      setTxnId(selected.txnId || 'N/A');
    }
  };

  const getFeeTypeDisplay = (type: string) => {
    const bnLabels: Record<string, string> = {
      'Maintenance': 'মেইনটেন্যান্স',
      'Utility': 'ইউটিলিটি',
      'Gas': 'গ্যাস বিল',
      'Water': 'পানি বিল',
      'Electricity': 'বিদ্যুৎ বিল',
      'Security_Parking': 'সিকিউরিটি ও পার্কিং',
      'Fine_Late_Fee': 'বিলম্ব ফি/জরিমানা',
      'Others': 'অন্যান্য'
    };
    if (language === 'bn') {
      return bnLabels[type] || type;
    }
    return type.replace('_', ' ');
  };

  // Convert month key e.g., "2026-06" to a stylized name e.g., "June 2026"
  const getStylizedMonth = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const monthsEng: Record<string, string> = {
      '01': 'January', '02': 'February', '03': 'March', '04': 'April',
      '05': 'May', '06': 'June', '07': 'July', '08': 'August',
      '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    };
    const monthsBn: Record<string, string> = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল',
      '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
      '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };
    const mName = language === 'bn' ? (monthsBn[month] || month) : (monthsEng[month] || month);
    return `${mName}, ${year}`;
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('formal-exportable-slip');
    if (!element) return;

    try {
      setIsCompiling(true);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Sanitize OKLCH colors, converting them to standard RGB in the canvas render process
      sanitizeAllInlineStyles(element);

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 8;
      const printableWidth = pdfWidth - (margin * 2);
      const printableHeight = pdfHeight - (margin * 2);

      const canvasRatio = canvas.width / canvas.height;
      
      let printWidth = printableWidth;
      let printHeight = printWidth / canvasRatio;

      // Mathematically defend against high aspect ratios cutting off the bottom margin bounds
      if (printHeight > printableHeight) {
        printHeight = printableHeight;
        printWidth = printHeight * canvasRatio;
      }

      // Dynamically center the receipt container both vertically and horizontally within printable margins
      const xOffset = margin + (printableWidth - printWidth) / 2;
      const yOffset = margin + (printableHeight - printHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, printWidth, printHeight);
      pdf.save(`Formal-Receipt-${receiptNo}.pdf`);
    } catch (err) {
      console.error('Failed to export formal PDF confirmation certificate slip:', err);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto" id="formal-receipt-generator-viewport">
      <div className="w-full max-w-6xl rounded-2xl border border-emerald-900 bg-neutral-950 p-6 flex flex-col xl:flex-row gap-6 max-h-[94vh] overflow-y-auto shadow-2xl relative">
        
        {/* Close Modal CrossButton */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 rounded-full border border-emerald-950 bg-neutral-900 text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          title={language === 'bn' ? 'বন্ধ করুন' : 'Close Editor'}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Parameters Customizer Panel */}
        <div className="w-full xl:w-5/12 space-y-5 border-r border-[#042f2e]/40 pr-0 xl:pr-6">
          <div className="space-y-1 pb-3 border-b border-emerald-950">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-[#D4AF37]" />
              <span>{language === 'bn' ? 'রশিদ কাস্টমাইজেশন প্যানেল' : 'Formal Receipt Generator'}</span>
            </h3>
            <p className="text-xs text-slate-400 tracking-tight">
              {language === 'bn' ? 'অফিসিয়াল সমাজ কল্যাণ বাউন্ডারি ও সিল ব্র্যান্ডিং এডিটর' : 'Fully custom official BDT certificate with society layout, seal, and details.'}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Quick-Load existing database payment records */}
            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {language === 'bn' ? 'রেকর্ডকৃত পেমেন্ট লোড করুন' : 'Load Payment Record'}
              </label>
              <select
                value={selectedPaymentId}
                onChange={(e) => handlePaymentSelect(e.target.value)}
                className="w-full rounded border border-emerald-900 bg-neutral-900 p-2.5 text-white focus:outline-none"
              >
                {paidPayments.length === 0 ? (
                  <option value="">-- No Paid Bills Active --</option>
                ) : (
                  paidPayments.map((p) => (
                    <option key={p.id} value={p.id}>
                      Flat {p.flatNumber} • {getStylizedMonth(p.billingMonth)} • ৳{p.paidAmount || p.amount} ({getFeeTypeDisplay(p.feeType)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'রশিদ নম্বর' : 'Receipt No'}</label>
                <input 
                  type="text" 
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none focus:border-emerald-700" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat Number'}</label>
                <input 
                  type="text" 
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none focus:border-emerald-700 font-mono font-bold" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'সমিতির নাম' : 'Society Name Branding'}</label>
              <input 
                type="text" 
                value={societyName}
                onChange={(e) => setSocietyName(e.target.value)}
                className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none focus:border-emerald-700 font-bold" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'সমিতির স্লোগান / সাবটাইটেল' : 'Society Subtitle Tag'}</label>
              <input 
                type="text" 
                value={societySub}
                onChange={(e) => setSocietySub(e.target.value)}
                className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'বাসিন্দার নাম' : 'Received From (Buyer)'}</label>
                <input 
                  type="text" 
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Sum (BDT Amount)'}</label>
                <input 
                  type="number" 
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none font-bold" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'বিলের খাত' : 'Payment For (Segment)'}</label>
                <select
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value)}
                  className="w-full rounded border border-emerald-900 bg-neutral-900 p-2 text-white focus:outline-none"
                >
                  <option value="Maintenance">Maintenance Charge</option>
                  <option value="Utility">Utility Service Fee</option>
                  <option value="Gas">Gas Supply Allocation</option>
                  <option value="Water">Water Sewage Board</option>
                  <option value="Electricity">Security Guard Electricity</option>
                  <option value="Security_Parking">Parking Space rent</option>
                  <option value="Fine_Late_Fee">Late Fine / Interest Penalty</option>
                  <option value="Others">General Auxiliary Deposit</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</label>
                <input 
                  type="text" 
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Transaction TxnID</label>
                <input 
                  type="text" 
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none font-mono" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'বিলিং মাস' : 'Billing Month'}</label>
                <input 
                  type="month" 
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-2 text-white focus:outline-none font-mono" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">{language === 'bn' ? 'অতিরিক্ত মন্তব্য' : 'Receipt Remarks / Subject Note'}</label>
              <textarea 
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded border border-emerald-900 bg-neutral-900 px-2.5 py-1.5 text-white focus:outline-none text-xs" 
              />
            </div>

            {/* Custom Authority signature configurations */}
            <div className="p-3 bg-neutral-900 border border-emerald-950 rounded-xl space-y-3">
              <span className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">{language === 'bn' ? 'স্বাক্ষরকারী কর্তৃত্ব' : 'Official Signing Authority'}</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase">{language === 'bn' ? 'পদবী' : 'Officer Title'}</span>
                  <input 
                    type="text" 
                    value={authorityTitle}
                    onChange={(e) => setAuthorityTitle(e.target.value)}
                    className="w-full rounded border border-emerald-950 bg-neutral-950 px-2 py-1 text-slate-300 font-serif" 
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase">{language === 'bn' ? 'স্বাক্ষরকারী নাম' : 'Officer Name'}</span>
                  <input 
                    type="text" 
                    value={authorityName}
                    onChange={(e) => setAuthorityName(e.target.value)}
                    className="w-full rounded border border-emerald-950 bg-neutral-950 px-2 py-1 text-slate-300" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-950/50">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase block">{language === 'bn' ? 'গোল সিল' : 'Official Seal'}</span>
                  <select
                    value={sealStyle}
                    onChange={(e) => setSealStyle(e.target.value as any)}
                    className="w-full rounded border border-emerald-950 bg-neutral-950 p-1 text-[10px] text-slate-300"
                  >
                    <option value="gold">Gold Seal</option>
                    <option value="emerald">Green Seal</option>
                    <option value="none">No Seal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase block">{language === 'bn' ? 'গোল্ড বার' : 'Gold Header'}</span>
                  <input 
                    type="checkbox"
                    checked={includeBar}
                    onChange={(e) => setIncludeBar(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded bg-neutral-950 border-emerald-950 accent-emerald-600 block mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase block">{language === 'bn' ? 'ভাষা' : 'Lang'}</span>
                  <div className="text-[10px] font-bold text-slate-300 mt-1 uppercase text-center font-mono">
                    {language === 'bn' ? 'বাংলা' : 'EN'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isCompiling}
                onClick={handleDownloadPDF}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-black bg-emerald-600 border border-[#D4AF37]/50 text-white hover:bg-emerald-500 transition-all cursor-pointer shadow-lg shadow-black/40 disabled:opacity-50"
              >
                {isCompiling ? (
                  <span>{language === 'bn' ? 'পিডিএফ তৈরি হচ্ছে...' : 'Generating PDF...'}</span>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>{language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { window.focus(); window.print(); }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-black bg-neutral-900 border border-emerald-900 text-[#D4AF37] hover:text-white hover:bg-neutral-850 transition-all cursor-pointer shadow-lg shadow-black/40"
              >
                <Printer className="h-4 w-4 text-emerald-500" />
                <span>{language === 'bn' ? 'সরাসরি প্রিন্ট' : 'Direct Print'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: High-End Live Render Canvas Paper Slip (Landscape A5 formatted for high-contrast print layout) */}
        <div className="w-full xl:w-7/12 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Printer className="h-4 w-4 text-emerald-500" />
              <span>{language === 'bn' ? 'রশিদ প্রিন্ট আউটকাম প্রিভিউ' : 'Live Receipt Slip Preview'}</span>
            </span>
            <span className="text-[9px] text-[#D4AF37] font-mono bg-amber-950/40 border border-amber-900/60 px-2.5 py-1 rounded-full uppercase font-bold">
              Formal A5 Paper Slip Layout
            </span>
          </div>

          <div className="overflow-x-auto bg-neutral-900/40 p-4 rounded-2xl border border-emerald-950 flex items-center justify-center">
            {/* THIS IS THE DIRECT PRINT OUT CONTAINER THAT WILL BE DOWNLOADED */}
            <div 
              id="formal-exportable-slip"
              className="w-[740px] h-[480px] bg-white border-[6px] border-double border-emerald-900 rounded-lg p-6 relative font-serif select-none flex flex-col justify-between box-border"
              style={{ color: '#000000', backgroundColor: '#ffffff', borderStyle: 'double' }}
            >
              {/* Optional Top Gold bar line accent */}
              {includeBar && (
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-800 via-[#D4AF37] to-emerald-950 rounded-t-sm" />
              )}

              {/* Decorative classical watermarked background shield */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <FileText className="h-72 w-72 text-emerald-900 rotate-12" />
              </div>

              <div className="p-1">
                {/* Header Letterhead section */}
                <div className="flex justify-between items-start border-b border-emerald-800/20 pb-3 flex-row animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-emerald-950 border-2 border-[#D4AF37] flex items-center justify-center shadow-lg shadow-emerald-900/10">
                      <ShieldCheck className="h-7 w-7 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-black text-emerald-950 font-sans tracking-tight leading-tight uppercase">
                        {societyName}
                      </h2>
                      <p className="text-[9.5px] text-[#856404] font-semibold font-sans tracking-wider leading-none mt-0.5 uppercase">
                        {societySub}
                      </p>
                      <p className="text-[8.5px] text-slate-500 font-sans leading-none mt-0.5">
                        Address: {address}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="bg-emerald-100/80 border border-emerald-800/15 py-1 px-2.5 rounded text-center">
                      <span className="block text-[7.5px] font-mono text-emerald-800 uppercase font-black tracking-widest">{language === 'bn' ? 'টাকা রশিদ' : 'MONEY RECEIPT'}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-800 block mt-0.5">
                        No. {receiptNo}
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-sans mt-1 block tracking-wider uppercase font-bold font-mono">
                      {language === 'bn' ? 'তারিখ:' : 'Date Issued:'} {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Main Body ledger rows */}
                <div className="mt-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 border-b border-dotted border-slate-350 pb-1 flex-row">
                    <span className="text-slate-500 font-sans italic shrink-0">
                      {language === 'bn' ? 'সম্মানিত বাসিন্দা:' : 'Received with thanks from:'}
                    </span>
                    <span className="font-bold font-sans text-emerald-950 border-b border-solid border-transparent px-1 flex-1 text-sm">
                      {memberName}
                    </span>
                    <span className="text-slate-500 font-sans italic shrink-0 ml-2">
                      {language === 'bn' ? 'ফ্ল্যাট নম্বর:' : 'Apartment/Unit:'}
                    </span>
                    <span className="font-bold text-[#b45309] font-mono text-sm px-1 shrink-0">
                      UNIT {flatNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-b border-dotted border-slate-350 pb-1 flex-row">
                    <span className="text-slate-500 font-sans italic shrink-0">
                      {language === 'bn' ? 'প্রদানকৃত খাতের বিবরণ:' : 'The Sum of BDT:'}
                    </span>
                    <span className="font-semibold text-emerald-950 font-sans flex-1 text-sm">
                      {getFeeTypeDisplay(feeType)} {language === 'bn' ? 'বিল পরিশোধবাবদ' : 'Service charges deposit'}
                    </span>
                    <span className="text-slate-500 font-sans italic shrink-0 ml-2">
                      {language === 'bn' ? 'মাস:' : 'For Billing Month:'}
                    </span>
                    <span className="font-bold text-slate-800 font-mono px-1 shrink-0 text-sm italic">
                      {getStylizedMonth(billingMonth)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-b border-dotted border-slate-350 pb-1 flex-row">
                    <span className="text-slate-500 font-sans italic shrink-0">
                      {language === 'bn' ? 'কথায়:' : 'Amount in words:'}
                    </span>
                    <span className="font-bold text-slate-850 font-sans tracking-wide leading-tight flex-1 text-sm capitalize italic text-emerald-950 border-b-2 border-solid border-transparent pb-0.5">
                      {amountToWords(paidAmount, language as any)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-0.5">
                    <div className="text-[9.5px] text-slate-500 leading-tight font-sans bg-slate-50/50 border border-slate-150 p-1.5 rounded">
                      <span className="font-bold block text-[7.5px] text-emerald-900 uppercase tracking-widest font-mono mb-0.5">
                        {language === 'bn' ? 'পেমেন্ট মেটাডাটা বিবরণী' : 'VERIFICATION DETAILS METADATA'}
                      </span>
                      <p>Payment Channel: <span className="font-bold text-slate-850 uppercase font-mono">{payMethod}</span></p>
                      <p>Unique Transaction TxnId: <span className="font-bold text-slate-850 font-mono">{txnId}</span></p>
                    </div>

                    <div className="text-[9.5px] text-slate-400 leading-normal font-sans flex items-center p-1 font-sans">
                      <p className="italic leading-relaxed text-slate-550 border-l border-emerald-900/10 pl-2">
                        * {notes}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Official Seals, Authorization Bottom Column */}
              <div className="flex justify-between items-end pb-1 border-t border-slate-300/40 pt-2.5 flex-row">
                
                {/* Visual Gold/Emerald Stamp Seal Badge */}
                <div className="shrink-0 pl-3">
                  {sealStyle !== 'none' && (
                    <div className={`h-14 w-14 rounded-full border-2 border-double flex flex-col items-center justify-center p-0.5 bg-white select-none relative ${
                      sealStyle === 'gold' 
                        ? 'border-[#D4AF37]/80 text-[#856404]' 
                        : 'border-emerald-800 text-emerald-800'
                    }`}>
                      <div className={`h-11.5 w-11.5 rounded-full border border-dashed flex flex-col items-center justify-center scale-95 ${
                        sealStyle === 'gold' ? 'border-[#D4AF37]' : 'border-emerald-800/50'
                      }`}>
                        <span className="text-[5px] tracking-wide uppercase font-black font-sans leading-none block text-center">ASTHA</span>
                        <span className="text-[4.5px] uppercase block leading-none font-bold mt-0.5 text-center">{language === 'bn' ? 'সমিতির কার্যালয়' : 'SECRET SEAL'}</span>
                        <CheckCircle2 className={`h-2.5 w-2.5 mt-0.5 ${sealStyle === 'gold' ? 'text-[#D4AF37]' : 'text-emerald-700'}`} />
                        <span className="text-[4px] font-mono mt-0.5 italic text-slate-400">ACTIVE</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Big stylized BDT Amount Box */}
                <div className="flex items-center gap-1.5 px-4.5 py-1.5 bg-emerald-50/20 border-2 border-[#D4AF37] rounded-xl text-center self-center shadow-inner">
                  <span className="text-[10px] font-sans text-[#856404] uppercase font-black italic tracking-wider block shrink-0">BDT AMOUNT:</span>
                  <span className="text-lg font-mono font-black text-emerald-950 block">
                    ৳{paidAmount.toLocaleString()} /-
                  </span>
                </div>

                {/* Stylized custom handwritten authorization signature line */}
                <div className="text-center w-44 shrink-0 pr-2">
                  <div className="h-9 flex flex-col items-center justify-end">
                    <span className="font-serif italic text-sm text-emerald-950 font-bold tracking-widest select-none pb-0.5">
                      {authorityName}
                    </span>
                    <div className="w-full border-b border-slate-350" />
                  </div>
                  <span className="text-[8.5px] uppercase tracking-wider block font-sans font-bold text-slate-500 mt-1">
                    {authorityTitle}
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
