import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { ShieldAlert, LogIn } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useSociety();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
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
  if (!currentUser) {
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
