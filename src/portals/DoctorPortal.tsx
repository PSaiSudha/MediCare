import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppLayout, PageHeader } from '@/components/AppLayout';
import { Button, Badge, Card, Input, Textarea, Select, EmptyState } from '@/components/ui';
import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { supabase, type Doctor, type Appointment, type Prescription } from '@/lib/supabase';

const navItems = [
  { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Schedule', page: 'schedule', icon: CalendarDays },
  { label: 'My Profile', page: 'profile', icon: Stethoscope },
];

const statusBadge = {
  pending: { color: 'amber' as const, label: 'Pending' },
  confirmed: { color: 'blue' as const, label: 'Confirmed' },
  completed: { color: 'green' as const, label: 'Completed' },
  cancelled: { color: 'rose' as const, label: 'Cancelled' },
};

export function DoctorPortal() {
  const { profile } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0 });

  const loadDoctor = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('doctors')
      .select('*, department:departments(*)')
      .eq('user_id', profile.id)
      .maybeSingle();
    setDoctor(data as Doctor | null);
  }, [profile]);

  const loadStats = useCallback(async () => {
    if (!doctor) return;
    const today = new Date().toISOString().split('T')[0];
    const [{ count: todayCount }, { count: pending }, { count: completed }] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', doctor.id).eq('appointment_date', today).in('status', ['pending', 'confirmed']),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', doctor.id).eq('status', 'pending'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', doctor.id).eq('status', 'completed'),
    ]);
    setStats({ today: todayCount ?? 0, pending: pending ?? 0, completed: completed ?? 0 });
  }, [doctor]);

  useEffect(() => {
    loadDoctor();
  }, [loadDoctor]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <AppLayout navItems={navItems} currentPage={page} onNavigate={setPage} portalName="Doctor Portal">
      {page === 'dashboard' && <DoctorDashboard doctor={doctor} stats={stats} onNavigate={setPage} />}
      {page === 'schedule' && <DoctorSchedule doctor={doctor} onChanged={loadStats} />}
      {page === 'profile' && <DoctorProfile doctor={doctor} onUpdated={loadDoctor} />}
    </AppLayout>
  );
}

function DoctorDashboard({
  doctor,
  stats,
  onNavigate,
}: {
  doctor: Doctor | null;
  stats: { today: number; pending: number; completed: number };
  onNavigate: (p: string) => void;
}) {
  const { profile } = useAuth();
  const cards = [
    { label: "Today's Appointments", value: stats.today, icon: CalendarDays, color: 'bg-teal-50 text-teal-600' },
    { label: 'Pending Requests', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Completed Visits', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div>
      <PageHeader title={`Dr. ${profile?.full_name?.split(' ')[0] || 'Doctor'}`} subtitle={doctor?.specialization || 'Set up your profile to get started'} />

      {!doctor && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm text-amber-800">
            Your doctor profile is being set up. Visit "My Profile" to update your specialization and availability.
          </p>
        </Card>
      )}

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
        <Button onClick={() => onNavigate('schedule')}>
          <CalendarDays className="h-4 w-4" /> View full schedule
        </Button>
      </div>
    </div>
  );
}

