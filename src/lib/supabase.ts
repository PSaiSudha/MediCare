import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string | null;
  department_id: string | null;
  full_name: string;
  specialization: string;
  bio: string;
  consultation_fee: number;
  availability_days: string[];
  status: 'active' | 'inactive';
  created_at: string;
  department?: Department | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  time_slot: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  doctor?: Doctor | null;
  patient?: Profile | null;
}

export interface Prescription {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  medications: { name: string; dosage: string; instructions: string }[];
  notes: string;
  created_at: string;
  doctor?: Doctor | null;
}

export const TIME_SLOTS = [
  '09:00-09:30',
  '09:30-10:00',
  '10:00-10:30',
  '10:30-11:00',
  '11:00-11:30',
  '11:30-12:00',
  '14:00-14:30',
  '14:30-15:00',
  '15:00-15:30',
  '15:30-16:00',
  '16:00-16:30',
  '16:30-17:00',
];

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
