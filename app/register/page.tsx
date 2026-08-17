'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Store, Loader2, GraduationCap, Building2 } from 'lucide-react';
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
          <linearGradient id="warmFlameReg" x1="0%" y1="100%" x2="60%" y2="40%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#ef4444" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="neonMagentaReg" x1="40%" y1="60%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#d946ef" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c026d3" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {orangeWaves.map((w, idx) => (
          <path
            key={`orange-wave-${idx}`}
            d={w.d}
            stroke="url(#warmFlameReg)"
            strokeWidth="0.85"
            strokeOpacity={w.opacity}
          />
        ))}

        {purpleWaves.map((w, idx) => (
          <path
            key={`purple-wave-${idx}`}
            d={w.d}
            stroke="url(#neonMagentaReg)"
            strokeWidth="0.85"
            strokeOpacity={w.opacity}
          />
        ))}
      </svg>
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

    if (!validateEmail(email)) {
      toast({
        title: 'Invalid email domain',
        description: `Please enter your college email (@${COLLEGE_EMAIL_DOMAIN}).`,
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are identical.',
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
    <div className="relative flex flex-col items-center justify-center w-full max-w-[500px]">
      {/* Signature Dark Glassmorphic Container matching Reference Aesthetic */}
      <div className="relative w-full rounded-[36px] sm:rounded-[44px] p-6 sm:p-9 flex flex-col items-center bg-gradient-to-b from-[#1a1a22]/80 via-[#111116]/85 to-[#0a0a0d]/90 backdrop-blur-3xl border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.95),inset_0_1.5px_1.5px_rgba(255,255,255,0.22),inset_0_-1.5px_1.5px_rgba(255,255,255,0.06)] overflow-hidden">
        
        {/* Subtle internal atmospheric core glow */}
        <div className="absolute inset-0 pointer-events-none rounded-[44px] bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.16)_0%,rgba(168,85,247,0.12)_45%,transparent_75%)]" />

        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Header Title */}
          <h1 className="font-display text-xl sm:text-2xl font-black tracking-[0.25em] text-white text-center mb-5 select-none">
            SIGN UP
          </h1>

          <form onSubmit={handleSubmit} className="w-full space-y-3">
            {/* Full Name */}
            <div className="relative">
              <Input
                id="displayName"
                type="text"
                placeholder="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 pl-4 pr-11 rounded-2xl bg-black/45 border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus-visible:bg-black/60 focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/30 transition-all"
                required
                autoComplete="name"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">
                <User className="h-4 w-4" />
              </div>
            </div>

            {/* College Email */}
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder={`College Email (@${COLLEGE_EMAIL_DOMAIN})`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-4 pr-11 rounded-2xl bg-black/45 border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus-visible:bg-black/60 focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/30 transition-all"
                required
                autoComplete="email"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">
                <Mail className="h-4 w-4" />
              </div>
            </div>

            {/* Department Select */}
            <div className="relative">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full h-11 px-4 rounded-2xl bg-black/45 border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus:border-white/40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-[#14141a]/95 border-white/20 text-white backdrop-blur-2xl shadow-2xl">
                  {COLLEGE_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-xs text-white/90 focus:bg-white/15 focus:text-white rounded-xl">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year of Study Select */}
            <div className="relative">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full h-11 px-4 rounded-2xl bg-black/45 border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus:border-white/40">
                  <SelectValue placeholder="Year of Study" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-[#14141a]/95 border-white/20 text-white backdrop-blur-2xl shadow-2xl">
                  {COLLEGE_YEARS.map((y) => (
                    <SelectItem key={y} value={y} className="text-xs text-white/90 focus:bg-white/15 focus:text-white rounded-xl">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="Password (at least 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-4 pr-11 rounded-2xl bg-black/45 border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus-visible:bg-black/60 focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/30 tracking-widest transition-all"
                required
                autoComplete="new-password"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">
                <Lock className="h-4 w-4" />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 pl-4 pr-11 rounded-2xl bg-black/45 border-white/20 text-white placeholder:text-white/40 text-xs sm:text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus-visible:bg-black/60 focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/30 tracking-widest transition-all"
                required
                autoComplete="new-password"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none">
                <Lock className="h-4 w-4" />
              </div>
            </div>

            {/* Center SIGN UP Action Capsule Button */}
            <div className="pt-2.5 flex justify-center">
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[140px] h-10 px-8 rounded-full bg-gradient-to-b from-[#383842] via-[#222228] to-[#121216] border border-white/30 text-white font-black tracking-[0.2em] text-[11px] sm:text-xs uppercase shadow-[0_6px_25px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.4)] hover:from-[#464652] hover:to-[#1a1a20] active:scale-95 transition-all touch-target"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'REGISTER'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* CampusCart Brand Navigation & Switch to Sign In */}
      <div className="mt-5 flex flex-col items-center gap-2 z-10 text-center">
        <p className="text-xs text-white/60">
          Already have an account?{' '}
          <Link
            href={redirectUrl !== '/' ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
            className="font-bold text-white hover:text-cyan-400 hover:underline transition-colors ml-1"
          >
            Sign in
          </Link>
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition-colors mt-0.5"
        >
          <Store className="h-3.5 w-3.5" />
          <span>CampusCart Hub</span>
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen w-full bg-[#050508] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Glowing 3D Wireframe Wave Mesh Ribbons */}
      <WavyRibbonBackground />

      <Suspense fallback={<div className="h-[520px] w-[460px] rounded-[44px] animate-pulse bg-white/5" />}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}

