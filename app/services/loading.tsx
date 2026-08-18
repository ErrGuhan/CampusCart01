export default function ServicesLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-6 sm:py-10 animate-pulse space-y-8">
      <div className="rounded-3xl border border-border/80 bg-secondary/30 p-6 sm:p-8 space-y-4">
        <div className="h-8 w-64 rounded-xl bg-secondary/80" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-secondary/50" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl border border-border/60 bg-card/60 p-4 space-y-3">
            <div className="aspect-[16/10] w-full rounded-2xl bg-secondary/60" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-secondary/70" />
              <div className="h-4 w-28 rounded bg-secondary/80" />
            </div>
            <div className="h-5 w-3/4 rounded bg-secondary/80" />
            <div className="h-4 w-1/2 rounded bg-secondary/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
