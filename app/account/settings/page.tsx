'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Building2, GraduationCap, Save,
  Store, Loader2, Shield, Bell, Camera, Upload,
  Sparkles, Trash2, Check, ExternalLink, HelpCircle,
  MessageSquare, FileText,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { COLLEGE_DEPARTMENTS, COLLEGE_YEARS } from '@/lib/campus-constants';

const AVATAR_PRESETS = [
  { label: '3D Coder Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SVCETbot&backgroundColor=b6e3f4,c0aede' },
  { label: 'Adventurer Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4,d1d4f9' },
  { label: 'Techie Zoe', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=ffd5dc,ffdfbf' },
  { label: 'Cyber Spark Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CampusSpark&backgroundColor=d1d4f9,c0aede' },
  { label: 'Artist Maya', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya&backgroundColor=ffdfbf,ffd5dc' },
  { label: '3D Cool Star', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=StarVibe&backgroundColor=fef08a,fed7aa' },
];

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, profile, loading, signOut, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      setBio(profile.bio || '');
      setSkills(Array.isArray(profile.skills) ? profile.skills.join(', ') : '');
      setAvatarUrl(profile.avatar_url || '');
      setCustomUrlInput(profile.avatar_url || '');
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

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload an image file (PNG, JPG, JPEG, WEBP).',
        variant: 'destructive',
      });
      return;
    }

    // Limit to 5MB max
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setAvatarUrl(dataUrl);
      setCustomUrlInput(dataUrl);
      setUploadingImage(false);
      toast({
        title: 'Photo ready! 📸',
        description: 'Click "Save Changes" to apply your new profile photo.',
      });
    };
    reader.onerror = () => {
      setUploadingImage(false);
      toast({
        title: 'Upload failed',
        description: 'Could not read image file. Please try again.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  }

  function handleSelectPreset(presetUrl: string) {
    setAvatarUrl(presetUrl);
    setCustomUrlInput(presetUrl);
    toast({
      title: 'Avatar preset selected! ✨',
      description: 'Click "Save Changes" to apply.',
    });
  }

  function handleApplyCustomUrl() {
    if (!customUrlInput.trim()) {
      setAvatarUrl('');
      return;
    }
    setAvatarUrl(customUrlInput.trim());
    toast({
      title: 'Photo URL applied! 🌐',
      description: 'Click "Save Changes" to save.',
    });
  }

  function handleRemovePhoto() {
    setAvatarUrl('');
    setCustomUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast({
      title: 'Profile photo removed',
      description: 'Default initials avatar will be shown.',
    });
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const parsedSkills = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await updateUserProfile({
        display_name: displayName.trim() || 'Student',
        department: department || null,
        year: year || null,
        bio: bio.trim() || null,
        skills: parsedSkills,
        avatar_url: avatarUrl || null,
      });

      toast({
        title: 'Profile updated! 🎉',
        description: 'Your profile photo and information have been saved.',
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
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-10 min-h-screen w-full min-w-0 overflow-hidden">
        <div className="mb-6 sm:mb-8 w-full min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Account Settings</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage your student profile photo, academic info, and campus preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-4 w-full min-w-0">
          <aside className="lg:block">
            <AccountSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-6">
            {/* 1. Profile Photo Editor Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 mb-1 text-primary text-xs font-bold">
                <Camera className="h-4 w-4" />
                <span>Profile Photo Studio</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold">Edit Profile Photo</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Upload a picture, paste a photo URL, or choose a student avatar preset
              </p>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-secondary/40 border border-border/60 mb-6">
                {/* Large Preview */}
                <div className="relative group">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-primary/20 shadow-md">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl sm:text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 active:scale-95"
                    title="Upload new image"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">{displayName || 'Student User'}</h3>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="rounded-xl text-xs font-bold h-8 gap-1.5 shadow-xs"
                    >
                      {uploadingImage ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="h-3.5 w-3.5" /> Upload from Device</>
                      )}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRemovePhoto}
                        className="rounded-xl text-xs h-8 gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo Options: URL input & Presets */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="photoUrl" className="text-xs font-semibold text-foreground">
                    Or Paste Custom Image URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="photoUrl"
                      placeholder="https://example.com/your-photo.jpg"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="rounded-xl text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCustomUrl}
                      className="rounded-xl text-xs font-semibold shrink-0 h-9"
                    >
                      Preview URL
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-xs font-semibold text-foreground block">
                    Quick Avatar Presets:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSelectPreset(preset.url)}
                          className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-xs'
                              : 'border-border/80 bg-secondary/30 hover:border-border hover:bg-secondary/70'
                          }`}
                        >
                          <Avatar className="h-11 w-11 sm:h-12 sm:w-12">
                            <AvatarImage src={preset.url} alt={preset.label} className="object-cover" />
                            <AvatarFallback>ST</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center group-hover:text-foreground">
                            {preset.label}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Personal Information Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs">
              <h2 className="font-display text-lg sm:text-xl font-bold mb-1">Academic & Profile Details</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Update your department, semester year, and skills visible to classmates
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-xs font-semibold flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Display Name *
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    className="rounded-xl text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    College Email (Verified)
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-secondary/60 rounded-xl text-xs h-9 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-xs font-semibold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Department / Branch
                  </Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger id="department" className="w-full rounded-xl text-xs h-9">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {COLLEGE_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-xs">
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="year" className="text-xs font-semibold flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    Year of Study
                  </Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="year" className="w-full rounded-xl text-xs h-9">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {COLLEGE_YEARS.map((yr) => (
                        <SelectItem key={yr} value={yr} className="text-xs">
                          {yr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="bio" className="text-xs font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Bio / Student Intro
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. 3rd year CSE student interested in IoT and robotics. Selling semester 4 notes and Casio fx-991EX calculator."
                    rows={3}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="skills" className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Skills & Specialties (comma separated)
                  </Label>
                  <Input
                    id="skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Next.js, SolidWorks CAD, Poster Design, Python, Lab Assistance"
                    className="rounded-xl text-xs h-9"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-xl text-xs font-bold h-10 px-6 shadow-xs gap-1.5">
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...</>
                    ) : (
                      <><Save className="h-4 w-4" /> Save Profile Changes</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* 3. Official Feedback & Help Card */}
            <div className="rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-card to-background p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-0.5 text-xs font-bold text-indigo-600 mb-2">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Official Campus Support & Feedback</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Have feedback or need assistance?
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-lg">
                    Contact the CampusCart team for queries, feedback, feature requests, or order disputes at{' '}
                    <strong className="text-foreground">campuscartsvcet@gmail.com</strong>.
                  </p>
                </div>

                <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shrink-0 self-start sm:self-center gap-1.5">
                  <a href="mailto:campuscartsvcet@gmail.com?subject=CampusCart%20Student%20Feedback%20%26%20Inquiry">
                    <Mail className="h-3.5 w-3.5" />
                    Email Support
                  </a>
                </Button>
              </div>
            </div>

            {/* 4. Notification Preferences */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs">
              <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </h2>
              <p className="text-xs text-muted-foreground mb-5">
                Choose what updates and campus deals you want to receive
              </p>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Order & Handover Updates</p>
                    <p className="text-muted-foreground text-[11px]">Get notified about your purchase and pickup PIN confirmation</p>
                  </div>
                  <Switch checked={notifOrders} onCheckedChange={setNotifOrders} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Campus Deals & Bounties</p>
                    <p className="text-muted-foreground text-[11px]">Be notified when notes or items you requested become available</p>
                  </div>
                  <Switch checked={notifDeals} onCheckedChange={setNotifDeals} />
                </div>
              </div>
            </div>

            {/* 5. Become a Seller if not already */}
            {!profile?.is_seller && (
              <>
                <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-5 sm:p-7 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold shrink-0 shadow-xs">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-foreground">Become a Campus Seller</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                          Unlock the seller dashboard to list textbooks, project kits, or offer freelance services with zero fees.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setBecomingSellerOpen(true)}
                      className="rounded-xl text-xs font-bold shrink-0 self-start sm:self-center shadow-xs"
                    >
                      Open Creator Shop
                    </Button>
                  </div>
                </div>

                <Dialog open={becomingSellerOpen} onOpenChange={setBecomingSellerOpen}>
                  <DialogContent className="rounded-3xl p-5 sm:p-6">
                    <DialogHeader>
                      <DialogTitle className="font-display text-lg">Open Student Shop</DialogTitle>
                      <DialogDescription className="text-xs">
                        Fill in your store details to start selling on CampusCart with zero platform fees.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-1 text-xs">
                      <div className="space-y-1">
                        <Label htmlFor="storeName" className="font-semibold">
                          Store Name *
                        </Label>
                        <Input
                          id="storeName"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          placeholder="e.g., Guhan's Electronics & Notes Lab"
                          className="rounded-xl h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="storeDescription" className="font-semibold">
                          Store Description (optional)
                        </Label>
                        <Textarea
                          id="storeDescription"
                          value={storeDescription}
                          onChange={(e) => setStoreDescription(e.target.value)}
                          placeholder="Tell classmates about your products, handmade items, or freelance services..."
                          rows={3}
                          className="rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <DialogFooter className="pt-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBecomingSellerOpen(false)}
                        disabled={becomingSeller}
                        className="rounded-xl text-xs h-9"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleBecomeSeller}
                        disabled={becomingSeller || !storeName.trim()}
                        className="rounded-xl text-xs h-9 font-bold shadow-xs"
                      >
                        {becomingSeller ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Store className="h-3.5 w-3.5 mr-1.5" />
                            Activate Creator Shop
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* 6. Danger Zone */}
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6">
              <h3 className="font-bold text-xs text-destructive mb-1">Account Session</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Sign out of your student account on this device
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="rounded-xl text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              >
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
