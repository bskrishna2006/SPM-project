import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const DEMO_PERSONAS = [
  { role: 'student', label: 'Student', email: 'alex.student@stms.edu', icon: GraduationCap },
  { role: 'team_leader', label: 'Team Lead', email: 'maya.leader@stms.edu', icon: Users },
  { role: 'admin', label: 'Faculty Admin', email: 'admin@stms.edu', icon: ShieldCheck },
];

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@stms.edu');
  const [password, setPassword] = useState('Password123!');
  const [activePersona, setActivePersona] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      toast.success('Signed in successfully.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid institutional email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = (p) => {
    setActivePersona(p.role);
    setEmail(p.email);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Brand Monogram */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm mx-auto">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Student Task Management System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Institutional project tracking and academic collaboration
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Academic Email"
              type="email"
              icon={Mail}
              placeholder="e.g. alex.student@stms.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                icon={Lock}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-2.5 mt-2"
              isLoading={isLoading}
            >
              Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Understated Demo Account Picker */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mb-2 font-medium">
              Demo accounts (1-click fill)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_PERSONAS.map((p) => {
                const Icon = p.icon;
                const isSelected = activePersona === p.role;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    className={`px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          New student this semester?{' '}
          <Link
            to="/register"
            className="font-medium text-slate-900 dark:text-slate-100 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
