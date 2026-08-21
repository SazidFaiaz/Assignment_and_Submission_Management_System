/*
# Add missing auth identities for seeded demo users

1. Problem
- The seed migration created auth.users rows but did not create corresponding rows in auth.identities.
- GoTrue (Supabase Auth) requires an identity row for each user to authenticate via password grant.
- Without it, login returns 500 "Database error querying schema".

2. Fix
- Insert identity rows for all three demo users with provider 'email'.
- The identity_data jsonb must contain the email and email_verified fields.
- The email column is generated, so we do not insert it directly.
- Safe to re-run (IF NOT EXISTS check).
*/

INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000001', 'email', 'admin@school.edu', 'email_verified', true),
  'email',
  now(),
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'a0000000-0000-4000-8000-000000000001');

INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000002',
  jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'email', 'teacher@school.edu', 'email_verified', true),
  'email',
  now(),
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'a0000000-0000-4000-8000-000000000002');

INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  'a0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000003',
  jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000003', 'email', 'student@school.edu', 'email_verified', true),
  'email',
  now(),
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'a0000000-0000-4000-8000-000000000003');
