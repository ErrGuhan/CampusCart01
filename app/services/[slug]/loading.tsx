export default function ServiceDetailLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-6 sm:py-10 animate-pulse space-y-8 min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-12 rounded bg-secondary/70" />
        <div className="h-4 w-4 rounded bg-secondary/50" />
        <div className="h-4 w-20 rounded bg-secondary/70" />
        <div className="h-4 w-4 rounded bg-secondary/50" />
        <div className="h-4 w-32 rounded bg-secondary/70" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="aspect-[16/10] w-full rounded-3xl bg-secondary/60" />
          <div className="h-9 w-3/4 rounded-xl bg-secondary/80" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-secondary/60" />
            <div className="h-4 w-5/6 rounded bg-secondary/60" />
          </div>
        </div>
        <div className="lg:col-span-4 rounded-3xl border border-border/70 bg-card p-6 space-y-4">
          <div className="h-10 w-32 rounded-xl bg-secondary/80" />
          <div className="h-12 w-full rounded-2xl bg-primary/20" />
        </div>
      </div>
    </div>
  );
}
