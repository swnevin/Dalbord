
-- Fix admin user's organization_id back to the Dalai admin organization
UPDATE profiles 
SET organization_id = 'f8796b61-37a1-4727-8e4e-e6262a1a8185'
WHERE email = 'simen@dalai.no';

-- Also check and fix any other admin users that might have been affected
UPDATE profiles 
SET organization_id = 'f8796b61-37a1-4727-8e4e-e6262a1a8185'
WHERE role = 'admin' AND organization_id != 'f8796b61-37a1-4727-8e4e-e6262a1a8185';
