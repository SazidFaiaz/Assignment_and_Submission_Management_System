/*
# Fix profiles update policy for admin role changes

1. Problem
- The existing `profiles_update_self_name` policy only allows users to update their own row (id = auth.uid()).
- Admins need to update other users' roles, but this policy blocks them.
- The WITH CHECK also prevents role changes because it requires the role to remain the same.

2. Fix
- Drop the old `profiles_update_self_name` policy.
- Create two new UPDATE policies:
  - `profiles_update_self`: users can update their own profile (but not their role).
  - `profiles_update_admin`: admins can update any profile including role changes.
- Use column-level privileges to prevent non-admins from changing the role column.
*/

DROP POLICY IF EXISTS "profiles_update_self_name" ON public.profiles;

-- Users can update their own profile, but NOT the role column (enforced by column grant)
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can update any profile including role
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
TO authenticated
USING (app_role() = 'admin')
WITH CHECK (app_role() = 'admin');

-- Revoke UPDATE on the role column from authenticated, grant only to admins via the admin policy
-- Actually, column-level privileges are checked before policies, so we need to be careful.
-- The admin policy allows the update, but column privileges could still block it.
-- Instead, let's use a SECURITY DEFINER function for role changes.
-- For now, the admin policy should work since it's permissive (OR with the self policy).

-- Actually, both policies are permissive, so if EITHER passes, the update is allowed.
-- The self policy allows updating own row (any column), and the admin policy allows admin to update any row (any column).
-- To prevent non-admins from changing their own role, we need a column-level grant.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

-- But now admins can't update role either via the data API because column privileges are checked first.
-- So we need a SECURITY DEFINER function for admin role changes.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.app_role() <> 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('admin', 'teacher', 'student') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
