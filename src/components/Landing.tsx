import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import { Stethoscope, User, Users, Shield, HeartPulse, Calendar, Search, FileText } from 'lucide-react';
import type { UserRole } from '@/lib/supabase';

const roleCards: { role: UserRole; label: string; icon: typeof User; desc: string }[] = [
  { role: 'patient', label: 'Patient', icon: User, desc: 'Book appointments, view history' },
  { role: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'Manage schedule & prescriptions' },
  { role: 'admin', label: 'Admin', icon: Shield, desc: 'Oversee the entire hospital' },
];

export function Landing() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password, role, fullName, phone);
      if (error) setError(error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100">
      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">MediCare</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'Create account' : 'Sign in'}
        </Button>
      </nav>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-8 lg:grid-cols-2 lg:py-16">
        {/* Left — hero */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Comprehensive Hospital Management
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Healthcare,{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              simplified
            </span>{' '}
            for everyone.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
            A unified platform connecting patients, doctors, and administrators.
            Book appointments, manage schedules, and oversee hospital operations —
            all in one place.
          </p>

          <div className="mt-8 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Calendar, label: 'Easy booking' },
              { icon: Search, label: 'Find doctors' },
              { icon: FileText, label: 'Prescriptions' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white/60 p-4 text-center backdrop-blur-sm">
                <f.icon className="h-5 w-5 text-teal-600" />
                <span className="text-xs font-medium text-slate-600">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — auth card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-slate-900">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === 'signin' ? 'Sign in to access your portal' : 'Choose your role to get started'}
              </p>
            </div>

            {mode === 'signup' && (
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">I am a</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleCards.map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setRole(r.role)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                        role === r.role
                          ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <r.icon className={`h-5 w-5 ${role === r.role ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span className={`text-xs font-semibold ${role === r.role ? 'text-teal-700' : 'text-slate-600'}`}>
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center text-xs text-slate-400">
                  {roleCards.find((r) => r.role === role)?.desc}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <Input
                    label="Full name"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </>
              )}
              <Input
                label="Email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />

              {error && (
                <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full">
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="font-semibold text-teal-600 hover:text-teal-700"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white/60 p-6 backdrop-blur-sm sm:grid-cols-4">
          {[
            { label: 'Departments', value: '8+' },
            { label: 'Time slots/day', value: '12' },
            { label: 'User roles', value: '3' },
            { label: 'Secure', value: 'RLS' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
