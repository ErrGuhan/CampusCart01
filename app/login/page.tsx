'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { toast } = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({
        title: 'Missing information',
        description: 'Please enter both your email and password.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (result.success) {
      toast({
        title: 'Welcome back! 🎉',
        description: 'You have been signed in successfully.',
      });
      router.push(redirectUrl);
    } else {
      toast({
        title: 'Sign in failed',
        description: result.error || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="relative z-10 w-full max-w-md mx-auto">
      {/* Back to Home Link */}
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
          <span>SVCET Hub</span>
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
              Welcome <span className="text-gradient-primary">Back</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xs mx-auto">
              Sign in to manage your campus listings, orders, and student chats
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-bold text-foreground/80 uppercase tracking-wider pl-1"
            >
              College Email or Username
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Mail className="h-4 w-4" />
              </div>
              <Input
                id="email"
                type="text"
                placeholder="student@svcet.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl sm:rounded-2xl bg-secondary/40 dark:bg-secondary/20 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-1">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-foreground/80 uppercase tracking-wider"
              >
                Password
              </label>
              <a
                href="mailto:campuscartsvcet@gmail.com?subject=CampusCart%20Password%20Reset%20Request"
                className="text-[11px] font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Lock className="h-4 w-4" />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 sm:h-12 pl-10 pr-11 rounded-xl sm:rounded-2xl bg-secondary/40 dark:bg-secondary/20 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary transition-all"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="pt-1 flex items-center justify-between pl-1">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-md border transition-all ${
                  rememberMe
                    ? 'bg-primary border-primary text-primary-foreground shadow-2xs'
                    : 'border-muted-foreground/40 bg-secondary/40'
                }`}
              >
                {rememberMe && <CheckCircle2 className="h-3 w-3" />}
              </span>
              <span>Keep me signed in</span>
            </button>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="btn-gradient-primary w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to CampusCart</span>
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
              New to CampusCart?
            </span>
          </div>
        </div>

        {/* Switch to Sign Up */}
        <div className="text-center">
          <Button
            variant="outline"
            asChild
            className="w-full h-11 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border-border/80 hover:bg-secondary/70 transition-all"
          >
            <Link
              href={
                redirectUrl !== '/'
                  ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                  : '/register'
              }
            >
              Create Free Student Account
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
          By signing in, you agree to CampusCart&apos;s campus trade and safety guidelines.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] w-full bg-background flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Campus Theme Ambient Mesh & Grid Background */}
      <AuthBackground />

      <Suspense
        fallback={
          <div className="h-[480px] w-full max-w-md rounded-3xl animate-pulse bg-card/60 backdrop-blur-xl border border-border" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}


