'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, Search, Pencil, Trash2, Package, Eye,
  AlertCircle, X, Loader2,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SellerSidebar } from '@/components/seller-sidebar';
import { ImageUploader } from '@/components/image-uploader';
import { EmptyState } from '@/components/ui/empty-state';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  getAllProductsAdmin,
  getMyProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/firebase-queries';
import type { Category, Product, ProductStatus } from '@/lib/types';

type SellerProduct = Product & { _editing?: boolean };

export type ProductFormData = {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  inventory: number;
  tags: string[];
  imageUrl: string;
  pickup: boolean;
  delivery: boolean;
  isDigital?: boolean;
  digitalFileUrl?: string;
  status: ProductStatus;
};

export default function SellerProductsPage() {
  const { user, profile, isAdmin, loading } = useAuth();
  const { toast } = useToast();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
  
    const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  
    const loadSellerProducts = () => {
      if (user?.uid) {
        getAllProductsAdmin().then((all) => {
          const username = profile?.username?.toLowerCase() || '';
          const isGuhan = username.includes('guhan') || user?.email?.toLowerCase().includes('guhan');
          const myProds = all.filter(
            (p) =>
              p.seller?.id === user.uid ||
              p.seller?.username?.toLowerCase() === username ||
              (isGuhan && (p.seller?.username === 'guhan' || p.seller?.id === 'seller-guhan'))
          );
          setSellerProducts(myProds);
        });
      }
    };
  
    useEffect(() => {
      loadSellerProducts();
  
      if (typeof window !== 'undefined') {
        window.addEventListener('campuscart_product_updated', loadSellerProducts);
        window.addEventListener('storage', loadSellerProducts);
        window.addEventListener('focus', loadSellerProducts);
  
        return () => {
          window.removeEventListener('campuscart_product_updated', loadSellerProducts);
          window.removeEventListener('storage', loadSellerProducts);
          window.removeEventListener('focus', loadSellerProducts);
        };
      }
    }, [user?.uid, profile?.username]);
  
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
  
    if (!profile?.is_seller) {
      return (
        <>
          <Navbar />
          <main className="container-px mx-auto max-w-7xl py-16">
            <div className="flex flex-col items-center justify-center text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <h1 className="font-display text-2xl font-bold tracking-tight">Access restricted to sellers</h1>
              <p className="mt-2 text-muted-foreground max-w-md">
                Only student sellers can manage listings. Buyers can continue exploring and purchasing products.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild><Link href="/products">Browse Products</Link></Button>
                <Button variant="outline" asChild><Link href="/account/settings">Become a Seller</Link></Button>
              </div>
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
  
    async function handleSave(formData: ProductFormData) {
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to upload or edit products.',
          variant: 'destructive',
        });
        return;
      }
  
      setSaving(true);
      try {
        const sellerDisplayName = profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Campus Seller';
        const sellerUsername = profile?.username || user.email?.split('@')[0] || 'seller';
        const sellerAvatar = profile?.avatar_url || '';
        const sellerDepartment = profile?.department || 'SVCET Student';
        const sellerYear = profile?.year || 'Student';
  
        const slug = editProduct?.slug || (
          formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 40) + '-' + Math.floor(1000 + Math.random() * 9000)
        );
  
        const calculatedStatus: ProductStatus = isAdmin
          ? (formData.status || 'active')
          : (editProduct ? (editProduct.status === 'active' ? 'active' : 'pending_approval') : 'pending_approval');
  
        const isProductVerified = isAdmin ? true : (editProduct?.isVerified || false);
  
        const localProduct: SellerProduct = {
          id: editProduct?.id || ('prod_' + Date.now()),
          seller: {
            id: user.uid,
            username: sellerUsername,
            displayName: sellerDisplayName,
            avatar: sellerAvatar,
            department: sellerDepartment,
            year: sellerYear,
            bio: profile?.bio || '',
            skills: profile?.skills || [],
            rating: editProduct?.rating ?? 5.0,
            productCount: 1,
            joinedAt: new Date().toISOString(),
          },
          name: formData.name,
          slug,
          description: formData.description,
          price: formData.price,
          discountPrice: formData.discountPrice,
          category: formData.category,
          inventory: formData.inventory,
          tags: formData.tags,
          status: calculatedStatus,
          pickupAvailable: formData.pickup,
          deliveryAvailable: formData.delivery,
          isDigital: formData.isDigital || false,
          digitalFileUrl: formData.digitalFileUrl || '',
          images: [formData.imageUrl || 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg'],
          rating: editProduct?.rating ?? 5.0,
          reviewCount: editProduct?.reviewCount ?? 0,
          isVerified: isProductVerified,
          createdAt: editProduct?.createdAt || new Date().toISOString(),
        };
  
        if (editProduct) {
          setSellerProducts((prev) => prev.map((p) => (p.id === editProduct.id ? localProduct : p)));
          await updateProduct(editProduct.id, localProduct);
          router.refresh();
          toast({
            title: isAdmin ? 'Product updated! 🎉' : 'Updated & Submitted for Review! ⏳',
            description: isAdmin ? `"${formData.name}" has been updated.` : `"${formData.name}" updated. Sent to Admin for review.`,
          });
        } else {
          setSellerProducts((prev) => [localProduct, ...prev]);
          await createProduct(localProduct);
          router.refresh();
          toast({
            title: isAdmin ? 'Product created & Live! 🎉' : 'Submitted for Approval! ⏳',
            description: isAdmin
              ? `"${formData.name}" is now live on CampusCart.`
              : `"${formData.name}" submitted to Admin (Guhan M) for originality verification.`,
          });
        }
  
        setDialogOpen(false);
        setEditProduct(null);
      } catch (err: any) {
        console.warn('Product save notice:', err);
      } finally {
        setSaving(false);
      }
    }
  
    async function handleDelete() {
      if (!deleteTarget) return;
      try {
        await deleteProduct(deleteTarget.id);
        setSellerProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        router.refresh();
        toast({ title: 'Product deleted', description: deleteTarget.name });
      } catch (err: any) {
        console.error('Error deleting product:', err);
        toast({
          title: 'Could not delete product',
          description: err.message || 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setDeleteTarget(null);
      }
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

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-4">
          <aside className="lg:block">
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
                <SelectTrigger className="w-[160px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">🟢 Live & Approved</SelectItem>
                  <SelectItem value="pending_approval">🟡 Under Review</SelectItem>
                  <SelectItem value="rejected">🔴 Needs Revision</SelectItem>
                  <SelectItem value="out_of_stock">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sellerProducts.some((p) => p.status === 'pending_approval') && (
              <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3 text-xs">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-warning">Some products are Under Admin Review</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    To maintain product authenticity and campus quality, listings are reviewed by Administrator (<strong>Guhan M</strong>). Once approved, they will go live on the public marketplace.
                  </p>
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <EmptyState
                icon={Package}
                title={search || statusFilter !== 'all' ? 'No products match your filter' : 'Your store has no products yet'}
                description={
                  search || statusFilter !== 'all'
                    ? 'Try adjusting your search query or reset status filter to see all inventory.'
                    : 'List your used textbooks, electronics, lab tools, or study notes for campus delivery.'
                }
                actionLabel="+ Add Your First Product"
                onAction={openCreate}
                secondaryActionLabel={search || statusFilter !== 'all' ? 'Reset Filters' : undefined}
                onSecondaryAction={
                  search || statusFilter !== 'all'
                    ? () => {
                        setSearch('');
                        setStatusFilter('all');
                      }
                    : undefined
                }
              />
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
                    const isRejected = product.status === 'rejected';

                    return (
                      <div key={product.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-accent/20 transition-colors">
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
                            <Image src={product.images[0]} alt={product.name} fill sizes="48px" className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <Link href={`/products/${product.slug}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                              {product.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                            {isRejected && product.rejectionReason && (
                              <p className="text-[11px] text-destructive mt-1">
                                <strong>Admin Note:</strong> {product.rejectionReason}
                              </p>
                            )}
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
                              product.status === 'pending_approval' ? 'bg-warning/10 text-warning hover:bg-warning/10 font-semibold' :
                              product.status === 'rejected' ? 'bg-destructive/10 text-destructive hover:bg-destructive/10 font-semibold' :
                              product.status === 'out_of_stock' ? 'bg-destructive/10 text-destructive hover:bg-destructive/10' :
                              'bg-secondary text-muted-foreground hover:bg-secondary'
                            }
                          >
                            {product.status === 'pending_approval' ? '🟡 Under Review' :
                             product.status === 'rejected' ? '🔴 Needs Revision' :
                             product.status === 'out_of_stock' ? 'Out of Stock' :
                             product.status === 'active' ? '🟢 Live' :
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
            userId={user?.uid}
            onSave={handleSave}
            onCancel={() => { setDialogOpen(false); setEditProduct(null); }}
            categories={categories}
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
  product, saving, userId, onSave, onCancel, categories,
}: {
  product: Product | null;
  saving: boolean;
  userId?: string;
  onSave: (data: ProductFormData) => void;
  onCancel: () => void;
  categories: Category[];
}) {
  const { toast } = useToast();
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [discountPrice, setDiscountPrice] = useState(product?.discountPrice?.toString() || '');
  const [category, setCategory] = useState(product?.category || (categories[0]?.name ?? 'Handmade'));
  const [inventory, setInventory] = useState(product?.inventory?.toString() || '10');
  const [tags, setTags] = useState(product?.tags?.join(', ') || '');
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || '');
  const [pickup, setPickup] = useState(product?.pickupAvailable ?? true);
  const [delivery, setDelivery] = useState(product?.deliveryAvailable ?? false);
  const [isDigital, setIsDigital] = useState(product?.isDigital ?? false);
  const [digitalFileUrl, setDigitalFileUrl] = useState(product?.digitalFileUrl || '');
  const [status, setStatus] = useState<ProductStatus>(product?.status || 'active');

  function handleSubmit() {
    if (!name.trim() || name.trim().length < 3) {
      toast({
        title: 'Product name required',
        description: 'Please enter a valid descriptive title (minimum 3 characters).',
        variant: 'destructive',
      });
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast({
        title: 'Valid price required',
        description: 'Please enter a valid price (minimum ₹1).',
        variant: 'destructive',
      });
      return;
    }
    const parsedDiscount = discountPrice.trim() ? parseFloat(discountPrice) : undefined;
    if (parsedDiscount !== undefined && (isNaN(parsedDiscount) || parsedDiscount <= 0 || parsedDiscount >= parsedPrice)) {
      toast({
        title: 'Invalid discount price',
        description: 'Discount price must be less than regular price and greater than ₹0.',
        variant: 'destructive',
      });
      return;
    }

    if (!imageUrl.trim()) {
      toast({
        title: 'Product photo required',
        description: 'Please upload a clear photo of the product.',
        variant: 'destructive',
      });
      return;
    }

    if (isDigital && !digitalFileUrl.trim()) {
      toast({
        title: 'Digital link required',
        description: 'Please provide the download link or Google Drive / GitHub URL.',
        variant: 'destructive',
      });
      return;
    }

    const parsedInventory = parseInt(inventory, 10);
    const tagList = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

    onSave({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      discountPrice: parsedDiscount && !isNaN(parsedDiscount) ? parsedDiscount : undefined,
      category: category || (categories[0]?.name ?? 'Hardware & Tools'),
      inventory: isNaN(parsedInventory) || parsedInventory < 0 ? 1 : parsedInventory,
      tags: tagList,
      imageUrl: imageUrl.trim(),
      pickup,
      delivery,
      isDigital,
      digitalFileUrl: digitalFileUrl.trim(),
      status: status || 'active',
    });
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="p-name">Product Name *</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Handmade Ceramic Mug" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..." rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-price">Price (₹) *</Label>
          <Input id="p-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="280" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-discount">Discount Price (₹, optional)</Label>
          <Input id="p-discount" type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="220" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-category">Category *</Label>
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

      {/* Direct Firebase Storage Image Upload */}
      <div className="space-y-2">
        <ImageUploader
          label="Product Photo *"
          value={imageUrl}
          onChange={setImageUrl}
          folder="products"
          userId={userId}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="p-status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
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

      {/* Digital Academic & Project Marketplace Toggle */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="p-digital" checked={isDigital} onCheckedChange={(v) => setIsDigital(!!v)} />
          <Label htmlFor="p-digital" className="text-sm font-semibold cursor-pointer text-primary">
            📁 Digital Product (Study Notes, Project Code, 3D STL, eBook)
          </Label>
        </div>

        {isDigital && (
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="p-file-url" className="text-xs text-muted-foreground">
              Digital Download Link / GitHub Repo / Google Drive URL *
            </Label>
            <Input
              id="p-file-url"
              value={digitalFileUrl}
              onChange={(e) => setDigitalFileUrl(e.target.value)}
              placeholder="https://drive.google.com/... or https://github.com/..."
              className="text-xs bg-background"
            />
            <p className="text-[11px] text-muted-foreground">
              Buyers will receive this instant access link immediately upon completing payment.
            </p>
          </div>
        )}
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
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Product'}
        </Button>
      </DialogFooter>
    </div>
  );
}
