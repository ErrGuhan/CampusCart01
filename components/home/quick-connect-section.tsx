'use client';

import Link from 'next/link';
import { Rocket, TestTube2, Wrench, Users, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const connectCards = [
  {
    title: 'Need a Co-Founder?',
    subtitle: 'Find coders, designers & makers',
    icon: Rocket,
    tag: 'LOOKING_FOR_COFOUNDER',
    color: 'from-blue-600 to-indigo-600',
    bgColor: 'bg-blue-500/10 text-blue-600',
    borderColor: 'border-blue-500/30',
  },
  {
    title: 'Looking for Beta Testers?',
    subtitle: 'Get feedback from campus peers',
    icon: TestTube2,
    tag: 'BETA_TESTERS',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10 text-amber-600',
    borderColor: 'border-amber-500/30',
  },
  {
    title: 'Need Hardware Tools?',
    subtitle: 'Borrow boards, meters & kits',
    icon: Wrench,
    tag: 'HARDWARE_HELP',
    color: 'from-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-500/10 text-cyan-600',
    borderColor: 'border-cyan-500/30',
  },
  {
    title: 'Find a Teammate',
    subtitle: 'Hackathons & Symposiums',
    icon: Users,
    tag: 'GENERAL',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-500/10 text-emerald-600',
    borderColor: 'border-emerald-500/30',
  },
];

export function QuickConnectSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-6 sm:py-10">
      <div className="flex items-end justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Campus Collaboration Hub</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Connect & Build with Students
          </h2>
        </div>
        <Link
          href="/requests"
          className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:gap-2 transition-all"
        >
          Open Request Board
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal Scrollable Row on mobile, 4-col grid on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {connectCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={`/requests?tag=${card.tag}`}
              className={cn(
                'group flex flex-col justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]',
                card.borderColor
              )}
            >
              <div>
                <div className={cn('flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl mb-3 shadow-2xs group-hover:scale-105 transition-transform', card.bgColor)}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-display font-extrabold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground font-medium line-clamp-2">
                  {card.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] sm:text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                <span>Connect</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
