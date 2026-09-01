'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { APIClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, FileText, Clock, CheckCircle, Search } from 'lucide-react';
import { formatShortDate, isPastDeadline, daysUntil } from '@/lib/date';

export default function AssignmentsPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadAssignments = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const response = await APIClient.getAssignments();
      let filtered = response.data || [];

      if (profile.role === 'teacher') {
        // Teachers see only their assignments
        filtered = filtered.filter((a: any) => a.teacherId === profile.id);
      } else if (profile.role === 'student') {
        // Students see only published assignments
        filtered = filtered.filter((a: any) => a.status === 'published');
      }

      setAssignments(filtered);
    } catch (error) {
      console.error('Failed to load assignments', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  if (!profile) return null;

  const filtered = assignments.filter((a) => {
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.courseId?.code?.toLowerCase().includes(search.toLowerCase()) ||
      a.courseId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' && a.status === 'published' && !isPastDeadline(a.deadline)) ||
      (statusFilter === 'closed' && (a.status === 'closed' || isPastDeadline(a.deadline))) ||
      (statusFilter === 'draft' && a.status === 'draft');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile.role === 'student' ? 'My Assignments' : 'Assignments'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile.role === 'teacher'
              ? 'Create and manage assignments for your courses'
              : profile.role === 'student'
              ? 'View and submit assignments for your courses'
              : 'All assignments across the institution'}
          </p>
        </div>
        {profile.role === 'teacher' && (
          <Link href="/dashboard/assignments/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search assignments..."
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              {search || statusFilter !== 'all'
                ? 'No assignments match your filters'
                : profile.role === 'teacher'
                ? 'No assignments yet. Create your first assignment.'
                : 'No assignments available for your courses.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const past = isPastDeadline(a.deadline);
            const days = daysUntil(a.deadline);
            return (
              <Link key={a._id || a.id} href={`/dashboard/assignments/${a._id || a.id}`}>
                <Card className="group h-full border-slate-200 transition-all hover:border-blue-200 hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-xs font-medium text-slate-600">
                        {a.courseId?.code || 'N/A'}
                      </Badge>
                      {a.status === 'draft' && <Badge variant="secondary">Draft</Badge>}
                      {a.status === 'published' && !past && days <= 3 && (
                        <Badge className="bg-orange-100 text-orange-700 border-transparent">Due soon</Badge>
                      )}
                      {a.status === 'published' && !past && days > 3 && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-transparent">Open</Badge>
                      )}
                      {(a.status === 'closed' || (a.status === 'published' && past)) && (
                        <Badge variant="destructive">Closed</Badge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                      {a.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
                      {a.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatShortDate(a.deadline)}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {a.maxMarks} marks
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
