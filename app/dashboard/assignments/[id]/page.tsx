'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { formatShortDate, formatDate, isPastDeadline, daysUntil } from '@/lib/date';
import type {
  AssignmentWithCourse,
  Submission,
  SubmissionWithStudent,
  Profile,
} from '@/lib/types';

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();

  const [assignment, setAssignment] = useState<AssignmentWithCourse | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadData = useCallback(async () => {
    if (!profile || !id) return;
    setLoading(true);

    const { data: aData } = await supabase
      .from('assignments')
      .select('*, courses(id, code, name)')
      .eq('id', id)
      .maybeSingle();
    const a = aData as AssignmentWithCourse | null;
    setAssignment(a);

    if (a) {
      if (profile.role === 'student') {
        const { data: sub } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignment_id', id)
          .eq('student_id', profile.id)
          .maybeSingle();
        setMySubmission(sub as Submission | null);
        if (sub) setAnswer((sub as Submission).answer);
      } else if (profile.role === 'teacher' || profile.role === 'admin') {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*, profiles(id, full_name, email)')
          .eq('assignment_id', id)
          .order('submitted_at', { ascending: false });
        setSubmissions((subs as SubmissionWithStudent[]) ?? []);
      }
    }
    setLoading(false);
  }, [profile, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!profile || !assignment) return;
    setError(null);
    if (!answer.trim()) {
      setError('Please write your answer before submitting.');
      return;
    }
    setSubmitting(true);

    if (mySubmission) {
      const { error } = await supabase
        .from('submissions')
        .update({
          answer: answer.trim(),
          updated_at: new Date().toISOString(),
          status: isPastDeadline(assignment.deadline) ? 'late' : 'submitted',
        })
        .eq('id', mySubmission.id);
      if (error) setError('Could not update your submission. Please try again.');
    } else {
      const { error } = await supabase.from('submissions').insert({
        assignment_id: assignment.id,
        student_id: profile.id,
        answer: answer.trim(),
        status: isPastDeadline(assignment.deadline) ? 'late' : 'submitted',
      });
      if (error) {
        if (error.code === '23505') {
          setError('You have already submitted this assignment.');
        } else {
          setError('Could not submit your answer. The deadline may have passed.');
        }
      }
    }
    setSubmitting(false);
    if (!error) loadData();
  };

  const handleDelete = async () => {
    if (!assignment) return;
    const { error } = await supabase.from('assignments').delete().eq('id', assignment.id);
    if (error) {
      setError('Could not delete the assignment.');
      return;
    }
    router.push('/dashboard/assignments');
  };

  const handlePublish = async () => {
    if (!assignment) return;
    const { error } = await supabase
      .from('assignments')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', assignment.id);
    if (error) setError('Could not publish the assignment.');
    else loadData();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/assignments"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to assignments
        </Link>
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              This assignment could not be found or you do not have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const past = isPastDeadline(assignment.deadline);
  const days = daysUntil(assignment.deadline);
  const canEdit =
    profile?.role === 'teacher' && assignment.teacher_id === profile.id;
  const canDelete =
    profile?.role === 'admin' ||
    (profile?.role === 'teacher' && assignment.teacher_id === profile.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/assignments"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to assignments
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {assignment.courses?.code} — {assignment.courses?.name}
            </Badge>
            {assignment.status === 'draft' && <Badge variant="secondary">Draft</Badge>}
            {assignment.status === 'published' && !past && (
              <Badge className="bg-emerald-100 text-emerald-700 border-transparent">Published</Badge>
            )}
            {assignment.status === 'closed' && <Badge variant="destructive">Closed</Badge>}
            {assignment.status === 'published' && past && (
              <Badge variant="destructive">Deadline Passed</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {assignment.description}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Deadline</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatDate(assignment.deadline)}
            </p>
            {!past && days >= 0 && (
              <p className="mt-0.5 text-xs text-slate-500">
                {days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left`}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Maximum Marks</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{assignment.max_marks}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Submissions</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {profile?.role === 'student' ? (mySubmission ? '1' : '0') : submissions.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teacher actions */}
      {(canEdit || canDelete) && (
        <div className="flex flex-wrap gap-3">
          {canEdit && assignment.status === 'draft' && (
            <Button onClick={handlePublish} className="bg-emerald-600 hover:bg-emerald-700">
              Publish Assignment
            </Button>
          )}
          {canEdit && (
            <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      )}

      {/* Student submission area */}
      {profile?.role === 'student' && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Your Submission</CardTitle>
            <CardDescription>
              {mySubmission
                ? `Status: ${mySubmission.status}${mySubmission.marks !== null ? ` · ${mySubmission.marks}/${assignment.max_marks} marks` : ''}`
                : past
                ? 'The deadline has passed. Submissions are closed.'
                : 'Write your answer and submit below.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mySubmission?.feedback && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">Teacher Feedback</p>
                <p className="mt-1 text-sm text-blue-700 whitespace-pre-wrap">
                  {mySubmission.feedback}
                </p>
              </div>
            )}
            {mySubmission && mySubmission.status === 'graded' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-900">
                  Your Grade: {mySubmission.marks}/{assignment.max_marks}
                </p>
              </div>
            )}
            {!past || (mySubmission && mySubmission.status === 'submitted') ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="answer">Your Answer</Label>
                  <Textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={8}
                    placeholder="Write your answer here..."
                    disabled={mySubmission?.status === 'graded' || mySubmission?.status === 'returned'}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || mySubmission?.status === 'graded'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mySubmission ? 'Update Submission' : 'Submit Answer'}
                </Button>
              </>
            ) : !mySubmission && past ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4" />
                The deadline has passed and you have not submitted this assignment.
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Teacher/Admin: submissions list */}
      {(profile?.role === 'teacher' || profile?.role === 'admin') && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Student Submissions</CardTitle>
            <CardDescription>
              {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} received
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {submissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No submissions yet.
              </p>
            ) : (
              submissions.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/submissions/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {s.profiles?.full_name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {s.profiles?.email} · Submitted {formatShortDate(s.submitted_at)}
                    </p>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    {s.status === 'submitted' && (
                      <Badge className="bg-blue-100 text-blue-700 border-transparent">Submitted</Badge>
                    )}
                    {s.status === 'late' && (
                      <Badge variant="destructive">Late</Badge>
                    )}
                    {s.status === 'graded' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-transparent">
                        Graded: {s.marks}/{assignment.max_marks}
                      </Badge>
                    )}
                    {s.status === 'returned' && (
                      <Badge className="bg-amber-100 text-amber-700 border-transparent">Returned</Badge>
                    )}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md border-slate-200">
            <CardHeader>
              <CardTitle>Delete Assignment?</CardTitle>
              <CardDescription>
                This will permanently delete the assignment and all associated submissions. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
