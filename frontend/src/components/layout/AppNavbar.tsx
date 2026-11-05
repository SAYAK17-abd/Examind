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
    if (isAdmin) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Admin</span>;
    if (isTeacher) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">Teacher</span>;
    if (isStudent) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Student</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">User</span>;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#080C17]/95 px-4 md:px-8 backdrop-blur-md text-white">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-slate-800"
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
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-slate-950 shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl border border-slate-700/80 bg-[#0C1220] p-4 shadow-2xl shadow-black/80 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-400/30">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        n.read
                          ? 'border-slate-800/80 bg-[#070B14] text-slate-400'
                          : 'border-amber-400/30 bg-amber-400/5 text-slate-200 font-medium'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-white">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{n.message}</p>
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
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0D1322] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition hover:border-amber-400/40"
            title="Switch Workspace View"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showModuleMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-700/80 bg-[#0C1220] p-2 shadow-2xl shadow-black/80 z-50 divide-y divide-slate-800 animate-in fade-in duration-150">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspace Modules
              </div>
              <div className="py-1.5 space-y-1">
                <button
                  onClick={() => {
                    setShowModuleMenu(false);
                    navigate(isTeacher ? '/teacher/exams' : '/student/exams');
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/80 text-left transition text-xs font-semibold text-slate-200 hover:text-amber-300"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
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
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/80 text-left transition text-xs font-semibold text-slate-200 hover:text-amber-300"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
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
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/80 text-left transition text-xs font-semibold text-slate-200 hover:text-amber-300"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
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
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/80 text-left transition text-xs font-semibold text-slate-200 hover:text-amber-300"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
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
            className="flex items-center gap-2.5 p-1.5 pl-2 text-left rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-indigo-500/20 text-amber-300 border border-amber-400/30 font-bold text-xs uppercase shadow-sm">
              {user?.firstName ? user.firstName[0] : 'U'}
              {user?.lastName ? user.lastName[0] : ''}
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white leading-tight">
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
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-700/80 bg-[#0C1220] p-2 shadow-2xl shadow-black/80 z-50 animate-in fade-in duration-150">
              <div className="p-3 border-b border-slate-800 md:hidden mb-1">
                <p className="text-xs font-bold text-white">{user?.fullName}</p>
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 rounded-lg hover:bg-slate-800/80 transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Account & Overview
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
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
