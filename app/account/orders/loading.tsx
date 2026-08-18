export default function OrdersLoading() {
  return (
    <div className="container-px mx-auto max-w-5xl py-6 sm:py-10 animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-xl bg-secondary/80" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-3xl border border-border/70 bg-card/60 p-4" />
        ))}
      </div>
    </div>
  );
}
