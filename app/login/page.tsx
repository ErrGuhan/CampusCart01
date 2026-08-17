'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Store, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

// Flowing wave ribbon geometry matching reference image
function WavyRibbonBackground() {
  const orangeWaves = Array.from({ length: 22 }).map((_, i) => {
    const t = i / 21;
    const yStart = 720 + i * 8;
    const cp1x = 160 + i * 6;
    const cp1y = 860 - i * 7;
    const cp2x = 380 - i * 5;
    const cp2y = 520 + i * 5;
    const cp3x = 620 + i * 6;
    const cp3y = 460 - i * 6;
    const yEnd = 160 + i * 8;
    return {
      d: `M -60 ${yStart} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cp3x} ${cp3y} S 860 ${260 + i * 7}, 1080 ${yEnd}`,
      opacity: 0.35 + t * 0.45,
    };
  });

  const purpleWaves = Array.from({ length: 22 }).map((_, i) => {
    const t = i / 21;
    const yStart = 820 - i * 6;
    const cp1x = 320 + i * 5;
    const cp1y = 720 - i * 8;
    const cp2x = 580 - i * 6;
    const cp2y = 380 + i * 6;
    const cp3x = 780 + i * 5;
    const cp3y = 260 - i * 7;
    const yEnd = 60 + i * 8;
    return {
      d: `M 120 ${yStart} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cp3x} ${cp3y} S 920 ${180 + i * 6}, 1120 ${yEnd}`,
      opacity: 0.4 + t * 0.5,
    };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="warmFlame" x1="0%" y1="100%" x2="60%" y2="40%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#ef4444" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="neonMagenta" x1="40%" y1="60%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#d946ef" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c026d3" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Lower-left to center orange ribbon waves */}
        {orangeWaves.map((w, idx) => (
          <path
            key={`orange-wave-${idx}`}
            d={w.d}
            stroke="url(#warmFlame)"
            strokeWidth="0.85"
            strokeOpacity={w.opacity}
          />
        ))}

        {/* Center to upper-right magenta/violet ribbon waves */}
        {purpleWaves.map((w, idx) => (
          <path
            key={`purple-wave-${idx}`}
            d={w.d}
            stroke="url(#neonMagenta)"
            strokeWidth="0.85"
            strokeOpacity={w.opacity}
          />
        ))}
      </svg>
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
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="relative flex flex-col items-center justify-center w-full max-w-[480px]">
      {/* Signature Dark Glassmorphic Circular Disc */}
      <div className="relative w-full max-w-[420px] sm:max-w-[450px] aspect-square rounded-full p-8 sm:p-11 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a22]/75 via-[#111116]/80 to-[#0a0a0d]/85 backdrop-blur-3xl border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.95),inset_0_1.5px_1.5px_rgba(255,255,255,0.22),inset_0_-1.5px_1.5px_rgba(255,255,255,0.06)] overflow-hidden">
        
        {/* Subtle internal atmospheric glow (cyan + purple core) */}
        <div className="absolute inset-0 pointer-events-none rounded-full bg-[radial-gradient(circle_at_50%_52%,rgba(20,184,166,0.18)_0%,rgba(168,85,247,0.14)_45%,transparent_75%)]" />

        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Header Title */}
          <h1 className="font-display text-xl sm:text-2xl font-black tracking-[0.25em] text-white text-center mb-6 sm:mb-7 select-none">
            LOGIN
          </h1>

          <form onSubmit={handleSubmit} className="w-full space-y-3.5 sm:space-y-4">
            {/* Username / College Email Field */}
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Username / Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 sm:h-12 pl-4 pr-11 rounded-2xl bg-black/45 border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus-visible:bg-black/60 focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/30 transition-all"
                required
                autoComplete="email"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">
                <User className="h-4 sm:h-4.5 w-4 sm:w-4.5" />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 sm:h-12 pl-4 pr-11 rounded-2xl bg-black/45 border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus-visible:bg-black/60 focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/30 tracking-widest transition-all"
                required
                autoComplete="current-password"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">
                <Lock className="h-4 sm:h-4.5 w-4 sm:w-4.5" />
              </div>
            </div>

            {/* Center LOGIN Action Capsule Button */}
            <div className="pt-2 flex justify-center">
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[130px] h-9 sm:h-10 px-8 rounded-full bg-gradient-to-b from-[#383842] via-[#222228] to-[#121216] border border-white/30 text-white font-black tracking-[0.2em] text-[11px] sm:text-xs uppercase shadow-[0_6px_25px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.4)] hover:from-[#464652] hover:to-[#1a1a20] active:scale-95 transition-all touch-target"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'LOGIN'}
              </Button>
            </div>

            {/* Remember Me & Forgot Password Links */}
            <div className="pt-2 flex items-center justify-between text-[11px] sm:text-xs text-white/70 px-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer select-none"
              >
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-white/30 ${rememberMe ? 'bg-white/20 text-white' : 'bg-black/30'}`}>
                  {rememberMe && <Check className="h-2.5 w-2.5" />}
                </span>
                <span>Remember me</span>
              </button>

              <a
                href="mailto:campuscartsvcet@gmail.com?subject=CampusCart%20Password%20Reset%20Request"
                className="hover:text-white transition-colors hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* CampusCart Brand Navigation & Switch to Sign Up */}
      <div className="mt-6 flex flex-col items-center gap-2 z-10 text-center">
        <p className="text-xs text-white/60">
          Don&apos;t have an account?{' '}
          <Link
            href={redirectUrl !== '/' ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
            className="font-bold text-white hover:text-cyan-400 hover:underline transition-colors ml-1"
          >
            Sign up
          </Link>
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition-colors mt-1"
        >
          <Store className="h-3.5 w-3.5" />
          <span>CampusCart Hub</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#050508] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Glowing 3D Wireframe Wave Mesh Ribbons */}
      <WavyRibbonBackground />

      <Suspense fallback={<div className="h-[420px] w-[420px] rounded-full animate-pulse bg-white/5" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

