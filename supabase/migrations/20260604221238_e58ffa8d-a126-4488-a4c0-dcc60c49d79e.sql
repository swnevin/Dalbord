
-- ============ profiles: restrict SELECT and lock down role/org on UPDATE ============
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "Users can update their own profile (no role escalation)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============ organizations: hide voiceflow_api_key from non-admins ============
REVOKE SELECT (voiceflow_api_key) ON public.organizations FROM authenticated, anon;

-- ============ conversation_metrics: remove anonymous/permissive inserts ============
DROP POLICY IF EXISTS "Anyone can insert metrics" ON public.conversation_metrics;
DROP POLICY IF EXISTS "Allow insertion with valid organization_id" ON public.conversation_metrics;
DROP POLICY IF EXISTS "Allow authenticated users to insert metrics" ON public.conversation_metrics;

CREATE POLICY "Authenticated members can insert metrics for their organization"
ON public.conversation_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- ============ fallback_requests: remove anonymous insert ============
DROP POLICY IF EXISTS "Allow anonymous insert to fallback_requests" ON public.fallback_requests;

-- ============ functions: set fixed search_path ============
ALTER FUNCTION public.initialize_statistics_preferences(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_organization() SET search_path = public;
ALTER FUNCTION public.handle_new_user_signup() SET search_path = public;
