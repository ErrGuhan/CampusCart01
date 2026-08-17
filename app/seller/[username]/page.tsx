import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Star, Calendar, ArrowRight, Store, Sparkles, Package,
  MessageSquare, ShoppingBag, Send, ChevronRight, CheckCircle2,
  GraduationCap, Bell, Wrench, ShieldCheck, Heart,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { GigCard } from '@/components/gig-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareProfileButton } from '@/components/share-profile-button';
import { getSellerByUsername, getProductsBySeller, getGigsBySeller } from '@/lib/firebase-queries';

type Props = { params: { username: string } | Promise<{ username: string }> };

function parseDeptCode(dept?: string): string {
  if (!dept) return 'CSE';
  if (dept.includes('CSE') || dept.toLowerCase().includes('computer')) return 'CSE';
  if (dept.includes('ECE') || dept.toLowerCase().includes('electronics')) return 'ECE';
  if (dept.includes('EEE') || dept.toLowerCase().includes('electrical')) return 'EEE';
  if (dept.includes('MECH') || dept.toLowerCase().includes('mechanical')) return 'MECH';
  if (dept.includes('CIVIL') || dept.toLowerCase().includes('civil')) return 'CIVIL';
  if (dept.includes('IT') || dept.toLowerCase().includes('information')) return 'IT';
  if (dept.includes('AI') || dept.toLowerCase().includes('artificial')) return 'AI/DS';
  return dept.split(' ')[0].toUpperCase();
}

function parseYearNum(year?: string): string {
  if (!year) return '3';
  const match = year.match(/\d+/);
  return match ? match[0] : '3';
}

