import { useEffect, useState, useCallback } from 'react';
import { AuthProvider } from "../context/AuthContext";
import { AppLayout, PageHeader } from '@/components/AppLayout';
import { Button, Badge, Card, Input, Textarea, Select, EmptyState } from '@/components/ui';
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  Users,
  Plus,
  Trash2,
  Pencil,
  X,
  Activity,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import { supabase, type Doctor, type Department, type Profile, WEEKDAYS } from '@/lib/supabase';

const navItems = [
  { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Doctors', page: 'doctors', icon: Stethoscope },
  { label: 'Departments', page: 'departments', icon: Building2 },
  { label: 'Patients', page: 'patients', icon: Users },
];

export function AdminPortal() {
  const [page, setPage] = useState('dashboard');
  const [stats, setStats] = useState({ doctors: 0, patients: 0, departments: 0, appointments: 0 });

  const loadStats = useCallback(async () => {
    const [{ count: docs }, { count: pats }, { count: depts }, { count: apts }] = await Promise.all([
      supabase.from('doctors').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('departments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
    ]);
    setStats({ doctors: docs ?? 0, patients: pats ?? 0, departments: depts ?? 0, appointments: apts ?? 0 });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <AppLayout navItems={navItems} currentPage={page} onNavigate={setPage} portalName="Admin Dashboard">
      {page === 'dashboard' && <AdminDashboard stats={stats} />}
      {page === 'doctors' && <ManageDoctors onChanged={loadStats} />}
      {page === 'departments' && <ManageDepartments onChanged={loadStats} />}
      {page === 'patients' && <ManagePatients />}
    </AppLayout>
  );
}

function AdminDashboard({ stats }: { stats: { doctors: number; patients: number; departments: number; appointments: number } }) {
  const [recent, setRecent] = useState<{ status: string; appointment_date: string; doctor: { full_name: string } | null; patient: { full_name: string } | null }[]>([]);

  useEffect(() => {
    supabase
      .from('appointments')
      .select('status, appointment_date, doctor:doctors(full_name), patient:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        const typed = (data ?? []).map((row: { status: string; appointment_date: string; doctor: { full_name: string } | { full_name: string }[] | null; patient: { full_name: string } | { full_name: string }[] | null }) => ({
          status: row.status,
          appointment_date: row.appointment_date,
          doctor: Array.isArray(row.doctor) ? row.doctor[0] ?? null : row.doctor,
          patient: Array.isArray(row.patient) ? row.patient[0] ?? null : row.patient,
        }));
        setRecent(typed);
      });
  }, []);

  const cards = [
    { label: 'Doctors', value: stats.doctors, icon: Stethoscope, color: 'bg-teal-50 text-teal-600' },
    { label: 'Patients', value: stats.patients, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Departments', value: stats.departments, icon: Building2, color: 'bg-violet-50 text-violet-600' },
    { label: 'Appointments', value: stats.appointments, icon: CalendarDays, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Hospital-wide overview and statistics" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{c.value}</div>
                <div className="text-sm text-slate-500">{c.label}</div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.color}`}>
                <c.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Activity className="h-4 w-4 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No recent appointments</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {a.patient?.full_name || 'Patient'} → Dr. {a.doctor?.full_name || 'Doctor'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(a.appointment_date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <Badge color={a.status === 'completed' ? 'green' : a.status === 'cancelled' ? 'rose' : a.status === 'confirmed' ? 'blue' : 'amber'}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ManageDoctors({ onChanged }: { onChanged: () => void }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [{ data: docs }, { data: depts }] = await Promise.all([
      supabase.from('doctors').select('*, department:departments(*)').order('full_name'),
      supabase.from('departments').select('*').order('name'),
    ]);
    setDoctors((docs as Doctor[]) ?? []);
    setDepartments((depts as Department[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function removeDoctor(id: string) {
    if (!confirm('Remove this doctor? This will also delete their appointments.')) return;
    await supabase.from('doctors').delete().eq('id', id);
    load();
    onChanged();
  }

  if (loading) return <div className="text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Manage Doctors"
        subtitle={`${doctors.length} doctors in the system`}
        action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add doctor</Button>}
      />

      {doctors.length === 0 ? (
        <EmptyState icon={<Stethoscope className="h-10 w-10" />} title="No doctors yet" description="Add your first doctor to get started" action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add doctor</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {doctors.map((doc) => (
            <Card key={doc.id} className="p-5">
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
                <Badge color={doc.status === 'active' ? 'green' : 'slate'}>{doc.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="h-3.5 w-3.5" />
                {doc.department?.name || 'No department'}
                <DollarSign className="ml-2 h-3.5 w-3.5" />
                {doc.consultation_fee > 0 ? `$${doc.consultation_fee}` : 'Free'}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {doc.availability_days.map((d) => (
                  <Badge key={d} color="slate">{d.slice(0, 3)}</Badge>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(doc)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => removeDoctor(doc.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <DoctorForm
          doctor={editing}
          departments={departments}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); onChanged(); }}
        />
      )}
    </div>
  );
}

function DoctorForm({
  doctor,
  departments,
  onClose,
  onSaved,
}: {
  doctor: Doctor | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [full_name, setFullName] = useState(doctor?.full_name || '');
  const [specialization, setSpecialization] = useState(doctor?.specialization || 'General');
  const [bio, setBio] = useState(doctor?.bio || '');
  const [fee, setFee] = useState(String(doctor?.consultation_fee || 0));
  const [deptId, setDeptId] = useState(doctor?.department_id || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(doctor?.status || 'active');
  const [days, setDays] = useState<string[]>(doctor?.availability_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [saving, setSaving] = useState(false);

  function toggleDay(d: string) {
    setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  }

  async function save() {
    setSaving(true);
    const payload = {
      full_name,
      specialization,
      bio,
      consultation_fee: parseFloat(fee) || 0,
      department_id: deptId || null,
      availability_days: days,
      status,
    };
    if (doctor) {
      await supabase.from('doctors').update(payload).eq('id', doctor.id);
    } else {
      await supabase.from('doctors').insert(payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <Card className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{doctor ? 'Edit Doctor' : 'Add Doctor'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 space-y-4">
          <Input label="Full name" value={full_name} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Smith" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
            <Select label="Department" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Consultation fee ($)" type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <Textarea label="Bio" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Available days</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${days.includes(d) ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={saving} onClick={save} disabled={!full_name.trim()}>{doctor ? 'Save changes' : 'Add doctor'}</Button>
        </div>
      </Card>
    </div>
  );
}

function ManageDepartments({ onChanged }: { onChanged: () => void }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    setDepartments(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('departments').insert({ name: name.trim(), description: desc });
    if (!error) {
      setName('');
      setDesc('');
      load();
      onChanged();
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Remove this department?')) return;
    await supabase.from('departments').delete().eq('id', id);
    load();
    onChanged();
  }

  return (
    <div>
      <PageHeader title="Departments" subtitle="Manage hospital departments" />

      <Card className="mb-6 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Add New Department</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <Input placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Button loading={saving} onClick={add}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </Card>

      {loading ? (
        <div className="text-center text-sm text-slate-400">Loading...</div>
      ) : departments.length === 0 ? (
        <EmptyState icon={<Building2 className="h-10 w-10" />} title="No departments" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{d.name}</h3>
                    {d.description && <p className="text-xs text-slate-500">{d.description}</p>}
                  </div>
                </div>
                <button onClick={() => remove(d.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ManagePatients() {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'patient').order('created_at', { ascending: false }).then(({ data }) => {
      setPatients((data as Profile[]) ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = patients.filter((p) => !search || p.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Patients" subtitle={`${patients.length} registered patients`} />

      <Card className="mb-5 p-4">
        <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {loading ? (
        <div className="text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title="No patients found" />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                    {(p.full_name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{p.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-slate-400">{p.phone || 'No phone'}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Joined {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
