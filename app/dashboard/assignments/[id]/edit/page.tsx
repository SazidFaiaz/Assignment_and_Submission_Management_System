'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toDatetimeLocal, fromDatetimeLocal } from '@/lib/date';
import type { Assignment, Course } from '@/lib/types';

export default function EditAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    if (!profile || !id) return;
    (async () => {
      const { data: aData } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      const a = aData as Assignment | null;
      if (!a) {
        router.replace('/dashboard/assignments');
        return;
      }
      if (profile.role === 'teacher' && a.teacher_id !== profile.id) {
        router.replace('/dashboard/assignments');
        return;
      }
      setAssignment(a);
      setTitle(a.title);
      setDescription(a.description);
      setCourseId(a.course_id);
      setDeadline(toDatetimeLocal(a.deadline));
      setMaxMarks(String(a.max_marks));
      setStatus(a.status);

      if (profile.role === 'teacher') {
        const { data: memberships } = await supabase
          .from('course_members')
          .select('course_id')
          .eq('user_id', profile.id)
          .eq('member_role', 'teacher');
        const courseIds = (memberships ?? []).map((m) => m.course_id);
        if (courseIds.length > 0) {
          const { data } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds)
            .order('name');
          setCourses(data ?? []);
        }
      } else if (profile.role === 'admin') {
        const { data } = await supabase.from('courses').select('*').order('name');
        setCourses(data ?? []);
      }
      setLoading(false);
    })();
  }, [profile, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    setError(null);

    if (!title.trim() || !description.trim() || !courseId || !deadline) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('assignments')
      .update({
        title: title.trim(),
        description: description.trim(),
        course_id: courseId,
        deadline: fromDatetimeLocal(deadline),
        max_marks: parseInt(maxMarks, 10),
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignment.id);
    setSubmitting(false);

    if (error) {
      setError('Could not update the assignment. Please try again.');
      return;
    }
    router.push(`/dashboard/assignments/${assignment.id}`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/dashboard/assignments/${id}`}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to assignment
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Assignment</h1>
        <p className="mt-1 text-sm text-slate-500">Update the assignment details below.</p>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMarks">Maximum Marks</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  min="1"
                  max="1000"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Link href={`/dashboard/assignments/${id}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
