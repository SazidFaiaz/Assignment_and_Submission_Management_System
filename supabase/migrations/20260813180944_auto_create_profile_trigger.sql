/*
# Auto-create profile on user signup

1. Purpose
- When a new user signs up via Supabase Auth, a corresponding profile row should be created automatically.
- This eliminates the race condition where the frontend tries to insert a profile before the auth session is fully established.

2. Changes
- Creates a trigger function `handle_new_user` that inserts a profile row with the default 'student' role.
- Attaches the trigger to `auth.users` AFTER INSERT.
- The trigger is SECURITY DEFINER so it can write to public.profiles regardless of the caller's role.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
