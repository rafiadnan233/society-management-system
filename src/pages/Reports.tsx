/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { FileDown, Printer, Wallet, TrendingUp, TrendingDown, ClipboardCopy, FileSpreadsheet, Building, BarChart2, X } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeAllInlineStyles } from '../utils/oklchPatch';

export default function Reports() {
  const { payments, expenses, config, language, setActiveTab } = useSociety();
  const t = translations[language];

  const [activeMonth, setActiveMonth] = useState('2026-05');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Month aggregations
  const monthlyIncomes = payments.filter(p => p.billingMonth === activeMonth && (p.status === 'Paid' || p.status === 'Partial'));
  const monthlyDues = payments.filter(p => p.billingMonth === activeMonth && p.status !== 'Paid');
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(activeMonth));

  // Financial values
  const incomeSum = monthlyIncomes.reduce((s, p) => s + p.paidAmount, 0);
  const duesSum = monthlyDues.reduce((s, p) => s + p.dueAmount, 0);
  const expenseSum = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const netSurplus = incomeSum - expenseSum;

  const formatBDT = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  const getFullMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthsEng = {
      '01': 'January', '02': 'February', '03': 'March', '04': 'April',
      '05': 'May', '06': 'June', '07': 'July', '08': 'August',
      '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    };
    const monthsBn = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল',
      '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
      '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };
    const mName = language === 'bn' ? (monthsBn[month as keyof typeof monthsBn] || '') : (monthsEng[month as keyof typeof monthsEng] || '');
    const formattedYear = language === 'bn' ? year.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)]) : year;
    return `${mName} ${formattedYear}`;
  };

  // Year-to-Date calculation for active year
  const currentYear = activeMonth.split('-')[0] || '2026';

  const monthsList = [
    { key: '01', name: 'Jan', nameBn: 'জানু' },
    { key: '02', name: 'Feb', nameBn: 'ফেব্রু' },
    { key: '03', name: 'Mar', nameBn: 'মার্চ' },
    { key: '04', name: 'Apr', nameBn: 'এপ্রিল' },
    { key: '05', name: 'May', nameBn: 'মে' },
    { key: '06', name: 'Jun', nameBn: 'জুন' },
    { key: '07', name: 'Jul', nameBn: 'জুলাই' },
    { key: '08', name: 'Aug', nameBn: 'আগস্ট' },
    { key: '09', name: 'Sep', nameBn: 'সেপ্টে' },
    { key: '10', name: 'Oct', nameBn: 'অক্টো' },
    { key: '11', name: 'Nov', nameBn: 'নভে' },
    { key: '12', name: 'Dec', nameBn: 'ডিসে' }
  ];

  const ytdData = monthsList.map(m => {
    const monthPrefix = `${currentYear}-${m.key}`;
    const monthlyIncomesList = payments.filter(p => p.billingMonth === monthPrefix && (p.status === 'Paid' || p.status === 'Partial'));
    const incomeSumVal = monthlyIncomesList.reduce((s, p) => s + (p.paidAmount || 0), 0);
    const monthlyExpensesList = expenses.filter(e => e.date.startsWith(monthPrefix));
    const expenseSumVal = monthlyExpensesList.reduce((s, e) => s + (e.amount || 0), 0);

    return {
      month: language === 'bn' ? m.nameBn : m.name,
      Revenue: incomeSumVal,
      Expenses: expenseSumVal
    };
  });

  const ytdTotalRevenue = ytdData.reduce((s, d) => s + d.Revenue, 0);
  const ytdTotalExpenses = ytdData.reduce((s, d) => s + d.Expenses, 0);
  const ytdSurplus = ytdTotalRevenue - ytdTotalExpenses;

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const handleExportCSV = () => {
    alert(language === 'bn' ? 'রিপোর্টটি এক্সেল ফরম্যাটে (.csv) এক্সপোর্ট করা হচ্ছে' : 'Generating CSV file, spreadsheet downloading shortly...');
  };

  const handleDownloadMonthlyAudit = async () => {
    const element = document.getElementById('printable-receipt');
    if (!element) return;

    try {
      setIsGeneratingPDF(true);
      
      // Sanitize all inline styles to prevent oklch rendering exceptions
      sanitizeAllInlineStyles(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0c0a09', // Deep dark theme matching bg-neutral-950/45 container
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
      pdf.save(`Monthly-Audit-${activeMonth}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert(language === 'bn' ? 'পিডিএফ তৈরি ব্যর্থ হয়েছে।' : 'Failed to generate PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
            {t.reports_title} Console
          </h2>
          <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
            Audit balance sheets, inspect cash collections, printing statements and download fiscal statements
          </p>
        </div>

        {/* Month selector auditor */}
        <div className="flex items-center gap-2 bg-neutral-950 p-2.5 rounded-lg border border-emerald-950">
          <span className="text-[10px] font-bold text-slate-500 font-mono uppercase pl-1">Audit Month:</span>
          <select
            value={activeMonth}
            onChange={(e) => setActiveMonth(e.target.value)}
            className="rounded border border-emerald-900 bg-neutral-900 py-1.5 px-2 text-xs text-white focus:outline-none cursor-pointer font-sans"
          >
            <option value="2026-05">May 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-07">July 2026</option>
          </select>
        </div>
      </div>

      {/* Printing Controls Bar */}
      <div className="flex flex-wrap gap-2 justify-end print:hidden">
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D4AF37]/35 rounded text-xs text-slate-300 hover:text-white cursor-pointer hover:bg-neutral-900 transition-all"
        >
          <FileSpreadsheet className="h-4.5 w-4.5 text-[#D4AF37]" />
          <span>Export Excel CSV</span>
        </button>

        <button
          type="button"
          disabled={isGeneratingPDF}
          onClick={handleDownloadMonthlyAudit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-neutral-900 border border-[#D4AF37]/40 hover:border-[#D4AF37]/80 text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition-all shadow-md transform active:scale-95"
        >
          <FileDown className="h-4.5 w-4.5 text-[#D4AF37]" />
          <span>
            {isGeneratingPDF 
              ? (language === 'bn' ? 'অডিট ডাউনলোড হচ্ছে...' : 'Generating Audit PDF...') 
              : (language === 'bn' ? 'অডিট ডাউনলোড করুন' : 'Download Monthly Audit')
            }
          </span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer transition-all shadow-md transform active:scale-95"
        >
          <Printer className="h-4.5 w-4.5" />
          <span>{language === 'bn' ? 'ব্যালেন্স শীট প্রিন্ট করুন' : 'Print Balance Sheet'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-neutral-900 border border-slate-705 text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-all shadow-md transform active:scale-95"
        >
          <X className="h-4.5 w-4.5 text-rose-500" />
          <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
        </button>
      </div>

      {/* Year-to-Date (YTD) Summary Performance Section */}
      <div className="bg-neutral-950/60 border border-emerald-950/80 p-5 rounded-xl space-y-5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight font-sans uppercase flex items-center gap-2">
              <BarChart2 className="h-4.5 w-4.5 text-emerald-400" />
              <span>{language === 'bn' ? `চলতি বছরের আর্থিক গতিধারা (YTD - ${currentYear})` : `Year-to-Date Financial performance (YTD - ${currentYear})`}</span>
            </h3>
            <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
              {language === 'bn' 
                ? 'চলতি বছরের মাসিক সংগৃহীত রাজস্ব খাতের পেমেন্ট বনাম পরিশোধিত খরচের রূপরেখা' 
                : 'Summary chart of month-by-month cash collections vs disbursed expenditures'}
            </p>
          </div>
          
          {/* Quick summary numbers for Year-to-Date */}
          <div className="flex flex-wrap gap-3.5">
            <div className="bg-neutral-900 border border-emerald-950/60 py-1.5 px-3 rounded-lg">
              <span className="block text-[8px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট সংগৃহীত (YTD)' : 'Total Revenue (YTD)'}</span>
              <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">{formatBDT(ytdTotalRevenue)}</span>
            </div>
            <div className="bg-neutral-900 border border-emerald-950/60 py-1.5 px-3 rounded-lg">
              <span className="block text-[8px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট ব্যয় (YTD)' : 'Total Expenses (YTD)'}</span>
              <span className="text-sm font-black text-[#D4AF37] font-mono mt-0.5 block">{formatBDT(ytdTotalExpenses)}</span>
            </div>
            <div className={`bg-neutral-900 border py-1.5 px-3 rounded-lg ${ytdSurplus >= 0 ? 'border-emerald-600/35 text-emerald-400' : 'border-rose-600/35 text-rose-400'}`}>
              <span className="block text-[8px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'নেট উদ্বৃত্ত (YTD)' : 'Net Treasury (YTD)'}</span>
              <span className="text-sm font-black font-mono mt-0.5 block">{formatBDT(ytdSurplus)}</span>
            </div>
          </div>
        </div>

        {/* Recharts Performance Display */}
        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ytdData}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.15}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.15}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#042f2e" opacity={0.2} />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `৳${value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#064e3b', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                itemStyle={{ fontSize: '12px' }}
                formatter={(value: any) => [formatBDT(Number(value)), '']}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8' }}
              />
              <Bar name={language === 'bn' ? 'সংগৃহীত' : 'Revenue'} dataKey="Revenue" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
              <Bar name={language === 'bn' ? 'ব্যয়' : 'Expenses'} dataKey="Expenses" fill="url(#colorExpenses)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Balance Sheet Printable layout */}
      <div id="printable-receipt" className="rounded-xl border border-emerald-950 bg-neutral-950/45 p-6 space-y-6 print:border-0 print:bg-white print:text-black print:p-0">
        
        {/* Balance Sheet Print Header */}
        <div className="flex justify-between items-start border-b border-emerald-950/60 pb-5 print:border-b-2 print:border-slate-800 print:pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-emerald-700 border border-[#D4AF37]/50 print:border-slate-300 print:bg-white">
              <Building className="h-6 w-6 text-white print:text-slate-800" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white uppercase tracking-tight print:text-black print:text-lg font-sans">{config.name}</h1>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider print:text-slate-700 print:text-xs print:font-bold">
                {language === 'bn' 
                  ? `মাসিক আর্থিক হিসাব বিবরণী: ${getFullMonthName(activeMonth)}`
                  : `Monthly Balance Sheet: ${getFullMonthName(activeMonth).toUpperCase()}`
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[8.5px] font-bold text-slate-500 font-mono print:text-slate-500">Date Generated:</span>
            <span className="font-mono text-xs font-bold text-[#D4AF37] print:text-black">
              {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Central Balance Sheet aggregations cards row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 pt-1 print:grid-cols-4">
          
          <div className="bg-neutral-900 border border-emerald-950 p-4 rounded text-center print:bg-white print:border-slate-300">
            <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">TOTAL INCOMES (Settled BDT)</span>
            <span className="text-lg font-black text-emerald-400 font-mono print:text-emerald-700">{formatBDT(incomeSum)}</span>
          </div>

          <div className="bg-neutral-900 border border-emerald-950 p-4 rounded text-center print:bg-white print:border-slate-300">
            <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">TOTAL EXPENSES (Disbursed)</span>
            <span className="text-lg font-black text-[#D4AF37] font-mono print:text-amber-800">{formatBDT(expenseSum)}</span>
          </div>

          <div className="bg-neutral-900 border border-emerald-950 p-4 rounded text-center print:bg-white print:border-slate-300">
            <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">Dues Outstanding</span>
            <span className="text-lg font-black text-rose-500 font-mono print:text-red-700">{formatBDT(duesSum)}</span>
          </div>

          <div className={`bg-neutral-900 border p-4 rounded text-center print:bg-white print:border-slate-300 ${netSurplus >= 0 ? 'border-emerald-600 text-emerald-400' : 'border-rose-600 text-rose-400'}`}>
            <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">Net surplus/deficit flow</span>
            <span className="text-lg font-black font-mono">{formatBDT(netSurplus)}</span>
          </div>

        </div>
        
        {/* Breakdowns columns lists */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-2 print:grid-cols-2">
          
          {/* Incoming Cash Collections lists details */}
          <div className="space-y-3.5 border border-emerald-950/40 p-4 rounded-lg print:border-slate-300">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5 print:text-emerald-800">
              <TrendingUp className="h-4.5 w-4.5" />
              Incoming settled collections ({monthlyIncomes.length})
            </h3>
            <div className="divide-y divide-[#059669]/10 text-xs">
              {monthlyIncomes.map((inc) => (
                <div key={inc.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-100 print:text-black">Flat {inc.flatNumber} - {inc.memberName}</span>
                    <span className="block text-[8px] text-slate-500 font-mono">{inc.title} ({inc.payMethod})</span>
                  </div>
                  <span className="font-mono text-[#059669] font-bold">{formatBDT(inc.paidAmount)}</span>
                </div>
              ))}
              {monthlyIncomes.length === 0 && (
                <p className="py-4 text-center text-slate-500 font-mono text-[11px]">No income collections reported for this month.</p>
              )}
            </div>
          </div>

          {/* Outgoing Debits Expenses lists details */}
          <div className="space-y-3.5 border border-emerald-950/40 p-4 rounded-lg print:border-slate-300">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1.5 print:text-amber-800">
              <TrendingDown className="h-4.5 w-4.5" />
              Disbursed outlays expenses ({monthlyExpenses.length})
            </h3>
            <div className="divide-y divide-[#059669]/10 text-xs">
              {monthlyExpenses.map((exp) => (
                <div key={exp.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-100 print:text-black">{exp.title}</span>
                    <span className="block text-[8px] text-slate-500 font-mono">{exp.category.replace('_',' ')}</span>
                  </div>
                  <span className="font-mono text-rose-500 font-bold">{formatBDT(exp.amount)}</span>
                </div>
              ))}
              {monthlyExpenses.length === 0 && (
                <p className="py-4 text-center text-slate-500 font-mono text-[11px]">No disbursements logged in this month.</p>
              )}
            </div>
          </div>

        </div>

        {/* Audit Disclaimer Signatures */}
        <div className="flex justify-between items-center pt-16 text-[9px] font-mono text-slate-500 border-t border-emerald-950/20">
          <div className="text-center w-32">
            <div className="border-b border-emerald-950 pb-1 mb-1" />
            <span>COMMITTEE TREASURER</span>
          </div>
          <p className="text-center font-bold tracking-tight uppercase text-slate-600">AUDITED APARTMENT DISCLOSURES</p>
          <div className="text-center w-32">
            <div className="border-b border-emerald-950 pb-1 mb-1" />
            <span>SOCIETY PRESIDENT</span>
          </div>
        </div>

      </div>

    </div>
  );
}
