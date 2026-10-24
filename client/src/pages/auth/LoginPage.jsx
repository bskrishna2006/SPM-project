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
  CheckCircle2,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const DEMO_ACCOUNTS = [
  {
    role: 'student',
    title: 'Student Identity',
    email: 'alex.student@stms.edu',
    name: 'Alex Rivera',
    dept: 'Computer Science · Year 3',
    icon: GraduationCap,
    badge: 'STUDENT',
  },
  {
    role: 'team_leader',
    title: 'Team Lead Identity',
    email: 'maya.leader@stms.edu',
    name: 'Maya Lin',
    dept: 'Software Eng · Capstone Lead',
    icon: Users,
    badge: 'LEADER',
  },
  {
    role: 'admin',
    title: 'Faculty Admin Identity',
    email: 'admin@stms.edu',
    name: 'Dr. Aris Vance',
    dept: 'Academic Affairs · Faculty',
    icon: ShieldCheck,
    badge: 'ADMIN',
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@stms.edu');
  const [password, setPassword] = useState('Password123!');
  const [selectedDemo, setSelectedDemo] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      toast.success('Authenticated successfully. Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid institutional email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (demo) => {
    setSelectedDemo(demo.role);
    setEmail(demo.email);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-slate-950 text-slate-100">
      {/* Left Column: Academic Studio Showcase */}
      <div className="w-full lg:w-[48%] xl:w-[45%] bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-hidden bg-grid-pattern">
        {/* Top Branding */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center border border-indigo-500/30">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-tight text-white block">
                STMS PORTAL
              </span>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">
                Academic Task Engine
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide bg-slate-800/80 text-indigo-300 border border-slate-700/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CAMPUS NODE ONLINE · TERM 2026-27
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight leading-[1.15]">
              Coordinated academic projects & milestone deliverables.
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-[50ch]">
              Engineered for undergraduate teams, research groups, and supervising faculty. Real-time Kanban boards, verifiable task states, and secure document vaults.
            </p>
          </div>
        </div>

        {/* Middle: Interactive Academic Identity Switcher */}
        <div className="my-8 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-400">
              Select Demo Identity
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              1-Click Autofill
            </span>
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((demo) => {
              const Icon = demo.icon;
              const isSelected = selectedDemo === demo.role;
              return (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleSelectDemo(demo)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-150 flex items-center justify-between group ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/80 ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {demo.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                            isSelected
                              ? 'bg-indigo-950 text-indigo-300 border-indigo-700/60'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {demo.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {demo.dept}
                      </span>
                    </div>
                  </div>

                  <div className="pl-3 shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">
                        Use →
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Technical Footnote */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>ROLE-BASED RBAC ENFORCED</span>
          </div>
          <span>TLS 1.3 SECURED</span>
        </div>
      </div>

      {/* Right Column: Clean Form Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-slate-950">
        <div className="w-full max-w-md space-y-7">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-medium tracking-widest uppercase text-indigo-400">
              Institutional Access
            </span>
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">
              Sign In to STMS
            </h2>
            <p className="text-xs text-slate-400">
              Enter your academic email address and password to continue.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-medium tracking-wider uppercase text-slate-400">
                  Password <span className="text-rose-500">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
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

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-3"
                isLoading={isLoading}
              >
                Sign In to Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>New student this term?</span>
            <Link
              to="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Enroll Student Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
