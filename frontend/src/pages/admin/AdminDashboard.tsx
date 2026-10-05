import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { UserProfile, UserStatus } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Breadcrumb } from '../../components/layout/Breadcrumb';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/date';
import {
  Users,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  Server,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Status toggle confirmation
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers({
        page: 0,
        size: 50,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
      });
      setUsers(res.content || []);
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleStatusToggle = async () => {
    if (!selectedUser) return;
    const targetStatus: UserStatus = selectedUser.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    setUpdatingStatus(true);
    try {
      await adminService.updateUserStatus(selectedUser.id, targetStatus);
      toast.success(`User ${selectedUser.fullName} is now ${targetStatus}.`);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Failed to update user status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const studentCount = users.filter((u) => u.role?.includes('STUDENT')).length;
  const teacherCount = users.filter((u) => u.role?.includes('TEACHER')).length;
  const adminCount = users.filter((u) => u.role?.includes('ADMIN')).length;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-150">
      <Breadcrumb items={[{ label: 'Admin Portal', path: '/admin' }, { label: 'User Management' }]} />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            System Administration
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            EXAMIND Administration Console
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
            Monitor institutional user status, activate/block accounts, and oversee platform services.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">All Systems Operational</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{users.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Active & Blocked</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{studentCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Enrolled candidates</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teachers</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{teacherCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Course instructors</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Service</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">Ready</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">FastAPI & Spring Boot</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
              <Server className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Directory Table Card */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>User Directory & Status Control</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Control account accessibility and inspect registered institution roles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48">
              <Input
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ROLE_STUDENT">Students</option>
              <option value="ROLE_TEACHER">Teachers</option>
              <option value="ROLE_ADMIN">Admins</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner size="lg" label="Loading users..." className="py-20" />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="No registered users matched your current filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4 pl-6">Full Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isBlocked = user.status === 'BLOCKED';

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-900">
                          {user.fullName || `${user.firstName} ${user.lastName}`}
                        </td>
                        <td className="p-4 text-slate-600 font-mono text-[11px]">{user.email}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              user.role?.includes('ADMIN')
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : user.role?.includes('TEACHER')
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {user.role?.replace('ROLE_', '')}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant={isBlocked ? 'danger' : 'success'} size="sm" dot>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Button
                            variant={isBlocked ? 'success' : 'danger'}
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            leftIcon={
                              isBlocked ? (
                                <Unlock className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3.5 h-3.5" />
                              )
                            }
                          >
                            {isBlocked ? 'Activate' : 'Block User'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Status Toggle Dialog */}
      <ConfirmDialog
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onConfirm={handleStatusToggle}
        title={selectedUser?.status === 'ACTIVE' ? 'Block User Account?' : 'Activate User Account?'}
        message={
          selectedUser?.status === 'ACTIVE'
            ? `Are you sure you want to block ${selectedUser?.fullName}? They will be denied platform authentication until reactivated.`
            : `Reactivate ${selectedUser?.fullName}'s account access?`
        }
        confirmText={selectedUser?.status === 'ACTIVE' ? 'Confirm Block' : 'Confirm Activate'}
        variant={selectedUser?.status === 'ACTIVE' ? 'danger' : 'primary'}
        isLoading={updatingStatus}
      />
    </div>
  );
};
