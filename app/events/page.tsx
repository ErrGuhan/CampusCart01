'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar, MapPin, Clock, Users, ExternalLink,
  Sparkles, CheckCircle2, Award, Search, Tag,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getCampusEvents } from '@/lib/firebase-queries';
import type { CampusEvent } from '@/lib/types';

export default function CampusEventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);

  const categories = [
    { value: 'all', label: 'All Events' },
    { value: 'hackathon', label: '⚡ Hackathons' },
    { value: 'symposium', label: '🏛️ Symposiums' },
    { value: 'workshop', label: '🛠️ Bootcamps' },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCampusEvents(selectedCategory);
        setEvents(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCategory]);

  function handleRegister(event: CampusEvent) {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to register for campus events.' });
      return;
    }
    if (registeredEvents.includes(event.id)) {
      toast({ title: 'Already Registered! 🎟️', description: `You are confirmed for ${event.title}.` });
      return;
    }

    setRegisteredEvents((prev) => [...prev, event.id]);
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, registeredCount: e.registeredCount + 1 } : e))
    );
    toast({
      title: 'Registration Confirmed! 🎉',
      description: `You are registered for "${event.title}". See you at ${event.venue}!`,
    });
  }

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      return (
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.organizer.toLowerCase().includes(search.toLowerCase()) ||
        e.venue.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [events, search]);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8 sm:py-12 min-h-screen">
        {/* Header */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-indigo-500/10 via-background to-purple-500/5 p-6 sm:p-10 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-500 mb-3">
              <Calendar className="h-4 w-4" />
              <span>Campus Tech & Cultural Hub</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Campus Events & Hackathons
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Register for national symposiums, 24-hour coding hackathons, IoT workshops, and club challenges.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
            {categories.map((c) => (
              <Button
                key={c.value}
                variant={selectedCategory === c.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(c.value)}
                className="rounded-xl text-xs whitespace-nowrap"
              >
                {c.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by event title, venue, or organizer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-secondary/50" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card/40">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">No events found</h3>
            <p className="text-xs text-muted-foreground mt-1">Check back later or change your search filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const isRegistered = registeredEvents.includes(event.id);

              return (
                <div
                  key={event.id}
                  className="rounded-3xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-md flex flex-col"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-secondary/50 relative">
                    <Image src={event.image} alt={event.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                    <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur capitalize text-xs z-10">
                      {event.category}
                    </Badge>
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold">
                      {event.price === 0 ? 'Free Entry' : `₹${event.price}`}
                    </Badge>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{event.date}</span>
                      <span>•</span>
                      <Clock className="h-3.5 w-3.5" />
                      <span>{event.time}</span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-foreground line-clamp-2">
                      {event.title}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-border/70 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">Organized by {event.organizer}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground font-medium">
                        👥 <strong>{event.registeredCount}</strong> registered
                      </span>

                      <Button
                        onClick={() => handleRegister(event)}
                        variant={isRegistered ? 'secondary' : 'default'}
                        className="rounded-xl text-xs font-semibold"
                      >
                        {isRegistered ? '✓ Registered' : 'Register Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
