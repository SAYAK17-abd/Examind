import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import { NotificationResponse } from '../../types';
import { Badge } from '../common/Badge';
import { AcademicLogo } from '../common/AcademicLogo';
import {
  Bell,
  LogOut,
  User as UserIcon,
  CheckCheck,
  Menu,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
  MoreVertical,
  Layers,
  Camera,
  FileCheck2,
  BookOpen,
} from 'lucide-react';

export interface AppNavbarProps {
  onMenuToggle?: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ onMenuToggle }) => {
  const { user, logout, isStudent, isTeacher, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showModuleMenu, setShowModuleMenu] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  // Poll or load notifications on mount
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        if (isMounted) setUnreadCount(count);
      } catch {
        // Ignore unread count failure silently
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(e.target as Node)) {
        setShowModuleMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifications = async () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      try {
        const res = await notificationService.getNotifications({ page: 0, size: 5 });
        setNotifications(res.content);
      } catch {
        // Fallback
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (isAdmin) return <Badge variant="danger" size="sm">Admin</Badge>;
    if (isTeacher) return <Badge variant="brand" size="sm">Teacher</Badge>;
    if (isStudent) return <Badge variant="success" size="sm">Student</Badge>;
    return <Badge variant="neutral" size="sm">User</Badge>;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 text-slate-500 hover:text-slate-800 md:hidden rounded-lg hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <AcademicLogo size="sm" showSubtitle={false} />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifications}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        n.read
                          ? 'border-slate-100 bg-white text-slate-600'
                          : 'border-indigo-100 bg-indigo-50/50 text-slate-800 font-medium'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-900">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Three-Dot Module Quick Switcher */}
        <div className="relative" ref={moduleMenuRef}>
          <button
            onClick={() => setShowModuleMenu((prev) => !prev)}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition border border-transparent hover:border-slate-200"
            title="Switch Workspace View"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showModuleMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 divide-y divide-slate-100 animate-in fade-in duration-150">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspace Modules
              </div>
              <div className="py-1.5 space-y-1">
                <button
                  onClick={() => {
                    setShowModuleMenu(false);
                    navigate(isTeacher ? '/teacher/exams' : '/student/exams');
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition text-xs font-semibold text-slate-700"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div>Question & Exam Studio</div>
                    <div className="text-[10px] text-slate-400 font-normal">Author, edit & manage tests</div>
                  </div>
                </button>

                {isTeacher && (
                  <button
                    onClick={() => {
                      setShowModuleMenu(false);
                      navigate('/teacher/scan');
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition text-xs font-semibold text-slate-700"
                  >
                    <Camera className="w-4 h-4 text-amber-500" />
                    <div>
                      <div>Answer Sheet Scanner</div>
                      <div className="text-[10px] text-slate-400 font-normal">Bulk OCR & teacher sign-off</div>
                    </div>
                  </button>
                )}

                {isTeacher && (
                  <button
                    onClick={() => {
                      setShowModuleMenu(false);
                      navigate('/teacher/submissions');
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition text-xs font-semibold text-slate-700"
                  >
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div>Submissions & AI Review</div>
                      <div className="text-[10px] text-slate-400 font-normal">Evaluation audit & overrides</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowModuleMenu(false);
                    navigate('/student/exams');
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition text-xs font-semibold text-slate-700"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <div>
                    <div>Student Exam Hall</div>
                    <div className="text-[10px] text-slate-400 font-normal">Timed tests & auto-save room</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 pl-2 text-left rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs uppercase shadow-sm">
              {user?.firstName ? user.firstName[0] : 'U'}
              {user?.lastName ? user.lastName[0] : ''}
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.fullName || user?.email || 'User'}
                </span>
                {getRoleBadge()}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight truncate max-w-[140px]">
                {user?.email}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in duration-150">
              <div className="p-3 border-b border-slate-100 md:hidden mb-1">
                <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5">{getRoleBadge()}</div>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    if (isStudent) navigate('/student/insights');
                    if (isTeacher || isAdmin) navigate('/teacher');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Account & Overview
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
