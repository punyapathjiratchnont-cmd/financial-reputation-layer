import { NextResponse } from 'next/server';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { CompanySearchResult } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const query = rawQuery.trim();

    // 1. Input Validation
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters.', results: [] },
        { status: 400 }
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: 'Search query is too long.', results: [] },
        { status: 400 }
      );
    }

    const lowerQuery = query.toLowerCase();

    // 2. Local Demo Companies Match (Always preserved)
    const demoMatches: CompanySearchResult[] = MOCK_COMPANIES.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.registration_no.toLowerCase().includes(lowerQuery) ||
        c.industry.toLowerCase().includes(lowerQuery)
    ).map((c) => ({
      id: c.id,
      name: c.name,
      businessType: c.industry,
      industry: c.industry,
      country: c.country || 'Thailand',
      registrationNumber: c.registration_no,
      profileStatus: c.isClaimed ? 'claimed' : 'unclaimed',
      source: {
        provider: 'FRL Directory',
        url: undefined,
      },
    }));

    // 3. Check Server-Side OpenCorporates API Token (STRICTLY SERVER-SIDE)
    const apiToken = process.env.OPENCORPORATES_API_TOKEN;

    if (!apiToken || apiToken === 'your_opencorporates_api_token_here') {
      // Fallback behavior when API token is not configured
      return NextResponse.json({
        query,
        results: demoMatches,
        configured: false,
        provider: 'OpenCorporates',
        message:
          demoMatches.length > 0
            ? 'OpenCorporates API token not configured. Showing matching demo records.'
            : 'Real company search provider is currently not configured.',
      });
    }

    // 4. Call OpenCorporates API Server-Side
    const openCorpUrl = `https://api.opencorporates.com/v0.2/companies/search?q=${encodeURIComponent(
      query
    )}&api_token=${encodeURIComponent(apiToken)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const openCorpRes = await fetch(openCorpUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!openCorpRes.ok) {
      // Graceful error handling - return demo matches if available without breaking
      return NextResponse.json({
        query,
        results: demoMatches,
        configured: true,
        provider: 'OpenCorporates',
        message: 'OpenCorporates API temporarily unavailable. Showing local matches.',
      });
    }

    const data = await openCorpRes.json();
    const companiesList = data?.results?.companies || [];

    // 5. Normalize OpenCorporates Search Results
    const realResults: CompanySearchResult[] = companiesList.slice(0, 10).map((item: any) => {
      const comp = item.company || {};
      const jCode = comp.jurisdiction_code ? comp.jurisdiction_code.toLowerCase() : 'global';
      const cNumber = comp.company_number || Math.random().toString(36).substring(7);

      return {
        id: `oc_${jCode}_${cNumber}`,
        name: comp.name || 'Unknown Corporate Entity',
        businessType: comp.company_type || 'Corporate Entity',
        jurisdictionCode: comp.jurisdiction_code ? comp.jurisdiction_code.toUpperCase() : undefined,
        registrationNumber: comp.company_number || undefined,
        country: comp.jurisdiction_code ? comp.jurisdiction_code.toUpperCase() : 'Global',
        profileStatus: 'unclaimed', // REAL SEARCH RESULTS ARE ALWAYS UNCLAIMED BY DEFAULT
        source: {
          provider: 'OpenCorporates',
          url: comp.opencorporates_url || undefined,
        },
      };
    });

    // Merge demo matches + real OpenCorporates results (deduplicate by id or name)
    const combinedResults = [...demoMatches];
    realResults.forEach((r) => {
      if (!combinedResults.some((d) => d.name.toLowerCase() === r.name.toLowerCase())) {
        combinedResults.push(r);
      }
    });

    return NextResponse.json({
      query,
      results: combinedResults,
      configured: true,
      provider: 'OpenCorporates',
    });
  } catch (err: any) {
    // Handle network / timeout errors safely without leaking internal details
    return NextResponse.json(
      {
        error: 'Unable to search real company records right now.',
        results: [],
      },
      { status: 500 }
    );
  }
}
