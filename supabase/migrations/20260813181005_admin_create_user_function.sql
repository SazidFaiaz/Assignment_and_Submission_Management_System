/*
# Admin user creation function

1. Purpose
- Admins need to create new user accounts with specific roles (teacher, admin, student).
- The frontend client uses the anon key and cannot call supabase.auth.admin.createUser.
- This SECURITY DEFINER function allows an admin to create a new auth user and profile in one call.

2. Security
- The function checks that the caller is an admin via app_role().
- It creates the auth user with a bcrypt-hashed password and a corresponding identity row.
- It creates the profile with the specified role.
- EXECUTE is revoked from anon and granted to authenticated only.
*/

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
BEGIN
  -- Authorize the caller
  v_role := public.app_role();
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'teacher', 'student') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  -- Validate password length
  IF length(p_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(p_email)) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();

  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  VALUES (
    v_user_id,
    (SELECT id FROM auth.instances LIMIT 1),
    'authenticated',
    'authenticated',
    lower(p_email),
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name)
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email), 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  );

  -- Insert profile (upsert in case trigger already created it)
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_user_id, lower(p_email), p_full_name, p_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  RETURN v_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text) TO authenticated;
