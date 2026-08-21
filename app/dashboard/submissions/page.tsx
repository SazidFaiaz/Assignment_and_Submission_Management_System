'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { APIClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardCheck, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { formatShortDate } from '@/lib/date';
import type { SubmissionWithAssignment, SubmissionWithStudent, Profile } from '@/lib/types';

type Row = {
  id: string;
  status: string;
  marks: number | null;
  submitted_at: string;
  updated_at: string;
  assignment_title: string;
  course_code: string;
  student_name?: string;
  student_email?: string;
};

export default function SubmissionsPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadSubmissions = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    try {
      // Get all submissions and assignments
      const submissionsRes = await APIClient.getSubmissions();
      const assignmentsRes = await APIClient.getAssignments();
      
      const submissions = submissionsRes.data ?? [];
      const assignments = assignmentsRes.data ?? [];

      // Filter and map based on role
      let filteredSubs = submissions;

      if (profile.role === 'student') {
        // Students see only their own submissions
        filteredSubs = submissions.filter((s: any) => s.studentId === profile.id);
      } else if (profile.role === 'teacher') {
        // Teachers see submissions for their assignments
        const teacherAssignmentIds = assignments
          .filter((a: any) => a.teacherId === profile.id)
          .map((a: any) => a._id || a.id);
        filteredSubs = submissions.filter((s: any) => teacherAssignmentIds.includes(s.assignmentId));
      }
      // Admins see all submissions

      const mapped = filteredSubs.map((s: any) => ({
        id: s._id || s.id,
        status: s.status,
        marks: s.marks,
        submitted_at: s.submittedAt || s.submitted_at,
        updated_at: s.updatedAt || s.updated_at,
        assignment_title: s.assignmentId?.title || '',
        course_code: s.assignmentId?.courseId?.code || '',
        student_name: s.studentId?.full_name || '',
        student_email: s.studentId?.email || '',
      }));

      setRows(mapped);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setRows([]);
    }
    
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  if (!profile) return null;

  const filtered = rows.filter((r) => {
    const matchesSearch =
      !search ||
      r.assignment_title.toLowerCase().includes(search.toLowerCase()) ||
      r.course_code.toLowerCase().includes(search.toLowerCase()) ||
      (r.student_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {profile.role === 'student' ? 'My Submissions' : 'Submissions'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile.role === 'teacher'
            ? 'Review and grade student submissions for your assignments'
            : profile.role === 'student'
            ? 'Track the status and feedback for your submissions'
            : 'All submissions across the institution'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={profile.role === 'student' ? 'Search submissions...' : 'Search by student or assignment...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              {search || statusFilter !== 'all'
                ? 'No submissions match your filters'
                : 'No submissions yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    {profile.role !== 'student' && (
                      <th className="px-4 py-3 font-medium text-slate-500">Student</th>
                    )}
                    <th className="px-4 py-3 font-medium text-slate-500">Assignment</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Course</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Submitted</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      {profile.role !== 'student' && (
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/submissions/${r.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                            {r.student_name}
                          </Link>
                          <p className="text-xs text-slate-500">{r.student_email}</p>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/submissions/${r.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                          {r.assignment_title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.course_code}</td>
                      <td className="px-4 py-3 text-slate-600">{formatShortDate(r.submitted_at)}</td>
                      <td className="px-4 py-3">
                        {r.status === 'submitted' && (
                          <Badge className="bg-blue-100 text-blue-700 border-transparent">Submitted</Badge>
                        )}
                        {r.status === 'late' && (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Late
                          </Badge>
                        )}
                        {r.status === 'graded' && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-transparent">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Graded
                          </Badge>
                        )}
                        {r.status === 'returned' && (
                          <Badge className="bg-amber-100 text-amber-700 border-transparent">Returned</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {r.marks !== null ? `${r.marks}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
