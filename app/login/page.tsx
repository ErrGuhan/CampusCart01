'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Store, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

// Official SVCET College Crest / Emblem Component
function SvcetCollegeEmblem() {
  return (
    <div className="relative flex items-center justify-center mb-5 select-none">
      {/* Soft radial aura behind the emblem */}
      <div className="absolute w-28 h-28 rounded-full bg-blue-500/15 blur-xl pointer-events-none" />

      <svg
        className="w-24 h-24 sm:w-28 sm:h-28 relative z-10 drop-shadow-md"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldBorder" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <linearGradient id="shieldInner" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="handsBlue" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>

        {/* Shield Outer Border */}
        <path
          d="M100 20 L145 35 C145 80, 135 110, 100 132 C65 110, 55 80, 55 35 Z"
          fill="url(#shieldInner)"
          stroke="url(#shieldBorder)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Silver Inner Accent Ring */}
        <path
          d="M100 26 L139 39 C139 76, 130 103, 100 124 C70 103, 61 76, 61 39 Z"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />

        {/* Shield Quadrant Dividers */}
        <line x1="100" y1="26" x2="100" y2="124" stroke="#22c55e" strokeWidth="2.5" />
        <line x1="61" y1="72" x2="139" y2="72" stroke="#22c55e" strokeWidth="2.5" />

        {/* Quadrant 1 (Top-Left): Computer & Electronics */}
        <g transform="translate(71, 38)">
          <rect x="0" y="0" width="18" height="13" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <rect x="2" y="2" width="14" height="9" fill="#38bdf8" />
          <path d="M5 14 L13 14 L11 16 L7 16 Z" fill="#475569" />
          <line x1="5" y1="5" x2="13" y2="5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          <line x1="5" y1="7" x2="10" y2="7" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Quadrant 2 (Top-Right): Civil & Surveying */}
        <g transform="translate(111, 38)">
          {/* Surveyor with tripod/theodolite */}
          <circle cx="5" cy="4" r="2.5" fill="#0f172a" />
          <path d="M3 7 L7 7 L9 16 L7 16 L5 11 L3 16 L1 16 Z" fill="#0f172a" />
          <path d="M11 5 L17 5 L16 8 L12 8 Z" fill="#0284c7" />
          <line x1="14" y1="8" x2="10" y2="18" stroke="#334155" strokeWidth="1.5" />
          <line x1="14" y1="8" x2="14" y2="18" stroke="#334155" strokeWidth="1.5" />
          <line x1="14" y1="8" x2="18" y2="18" stroke="#334155" strokeWidth="1.5" />
        </g>

        {/* Quadrant 3 (Bottom-Left): Windmills / Sustainable Energy */}
        <g transform="translate(72, 80)">
          <line x1="9" y1="7" x2="9" y2="22" stroke="#475569" strokeWidth="1.5" />
          <circle cx="9" cy="7" r="1.5" fill="#0f172a" />
          {/* 3 blades */}
          <path d="M9 7 L9 0 L10 7 Z" fill="#0284c7" />
          <path d="M9 7 L3 11 L9 8 Z" fill="#0284c7" />
          <path d="M9 7 L15 11 L9 8 Z" fill="#0284c7" />
          {/* Small background windmill */}
          <line x1="16" y1="12" x2="16" y2="22" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="16" cy="12" r="1" fill="#475569" />
          <path d="M16 12 L16 8 L17 12 Z" fill="#94a3b8" />
          <path d="M16 12 L12 14 L16 13 Z" fill="#94a3b8" />
          <path d="M16 12 L20 14 L16 13 Z" fill="#94a3b8" />
        </g>

        {/* Quadrant 4 (Bottom-Right): Robotics & Innovation */}
        <g transform="translate(112, 79)">
          {/* Robot head & antenna */}
          <line x1="9" y1="1" x2="9" y2="4" stroke="#0f172a" strokeWidth="1" />
          <circle cx="9" cy="1" r="1" fill="#ef4444" />
          <rect x="3" y="4" width="12" height="9" rx="2" fill="#334155" />
          <circle cx="6" cy="7" r="1.5" fill="#38bdf8" />
          <circle cx="12" cy="7" r="1.5" fill="#38bdf8" />
          <rect x="6" y="10" width="6" height="1.5" rx="0.5" fill="#ffffff" />
          {/* Robot body & gears */}
          <rect x="4" y="14" width="10" height="8" rx="1.5" fill="#475569" />
          <circle cx="9" cy="18" r="2" fill="#fbbf24" stroke="#0f172a" strokeWidth="0.8" />
        </g>

        {/* Supporting Royal Blue Hands / Wings Embracing the Shield */}
        <path
          d="M38 78 C32 100, 36 128, 55 146 C70 160, 88 168, 100 178 C112 168, 130 160, 145 146 C164 128, 168 100, 162 78 C158 98, 150 118, 135 132 C120 146, 108 152, 100 158 C92 152, 80 146, 65 132 C50 118, 42 98, 38 78 Z"
          fill="url(#handsBlue)"
        />

        {/* Inner Hand Palm / Flame Accent */}
        <path
          d="M100 140 C108 132, 122 120, 126 102 C120 116, 108 126, 100 134 C92 126, 80 116, 74 102 C78 120, 92 132, 100 140 Z"
          fill="#1d4ed8"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

// Official Accreditation Badges Banner (SVCET + NAAC A + NBA + ISO)
function AccreditationBanner() {
  return (
    <div className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
      {/* College Logo & Name */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[9px] shrink-0 shadow-2xs">
          SVCET
        </div>
        <div className="flex flex-col text-left leading-none min-w-0">
          <span className="font-extrabold text-[10px] sm:text-[11px] text-slate-800 tracking-tight truncate">
            srivenkateshwaraa
          </span>
          <span className="text-[7.5px] text-slate-500 font-medium truncate">
            College of Engineering & Technology
          </span>
        </div>
      </div>

      {/* Accreditation Marks */}
      <div className="flex items-center gap-1 shrink-0">
        {/* NAAC Grade A Badge */}
        <div className="flex items-center px-1.5 py-0.5 rounded bg-red-50 border border-red-200">
          <span className="text-[7.5px] font-black text-red-700 leading-none">
            NAAC <span className="text-red-600 font-extrabold">A</span>
          </span>
        </div>

        {/* NBA Badge */}
        <div className="flex items-center px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200">
          <span className="text-[7.5px] font-black text-sky-800 leading-none">
            NBA
          </span>
        </div>

        {/* ISO Badge */}
        <div className="flex items-center px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
          <span className="text-[7.5px] font-black text-blue-800 leading-none">
            ISO
          </span>
        </div>
      </div>
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
      {/* SVCET Emblem above card */}
      <SvcetCollegeEmblem />

      {/* Main Clean White Card */}
      <div className="w-full rounded-[28px] sm:rounded-3xl bg-white border border-slate-100/80 shadow-[0_12px_45px_rgba(0,0,0,0.07)] p-6 sm:p-7">
        
        {/* Accreditation Header Box */}
        <AccreditationBanner />

        {/* CampusConnect Title & Header */}
        <div className="text-center mt-5 mb-6 space-y-1">
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



