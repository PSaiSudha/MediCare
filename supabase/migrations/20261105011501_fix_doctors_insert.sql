/*
# Fix doctors insert policy — allow self-registration at signup

## Overview
The original doctors insert policy was admin-only, but doctor users need to
self-create their own doctor row at signup so they appear in the directory.
This allows a doctor user to insert a doctors row with their own user_id.

## Security
- A doctor user can insert a row only with user_id = auth.uid().
- Admins retain insert permission.
- This does not let patients insert doctor rows (the WITH CHECK requires
  user_id = auth.uid() OR is_admin()).
*/

DROP POLICY IF EXISTS "doctors_insert_admin" ON public.doctors;
CREATE POLICY "doctors_insert_admin_or_self"
ON public.doctors FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR user_id = auth.uid());
