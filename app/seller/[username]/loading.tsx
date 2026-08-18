export default function SellerProfileLoading() {
  return (
    <div className="container-px mx-auto max-w-4xl py-5 sm:py-8 space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 rounded bg-secondary/70" />
        <div className="h-4 w-4 rounded bg-secondary/50" />
        <div className="h-4 w-20 rounded bg-secondary/70" />
        <div className="h-4 w-4 rounded bg-secondary/50" />
        <div className="h-4 w-24 rounded bg-secondary/70" />
      </div>

      {/* Hero Profile Card */}
      <div className="rounded-[2.25rem] border border-border/80 bg-secondary/40 p-6 sm:p-8 flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-secondary/80 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-48 rounded-xl bg-secondary/90" />
          <div className="h-4 w-64 rounded bg-secondary/60" />
        </div>
      </div>

      {/* Product List Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl border border-border/60 bg-card/60 p-3 space-y-3">
            <div className="aspect-square w-full rounded-2xl bg-secondary/60" />
            <div className="h-4 w-3/4 rounded bg-secondary/80" />
            <div className="h-5 w-1/2 rounded bg-secondary/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
