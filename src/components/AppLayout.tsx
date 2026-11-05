import { type ReactNode, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { HeartPulse, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui';

interface NavItem {
  label: string;
  page: string;
  icon: typeof HeartPulse;
}

interface AppLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  currentPage: string;
  onNavigate: (page: string) => void;
  portalName: string;
  accentColor?: string;
}

export function AppLayout({
  children,
  navItems,
  currentPage,
  onNavigate,
  portalName,
  accentColor = 'teal',
}: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const accentMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700',
    blue: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  const initials = (profile?.full_name || '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/30">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">MediCare</div>
            <div className="text-xs text-slate-400">{portalName}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                currentPage === item.page
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="h-4.5 w-4.5 h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${accentMap[accentColor]}`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">{profile?.full_name}</div>
              <div className="truncate text-xs capitalize text-slate-400">{profile?.role}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <HeartPulse className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">{portalName}</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">MediCare</div>
                  <div className="text-xs text-slate-400">{portalName}</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-2">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setMobileOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    currentPage === item.page
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="border-t border-slate-200 p-3">
              <div className="flex items-center gap-3 rounded-xl px-2 py-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${accentMap[accentColor]}`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{profile?.full_name}</div>
                  <div className="truncate text-xs capitalize text-slate-400">{profile?.role}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
