/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Visitor } from '../types';
import { useSociety } from '../context/SocietyContext';
import { 
  X, 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Mail, 
  PhoneCall, 
  ShieldAlert, 
  BadgeCheck, 
  Printer, 
  Building,
  ExternalLink
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { sanitizeAllInlineStyles } from '../utils/oklchPatch';

interface VisitorPassModalProps {
  visitor: Visitor;
  onClose: () => void;
}

export default function VisitorPassModal({ visitor, onClose }: VisitorPassModalProps) {
  const { language, config } = useSociety();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Format metadata for QR Code payload
  const qrRawData = `VALID_ENTRY_PASS\n` +
                    `Pass ID: VIS-${visitor.id.substring(0, 8).toUpperCase()}\n` +
                    `Visitor: ${visitor.name}\n` +
                    `Resident Flat: ${visitor.flatNumber}\n` +
                    `Purpose: ${visitor.purpose}\n` +
                    `Checked In: ${new Date(visitor.entryTime).toLocaleString()}\n` +
                    `Status: ${visitor.status === 'Inside' ? 'AUTHORIZED' : 'EXPIRED'}`;

  const encodedQRData = encodeURIComponent(qrRawData);
  // Using high contrast dark slate color for QR generator (emerald scale)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=042F2E&data=${encodedQRData}`;

  // 2. Draft SMS / WhatsApp custom messaging invites
  const shareHeading = language === 'bn' 
    ? `✨ আস্থাঁ টুইন টাওয়ার্স ডিজিটাল প্রবেশপত্র (Digital Gate Pass) ✨`
    : `✨ Astha Twin Towers Official Digital Entry Pass ✨`;

  const shareText = `${shareHeading}\n\n` +
    `${language === 'bn' ? 'দর্শকের নাম:' : 'Visitor Name:'} ${visitor.name}\n` +
    `${language === 'bn' ? 'ফ্ল্যাট নম্বর:' : 'Host Flat:'} Flat ${visitor.flatNumber}\n` +
    `${language === 'bn' ? 'প্রবেশের কারণ:' : 'Purpose of Visit:'} ${visitor.purpose}\n` +
    `${language === 'bn' ? 'পাস আইডি:' : 'Pass Ref No:'} #VIS-${visitor.id.substring(0, 8).toUpperCase()}\n` +
    `${language === 'bn' ? 'প্রবেশের সময়:' : 'Check-In Entry Time:'} ${new Date(visitor.entryTime).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}\n` +
    `${language === 'bn' ? 'স্ট্যাটাস:' : 'Gate Security Status:'} ${visitor.status === 'Inside' ? '🟢 AUTHORIZED ENTRY' : '🔴 EXPIRED / CHECKED OUT'}\n\n` +
    `${language === 'bn' ? 'অনুগ্রহ করে গেটের নিরাপত্তা রক্ষীকে এই কোডটি দেখান।' : 'Please present this digital pass with QR code to the gate security personnel.'}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;
    window.open(smsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const emailSubject = language === 'bn' 
      ? `আস্থাঁ টুইন টাওয়ার্স প্রবেশ পাস [ফ্ল্যাট ${visitor.flatNumber}]`
      : `Digital Entry Visitor Pass - Unit ${visitor.flatNumber}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareText)}`;
    window.open(mailtoUrl, '_blank', 'noopener,noreferrer');
  };

  // Convert digital pass to a beautiful downloadable A6 PDF perfectly formatted for mobile devices
  const handleDownloadPDFPass = async () => {
    const element = document.getElementById('visitor-visual-badge-canvas');
    if (!element) return;

    try {
      setIsDownloading(true);
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Sanitize OKLCH and inline factors
      sanitizeAllInlineStyles(element);

      const canvas = await html2canvas(element, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6' // A6 is perfect pocket width size for digital ticket/pass downloads
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Fit with small margins
      const margin = 4;
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, printWidth, printHeight);
      pdf.save(`VisitorPass-Flat${visitor.flatNumber}-${visitor.name.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Failed to export high contrast PDF security token pass:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-emerald-900 bg-neutral-950 p-6 flex flex-col md:flex-row gap-6 relative shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full border border-emerald-950 bg-neutral-900 p-2 text-slate-400 hover:text-white"
          title={language === 'bn' ? 'বন্ধ করুন' : 'Close Model'}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Column 1: A6 styled digital ticket preview */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase mb-3 block flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5 text-emerald-500" />
            <span>{language === 'bn' ? 'ডিজিটাল গেট পাস টিকিট' : 'Gate Pass Ticket Preview'}</span>
          </span>

          {/* PRINTABLE CANVAS TICKET: Formatted for phone preview */}
          <div className="bg-neutral-900/60 p-3 rounded-2xl border border-emerald-950 shadow-inner flex items-center justify-center w-full">
            <div 
              id="visitor-visual-badge-canvas"
              className="w-[310px] h-[450px] bg-white text-neutral-900 border-4 border-solid border-emerald-950 rounded-xl py-5 px-4 relative flex flex-col justify-between overflow-hidden shadow-lg select-none box-border"
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
            >
              {/* Emerald header band */}
              <div className="absolute top-0 left-0 right-0 h-2.5 bg-emerald-850" />

              {/* Watermark security elements */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                <Building className="h-44 w-44 text-emerald-950" />
              </div>

              {/* Card Header information */}
              <div className="text-center pt-2">
                <h4 className="text-xs uppercase font-serif tracking-widest font-black text-emerald-900 leading-tight">
                  {config.name || 'Astha Twin Towers'}
                </h4>
                <p className="text-[7.5px] text-[#A27B00] tracking-widest uppercase font-sans font-extrabold leading-none mt-1">
                  {language === 'bn' ? 'অফিসিয়াল ডিজিটাল ভিজিটর পাস' : 'VISITOR ENTRY AUTH-TOKEN'}
                </p>
                <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
              </div>

              {/* Central QR Code rendering area */}
              <div className="flex flex-col items-center justify-center my-2">
                <div className="relative p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <img 
                    src={qrCodeUrl} 
                    alt="Visitor Pass QR Security Stamp code" 
                    className="h-36 w-36 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  {visitor.status === 'Checked-Out' && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-rose-700">
                      <ShieldAlert className="h-10 w-10 text-rose-600 animate-bounce" />
                      <span className="text-[10px] font-black tracking-widest mt-1 uppercase font-mono">EXPIRED</span>
                    </div>
                  )}
                </div>
                <span className="text-[8.5px] font-mono font-bold text-slate-500 mt-2 tracking-widest block uppercase">
                  ID: VIS-{visitor.id.substring(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Central Particular metadata items */}
              <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50 text-[10px] space-y-1.5 font-sans">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wide text-[7px]">{language === 'bn' ? 'দর্শকের নাম' : 'VISITOR NAME'}</span>
                  <span className="font-extrabold text-slate-800 text-right uppercase truncate max-w-[170px]">{visitor.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wide text-[7px]">{language === 'bn' ? 'গন্তব্য ফ্ল্যাট' : 'HOST FLAT'}</span>
                  <span className="font-mono font-extrabold text-emerald-800">Flat {visitor.flatNumber}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wide text-[7px]">{language === 'bn' ? 'পেশা / উদ্দেশ্য' : 'VISIT PURPOSE'}</span>
                  <span className="font-medium text-slate-700 text-right truncate max-w-[170px]">{visitor.purpose}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-wide text-[7px]">{language === 'bn' ? 'চেক-ইন সময়' : 'ENTRY CHECK-IN'}</span>
                  <span className="font-mono text-[8.5px] text-slate-600">
                    {new Date(visitor.entryTime).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {month: 'short', day: 'numeric'})} • {new Date(visitor.entryTime).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
              </div>

              {/* Bottom Stamp seal validation mark */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 px-1 pb-1">
                <div className="flex items-center gap-1">
                  {visitor.status === 'Inside' ? (
                    <>
                      <BadgeCheck className="h-4 w-4 text-emerald-600 animate-pulse shrink-0" />
                      <span className="text-[7.5px] font-sans font-extrabold text-emerald-700 tracking-wider uppercase">VALID PASS</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                      <span className="text-[7.5px] font-sans font-extrabold text-rose-600 tracking-wider uppercase">PASS EXPIRED</span>
                    </>
                  )}
                </div>
                <div className="text-right text-[7px] italic text-slate-400 leading-none">
                  * Verify code at outer barrier guard post
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Column 2: Messaging, Actions, Custom settings */}
        <div className="w-full md:w-1/2 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono font-extrabold text-[#D4AF37] uppercase tracking-widest block">
                {language === 'bn' ? 'ডিজিটাল আমন্ত্রণ হাব' : 'Gate Pass Integration'}
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight font-sans leading-tight">
                {language === 'bn' ? 'যাতায়াত ব্যবস্থা ও যোগাযোগ' : 'Send Invite Confirmation'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'bn' 
                  ? 'এই পাসটি দর্শনার্থীকে চেক-ইন বা প্রবেশের আগে শেয়ার করুন। তারা গেটে দায়িত্বরত গার্ডের নিকট কিউআর কোড স্ক্যান করে দ্রুত প্রবেশ করতে পারবে।'
                  : 'Transmit this QR-coded authentication token to the visitor prior to their arrival. Gate security guards can instantly scan this token to authorize entrance.'
                }
              </p>
            </div>

            {/* Quick-sharing integrations grids */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                {language === 'bn' ? 'সরাসরি মেসেজিং অ্যাপে পাঠান' : 'Direct messaging integration'}
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 border border-emerald-950 bg-emerald-950/20 text-emerald-400 hover:text-white hover:bg-emerald-900/60 transition-all cursor-pointer font-bold"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <span>WhatsApp Share</span>
                </button>

                {/* SMS mobile trigger */}
                <button
                  type="button"
                  onClick={handleShareSMS}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 border border-[#D4AF37]/20 bg-amber-950/20 text-[#D4AF37] hover:text-white hover:bg-amber-900/40 transition-all cursor-pointer font-bold"
                >
                  <PhoneCall className="h-4 w-4 text-[#D4AF37]" />
                  <span>Send via SMS</span>
                </button>

                {/* Email message helper */}
                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 border border-slate-850 bg-neutral-900 text-slate-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer font-bold"
                >
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>Email Pass</span>
                </button>

                {/* Copy Text to Clipboard */}
                <button
                  type="button"
                  onClick={handleCopyText}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 transition-all cursor-pointer font-bold border ${
                    copied 
                      ? 'bg-emerald-900 border-emerald-500 text-white' 
                      : 'border-slate-850 bg-neutral-900 text-slate-350 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400 animate-bounce" />
                      <span>Copied Invite!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-400" />
                      <span>Copy Text Slate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Message Text Box Preview */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                {language === 'bn' ? 'আমন্ত্রণ বার্তার দৃশ্যপট প্রিভিউ' : 'Formatted SMS Text Details'}
              </span>
              <div className="p-3 bg-neutral-900 border border-emerald-950 rounded-xl max-h-[140px] overflow-y-auto font-mono text-[10px] text-slate-400 whitespace-pre-wrap leading-normal">
                {shareText}
              </div>
            </div>
          </div>

          {/* Primary Call to Action buttons */}
          <div className="pt-4 border-t border-emerald-950 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPDFPass}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 bg-emerald-600 border border-[#D4AF37]/50 text-white font-black text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-black/45"
            >
              {isDownloading ? (
                <>
                  <Printer className="h-4 w-4 text-white animate-spin" />
                  <span>Generating gate ticket PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>{language === 'bn' ? 'পিডিএফ পাস ডাউনলোড করুন' : 'Download Pass PDF'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-emerald-950 bg-neutral-900 text-slate-300 font-bold text-sm hover:text-white hover:bg-neutral-850 transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'সম্পন্ন' : 'Done'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
