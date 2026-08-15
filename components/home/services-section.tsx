'use client';

import Link from 'next/link';
import {
  Sparkles, Palette, Code, Video, Box, BookOpen,
  ArrowRight, CheckCircle2, Zap, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const popularSkills = [
  {
    title: 'Poster & Graphic Design',
    desc: 'Symposium posters, club banners, Instagram flyers & Canva designs',
    icon: Palette,
    price: '₹150',
    turnaround: '24 hours',
    slug: 'design-posters',
  },
  {
    title: 'Coding & Mini Projects',
    desc: 'React web apps, Python scripts, Arduino & IoT hardware circuits',
    icon: Code,
    price: '₹400',
    turnaround: '2-3 days',
    slug: 'coding-tech',
  },
  {
    title: 'Reels & Video Editing',
    desc: 'Event aftermovies, Instagram reels, cuts, drone color grading',
    icon: Video,
    price: '₹300',
    turnaround: 'Same day',
    slug: 'video-photography',
  },
  {
    title: '3D CAD & Prototype Printing',
    desc: 'SolidWorks 3D models, component casing & precision 3D printing',
    icon: Box,
    price: '₹200',
    turnaround: '1-2 days',
    slug: '3d-printing-cad',
  },
];

export function ServicesSection() {
  return (
    <section className="border-y border-border/80 bg-secondary/30 py-12 sm:py-16">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-0.5 text-xs font-bold text-indigo-600 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campus Freelance & Services Hub</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hire Talented Classmates for Your Needs
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Need a symposium banner, a quick website, or help with your lab project? Connect with verified student freelancers on campus.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl text-xs" asChild>
              <Link href="/services/bounties">
                <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Campus Bounties
              </Link>
            </Button>
            <Button size="sm" className="rounded-xl text-xs font-bold shadow-xs" asChild>
              <Link href="/services">
                Explore All Gigs
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {popularSkills.map((skill) => {
            const Icon = skill.icon;
            return (
              <Link
                key={skill.slug}
                href={`/services?category=${skill.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-5 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-95"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3 shadow-xs">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-foreground group-hover:text-indigo-600 transition-colors leading-snug">
                    {skill.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {skill.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{skill.turnaround}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block leading-none">Starting from</span>
                    <span className="font-bold text-foreground group-hover:text-indigo-600 transition-colors text-xs sm:text-sm">
                      {skill.price}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
