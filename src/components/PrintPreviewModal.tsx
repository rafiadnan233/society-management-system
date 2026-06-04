/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { X, Download, FileText, Printer, Loader2, Info, RefreshCw } from 'lucide-react';
import { 
  sanitizeAllInlineStyles, 
  sanitizeExistingStyleSheets, 
  replaceOklchBlocks 
} from '../utils/oklchPatch';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nativePrintRef: React.MutableRefObject<() => void>;
}

export default function PrintPreviewModal({ isOpen, onClose, nativePrintRef }: PrintPreviewModalProps) {
  const { 
    language, 
    activeTab, 
    config,
    members,
    flats,
    payments,
    expenses,
    notices,
    visitors,
    complaints,
    staff
  } = useSociety();
  
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isInvoice, setIsInvoice] = useState(false);

  const preSanitizeDocument = async () => {
    try {
      // 1. Sanitize style blocks & sheets recursively
      sanitizeExistingStyleSheets();

      // 2. Scan same-origin stylesheet links and replace them with parsed styles
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      for (const link of Array.from(links)) {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
          try {
            const res = await fetch(href);
            let cssText = await res.text();
            if (cssText.includes('oklch') || cssText.includes('oklab')) {
              cssText = replaceOklchBlocks(cssText);
              const styleEl = document.createElement('style');
              styleEl.textContent = cssText;
              styleEl.setAttribute('data-replaced-link', href);
              link.parentNode?.replaceChild(styleEl, link);
            }
          } catch (err) {
            console.warn('Could not automatically pre-sanitize link stylesheet:', href, err);
          }
        }
      }
    } catch (globalErr) {
      console.error('Pre-sanitize global failure:', globalErr);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsRenderingPreview(true);
      preSanitizeDocument().then(() => {
        generateThumbnail();
      });
    } else {
      setPreviewImg(null);
      setPreviewError(null);
    }
  }, [isOpen, activeTab]);

  const generateThumbnail = async () => {
    setIsRenderingPreview(true);
    setPreviewError(null);
    
    // Give layout a brief moment to stabilize
    await new Promise(resolve => setTimeout(resolve, 350));
    
    let element = document.getElementById('printable-receipt');
    if (element) {
      setIsInvoice(true);
    } else {
      setIsInvoice(false);
      element = document.getElementById('dynamic-print-report');
      if (!element) {
        element = document.getElementById('main-content-area');
      }
    }
    
    if (!element) {
      setPreviewError(
        language === 'bn' 
          ? 'প্রিন্ট করার মতন যোগ্য কোনো কন্টেন্ট খুঁজে পাওয়া যায়নি। অনুগ্রহ করে পেইজটি লোড হওয়া পর্যন্ত অপেক্ষা করুন।' 
          : 'Could not find readable print boundaries on this page yet.'
      );
      setIsRenderingPreview(false);
      return;
    }

    try {
      // Deep sanitize inline style definitions for children
      sanitizeAllInlineStyles(element);

      // Temporarily hide interactive and non-printable elements
      const printHiddenElements = element.querySelectorAll('.print\\:hidden, button[type="button"], select, input[type="file"]');
      const hiddenBackup: Array<{ el: HTMLElement; display: string }> = [];
      
      printHiddenElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        hiddenBackup.push({ el: htmlEl, display: htmlEl.style.display });
        htmlEl.style.display = 'none';
      });

      // Quick capture for thumbnail. Using 1.3 scale is lightweight yet perfectly legible
      const canvas = await html2canvas(element, {
        scale: 1.3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // render preview cleanly on flat white paper
      });

      // Restore hidden elements back to interactive
      hiddenBackup.forEach(({ el, display }) => {
        el.style.display = display;
      });

      const imgData = canvas.toDataURL('image/png');
      setPreviewImg(imgData);
    } catch (err: any) {
      console.error('Failed to generate preview snapshot:', err);
      setPreviewError(err?.message || 'Error occurred while saving current document viewport.');
    } finally {
      setIsRenderingPreview(false);
    }
  };

  const handleDownloadPDF = async () => {
    let element = document.getElementById('printable-receipt');
    if (!element) {
      element = document.getElementById('dynamic-print-report');
    }
    if (!element) {
      element = document.getElementById('main-content-area');
    }
    if (!element) return;

    try {
      setIsGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 100)); // allow state lock render

      // Prepare DOM child nodes
      sanitizeAllInlineStyles(element);

      // Intercept and clear interactive actions
      const printHiddenElements = element.querySelectorAll('.print\\:hidden, button[type="button"], select, input[type="file"]');
      const hiddenBackup: Array<{ el: HTMLElement; display: string }> = [];
      printHiddenElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        hiddenBackup.push({ el: htmlEl, display: htmlEl.style.display });
        htmlEl.style.display = 'none';
      });

      // Capture at scale 2.0. This guarantees incredibly sharp vector font representation in PDF
      const canvas = await html2canvas(element, {
        scale: 2.0,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Restore elements
      hiddenBackup.forEach(({ el, display }) => {
        el.style.display = display;
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Page compilation layout configurations
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 12; // clean page margins
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      let heightLeft = contentHeight;
      let position = margin;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - (margin * 2));
      
      // Process trailing pages if text/table overflowing
      while (heightLeft > 0) {
        position = margin - (contentHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - (margin * 2));
      }

      const viewLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      const cleanFileName = `Astha-${viewLabel}-${new Date().toISOString().split('T')[0]}`;
      pdf.save(`${cleanFileName}.pdf`);
    } catch (err) {
      console.error('Failed to compile PDF statement document:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPNG = async () => {
    let element = document.getElementById('printable-receipt');
    if (!element) {
      element = document.getElementById('dynamic-print-report');
    }
    if (!element) {
      element = document.getElementById('main-content-area');
    }
    if (!element) return;

    try {
      setIsGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 80));

      // Prepare inline styles
      sanitizeAllInlineStyles(element);

      const printHiddenElements = element.querySelectorAll('.print\\:hidden, button[type="button"], select, input[type="file"]');
      const hiddenBackup: Array<{ el: HTMLElement; display: string }> = [];
      printHiddenElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        hiddenBackup.push({ el: htmlEl, display: htmlEl.style.display });
        htmlEl.style.display = 'none';
      });

      // Captures full container layout
      const canvas = await html2canvas(element, {
        scale: 2.0,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      hiddenBackup.forEach(({ el, display }) => {
        el.style.display = display;
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const viewLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      
      link.download = `Astha-${viewLabel}-Export.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error('Failed to capture snapshot image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderDynamicReport = () => {
    const formattedDate = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let titleEn = 'SOCIETY CLASSIFIED LEDGER';
    let titleBn = 'সোসাইটি অফিসিয়াল খতিয়ান রিপোর্ট';
    let tableHeader = null;
    let tableRows = null;
    let summaryStats = null;

    if (activeTab === 'members') {
      titleEn = 'OFFICIAL RESIDENTS & ASSOC MEMBERS DIRECTORY';
      titleBn = 'নিবন্ধিত ফ্ল্যাট মালিক ও বাসিন্দাদের তালিকা খতিয়ান';
      
      const totalOwners = members.filter(m => m.type === 'Owner').length;
      const totalTenants = members.filter(m => m.type === 'Tenant').length;

      summaryStats = (
        <div className="grid grid-cols-3 gap-4 mb-6 text-black" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট বাসিন্দা' : 'TOTAL RESIDENTS'}</span>
            <span className="text-base font-bold text-slate-900">{members.length}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'ফ্ল্যাট মালিক' : 'OWNERS'}</span>
            <span className="text-base font-bold text-slate-900">{totalOwners}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'ভাড়াটিয়া' : 'TENANTS'}</span>
            <span className="text-base font-bold text-slate-900">{totalTenants}</span>
          </div>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold text-center">#</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'ছবি' : 'PHOTO'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'ফ্ল্যাট' : 'FLAT'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'বাসিন্দার নাম' : 'MEMBER NAME'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'মোবাইল' : 'PHONE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'প্রকার' : 'TYPE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'জাতীয় পরিচয়পত্র' : 'NID'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'অবস্থা' : 'STATUS'}</th>
        </tr>
      );

      tableRows = members.map((m, idx) => (
        <tr key={m.id} className="text-xs text-slate-900 border-b border-dashed border-slate-200">
          <td className="p-2 border-slate-200 text-center font-mono">{idx + 1}</td>
          <td className="p-2 border-slate-200">
            <div className="h-10 w-10 shrink-0 rounded border border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden">
              {m.photoUrl ? (
                <img 
                  src={m.photoUrl} 
                  alt={m.name} 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="text-slate-400 text-[10px] font-bold font-mono text-center">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </td>
          <td className="p-2 border-slate-200 font-bold text-emerald-800">{m.flatNumber}</td>
          <td className="p-2 border-slate-200 font-bold">{m.name}</td>
          <td className="p-2 border-slate-200 font-mono">{m.phone}</td>
          <td className="p-2 border-slate-200">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.type === 'Owner' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {m.type === 'Owner' ? (language === 'bn' ? 'মালিক' : 'Owner') : (language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant')}
            </span>
          </td>
          <td className="p-2 border-slate-200 font-mono text-slate-600">{m.nid}</td>
          <td className="p-2 border-slate-200">
            <span className="text-emerald-700 font-extrabold">● {m.status}</span>
          </td>
        </tr>
      ));
    } else if (activeTab === 'flats') {
      titleEn = 'SOCIETY REAL ESTATE DIRECTORY & OCCUPANCY AUDIT';
      titleBn = 'আবাসন ইউনিট ও ফ্ল্যাট প্রোফাইল তালিকা খতিয়ান';

      const occupied = flats.filter(f => f.status === 'occupied_owner' || f.status === 'occupied_tenant').length;
      const vacant = flats.filter(f => f.status === 'vacant').length;
      const maintenancePaidCount = flats.filter(f => f.maintenanceStatus === 'Paid').length;

      summaryStats = (
        <div className="grid grid-cols-4 gap-4 mb-6 text-black animate-none" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট ফ্ল্যাট' : 'TOTAL UNITS'}</span>
            <span className="text-base font-bold text-slate-900">{flats.length}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'বসবাসরত' : 'OCCUPIED'}</span>
            <span className="text-base font-bold text-emerald-700">{occupied}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'ফাঁকা ফ্ল্যাট' : 'VACANT'}</span>
            <span className="text-base font-bold text-amber-700">{vacant}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মেইনটেন্যান্স পেইড' : 'MAINTENANCE PAID'}</span>
            <span className="text-base font-bold text-slate-900">{maintenancePaidCount} / {flats.length}</span>
          </div>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'ফ্ল্যাট নং' : 'FLAT NO'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'তলা' : 'FLOOR'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'আকার' : 'SIZE (SQFT)'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'অবস্থা' : 'STATUS'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'বাসিন্দার নাম' : 'OCCUPANT'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'যোগাযোগ' : 'CONTACT'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'বিল স্ট্যান্ডিং' : 'BILL STANDING'}</th>
        </tr>
      );

      tableRows = flats.map((f) => {
        const occupant = f.status === 'occupied_owner' ? f.ownerName : (f.status === 'occupied_tenant' ? f.renterName : 'Vacant (ফাঁকা)');
        return (
          <tr key={f.id} className="text-xs text-slate-900 border-b border-dashed border-slate-200">
            <td className="p-2 font-bold text-emerald-800">{f.number}</td>
            <td className="p-2 font-mono text-slate-600">{f.floor}</td>
            <td className="p-2 font-mono text-slate-600">{f.squareFeet} Sq Ft</td>
            <td className="p-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                f.status === 'vacant' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {f.status.replace('_', ' ').toUpperCase()}
              </span>
            </td>
            <td className="p-2 font-bold">{occupant}</td>
            <td className="p-2 font-mono text-slate-600">{f.phone || 'N/A'}</td>
            <td className="p-2">
              <span className={`font-bold ${
                f.maintenanceStatus === 'Paid' ? 'text-emerald-700' :
                f.maintenanceStatus === 'Due' ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {f.maintenanceStatus}
              </span>
            </td>
          </tr>
        );
      });
    } else if (activeTab === 'payments') {
      titleEn = 'COLLECTIONS & REVENUE BALANCE STANDING REPORT';
      titleBn = 'সার্বিক কালেকশন ও অপরিশোধিত বকেয়া বিল লেজার খতিয়ান';

      const totalInvoiced = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const totalCollected = payments.reduce((s, p) => s + (p.paidAmount || 0), 0);
      const totalDues = payments.reduce((s, p) => s + (p.dueAmount || 0), 0);

      summaryStats = (
        <div className="grid grid-cols-3 gap-4 mb-6 text-black animate-none" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট দাখিলকৃত বিল' : 'TOTAL INVOICED'}</span>
            <span className="text-base font-bold text-slate-900">৳{totalInvoiced.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট আদায়কৃত টাকা' : 'TOTAL COLLECTED'}</span>
            <span className="text-base font-bold text-emerald-600">৳{totalCollected.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট বকেয়া' : 'TOTAL DUED OUTSTANDING'}</span>
            <span className="text-base font-bold text-rose-600">৳{totalDues.toLocaleString()}</span>
          </div>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'মাস' : 'MONTH'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'ফ্ল্যাট' : 'FLAT'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'বিল বিবরণী' : 'BILL TITLE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'বাসিন্দা' : 'RESIDENT'}</th>
          <th className="p-2 border-b border-slate-350 text-right font-bold">{language === 'bn' ? 'মোট বিল' : 'TOTAL'}</th>
          <th className="p-2 border-b border-slate-350 text-right font-bold">{language === 'bn' ? 'পরিশোধ' : 'PAID'}</th>
          <th className="p-2 border-b border-slate-350 text-right font-bold">{language === 'bn' ? 'বকেয়া' : 'DUE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'অবস্থা' : 'STATUS'}</th>
        </tr>
      );

      tableRows = payments.map((p) => (
        <tr key={p.id} className="text-xs text-slate-900 border-b border-dashed border-slate-200">
          <td className="p-2 font-mono text-slate-600">{p.billingMonth}</td>
          <td className="p-2 font-bold text-emerald-800">{p.flatNumber}</td>
          <td className="p-2 text-slate-800 font-semibold">{p.title}</td>
          <td className="p-2 text-slate-705">{p.memberName}</td>
          <td className="p-2 text-right font-mono text-slate-900">৳{p.amount.toLocaleString()}</td>
          <td className="p-2 text-right font-mono text-emerald-600">৳{p.paidAmount.toLocaleString()}</td>
          <td className="p-2 text-right font-mono text-rose-600">৳{p.dueAmount.toLocaleString()}</td>
          <td className="p-2">
            <span className={`px-1 rounded text-[9px] font-black ${
              p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {p.status}
            </span>
          </td>
        </tr>
      ));
    } else if (activeTab === 'expenses') {
      titleEn = 'DEBITS TRANSFERRED & EXPENSE LEDGER AUDIT';
      titleBn = 'সোসাইটি মেইনটেন্যান্স ও সার্ভিস সংক্রান্ত ব্যয় বিবরণী';

      const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);

      summaryStats = (
        <div className="grid grid-cols-2 gap-4 mb-6 text-black animate-none" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'ভাউচার সংখ্যা' : 'RECEIPTS COUNTED'}</span>
            <span className="text-base font-bold text-slate-900">{expenses.length} Receipts</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট পরিশোধিত ব্যয়' : 'TOTAL OUTFLOW DEBITS'}</span>
            <span className="text-base font-bold text-rose-600">৳{totalSpent.toLocaleString()}</span>
          </div>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'তারিখ' : 'DATE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'ব্যয় খাত' : 'CATEGORY'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'ব্যয় শিরোনাম' : 'EXPENSE DESCRIPTION'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'রশিদ নম্বর' : 'SLIP/RECEIPT'}</th>
          <th className="p-2 border-b border-slate-350 text-right font-bold">{language === 'bn' ? 'টাকার পরিমাণ' : 'DEBIT BDT'}</th>
        </tr>
      );

      tableRows = expenses.map((e) => (
        <tr key={e.id} className="text-xs text-slate-900 border-b border-dashed border-slate-200">
          <td className="p-2 font-mono text-slate-600">{e.date}</td>
          <td className="p-2 font-bold text-slate-800">{e.category.replace('_',' ')}</td>
          <td className="p-2 font-semibold text-slate-700">{e.title}</td>
          <td className="p-2 font-mono text-slate-400">{e.receiptNo || 'N/A'}</td>
          <td className="p-2 text-right font-mono font-bold text-[#b45309]">৳{e.amount.toLocaleString()}</td>
        </tr>
      ));
    } else if (activeTab === 'notices') {
      titleEn = 'OFFICIAL SOCIETY CIRCULARS & NOTIFICATIONS';
      titleBn = 'জারি করা অফিসিয়াল সার্কুলার ও নোটিশের বিবরণী';

      summaryStats = (
        <div className="bg-slate-100 border border-slate-200 p-2.5 rounded mb-6 text-xs text-slate-700 font-mono flex justify-between items-center">
          <span>{language === 'bn' ? 'মোট বিজ্ঞপ্তি সংখ্যা' : 'TOTAL REGISTERED BOARD NOTICES'}</span>
          <span className="font-bold text-slate-900">{notices.length} Bullets</span>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold w-28">{language === 'bn' ? 'তারিখ' : 'DATE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold w-24">{language === 'bn' ? 'ধরণ' : 'TYPE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold w-48">{language === 'bn' ? 'বিজ্ঞপ্তি শিরোনাম' : 'NOTICE TITLE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'বিস্তারিত বিজ্ঞপ্তি বিবরণী' : 'FULL NOTICE DETAILED DICTATION'}</th>
        </tr>
      );

      tableRows = notices.map((n) => (
        <tr key={n.id} className="text-xs text-slate-900 border-b border-dashed border-slate-200">
          <td className="p-2 font-mono text-slate-600">{n.date}</td>
          <td className="p-2">
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
              n.type === 'Emergency' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-700'
            }`}>
              {n.type}
            </span>
          </td>
          <td className="p-2 font-bold text-slate-900">{n.title}</td>
          <td className="p-2 text-slate-650 leading-relaxed font-sans">{n.content}</td>
        </tr>
      ));
    } else if (activeTab === 'complaints') {
      titleEn = 'SECURITY COMPLAINTS & GRIEVANCE REGISTRY';
      titleBn = 'সম্মানিত বাসিন্দাদের দাখিলকৃত অভিযোগ ও রেজোলিউশন খতিয়ান';

      const pending = complaints.filter(c => c.status === 'Pending').length;
      const progressing = complaints.filter(c => c.status === 'In-Progress').length;
      const resolved = complaints.filter(c => c.status === 'Resolved').length;

      summaryStats = (
        <div className="grid grid-cols-4 gap-4 mb-6 text-center text-black font-mono" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <div className="bg-slate-50 border border-slate-200 p-2 rounded">
            <span className="block text-[8px] text-slate-500 uppercase">{language === 'bn' ? 'মোট অভিযোগ' : 'TOTAL'}</span>
            <span className="text-xs font-black">{complaints.length}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2 rounded">
            <span className="block text-[8px] text-red-500 uppercase">{language === 'bn' ? 'অমীমাংসিত' : 'PENDING'}</span>
            <span className="text-xs font-black text-rose-700">{pending}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2 rounded">
            <span className="block text-[8px] text-amber-500 uppercase">{language === 'bn' ? 'চলমান' : 'PROGRESS'}</span>
            <span className="text-xs font-black text-amber-700">{progressing}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2 rounded">
            <span className="block text-[8px] text-emerald-500 uppercase">{language === 'bn' ? 'মিমাংসিত' : 'RESOLVED'}</span>
            <span className="text-xs font-black text-emerald-700">{resolved}</span>
          </div>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'তারিখ' : 'DATE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'ফ্ল্যাট' : 'FLAT'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'ক্যাটাগরি' : 'CATEGORY'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'অভিযোগ বিবরণ' : 'GRIEVANCE STATEMENT'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'অগ্রাধিকার' : 'PRIORITY'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'অবস্থা' : 'STATUS'}</th>
        </tr>
      );

      tableRows = complaints.map((c) => (
        <tr key={c.id} className="text-xs text-slate-900 border-b border-dashed border-slate-200">
          <td className="p-2 font-mono text-slate-600">{c.date}</td>
          <td className="p-2 font-bold text-emerald-800">{c.flatNumber}</td>
          <td className="p-2 font-bold text-slate-800">{c.category.replace('_',' ')}</td>
          <td className="p-2 text-slate-750">
            <div className="font-bold text-slate-950">{c.title}</div>
            <div className="text-[10px] text-slate-500">{c.description}</div>
          </td>
          <td className="p-2">
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
              c.priority === 'Emergency' || c.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {c.priority}
            </span>
          </td>
          <td className="p-2">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {c.status}
            </span>
          </td>
        </tr>
      ));
    } else if (activeTab === 'visitors') {
      titleEn = 'ACCESS CONTROL ENTRY LOGGER & VISITOR AUDIT';
      titleBn = 'নিরাপত্তা ফটক দর্শনার্থী গেস্ট খতিয়ান ও ট্র্যাকিং রেজিস্টার';

      const insideCount = visitors.filter(v => v.status === 'Inside').length;

      summaryStats = (
        <div className="grid grid-cols-2 gap-4 mb-6 text-center text-black" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট দর্শনার্থী এন্ট্রি' : 'TOTAL GUEST ENTRANCES'}</span>
            <span className="text-base font-bold text-slate-900">{visitors.length} Logs</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded">
            <span className="block text-[10px] text-emerald-600 uppercase font-mono tracking-wider">{language === 'bn' ? 'বর্তমানে অবস্থানে আছেন' : 'CURRENTLY INSIDE'}</span>
            <span className="text-base font-black text-emerald-650">{insideCount} Guests inside</span>
          </div>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'প্রবেশের সময়' : 'IN-TIME'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'দর্শনপ্রার্থী নাম' : 'GUEST VISITOR NAME'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'গন্তব্য ফ্ল্যাট' : 'FLAT'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'মোবাইল' : 'PHONE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'উদ্দেশ্য' : 'PURPOSE OUTLINE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'অবস্থা / প্রস্থান সময়' : 'STATUS / EXIT TIME'}</th>
        </tr>
      );

      tableRows = visitors.map((v) => (
        <tr key={v.id} className="text-xs text-slate-905 border-b border-dashed border-slate-200">
          <td className="p-2 font-mono text-slate-600">{new Date(v.entryTime).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {hour: '2-digit', minute: '2-digit'})}</td>
          <td className="p-2 font-bold">{v.name} <span className="text-slate-400 font-mono font-medium text-[9px]">({v.numVisitors} Pax)</span></td>
          <td className="p-2 font-black text-emerald-800">{v.flatNumber}</td>
          <td className="p-2 font-mono">{v.phone}</td>
          <td className="p-2 text-slate-650">{v.purpose}</td>
          <td className="p-2 font-semibold">
            {v.status === 'Inside' ? (
              <span className="text-red-700">● {language === 'bn' ? 'গেইট ভেতরে আছেন' : 'Currently Inside'}</span>
            ) : (
              <span className="text-slate-500">{language === 'bn' ? 'বের হয়ে গেছেন' : 'Checked Out'} ({v.exitTime ? new Date(v.exitTime).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {hour:'2-digit', minute:'2-digit'}) : ''})</span>
            )}
          </td>
        </tr>
      ));
    } else if (activeTab === 'staff') {
      titleEn = 'SOCIETY AUTHORIZED STAFF & ATTENDANCE AUDIT';
      titleBn = 'সোসাইটি অফিসিয়াল কর্মকর্তা ও কর্মচারীদের তালিকা খতিয়ান';

      const payrollBudget = staff.reduce((s, st) => s + (st.salary || 0), 0);

      summaryStats = (
        <div className="grid grid-cols-2 gap-4 mb-6 text-center text-black" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'মোট নিবন্ধিত স্টাফ' : 'TOTAL STAFF ENROLLED'}</span>
            <span className="text-base font-bold text-slate-900">{staff.length} Security & Services</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded">
            <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">{language === 'bn' ? 'বেতন বাজেট' : 'MONTHLY PAYROLL DEBITS'}</span>
            <span className="text-base font-bold text-emerald-700">৳{payrollBudget.toLocaleString()}</span>
          </div>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'কর্মচারীর নাম' : 'EMPLOYEE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'নিযুক্ত পদবী' : 'ROLE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'মোবাইল' : 'PHONE'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'জাতীয় পরিচয়পত্র' : 'NID'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'যোগদান' : 'HIRE DATE'}</th>
          <th className="p-2 border-b border-slate-350 text-right font-bold">{language === 'bn' ? 'নির্ধারিত বেতন' : 'SALARY'}</th>
          <th className="p-2 border-b border-slate-350 font-bold">{language === 'bn' ? 'অবস্থা' : 'STATUS'}</th>
        </tr>
      );

      tableRows = staff.map((st) => (
        <tr key={st.id} className="text-xs text-slate-900 border-b border-dashed border-slate-200">
          <td className="p-2 font-bold text-slate-900">{st.name}</td>
          <td className="p-2 font-semibold text-slate-800">{st.role.replace('_',' ')}</td>
          <td className="p-2 font-mono text-slate-600">{st.phone}</td>
          <td className="p-2 font-mono text-slate-500">{st.nid}</td>
          <td className="p-2 font-mono text-slate-500">{st.joinDate}</td>
          <td className="p-2 text-right font-mono font-bold text-emerald-700">৳{st.salary.toLocaleString()}</td>
          <td className="p-2 text-emerald-600 font-bold">● {st.status}</td>
        </tr>
      ));
    } else {
      titleEn = 'EXECUTIVE MANAGEMENT SUMMARY REPORT';
      titleBn = 'ব্যবস্থাপনা ও সার্বিক অবস্থা পর্যালোচনা খতিয়ান';

      const totalRes = members.length;
      const totalUnits = flats.length;
      const totalNotices = notices.length;
      const openGrievances = complaints.filter(c => c.status !== 'Resolved').length;

      summaryStats = (
        <div className="grid grid-cols-4 gap-2.5 mb-6 text-center text-black" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <div className="bg-slate-50 border border-slate-200 p-2 rounded">
            <span className="block text-[8px] text-slate-500 uppercase font-mono">{language === 'bn' ? ' বাসিন্দা' : 'RESIDENTS'}</span>
            <span className="text-xs font-black">{totalRes}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2 rounded">
            <span className="block text-[8px] text-slate-500 uppercase font-mono">{language === 'bn' ? ' ইউনিট' : 'FLATS'}</span>
            <span className="text-xs font-black">{totalUnits}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2 rounded">
            <span className="block text-[8px] text-slate-500 uppercase font-mono">{language === 'bn' ? ' বিজ্ঞপ্তি' : 'NOTICES'}</span>
            <span className="text-xs font-black">{totalNotices}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2 rounded">
            <span className="block text-[8px] text-slate-500 uppercase font-mono">{language === 'bn' ? ' অমীমাংসিত অভিযোগ' : 'GRIEVANCES'}</span>
            <span className="text-xs font-black text-rose-700">{openGrievances}</span>
          </div>
        </div>
      );

      tableHeader = (
        <tr className="bg-slate-100 text-slate-700 text-left text-xs uppercase font-mono">
          <th className="p-2 border-b border-slate-350 font-bold">Society Parameter</th>
          <th className="p-2 border-b border-slate-350 font-bold">Current System Valuation</th>
        </tr>
      );

      tableRows = [
        { key: 'Official Building Name', val: config.name },
        { key: 'Registered Location Address', val: config.address },
        { key: 'Audit Reference Number', val: `AST-REF-VAL-0${Date.now().toString().substring(8)}` },
        { key: 'Primary Helpline Contact', val: config.contactNo },
        { key: 'Auditor Official Contact Email', val: config.email },
        { key: 'Default Monthly Service Charge', val: `৳${config.bdtMaintenanceFee.toLocaleString()}` }
      ].map((item, index) => (
        <tr key={index} className="text-xs text-slate-900 border-b border-dashed border-slate-200">
          <td className="p-2.5 font-bold font-sans text-slate-700">{item.key}</td>
          <td className="p-2.5 font-mono font-bold text-slate-950">{item.val}</td>
        </tr>
      ));
    }

    return (
      <div className="flex flex-col justify-between h-full bg-white text-black p-10 font-sans" style={{ minHeight: '1130px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div>
          {/* Letterhead Top Logo / Name Area */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5 flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgb(15 23 42)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase font-sans m-0">{config.name}</h1>
              <p className="text-xs text-slate-500 font-sans tracking-wide mt-1 m-0">{config.address}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 m-0">Phone: {config.contactNo} | Email: {config.email}</p>
            </div>
            
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-sans border border-slate-900 px-3 py-1 bg-slate-50 inline-block font-mono">
                {language === 'bn' ? 'অফিসিয়াল খতিয়ান রিপোর্ট' : 'OFFICIAL STATEMENT'}
              </div>
              <p className="text-[9px] text-slate-400 font-mono mt-1 m-0">GEN-REF: AST-{activeTab.toUpperCase()}-AUDIT</p>
            </div>
          </div>

          {/* Audit Verification Log Sheet */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2 text-[10px] font-mono text-slate-550 mb-6 flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem', marginBottom: '1.5rem' }}>
            <div>
              <span className="font-bold text-slate-800">DOCUMENT FOCUS:</span> {language === 'bn' ? titleBn : titleEn}
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800">AUDIT DATE:</span> {formattedDate}
            </div>
          </div>

          {/* Render Stats quick bar dynamically */}
          {summaryStats}

          {/* Record table */}
          <div className="overflow-x-auto border border-slate-350 rounded mb-8" style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflowX: 'auto', marginBottom: '2rem' }}>
            <table className="w-full text-left border-collapse bg-white m-0" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
              <thead>{tableHeader}</thead>
              <tbody className="divide-y divide-slate-200 text-slate-900">{tableRows}</tbody>
            </table>
          </div>

          {/* Technical Verification Signature Statement Block */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded leading-loose text-[9px] font-mono text-slate-550 mb-8" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.75rem', marginBottom: '2rem', fontSize: '9px', lineHeight: '1.35' }}>
            <span className="font-bold text-slate-800 uppercase">SYSTEM COMPLIANCE IDENTIFICATION:</span> This document statement has been compiled and secured via the official digital automation engine under direct approval of the {config.name} executive committee board. Under global digital audit compliance rules, this computer-generated document ledger does not require physical wax insignia. Any manual alteration or hand-scribbled values completely nullifies system legitimacy.
          </div>
        </div>

        {/* Dynamic official authorization committee board signature logs */}
        <div className="flex justify-between items-end pt-12 text-[10px] font-mono text-slate-500 border-t border-slate-200 flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '3rem', borderTop: '1px solid #e2e8f0' }}>
          <div className="text-center w-36" style={{ textAlign: 'center', width: '9rem' }}>
            <div className="border-b border-slate-400 pb-1 mb-1.5" style={{ borderBottom: '1px solid #94a3b8', paddingBottom: '0.25rem', marginBottom: '0.375rem' }} />
            <span className="font-semibold uppercase text-slate-700 block">{language === 'bn' ? 'হিসাব রক্ষক জেনারেল' : 'COMMITTEE TREASURER'}</span>
            <span className="block text-[8px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">{config.name}</span>
          </div>
          
          <div className="text-center w-40" style={{ textAlign: 'center', width: '10rem' }}>
            <span className="block italic text-[8 ppx] text-slate-400 pb-2 mb-1" style={{ fontSize: '8px', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>OFFICIAL VERIFIED LEDGER STATS</span>
            <div className="border-b-2 border-slate-900 pb-1 mb-1.5" style={{ borderBottom: '3px double rgb(15 23 42)', paddingBottom: '0.25rem', marginBottom: '0.375rem' }} />
            <span className="font-bold uppercase text-slate-800 bg-slate-50 px-2.5 py-0.5 border border-slate-300 inline-block text-[9px]">{language === 'bn' ? 'সাধারণ সম্পাদক' : 'GENERAL SECRETARY'}</span>
          </div>
          
          <div className="text-center w-36" style={{ textAlign: 'center', width: '9rem' }}>
            <div className="border-b border-slate-400 pb-1 mb-1.5" style={{ borderBottom: '1px solid #94a3b8', paddingBottom: '0.25rem', marginBottom: '0.375rem' }} />
            <span className="font-semibold uppercase text-slate-700 block">{language === 'bn' ? 'সোসাইটি সভাপতি অনুমোদন' : 'SOCIETY PRESIDENT'}</span>
            <span className="block text-[8px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">{config.name}</span>
          </div>
        </div>
      </div>
    );
  };

  const handleTriggerNativePrinterFallback = () => {
    onClose();
    setTimeout(() => {
      if (nativePrintRef.current) {
        nativePrintRef.current();
      }
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#0c0a09] border border-emerald-950/60 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header toolbar */}
        <div className="flex h-14 items-center justify-between border-b border-emerald-950/50 bg-neutral-950 px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-emerald-700/20 border border-emerald-600/40 flex items-center justify-center">
              <Printer className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                {language === 'bn' ? 'প্রিন্ট ও পিডিএফ ডকুমেন্ট সেন্টার' : 'PDF Document & Print Centre'}
              </h2>
              <span className="text-[10px] text-slate-400 block font-mono">
                {isInvoice ? (language === 'bn' ? 'অফিসিয়াল মানি রশিদ এক্সপোর্ট' : 'Official Billings Voucher') : (language === 'bn' ? 'সিস্টেম মডিউল খতিয়ান' : 'Application Active View Ledger')}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded p-1.5 text-slate-400 hover:bg-emerald-950/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content workspace block */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8 bg-neutral-950/30">
          
          {/* Left panel: Live True Snapshot Preview */}
          <div className="flex-1 bg-neutral-950/50 border border-emerald-950/30 rounded-lg p-4 flex items-center justify-center min-h-[300px] md:min-h-[auto] relative overflow-hidden">
            {isRenderingPreview ? (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    {language === 'bn' ? 'স্ন্যাপশট লোড করা হচ্ছে...' : 'Rendering Document Preview...'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    {language === 'bn' ? 'উচ্চ মানের ভেক্টর ম্যাপিং নির্ধারণ করা হচ্ছে' : 'Processing viewport margins and layers'}
                  </p>
                </div>
              </div>
            ) : previewError ? (
              <div className="flex flex-col items-center text-center p-6 space-y-3">
                <span className="text-rose-500 text-3xl">⚠️</span>
                <p className="text-xs text-rose-300 font-semibold max-w-xs">{previewError}</p>
                <button
                  type="button"
                  onClick={generateThumbnail}
                  className="mt-2 flex items-center gap-1.5 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 text-[10px] font-bold text-emerald-400 px-3 py-1.5 border border-emerald-900/60 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Refresh'}</span>
                </button>
              </div>
            ) : previewImg ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <p className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-wide">
                  {language === 'bn' ? 'পেজ স্ন্যাপশট প্রিভিউ' : 'Document Print preview'}
                </p>
                <div className="border border-slate-700/40 rounded shadow-2xl bg-white max-h-[480px] overflow-y-auto max-w-full p-2">
                  <img 
                    src={previewImg} 
                    alt="Billing print preview" 
                    className="w-full h-auto object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">
                {language === 'bn' ? 'কোনো প্রিভিউ উপলব্ধ নেই' : 'No preview available'}
              </div>
            )}
          </div>

          {/* Right panel: Controls and meta directives */}
          <div className="w-full md:w-80 shrink-0 flex flex-col justify-between space-y-6">
            
            {/* Meta controls list layout */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-emerald-950/50 bg-neutral-950/80 space-y-2">
                <h4 className="text-[10px] font-black uppercase text-emerald-400 font-mono flex items-center gap-1.5">
                  <Info className="h-3 w-3 shrink-0" />
                  {language === 'bn' ? 'স্মার্ট প্রিন্টিং সুবিধা' : 'Sandboxed Printing Utility'}
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {language === 'bn' 
                    ? 'ব্রাউজার সীমাবদ্ধতার কারণে সাধারণ প্রিন্ট অপশন আইফ্রেম (iFrame) এর ভেতর থেকে কাজ নাও করতে পারে। তাই সরাসরি পিডিএফ ডাউনলোড করে প্রিন্ট করার পরম পরামর্শ দেওয়া হচ্ছে।'
                    : 'Inside sandboxed preview containers, default browser printer popups are often blocked. Generating static vector PDF documents guarantees flawless physical alignment and no truncation errors.'}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {/* PDF generation primary button */}
                <button
                  type="button"
                  disabled={isGenerating || isRenderingPreview}
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>{language === 'bn' ? 'পিডিএফ প্রস্তুত হচ্ছে...' : 'Compiling PDF...'}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>{language === 'bn' ? 'পিডিএফ ফাইল ডাউনলোড করুন (A4)' : 'Download High-Fidelity PDF'}</span>
                    </>
                  )}
                </button>

                {/* High quality Image download button */}
                <button
                  type="button"
                  disabled={isGenerating || isRenderingPreview}
                  onClick={handleDownloadPNG}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-emerald-950 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{language === 'bn' ? 'ছবি (PNG Image) হিসেবে সেভ করুন' : 'Export Statement as Image'}</span>
                </button>

                {/* Direct printer fallback selector option */}
                <div className="relative pt-2 border-t border-emerald-950/40">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-mono mb-2">
                    {language === 'bn' ? 'বিকল্প ব্যবস্থা' : 'Fallback Methods'}
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleTriggerNativePrinterFallback}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-neutral-950/20 hover:bg-neutral-950/70 border border-slate-800 px-4 py-2 text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{language === 'bn' ? 'সরাসরি ব্রাউজার প্রিন্ট উইন্ডো' : 'Launch OS Printer Window'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Instruction Footer warning info */}
            <div className="text-[9px] text-slate-550 leading-loose border-t border-emerald-950/20 pt-4 font-mono">
              <p>Platform Ingress Ref: AISTUDIO-PRINT-SECURE</p>
              <p>Resolution density: 300 DPI (2.0x sampling rate)</p>
            </div>

          </div>
        </div>
      </div>

      {/* Dynamic off-screen system printing document */}
      <div className="absolute top-[-9999px] left-[-9999px] print:relative print:top-0 print:left-0 block overflow-visible select-text">
        <div id="dynamic-print-report">
          {renderDynamicReport()}
        </div>
      </div>
    </div>
  );
}
