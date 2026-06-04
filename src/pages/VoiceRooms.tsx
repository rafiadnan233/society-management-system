import React, { useState, useEffect } from 'react';
import { useSociety } from '../context/SocietyContext';
import { 
  Phone, Users, Mic, MicOff, Settings, Volume2, 
  Video, Monitor, ShieldAlert, CheckCircle2, User, 
  Search, Grid, Plus, LogOut, Radio
} from 'lucide-react';
import { 
  LiveKitRoom, RoomAudioRenderer, StartAudio, 
  useParticipants, useDataChannel, useRoomContext, 
  ParticipantTile, TrackToggle, TrackGroup
} from '@livekit/components-react';
import '@livekit/components-styles';

export default function VoiceRooms() {
  const { language, currentUser } = useSociety();
  const [token, setToken] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Fake static rooms array for the demo
  const voiceLobbies = [
    { id: 'general', name: 'Community Voice Lounge', category: 'General', members: 12 },
    { id: 'committee', name: 'Committee Meeting Hall', category: 'Official', members: 4, restricted: true },
    { id: 'emergency', name: 'Emergency Broadcast', category: 'Alert', members: 0, restricted: true },
    { id: 'maintenance', name: 'Maintenance Operations', category: 'Staff', members: 3 },
  ];

  const connectToRoom = async (roomId: string) => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomName: roomId,
          participantName: currentUser?.nameEn || 'Guest User',
          isCommitteeOrAdmin: currentUser?.role === 'Admin' || currentUser?.role === 'Committee'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setToken(data.token);
      setActiveRoom(roomId);
    } catch (error: any) {
      alert(language === 'bn' ? 'কানেকশন এরর: ' + error.message : 'Connection Error: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const wsUrl = import.meta.env.VITE_LIVEKIT_WS_URL || "wss://astha-twin-towers-fake-url.livekit.cloud";

  if (activeRoom && token) {
    return (
      <div className="h-[calc(100vh-100px)] w-full rounded-3xl overflow-hidden border border-emerald-900 bg-neutral-950 shadow-2xl flex flex-col">
        <LiveKitRoom
          video={false}
          audio={true}
          token={token}
          serverUrl={wsUrl}
          connectOptions={{ autoSubscribe: true }}
          data-lk-theme="default"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          onDisconnected={() => {
            setActiveRoom(null);
            setToken(null);
          }}
        >
          <div className="bg-neutral-900 p-4 border-b border-emerald-950 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-900/50 flex flex-center items-center justify-center border border-emerald-500/30">
                <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-wide">
                  {voiceLobbies.find(r => r.id === activeRoom)?.name}
                </h3>
                <p className="text-[10px] text-emerald-500 uppercase flex items-center gap-1.5 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {language === 'bn' ? 'লাইভ ভয়েস কনফারেন্স' : 'LIVE VOICE CONFERENCE'}
                </p>
              </div>
            </div>
            
            {/* The LiveKit built-in buttons */}
            <div className="flex items-center gap-2">
              <TrackToggle source={"microphone"} className="!bg-neutral-800 !hover:bg-neutral-700 !border-none !rounded-xl !text-white" />
              <button
                onClick={() => { setActiveRoom(null); setToken(null); }}
                className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-500 rounded-xl px-4 py-2 text-xs font-bold transition-colors border border-rose-900 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {language === 'bn' ? 'লেজার ত্যাগ করুন' : 'Leave Room'}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-black/50 p-6 overflow-y-auto">
             <ConferenceStage />
             <RoomAudioRenderer />
             <StartAudio label={language === 'bn' ? 'অডিও চালু করতে ক্লিক করুন' : 'Click to start audio'} />
          </div>
        </LiveKitRoom>
      </div>
    );
  }

  // Browse Lobbies Map
  const filteredRooms = voiceLobbies.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950 p-6 rounded-2xl border border-emerald-950/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl">
          <Radio className="h-48 w-48 text-emerald-500" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-[#D4AF37] tracking-tight flex items-center gap-2">
            <Radio className="h-6 w-6 text-[#D4AF37]" />
            {language === 'bn' ? 'ভয়েস কনফারেন্স রুম' : 'Voice Conference Rooms'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            {language === 'bn' 
              ? 'আস্থা টুইন টাওয়ারস ডিজিটাল ইন্টারকম ও ভয়েস আলোচনা'
              : 'Astha Twin Towers Digital Intercom & Community Discussions'}
          </p>
        </div>
        
        {currentUser?.role === 'Admin' && (
          <button className="relative z-10 shrink-0 text-sm font-bold bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 text-white px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {language === 'bn' ? 'নতুন রুম তৈরি করুন' : 'Create Voice Room'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder={language === 'bn' ? 'রুম খুঁজুন...' : 'Search voice lobbies...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group relative">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-[#D4AF37]" />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${room.restricted ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                   {room.restricted ? <ShieldAlert className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {room.members}
                </div>
              </div>
              
              <h3 className="text-[17px] font-black text-slate-800 tracking-tight leading-tight mb-2">
                {room.name}
              </h3>
              
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                  {room.category}
                </span>
                {room.restricted && (
                  <span className="text-[10px] uppercase font-bold text-rose-600 font-mono tracking-wider bg-rose-50 px-2 py-0.5 rounded">
                    {language === 'bn' ? 'সীমাবদ্ধ' : 'Restricted'}
                  </span>
                )}
              </div>

              <button
                onClick={() => connectToRoom(room.id)}
                disabled={isConnecting && activeRoom === room.id}
                className="w-full bg-slate-900 hover:bg-black text-white rounded-xl py-3 text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConnecting && activeRoom === room.id ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></span>
                    {language === 'bn' ? 'সংযোগ হচ্ছে...' : 'Connecting...'}
                  </div>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    {language === 'bn' ? 'যুক্ত হোন' : 'Join Voice Room'}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inner Component for LiveKit Participants
function ConferenceStage() {
  const participants = useParticipants();
  const { language } = useSociety();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {participants.map((p) => (
        <div key={p.identity} className="bg-neutral-900 border border-emerald-900/50 rounded-2xl overflow-hidden shadow-xl aspect-square relative flex flex-col items-center justify-center group hover:border-[#D4AF37]/50 transition-all">
          
          <div className={`absolute inset-0 bg-emerald-500/5 opacity-0 ${p.isSpeaking ? 'opacity-100 animate-pulse' : ''} transition-opacity`}></div>
          
          <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-black bg-neutral-800 ${p.isSpeaking ? 'ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border border-neutral-700'}`}>
            <span className="text-white drop-shadow-md">
              {p.name ? p.name.charAt(0).toUpperCase() : '?'}
            </span>
          </div>
          
          <div className="mt-4 text-center px-2 relative z-10 w-full">
            <p className="text-white text-xs font-bold truncate tracking-tight">{p.name || p.identity}</p>
            <p className="text-[9px] text-slate-400 font-mono">
              {p.isLocal ? (language === 'bn' ? 'আপনি' : 'You') : 'Participant'}
            </p>
          </div>

          <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 border border-white/5">
            {!p.isMicrophoneEnabled ? (
               <MicOff className="h-3 w-3 text-rose-500" />
            ) : (
               <Mic className={`h-3 w-3 ${p.isSpeaking ? 'text-emerald-400' : 'text-slate-400'}`} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
