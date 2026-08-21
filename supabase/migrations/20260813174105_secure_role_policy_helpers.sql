/*
# Secure role lookup for assignment management

1. Changes
- Adds `app_role()` as a server-owned role lookup for RLS predicates.
- Replaces recursive profile-admin checks with the helper.

2. Security
- The helper derives the caller from `auth.uid()` and uses a fixed search path.
- It is callable only by signed-in users.
- Ordinary users still cannot alter their own role column.
*/

CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.app_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;

DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.app_role() = 'admin');
DROP POLICY IF EXISTS "courses_select_members_or_admin" ON public.courses;
CREATE POLICY "courses_select_members_or_admin" ON public.courses FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.course_members cm WHERE cm.course_id = id AND cm.user_id = auth.uid()) OR public.app_role() = 'admin');
DROP POLICY IF EXISTS "courses_insert_admin" ON public.courses;
CREATE POLICY "courses_insert_admin" ON public.courses FOR INSERT TO authenticated
WITH CHECK (public.app_role() = 'admin');
DROP POLICY IF EXISTS "courses_update_admin" ON public.courses;
CREATE POLICY "courses_update_admin" ON public.courses FOR UPDATE TO authenticated
USING (public.app_role() = 'admin') WITH CHECK (public.app_role() = 'admin');
DROP POLICY IF EXISTS "courses_delete_admin" ON public.courses;
CREATE POLICY "courses_delete_admin" ON public.courses FOR DELETE TO authenticated
USING (public.app_role() = 'admin');
DROP POLICY IF EXISTS "members_select_related" ON public.course_members;
CREATE POLICY "members_select_related" ON public.course_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.app_role() = 'admin' OR EXISTS (SELECT 1 FROM public.course_members cm WHERE cm.course_id = course_id AND cm.user_id = auth.uid() AND cm.member_role = 'teacher'));
DROP POLICY IF EXISTS "members_insert_admin" ON public.course_members;
CREATE POLICY "members_insert_admin" ON public.course_members FOR INSERT TO authenticated
WITH CHECK (public.app_role() = 'admin');
DROP POLICY IF EXISTS "members_update_admin" ON public.course_members;
CREATE POLICY "members_update_admin" ON public.course_members FOR UPDATE TO authenticated
USING (public.app_role() = 'admin') WITH CHECK (public.app_role() = 'admin');
DROP POLICY IF EXISTS "members_delete_admin" ON public.course_members;
CREATE POLICY "members_delete_admin" ON public.course_members FOR DELETE TO authenticated
USING (public.app_role() = 'admin');
DROP POLICY IF EXISTS "assignments_select_role_scope" ON public.assignments;
CREATE POLICY "assignments_select_role_scope" ON public.assignments FOR SELECT TO authenticated
USING (teacher_id = auth.uid() OR (status = 'published' AND EXISTS (SELECT 1 FROM public.course_members cm WHERE cm.course_id = assignments.course_id AND cm.user_id = auth.uid())) OR public.app_role() = 'admin');
DROP POLICY IF EXISTS "assignments_update_teacher" ON public.assignments;
CREATE POLICY "assignments_update_teacher" ON public.assignments FOR UPDATE TO authenticated
USING (teacher_id = auth.uid() OR public.app_role() = 'admin') WITH CHECK (teacher_id = auth.uid() OR public.app_role() = 'admin');
DROP POLICY IF EXISTS "assignments_delete_teacher" ON public.assignments;
CREATE POLICY "assignments_delete_teacher" ON public.assignments FOR DELETE TO authenticated
USING (teacher_id = auth.uid() OR public.app_role() = 'admin');
DROP POLICY IF EXISTS "submissions_select_owner_teacher_admin" ON public.submissions;
CREATE POLICY "submissions_select_owner_teacher_admin" ON public.submissions FOR SELECT TO authenticated
USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()) OR public.app_role() = 'admin');
DROP POLICY IF EXISTS "submissions_update_owner_or_teacher" ON public.submissions;
CREATE POLICY "submissions_update_owner_or_teacher" ON public.submissions FOR UPDATE TO authenticated
USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()) OR public.app_role() = 'admin')
WITH CHECK (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid()) OR public.app_role() = 'admin');
