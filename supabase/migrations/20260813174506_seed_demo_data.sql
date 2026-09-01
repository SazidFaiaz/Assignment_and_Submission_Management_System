/*
# Seed demo data for the assignment management system

1. Purpose
- Creates three demo accounts (admin, teacher, student) with known passwords.
- Creates two sample courses with teacher and student enrollments.
- Creates sample assignments and a submission for demonstration.

2. Accounts created
- admin@school.edu / admin123 (admin role)
- teacher@school.edu / teacher123 (teacher role)
- student@school.edu / student123 (student role)

3. Notes
- Auth users are created with crypt-hashed passwords directly in auth.users.
- Profiles are linked to the auth users by id.
- This migration is safe to re-run (uses IF NOT EXISTS / ON CONFLICT).
- Passwords are demo-only and documented in the README.
*/

-- Helper to check if user exists
DO $$
BEGIN
  -- Admin user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@school.edu') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      'a0000000-0000-4000-8000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@school.edu',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Administrator"}'
    );
  END IF;

  -- Teacher user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher@school.edu') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      'a0000000-0000-4000-8000-000000000002',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'teacher@school.edu',
      crypt('teacher123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Professor Sarah Chen"}'
    );
  END IF;

  -- Student user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@school.edu') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      'a0000000-0000-4000-8000-000000000003',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'student@school.edu',
      crypt('student123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Alex Johnson"}'
    );
  END IF;
END $$;

-- Insert profiles (upsert to avoid conflicts)
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'admin@school.edu', 'System Administrator', 'admin'),
  ('a0000000-0000-4000-8000-000000000002', 'teacher@school.edu', 'Professor Sarah Chen', 'teacher'),
  ('a0000000-0000-4000-8000-000000000003', 'student@school.edu', 'Alex Johnson', 'student')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Create sample courses
INSERT INTO public.courses (id, code, name, department, term)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'CS101', 'Introduction to Computer Science', 'Computer Science', 'Fall 2026'),
  ('c0000000-0000-4000-8000-000000000002', 'MATH201', 'Calculus II', 'Mathematics', 'Fall 2026')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  term = EXCLUDED.term;

-- Assign teacher to courses
INSERT INTO public.course_members (course_id, user_id, member_role)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'teacher'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'teacher')
ON CONFLICT (course_id, user_id) DO NOTHING;

-- Enroll student in courses
INSERT INTO public.course_members (course_id, user_id, member_role)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'student'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'student')
ON CONFLICT (course_id, user_id) DO NOTHING;

-- Create sample assignments (teacher_id references the teacher profile)
INSERT INTO public.assignments (id, course_id, teacher_id, title, description, deadline, max_marks, status)
VALUES
  (
    'd0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    'Algorithm Design Essay',
    'Write a 1500-word essay discussing the importance of algorithm efficiency in modern software development. Cover time complexity, space complexity, and real-world examples of how algorithm choice impacts performance.',
    (now() + interval '14 days')::timestamptz,
    100,
    'published'
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    'Data Structures Implementation',
    'Implement a balanced binary search tree (AVL tree) in your preferred programming language. Include insertion, deletion, and search operations. Submit your source code with comments explaining the rotation logic.',
    (now() + interval '7 days')::timestamptz,
    50,
    'published'
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    'Integration Techniques Problem Set',
    'Solve problems 1-10 from Chapter 7. Show all work including substitution methods, integration by parts, and partial fractions. Submit your solutions as a single document.',
    (now() + interval '10 days')::timestamptz,
    75,
    'published'
  ),
  (
    'd0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    'Final Project Proposal',
    'Submit a one-page proposal for your final project. Include the problem statement, proposed approach, and expected outcomes. This will be reviewed before you begin implementation.',
    (now() + interval '21 days')::timestamptz,
    25,
    'draft'
  )
ON CONFLICT (id) DO NOTHING;

-- Create a sample submission from the student
INSERT INTO public.submissions (id, assignment_id, student_id, answer, status, marks, feedback)
VALUES
  (
    'e0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000003',
    'Algorithm efficiency is a cornerstone of modern software development. In this essay, I will explore the significance of time and space complexity, demonstrating how the choice of algorithm can dramatically affect application performance...

Time complexity, expressed using Big O notation, describes how an algorithm''s runtime scales with input size. For example, a linear search (O(n)) may be acceptable for small datasets but becomes prohibitively slow for millions of records, where a binary search (O(log n)) would be far more efficient.

Space complexity is equally important, especially in memory-constrained environments like mobile devices or embedded systems. An algorithm that uses O(n) auxiliary space may be impractical when working with large datasets on devices with limited RAM.

Real-world examples abound: Google''s PageRank algorithm, database indexing with B-trees, and compression algorithms like LZ77 all demonstrate how algorithmic efficiency directly impacts user experience and system scalability.',
    'submitted',
    NULL,
    NULL
  )
ON CONFLICT (id) DO NOTHING;
