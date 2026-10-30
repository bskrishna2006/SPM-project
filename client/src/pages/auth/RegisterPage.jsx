import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
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
  const [course, setCourse] = useState('B.Tech CS');
  const [academicYear, setAcademicYear] = useState('Year 3');
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
      toast.success('Registration successful. Welcome!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your information.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 py-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-[500px] space-y-6">
        {/* Brand Monogram */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm mx-auto">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Student Registration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create your university task management account
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                placeholder="alex@stms.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Account Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="student">Student</option>
                <option value="team_leader">Team Leader</option>
              </Select>

              <Input
                label="Department"
                placeholder="Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Course / Degree"
                placeholder="B.Tech CS"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />

              <Input
                label="Academic Year"
                placeholder="Year 3"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-2.5 mt-2"
              isLoading={isLoading}
            >
              Complete Registration <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-medium text-slate-900 dark:text-slate-100 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
