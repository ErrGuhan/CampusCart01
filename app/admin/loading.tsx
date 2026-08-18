export default function AdminLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-6 sm:py-10 animate-pulse space-y-8">
      <div className="rounded-3xl border border-border/80 bg-secondary/30 p-6 sm:p-8 space-y-4">
        <div className="h-8 w-64 rounded-xl bg-secondary/80" />
        <div className="h-4 w-80 rounded-lg bg-secondary/50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-border/60 bg-secondary/40 p-4" />
        ))}
      </div>
    </div>
  );
}
