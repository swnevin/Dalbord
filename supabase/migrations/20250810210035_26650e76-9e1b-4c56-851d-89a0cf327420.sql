-- Update delete_user function to allow organizational administrators
-- to delete users in their organization using the can_administer_user function
CREATE OR REPLACE FUNCTION public.delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user can administer the target user
  -- This includes global admins and organizational admins with administrator tab permission
  IF NOT public.can_administer_user(user_id) THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Delete the user from auth.users (this will cascade to profiles due to FK)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;