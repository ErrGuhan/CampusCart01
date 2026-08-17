'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Tag, Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAllProductRequests } from '@/lib/firebase-queries';
import type { ProductRequest } from '@/lib/types';

export function RequestsPreviewSection() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = await getAllProductRequests();
        if (mounted) {
          setRequests(list.filter((r) => r.status === 'open').slice(0, 3));
        }
      } catch {}
    }
    load();

    const handleUpdate = () => load();
    window.addEventListener('campuscart_request_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('campuscart_request_updated', handleUpdate);
    };
  }, []);

  return (
    <section className="container-px mx-auto max-w-7xl py-8 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs sm:text-sm font-bold text-emerald-600 mb-1.5">
            <Tag className="h-4 w-4" />
            <span>Campus Request Board</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            What Classmates Are Looking For
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5 font-medium">
            Looking for specific gear or notes? Post what you need and peers will respond.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" size="sm" className="rounded-2xl text-xs sm:text-sm h-11 px-5 font-bold gap-1.5">
            <Link href="/requests">
              View All Requests
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/90 bg-card/50 p-10 sm:p-14 text-center">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 shadow-xs">
            <Tag className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
            No active campus requests yet
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
            Need a specific textbook, drawing board, lab coat, or calculator for upcoming classes? Post your request to classmates!
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button asChild size="default" className="rounded-2xl text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs h-11 px-6">
              <Link href="/requests">
                <Plus className="h-4.5 w-4.5 mr-1.5" />
                Post What You Need
              </Link>
            </Button>
            <Button asChild size="default" variant="outline" className="rounded-2xl text-sm font-bold h-11 px-6">
              <Link href="/marketplace">
                Explore Marketplace
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-2xs"
            >
              <div>
                <div className="flex items-center gap-3 mb-3.5">
                  <Avatar className="h-10 w-10 ring-2 ring-border/80 shrink-0">
                    <AvatarImage src={req.requesterAvatar} alt={req.requesterName} />
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {req.requesterName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm truncate text-foreground">{req.requesterName}</h4>
                    <p className="text-xs text-muted-foreground truncate">{req.requesterDepartment}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs px-2.5 py-0.5 shrink-0 font-bold">
                    {req.category}
                  </Badge>
                </div>

                <h3 className="font-display text-base sm:text-lg font-extrabold text-foreground line-clamp-2 leading-snug">
                  {req.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed font-medium">
                  {req.description}
                </p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground font-medium block leading-none">Max Budget</span>
                  <span className="text-base sm:text-lg font-black text-emerald-600">₹{req.budget}</span>
                </div>

                <Button asChild size="sm" className="rounded-2xl text-xs sm:text-sm h-10 px-4 font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                  <Link href="/requests">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Make Offer
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
