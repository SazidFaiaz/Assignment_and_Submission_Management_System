'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import type { Course } from '@/lib/types';

export default function NewAssignmentPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [publish, setPublish] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== 'teacher') {
      router.replace('/dashboard');
      return;
    }
    (async () => {
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
      setLoading(false);
    })();
  }, [profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError(null);

    if (!courseId) {
      setError('Please select a course.');
      return;
    }
    if (!title.trim() || !description.trim() || !deadline) {
      setError('All fields are required.');
      return;
    }
    if (fromDatetimeLocal(deadline) < new Date().toISOString()) {
      setError('Deadline must be in the future.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('assignments').insert({
      course_id: courseId,
      teacher_id: profile.id,
      title: title.trim(),
      description: description.trim(),
      deadline: fromDatetimeLocal(deadline),
      max_marks: parseInt(maxMarks, 10),
      status: publish ? 'published' : 'draft',
    });
    setSubmitting(false);

    if (error) {
      setError('Could not create the assignment. Please try again.');
      return;
    }
    router.push('/dashboard/assignments');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/assignments"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to assignments
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Assignment</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the details below. You can save as draft or publish immediately.
        </p>
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
              {courses.length === 0 && (
                <p className="text-xs text-amber-600">
                  You are not assigned to any course. Ask an admin to assign you to a course first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm Essay"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide instructions and requirements for the assignment..."
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
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                id="publish"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <Label htmlFor="publish" className="cursor-pointer">
                  Publish immediately
                </Label>
                <p className="text-xs text-slate-500">
                  If unchecked, the assignment will be saved as a draft.
                </p>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Link href="/dashboard/assignments">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {publish ? 'Publish Assignment' : 'Save as Draft'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
