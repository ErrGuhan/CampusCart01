'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Pencil, Trash2, Package, Eye,
  AlertCircle, X, Loader2,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { getMyProducts } from '@/lib/supabase-queries';
import { getCategories } from '@/lib/supabase-queries';
import type { Category, Product } from '@/lib/types';

type SellerProduct = Product & { _editing?: boolean };

export default function SellerProductsPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);

  useEffect(() => {
    if (profile?.id) {
      getMyProducts(profile.id).then(setSellerProducts);
    }
  }, [profile?.id]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

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
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign in required</h1>
            <p className="mt-2 text-muted-foreground">Sign in to manage your products.</p>
            <Button className="mt-6" asChild><Link href="/login">Sign In</Link></Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const filtered = sellerProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setDialogOpen(false);
      setEditProduct(null);
      toast({
        title: editProduct ? 'Product updated' : 'Product created',
        description: editProduct?.name || 'New product added successfully.',
      });
    }, 1200);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setSellerProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    toast({ title: 'Product deleted', description: deleteTarget.name });
    setDeleteTarget(null);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setDialogOpen(true);
  }

  function openCreate() {
    setEditProduct(null);
    setDialogOpen(true);
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Products</h1>
            <p className="mt-1.5 text-muted-foreground">
              {sellerProducts.length} {sellerProducts.length === 1 ? 'product' : 'products'} in your store
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <SellerSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="out_of_stock">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No products found</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Start by adding your first product to the store.'}
                </p>
                {!search && statusFilter === 'all' && (
                  <Button className="mt-4" onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-border bg-secondary/30 text-xs font-medium text-muted-foreground">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Stock</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                <div className="divide-y divide-border">
                  {filtered.map((product) => {
                    const hasDiscount = product.discountPrice !== undefined;
                    const isLowStock = product.inventory <= 5;
                    return (
                      <div key={product.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-accent/20 transition-colors">
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <Link href={`/products/${product.slug}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                              {product.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          {hasDiscount ? (
                            <div>
                              <span className="text-sm font-semibold">₹{product.discountPrice}</span>
                              <span className="text-xs text-muted-foreground line-through ml-1">₹{product.price}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold">₹{product.price}</span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <span className={`text-sm font-medium ${isLowStock ? 'text-warning' : ''}`}>
                            {product.inventory}
                          </span>
                          {isLowStock && (
                            <Badge variant="secondary" className="ml-2 bg-warning/10 text-warning text-[10px]">
                              Low
                            </Badge>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Badge
                            className={
                              product.status === 'active' ? 'bg-success/10 text-success hover:bg-success/10' :
                              product.status === 'out_of_stock' ? 'bg-destructive/10 text-destructive hover:bg-destructive/10' :
                              'bg-secondary text-muted-foreground hover:bg-secondary'
                            }
                          >
                            {product.status === 'out_of_stock' ? 'Out of Stock' :
                             product.status === 'active' ? 'Active' :
                             product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(product)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editProduct}
            saving={saving}
            onSave={handleSave}
            onCancel={() => { setDialogOpen(false); setEditProduct(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.name}" from your store. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProductForm({
  product, saving, onSave, onCancel,
}: {
  product: Product | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [discountPrice, setDiscountPrice] = useState(product?.discountPrice?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [inventory, setInventory] = useState(product?.inventory?.toString() || '0');
  const [tags, setTags] = useState(product?.tags?.join(', ') || '');
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || '');
  const [pickup, setPickup] = useState(product?.pickupAvailable ?? true);
  const [delivery, setDelivery] = useState(product?.deliveryAvailable ?? false);
  const [status, setStatus] = useState<string>(product?.status || 'active');

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="p-name">Product Name</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Handmade Ceramic Mug" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..." rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-price">Price (₹)</Label>
          <Input id="p-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="280" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-discount">Discount Price (₹, optional)</Label>
          <Input id="p-discount" type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="220" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="p-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-inventory">Inventory</Label>
          <Input id="p-inventory" type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} placeholder="10" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-tags">Tags (comma-separated)</Label>
        <Input id="p-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="pottery, ceramic, mug" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-image">Image URL</Label>
        <Input id="p-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        {imageUrl && (
          <div className="h-20 w-20 overflow-hidden rounded-lg border border-border">
            <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="p-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Fulfillment Options</Label>
        <div className="flex items-center space-x-2">
          <Checkbox id="p-pickup" checked={pickup} onCheckedChange={(v) => setPickup(!!v)} />
          <Label htmlFor="p-pickup" className="text-sm cursor-pointer">Campus pickup available</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="p-delivery" checked={delivery} onCheckedChange={(v) => setDelivery(!!v)} />
          <Label htmlFor="p-delivery" className="text-sm cursor-pointer">Campus delivery available</Label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Product'}
        </Button>
      </DialogFooter>
    </div>
  );
}
