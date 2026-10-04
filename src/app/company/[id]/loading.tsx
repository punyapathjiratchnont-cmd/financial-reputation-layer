/**
 * State C — the company profile is loading.
 *
 * Without this, the page stays blank while the server resolves the company and
 * its registry record, which reads as a broken page rather than a slow one.
 */
export default function CompanyProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans px-6 py-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-56 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-3 w-72 rounded bg-white/5 animate-pulse" />
          </div>
        </div>

        <div className="h-44 rounded-2xl bg-white/[0.03] border border-white/10 animate-pulse" />

        <p className="text-sm text-slate-400" role="status">
          Loading company profile&hellip;
        </p>
      </div>
    </div>
  );
}
