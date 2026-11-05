/*
# Hospital Management System — Part 2: Tables, policies, doctor helper

## Overview
Creates all tables for the hospital system with RLS policies.

## New Tables
1. profiles — id (FK auth.users), role, full_name, phone, created_at.
2. departments — id, name (unique), description, created_at.
3. doctors — id, user_id (FK auth.users), department_id, full_name,
   specialization, bio, consultation_fee, availability_days, status, created_at.
4. appointments — id, patient_id, doctor_id, appointment_date, time_slot, reason,
   status, created_at. Partial unique index prevents double-booking.
5. prescriptions — id, appointment_id, doctor_id, patient_id, medications (jsonb),
   notes, created_at.

## Security
- RLS on every table; grants scoped to authenticated (sign-in required).
- profiles: owner + admin read/update; owner insert.
- departments: all read; admin-only writes.
- doctors: all read; admin insert/delete; admin or linked-user update.
- appointments: patient/doctor/admin visibility; patient insert (pending only);
  patient/doctor/admin update; patient/admin delete.
- prescriptions: patient/doctor/admin read; doctor insert+update; admin delete.

## New Function
- current_doctor_id() returns doctors.id for the current user (created after the
  doctors table exists).
*/

-- ============================================================
-- profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'patient' CHECK (role IN ('patient','doctor','admin')),
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- ============================================================
-- departments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;

DROP POLICY IF EXISTS "departments_select_all" ON public.departments;
CREATE POLICY "departments_select_all"
ON public.departments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "departments_insert_admin" ON public.departments;
CREATE POLICY "departments_insert_admin"
ON public.departments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "departments_update_admin" ON public.departments;
CREATE POLICY "departments_update_admin"
ON public.departments FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "departments_delete_admin" ON public.departments;
CREATE POLICY "departments_delete_admin"
ON public.departments FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- doctors
-- ============================================================

CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  specialization text NOT NULL DEFAULT 'General',
  bio text DEFAULT '',
  consultation_fee numeric(10,2) NOT NULL DEFAULT 0,
  availability_days text[] NOT NULL DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;

DROP POLICY IF EXISTS "doctors_select_all" ON public.doctors;
CREATE POLICY "doctors_select_all"
ON public.doctors FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "doctors_insert_admin" ON public.doctors;
CREATE POLICY "doctors_insert_admin"
ON public.doctors FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "doctors_update_admin_or_self" ON public.doctors;
CREATE POLICY "doctors_update_admin_or_self"
ON public.doctors FOR UPDATE
TO authenticated
USING (public.is_admin() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "doctors_delete_admin" ON public.doctors;
CREATE POLICY "doctors_delete_admin"
ON public.doctors FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- current_doctor_id helper (after doctors table exists)
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_doctor_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_doctor_id() TO authenticated;

-- ============================================================
-- appointments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  time_slot text NOT NULL,
  reason text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_no_double_booking
ON public.appointments (doctor_id, appointment_date, time_slot)
WHERE status IN ('pending', 'confirmed');

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
CREATE POLICY "appointments_select_own"
ON public.appointments FOR SELECT
TO authenticated
USING (
  patient_id = auth.uid()
  OR doctor_id = public.current_doctor_id()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "appointments_insert_patient" ON public.appointments;
CREATE POLICY "appointments_insert_patient"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  patient_id = auth.uid()
  AND status = 'pending'
);

DROP POLICY IF EXISTS "appointments_update_own" ON public.appointments;
CREATE POLICY "appointments_update_own"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  patient_id = auth.uid()
  OR doctor_id = public.current_doctor_id()
  OR public.is_admin()
)
WITH CHECK (
  patient_id = auth.uid()
  OR doctor_id = public.current_doctor_id()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "appointments_delete_own" ON public.appointments;
CREATE POLICY "appointments_delete_own"
ON public.appointments FOR DELETE
TO authenticated
USING (
  patient_id = auth.uid()
  OR public.is_admin()
);

-- ============================================================
-- prescriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medications jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;

DROP POLICY IF EXISTS "prescriptions_select_own" ON public.prescriptions;
CREATE POLICY "prescriptions_select_own"
ON public.prescriptions FOR SELECT
TO authenticated
USING (
  patient_id = auth.uid()
  OR doctor_id = public.current_doctor_id()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "prescriptions_insert_doctor" ON public.prescriptions;
CREATE POLICY "prescriptions_insert_doctor"
ON public.prescriptions FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id = public.current_doctor_id()
);

DROP POLICY IF EXISTS "prescriptions_update_doctor" ON public.prescriptions;
CREATE POLICY "prescriptions_update_doctor"
ON public.prescriptions FOR UPDATE
TO authenticated
USING (doctor_id = public.current_doctor_id())
WITH CHECK (doctor_id = public.current_doctor_id());

DROP POLICY IF EXISTS "prescriptions_delete_admin" ON public.prescriptions;
CREATE POLICY "prescriptions_delete_admin"
ON public.prescriptions FOR DELETE
TO authenticated
USING (public.is_admin());
