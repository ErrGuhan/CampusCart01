'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Store,
  Loader2,
  GraduationCap,
  Building2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  CheckCircle2,
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

// Ambient Theme Background with Vibrant Glow Orbs & Campus Grid
function AuthBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Background Ambient Glow Orbs in Theme Colors (Sky, Indigo, Purple, Amber) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-500/20 dark:bg-sky-500/15 blur-[100px] animate-pulse" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-500/20 dark:bg-indigo-600/15 blur-[110px]" />
      <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full bg-purple-500/15 dark:bg-purple-600/15 blur-[120px]" />
      <div className="absolute top-2/3 left-10 w-72 h-72 rounded-full bg-amber-500/10 dark:bg-amber-500/10 blur-[90px]" />

      {/* Subtle Dot Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}

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
        description: 'Welcome to CampusCart SVCET. You are now logged in.',
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
    <div className="relative z-10 w-full max-w-lg mx-auto">
      {/* Back to Home Link & Badge */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-background/60 dark:bg-card/60 backdrop-blur-md border border-border/60 hover:border-border shadow-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to CampusCart</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
          <Sparkles className="h-3 w-3" />
          <span>Join 120+ Students</span>
        </div>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="relative rounded-[28px] sm:rounded-3xl border border-white/80 dark:border-white/10 bg-white/85 dark:bg-card/85 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-primary/5">
        
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />

        {/* Card Header with Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6 sm:mb-7">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white font-bold shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
              <Store className="h-6 w-6" />
            </div>
          </Link>

          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Create <span className="text-gradient-primary">Account</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-sm mx-auto">
              Join SVCET&apos;s verified student marketplace to buy, sell, and collaborate
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          
          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="displayName"
              className="block text-xs font-bold text-foreground/80 uppercase tracking-wider pl-1"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <User className="h-4 w-4" />
              </div>
              <Input
                id="displayName"
                type="text"
                placeholder="Rahul Sharma"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl sm:rounded-2xl bg-secondary/40 dark:bg-secondary/20 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                required
                autoComplete="name"
              />
            </div>
          </div>

          {/* College Email Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-1">
              <label
                htmlFor="email"
                className="block text-xs font-bold text-foreground/80 uppercase tracking-wider"
              >
                College Email
              </label>
              <span className="text-[10px] font-semibold text-primary">
                @{COLLEGE_EMAIL_DOMAIN}
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Mail className="h-4 w-4" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder={`student@${COLLEGE_EMAIL_DOMAIN}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl sm:rounded-2xl bg-secondary/40 dark:bg-secondary/20 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Department and Year of Study (2-column on tablet/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-3">
            {/* Department */}
            <div className="space-y-1.5">
              <label
                htmlFor="department"
                className="block text-xs font-bold text-foreground/80 uppercase tracking-wider pl-1"
              >
                Department
              </label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full h-11 sm:h-12 px-3.5 rounded-xl sm:rounded-2xl bg-secondary/40 dark:bg-secondary/20 border-border/70 text-foreground text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/40">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Select Department" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60 bg-popover/98 border-border shadow-2xl backdrop-blur-xl">
                  {COLLEGE_DEPARTMENTS.map((dept) => (
                    <SelectItem
                      key={dept}
                      value={dept}
                      className="text-xs font-medium py-2 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer"
                    >
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year of Study */}
            <div className="space-y-1.5">
              <label
                htmlFor="year"
                className="block text-xs font-bold text-foreground/80 uppercase tracking-wider pl-1"
              >
                Year of Study
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full h-11 sm:h-12 px-3.5 rounded-xl sm:rounded-2xl bg-secondary/40 dark:bg-secondary/20 border-border/70 text-foreground text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/40">
                  <div className="flex items-center gap-2 truncate">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Select Year" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-popover/98 border-border shadow-2xl backdrop-blur-xl">
                  {COLLEGE_YEARS.map((y) => (
                    <SelectItem
                      key={y}
                      value={y}
                      className="text-xs font-medium py-2 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer"
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Passwords (2-column on tablet/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-3">
            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-foreground/80 uppercase tracking-wider pl-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-xl sm:rounded-2xl bg-secondary/40 dark:bg-secondary/20 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold text-foreground/80 uppercase tracking-wider pl-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-xl sm:rounded-2xl bg-secondary/40 dark:bg-secondary/20 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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

          {/* Submit Action Button */}
          <div className="pt-3">
            <Button
              type="submit"
              disabled={loading}
              className="btn-gradient-primary w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/70" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-card px-3 text-muted-foreground font-semibold">
              Already a member?
            </span>
          </div>
        </div>

        {/* Switch to Sign In */}
        <div className="text-center">
          <Button
            variant="outline"
            asChild
            className="w-full h-11 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border-border/80 hover:bg-secondary/70 transition-all"
          >
            <Link
              href={
                redirectUrl !== '/'
                  ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                  : '/login'
              }
            >
              Sign In to Existing Account
            </Link>
          </Button>
        </div>

        {/* Campus Trust Features */}
        <div className="mt-6 pt-5 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground leading-tight">
              Verified SVCET
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground leading-tight">
              0% Platform Fee
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground leading-tight">
              Direct Handover
            </span>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>
          By creating an account, you agree to CampusCart&apos;s campus trade and safety guidelines.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-[100dvh] w-full bg-background flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Campus Theme Ambient Mesh & Grid Background */}
      <AuthBackground />

      <Suspense
        fallback={
          <div className="h-[560px] w-full max-w-lg rounded-3xl animate-pulse bg-card/60 backdrop-blur-xl border border-border" />
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}


