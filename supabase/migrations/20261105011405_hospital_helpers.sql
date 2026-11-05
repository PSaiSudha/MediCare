/*
# Hospital Management System — Part 1: Helper functions

## Overview
Defines the SECURITY DEFINER helper functions used by RLS policies across the
hospital schema. These must exist before any policy references them.

## Functions
1. `is_admin()` — returns true if the current JWT's app_metadata.role = 'admin'.
2. `current_doctor_id()` — returns the doctors.id for the current auth user, or NULL.
   (References public.doctors, which is created in Part 2; created here with a
   guard so the table existence check happens at call time, not creation time.)

## Security
- Both functions are SECURITY DEFINER, STABLE, with fixed search_path = public.
- EXECUTE revoked from PUBLIC/anon, granted to authenticated only.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
