'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Sparkles, Award, ArrowRight, CheckCircle2, Rocket, Users, Wrench } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CreatorSpotlight() {
  return (
    <section className="container-px mx-auto max-w-7xl py-6 sm:py-10">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background p-5 sm:p-8 shadow-sm">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left profile info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-primary/20 shadow-md">
                <AvatarImage src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" alt="Guhan M" />
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">GM</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                <Award className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Student Creator of the Week</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Guhan M
                </h3>
                <Badge variant="secondary" className="text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified Founder
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                4th Year Computer Science & Engineering • Fullstack Developer & IoT Maker
              </p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Next.js', 'Hardware Prototyping', 'IoT Sensors', 'Figma UI/UX'].map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-secondary/80 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/80 border border-border/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Metrics & CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4 shrink-0 border-t md:border-t-0 md:border-l border-border/70 pt-4 md:pt-0 md:pl-6">
            <div className="grid grid-cols-3 gap-4 text-left md:text-right">
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Rating</span>
                <span className="font-black text-foreground text-base sm:text-lg flex items-center md:justify-end gap-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  5.0
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Projects</span>
                <span className="font-black text-foreground text-base sm:text-lg">14+</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Helped</span>
                <span className="font-black text-primary text-base sm:text-lg">42</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button asChild size="sm" className="btn-gradient-primary rounded-xl text-xs font-bold shadow-xs flex-1 sm:flex-none touch-target min-h-[44px] sm:min-h-auto">
                <Link href="/seller/guhan_dev">
                  <span>View Creator Profile</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
