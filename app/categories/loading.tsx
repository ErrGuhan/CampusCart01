export default function CategoriesLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-6 sm:py-10 animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-secondary/80" />
        <div className="h-4 w-80 rounded-lg bg-secondary/50" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-36 rounded-3xl border border-border/60 bg-secondary/40 p-5 flex flex-col justify-between" />
        ))}
      </div>
    </div>
  );
}
