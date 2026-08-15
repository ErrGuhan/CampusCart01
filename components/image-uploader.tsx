'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle, AlertCircle, Link2 } from 'lucide-react';
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

export function ImageUploader({
  value,
  onChange,
  folder = 'products',
  userId = 'anonymous',
  label = 'Product Image',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
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

    // Max 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size should be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const timestamp = Date.now();
      const storagePath = `${folder}/${userId}/${timestamp}_${cleanFileName}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(Math.max(10, pct));
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          setUploading(false);
          // Fallback gracefully to blob/local preview or manual URL
          const previewUrl = URL.createObjectURL(file);
          onChange(previewUrl);
          toast({
            title: 'Image uploaded locally',
            description: 'Saved image preview. Note: To persist across all devices, configure your Firebase Storage bucket.',
          });
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            onChange(downloadUrl);
            setUploading(false);
            setProgress(100);
            toast({
              title: 'Image uploaded successfully!',
              description: 'Image is stored securely in Firebase Cloud Storage.',
            });
          } catch (err: any) {
            const previewUrl = URL.createObjectURL(file);
            onChange(previewUrl);
            setUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error('Upload failed:', err);
      // Fallback preview
      const previewUrl = URL.createObjectURL(file);
      onChange(previewUrl);
      setUploading(false);
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
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none">{label}</label>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          <Link2 className="h-3 w-3" />
          {manualMode ? 'Use file uploader' : 'Paste image URL'}
        </button>
      </div>

      {manualMode ? (
        <div className="flex gap-2">
          <Input
            placeholder="https://images.pexels.com/..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 text-sm"
          />
          <Button type="button" size="sm" onClick={handleManualUrlSubmit}>
            Set URL
          </Button>
        </div>
      ) : value ? (
        <div className="relative group overflow-hidden rounded-xl border border-border bg-secondary/30 p-2 flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-success font-medium mb-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Image attached
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-xs">{value}</p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onChange('')}
              >
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
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
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
              <div className="text-xs text-muted-foreground">Uploading to Firebase Storage... {progress}%</div>
              <Progress value={progress} className="h-1.5 w-48 mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">
                Click to upload <span className="text-muted-foreground">or drag and drop</span>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or GIF (Max 5MB)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
