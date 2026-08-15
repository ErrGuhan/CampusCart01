'use client';

import Link from 'next/link';
import {
  Sparkles, Palette, Code, Video, Box, BookOpen,
  ArrowRight, CheckCircle2, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const popularSkills = [
  {
    title: 'Poster & Graphic Design',
    desc: 'Symposium posters, club banners, Instagram flyers & Canva designs',
    icon: Palette,
    price: '₹150',
    slug: 'design-posters',
  },
  {
    title: 'Coding & Final Year Projects',
    desc: 'React web apps, Python scripts, Arduino & IoT hardware circuits',
    icon: Code,
    price: '₹400',
    slug: 'coding-tech',
  },
  {
    title: 'Reels & Video Editing',
    desc: 'Event aftermovies, Instagram reels, cuts, drone color grading',
    icon: Video,
    price: '₹300',
    slug: 'video-photography',
  },
  {
    title: '3D CAD & Prototype Printing',
    desc: 'SolidWorks 3D models, component casing & precision 3D printing',
    icon: Box,
    price: '₹200',
    slug: '3d-printing-cad',
  },
];

export function ServicesSection() {
  return (
    <section className="border-t border-border bg-card/40 py-16 sm:py-20">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campus Freelance & Services Hub</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              Hire Talented Students for Your Needs
            </h2>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground max-w-2xl">
              Need a symposium banner, a quick website, or help with your lab project? Connect with verified student freelancers on campus.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href="/services/bounties">
                <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Campus Bounties
              </Link>
            </Button>
            <Button size="sm" className="rounded-xl" asChild>
              <Link href="/services">
                Explore All Gigs
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularSkills.map((skill) => {
            const Icon = skill.icon;
            return (
              <Link
                key={skill.slug}
                href={`/services?category=${skill.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold group-hover:text-primary transition-colors leading-snug">
                    {skill.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {skill.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-border/80 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Starting from</span>
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {skill.price}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
