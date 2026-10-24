import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Mail,
  Lock,
  User,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [course, setCourse] = useState('B.Tech Computer Science');
  const [academicYear, setAcademicYear] = useState('Year 3 (2026)');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
        department: department.trim(),
        course: course.trim(),
        academicYear: academicYear.trim(),
      });
      toast.success('Registration successful! Welcome to STMS.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-slate-950 text-slate-100">
      {/* Left Column: Academic Studio Showcase */}
      <div className="w-full lg:w-[45%] xl:w-[42%] bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-hidden bg-grid-pattern">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center border border-indigo-500/30">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-tight text-white block">
                STMS ENROLLMENT
              </span>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">
                Student Directory Registry
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide bg-slate-800/80 text-indigo-300 border border-slate-700/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              SELF-ENROLLMENT OPEN · TERM 2026-27
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight leading-[1.15]">
              Enroll in your university cohort workspace.
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-[50ch]">
              Create an institutional profile to access capstone teams, receive task assignments from team leads, and submit project milestones.
            </p>
          </div>

          {/* Academic Role Card */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Academic Cohort Privileges</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>Collaborative Kanban boards with real-time sync</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>Secure document vault for code, reports, and assets</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>Proactive deadline alerts & semester progress telemetry</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Technical Footnote */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>ROLE ENFORCEMENT ACTIVE</span>
          </div>
          <span>ACADEMIC VERIFICATION</span>
        </div>
      </div>

      {/* Right Column: Clean Form Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-slate-950">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-medium tracking-widest uppercase text-indigo-400">
              Student Registration
            </span>
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-xs text-slate-400">
              Fill in your student information to generate your workspace profile.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Name"
                icon={User}
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="College Email"
                type="email"
                icon={Mail}
                placeholder="alex.student@stms.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Min. 6 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                icon={Lock}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Select
                label="Account Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="student">Student (Peer / Member)</option>
                <option value="team_leader">Team Leader (Project Lead)</option>
              </Select>

              <Input
                label="Department"
                placeholder="Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Course / Degree"
                placeholder="B.Tech Computer Science"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />

              <Input
                label="Academic Year"
                placeholder="Year 3 (2026)"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
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
                Complete Registration <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Already have an academic profile?</span>
            <Link
              to="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign In Instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
