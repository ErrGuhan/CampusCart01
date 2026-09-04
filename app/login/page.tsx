'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { toast } = useToast();
  const { signIn, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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

  function handleOpenForgotModal() {
    setResetEmail(email.trim());
    setResetSuccess(false);
    setForgotModalOpen(true);
  }

  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    const targetEmail = resetEmail.trim();

    if (!targetEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter the email associated with your account.',
        variant: 'destructive',
      });
      return;
    }

    setResetLoading(true);
    const result = await sendPasswordReset(targetEmail);
    setResetLoading(false);

    if (result.success) {
      setResetSuccess(true);
      toast({
        title: 'Reset link sent! 📬',
        description: `We've sent a password reset link to ${targetEmail}.`,
      });
    } else {
      toast({
        title: 'Reset failed',
        description: result.error || 'Could not send reset link. Please verify your email.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="relative z-10 w-full max-w-[390px] mx-auto flex flex-col items-center">
      {/* Main Glassmorphism Card */}
      <div className="w-full rounded-[28px] sm:rounded-3xl bg-card/90 dark:bg-card/85 backdrop-blur-xl border border-border/80 shadow-xl p-6 sm:p-7">
        
        {/* CampusCart Title & Header with Official Logo */}
        <div className="text-center mt-1 mb-6 flex flex-col items-center">
          <Link href="/" className="group mb-2.5 inline-flex flex-col items-center">
            <div className="relative h-16 w-16 sm:h-18 sm:w-18 transition-transform group-hover:scale-105 duration-300">
              <Image
                src="/images/logo/logo-icon.png"
                alt="CampusCart Logo"
                width={72}
                height={72}
                priority
                className="object-contain w-full h-full filter drop-shadow-md"
              />
            </div>
            <div className="mt-1 flex items-center justify-center">
              <h1 className="font-display text-2xl sm:text-[26px] font-black tracking-tight text-foreground">
                Campus<span className="text-amber-500 dark:text-amber-400">Cart</span>
              </h1>
            </div>
          </Link>
          <h2 className="text-lg font-bold text-foreground">
            Welcome back
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Sign in to your Student Marketplace account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-foreground"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@svcet.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 focus:bg-secondary/80 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-none"
              required
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-foreground"
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
                className="w-full h-12 pl-4 pr-11 rounded-xl bg-secondary/50 hover:bg-secondary/70 focus:bg-secondary/80 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-none"
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
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Right-Aligned Link (triggers reset modal) */}
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={handleOpenForgotModal}
              className="text-xs font-semibold text-primary hover:underline transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign In Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl btn-gradient-primary active:scale-[0.98] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
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
        <div className="mt-5 pt-4 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={
                redirectUrl !== '/'
                  ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                  : '/register'
              }
              className="font-bold text-primary hover:underline ml-1"
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
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Campus Marketplace</span>
        </Link>
      </div>

      {/* Interactive Forgot Password Modal */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-6 bg-card/95 dark:bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl">
          <DialogHeader className="space-y-1.5 text-center sm:text-left">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>Reset Password</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter the email address registered with your account. We will send you a secure link to reset your password.
            </DialogDescription>
          </DialogHeader>

          {resetSuccess ? (
            <div className="py-4 space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Email Sent!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  A password reset link has been sent to <span className="font-semibold text-foreground">{resetEmail}</span>. Please check your inbox and spam folders.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="w-full h-11 rounded-xl btn-gradient-primary text-white font-semibold text-xs mt-2"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendResetEmail} className="space-y-4 pt-2">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="resetEmail"
                  className="block text-xs font-semibold text-foreground"
                >
                  Email address
                </label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="you@svcet.edu"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-secondary/50 border-border/70 text-foreground placeholder:text-muted-foreground/60 text-sm focus-visible:ring-2 focus-visible:ring-primary"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border-border/70 text-xs font-semibold text-foreground hover:bg-secondary/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 h-11 rounded-xl btn-gradient-primary text-white font-semibold text-xs shadow-sm"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white mr-1.5" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] w-full bg-gradient-to-b from-background via-muted/30 to-background dark:from-background dark:via-secondary/10 dark:to-background flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      <Suspense
        fallback={
          <div className="h-[480px] w-full max-w-[390px] rounded-3xl animate-pulse bg-card/70 shadow-lg" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}





