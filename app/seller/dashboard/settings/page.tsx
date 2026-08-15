'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store, Save, Loader2, User, Building2, GraduationCap,
  Star, Package, Calendar, Share2, Globe,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SellerSidebar } from '@/components/seller-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { getAllProducts } from '@/lib/firebase-queries';

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
  const [productCount, setProductCount] = useState(4);
  const [sellerRating, setSellerRating] = useState('4.9');

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
    getAllProducts().then((all) => {
      const isGuhan = profile?.username?.includes('guhan') || user?.email?.includes('guhan');
      const myProds = all.filter(
        (p) =>
          p.seller?.id === user?.uid ||
          p.seller?.username === profile?.username ||
          (isGuhan && p.seller?.username === 'guhan')
      );
      if (myProds.length > 0) {
        setProductCount(myProds.length);
        const avg = myProds.reduce((s, p) => s + p.rating, 0) / myProds.length;
        setSellerRating(avg.toFixed(1));
      }
    });
  }, [user?.uid, profile?.username]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-8">
          <div className="h-96 animate-pulse rounded-xl bg-secondary" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!profile?.is_seller) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Store className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h1 className="font-display text-2xl font-bold tracking-tight">Seller settings are locked</h1>
            <p className="mt-2 text-muted-foreground max-w-md">
              Only active sellers can edit their store settings. Other students continue using the marketplace as buyers.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild><Link href="/products">Explore Products</Link></Button>
              <Button variant="outline" asChild><Link href="/account/settings">Become a Seller</Link></Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

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
        title: 'Store profile updated! 🎉',
        description: 'Your seller profile has been saved.',
      });
    } catch (err) {
      console.error('Error saving seller profile:', err);
      toast({
        title: 'Could not save changes',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    if (profile?.username) {
      navigator.clipboard?.writeText(`${window.location.origin}/seller/${profile.username}`);
      toast({ title: 'Store link copied', description: 'Share your store with customers!' });
    }
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="mt-1.5 text-muted-foreground">Manage your seller profile and store details</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <SellerSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold">{displayName || 'Your Store'}</h2>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                      <Store className="h-3 w-3 mr-1" />
                      Seller
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">@{profile?.username || 'seller'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Store
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-border p-3 text-center bg-secondary/20">
                  <Star className="h-4 w-4 text-warning mx-auto mb-1 fill-warning" />
                  <div className="text-lg font-bold font-display">{sellerRating}</div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
                <div className="rounded-xl border border-border p-3 text-center bg-secondary/20">
                  <Package className="h-4 w-4 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold font-display">{productCount}</div>
                  <div className="text-xs text-muted-foreground">Products</div>
                </div>
                <div className="rounded-xl border border-border p-3 text-center bg-secondary/20">
                  <Calendar className="h-4 w-4 text-success mx-auto mb-1" />
                  <div className="text-lg font-bold font-display">
                    {(profile as any)?.created_at || (profile as any)?.joinedAt
                      ? new Date((profile as any)?.created_at || (profile as any)?.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'Jan 2024'}
                  </div>
                  <div className="text-xs text-muted-foreground">Joined</div>
                </div>
              </div>

              <Separator className="mb-6" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Display Name
                  </Label>
                  <Input id="store-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-bio">Store Bio</Label>
                  <Textarea
                    id="store-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell customers about your store and what you create..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="store-dept" className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Department
                    </Label>
                    <Input id="store-dept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Fine Arts" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-year" className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      Year
                    </Label>
                    <Input id="store-year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="3rd Year" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-skills" className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Skills (comma-separated)
                  </Label>
                  <Input id="store-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Pottery, Sculpture, Glazing" />
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Save Changes</>
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
