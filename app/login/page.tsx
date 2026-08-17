'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { toast } = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({
        title: 'Missing credentials',
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
    <div className="relative z-10 w-full max-w-[390px] mx-auto flex flex-col items-center">
      {/* Main Clean White Card */}
      <div className="w-full rounded-[28px] sm:rounded-3xl bg-white border border-slate-100/80 shadow-[0_12px_45px_rgba(0,0,0,0.07)] p-6 sm:p-7">
        
        {/* CampusConnect Title & Header */}
        <div className="text-center mt-2 mb-6 space-y-1">
          <h1 className="font-display text-2xl font-black text-[#2563eb] tracking-tight">
            CampusConnect
          </h1>
          <h2 className="text-lg font-bold text-slate-900">
            Welcome back
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Sign in to your Smart Campus portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@svcet.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-slate-50/80 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all shadow-none"
              required
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700"
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
                className="w-full h-12 pl-4 pr-11 rounded-xl bg-slate-50/80 hover:bg-slate-50 focus:bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all shadow-none"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Right-Aligned */}
          <div className="flex justify-end pt-0.5">
            <a
              href="mailto:campuscartsvcet@gmail.com?subject=CampusCart%20Password%20Reset%20Request"
              className="text-xs font-semibold text-[#2563eb] hover:text-blue-700 hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Solid Blue Sign In Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-[#1d63ff] hover:bg-[#1554e0] active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in &rarr;</span>
              )}
            </Button>
          </div>
        </form>

        {/* Switch to Sign Up */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href={
                redirectUrl !== '/'
                  ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                  : '/register'
              }
              className="font-bold text-[#2563eb] hover:underline ml-1"
            >
              Sign up
            </Link>
          </p>
        </div>

      </div>

      {/* Return to Marketplace link */}
      <div className="mt-5 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Campus Marketplace</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] w-full bg-gradient-to-b from-[#e8edfc] via-[#f1f5f9] to-[#ffffff] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      <Suspense
        fallback={
          <div className="h-[480px] w-full max-w-[390px] rounded-3xl animate-pulse bg-white/70 shadow-lg" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}




