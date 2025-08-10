-- Update RLS policies to support organizational administrators
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own tab permissions" ON public.user_tab_permissions;
DROP POLICY IF EXISTS "Administrators can manage all tab permissions" ON public.user_tab_permissions;

-- Create new policies that support both global admins and organizational admins
CREATE POLICY "Users can view their own tab permissions" 
ON public.user_tab_permissions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Administrators can manage tab permissions" 
ON public.user_tab_permissions 
FOR ALL 
USING (
  -- Global admins can manage all
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  -- Organizational admins can manage users in their organization
  (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.id = auth.uid() 
      AND p2.id = user_tab_permissions.user_id
      AND EXISTS (
        SELECT 1 FROM public.user_tab_permissions utp
        WHERE utp.user_id = auth.uid() 
        AND utp.tab_name = 'administrator'
      )
    )
  )
)
WITH CHECK (
  -- Same logic for inserts/updates
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.id = auth.uid() 
      AND p2.id = user_tab_permissions.user_id
      AND EXISTS (
        SELECT 1 FROM public.user_tab_permissions utp
        WHERE utp.user_id = auth.uid() 
        AND utp.tab_name = 'administrator'
      )
    )
  )
);

-- Give the current user administrator tab permissions in their organization
-- First, find the current user's ID and insert administrator permission
INSERT INTO public.user_tab_permissions (user_id, tab_name)
SELECT id, 'administrator'::public.tab_name
FROM public.profiles 
WHERE email = 'sss@o.no'
AND NOT EXISTS (
  SELECT 1 FROM public.user_tab_permissions 
  WHERE user_id = profiles.id AND tab_name = 'administrator'
);