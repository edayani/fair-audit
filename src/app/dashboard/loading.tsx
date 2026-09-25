export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="mb-8 space-y-3">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-8 w-72 max-w-full rounded bg-muted" />
        <div className="h-4 w-[28rem] max-w-full rounded bg-muted" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 rounded-xl border bg-card lg:col-span-2" />
        <div className="h-72 rounded-xl border bg-card" />
      </div>
    </div>
  );
}
