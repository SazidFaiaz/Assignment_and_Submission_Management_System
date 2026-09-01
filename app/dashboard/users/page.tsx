'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { APIClient } from '@/lib/api-client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Search, UserPlus, Loader2, Shield, GraduationCap, BookOpen } from 'lucide-react';
import { formatShortDate } from '@/lib/date';
import type { Profile, Role } from '@/lib/types';

export default function UsersPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('student');

  const loadUsers = useCallback(async () => {
    if (!profile) return;
    if (profile.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    try {
      const usersRes = await APIClient.getUsers();
      setUsers((usersRes.data as Profile[]) ?? []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
    setLoading(false);
  }, [profile, router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async () => {
    setError(null);
    if (!newEmail.trim() || !newName.trim() || !newPassword.trim()) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setCreating(true);

    try {
      // Use API to create user
      const response = await APIClient.signUp(newEmail.trim(), newPassword, newName.trim());
      
      // If created successfully, update their role if not student
      if (response && newRole !== 'student') {
        await APIClient.updateUserRole(response.user?.id, newRole);
      }

      setCreateOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('student');
      loadUsers();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('already exists')) {
        setError('A user with this email already exists.');
      } else if (msg.includes('Password')) {
        setError('Password must be at least 8 characters.');
      } else {
        setError('Could not create the user. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: Role) => {
    try {
      await APIClient.updateUserRole(userId, newRole);
      loadUsers();
    } catch (error) {
      console.error('Failed to update role', error);
      setError('Could not update user role. Please try again.');
    }
  };

  if (!profile || profile.role !== 'admin') return null;

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleIcons: Record<Role, React.ElementType> = {
    admin: Shield,
    teacher: GraduationCap,
    student: BookOpen,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create accounts and manage roles for all users
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Joined</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const RoleIcon = roleIcons[u.role];
                    return (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.full_name}</td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              u.role === 'admin'
                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                : u.role === 'teacher'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }
                          >
                            <RoleIcon className="mr-1 h-3 w-3" />
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatShortDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          {u.id === profile.id ? (
                            <span className="text-xs text-slate-400">You</span>
                          ) : (
                            <Select
                              value={u.role}
                              onValueChange={(v) => handleChangeRole(u.id, v as Role)}
                            >
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new admin, teacher, or student account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newName">Full name</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jane@school.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newRole">Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="bg-blue-600 hover:bg-blue-700">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
