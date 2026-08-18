export default function ProductDetailLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-5 sm:py-8 pb-28 md:pb-12 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-12 rounded-md bg-secondary/80" />
        <div className="h-4 w-4 rounded-md bg-secondary/50" />
        <div className="h-4 w-20 rounded-md bg-secondary/80" />
        <div className="h-4 w-4 rounded-md bg-secondary/50" />
        <div className="h-4 w-32 rounded-md bg-secondary/80" />
      </div>

      {/* Main Product Layout Skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-start">
        {/* Media Gallery Skeleton (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-3xl bg-secondary/60 shadow-sm" />
          <div className="flex gap-3">
            <div className="h-20 w-20 rounded-2xl bg-secondary/50" />
            <div className="h-20 w-20 rounded-2xl bg-secondary/50" />
            <div className="h-20 w-20 rounded-2xl bg-secondary/50" />
          </div>
        </div>

        {/* Product Details Skeleton (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-full bg-secondary/80" />
              <div className="h-6 w-20 rounded-full bg-secondary/80" />
            </div>
            <div className="h-9 w-3/4 rounded-xl bg-secondary/90" />
            <div className="h-4 w-48 rounded-md bg-secondary/60" />
          </div>

          {/* Price Box Skeleton */}
          <div className="h-20 rounded-3xl bg-secondary/50" />

          {/* Description Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded-md bg-secondary/60" />
            <div className="h-4 w-5/6 rounded-md bg-secondary/60" />
            <div className="h-4 w-4/6 rounded-md bg-secondary/60" />
          </div>

          {/* Pickup Card Skeleton */}
          <div className="h-24 rounded-2xl bg-secondary/40" />

          {/* Buttons Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="h-14 rounded-2xl bg-primary/20" />
            <div className="h-14 rounded-2xl bg-secondary/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
