import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getCompanyById } from '@/lib/realCompanyService';
import { CompanyProfileView } from './CompanyProfileView';

/**
 * Honest failure state for a real-company lookup that could not be completed.
 * FRL reports that it could not confirm the company rather than rendering a
 * profile built from invented data.
 */
function LookupUnavailable({ message, code }: { message: string; code: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans px-6 py-24">
      <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-amber-500/20 p-8 space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Company record unavailable
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100">
          FRL could not confirm this company
        </h1>
        <p className="text-sm text-slate-400">{message}</p>
        <p className="text-xs text-slate-500 font-mono">Reference: {code}</p>
        <p className="text-xs text-slate-500">
          No profile is shown because FRL will not present unverified or invented
          company data as fact.
        </p>
        <Link
          href="/search"
          className="inline-block px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Back to company search
        </Link>
      </div>
    </div>
  );
}

export default async function CompanyProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCompanyById(id);

  if (result.status === 'not_found') {
    notFound();
  }

  if (result.status === 'error') {
    return <LookupUnavailable message={result.message} code={result.code} />;
  }

  return <CompanyProfileView company={result.company} />;
}
