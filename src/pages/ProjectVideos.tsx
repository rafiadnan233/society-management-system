/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { translations } from '../utils/translations';
import { 
  db, 
  OperationType, 
  handleFirestoreError 
} from '../utils/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  Video, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Play, 
  Clock, 
  Tag, 
  Layers, 
  Upload, 
  Info,
  Calendar,
  Sparkles,
  Tv,
  Check
} from 'lucide-react';

interface ProjectVideo {
  id: string;
  title: string;
  description: string;
  projectName: string;
  category: string;
  youtubeUrl: string;
  facebookUrl: string;
  thumbnail: string;
  uploadDate: any; 
  createdBy: string;
  isFeatured?: boolean;
}

const PRESET_THUMBNAILS = [
  { url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80', label: 'Construction Structure' },
  { url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80', label: 'Concrete & Steel Work' },
  { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80', label: 'Modern Highrise Glass' },
  { url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80', label: 'Video Production Media' },
  { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80', label: 'Community Events Meeting' }
];

const CATEGORIES = [
  'Construction Progress',
  'Architectural Tour',
  'Security Briefing',
  'Society Events',
  'General Complex'
];

export default function ProjectVideos() {
  const { currentUser, language } = useSociety();
  const t = translations[language];

  const adminVerified = currentUser?.role === 'Admin';

  const [videos, setVideos] = useState<ProjectVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Watch Modal State
  const [activeWatchVideo, setActiveWatchVideo] = useState<ProjectVideo | null>(null);

  // Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ProjectVideo | null>(null);

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formProjectName, setFormProjectName] = useState('Tower 1');
  const [formCategory, setFormCategory] = useState('Construction Progress');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formFacebookUrl, setFormFacebookUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState(PRESET_THUMBNAILS[0].url);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time Firestore sync
  useEffect(() => {
    const qVideos = query(collection(db, 'project_videos'), orderBy('uploadDate', 'desc'));
    
    const unsubscribe = onSnapshot(qVideos, (snapshot) => {
      const vList = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let dateStr = '';
        if (data.uploadDate) {
          try {
            // Handle Firestore Timestamp or string
            if (data.uploadDate.toDate) {
              dateStr = data.uploadDate.toDate().toISOString().split('T')[0];
            } else if (data.uploadDate.seconds) {
              dateStr = new Date(data.uploadDate.seconds * 1000).toISOString().split('T')[0];
            } else {
              dateStr = String(data.uploadDate);
            }
          } catch (e) {
            dateStr = new Date().toISOString().split('T')[0];
          }
        } else {
          dateStr = new Date().toISOString().split('T')[0];
        }

        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          projectName: data.projectName || '',
          category: data.category || '',
          youtubeUrl: data.youtubeUrl || '',
          facebookUrl: data.facebookUrl || '',
          thumbnail: data.thumbnail || PRESET_THUMBNAILS[0].url,
          uploadDate: dateStr,
          createdBy: data.createdBy || 'Admin',
          isFeatured: !!data.isFeatured
        };
      }) as ProjectVideo[];

      setVideos(vList);
      setLoading(false);

      // Track last visit to dismiss notification badges
      localStorage.setItem('as_last_videos_viewed_time', String(Date.now()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'project_videos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper parsing youtube ID to embed
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      const trimmed = url.trim();
      let videoId = '';
      
      // Match youtu.be/VIDEO_ID
      if (trimmed.includes('youtu.be/')) {
        const parts = trimmed.split('youtu.be/');
        if (parts.length > 1) {
          const possibleId = parts[1].split(/[?#&]/)[0];
          if (possibleId.length === 11) {
            videoId = possibleId;
          }
        }
      }
      
      // Match /shorts/VIDEO_ID
      if (!videoId && trimmed.includes('/shorts/')) {
        const parts = trimmed.split('/shorts/');
        if (parts.length > 1) {
          const possibleId = parts[1].split(/[?#&]/)[0];
          if (possibleId.length === 11) {
            videoId = possibleId;
          }
        }
      }

      // Match /live/VIDEO_ID
      if (!videoId && trimmed.includes('/live/')) {
        const parts = trimmed.split('/live/');
        if (parts.length > 1) {
          const possibleId = parts[1].split(/[?#&]/)[0];
          if (possibleId.length === 11) {
            videoId = possibleId;
          }
        }
      }

      // Match /embed/VIDEO_ID
      if (!videoId && trimmed.includes('/embed/')) {
        const parts = trimmed.split('/embed/');
        if (parts.length > 1) {
          const possibleId = parts[1].split(/[?#&]/)[0];
          if (possibleId.length === 11) {
            videoId = possibleId;
          }
        }
      }

      // Match watch?v=VIDEO_ID or &v=VIDEO_ID
      if (!videoId && trimmed.includes('v=')) {
        const regWatch = /[?&]v=([^#&?]*)/;
        const matchWatch = trimmed.match(regWatch);
        if (matchWatch && matchWatch[1].length === 11) {
          videoId = matchWatch[1];
        }
      }

      // General fallback regex
      if (!videoId) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
        const match = trimmed.match(regExp);
        if (match && match[2].length === 11) {
          videoId = match[2];
        }
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      }
    } catch (e) {
      console.error("Error parsing YouTube URL:", e);
    }
    return '';
  };

  // Helper parsing facebook ID to embed
  const getFacebookEmbedUrl = (url: string) => {
    if (!url) return '';
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&t=0&autoplay=true`;
  };

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingVideo(null);
    setFormTitle('');
    setFormDescription('');
    setFormProjectName('Tower 1');
    setFormCategory('Construction Progress');
    setFormYoutubeUrl('');
    setFormFacebookUrl('');
    setFormThumbnailUrl(PRESET_THUMBNAILS[0].url);
    setFormIsFeatured(false);
    setFormError(null);
    setIsSubmitting(false);
    setShowFormModal(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (v: ProjectVideo) => {
    setEditingVideo(v);
    setFormTitle(v.title);
    setFormDescription(v.description);
    setFormProjectName(v.projectName);
    setFormCategory(v.category);
    setFormYoutubeUrl(v.youtubeUrl);
    setFormFacebookUrl(v.facebookUrl);
    setFormThumbnailUrl(v.thumbnail);
    setFormIsFeatured(!!v.isFeatured);
    setFormError(null);
    setIsSubmitting(false);
    setShowFormModal(true);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError(language === 'bn' ? 'ভিডিওর শিরোনাম আবশ্যক!' : 'Video Title is required!');
      return;
    }

    let ytUrl = formYoutubeUrl.trim();
    if (ytUrl && !ytUrl.startsWith('http://') && !ytUrl.startsWith('https://')) {
      ytUrl = 'https://' + ytUrl;
    }

    let fbUrl = formFacebookUrl.trim();
    if (fbUrl && !fbUrl.startsWith('http://') && !fbUrl.startsWith('https://')) {
      fbUrl = 'https://' + fbUrl;
    }

    if (!ytUrl && !fbUrl) {
      setFormError(language === 'bn' 
        ? 'দয়া করে ইউটিউব অথবা ফেসবুক ভিডিওর যেকোনো একটি সঠিক লিংক দিন!' 
        : 'Please provide either a YouTube or a Facebook Video Link!');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      projectName: formProjectName,
      category: formCategory,
      youtubeUrl: ytUrl,
      facebookUrl: fbUrl,
      thumbnail: formThumbnailUrl || PRESET_THUMBNAILS[0].url,
      isFeatured: formIsFeatured,
      createdBy: currentUser?.name || 'Administrator',
      uploadDate: serverTimestamp()
    };

    try {
      if (editingVideo) {
        await updateDoc(doc(db, 'project_videos', editingVideo.id), payload);
        console.log('Video resource updated successfully.');
      } else {
        await addDoc(collection(db, 'project_videos'), payload);
        console.log('New video added successfully.');
      }
      setIsSubmitting(false);
      setShowFormModal(false);
    } catch (err: any) {
      setIsSubmitting(false);
      console.error("Video submission error: ", err);
      const errMsg = err?.message || String(err);
      setFormError(language === 'bn' 
        ? `ভিডিয়ো আপলোড ব্যর্থ হয়েছে: ${errMsg}` 
        : `Failed to upload project video: ${errMsg}`);
    }
  };

  // Deletion logic
  const handleDelete = async (id: string) => {
    const confirmMsg = language === 'bn' 
      ? 'আপনি কি নিশ্চিত যে এই ভিডিওটি মুছে ফেলতে চান?' 
      : 'Are you sure you want to delete this project video?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteDoc(doc(db, 'project_videos', id));
      console.log('Video resource deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `project_videos/${id}`);
    }
  };

  // Filtering videos lists
  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pin Featured Video (If explicitly checked, or the absolute latest video)
  const featuredVideo = videos.find(v => v.isFeatured) || videos[0];
  const regularVideos = videos.filter(v => v.id !== featuredVideo?.id);
  const displayedVideos = filteredVideos.filter(v => v.id !== (selectedCategory === 'All' && searchQuery === '' ? featuredVideo?.id : ''));

  return (
    <div className="space-y-6">
      
      {/* Title Header area */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5 bg-black border border-neutral-800 rounded-lg px-4 py-2 mt-1 shadow-md w-fit">
            <Video className="h-5 w-5 text-emerald-400 animate-pulse animate-ease-out" />
            <span>
              {language === 'bn' ? 'প্রকল্পের গুরুত্বপূর্ণ লাইভ ভিডিওসমূহ' : 'Project Live Media Hub'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {language === 'bn' 
              ? 'আস্থা টুইন টাওয়ার্স খেতাসার কোয়ার্টার নির্মাণ ও উন্নয়নকাজের সরাসরি ভিডিও সংগ্রহশালা।' 
              : 'Official live progress streams, milestones, and architectural updates of the towers.'}
          </p>
        </div>

        {adminVerified && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 hover:scale-103 py-2 px-4 text-xs font-bold text-white shadow-lg border border-emerald-550 cursor-pointer self-start sm:self-auto transition-transform duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>{language === 'bn' ? 'নতুন ভিডিও ফাইল যুক্ত করুন' : 'Upload Video Info'}</span>
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-neutral-950/45 border border-emerald-950 p-4 rounded-xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 font-bold" />
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-755/90 rounded-lg py-2 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            placeholder={language === 'bn' ? 'শিরোনাম, প্রকল্প অথবা বিবরণী দিয়ে খুজুন...' : 'Search videos by title, project, or description...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Horizontal Badges */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-tight border transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'All' 
                ? 'bg-emerald-700/80 text-white border-emerald-500' 
                : 'bg-neutral-900 text-slate-400 border-slate-800 hover:bg-[#043327]/30 hover:text-white'
            }`}
          >
            {language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Updates'}
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-tight border transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-emerald-700/80 text-white border-emerald-500' 
                  : 'bg-neutral-900 text-slate-400 border-slate-800 hover:bg-[#043327]/30 hover:text-white'
              }`}
            >
              {language === 'bn' 
                ? (cat === 'Construction Progress' ? 'নির্মাণ অগ্রগতি' : 
                   cat === 'Architectural Tour' ? 'স্থাপত্য নকশা ট্যুর' : 
                   cat === 'Security Briefing' ? 'নিরাপত্তা তথ্য' : 
                   cat === 'Society Events' ? 'সোসাইটি অনুষ্ঠান' : 'সাধারণ ক কমপ্লেক্স') 
                : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-neutral-950/20 border border-emerald-950 rounded-xl">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-500 animate-spin" />
          <span className="text-xs text-slate-500 font-mono uppercase tracking-widest leading-none">Syncing database collections...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-emerald-950 bg-neutral-950/20">
          <Video className="h-10 w-10 text-slate-700 animate-bounce mb-3" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">{language === 'bn' ? 'কোন ভিডিও ফাইল নেই' : 'No Media Records Posted'}</h4>
          <p className="text-xs text-slate-500 font-sans max-w-sm mt-1.5">
            {language === 'bn' 
              ? 'আইডিবিতে কোন ভিডিও রেকর্ড যুক্ত করা হয়নি। নতুন একটি যুক্ত করতে উপরে অ্যাড বাটনে ক্লিক করুন।' 
              : 'There are currently no videos linked in the project directory. If you are an Admin, click the Upload button to post first.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* FEATURED VIDEO SPOTLIGHT HERO CARD */}
          {featuredVideo && searchQuery === '' && selectedCategory === 'All' && (
            <div className="rounded-xl border border-emerald-950 bg-[#064e3b]/10 hover:border-emerald-900 transition-all p-5 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Badge Overlay */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded bg-amber-500 border border-amber-600 px-2 py-1 text-[9px] font-bold text-slate-950 uppercase tracking-widest font-mono">
                <Sparkles className="h-3 w-3 fill-slate-950" />
                <span>{language === 'bn' ? 'নির্বাচিত ভিডিও' : 'Featured Spotlight'}</span>
              </div>

              {/* Left Video Thumbnail area */}
              <div 
                onClick={() => setActiveWatchVideo(featuredVideo)}
                className="lg:col-span-7 relative rounded-lg border border-slate-800 bg-neutral-900 overflow-hidden cursor-pointer group shadow-lg"
              >
                <img 
                  src={featuredVideo.thumbnail || null} 
                  alt={featuredVideo.title}
                  className="w-full h-64 sm:h-80 object-cover group-hover:scale-104 transition-transform duration-300 filter brightness-95 group-hover:brightness-100"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Video Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <div className="h-14 w-14 rounded-full bg-[#064e3b]/90 border border-emerald-400/40 text-white flex items-center justify-center shadow-lg shadow-black/80 group-hover:scale-110 group-hover:bg-emerald-600 transition-all">
                    <Play className="h-6 w-6 fill-white ml-1" />
                  </div>
                </div>
              </div>

              {/* Right Media Info panel */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold tracking-wider font-mono">
                    <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-900 px-2 py-0.5">
                      {featuredVideo.projectName}
                    </span>
                    <span className="rounded bg-neutral-900 text-slate-400 border border-slate-800 px-2 py-0.5">
                      {featuredVideo.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white leading-snug tracking-tight">
                    {featuredVideo.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-5">
                    {featuredVideo.description || (language === 'bn' ? 'কোন বিস্তারিত বিবরণ সংযুক্ত নেই।' : 'No details or description file attached.')}
                  </p>
                </div>

                {/* Bottom Metadata & Controls row */}
                <div className="border-t border-emerald-950/60 pt-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5 font-sans font-medium">
                      <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>{language === 'bn' ? `প্রকাশ: ${featuredVideo.uploadDate}` : `Posted: ${featuredVideo.uploadDate}`}</span>
                    </span>
                    <span>Admin • {featuredVideo.createdBy}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveWatchVideo(featuredVideo)}
                      className="flex-1 rounded-md bg-emerald-600 hover:bg-emerald-500 hover:scale-101 border border-[#D4AF37]/25 px-4 py-2 text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>{language === 'bn' ? 'ভিডিওটি দেখুন' : 'Watch Stream Video'}</span>
                    </button>

                    {adminVerified && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(featuredVideo)}
                          className="p-2 rounded bg-neutral-900 hover:bg-[#043327] hover:text-white border border-slate-800 hover:border-emerald-700 text-slate-300 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(featuredVideo.id)}
                          className="p-2 rounded bg-neutral-900 hover:bg-rose-950 text-slate-300 hover:text-red-500 border border-slate-800 hover:border-rose-900 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* MAIN VIDEO CARD GRID BOX */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] font-mono">
              {language === 'bn' ? 'অন্যান্য ভিডিও ও আপডেটসমূহ' : 'Latest Milestone Broadcasts'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedVideos.map((video) => (
                <div 
                  key={video.id}
                  className="rounded-xl border border-emerald-950 bg-neutral-950/40 hover:border-emerald-800 transition-all overflow-hidden flex flex-col justify-between group shadow-lg"
                >
                  {/* Card Image Thumbnail */}
                  <div 
                    onClick={() => setActiveWatchVideo(video)}
                    className="relative h-44 bg-neutral-900 overflow-hidden cursor-pointer"
                  >
                    <img 
                      src={video.thumbnail || null} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 filter brightness-95"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Dark/Play Hover Layer */}
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-all">
                      <div className="h-10 w-10 rounded-full bg-emerald-600/95 text-white border border-emerald-400/40 flex items-center justify-center shadow-md">
                        <Play className="h-4.5 w-4.5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Left/Right Overlays */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 font-mono text-[9px] font-bold text-white bg-[#064e3b]/90 border border-emerald-700 rounded px-1.5 py-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{video.uploadDate}</span>
                    </div>

                    {video.isFeatured && (
                      <div className="absolute top-2.5 right-2.5 rounded bg-amber-500 text-[8px] font-bold font-mono text-slate-900 px-1.5 py-0.5 border border-amber-600 uppercase tracking-tight">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-bold tracking-wider font-mono">
                        <span className="rounded bg-emerald-950 text-emerald-300 border border-emerald-900 px-1.5 py-0.5">
                          {video.projectName}
                        </span>
                        <span className="rounded bg-neutral-900 text-slate-400 border border-slate-800 px-1.5 py-0.5">
                          {video.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white font-sans line-clamp-1 leading-snug group-hover:text-emerald-400 transition-colors">
                        {video.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                        {video.description || (language === 'bn' ? 'কোন বিস্তারিত বিবরণ দেওয়া হয়নি।' : 'No descriptive overview recorded.')}
                      </p>
                    </div>

                    {/* Watch Button / Admin Panel */}
                    <div className="border-t border-emerald-950/60 pt-3 flex items-center justify-between gap-2.5 mt-auto">
                      <button
                        onClick={() => setActiveWatchVideo(video)}
                        className="flex-1 text-center py-2.5 bg-[#043327] hover:bg-[#064e3b] text-emerald-300 hover:text-white border border-emerald-900/60 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-emerald-300 group-hover:fill-white" />
                        <span>{language === 'bn' ? 'চালু করুন' : 'Watch Now'}</span>
                      </button>

                      {adminVerified && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenEdit(video)}
                            className="p-2 bg-neutral-900 border border-slate-800 hover:border-emerald-700 hover:bg-[#043327] rounded text-slate-400 hover:text-white cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="p-2 bg-neutral-900 border border-slate-800 hover:border-rose-900 hover:bg-rose-950 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 🎬 WATCH VIDEO POPUP OVERLAY MODAL */}
      {activeWatchVideo && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          
          <div className="w-full max-w-4xl bg-neutral-900 border border-emerald-950 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
            {/* Modal Heading Control bar */}
            <div className="bg-neutral-950 px-5 py-4 border-b border-emerald-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-bold">
                  {activeWatchVideo.projectName} • {activeWatchVideo.category}
                </span>
              </div>
              <button 
                onClick={() => setActiveWatchVideo(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Embed Video view port */}
            <div className="bg-black relative aspect-video w-full">
              {activeWatchVideo.youtubeUrl && getYoutubeEmbedUrl(activeWatchVideo.youtubeUrl) ? (
                <iframe
                  className="w-full h-full border-none"
                  src={getYoutubeEmbedUrl(activeWatchVideo.youtubeUrl)}
                  title={activeWatchVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : activeWatchVideo.facebookUrl ? (
                <iframe
                  className="w-full h-full border-none"
                  src={getFacebookEmbedUrl(activeWatchVideo.facebookUrl) || undefined}
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-900 border-t border-b border-emerald-950/20">
                  <Info className="h-10 w-10 text-emerald-500/80 mb-2.5 animate-pulse" />
                  <span className="text-xs text-slate-300 font-sans mb-4 max-w-sm leading-relaxed px-4">
                    {activeWatchVideo.youtubeUrl 
                      ? (language === 'bn' ? 'ইউটিউব ভিডিও লিংকটি সরাসরি প্লে করা যাচ্ছে না বা ফরম্যাট আলাদা।' : 'This YouTube link format cannot be directly embedded.') 
                      : (language === 'bn' ? 'কোনো সক্রিয় স্ট্রিম বা এম্বেড লিংক যুক্ত নেই!' : 'No Active Streaming Embed Link Configured!')}
                  </span>
                  {(activeWatchVideo.youtubeUrl || activeWatchVideo.facebookUrl) && (
                    <a
                      href={activeWatchVideo.youtubeUrl || activeWatchVideo.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold tracking-wide shadow-md hover:shadow-emerald-950/40 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{language === 'bn' ? 'নতুন ট্যাবে ভিডিওটি দেখুন' : 'Watch video in new tab'}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Video Descriptions Panel */}
            <div className="p-5 space-y-2.5 bg-neutral-900 max-h-48 overflow-y-auto">
              <h3 className="text-base font-bold text-white tracking-tight">{activeWatchVideo.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeWatchVideo.description}</p>
              
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>{language === 'bn' ? `তারিখ: ${activeWatchVideo.uploadDate}` : `Uploaded: ${activeWatchVideo.uploadDate}`}</span>
                <span>By: {activeWatchVideo.createdBy}</span>
              </div>
            </div>

          </div>

        </div>
      )}


      {/* ========================================================= */}
      {/* 📝 ADMIN VIDEO FORM SLIDE/MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-neutral-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          
          <div className="w-full max-w-lg bg-neutral-950 border border-emerald-950 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
            {/* Form Title banner */}
            <div className="bg-neutral-900 px-5 py-4 border-b border-emerald-950/60 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                {editingVideo 
                  ? (language === 'bn' ? 'ভিডিও বিবরণ সম্পাদনা করুন' : 'Edit Project Video Details') 
                  : (language === 'bn' ? 'নতুন নির্মাণ বা লাইভ ভিডিও যোগ' : 'Upload Project Live Video')
                }
              </h3>
              <button 
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simple Help Info */}
            <div className="p-3 bg-[#064e3b]/10 border-b border-emerald-950/30 text-[10.5px] text-emerald-300 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Provide a valid YouTube or Facebook Video URL. The video gallery resolves embeds automatically. Toggle "Featured" to spotlight this video at the top of the archive.
              </p>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-132 overflow-y-auto">
              
              {/* Error Alert Display */}
              {formError && (
                <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300 font-sans leading-relaxed animate-pulse">
                  ⚠️ {formError}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-350 uppercase tracking-wide">
                  {language === 'bn' ? 'ভিডিওর শিরোনাম' : 'Video Title'} *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-755/90 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder={language === 'bn' ? 'যেমন: আস্থা টুইন টাওয়ার্সের ১৩ম তলার নির্মাণ কার্যক্রম' : 'e.g. Tower 1 Roof Slab Slab Casting Progress Video'}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Description textarea */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-350 uppercase tracking-wide">
                  {language === 'bn' ? 'বিস্তারিত বিবরণ' : 'Description'}
                </label>
                <textarea
                  className="w-full bg-slate-900 border border-slate-755/90 rounded-lg px-3 py-2 text-xs text-white h-20 focus:outline-none focus:border-emerald-500"
                  placeholder={language === 'bn' ? 'ভিডিও সম্পর্কে বিস্তারিত বিবরণ লিখুন...' : 'Write an overview or milestone description of the video contents...'}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* Grid 2x2 Project and Category selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-350 uppercase tracking-wide">
                    {language === 'bn' ? 'প্রকল্পের অংশ' : 'Project Name'}
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-755/90 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    value={formProjectName}
                    onChange={(e) => setFormProjectName(e.target.value)}
                  >
                    <option value="Tower 1">Tower 1</option>
                    <option value="Tower 2">Tower 2</option>
                    <option value="Basement Plaza">Basement Plaza</option>
                    <option value="Rooftop Garden">Rooftop Garden</option>
                    <option value="General Complex">General Complex</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-350 uppercase tracking-wide">
                    {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-755/90 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Video URL Fields */}
              <div className="space-y-3.5 pt-1 border-t border-slate-800/60">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-350 uppercase tracking-wide">
                    {language === 'bn' ? 'ইউটিউব ভিডিও ইউআরএল / লিংক' : 'YouTube URL'}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-755/90 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="youtube.com/watch?v=... or youtube.com/shorts/..."
                    value={formYoutubeUrl}
                    onChange={(e) => {
                      setFormYoutubeUrl(e.target.value);
                      if(e.target.value) setFormFacebookUrl(''); // Exclusive url options
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-350 uppercase tracking-wide">
                    {language === 'bn' ? 'ফেসবুক ভিডিও ইউআরএল / লিংক' : 'Facebook Video URL'}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-755/90 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="facebook.com/.../videos/.../"
                    value={formFacebookUrl}
                    onChange={(e) => {
                      setFormFacebookUrl(e.target.value);
                      if(e.target.value) setFormYoutubeUrl(''); // Exclusive
                    }}
                  />
                </div>
              </div>

              {/* Featured Selection Toggle Checkbox */}
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-950/60 bg-emerald-950/25">
                <input
                  type="checkbox"
                  id="form-is-featured"
                  className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                  checked={formIsFeatured}
                  onChange={(e) => setFormIsFeatured(e.target.checked)}
                />
                <label htmlFor="form-is-featured" className="text-xs font-bold text-white cursor-pointer select-none">
                  {language === 'bn' ? 'ভিডিওটি আর্কাইভে হাইলাইট / ফিচারড করুন' : 'Pin Video in top Spotlight section'}
                </label>
              </div>

              {/* Thumbnail preset selector */}
              <div className="space-y-2 pt-1 border-t border-slate-800/60">
                <label className="block text-[11px] font-bold text-slate-350 uppercase tracking-wide">
                  {language === 'bn' ? 'ভিডিওর থাম্বনেইল ছবি' : 'Thumbnail Customizer'}
                </label>
                
                {/* Manual Thumbnail link input */}
                <input
                  type="url"
                  className="w-full bg-slate-900 border border-slate-755/90 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Paste direct image URL (https://...)"
                  value={formThumbnailUrl}
                  onChange={(e) => setFormThumbnailUrl(e.target.value)}
                />

                {/* Grid of Preset Image Options */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">Or pick a professional preset thumbnail placeholder:</span>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_THUMBNAILS.map((preset, index) => {
                      const selected = formThumbnailUrl === preset.url;
                      return (
                        <div
                          key={index}
                          onClick={() => setFormThumbnailUrl(preset.url)}
                          className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 transition-all ${selected ? 'border-[#D4AF37] scale-102 ring-1 ring-[#D4AF37]' : 'border-slate-850 opacity-60 hover:opacity-100'}`}
                          title={preset.label}
                        >
                          <img 
                            src={preset.url || null} 
                            alt={preset.label} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {selected && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Check className="h-4 w-4 text-[#D4AF37] stroke-[3px]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-550 px-5 py-2.5 text-xs font-bold text-white shadow-lg cursor-pointer"
                >
                  {editingVideo ? t.save : t.add}
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
