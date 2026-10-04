import { NextResponse } from 'next/server';
import { MOCK_COMPANIES } from '@/lib/mockData';
import {
  REGISTRY_PROVIDER,
  partitionSearchResults,
} from '@/lib/companyIdentityAdapter';
import { searchRegistryCompanies } from '@/lib/companyRegistry';
import { demoToSearchResult, toSearchResult } from '@/lib/realCompanyService';
import type { CompanySearchResult } from '@/lib/types';

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

/** HTTP status for a provider failure, so a failure is never a 200 "empty result". */
function httpStatusFor(status: string): number {
  switch (status) {
    case 'provider_unavailable':
      return 503;
    case 'provider_error':
    case 'malformed_response':
      return 502;
    default:
      return 200;
  }
}

function emptyBody(query: string) {
  return {
    query,
    provider: REGISTRY_PROVIDER,
    resultsCount: 0,
    results: [] as CompanySearchResult[],
    demoResults: [] as CompanySearchResult[],
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        {
          error:
            query.length < MIN_QUERY_LENGTH
              ? `Search query must be at least ${MIN_QUERY_LENGTH} characters.`
              : `Search query must be at most ${MAX_QUERY_LENGTH} characters.`,
          code: 'INVALID_QUERY',
          ...emptyBody(query),
        },
        { status: 400 }
      );
    }

    const lowerQuery = query.toLowerCase();

    // Local development records. These are never presented as registry data.
    const demoMatches = MOCK_COMPANIES.filter((company) => {
      const haystack = [company.name, company.registration_no, company.industry]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();
      return haystack.includes(lowerQuery);
    }).map(demoToSearchResult);

    const outcome = await searchRegistryCompanies(query);

    if (outcome.status === 'ok') {
      // Confirmed registry records always win over same-name demo records.
      const { results, demoResults } = partitionSearchResults(
        outcome.results,
        demoMatches
      );

      return NextResponse.json({
        query,
        provider: REGISTRY_PROVIDER,
        status: 'ok',
        resultsCount: results.length,
        results: results.map(toSearchResult),
        demoResults,
      });
    }

    if (outcome.status === 'not_configured') {
      // Demo records stay available for development, but they are returned in
      // their own array and never as registry results.
      return NextResponse.json({
        query,
        provider: REGISTRY_PROVIDER,
        status: 'not_configured',
        code: outcome.code,
        message: outcome.message,
        resultsCount: 0,
        results: [],
        demoResults: demoMatches,
      });
    }

    // Provider failure: no results of any kind are returned, so a failure can
    // never be mistaken for a company that simply has no records.
    return NextResponse.json(
      {
        query,
        provider: REGISTRY_PROVIDER,
        status: outcome.status,
        code: outcome.code,
        message: outcome.message,
        resultsCount: 0,
        results: [],
        demoResults: [],
      },
      { status: httpStatusFor(outcome.status) }
    );
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to search company records right now.',
        code: 'SEARCH_FAILED',
        ...emptyBody(''),
      },
      { status: 500 }
    );
  }
}
