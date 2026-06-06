/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Expense } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar, 
  Filter, 
  X, 
  Printer,
  BarChart2,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, language, currentUser } = useSociety();
  const t = translations[language];

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [chartStyle, setChartStyle] = useState<'grouped' | 'stacked' | 'line'>('grouped');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Staff_Salary');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [receiptNo, setReceiptNo] = useState('');

  // Calculations
  const categoryLabels: { [key: string]: string } = {
    Staff_Salary: t.exp_staff,
    Electricity_Bill: t.exp_electricity,
    Water_Bill: t.exp_water,
    Repairs: t.exp_repairs,
    Cleaning_Garbage: t.exp_cleaning,
    Security_Equipment: t.exp_security,
    Community_Event: t.exp_comm,
    Others: t.exp_other
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.receiptNo && e.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const CATEGORY_COLORS: { [key: string]: string } = {
    Staff_Salary: '#f43f5e',       // rose-500
    Electricity_Bill: '#f59e0b',   // amber-500
    Water_Bill: '#06b6d4',         // cyan-500
    Repairs: '#3b82f6',            // blue-500
    Cleaning_Garbage: '#10b981',   // emerald-500
    Security_Equipment: '#8b5cf6', // violet-500
    Community_Event: '#ec4899',    // pink-500
    Others: '#64748b'              // slate-500
  };

  const pieData = Object.keys(categoryLabels).map((catKey) => {
    const value = filteredExpenses
      .filter(e => e.category === catKey)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      name: categoryLabels[catKey],
      value,
      color: CATEGORY_COLORS[catKey] || '#64748b'
    };
  }).filter(item => item.value > 0);

  const formatBDT = (val: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  const openAddModal = () => {
    setTitle('');
    setCategory('Staff_Salary');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReceiptNo('');
    setEditingExpense(null);
    setShowAddModal(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDate(exp.date);
    setDescription(exp.description);
    setReceiptNo(exp.receiptNo || '');
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'Admin') {
      alert(language === 'bn' ? 'শুধুমাত্র এডমিন এই অপশনটি ব্যবহার করতে পারবেন।' : 'Only Admin is allowed to perform this action.');
      return;
    }
    if (!title || amount < 0 || !date) return;

    if (editingExpense) {
      updateExpense({
        ...editingExpense,
        title,
        category,
        amount,
        date,
        description,
        receiptNo
      });
    } else {
      addExpense({
        title,
        category,
        amount,
        date,
        description,
        receiptNo
      });
    }
    setShowAddModal(false);
  };

  // Spending trends comparative calculations for FY 2026
  const monthsEng = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsBen = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const trendYear = '2026';

  const billingTrendsData = monthsEng.map((m, index) => {
    const monthNum = (index + 1).toString().padStart(2, '0');
    const prefix = `${trendYear}-${monthNum}`;
    const monthlyExps = expenses.filter(e => e.date.startsWith(prefix));

    const staffSalary = monthlyExps
      .filter(e => e.category === 'Staff_Salary')
      .reduce((sum, e) => sum + e.amount, 0);

    const electricity = monthlyExps
      .filter(e => e.category === 'Electricity_Bill')
      .reduce((sum, e) => sum + e.amount, 0);

    const repairs = monthlyExps
      .filter(e => e.category === 'Repairs')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      name: language === 'bn' ? monthsBen[index] : m,
      staffSalary,
      electricity,
      repairs
    };
  });

  const totalYearlyStaff = billingTrendsData.reduce((acc, d) => acc + d.staffSalary, 0);
  const totalYearlyElectricity = billingTrendsData.reduce((acc, d) => acc + d.electricity, 0);
  const totalYearlyRepairs = billingTrendsData.reduce((acc, d) => acc + d.repairs, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans">
            {t.expenses} Ledger
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Audit, track, and record security wages, repair statements and electricity bills
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          
          {currentUser?.role === 'Admin' && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 border border-[#D4AF37]/30 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{t.add_expense}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Sum Card & Visual Categorical Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Sum KPIs */}
        <div className="rounded-xl border border-rose-950 bg-rose-950/5 p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
              Aggregated Ledger outlays
            </span>
            <div className="rounded bg-rose-950 border border-rose-900 p-1.5 text-rose-500">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="block text-3xl font-black text-rose-500 font-mono">
              {formatBDT(totalExpenseSum)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Filtered Sum across {filteredExpenses.length} disbursements
            </span>
          </div>
          <span className="absolute bottom-0 right-0 h-12 w-12 bg-rose-500/5 rounded-tl-full" />
        </div>

        {/* Categories Analysis panel with Pie Chart */}
        <div className="lg:col-span-2 rounded-xl border border-emerald-950 bg-neutral-950/45 p-5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            
            {/* Grid of values */}
            <div className="flex-1 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Category distributions
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                {Object.keys(categoryLabels).map((catKey) => {
                  const catSum = filteredExpenses
                    .filter(e => e.category === catKey)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const catColor = CATEGORY_COLORS[catKey] || '#64748b';
                  return (
                    <div key={catKey} className="bg-neutral-900/60 p-2.5 rounded border border-emerald-950/40 flex items-center justify-between gap-1">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="block text-[8px] text-slate-400 truncate uppercase font-mono tracking-tight font-bold">
                          {categoryLabels[catKey]}
                        </span>
                        <span className="block font-mono text-[11px] font-bold text-white">
                          {formatBDT(catSum)}
                        </span>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recharts Pie Chart */}
            <div className="w-full md:w-60 flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-2">
                {language === 'bn' ? 'ব্যয়ের ভাগ বিশ্লেষণ' : 'Expense Share Breakdown'}
              </span>
              <div className="h-44 w-full relative flex items-center justify-center">
                {pieData.length === 0 ? (
                  <div className="text-center text-[10px] text-slate-500 font-mono">
                    {language === 'bn' ? 'কোন খরচ নেই' : 'No expenses recorded'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#1c1917', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '10px', color: '#fff' }}
                        formatter={(value: any) => [formatBDT(Number(value)), '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Visual Spending Trends Panel */}
      <div className="rounded-xl border border-emerald-950 bg-neutral-950/45 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-950/50 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight font-sans uppercase flex items-center gap-2">
              <BarChart2 className="h-4.5 w-4.5 text-rose-500" />
              <span>
                {language === 'bn' ? `রক্ষণাবেক্ষণ ও খরচ গতিধারা (অর্থবছর - ${trendYear})` : `Maintenance & Outlay Trends (Fiscal Year - ${trendYear})`}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {language === 'bn' 
                ? 'স্টাফ বেতন, বিদ্যুৎ এবং সংস্কার মেরামত বাবদ বার্ষিক খরচের গতিধারা তুলনামূলক গ্রাফ'
                : 'YTD comparative breakdown of wages, power utilities and structural repairs'}
            </p>
          </div>

          {/* Chart Style Toggle Options */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-emerald-950 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setChartStyle('grouped')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                chartStyle === 'grouped'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'bn' ? 'গ্রুপড' : 'Grouped'}
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('stacked')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                chartStyle === 'stacked'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'bn' ? 'স্ট্যাকড' : 'Stacked'}
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('line')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                chartStyle === 'line'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'bn' ? 'লাইন' : 'Line'}
            </button>
          </div>
        </div>

        {/* Categories Total Mini Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-rose-950/40 flex justify-between items-center bg-neutral-900/60">
            <div>
              <span className="block text-[8px] font-mono tracking-wider uppercase font-bold text-slate-400">
                {language === 'bn' ? 'বাৎসরিক স্টাফ বেতন' : 'YTD Salary Total'}
              </span>
              <span className="text-sm font-black font-mono text-rose-400 mt-0.5 block">{formatBDT(totalYearlyStaff)}</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500" />
          </div>
          <div className="p-3 rounded-lg border border-amber-950/30 flex justify-between items-center bg-neutral-900/60">
            <div>
              <span className="block text-[8px] font-mono tracking-wider uppercase font-bold text-slate-400">
                {language === 'bn' ? 'বাৎসরিক বিদ্যুৎ বিল' : 'YTD Electricity Total'}
              </span>
              <span className="text-sm font-black font-mono text-amber-500 mt-0.5 block">{formatBDT(totalYearlyElectricity)}</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-lg shadow-amber-500" />
          </div>
          <div className="p-3 rounded-lg border border-blue-950/30 flex justify-between items-center bg-neutral-900/60">
            <div>
              <span className="block text-[8px] font-mono tracking-wider uppercase font-bold text-slate-400">
                {language === 'bn' ? 'বাৎসরিক মেরামত ও সংস্কার' : 'YTD Repairs Total'}
              </span>
              <span className="text-sm font-black font-mono text-blue-400 mt-0.5 block">{formatBDT(totalYearlyRepairs)}</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500" />
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === 'line' ? (
              <LineChart data={billingTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#042f2e" opacity={0.15} />
                <XAxis 
                  dataKey="name" 
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
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#1c1917', borderRadius: '8px' }}
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
                <Line
                  name={language === 'bn' ? 'স্টাফ বেতন' : 'Staff Salary'}
                  type="monotone"
                  dataKey="staffSalary"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  name={language === 'bn' ? 'বিদ্যুৎ বিল' : 'Electricity'}
                  type="monotone"
                  dataKey="electricity"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  name={language === 'bn' ? 'সংস্কার মেরামত' : 'Repairs'}
                  type="monotone"
                  dataKey="repairs"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={billingTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#042f2e" opacity={0.15} />
                <XAxis 
                  dataKey="name" 
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
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#1c1917', borderRadius: '8px' }}
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
                <Bar
                  name={language === 'bn' ? 'স্টাফ বেতন' : 'Staff Salary'}
                  dataKey="staffSalary"
                  stackId={chartStyle === 'stacked' ? "a" : undefined}
                  fill="#ef4444"
                  radius={chartStyle === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                />
                <Bar
                  name={language === 'bn' ? 'বিদ্যুৎ বিল' : 'Electricity'}
                  dataKey="electricity"
                  stackId={chartStyle === 'stacked' ? "a" : undefined}
                  fill="#f59e0b"
                  radius={chartStyle === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]}
                />
                <Bar
                  name={language === 'bn' ? 'সংস্কার মেরামত' : 'Repairs'}
                  dataKey="repairs"
                  stackId={chartStyle === 'stacked' ? "a" : undefined}
                  fill="#3b82f6"
                  radius={chartStyle === 'stacked' ? [3, 3, 0, 0] : [3, 3, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters ledger list */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <input
            type="text"
            placeholder={language === 'bn' ? 'খরচের ভাউচার নং বা বিবরণ দিয়ে খুঁজুন...' : 'Search expenses by name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded bg-neutral-950/45 border border-emerald-950 py-2 pl-10 pr-3 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Category selector filter */}
        <div className="flex items-center gap-1.5 bg-neutral-950/45 border border-emerald-950 p-1.5 rounded-lg overflow-x-auto pr-3">
          <Filter className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-1" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded border border-emerald-900 bg-neutral-900 py-1 px-2 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {Object.keys(categoryLabels).map(k => (
              <option key={k} value={k}>{categoryLabels[k]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table rendering */}
      <div className="rounded-xl border border-emerald-950 bg-neutral-950/35 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-emerald-950 bg-neutral-950/60 font-mono">
                <th className="p-4 text-slate-400 font-semibold">Voucher / Receipt Reference</th>
                <th className="p-4 text-slate-400 font-semibold">{t.category}</th>
                <th className="p-4 text-slate-400 font-semibold">{language === 'bn' ? 'তারিখ' : 'Disbursed Date'}</th>
                <th className="p-4 text-slate-400 font-semibold">Description details</th>
                <th className="p-4 text-slate-400 font-semibold">{t.amount}</th>
                <th className="p-4 text-right text-slate-400 font-semibold">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#059669]/10">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    Zero cash debits matched current filters. Excellent state.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-rose-950/5">
                    <td className="p-4">
                      <span className="block font-bold text-white max-w-[170px] truncate">{exp.title}</span>
                      <span className="block text-[8px] text-slate-500 font-mono">Ref No: {exp.receiptNo || 'None'}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex rounded bg-[#D4AF37]/5 px-2 py-0.5 text-[9px] font-bold text-[#D4AF37] border border-[#D4AF37]/15 font-mono uppercase">
                        {categoryLabels[exp.category]}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{exp.date}</td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">{exp.description}</td>
                    <td className="p-4 font-mono font-bold text-rose-500">{formatBDT(exp.amount)}</td>
                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      {currentUser?.role === 'Admin' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (currentUser?.role !== 'Admin') return;
                              openEditModal(exp);
                            }}
                            className="p-1 px-2 border border-emerald-950 text-[10px] rounded hover:border-[#D4AF37] text-slate-300 font-sans cursor-pointer"
                          >
                            {t.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (currentUser?.role !== 'Admin') return;
                              if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই খরচ ডিলিট করতে চান?' : 'Are you sure you want to delete this expense?')) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1 px-2 border border-rose-950 text-[10px] rounded hover:bg-rose-950/10 text-rose-500 font-sans cursor-pointer"
                          >
                            {t.delete}
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-505 font-mono text-[9px] uppercase tracking-wider font-extrabold text-slate-550 mr-2">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-pink-900/40 bg-neutral-950 p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <h3 className="text-sm font-bold text-white">
                {editingExpense ? t.edit_expense : t.add_expense}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              {/* title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Disbursement Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="DNCC Corridor Insect Chemical Sprays"
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Category Ledger</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="block w-full rounded border border-emerald-950 bg-[#0c0a09] py-2 px-1 text-white focus:outline-none"
                  >
                    {Object.keys(categoryLabels).map(k => (
                      <option key={k} value={k}>{categoryLabels[k]}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Date Filed</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-1.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Debit Amount (BDT)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                {/* Receipt No */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Receipt/Voucher Ref</label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="DNCC-3902"
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block font-mono">Usage Description Details</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Purchasing 12 packets of chemicals + DNCC team service tips"
                  rows={2}
                  className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-emerald-950">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-emerald-950 rounded text-slate-400 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 rounded border border-[#D4AF37]/35 text-white hover:bg-rose-500 font-bold"
                >
                  {editingExpense ? t.save : t.add}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
