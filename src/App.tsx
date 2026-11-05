import { useAuth } from '@/context/AuthContext';
import { Landing } from '@/components/Landing';
import { PatientPortal } from '@/portals/PatientPortal';
import { DoctorPortal } from '@/portals/DoctorPortal';
import { AdminPortal } from '@/portals/AdminPortal';
import { HeartPulse } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
          <HeartPulse className="h-6 w-6 animate-pulse" />
        </div>
        <p className="text-sm text-slate-400">Loading MediCare...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!profile) return <Landing />;

  if (profile.role === 'patient') return <PatientPortal />;
  if (profile.role === 'doctor') return <DoctorPortal />;
  if (profile.role === 'admin') return <AdminPortal />;

  return <Landing />;
}
