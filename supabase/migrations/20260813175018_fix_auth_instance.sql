/*
# Fix auth instance for seeded demo users

1. Problem
- The seed migration inserted demo users into auth.users with instance_id '00000000-0000-0000-0000-000000000000'.
- But auth.instances had no row with that id, so the GoTrue auth service returned a 500 ("Database error querying schema") on every login attempt.
- The instance row must exist and match the instance_id on the user rows.

2. Fix
- Insert the missing instance row into auth.instances with the same id used by the seeded users.
- This is safe to re-run (IF NOT EXISTS).
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.instances WHERE id = '00000000-0000-0000-0000-000000000000') THEN
    INSERT INTO auth.instances (id, uuid, raw_base_config, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      '{}',
      now(),
      now()
    );
  END IF;
END $$;
