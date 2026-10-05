import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isStudent, isTeacher, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      toast.success('Welcome back to EXAMIND!');

      // Redirect based on previous location or role
      if (from) {
        navigate(from, { replace: true });
      } else {
        // Will be routed by role in AppRoutes
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error(msg, 'Authentication Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/50">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to EXAMIND</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your exams, AI evaluation results, and institution dashboard.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600">
            <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span>Remember this device</span>
          </label>
          <a href="#forgot" onClick={(e) => { e.preventDefault(); toast.info('Please contact your institution administrator to reset credentials.'); }} className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-4"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* Demo Credentials Quick Switcher */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Demo Quick Fill
          </span>
          <span className="text-[10px] text-slate-400">Default: Password123!</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDemoCredentials('student@examind.edu')}
            className="p-2 text-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors"
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials('teacher@examind.edu')}
            className="p-2 text-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors"
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials('admin@examind.edu')}
            className="p-2 text-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors"
          >
            Admin
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
          Create an account
        </Link>
      </div>
    </div>
  );
};
