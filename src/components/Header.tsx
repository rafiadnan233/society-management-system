/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations, getFloorName } from '../utils/translations';
import { 
  Bell, 
  Search, 
  Menu, 
  X, 
  FileText, 
  User, 
  Home, 
  AlertTriangle,
  Volume2,
  Check,
  Trash2,
  Printer,
  Megaphone
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { 
    currentUser, 
    notifications, 
    markNotificationsAsRead, 
    clearNotifications,
    language, 
    setLanguage,
    config,
    flats,
    members,
    complaints,
    setActiveTab,
    notices
  } = useSociety();

  const t = translations[language];

  const [showNotif, setShowNotif] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close drawers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Search everywhere search logic
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: Array<{ id: string, title: string, subtitle: string, type: string, tab: string }> = [];

    // Search residents
    members.forEach(m => {
      if (m.name.toLowerCase().includes(query) || m.phone.includes(query) || m.flatNumber.toLowerCase().includes(query)) {
        results.push({
          id: m.id,
          title: m.name,
          subtitle: `${m.type} • Flat ${m.flatNumber} • ${m.phone}`,
          type: 'Member',
          tab: 'members'
        });
      }
    });

    // Search flats
    flats.forEach(f => {
      if (f.number.toLowerCase().includes(query) || f.ownerName.toLowerCase().includes(query) || (f.renterName && f.renterName.toLowerCase().includes(query))) {
        results.push({
          id: f.id,
          title: `Flat ${f.number}`,
          subtitle: `${getFloorName(f.floor, language)} • SF ${f.squareFeet} • ${f.ownerName}`,
          type: 'Flat',
          tab: 'flats'
        });
      }
    });

    // Search complaints
    complaints.forEach(c => {
      if (c.title.toLowerCase().includes(query) || c.flatNumber.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)) {
        results.push({
          id: c.id,
          title: c.title,
          subtitle: `Flat ${c.flatNumber} • Priority: ${c.priority} • Status: ${c.status}`,
          type: 'Complaint',
          tab: 'complaints'
        });
      }
    });

    return results.slice(0, 7); // Max 7 results
  };

  const searchResults = getSearchResults();

  // Filter active permanent notices (no expiryDate)
  const permanentNotices = notices?.filter(n => n.active && !n.expiryDate) || [];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md print:hidden">


      {/* Permanent Notices Scrolling Marquee Bar */}
      {permanentNotices.length > 0 && (
        <div className="bg-[#051410] border-b border-emerald-900/60 h-12 flex items-center relative z-10 overflow-hidden shadow-inner select-none transition-all duration-300">
          {/* Static Title/Badge Pin */}
          <div className="absolute left-0 top-0 bottom-0 px-4 bg-emerald-950/95 border-r border-emerald-900 flex items-center gap-1.5 shadow-[2px_0_5px_rgba(0,0,0,0.5)] z-20 shrink-0">
            <Megaphone className="h-4 w-4 text-[#D4AF37] shrink-0" />
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-sans">
              {language === 'bn' ? 'স্থায়ী নোটিশ' : 'Notice Ticker'}
            </span>
          </div>
          
          {/* Overflow Frame with left padding preventing overlap */}
          <div className="w-full pl-36 flex items-center overflow-hidden">
            <div className="animate-marquee-scroll inline-block whitespace-nowrap text-[20px] font-bold py-1 tracking-wide">
              {permanentNotices.map((notice, index) => (
                <span key={notice.id} className="inline-flex items-center text-slate-200 transition-colors hover:text-white">
                  <span 
                    onClick={() => setActiveTab('notices')}
                    className="font-extrabold text-[#D4AF37] hover:underline hover:text-amber-300 cursor-pointer select-none font-sans"
                  >
                    {notice.title}:
                  </span>
                  <span className="ml-3 pr-1 font-sans">{notice.content}</span>
                  {index < permanentNotices.length - 1 && (
                    <span className="mx-10 text-emerald-800 font-extrabold select-none hover:text-emerald-500 font-sans">✦✦✦</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Mobile Menu Toggle / Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                {currentUser?.role === 'Admin' ? 'EXECUTIVE SUITE' : 'RESIDENT PORTAL'}
              </span>
              <span className="text-slate-400 font-mono text-xs">/</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 font-mono">
                {config.name}
              </span>
            </div>
          </div>
        </div>

        {/* Search Everywhere & Notif icons */}
        <div className="flex flex-1 justify-end items-center gap-4">
          
          {/* Search Bar Container */}
          <div ref={searchRef} className="relative w-full max-w-xs md:max-w-sm hidden md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-emerald-600" />
            </div>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full rounded-full border border-slate-250 bg-slate-100 py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />

            {/* Global Search Result Dropdown Overlay */}
            {showSearchResults && searchQuery.trim() !== '' && (
              <div className="absolute right-0 mt-2 w-full min-w-[300px] max-w-md rounded-lg border border-slate-200 bg-white p-2 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500 font-mono">
                  <span>SEARCH RESULTS ({searchResults.length})</span>
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-slate-850">
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto py-1">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-4 text-center text-xs text-slate-400">
                      No matches found for "{searchQuery}"
                    </div>
                  ) : (
                    searchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(res.tab);
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="flex w-full flex-col text-left rounded px-3 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">{res.title}</span>
                          <span className="rounded bg-emerald-50 border border-emerald-250 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 font-mono">
                            {res.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-550 mt-1">{res.subtitle}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 hidden sm:flex">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${language === 'en' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${language === 'bn' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}
            >
              BN
            </button>
          </div>

          {/* Real-time Notifications Bell */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotif(!showNotif);
                if (!showNotif) {
                  // Wait brief moment and read notifications
                  markNotificationsAsRead();
                }
              }}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-610 text-[9px] font-bold text-white ring-1 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Panel Box */}
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                      Notifications
                    </h3>
                    <span className="text-[10px] text-emerald-700 font-bold">({notifications.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={markNotificationsAsRead}
                      title="Mark all read"
                      className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-emerald-750"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={clearNotifications}
                      title="Clear database"
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-400 font-mono">
                      No recent notifications
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      let Icon = FileText;
                      let iconColor = 'text-blue-500 bg-blue-50';
                      if (notif.type === 'Notice') { Icon = Volume2; iconColor = 'text-amber-600 bg-amber-50'; }
                      else if (notif.type === 'Payment') { Icon = Home; iconColor = 'text-emerald-600 bg-emerald-50'; }
                      else if (notif.type === 'Complaint') { Icon = AlertTriangle; iconColor = 'text-rose-650 bg-rose-50'; }
                      else if (notif.type === 'Visitor') { Icon = User; iconColor = 'text-purple-600 bg-purple-50'; }

                      return (
                        <div 
                          key={notif.id} 
                          className={`p-3.5 hover:bg-slate-50/60 transition-colors ${!notif.isRead ? 'bg-emerald-50/20' : ''}`}
                        >
                          <div className="flex gap-2.5">
                            <div className={`mt-0.5 rounded-full p-1 border border-slate-100 shrink-0 ${iconColor}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{notif.title}</p>
                              <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed break-words">{notif.message}</p>
                              <p className="text-[8px] text-slate-400 font-mono mt-1">
                                {new Date(notif.date).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* User Profile Info Badge (Mobile + Desktop fallback icon helper) */}
          <button 
            type="button"
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-1.5 border border-slate-200 rounded-full px-2 py-1 bg-slate-50 hover:border-emerald-500 transition-all cursor-pointer"
          >
            <div className="h-6 w-6 rounded-full bg-emerald-700 border border-emerald-600 text-[11px] font-bold text-white flex items-center justify-center">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 tracking-wider hidden sm:inline uppercase">
              {currentUser?.role === 'Admin' ? 'ADMIN' : 'MEMBER'}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
