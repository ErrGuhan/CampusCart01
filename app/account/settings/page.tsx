'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Building2, GraduationCap, Save,
  Store, Loader2, Shield, Bell,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AccountSidebar } from '@/components/account-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, profile, loading, signOut, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifDeals, setNotifDeals] = useState(true);
  const [becomingSellerOpen, setBecomingSellerOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [becomingSeller, setBecomingSeller] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setDepartment(profile.department || '');
      setYear(profile.year || '');
    }
  }, [profile]);

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

  const initials = displayName
    ? displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile({
        display_name: displayName,
        department: department || null,
        year: year || null,
      });

      toast({
        title: 'Profile updated! 🎉',
        description: 'Your changes have been saved.',
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      toast({
        title: 'Could not save changes',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  async function handleBecomeSeller() {
    if (!user) return;
    if (!storeName.trim()) {
      toast({
        title: 'Store name required',
        description: 'Please enter a name for your store.',
        variant: 'destructive',
      });
      return;
    }

    setBecomingSeller(true);
    try {
      await updateUserProfile({
        is_seller: true,
        role: 'seller',
        display_name: storeName.trim() || displayName,
        bio: storeDescription || null,
      });

      toast({
        title: 'Welcome to the seller community! 🎉',
        description: 'Your store has been set up. You can now list products.',
      });
      setBecomingSellerOpen(false);
      router.push('/seller/dashboard');
    } catch (err) {
      console.error('Error becoming seller:', err);
      toast({
        title: 'Could not activate seller account',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBecomingSeller(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="mt-1.5 text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <AccountSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold mb-1">Profile Information</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Update your personal details visible to other users
              </p>

              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{displayName || 'Your name'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  {profile?.is_verified ? (
                    <Badge className="mt-1 bg-success/10 text-success hover:bg-success/10">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified Student
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-1">Unverified</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    disabled
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" className="text-sm font-medium flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    Year
                  </Label>
                  <Input
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g., 3rd Year"
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Choose what updates you want to receive
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Order updates</p>
                    <p className="text-xs text-muted-foreground">Get notified about your order status changes</p>
                  </div>
                  <Switch checked={notifOrders} onCheckedChange={setNotifOrders} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">New deals and discounts</p>
                    <p className="text-xs text-muted-foreground">Be the first to know about price drops</p>
                  </div>
                  <Switch checked={notifDeals} onCheckedChange={setNotifDeals} />
                </div>
              </div>
            </div>

            {!profile?.is_seller && (
              <>
                <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/30 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-bold">Become a Seller</h2>
                        <p className="text-sm text-muted-foreground">
                          Unlock the seller dashboard and start listing products to earn money
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setBecomingSellerOpen(true)}
                      className="flex-shrink-0"
                    >
                      Get Started
                    </Button>
                  </div>
                </div>

                <Dialog open={becomingSellerOpen} onOpenChange={setBecomingSellerOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Become a Seller</DialogTitle>
                      <DialogDescription>
                        Fill in your store details to start selling on CampusCart
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeName" className="text-sm font-medium">
                          Store Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="storeName"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          placeholder="e.g., Alex's Tech Store"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeDescription" className="text-sm font-medium">
                          Store Description (optional)
                        </Label>
                        <Textarea
                          id="storeDescription"
                          value={storeDescription}
                          onChange={(e) => setStoreDescription(e.target.value)}
                          placeholder="Tell buyers about your store and what you sell"
                          rows={4}
                        />
                      </div>

                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Note:</span> You can update your store details anytime from your seller dashboard.
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setBecomingSellerOpen(false)}
                        disabled={becomingSeller}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBecomeSeller}
                        disabled={becomingSeller || !storeName.trim()}
                      >
                        {becomingSeller ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Store className="h-4 w-4 mr-2" />
                            Activate Seller Account
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <h2 className="font-semibold text-sm text-destructive mb-1">Danger Zone</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Sign out of your account on this device
              </p>
              <Button variant="outline" onClick={handleSignOut} className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