export default async function SellerProfilePage({ params }: Props) {
  const resolved = await params;
  const username = resolved.username;
  const seller = await getSellerByUsername(username);

  if (!seller) notFound();

  const [sellerProducts, sellerGigs] = await Promise.all([
    getProductsBySeller(username),
    getGigsBySeller(username),
  ]);

  const joinDate = seller.joinedAt
    ? !isNaN(new Date(seller.joinedAt).getTime())
      ? new Date(seller.joinedAt).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : 'Aug 2026'
    : 'Aug 2026';

  const deptCode = parseDeptCode(seller.department);
  const yearNum = parseYearNum(seller.year);
  const totalListings = sellerProducts.length + sellerGigs.length;

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-4xl py-5 sm:py-8 space-y-4 sm:space-y-6">
        {/* Subtle Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-1">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="text-border">/</span>
          <Link href="/sellers" className="hover:text-primary transition-colors">Creators</Link>
          <span className="text-border">/</span>
          <span className="text-foreground truncate max-w-[200px]">{seller.displayName}</span>
        </nav>

        {/* 1. Hero Card: Warm Sunset / Golden Yellow Card with Rounded Pill Badges */}
        <div className="rounded-[2.25rem] bg-gradient-to-br from-[#FFF3D6] via-[#FFF9ED] to-[#FFE7BA] dark:from-amber-950/40 dark:via-card dark:to-orange-950/30 border border-[#FDE0A6] dark:border-amber-500/20 p-5 sm:p-7 shadow-xs relative overflow-hidden">
          {/* Top Row: Avatar, Greeting / Name, and Share Action */}
          <div className="flex items-start justify-between gap-3.5 relative z-10">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-amber-300/40 dark:ring-amber-500/30 shadow-xs shrink-0 rounded-full bg-amber-200">
                <AvatarImage src={seller.avatar} alt={seller.displayName} />
                <AvatarFallback className="text-xl sm:text-2xl font-black bg-amber-200 text-amber-950">
                  {seller.displayName?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100 tracking-tight leading-tight truncate">
                    {seller.displayName} <span className="inline-block">☀️</span>
                  </h1>
                </div>
                <p className="text-xs sm:text-sm font-medium text-amber-800/80 dark:text-amber-200/80 mt-0.5 flex items-center gap-1 leading-snug">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>
                    {totalListings > 0
                      ? `${totalListings} active campus ${totalListings === 1 ? 'offering' : 'offerings'}`
                      : 'Verified student creator & maker'}
                  </span>
                </p>
              </div>
            </div>

            {/* Top Right Floating Action Button */}
            <ShareProfileButton />
          </div>

          {/* Middle Row: Pill Badges */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2 relative z-10">
            <div className="inline-flex items-center gap-1 rounded-xl bg-white/90 dark:bg-card/90 px-3 py-1.5 text-xs font-bold text-amber-950 dark:text-foreground shadow-2xs border border-amber-200/60 dark:border-border">
              <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
              <span>{deptCode}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl bg-white/90 dark:bg-card/90 px-3 py-1.5 text-xs font-bold text-amber-950 dark:text-foreground shadow-2xs border border-amber-200/60 dark:border-border">
              <span className="text-muted-foreground text-[10px]">YR</span>
              <span>{yearNum}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl bg-white/90 dark:bg-card/90 px-3 py-1.5 text-xs font-bold text-amber-950 dark:text-foreground shadow-2xs border border-amber-200/60 dark:border-border">
              <Package className="h-3.5 w-3.5 text-amber-600" />
              <span>{sellerProducts.length} {sellerProducts.length === 1 ? 'ITEM' : 'ITEMS'}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl bg-white/90 dark:bg-card/90 px-3 py-1.5 text-xs font-bold text-amber-950 dark:text-foreground shadow-2xs border border-amber-200/60 dark:border-border">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{seller.rating > 0 ? `${seller.rating.toFixed(1)} RATING` : 'NEW MAKER'}</span>
            </div>
          </div>

          {/* Bottom Row Strip inside hero card */}
          <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-500/20 flex items-center justify-between text-[11px] font-extrabold tracking-wider text-amber-900/70 dark:text-amber-300/60 uppercase">
            <span>STUDENT ENTREPRENEUR</span>
            <span>JOINED {joinDate}</span>
          </div>
        </div>

        {/* 2. Announcement / Creator Bio Strip */}
        <div className="rounded-2xl border border-amber-200/60 dark:border-border/80 bg-amber-50/70 dark:bg-card p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold tracking-wider text-amber-700 dark:text-amber-400 uppercase block leading-none mb-1">
                CREATOR BIO & HIGHLIGHT
              </span>
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-xl">
                {seller.bio || 'Building and listing verified student gear and freelance services on campus.'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        </div>

        {/* 3. Quick Action Hub: 4 Responsive Squircle Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Action 1: Chat / Message */}
          <Link
            href={`/messages`}
            className="group flex flex-col items-center justify-center p-4 rounded-3xl border border-border/80 bg-card hover:bg-secondary/40 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 shadow-2xs"
          >
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-2xs">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              Chat & Inquire
            </span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Instant message</span>
          </Link>

          {/* Action 2: Hardware & Kits */}
          <Link
            href="#store-offerings"
            className="group flex flex-col items-center justify-center p-4 rounded-3xl border border-border/80 bg-card hover:bg-secondary/40 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 shadow-2xs"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-2xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              Hardware & Kits
            </span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{sellerProducts.length} items listed</span>
          </Link>

          {/* Action 3: Freelance Services */}
          <Link
            href="#store-offerings"
            className="group flex flex-col items-center justify-center p-4 rounded-3xl border border-border/80 bg-card hover:bg-secondary/40 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 shadow-2xs"
          >
            <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-2xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              Freelance Gigs
            </span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{sellerGigs.length} services</span>
          </Link>

          {/* Action 4: Pitch Collaboration */}
          <Link
            href="/requests"
            className="group flex flex-col items-center justify-center p-4 rounded-3xl border border-border/80 bg-card hover:bg-secondary/40 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 shadow-2xs"
          >
            <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-2xs">
              <Send className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              Pitch / Collab
            </span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Request board</span>
          </Link>
        </div>

        {/* 4. Skills & Tech Stack Section */}
        {seller.skills && seller.skills.length > 0 && (
          <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-primary" />
              <h2 className="font-display text-xs sm:text-sm font-extrabold tracking-tight text-foreground uppercase">
                Verified Maker Skills & Expertise
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {seller.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-xl bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground border border-border/60 transition-all select-none shadow-2xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 5. Published Store Catalog Tabs & Showcase */}
        <div id="store-offerings" className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
          <Tabs defaultValue="products" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm sm:text-base font-extrabold text-foreground">
                  Published Offerings
                </h2>
              </div>

              <TabsList className="bg-secondary/60 p-1 rounded-2xl w-full sm:w-auto grid grid-cols-2 sm:flex">
                <TabsTrigger value="products" className="rounded-xl text-xs font-bold gap-1.5 py-2">
                  <Package className="h-3.5 w-3.5" />
                  <span>Gear & Kits ({sellerProducts.length})</span>
                </TabsTrigger>
                <TabsTrigger value="services" className="rounded-xl text-xs font-bold gap-1.5 py-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Freelance Gigs ({sellerGigs.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Products Tab */}
            <TabsContent value="products" className="mt-0">
              {sellerProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-12 px-4 text-center bg-secondary/20">
                  <Store className="h-10 w-10 text-muted-foreground/40 mb-2.5" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">No physical products listed yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm font-medium">
                    This creator hasn't published physical gear or notes yet. Check out their freelance services!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-3">
                  {sellerProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Freelance Services Tab */}
            <TabsContent value="services" className="mt-0">
              {sellerGigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-12 px-4 text-center bg-secondary/20">
                  <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-2.5" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">No freelance gigs offered yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm font-medium">
                    This creator hasn't posted freelance services yet. You can request custom help via the Request Board.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {sellerGigs.map((gig) => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
