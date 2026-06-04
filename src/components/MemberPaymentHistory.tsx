/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { useSociety } from '../context/SocietyContext';
import { Member, Payment } from '../types';
import { 
  X, 
  TrendingUp, 
  Table, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar,
  Wallet,
  DollarSign,
  Printer
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface MemberPaymentHistoryProps {
  member: Member;
  onClose: () => void;
}

export default function MemberPaymentHistory({ member, onClose }: MemberPaymentHistoryProps) {
  const { payments, language } = useSociety();

  // Sorting state for the table
  const [sortBy, setSortBy] = useState<'billingMonth' | 'amount' | 'status' | 'feeType'>('billingMonth');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter payments for this specific member's flat
  const memberPayments = useMemo(() => {
    return payments.filter(p => p.flatNumber === member.flatNumber);
  }, [payments, member.flatNumber]);

  // Dynamic currency formatting BDT
  const formatBDT = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  const getFullMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthsEng: Record<string, string> = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    };
    const monthsBn: Record<string, string> = {
      '01': 'জানু', '02': 'ফেব্রু', '03': 'মার্চ', '04': 'এপ্রিল',
      '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
      '09': 'সেপ্টে', '10': 'অক্টো', '11': 'নভে', '12': 'ডিসে'
    };
    const mName = language === 'bn' ? (monthsBn[month] || month) : (monthsEng[month] || month);
    return `${mName} ${year}`;
  };

  const getFeeTypeLabel = (feeType: string) => {
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
      return bnLabels[feeType] || feeType;
    }
    return feeType.replace('_', ' ');
  };

  // Generate 12-month timeline ending at June 2026 (or current date/month)
  const chartData = useMemo(() => {
    const list = [];
    const now = new Date(2026, 5); // June is 5 in JS (month index starts at 0)
    
    // Generate last 12 months billingMonth keys e.g. "2025-07" to "2026-06"
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      list.push(`${y}-${m}`);
    }

    // Populate actual payments aggregation for each computed month
    return list.map(monthKey => {
      const billsInMonth = memberPayments.filter(p => p.billingMonth === monthKey);
      const totalPaid = billsInMonth.reduce((s, b) => s + (b.paidAmount || 0), 0);
      const totalDue = billsInMonth.reduce((s, b) => s + (b.dueAmount || 0), 0);
      
      return {
        monthKey,
        monthName: getFullMonthName(monthKey),
        [language === 'bn' ? 'পরিশোধিত' : 'Paid Amount']: totalPaid,
        [language === 'bn' ? 'বকেয়া' : 'Due Amount']: totalDue,
      };
    });
  }, [memberPayments, language]);

  // Handle table sorting logic
  const sortedPayments = useMemo(() => {
    const list = [...memberPayments];
    return list.sort((a, b) => {
      let valA: any = a[sortBy] || '';
      let valB: any = b[sortBy] || '';

      if (sortBy === 'amount') {
        valA = a.amount;
        valB = b.amount;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
  }, [memberPayments, sortBy, sortOrder]);

  const toggleSort = (field: 'billingMonth' | 'amount' | 'status' | 'feeType') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-sans" id="member-payments-modal">
      <div id="member-payments-printable-card" className="w-full max-w-5xl rounded-2xl border border-emerald-900 bg-neutral-950 p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl shadow-black relative print:max-h-none print:overflow-visible">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 rounded-full border border-emerald-950 bg-neutral-900 text-slate-400 hover:text-white hover:bg-neutral-850 transition-colors cursor-pointer"
          title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-emerald-950 pb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-xl border border-[#D4AF37]/40 bg-neutral-900 flex items-center justify-center overflow-hidden">
              {member.photoUrl ? (
                <img 
                  src={member.photoUrl} 
                  alt={member.name} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-emerald-950 to-neutral-950 flex items-center justify-center text-white font-extrabold text-lg select-none">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight font-sans">
                {member.name} — {language === 'bn' ? 'হিসাব খাতা' : 'Payment Ledger'}
              </h3>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-1 uppercase tracking-wide">
                <span className="text-[#D4AF37] font-black">Flat {member.flatNumber}</span>
                <span>•</span>
                <span>{member.type === 'Owner' ? (language === 'bn' ? 'মালিক' : 'Owner') : (language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant')}</span>
                <span>•</span>
                <span className="text-slate-500">{member.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div className="px-3.5 py-2 bg-emerald-950/40 border border-emerald-900 rounded-xl text-center">
              <span className="block text-[9px] uppercase font-mono text-slate-500 font-bold">{language === 'bn' ? 'মোট বিল' : 'Total Bills'}</span>
              <span className="text-sm font-black text-white font-mono">{memberPayments.length}</span>
            </div>
            <div className="px-3.5 py-2 bg-emerald-950/40 border border-emerald-900 rounded-xl text-center">
              <span className="block text-[9px] uppercase font-mono text-slate-500 font-bold">{language === 'bn' ? 'মোট পরিশোধিত বিডিটি' : 'Total Paid BDT'}</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {formatBDT(memberPayments.reduce((s, p) => s + (p.status === 'Paid' || p.status === 'Partial' ? p.paidAmount : 0), 0))}
              </span>
            </div>

            {/* Print and Close controls requested by user */}
            <button
              onClick={() => { window.focus(); window.print(); }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white border border-emerald-500/50 rounded-xl flex items-center gap-1.5 transition-all shadow-md transform active:scale-95 cursor-pointer"
              title={language === 'bn' ? 'রিপোর্ট প্রিন্ট করুন' : 'Print historical statement ledger'}
            >
              <Printer className="h-4 w-4" />
              <span>{language === 'bn' ? 'প্রিন্ট খাতা' : 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-slate-700 text-xs font-black text-slate-200 rounded-xl flex items-center gap-1.5 transition-all shadow-md transform active:scale-95 cursor-pointer"
              title={language === 'bn' ? 'বন্ধ করুন' : 'Close ledger panel'}
            >
              <X className="h-4 w-4 text-rose-500" />
              <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
            </button>
          </div>
        </div>

        {/* Recharts 12-Month Line Graph */}
        <div className="bg-neutral-950/60 border border-emerald-950 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white tracking-tight uppercase font-sans flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
              <span>{language === 'bn' ? 'বিগত ১২ মাসের আর্থিক বিশ্লেষণ' : 'Pay Trend — Last 12 Months Graph'}</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">
              {language === 'bn' ? 'জুন ২০২৬ পর্যন্ত সংকলিত' : 'Compiled up to June 2026'}
            </span>
          </div>

          <div className="h-[240px] w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#042f2e" opacity={0.15} />
                <XAxis 
                  dataKey="monthName" 
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
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#064e43', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '11.5px', padding: '1px 0' }}
                  formatter={(value: any, name: any) => [formatBDT(Number(value)), name]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8' }}
                />
                <Line 
                  type="monotone" 
                  name={language === 'bn' ? 'পরিশোধিত' : 'Paid Amount'} 
                  dataKey={language === 'bn' ? 'পরিশোধিত' : 'Paid Amount'} 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }} 
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  name={language === 'bn' ? 'বকেয়া' : 'Due Amount'} 
                  dataKey={language === 'bn' ? 'বকেয়া' : 'Due Amount'} 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  activeDot={{ r: 5 }} 
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sortable Payments History Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white tracking-tight uppercase font-sans flex items-center gap-2">
              <Table className="h-4.5 w-4.5 text-[#D4AF37]" />
              <span>{language === 'bn' ? 'বিস্তারিত বিল ও পেমেন্ট তালিকা' : 'Detailed Invoices Ledger'}</span>
            </h4>
          </div>

          <div className="border border-emerald-950 rounded-xl overflow-hidden bg-neutral-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-900 border-b border-emerald-950 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    <th className="p-4">
                      <button 
                        type="button" 
                        onClick={() => toggleSort('billingMonth')}
                        className="flex items-center gap-1 hover:text-white font-bold cursor-pointer"
                      >
                        <span>{language === 'bn' ? 'বিলিং মাস' : 'Month'}</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-[#D4AF37]" />
                      </button>
                    </th>
                    <th className="p-4">
                      <button 
                        type="button" 
                        onClick={() => toggleSort('feeType')}
                        className="flex items-center gap-1 hover:text-white font-bold cursor-pointer"
                      >
                        <span>{language === 'bn' ? 'বিলের ধরন' : 'Bill Type'}</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-[#D4AF37]" />
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button 
                        type="button" 
                        onClick={() => toggleSort('amount')}
                        className="flex items-center gap-1 ml-auto hover:text-white font-bold cursor-pointer"
                      >
                        <span>{language === 'bn' ? 'বিলের পরিমাণ' : 'Amount'}</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-[#D4AF37]" />
                      </button>
                    </th>
                    <th className="p-4 text-right">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</th>
                    <th className="p-4 text-right text-rose-400">{language === 'bn' ? 'বকেয়া' : 'Outstanding'}</th>
                    <th className="p-4">{language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Method'}</th>
                    <th className="p-4">
                      <button 
                        type="button" 
                        onClick={() => toggleSort('status')}
                        className="flex items-center gap-1 hover:text-white font-bold cursor-pointer"
                      >
                        <span>{language === 'bn' ? 'অবস্থা' : 'Status'}</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-[#D4AF37]" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/40">
                  {sortedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                        {language === 'bn' ? 'কোনো পেমেন্ট রেকর্ড খুঁজে পাওয়া যায়নি।' : 'No payment records registered for this member.'}
                      </td>
                    </tr>
                  ) : (
                    sortedPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="p-4 font-bold text-white font-mono">{getFullMonthName(p.billingMonth)}</td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-200">{getFeeTypeLabel(p.feeType)}</span>
                        </td>
                        <td className="p-4 font-bold text-white text-right font-mono">{formatBDT(p.amount)}</td>
                        <td className="p-4 font-semibold text-emerald-400 text-right font-mono">
                          {p.status === 'Paid' ? formatBDT(p.amount) : formatBDT(p.paidAmount || 0)}
                        </td>
                        <td className="p-4 font-semibold text-rose-400 text-right font-mono">
                          {p.status === 'Paid' ? formatBDT(0) : formatBDT(p.dueAmount || 0)}
                        </td>
                        <td className="p-4">
                          {p.payMethod ? (
                            <span className="text-slate-300 font-semibold text-[10px] bg-neutral-900 px-2 py-1 rounded border border-emerald-950">
                              {p.payMethod}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-wider ${
                            p.status === 'Paid'
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900'
                              : p.status === 'Partial'
                              ? 'bg-amber-950/60 text-[#D4AF37] border-amber-900'
                              : p.status === 'Pending'
                              ? 'bg-neutral-900 text-slate-400 border-slate-800'
                              : 'bg-red-950/40 text-red-500 border-red-900'
                          }`}>
                            {p.status === 'Paid' && <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                            {p.status === 'Partial' && <Clock className="h-3 w-3 text-amber-500 shrink-0" />}
                            {p.status === 'Pending' && <Clock className="h-3 w-3 text-slate-400 shrink-0" />}
                            {p.status === 'Overdue' && <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />}
                            <span>{p.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
