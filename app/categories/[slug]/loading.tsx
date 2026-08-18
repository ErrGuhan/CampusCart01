export default function CategoryDetailLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-6 sm:py-10 animate-pulse space-y-8 min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-12 rounded bg-secondary/70" />
        <div className="h-4 w-4 rounded bg-secondary/50" />
        <div className="h-4 w-20 rounded bg-secondary/70" />
        <div className="h-4 w-4 rounded bg-secondary/50" />
        <div className="h-4 w-28 rounded bg-secondary/70" />
      </div>

      <div className="rounded-3xl border border-border/80 bg-secondary/30 p-6 sm:p-8 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-secondary/80" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-secondary/80" />
          <div className="h-4 w-32 rounded-lg bg-secondary/50" />
        </div>
      </div>

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
