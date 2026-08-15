'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Tag, Clock, Plus, DollarSign } from 'lucide-react';
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
    <section className="container-px mx-auto max-w-7xl py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-600 mb-1.5">
            <Tag className="h-3.5 w-3.5" />
            <span>Campus Request Board</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            What Classmates Are Looking For
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Have an item or notes a classmate needs? Make an offer and earn cash instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1">
            <Link href="/requests">
              View All Requests
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {requests.map((req) => (
          <div
            key={req.id}
            className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-5 sm:p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-md transition-all duration-200"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-9 w-9 ring-1 ring-border shrink-0">
                  <AvatarImage src={req.requesterAvatar} alt={req.requesterName} />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {req.requesterName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs truncate text-foreground">{req.requesterName}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{req.requesterDepartment}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 shrink-0">
                  {req.category}
                </Badge>
              </div>

              <h3 className="font-display text-sm sm:text-base font-bold text-foreground line-clamp-2 leading-snug">
                {req.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                {req.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block leading-none">Max Budget</span>
                <span className="text-sm font-extrabold text-emerald-600">₹{req.budget}</span>
              </div>

              <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                <Link href="/requests">
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  Make Offer
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
