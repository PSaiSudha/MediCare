import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppLayout, PageHeader } from '@/components/AppLayout';
import { Button, Badge, Card, Input, Select, Textarea, EmptyState } from '@/components/ui';
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  Stethoscope,
  Clock,
  CalendarPlus,
  CalendarX,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { supabase, type Doctor, type Appointment, type Prescription, TIME_SLOTS, WEEKDAYS } from '@/lib/supabase';

const navItems = [
  { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Find a Doctor', page: 'find', icon: Search },
  { label: 'My Appointments', page: 'appointments', icon: CalendarDays },
  { label: 'Medical History', page: 'history', icon: FileText },
];

const statusBadge = {
  pending: { color: 'amber' as const, icon: Clock, label: 'Pending' },
  confirmed: { color: 'blue' as const, icon: CheckCircle2, label: 'Confirmed' },
  completed: { color: 'green' as const, icon: CheckCircle2, label: 'Completed' },
  cancelled: { color: 'rose' as const, icon: XCircle, label: 'Cancelled' },
};

export function PatientPortal() {
  const { profile } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });

  const refreshStats = useCallback(async () => {
    if (!profile) return;
    const { count: total } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', profile.id);
    const { count: upcoming } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', profile.id)
      .in('status', ['pending', 'confirmed']);
    const { count: completed } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', profile.id)
      .eq('status', 'completed');
    setStats({ total: total ?? 0, upcoming: upcoming ?? 0, completed: completed ?? 0 });
  }, [profile]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <AppLayout navItems={navItems} currentPage={page} onNavigate={setPage} portalName="Patient Portal">
      {page === 'dashboard' && <PatientDashboard stats={stats} onNavigate={setPage} />}
      {page === 'find' && <FindDoctor onBooked={refreshStats} />}
      {page === 'appointments' && <MyAppointments onChanged={refreshStats} />}
      {page === 'history' && <MedicalHistory />}
    </AppLayout>
  );
}

