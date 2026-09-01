-- Fix infinite recursion in user_tab_permissions RLS
-- Drop the problematic policy that causes circular reference
DROP POLICY IF EXISTS "Administrators can manage tab permissions" ON public.user_tab_permissions;

-- Create a security definer function to check if user can administer another user
-- This avoids circular reference by bypassing RLS when checking permissions
CREATE OR REPLACE FUNCTION public.can_administer_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  current_user_org_id uuid;
  target_user_org_id uuid;
  has_admin_tab boolean := false;
BEGIN
  -- Get current user's role and organization
  SELECT role, organization_id INTO current_user_role, current_user_org_id
  FROM profiles WHERE id = auth.uid();
  
  -- If current user is global admin, they can administer anyone
  IF current_user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Get target user's organization
  SELECT organization_id INTO target_user_org_id
  FROM profiles WHERE id = target_user_id;
  
  -- Check if current user has administrator tab permission
  SELECT EXISTS(
    SELECT 1 FROM user_tab_permissions 
    WHERE user_id = auth.uid() AND tab_name = 'administrator'
  ) INTO has_admin_tab;
  
  -- If same organization and has admin tab, can administer
  IF current_user_org_id = target_user_org_id AND has_admin_tab THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create new simplified policy using the security definer function
CREATE POLICY "Administrators can manage tab permissions" 
ON public.user_tab_permissions 
FOR ALL 
USING (public.can_administer_user(user_tab_permissions.user_id))
WITH CHECK (public.can_administer_user(user_tab_permissions.user_id));