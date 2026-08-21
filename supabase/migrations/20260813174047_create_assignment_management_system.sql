/*
# Assignment management system foundation

1. New tables
- `profiles`: application identity, display name, and immutable application role.
- `courses`: classes or courses that teachers and students work within.
- `course_members`: course enrollment and teacher assignment relationships.
- `assignments`: teacher-owned work with publication, deadline, and grading metadata.
- `submissions`: one student submission per assignment with workflow status and feedback.

2. Security
- Row level security is enabled on every table.
- Roles are stored in application metadata and cannot be changed by ordinary users.
- Students can only access published assignments for enrolled courses and their own submissions.
- Teachers can manage assignments for courses they teach and grade submissions for those assignments.
- Admins can view and manage the full school dataset through explicit policies.

3. Important notes
- A profile is created after signup by the application with the default `student` role.
- Admin role changes are intentionally reserved for an administrative server workflow.
- Deadline and assignment publication checks are enforced in submission policies as well as in the interface.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  department text NOT NULL,
  term text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_members (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role text NOT NULL CHECK (member_role IN ('teacher', 'student')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  deadline timestamptz NOT NULL,
  max_marks integer NOT NULL CHECK (max_marks > 0 AND max_marks <= 1000),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  answer text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded', 'returned')),
  marks integer CHECK (marks >= 0),
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS assignments_course_idx ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS assignments_teacher_idx ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS submissions_assignment_idx ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS submissions_student_idx ON public.submissions(student_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "profiles_insert_self_student" ON public.profiles;
CREATE POLICY "profiles_insert_self_student" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() AND role = 'student');
DROP POLICY IF EXISTS "profiles_update_self_name" ON public.profiles;
CREATE POLICY "profiles_update_self_name" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "courses_select_members_or_admin" ON public.courses;
CREATE POLICY "courses_select_members_or_admin" ON public.courses FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.course_members cm WHERE cm.course_id = id AND cm.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "courses_insert_admin" ON public.courses;
CREATE POLICY "courses_insert_admin" ON public.courses FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "courses_update_admin" ON public.courses;
CREATE POLICY "courses_update_admin" ON public.courses FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "courses_delete_admin" ON public.courses;
CREATE POLICY "courses_delete_admin" ON public.courses FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "members_select_related" ON public.course_members;
CREATE POLICY "members_select_related" ON public.course_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') OR EXISTS (SELECT 1 FROM public.course_members cm WHERE cm.course_id = course_id AND cm.user_id = auth.uid() AND cm.member_role = 'teacher'));
DROP POLICY IF EXISTS "members_insert_admin" ON public.course_members;
CREATE POLICY "members_insert_admin" ON public.course_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "members_update_admin" ON public.course_members;
CREATE POLICY "members_update_admin" ON public.course_members FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "members_delete_admin" ON public.course_members;
CREATE POLICY "members_delete_admin" ON public.course_members FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "assignments_select_role_scope" ON public.assignments;
CREATE POLICY "assignments_select_role_scope" ON public.assignments FOR SELECT TO authenticated
USING (teacher_id = auth.uid() OR (status = 'published' AND EXISTS (SELECT 1 FROM public.course_members cm WHERE cm.course_id = assignments.course_id AND cm.user_id = auth.uid())) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "assignments_insert_teacher" ON public.assignments;
CREATE POLICY "assignments_insert_teacher" ON public.assignments FOR INSERT TO authenticated
WITH CHECK (teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM public.course_members cm WHERE cm.course_id = course_id AND cm.user_id = auth.uid() AND cm.member_role = 'teacher'));
DROP POLICY IF EXISTS "assignments_update_teacher" ON public.assignments;
CREATE POLICY "assignments_update_teacher" ON public.assignments FOR UPDATE TO authenticated
USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "assignments_delete_teacher" ON public.assignments;
CREATE POLICY "assignments_delete_teacher" ON public.assignments FOR DELETE TO authenticated
USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "submissions_select_owner_teacher_admin" ON public.submissions;
CREATE POLICY "submissions_select_owner_teacher_admin" ON public.submissions FOR SELECT TO authenticated
USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "submissions_insert_student" ON public.submissions;
CREATE POLICY "submissions_insert_student" ON public.submissions FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.assignments a JOIN public.course_members cm ON cm.course_id = a.course_id WHERE a.id = assignment_id AND a.status = 'published' AND cm.user_id = auth.uid() AND cm.member_role = 'student' AND a.deadline >= now()));
DROP POLICY IF EXISTS "submissions_update_owner_or_teacher" ON public.submissions;
CREATE POLICY "submissions_update_owner_or_teacher" ON public.submissions FOR UPDATE TO authenticated
USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "submissions_delete_owner" ON public.submissions;
CREATE POLICY "submissions_delete_owner" ON public.submissions FOR DELETE TO authenticated
USING (student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.deadline >= now()));
