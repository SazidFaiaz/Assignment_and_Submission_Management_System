'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { BookOpen, Plus, Search, Loader2, Trash2, Edit, Users } from 'lucide-react';
import { formatShortDate } from '@/lib/date';
import type { Course, Profile, CourseMember } from '@/lib/types';

type CourseWithMembers = Course & {
  member_count?: number;
  teacher_name?: string;
};

export default function CoursesPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [manageCourse, setManageCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create/edit form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [term, setTerm] = useState('');

  // Member management
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [memberUserMap, setMemberUserMap] = useState<Record<string, Profile>>({});

  const loadCourses = useCallback(async () => {
    if (!profile) return;
    if (profile.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    const { data } = await supabase.from('courses').select('*').order('name');
    const courseList = (data as Course[]) ?? [];

    // Get member counts and teachers
    const { data: allMembers } = await supabase
      .from('course_members')
      .select('*, profiles(id, full_name, email, role)');

    const enriched: CourseWithMembers[] = courseList.map((c) => {
      const courseMembers = (allMembers ?? []).filter((m) => m.course_id === c.id);
      const teacher = courseMembers.find((m) => m.member_role === 'teacher');
      return {
        ...c,
        member_count: courseMembers.filter((m) => m.member_role === 'student').length,
        teacher_name: teacher ? (teacher as any).profiles?.full_name : 'Unassigned',
      };
    });
    setCourses(enriched);
    setLoading(false);
  }, [profile, router]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'admin') return;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('full_name');
      setAllUsers((data as Profile[]) ?? []);
    })();
  }, [profile]);

  const handleCreate = async () => {
    setError(null);
    if (!code.trim() || !name.trim() || !department.trim() || !term.trim()) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('courses').insert({
      code: code.trim(),
      name: name.trim(),
      department: department.trim(),
      term: term.trim(),
    });
    setSaving(false);
    if (error) {
      setError(error.code === '23505' ? 'A course with this code already exists.' : 'Could not create the course.');
      return;
    }
    setCreateOpen(false);
    setCode('');
    setName('');
    setDepartment('');
    setTerm('');
    loadCourses();
  };

  const handleEdit = async () => {
    if (!editCourse) return;
    setError(null);
    setSaving(true);
    const { error } = await supabase
      .from('courses')
      .update({
        code: code.trim(),
        name: name.trim(),
        department: department.trim(),
        term: term.trim(),
      })
      .eq('id', editCourse.id);
    setSaving(false);
    if (error) {
      setError('Could not update the course.');
      return;
    }
    setEditCourse(null);
    loadCourses();
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Delete this course? This will also remove all assignments and submissions for this course.')) return;
    await supabase.from('courses').delete().eq('id', courseId);
    loadCourses();
  };

  const openEdit = (c: Course) => {
    setEditCourse(c);
    setCode(c.code);
    setName(c.name);
    setDepartment(c.department);
    setTerm(c.term);
  };

  const openManage = async (c: Course) => {
    setManageCourse(c);
    const { data } = await supabase
      .from('course_members')
      .select('*, profiles(id, full_name, email, role)')
      .eq('course_id', c.id);
    const memberList = (data ?? []) as any[];
    setMembers(memberList.map((m) => ({ course_id: m.course_id, user_id: m.user_id, member_role: m.member_role, created_at: m.created_at })));
    const map: Record<string, Profile> = {};
    memberList.forEach((m) => {
      if (m.profiles) map[m.user_id] = m.profiles;
    });
    setMemberUserMap(map);
  };

  const addMember = async (userId: string, role: 'teacher' | 'student') => {
    if (!manageCourse) return;
    const { error } = await supabase.from('course_members').insert({
      course_id: manageCourse.id,
      user_id: userId,
      member_role: role,
    });
    if (!error) openManage(manageCourse);
  };

  const removeMember = async (userId: string) => {
    if (!manageCourse) return;
    const { error } = await supabase
      .from('course_members')
      .delete()
      .eq('course_id', manageCourse.id)
      .eq('user_id', userId);
    if (!error) openManage(manageCourse);
  };

  if (!profile || profile.role !== 'admin') return null;

  const filtered = courses.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create courses, assign teachers, and enroll students
          </p>
        </div>
        <Button
          onClick={() => {
            setCode('');
            setName('');
            setDepartment('');
            setTerm('');
            setCreateOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              {search ? 'No courses match your search' : 'No courses yet. Create your first course.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="border-slate-200">
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <Badge variant="outline" className="text-xs font-medium text-slate-600">
                    {c.code}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(c)}
                    >
                      <Edit className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{c.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {c.department} · {c.term}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {c.member_count} students
                  </span>
                  <span className="truncate font-medium text-slate-700">
                    {c.teacher_name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => openManage(c)}
                >
                  Manage Members
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Add a new course to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS101" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="term">Term</Label>
                <Input id="term" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Fall 2026" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Course Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Introduction to Computer Science" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science" />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCourse} onOpenChange={(o) => !o && setEditCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update the course details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCode">Course Code</Label>
                <Input id="editCode" value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTerm">Term</Label>
                <Input id="editTerm" value={term} onChange={(e) => setTerm(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName">Course Name</Label>
              <Input id="editName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDept">Department</Label>
              <Input id="editDept" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCourse(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage members dialog */}
      <Dialog open={!!manageCourse} onOpenChange={(o) => !o && setManageCourse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Members — {manageCourse?.name}</DialogTitle>
            <DialogDescription>
              Assign teachers and enroll students in this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Current members */}
            <div className="space-y-2">
              <Label className="text-xs uppercase text-slate-500">Current Members</Label>
              {members.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No members yet.</p>
              ) : (
                members.map((m) => {
                  const user = memberUserMap[m.user_id];
                  return (
                    <div key={m.user_id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user?.full_name ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          m.member_role === 'teacher'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }>
                          {m.member_role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeMember(m.user_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Add member */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Label className="text-xs uppercase text-slate-500">Add New Member</Label>
              {allUsers
                .filter((u) => !members.some((m) => m.user_id === u.id))
                .map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.email} · {u.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => addMember(u.id, 'teacher')}
                      >
                        Add as Teacher
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => addMember(u.id, 'student')}
                      >
                        Add as Student
                      </Button>
                    </div>
                  </div>
                ))}
              {allUsers.filter((u) => !members.some((m) => m.user_id === u.id)).length === 0 && (
                <p className="text-sm text-slate-400 py-2 text-center">All users are already members.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
