'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload, X, Loader2, Image as ImageIcon, CheckCircle2,
  AlertCircle, Link2, Sparkles, RefreshCw, Camera,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

type ImageUploaderProps = {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  userId?: string;
  label?: string;
};

// Client-side image compressor: converts large phone photos (3-15MB) into lightweight base64/blob (<200KB)
async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              resolve({ dataUrl, blob: file });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Quick fallback campus presets for sellers who need an immediate high-quality image
const CAMPUS_PRESETS = [
  { label: '📚 Textbook & Notes', url: 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { label: '💻 Tech & Gadgets', url: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { label: '🎨 Art & Stationery', url: 'https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { label: '⚡ Project Kit', url: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
];

export function ImageUploader({
  value,
  onChange,
  folder = 'products',
  userId = 'anonymous',
  label = 'Product Photo *',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [storageStatus, setStorageStatus] = useState<'ready' | 'cloud' | 'local'>('ready');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, WEBP, GIF).',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(25);

    try {
      // 1. Instantly compress client-side to ensure fast loading and fallback reliability
      const { dataUrl, blob } = await compressImage(file);
      setProgress(50);

      // Instantly set the compressed image so the user and form never get blocked
      onChange(dataUrl);
      setStorageStatus('local');

      // 2. Attempt non-blocking upload to Firebase Cloud Storage with a 5-second timeout
      const cleanFileName = (file.name || 'photo').replace(/[^a-zA-Z0-9.]/g, '_');
      const timestamp = Date.now();
      const storagePath = `${folder}/${userId}/${timestamp}_${cleanFileName}`;

      const uploadPromise = new Promise<string>((resolve, reject) => {
        try {
          const storageRef = ref(storage, storagePath);
          const uploadTask = uploadBytesResumable(storageRef, blob);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setProgress(50 + Math.round(pct * 0.5));
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch (e) {
                reject(e);
              }
            }
          );
        } catch (e) {
          reject(e);
        }
      });

      // 5-second safety timeout so upload never hangs indefinitely on mobile
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Firebase Storage timeout')), 5000);
      });

      try {
        const cloudUrl = await Promise.race([uploadPromise, timeoutPromise]);
        onChange(cloudUrl);
        setStorageStatus('cloud');
        setProgress(100);
        toast({
          title: 'Photo attached & uploaded! 📸',
          description: 'Optimized and synced to cloud storage.',
        });
      } catch (storageErr) {
        // Fallback: the base64 dataUrl is already set and fully working
        console.warn('Firebase Storage background upload note (using optimized client image):', storageErr);
        setStorageStatus('local');
        toast({
          title: 'Photo optimized & attached! 📸',
          description: 'Image ready for your listing.',
        });
      }
    } catch (err: any) {
      console.error('Image compression or upload error:', err);
      toast({
        title: 'Could not process image',
        description: 'Please try another photo or paste an image URL.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function handleManualUrlSubmit() {
    if (!manualUrl.trim()) return;
    onChange(manualUrl.trim());
    setManualMode(false);
    setManualUrl('');
    setStorageStatus('cloud');
    toast({
      title: 'Image URL applied!',
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none flex items-center gap-1.5">
          <span>{label}</span>
          {value && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Ready
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors"
        >
          <Link2 className="h-3 w-3" />
          {manualMode ? 'Use file upload' : 'Paste image URL'}
        </button>
      </div>

      {manualMode ? (
        <div className="flex gap-2">
          <Input
            placeholder="https://images.pexels.com/..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 text-xs sm:text-sm"
          />
          <Button type="button" size="sm" onClick={handleManualUrlSubmit}>
            Set URL
          </Button>
        </div>
      ) : value ? (
        <div className="relative group overflow-hidden rounded-2xl border border-border bg-card p-3 flex items-center gap-3.5 shadow-sm">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/40">
            <Image
              src={value}
              alt="Product Preview"
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={value.startsWith('data:')}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Photo attached successfully
            </div>
            <p className="text-[11px] text-muted-foreground truncate max-w-xs">
              {value.startsWith('data:') ? 'Optimized high-resolution photo' : value}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs rounded-lg gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <RefreshCw className="h-3 w-3" />
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                onClick={() => onChange('')}
              >
                <X className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
            }}
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              isDragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-secondary/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />

            {uploading ? (
              <div className="space-y-3 py-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <div className="text-xs font-semibold text-foreground">Processing & uploading photo...</div>
                <Progress value={progress} className="h-1.5 w-48 mx-auto" />
                <p className="text-[11px] text-muted-foreground">Optimizing resolution for mobile and web</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  Take a photo <span className="text-muted-foreground font-normal">or select from gallery</span>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, HEIC (Auto-optimized)</p>
              </div>
            )}
          </div>

          {/* Quick Preset Selector */}
          <div className="pt-1">
            <div className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1 font-medium">
              <Sparkles className="h-3 w-3 text-primary" /> Or pick a quick campus category photo:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CAMPUS_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent/40 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
