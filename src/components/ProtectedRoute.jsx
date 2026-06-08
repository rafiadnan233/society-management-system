import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { auth } from '../utils/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { ShieldAlert, LogIn, Mail } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useSociety();
  const [loading, setLoading] = React.useState(true);
  const [firebaseUser, setFirebaseUser] = React.useState(null);
  const [verificationSent, setVerificationSent] = React.useState(false);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="font-mono text-xs text-[#D4AF37] uppercase tracking-widest font-bold">Authenticating Connection...</p>
        </div>
      </div>
    );
  }

  // Redirect to Login if unauthenticated
  if (!firebaseUser || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-center animate-fadeIn">
        <div className="max-w-md rounded-2xl border-2 border-emerald-800 bg-neutral-900 p-8 shadow-xl">
          <LogIn className="mx-auto h-12 w-12 text-emerald-500 mb-4 animate-pulse" />
          <h2 className="text-lg font-bold text-white mb-2 font-sans">Identity Authentication Required</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed font-sans">
            Please log in first to establish an authorized connection to the society portal gates.
          </p>
          <button 
            onClick={() => window.location.hash = '#login'}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            Go To Secure Sign-In
          </button>
        </div>
      </div>
    );
  }

  // Verify Email block if they registered but didn't verify yet
  if (!firebaseUser.emailVerified && currentUser.role !== 'Admin') {
    const handleResend = async () => {
      try {
        await sendEmailVerification(firebaseUser);
        setVerificationSent(true);
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-center animate-fadeIn">
        <div className="max-w-md rounded-2xl border-2 border-amber-600/50 bg-neutral-900 p-8 shadow-2xl relative overflow-hidden">
          <span className="absolute -top-12 -left-12 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <Mail className="mx-auto h-12 w-12 text-amber-500 mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-white mb-2 font-sans">Verify Your Email Address</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed font-sans">
            We have dispatched a secure activation email linkage to <strong className="text-emerald-400">{currentUser.email}</strong>. 
            Please check your mailbox (including spam folder) and verify your account to unlock operations.
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleResend}
              disabled={verificationSent}
              className={`w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider cursor-pointer border transition-all ${verificationSent ? 'bg-emerald-950 border-emerald-800 text-emerald-400 font-bold' : 'bg-amber-600/90 border-amber-500 hover:bg-amber-500 text-white'}`}
            >
              {verificationSent ? 'Verification Mail Resubmitted!' : 'Resend Verification Mail'}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full rounded-xl border border-neutral-750 bg-neutral-800 text-slate-300 hover:bg-neutral-750 hover:text-white px-4 py-3 text-xs font-bold uppercase transition-all cursor-pointer"
            >
              I Have Verified (Reload Page)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorize User Role check
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-center">
        <div className="max-w-md rounded-2xl border-2 border-rose-950 bg-neutral-900 p-8 shadow-xl">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <h2 className="text-lg font-bold text-white mb-2 font-sans">Access Level Restricted</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed font-sans">
            Your current credential clearance ({currentUser.role}) does not possess authorization to enter this view section.
          </p>
          <button 
            onClick={() => window.location.hash = '#dashboard'}
            className="w-full rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:text-white px-4 py-3 text-xs font-bold uppercase text-slate-300 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Authorized connection successfully granted
  return children;
}
