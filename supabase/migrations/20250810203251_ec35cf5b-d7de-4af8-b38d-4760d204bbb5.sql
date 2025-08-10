-- Clean up duplicate RLS policies only
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can read their own permissions" ON public.user_tab_permissions;
DROP POLICY IF EXISTS "Administrators can manage all permissions" ON public.user_tab_permissions;
DROP POLICY IF EXISTS "Administrators can insert tab permissions" ON public.user_tab_permissions;
DROP POLICY IF EXISTS "Administrators can manage existing tab permissions" ON public.user_tab_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_tab_permissions;

-- Create clean, non-conflicting policies
CREATE POLICY "Users can view their own tab permissions" 
ON public.user_tab_permissions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Administrators can manage all tab permissions" 
ON public.user_tab_permissions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));