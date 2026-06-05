/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { Save, Settings as GearIcon, AlertCircle, Building, ShieldAlert, CreditCard, Users, Trash2, MessageSquare, Key, Check, X } from 'lucide-react';

export default function Settings() {
  const { config, updateConfig, language, currentUser, userAccounts, updateUserAccountStatus, deleteUserAccount, updateUserPassword } = useSociety();
  const t = translations[language];

  const [activeSubTab, setActiveSubTab] = useState<'config' | 'accounts'>('config');

  // Forms
  const [name, setName] = useState(config.name);
  const [address, setAddress] = useState(config.address);
  const [contactNo, setContactNo] = useState(config.contactNo);
  const [email, setEmail] = useState(config.email);
  const [maintenanceFee, setMaintenanceFee] = useState(config.bdtMaintenanceFee || (config as any).maintenanceFee || 5000);
  const [bKashMerchant, setBKashMerchant] = useState(config.bKashMerchant);
  const [nagadMerchant, setNagadMerchant] = useState(config.nagadMerchant);
  const [smsAlertPhone, setSmsAlertPhone] = useState(config.smsAlertPhone || config.contactNo || '');
  const [whatsappNo, setWhatsappNo] = useState(config.whatsappNo || config.contactNo || '');
  const [monthlyExpenseBudget, setMonthlyExpenseBudget] = useState(config.monthlyExpenseBudget || 50000);
  const [success, setSuccess] = useState('');

  // Password alteration states
  const [editingPasswordAccountId, setEditingPasswordAccountId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name,
      address,
      contactNo,
      email,
      bdtMaintenanceFee: maintenanceFee,
      maintenanceFee, // backward compatibility
      bKashMerchant,
      nagadMerchant,
      smsAlertPhone,
      whatsappNo,
      monthlyExpenseBudget
    });
    setSuccess(language === 'bn' ? 'কনফিগারেশন সফলভাবে আপডেট করা হয়েছে!' : 'Society Configurations saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl font-sans flex items-center gap-2">
          <GearIcon className="h-6 w-6 text-emerald-400" />
          <span>{t.settings}</span>
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Establish official building accounts, standard BDT maintenance costs and emergency mobile wallets
        </p>
      </div>

      {currentUser?.role !== 'Admin' ? (
        <div className="rounded-xl border border-rose-950 bg-rose-950/10 p-5 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white capitalize">Security Access Restriction</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Only committee members with administrative clearance status can adjust standard flat rates, billing merchant paths, or billing definitions.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sub Tab Switcher bar */}
          <div className="flex border-b border-emerald-950/80 pb-px gap-6 mb-4">
            <button
              type="button"
              onClick={() => setActiveSubTab('config')}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase transition-colors relative cursor-pointer ${activeSubTab === 'config' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              {language === 'bn' ? 'সোসাইটি কনফিগারেশন' : 'Society Configurations'}
              {activeSubTab === 'config' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('accounts')}
              className={`pb-2.5 text-xs font-bold tracking-wider uppercase transition-colors relative cursor-pointer ${activeSubTab === 'accounts' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              {language === 'bn' ? 'ইউজার আইডি ও এক্সেস নিয়ন্ত্রণসমূহ' : 'User IDs & Access Control'}
              {activeSubTab === 'accounts' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
          </div>

          {activeSubTab === 'config' ? (
            <form onSubmit={handleSave} className="space-y-6 max-w-2xl font-sans text-xs">
              {success && (
                <p className="p-3 bg-emerald-950/20 text-emerald-400 border border-emerald-900 rounded-lg font-bold font-sans">
                  ✔ {success}
                </p>
              )}

              {/* General Society disclosures */}
              <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1.5 pb-2 border-b border-emerald-950">
                  <Building className="h-4.5 w-4.5" />
                  General Society Disclosures
                </h3>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Society Official Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Mailing Address (Road, Block, Area)</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Contact no phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block font-mono">Secretary Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block font-mono">Official Society Email Inbox</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Billing limits */}
              <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1.5 pb-2 border-b border-emerald-950">
                  <CreditCard className="h-4.5 w-4.5" />
                  Standard Billing parameters
                </h3>

                {/* Maintenance Fee */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block font-mono">Monthly Flat Maintenance Fee (৳ BDT)</label>
                    <input
                      type="number"
                      required
                      value={maintenanceFee}
                      onChange={(e) => setMaintenanceFee(parseInt(e.target.value) || 0)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block font-mono">Monthly Expense Threshold (৳ BDT)</label>
                    <input
                      type="number"
                      required
                      value={monthlyExpenseBudget}
                      onChange={(e) => setMonthlyExpenseBudget(parseInt(e.target.value) || 0)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* bKash Wallet */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block font-mono">Official bkash Merchant Wallet ID</label>
                    <input
                      type="text"
                      required
                      value={bKashMerchant}
                      onChange={(e) => setBKashMerchant(e.target.value)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 font-mono text-white focus:outline-none"
                    />
                  </div>

                  {/* Nagad ID */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block font-mono">Nagad Wallet ID</label>
                    <input
                      type="text"
                      required
                      value={nagadMerchant}
                      onChange={(e) => setNagadMerchant(e.target.value)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SMS Alert & WhatsApp Configurations */}
              <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1.5 pb-2 border-b border-emerald-950">
                  <MessageSquare className="h-4.5 w-4.5 text-emerald-400" />
                  {language === 'bn' ? 'এসএমএস এবং হোয়াটসঅ্যাপ অ্যালার্ট কনফিগারেশন' : 'SMS & WhatsApp Alert Configurations'}
                </h3>

                <p className="text-[11px] text-slate-400 leading-normal">
                  {language === 'bn' 
                    ? 'বাসিন্দাদের পেমেন্ট অনুস্মারক, জরুরি নোটিশ এবং সিকিউরিটি অ্যালার্ট সরাসরি হোয়াটসঅ্যাপ বা মোবাইল এসএমএসের মাধ্যমে পাঠানোর জন্য নিচে আপনার স্থানীয় মোবাইল নম্বর ও হোয়াটসঅ্যাপ গেটওয়ে নম্বর নির্ধারণ করুন।' 
                    : 'Set up your local contact numbers below to route resident payment reminders, emergency notices, and security alert operations.'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* SMS Alert Sender Contact */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block font-mono">
                      {language === 'bn' ? 'এসএমএস অ্যালার্ট প্রেরক নম্বর' : 'SMS Alert Sender Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={smsAlertPhone}
                      onChange={(e) => setSmsAlertPhone(e.target.value)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 font-mono text-white focus:outline-none"
                      placeholder="+88017XXXXXXXX"
                    />
                  </div>

                  {/* WhatsApp Business/Official Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block font-mono">
                      {language === 'bn' ? 'অফিসিয়াল হোয়াটসঅ্যাপ নম্বর' : 'Official WhatsApp Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={whatsappNo}
                      onChange={(e) => setWhatsappNo(e.target.value)}
                      className="block w-full rounded border border-emerald-950 bg-neutral-900 px-3 py-2 font-mono text-white focus:outline-none"
                      placeholder="+88017XXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Save trigger */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 border border-[#D4AF37]/35 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>Save configurations</span>
                </button>
              </div>
            </form>
          ) : (
            /* User Account controls and approvals panel */
            <div className="rounded-xl border border-emerald-950 bg-neutral-950/40 p-5 space-y-4 max-w-4xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-1.5 pb-2 border-b border-emerald-950">
                <Users className="h-4.5 w-4.5 text-emerald-400" />
                {language === 'bn' ? 'সকল রেজিস্টার্ড ইউজার আইডি এবং অনুমোদন সেটিংস' : 'Registered User IDs & Access Authorizations'}
              </h3>

              <div className="overflow-x-auto">
                <div className="min-w-full text-slate-300">
                  <div className="border-b border-emerald-950/50 flex text-[10px] font-mono font-bold uppercase text-slate-500 py-2">
                    <div className="flex-1 text-left min-w-[200px]">User Profile / Flat</div>
                    <div className="w-24 text-left">Role</div>
                    <div className="w-32 text-left">Password Code</div>
                    <div className="w-32 text-left">Status</div>
                    <div className="w-40 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-emerald-950/40">
                    {userAccounts.map((account) => (
                      <div key={account.id} className="flex py-3.5 items-center text-xs">
                        {/* Profile Column */}
                        <div className="flex-1 min-w-[200px] pr-4">
                          <p className="font-bold text-white truncate">{account.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{account.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {account.flatNumber && (
                              <span className="inline-block px-1.5 py-0.5 bg-emerald-950 text-emerald-400 text-[9px] font-bold rounded">
                                Flat {account.flatNumber}
                              </span>
                            )}
                            {account.phone && (
                              <span className="inline-block text-[10px] font-mono text-slate-500 self-center">
                                {account.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Role Column */}
                        <div className="w-24 shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            account.role === 'Admin' ? 'bg-amber-900/35 text-amber-400 border border-amber-950' :
                            account.role === 'Resident' ? 'bg-emerald-900/35 text-emerald-400 border border-emerald-950' :
                            'bg-sky-900/15 text-sky-400 border border-sky-900/40'
                          }`}>
                            {account.role}
                          </span>
                        </div>

                        {/* Plaintext password */}
                        <div className="w-32 shrink-0">
                          {editingPasswordAccountId === account.id ? (
                            <div className="flex items-center gap-1.5 antialiased">
                              <input
                                type="text"
                                value={newPasswordValue}
                                onChange={(e) => setNewPasswordValue(e.target.value)}
                                className="w-16 px-1.5 py-0.5 text-[11px] font-mono border border-emerald-500 rounded bg-neutral-900 text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newPasswordValue.trim()) {
                                    updateUserPassword(account.id, newPasswordValue.trim());
                                    setEditingPasswordAccountId(null);
                                    setNewPasswordValue('');
                                  }
                                }}
                                className="p-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-400 rounded cursor-pointer transition-all"
                                title="Save"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPasswordAccountId(null);
                                  setNewPasswordValue('');
                                }}
                                className="p-1 bg-rose-950 hover:bg-rose-900/60 text-rose-400 rounded cursor-pointer transition-all"
                                title="Cancel"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group">
                              <code className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-amber-500 rounded border border-emerald-950/30">
                                {account.password}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPasswordAccountId(account.id);
                                  setNewPasswordValue(account.password || '');
                                }}
                                className="text-slate-500 hover:text-[#D4AF37] p-1.5 rounded hover:bg-slate-900 transition-all cursor-pointer"
                                title={language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
                              >
                                <Key className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="w-32 shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            account.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' :
                            account.status === 'Pending' ? 'bg-amber-950 text-amber-500 border border-amber-900/30' :
                            'bg-rose-950 text-rose-400 border border-rose-950/30'
                          }`}>
                            ● {account.status === 'Active' ? (language === 'bn' ? 'সক্রিয়' : 'Active') :
                               account.status === 'Pending' ? (language === 'bn' ? 'অপেক্ষমান' : 'Pending Approval') :
                               (language === 'bn' ? 'স্থগিত' : 'Suspended')}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="w-40 shrink-0 flex items-center justify-end gap-1.5">
                          {/* Status triggers */}
                          {account.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => updateUserAccountStatus(account.id, 'Active')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer transition-colors"
                            >
                              {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                            </button>
                          )}
                          {account.status === 'Active' && account.id !== currentUser.uid && (
                            <button
                              type="button"
                              onClick={() => updateUserAccountStatus(account.id, 'Suspended')}
                              className="bg-rose-950 hover:bg-rose-900 text-rose-400 font-extrabold text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition-colors"
                            >
                              {language === 'bn' ? 'স্থগিত' : 'Suspend'}
                            </button>
                          )}
                          {account.status === 'Suspended' && (
                            <button
                              type="button"
                              onClick={() => updateUserAccountStatus(account.id, 'Active')}
                              className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer transition-colors"
                            >
                              {language === 'bn' ? 'সক্রিয়' : 'Activate'}
                            </button>
                          )}

                          {/* Delete Account */}
                          {account.id !== currentUser.uid && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই ইউজার অ্যাকাউন্টটি ডিলিট করতে চান?' : 'Are you sure you want to delete this user ID completely?')) {
                                  deleteUserAccount(account.id);
                                }
                              }}
                              className="text-slate-500 hover:text-rose-500 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {userAccounts.length === 0 && (
                      <div className="text-center text-slate-500 py-6 text-xs font-mono w-full">
                        No registered user accounts found in local database.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
