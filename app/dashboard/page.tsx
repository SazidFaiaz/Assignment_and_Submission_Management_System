'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { APIClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ClipboardCheck, BookOpen, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatShortDate, isPastDeadline, daysUntil } from '@/lib/date';
import type { AssignmentWithCourse, SubmissionWithAssignment } from '@/lib/types';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ assignments: 0, submissions: 0, courses: 0, pending: 0 });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      try {
        if (profile.role === 'admin') {
          // Admin dashboard: show system overview
          const assignmentsRes = await APIClient.getAssignments();
          const submissionsRes = await APIClient.getSubmissions();
          const coursesRes = await APIClient.getCourses();

          setStats({
            assignments: assignmentsRes.data?.length ?? 0,
            submissions: submissionsRes.data?.length ?? 0,
            courses: coursesRes.data?.length ?? 0,
            pending: 0,
          });

          setRecentAssignments(assignmentsRes.data?.slice(0, 5) ?? []);
        } else if (profile.role === 'teacher') {
          // Teacher dashboard: show their courses and assignments
          const assignmentsRes = await APIClient.getAssignments();
          const submissionsRes = await APIClient.getSubmissions();

          const teacherAssignments = assignmentsRes.data?.filter(
            (a: any) => a.teacherId === profile.id
          ) ?? [];

          const pendingCount = submissionsRes.data?.filter(
            (s: any) => ['submitted', 'late'].includes(s.status)
          ).length ?? 0;

          setStats({
            assignments: teacherAssignments.length,
            submissions: submissionsRes.data?.length ?? 0,
            courses: 0,
            pending: pendingCount,
          });

          setRecentAssignments(teacherAssignments.slice(0, 5));
          setRecentSubmissions(submissionsRes.data?.slice(0, 5) ?? []);
        } else {
          // Student dashboard: show their available and submitted assignments
          const assignmentsRes = await APIClient.getAssignments();
          const submissionsRes = await APIClient.getSubmissions();

          const availableAssignments = assignmentsRes.data?.filter(
            (a: any) => a.status === 'published'
          ) ?? [];

          const studentSubmissions = submissionsRes.data?.filter(
            (s: any) => s.studentId === profile.id
          ) ?? [];

          setStats({
            assignments: availableAssignments.length,
            submissions: studentSubmissions.length,
            courses: 0,
            pending: 0,
          });

          setRecentAssignments(availableAssignments.slice(0, 5));
          setRecentSubmissions(studentSubmissions.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  if (!profile) return null;
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  const statCards = [
    { label: profile.role === 'student' ? 'Available Assignments' : 'Assignments', value: stats.assignments, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: profile.role === 'student' ? 'My Submissions' : 'Submissions', value: stats.submissions, icon: ClipboardCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
    ...(profile.role === 'teacher'
      ? [{ label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-orange-600 bg-orange-50' }]
      : profile.role === 'admin'
      ? [{ label: 'Total Users', value: stats.pending, icon: Users, color: 'text-purple-600 bg-purple-50' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile.full_name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile.role === 'admin'
            ? 'System overview and management'
            : profile.role === 'teacher'
            ? 'Manage your assignments and review submissions'
            : 'View your assignments and track submissions'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-200">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent assignments */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {profile.role === 'student' ? 'Upcoming Assignments' : 'Recent Assignments'}
              </CardTitle>
              <CardDescription>
                {recentAssignments.length} {recentAssignments.length === 1 ? 'assignment' : 'assignments'}
              </CardDescription>
            </div>
            <Link href="/dashboard/assignments">
              <span className="text-sm font-medium text-blue-600 hover:underline">View all</span>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAssignments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No assignments yet</p>
            ) : (
              recentAssignments.map((a) => {
                const past = isPastDeadline(a.deadline);
                const days = daysUntil(a.deadline);
                return (
                  <Link
                    key={a._id || a.id}
                    href={`/dashboard/assignments/${a._id || a.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{a.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {a.courseId?.code || 'Course'} · Due {formatShortDate(a.deadline)}
                      </p>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      {a.status === 'draft' && <Badge variant="secondary">Draft</Badge>}
                      {a.status === 'published' && !past && days <= 3 && (
                        <Badge className="bg-orange-100 text-orange-700 border-transparent">Due soon</Badge>
                      )}
                      {a.status === 'published' && past && (
                        <Badge variant="destructive">Closed</Badge>
                      )}
                      {a.status === 'published' && !past && days > 3 && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-transparent">Open</Badge>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent submissions */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {profile.role === 'student' ? 'My Recent Submissions' : 'Recent Submissions'}
              </CardTitle>
              <CardDescription>
                {recentSubmissions.length} {recentSubmissions.length === 1 ? 'submission' : 'submissions'}
              </CardDescription>
            </div>
            <Link href="/dashboard/submissions">
              <span className="text-sm font-medium text-blue-600 hover:underline">View all</span>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSubmissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No submissions yet</p>
            ) : (
              recentSubmissions.map((s) => (
                <div
                  key={s._id || s.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {s.assignmentId?.title || 'Assignment'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {s.assignmentId?.courseId?.code || 'Course'} · {formatShortDate(s.updatedAt || s.submittedAt)}
                    </p>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    {s.status === 'graded' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-transparent">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {s.marks}/{s.assignmentId?.maxMarks || 100}
                      </Badge>
                    )}
                    {s.status === 'submitted' && (
                      <Badge className="bg-blue-100 text-blue-700 border-transparent">Submitted</Badge>
                    )}
                    {s.status === 'late' && (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Late
                      </Badge>
                    )}
                    {s.status === 'returned' && (
                      <Badge className="bg-amber-100 text-amber-700 border-transparent">Returned</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
