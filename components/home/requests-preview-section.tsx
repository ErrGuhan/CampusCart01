'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Tag, Clock } from 'lucide-react';
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
    <section className="container-px mx-auto max-w-7xl py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
            <Tag className="h-3.5 w-3.5" />
            <span>Campus Request Board</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            What Students Are Looking For
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Have an item or notes a classmate needs? Make an offer and earn cash instantly.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1 self-start sm:self-auto">
          <Link href="/requests">
            View All Requests
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {requests.map((req) => (
          <div
            key={req.id}
            className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-9 w-9 ring-1 ring-border">
                  <AvatarImage src={req.requesterAvatar} alt={req.requesterName} />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {req.requesterName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate">{req.requesterName}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{req.requesterDepartment}</p>
                </div>
                <Badge variant="secondary" className="ml-auto text-[9px]">
                  {req.category}
                </Badge>
              </div>

              <h3 className="font-display text-base font-bold text-foreground line-clamp-2">
                {req.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                {req.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">Max Budget</span>
                <span className="text-sm font-bold text-primary">₹{req.budget}</span>
              </div>

              <Button asChild size="sm" className="rounded-xl text-xs">
                <Link href="/requests">Make Offer</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
