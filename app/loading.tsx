export default function GlobalLoading() {
  return (
    <div className="container-px mx-auto max-w-7xl py-8 min-h-[60vh] flex flex-col justify-center items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs animate-pulse">
          <div className="h-7 w-7 rounded-lg border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-4 w-32 rounded-full bg-secondary/80 animate-pulse" />
          <div className="h-3 w-48 rounded-full bg-secondary/50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
