-- Fix user_tab_permissions table constraints and policies
-- 1. Make user_id NOT NULL and add foreign key constraint
ALTER TABLE public.user_tab_permissions 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.user_tab_permissions 
ADD CONSTRAINT user_tab_permissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Clean up duplicate RLS policies
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

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_tab_permissions_user_id 
ON public.user_tab_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_tab_permissions_tab_name 
ON public.user_tab_permissions(tab_name);