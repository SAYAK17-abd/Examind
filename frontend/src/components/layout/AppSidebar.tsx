import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  BarChart3,
  FileCheck2,
  Users,
  Settings,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

export interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const { isStudent, isTeacher, isAdmin } = useAuth();

  let navItems: NavItem[] = [];

  if (isStudent) {
    navItems = [
      {
        label: 'Dashboard',
        path: '/student',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        label: 'My Exams',
        path: '/student/exams',
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        label: 'Results & Feedback',
        path: '/student/results',
        icon: <Award className="w-4 h-4" />,
      },
      {
        label: 'Learning Insights',
        path: '/student/insights',
        icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
        badge: 'AI',
      },
    ];
  } else if (isTeacher) {
    navItems = [
      {
        label: 'Teacher Dashboard',
        path: '/teacher',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        label: 'Exam Management',
        path: '/teacher/exams',
        icon: <Layers className="w-4 h-4" />,
      },
      {
        label: 'Submissions & Review',
        path: '/teacher/submissions',
        icon: <FileCheck2 className="w-4 h-4" />,
      },
      {
        label: 'Analytics & Similarity',
        path: '/teacher/analytics',
        icon: <BarChart3 className="w-4 h-4" />,
      },
    ];
  } else if (isAdmin) {
    navItems = [
      {
        label: 'Admin Overview',
        path: '/admin',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        label: 'User Management',
        path: '/admin/users',
        icon: <Users className="w-4 h-4" />,
      },
    ];
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between py-5 px-3">
      <div className="space-y-6">
        <div className="flex items-center justify-between px-3 md:hidden">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/student' || item.path === '/teacher' || item.path === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                )
              }
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-indigo-100 text-indigo-700 px-1.5 py-0.2 text-[9px] font-extrabold tracking-wide">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer System Status Banner */}
      <div className="mt-auto px-3 pt-4 border-t border-slate-100">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-700">AI Assessment Active</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Hybrid OCR & LLM Semantic Pipeline v2.4
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative w-64 max-w-xs bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
