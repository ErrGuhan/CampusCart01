export default function MarketplaceLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-6 sm:py-10 animate-pulse space-y-8">
      {/* Header Banner Skeleton */}
      <div className="rounded-3xl border border-border/80 bg-secondary/30 p-6 sm:p-8 space-y-4">
        <div className="h-8 w-64 rounded-xl bg-secondary/80" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-secondary/50" />
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-11 flex-1 rounded-2xl bg-secondary/60" />
        <div className="h-11 w-32 rounded-2xl bg-secondary/50" />
      </div>

      {/* Categories Horizontal Carousel Skeleton */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-9 w-28 shrink-0 rounded-full bg-secondary/50" />
        ))}
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-3xl border border-border/60 bg-card/60 p-3 space-y-3">
            <div className="aspect-square w-full rounded-2xl bg-secondary/60" />
            <div className="h-3 w-1/3 rounded bg-secondary/70" />
            <div className="h-4 w-3/4 rounded bg-secondary/80" />
            <div className="h-5 w-1/2 rounded bg-secondary/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
