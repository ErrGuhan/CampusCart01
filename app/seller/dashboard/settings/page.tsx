'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store, Save, Loader2, User, Building2, GraduationCap,
  Star, Package, Calendar, Share2, Globe, ShieldCheck,
  ExternalLink, Sparkles, Copy, Check, ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SellerSidebar } from '@/components/seller-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllProductsAdmin, getAllGigsAdmin } from '@/lib/firebase-queries';
import { COLLEGE_DEPARTMENTS, COLLEGE_YEARS } from '@/lib/campus-constants';
import { cn } from '@/lib/utils';

export default function SellerSettingsPage() {
  const router = useRouter();
  const { user, profile, loading, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [skills, setSkills] = useState('');
  const [saving, setSaving] = useState(false);
  const [productCount, setProductCount] = useState(1);
  const [sellerRating, setSellerRating] = useState('5.0');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setDepartment(profile.department || '');
      setYear(profile.year || '');
      setBio(profile.bio || '');
      setSkills((profile.skills || []).join(', '));
    }
  }, [profile]);

  useEffect(() => {
    Promise.all([getAllProductsAdmin(), getAllGigsAdmin()]).then(([allProds, allGigs]) => {
      const username = profile?.username?.toLowerCase() || '';
      const isGuhan = username.includes('guhan') || user?.email?.toLowerCase().includes('guhan');

      const myProds = allProds.filter((p) => {
        const pU = p.seller?.username?.toLowerCase() || '';
        const pId = p.seller?.id || '';
        return pId === user?.uid || pU === username || (isGuhan && (pU === 'guhan' || pId === 'seller-guhan'));
      });

      const myGigs = allGigs.filter((g) => {
        const gU = g.seller?.username?.toLowerCase() || '';
        const gId = g.sellerId || g.seller?.id || '';
        return gId === user?.uid || gU === username || (isGuhan && (gU === 'guhan' || gId === 'seller-guhan'));
      });

      const totalItems = myProds.length + myGigs.length;
      setProductCount(totalItems);

      const allRatings = [...myProds.map((p) => p.rating), ...myGigs.map((g) => g.rating)].filter((r) => r > 0);
      if (allRatings.length > 0) {
        const avg = allRatings.reduce((s, r) => s + r, 0) / allRatings.length;
        setSellerRating(avg.toFixed(1));
      }
    });
  }, [user?.uid, profile?.username, user?.email]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-8">
          <div className="h-96 animate-pulse rounded-3xl bg-secondary/50" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user.email?.slice(0, 2).toUpperCase() || 'CC');

  const joinedDateFormatted = (profile as any)?.created_at || (profile as any)?.joinedAt
    ? new Date((profile as any)?.created_at || (profile as any)?.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Jan 2024';

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      await updateUserProfile({
        display_name: displayName,
        department: department || null,
        year: year || null,
        bio: bio || null,
        skills: skillsArray,
      });

      toast({
        title: 'Store Settings Saved! 🎉',
        description: 'Your public seller profile and studio details are updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Could not save changes',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    const handle = profile?.username || user?.email?.split('@')[0] || 'seller';
    const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/seller/${handle}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      setCopiedLink(true);
      toast({ title: 'Store link copied! 🔗', description: storeUrl });
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-4 sm:py-8 pb-28 md:pb-12">
        
        {/* Page Title */}
        <div className="mb-5 sm:mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Store Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Customize your campus storefront, verified bio, and creator identity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-4">
          
          {/* Sidebar / Navigation tabs */}
          <aside className="lg:block">
            <SellerSidebar />
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-5 sm:space-y-6">
            
            {/* 1. Hero Store Identity Card */}
            <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/20 shrink-0 shadow-xs">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={displayName} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-black text-base sm:text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-base sm:text-xl font-bold truncate text-foreground leading-tight">
                        {displayName || 'Campus Creator'}
                      </h2>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] sm:text-[11px] font-bold px-2 py-0.5">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified Seller
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1 font-medium">
                      @{profile?.username || user.email?.split('@')[0] || 'seller'}
                    </p>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="rounded-xl h-9 text-xs font-bold gap-1.5 border-border bg-card hover:bg-secondary active:scale-95 transition-transform"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-primary" />}
                    <span>{copiedLink ? 'Copied' : 'Share Store'}</span>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    className="btn-gradient-primary rounded-xl h-9 text-xs font-bold gap-1.5 shadow-xs active:scale-95 transition-transform"
                  >
                    <Link href={`/seller/${profile?.username || 'seller'}`}>
                      <span>View Storefront</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* 3 Clean Modern Metric Pills */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50 text-center">
                  <span className="text-[11px] text-muted-foreground font-semibold block leading-tight">Rating</span>
                  <span className="font-extrabold text-sm sm:text-base text-amber-600 dark:text-amber-400 mt-0.5 block">
                    ★ {sellerRating}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50 text-center">
                  <span className="text-[11px] text-muted-foreground font-semibold block leading-tight">Live Listings</span>
                  <span className="font-extrabold text-sm sm:text-base text-foreground mt-0.5 block">
                    {productCount}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50 text-center">
                  <span className="text-[11px] text-muted-foreground font-semibold block leading-tight">Member Since</span>
                  <span className="font-extrabold text-sm sm:text-base text-foreground mt-0.5 block truncate">
                    {joinedDateFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Store Settings Form Cards */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm space-y-6">
              
              {/* Section Header */}
              <div className="border-b border-border/60 pb-3">
                <h3 className="font-display text-base font-bold text-foreground">Store Details & Public Profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Information displayed on your public storefront and product cards.</p>
              </div>

              <div className="space-y-4">
                
                {/* Display Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="store-name" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    Display Name / Creator Name
                  </Label>
                  <Input
                    id="store-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Dharshini M"
                    className="h-11 rounded-xl bg-secondary/30 border-border/80 text-xs sm:text-sm font-medium"
                  />
                </div>

                {/* Store Bio */}
                <div className="space-y-1.5">
                  <Label htmlFor="store-bio" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Store Bio & Description
                  </Label>
                  <Textarea
                    id="store-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Describe what you create, tools you use, or campus meetup preferences..."
                    className="rounded-xl bg-secondary/30 border-border/80 text-xs sm:text-sm leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">This bio appears on your creator page and product detail badges.</p>
                </div>

                {/* Academic Department & Year */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-dept" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Department
                    </Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="store-dept" className="h-11 rounded-xl bg-secondary/30 border-border/80 text-xs sm:text-sm font-medium">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl max-h-56">
                        {COLLEGE_DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept} className="rounded-xl text-xs py-2">
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="store-year" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                      Year of Study
                    </Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger id="store-year" className="h-11 rounded-xl bg-secondary/30 border-border/80 text-xs sm:text-sm font-medium">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {COLLEGE_YEARS.map((yr) => (
                          <SelectItem key={yr} value={yr} className="rounded-xl text-xs py-2">
                            {yr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Skills & Specialties */}
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="store-skills" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    Skills & Specialties (comma separated)
                  </Label>
                  <Input
                    id="store-skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Calligraphy, Graphic Design, Lab Notes, 3D Printing"
                    className="h-11 rounded-xl bg-secondary/30 border-border/80 text-xs sm:text-sm font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">Highlight tags to help classmates discover your freelance gigs.</p>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-gradient-primary rounded-xl h-11 px-6 text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-transform"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