function DoctorSchedule({ doctor, onChanged }: { doctor: Doctor | null; onChanged: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  const load = useCallback(async () => {
    if (!doctor) return;
    let query = supabase
      .from('appointments')
      .select('*, patient:profiles(*)')
      .eq('doctor_id', doctor.id)
      .order('appointment_date', { ascending: true })
      .order('time_slot', { ascending: true });
    if (filterDate) query = query.eq('appointment_date', filterDate);
    const { data } = await query;
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  }, [doctor, filterDate]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: Appointment['status']) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (!error) {
      load();
      onChanged();
    }
  }

  if (!doctor) return <EmptyState icon={<Stethoscope className="h-10 w-10" />} title="Profile not set up" description="Complete your profile to manage appointments" />;

  return (
    <div>
      <PageHeader
        title="Appointment Schedule"
        subtitle="Manage your patient appointments"
        action={
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-auto" />
        }
      />

      {loading ? (
        <div className="text-center text-sm text-slate-400">Loading...</div>
      ) : appointments.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="No appointments" description="Your scheduled appointments will appear here" />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const s = statusBadge[apt.status];
            const isActive = apt.status === 'pending' || apt.status === 'confirmed';
            return (
              <Card key={apt.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{apt.patient?.full_name || 'Patient'}</div>
                      <div className="text-xs text-slate-400">{apt.patient?.phone || 'No phone'}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(apt.appointment_date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        <Clock className="ml-1 h-3.5 w-3.5" />
                        {apt.time_slot}
                      </div>
                      {apt.reason && <p className="mt-2 max-w-md text-sm text-slate-500">{apt.reason}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge color={s.color}>{s.label}</Badge>
                    {isActive && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, 'cancelled')}>
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </Button>
                        <Button size="sm" onClick={() => updateStatus(apt.id, 'completed')}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                        </Button>
                      </div>
                    )}
                    {apt.status === 'completed' && (
                      <PrescriptionButton apt={apt} doctor={doctor} onSaved={load} />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PrescriptionButton({ apt, doctor, onSaved }: { apt: Appointment; doctor: Doctor; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [meds, setMeds] = useState<{ name: string; dosage: string; instructions: string }[]>([{ name: '', dosage: '', instructions: '' }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Prescription | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('appointment_id', apt.id)
        .maybeSingle();
      if (data) {
        setExisting(data as Prescription);
        setMeds(data.medications.length > 0 ? data.medications : [{ name: '', dosage: '', instructions: '' }]);
        setNotes(data.notes || '');
      }
    })();
  }, [open, apt.id]);

  async function save() {
    setSaving(true);
    const payload = {
      appointment_id: apt.id,
      doctor_id: doctor.id,
      patient_id: apt.patient_id,
      medications: meds.filter((m) => m.name.trim()),
      notes,
    };
    if (existing) {
      await supabase.from('prescriptions').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('prescriptions').insert(payload);
    }
    setSaving(false);
    setOpen(false);
    onSaved();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FileText className="h-3.5 w-3.5" /> {existing ? 'Edit Rx' : 'Add Rx'}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <Card className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-slate-900">Prescription</h3>
            <p className="mt-0.5 text-sm text-slate-500">For {apt.patient?.full_name}</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Medications</h4>
                <Button size="sm" variant="ghost" onClick={() => setMeds([...meds, { name: '', dosage: '', instructions: '' }])}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {meds.map((m, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Medication {i + 1}</span>
                    {meds.length > 1 && (
                      <button onClick={() => setMeds(meds.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input placeholder="Medicine name" value={m.name} onChange={(e) => { const c = [...meds]; c[i] = { ...c[i], name: e.target.value }; setMeds(c); }} />
                    <Input placeholder="Dosage (e.g. 500mg, 2x daily)" value={m.dosage} onChange={(e) => { const c = [...meds]; c[i] = { ...c[i], dosage: e.target.value }; setMeds(c); }} />
                  </div>
                  <Input className="mt-2" placeholder="Instructions (optional)" value={m.instructions} onChange={(e) => { const c = [...meds]; c[i] = { ...c[i], instructions: e.target.value }; setMeds(c); }} />
                </div>
              ))}
              <Textarea label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes for the patient..." />
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={save}>Save prescription</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function DoctorProfile({ doctor, onUpdated }: { doctor: Doctor | null; onUpdated: () => void }) {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [full_name, setFullName] = useState(doctor?.full_name || '');
  const [specialization, setSpecialization] = useState(doctor?.specialization || 'General');
  const [bio, setBio] = useState(doctor?.bio || '');
  const [fee, setFee] = useState(String(doctor?.consultation_fee || 0));
  const [deptId, setDeptId] = useState(doctor?.department_id || '');
  const [days, setDays] = useState<string[]>(doctor?.availability_days || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    supabase.from('departments').select('id, name').order('name').then(({ data }) => setDepartments(data ?? []));
  }, []);

  useEffect(() => {
    if (doctor) {
      setFullName(doctor.full_name);
      setSpecialization(doctor.specialization);
      setBio(doctor.bio);
      setFee(String(doctor.consultation_fee));
      setDeptId(doctor.department_id || '');
      setDays(doctor.availability_days);
    }
  }, [doctor]);

  function toggleDay(d: string) {
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const payload = {
      full_name,
      specialization,
      bio,
      consultation_fee: parseFloat(fee) || 0,
      department_id: deptId || null,
      availability_days: days,
    };
    if (doctor) {
      await supabase.from('doctors').update(payload).eq('id', doctor.id);
    }
    setSaving(false);
    setSaved(true);
    onUpdated();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Update your professional information and availability" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="space-y-4">
            <Input label="Full name" value={full_name} onChange={(e) => setFullName(e.target.value)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
              <Select label="Department" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
            <Input label="Consultation fee ($)" type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
            <Textarea label="Bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell patients about your experience and expertise..." />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Available days</label>
              <div className="flex flex-wrap gap-2">
                {dayNames.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      days.includes(d) ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {saved && (
              <div className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                Profile updated successfully
              </div>
            )}
            <Button loading={saving} onClick={save}>Save changes</Button>
          </div>
        </Card>

        <Card className="h-fit p-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-xl font-bold text-teal-700">
              {(full_name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">Dr. {full_name}</h3>
            <p className="text-sm text-teal-600">{specialization}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {days.map((d) => (
                <Badge key={d} color="teal">{d.slice(0, 3)}</Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
