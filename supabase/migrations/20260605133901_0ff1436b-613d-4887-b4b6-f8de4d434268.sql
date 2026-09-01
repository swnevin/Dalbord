
-- Fix infinite recursion in profiles RLS policies by using SECURITY DEFINER helpers

CREATE OR REPLACE FUNCTION public.get_current_user_org()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Drop recursive policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (no role escalation)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.profiles;

-- Recreate without self-referencing subqueries
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR organization_id = public.get_current_user_org()
  OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Users can update their own profile (no role escalation)"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = public.get_current_user_role()
  AND organization_id IS NOT DISTINCT FROM public.get_current_user_org()
);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Only admins can delete users"
ON public.profiles FOR DELETE
TO authenticated
USING (public.get_current_user_role() = 'admin');
