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
    <section className="border-y border-border/80 bg-secondary/30 py-10 sm:py-16">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs sm:text-sm font-bold text-indigo-600 mb-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Campus Freelance Hub</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Hire Talented Classmates for Your Needs
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-muted-foreground max-w-2xl font-medium">
              Need a symposium banner, a quick website, or help with your lab project? Connect with verified student freelancers on campus.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button variant="outline" size="sm" className="rounded-2xl text-xs sm:text-sm h-11 px-4 font-bold" asChild>
              <Link href="/services/bounties">
                <Zap className="h-4 w-4 mr-1.5 text-primary" />
                Campus Bounties
              </Link>
            </Button>
            <Button size="sm" className="rounded-2xl text-xs sm:text-sm h-11 px-5 font-extrabold shadow-xs" asChild>
              <Link href="/services">
                Explore All Gigs
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {popularSkills.map((skill) => {
            const Icon = skill.icon;
            return (
              <Link
                key={skill.slug}
                href={`/services?category=${skill.slug}`}
                className="group relative flex flex-col h-full justify-between rounded-3xl border border-border/80 bg-card/85 dark:bg-card/75 backdrop-blur-md p-5 sm:p-6 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-95 shadow-2xs"
              >
                <div>
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-4 shadow-2xs">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-extrabold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {skill.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                    {skill.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-border/70 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{skill.turnaround}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block leading-none font-medium">Starting from</span>
                    <span className="font-extrabold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm sm:text-base">
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
