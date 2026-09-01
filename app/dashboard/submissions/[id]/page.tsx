'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { formatShortDate, formatDate, isPastDeadline } from '@/lib/date';
import type { Submission, Assignment, Profile, SubmissionStatus } from '@/lib/types';

type FullSubmission = Submission & {
  assignments: Assignment & { courses: { id: string; code: string; name: string } };
  profiles: Pick<Profile, 'id' | 'full_name' | 'email'>;
};

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const [submission, setSubmission] = useState<FullSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>('submitted');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!profile || !id) return;
    setLoading(true);

    const { data } = await supabase
      .from('submissions')
      .select(
        '*, assignments(*, courses(id, code, name)), profiles(id, full_name, email)'
      )
      .eq('id', id)
      .maybeSingle();
    const sub = data as FullSubmission | null;

    if (!sub) {
      router.replace('/dashboard/submissions');
      return;
    }

    // Authorization check
    if (
      profile.role === 'student' &&
      sub.student_id !== profile.id
    ) {
      router.replace('/dashboard/submissions');
      return;
    }
    if (
      profile.role === 'teacher' &&
      sub.assignments.teacher_id !== profile.id
    ) {
      router.replace('/dashboard/submissions');
      return;
    }

    setSubmission(sub);
    setMarks(sub.marks !== null ? String(sub.marks) : '');
    setFeedback(sub.feedback ?? '');
    setStatus(sub.status);
    setLoading(false);
  }, [profile, id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrade = async () => {
    if (!submission) return;
    setError(null);

    const marksNum = parseInt(marks, 10);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > submission.assignments.max_marks) {
      setError(`Marks must be between 0 and ${submission.assignments.max_marks}.`);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('submissions')
      .update({
        marks: marksNum,
        feedback: feedback.trim() || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id);
    setSaving(false);

    if (error) {
      setError('Could not save the grade. Please try again.');
      return;
    }
    loadData();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
    );
  }

  if (!submission) return null;

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';
  const past = isPastDeadline(submission.assignments.deadline);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/submissions"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to submissions
      </Link>

      {/* Header */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {submission.assignments.courses?.code}
          </Badge>
          {submission.status === 'submitted' && (
            <Badge className="bg-blue-100 text-blue-700 border-transparent">Submitted</Badge>
          )}
          {submission.status === 'late' && <Badge variant="destructive">Late</Badge>}
          {submission.status === 'graded' && (
            <Badge className="bg-emerald-100 text-emerald-700 border-transparent">Graded</Badge>
          )}
          {submission.status === 'returned' && (
            <Badge className="bg-amber-100 text-amber-700 border-transparent">Returned</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{submission.assignments.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isTeacher ? submission.profiles?.full_name : 'Your submission'} ·{' '}
          {formatShortDate(submission.submitted_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Answer */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Student Answer</CardTitle>
              <CardDescription>
                Assignment deadline: {formatDate(submission.assignments.deadline)}
                {past && submission.status === 'submitted' && ' (submitted before deadline)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {submission.answer}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grading / Results */}
        <div>
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">
                {isTeacher ? 'Grading' : 'Results'}
              </CardTitle>
              <CardDescription>
                Max marks: {submission.assignments.max_marks}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTeacher ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="marks">Marks</Label>
                    <Input
                      id="marks"
                      type="number"
                      min="0"
                      max={submission.assignments.max_marks}
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as SubmissionStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="graded">Graded</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      placeholder="Provide feedback to the student..."
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}
                  <Button
                    onClick={handleGrade}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Grade
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <span className="text-sm text-slate-500">Marks</span>
                      <span className="text-lg font-bold text-slate-900">
                        {submission.marks !== null
                          ? `${submission.marks}/${submission.assignments.max_marks}`
                          : 'Not graded yet'}
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <span className="text-sm text-slate-500">Status</span>
                      <p className="mt-1 text-sm font-medium text-slate-900 capitalize">
                        {submission.status}
                      </p>
                    </div>
                    {submission.feedback && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <span className="text-sm font-medium text-blue-900">Teacher Feedback</span>
                        <p className="mt-1 text-sm text-blue-700 whitespace-pre-wrap">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                    {!submission.feedback && submission.marks === null && (
                      <p className="text-center text-sm text-slate-400 py-4">
                        Your submission has not been graded yet.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