function PatientDashboard({
  stats,
  onNavigate,
}: {
  stats: { total: number; upcoming: number; completed: number };
  onNavigate: (p: string) => void;
}) {
  const { profile } = useAuth();
  const cards = [
    { label: 'Total Appointments', value: stats.total, icon: CalendarDays, color: 'bg-teal-50 text-teal-600' },
    { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'bg-blue-50 text-blue-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
  ];
  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'Patient'}`} subtitle="Here's an overview of your healthcare activity" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{c.value}</div>
                <div className="text-sm text-slate-500">{c.label}</div>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2">
            <button onClick={() => onNavigate('find')} className="flex items-center gap-3 bg-white px-5 py-5 text-left transition-colors hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Find a doctor</div>
                <div className="text-xs text-slate-500">Search by specialty or name</div>
              </div>
            </button>
            <button onClick={() => onNavigate('appointments')} className="flex items-center gap-3 bg-white px-5 py-5 text-left transition-colors hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">View appointments</div>
                <div className="text-xs text-slate-500">Manage your upcoming visits</div>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FindDoctor({ onBooked }: { onBooked: () => void }) {
  const { profile } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: docs }, { data: depts }] = await Promise.all([
        supabase.from('doctors').select('*, department:departments(*)').eq('status', 'active').order('full_name'),
        supabase.from('departments').select('id, name').order('name'),
      ]);
      setDoctors((docs as Doctor[]) ?? []);
      setDepartments(depts ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = doctors.filter((d) => {
    const matchesSearch =
      !search ||
      d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || d.department_id === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div>
      <PageHeader title="Find a Doctor" subtitle="Search and book an appointment with a specialist" />

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="text-center text-sm text-slate-400">Loading doctors...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Stethoscope className="h-10 w-10" />} title="No doctors found" description="Try adjusting your search or filters" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((doc) => (
            <Card key={doc.id} className="p-5 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-lg font-bold text-teal-700">
                    {doc.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Dr. {doc.full_name}</h3>
                    <p className="text-sm text-teal-600">{doc.specialization}</p>
                  </div>
                </div>
                {doc.department && <Badge color="slate">{doc.department.name}</Badge>}
              </div>
              {doc.bio && <p className="mt-3 text-sm text-slate-500 line-clamp-2">{doc.bio}</p>}
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {doc.availability_days.slice(0, 3).join(', ')}
                {doc.availability_days.length > 3 && ` +${doc.availability_days.length - 3} more`}
              </div>
              <Button size="sm" className="mt-4 w-full" onClick={() => setBookingDoctor(doc)}>
                <CalendarPlus className="h-4 w-4" /> Book appointment
              </Button>
            </Card>
          ))}
        </div>
      )}

      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          patientId={profile!.id}
          onClose={() => setBookingDoctor(null)}
          onBooked={() => {
            setBookingDoctor(null);
            onBooked();
          }}
        />
      )}
    </div>
  );
}

function BookingModal({
  doctor,
  patientId,
  onClose,
  onBooked,
}: {
  doctor: Doctor;
  patientId: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    (async () => {
      const { data } = await supabase
        .from('appointments')
        .select('time_slot')
        .eq('doctor_id', doctor.id)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed']);
      setBookedSlots((data ?? []).map((a) => a.time_slot));
    })();
  }, [date, doctor.id]);

  const dayName = date ? WEEKDAYS[new Date(date + 'T12:00:00').getDay() === 0 ? 6 : new Date(date + 'T12:00:00').getDay() - 1] : '';
  const isAvailable = !dayName || doctor.availability_days.includes(dayName);

  async function handleBook() {
    if (!date || !slot) {
      setError('Please select a date and time slot');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      doctor_id: doctor.id,
      appointment_date: date,
      time_slot: slot,
      reason,
      status: 'pending',
    });
    setLoading(false);
    if (error) {
      if (error.code === '23505') {
        setError('That slot was just booked. Please choose another time.');
      } else {
        setError(error.message);
      }
      return;
    }
    onBooked();
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900">Book with Dr. {doctor.full_name}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{doctor.specialization}</p>

        <div className="mt-5 space-y-4">
          <Input label="Appointment date" type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setSlot(''); }} />
          {date && !isAvailable && (
            <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700 ring-1 ring-inset ring-amber-600/20">
              The doctor is not available on this day. Please choose a {doctor.availability_days.join(', ')} date.
            </div>
          )}

          {date && isAvailable && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Time slot</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((s) => {
                  const taken = bookedSlots.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={taken}
                      onClick={() => setSlot(s)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                        taken
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                          : slot === s
                            ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                      }`}
                    >
                      {s.split('-')[0]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Greyed slots are already taken</p>
            </div>
          )}

          <Textarea label="Reason for visit (optional)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your symptoms..." />

          {error && (
            <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">{error}</div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} onClick={handleBook} disabled={!date || !slot || !isAvailable}>
            <CalendarPlus className="h-4 w-4" /> Confirm booking
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MyAppointments({ onChanged }: { onChanged: () => void }) {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('appointments')
      .select('*, doctor:doctors(*)')
      .eq('patient_id', profile.id)
      .order('appointment_date', { ascending: false })
      .order('time_slot', { ascending: false });
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelAppointment(id: string) {
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (!error) {
      load();
      onChanged();
    }
  }

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <PageHeader title="My Appointments" subtitle="View and manage your upcoming and past appointments" />

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="No appointments" description="Book your first appointment by finding a doctor" />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => {
            const s = statusBadge[apt.status];
            const isPast = apt.appointment_date < today;
            const canCancel = !isPast && (apt.status === 'pending' || apt.status === 'confirmed');
            return (
              <Card key={apt.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Dr. {apt.doctor?.full_name}</div>
                      <div className="text-sm text-slate-500">{apt.doctor?.specialization}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(apt.appointment_date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        <Clock className="ml-1 h-3.5 w-3.5" />
                        {apt.time_slot}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={s.color}>
                      <s.icon className="mr-1 h-3 w-3" /> {s.label}
                    </Badge>
                    {canCancel && (
                      <Button variant="danger" size="sm" onClick={() => cancelAppointment(apt.id)}>
                        <CalendarX className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
                {apt.reason && <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">{apt.reason}</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MedicalHistory() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [{ data: apts }, { data: rx }] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, doctor:doctors(*)')
          .eq('patient_id', profile.id)
          .eq('status', 'completed')
          .order('appointment_date', { ascending: false }),
        supabase
          .from('prescriptions')
          .select('*, doctor:doctors(*)')
          .eq('patient_id', profile.id)
          .order('created_at', { ascending: false }),
      ]);
      setAppointments((apts as Appointment[]) ?? []);
      setPrescriptions((rx as Prescription[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader title="Medical History" subtitle="Your completed visits and prescriptions" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Completed Visits</h3>
          {appointments.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="No completed visits" />
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <Card key={apt.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">Dr. {apt.doctor?.full_name}</div>
                      <div className="text-xs text-slate-400">{apt.doctor?.specialization}</div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      {new Date(apt.appointment_date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Prescriptions</h3>
          {prescriptions.length === 0 ? (
            <EmptyState icon={<FileText className="h-8 w-8" />} title="No prescriptions yet" />
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <Card key={rx.id} className="cursor-pointer p-4 transition-all hover:shadow-md" >
                  <div onClick={() => setSelectedRx(rx)}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-900">Dr. {rx.doctor?.full_name}</div>
                      <Badge color="teal">{rx.medications.length} meds</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {new Date(rx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRx && <PrescriptionModal rx={selectedRx} onClose={() => setSelectedRx(null)} />}
    </div>
  );
}

function PrescriptionModal({ rx, onClose }: { rx: Prescription; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Prescription</h3>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>Print</Button>
        </div>
        <div className="mt-2 text-sm text-slate-500">
          Dr. {rx.doctor?.full_name} · {new Date(rx.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <div className="mt-5">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Medications</h4>
          <div className="space-y-2">
            {rx.medications.map((m, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="font-medium text-slate-800">{m.name}</div>
                <div className="text-sm text-slate-500">{m.dosage}</div>
                {m.instructions && <div className="mt-1 text-xs text-slate-400">{m.instructions}</div>}
              </div>
            ))}
          </div>
        </div>

        {rx.notes && (
          <div className="mt-4">
            <h4 className="mb-1 text-sm font-semibold text-slate-700">Notes</h4>
            <p className="text-sm text-slate-600">{rx.notes}</p>
          </div>
        )}

        <Button variant="outline" className="mt-6 w-full" onClick={onClose}>Close</Button>
      </Card>
    </div>
  );
}
