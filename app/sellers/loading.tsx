export default function SellersLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-6 sm:py-10 animate-pulse space-y-8">
      <div className="rounded-3xl border border-border/80 bg-secondary/30 p-6 sm:p-8 space-y-4">
        <div className="h-8 w-64 rounded-xl bg-secondary/80" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-secondary/50" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl border border-border/60 bg-card/60 p-5 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-secondary/70 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 rounded bg-secondary/80" />
              <div className="h-3 w-48 rounded bg-secondary/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
