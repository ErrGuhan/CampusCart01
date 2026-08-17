'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { COLLEGE_DEPARTMENTS, COLLEGE_YEARS } from '@/lib/campus-constants';

const COLLEGE_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN || 'svcet.ac.in';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { toast } = useToast();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function validateEmail(value: string): boolean {
    const domain = value.split('@')[1]?.toLowerCase();
    return (
      domain === COLLEGE_EMAIL_DOMAIN.toLowerCase() ||
      domain?.endsWith('.edu') ||
      domain?.endsWith('.ac.in') ||
      domain === 'gmail.com'
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!displayName.trim()) {
      toast({
        title: 'Full name required',
        description: 'Please enter your name.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: 'Invalid email domain',
        description: `Please enter your college email (@${COLLEGE_EMAIL_DOMAIN}) or recognized academic email.`,
        variant: 'destructive',
      });
      return;
    }

    if (!department) {
      toast({
        title: 'Department required',
        description: 'Please select your department.',
        variant: 'destructive',
      });
      return;
    }

    if (!year) {
      toast({
        title: 'Year of study required',
        description: 'Please select your current year of study.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords match exactly.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const result = await signUp({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      department: department.trim(),
      year: year.trim(),
    });

    setLoading(false);

    if (result.success) {
      toast({
        title: 'Account created! 🎉',
        description: 'Welcome to CampusConnect. You are now logged in.',
      });
      router.push(redirectUrl);
    } else {
      toast({
        title: 'Registration failed',
        description: result.error || 'Please check your information and try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[440px] mx-auto flex flex-col items-center">
      {/* Main Glassmorphism Mint Cream Card */}
      <div className="w-full rounded-[28px] sm:rounded-3xl bg-[#F5FFFA]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_16px_50px_rgba(29,91,241,0.08)] p-6 sm:p-7">
        
        {/* CampusConnect Title & Header */}
        <div className="text-center mt-2 mb-5 space-y-1">
          <h1 className="font-display text-2xl font-black text-[#1D5BF1] tracking-tight">
            CampusConnect
          </h1>
          <h2 className="text-lg font-bold text-[#0F172A]">
            Create account
          </h2>
          <p className="text-xs text-[#64748B] font-medium">
            Join the Smart Campus student network
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1 text-left">
            <label
              htmlFor="displayName"
              className="block text-xs font-semibold text-[#0F172A]"
            >
              Full name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="Rahul Sharma"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#F5FFFA]/70 hover:bg-[#F5FFFA] focus:bg-[#F5FFFA] border-[#D2D6EE] text-[#0F172A] placeholder:text-[#94A3B8] text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#1D5BF1] focus-visible:border-[#1D5BF1] transition-all shadow-none"
              required
              autoComplete="name"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1 text-left">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[#0F172A]"
            >
              College Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder={`you@${COLLEGE_EMAIL_DOMAIN}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#F5FFFA]/70 hover:bg-[#F5FFFA] focus:bg-[#F5FFFA] border-[#D2D6EE] text-[#0F172A] placeholder:text-[#94A3B8] text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#1D5BF1] focus-visible:border-[#1D5BF1] transition-all shadow-none"
              required
              autoComplete="email"
            />
          </div>

          {/* Department & Year (2-column on sm) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 text-left">
              <label
                htmlFor="department"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Department
              </label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-[#F5FFFA]/70 border-[#D2D6EE] text-[#0F172A] text-xs font-medium focus:ring-2 focus:ring-[#1D5BF1]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                    <SelectValue placeholder="Department" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-56 bg-[#F5FFFA]/95 backdrop-blur-xl border border-white/80 dark:border-border shadow-xl">
                  {COLLEGE_DEPARTMENTS.map((dept) => (
                    <SelectItem
                      key={dept}
                      value={dept}
                      className="text-xs font-medium py-1.5 rounded-lg focus:bg-[#E2E4F6]/50 focus:text-[#1D5BF1] cursor-pointer text-[#0F172A]"
                    >
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 text-left">
              <label
                htmlFor="year"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Year of Study
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-[#F5FFFA]/70 border-[#D2D6EE] text-[#0F172A] text-xs font-medium focus:ring-2 focus:ring-[#1D5BF1]">
                  <div className="flex items-center gap-1.5 truncate">
                    <GraduationCap className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                    <SelectValue placeholder="Year" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-[#F5FFFA]/95 backdrop-blur-xl border border-white/80 dark:border-border shadow-xl">
                  {COLLEGE_YEARS.map((y) => (
                    <SelectItem
                      key={y}
                      value={y}
                      className="text-xs font-medium py-1.5 rounded-lg focus:bg-[#E2E4F6]/50 focus:text-[#1D5BF1] cursor-pointer text-[#0F172A]"
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Passwords (2-column on sm) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 text-left">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-9 rounded-xl bg-[#F5FFFA]/70 hover:bg-[#F5FFFA] focus:bg-[#F5FFFA] border-[#D2D6EE] text-[#0F172A] placeholder:text-[#94A3B8] text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#1D5BF1] focus-visible:border-[#1D5BF1] transition-all shadow-none"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                Confirm
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-9 rounded-xl bg-[#F5FFFA]/70 hover:bg-[#F5FFFA] focus:bg-[#F5FFFA] border-[#D2D6EE] text-[#0F172A] placeholder:text-[#94A3B8] text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#1D5BF1] focus-visible:border-[#1D5BF1] transition-all shadow-none"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Solid Blue Register Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-[#1D5BF1] hover:bg-[#184ECC] active:scale-[0.98] text-[#F5FFFA] font-semibold text-sm shadow-md shadow-[#1D5BF1]/25 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#F5FFFA]" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Register &rarr;</span>
              )}
            </Button>
          </div>
        </form>

        {/* Switch to Sign In */}
        <div className="mt-5 pt-4 border-t border-[#E2E4F6] text-center">
          <p className="text-xs text-[#64748B]">
            Already have an account?{' '}
            <Link
              href={
                redirectUrl !== '/'
                  ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                  : '/login'
              }
              className="font-bold text-[#1D5BF1] hover:text-[#3B42C4] hover:underline ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>

      </div>

      {/* Return to Marketplace */}
      <div className="mt-4 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Campus Marketplace</span>
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-[100dvh] w-full bg-gradient-to-b from-[#E2E4F6] via-[#EEF0FA] to-[#F5FFFA] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      <Suspense
        fallback={
          <div className="h-[520px] w-full max-w-[440px] rounded-3xl animate-pulse bg-[#F5FFFA]/70 shadow-lg" />
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}




