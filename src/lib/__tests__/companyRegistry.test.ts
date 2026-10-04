import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { lookupRegistryCompany, searchRegistryCompanies } from '../companyRegistry';

const NOW = new Date('2026-10-04T00:00:00.000Z');
const TOKEN = 'test-token-not-a-secret';

const COMPANY = {
  id: 'opencorporates_abc',
  company_number: '01234567',
  jurisdiction_code: 'gb',
  name: 'EXAMPLE REGISTRY HOLDINGS PLC',
  current_status: 'Active',
  company_type: 'PLC',
  incorporation_date: '1998-03-12',
};

function okJson(body: unknown): typeof fetch {
  return (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => body,
    }) as unknown as Response) as unknown as typeof fetch;
}

function statusJson(status: number, body: unknown = {}): typeof fetch {
  return (async () =>
    ({
      ok: false,
      status,
      json: async () => body,
    }) as unknown as Response) as unknown as typeof fetch;
}

function brokenJson(): typeof fetch {
  return (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    }) as unknown as Response) as unknown as typeof fetch;
}

function networkError(): typeof fetch {
  return (async () => {
    throw new TypeError('fetch failed');
  }) as unknown as typeof fetch;
}

const options = (fetchImpl: typeof fetch, token: string | undefined = TOKEN) => ({
  fetchImpl,
  token,
  now: () => NOW,
});

describe('lookup — confirmed company', () => {
  it('returns a normalized company when the registry confirms it', async () => {
    const lookup = await lookupRegistryCompany(
      'oc_gb_01234567',
      options(okJson({ results: { company: COMPANY } }))
    );
    assert.equal(lookup.ok, true);
    if (!lookup.ok) return;
    assert.equal(lookup.company.id, 'oc_gb_01234567');
    assert.equal(lookup.company.legalName, 'EXAMPLE REGISTRY HOLDINGS PLC');
    assert.equal(lookup.company.source.retrievedAt, NOW.toISOString());
  });
});

describe('lookup — failures never produce a company', () => {
  it('404 yields a not-found failure and no company', async () => {
    const lookup = await lookupRegistryCompany(
      'oc_gb_99999999',
      options(statusJson(404))
    );
    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_COMPANY_NOT_FOUND');
  });

  it('a missing token yields a configuration failure and never calls the provider', async () => {
    let called = false;
    const spy = (async () => {
      called = true;
      return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
    }) as unknown as typeof fetch;

    const lookup = await lookupRegistryCompany('oc_gb_01234567', {
      fetchImpl: spy,
      token: '',
      now: () => NOW,
    });

    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_NOT_CONFIGURED');
    assert.equal(called, false, 'the provider must not be called without a token');
  });

  it('a placeholder token is treated as not configured', async () => {
    const lookup = await lookupRegistryCompany(
      'oc_gb_01234567',
      options(statusJson(200), 'your_opencorporates_api_token_here')
    );
    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_NOT_CONFIGURED');
  });

  it('a provider 5xx yields an unavailable failure, not a company', async () => {
    const lookup = await lookupRegistryCompany(
      'oc_gb_01234567',
      options(statusJson(503))
    );
    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_UNAVAILABLE');
  });

  it('rejected credentials yield a provider error, not a company', async () => {
    const lookup = await lookupRegistryCompany('oc_gb_01234567', options(statusJson(401)));
    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_ERROR');
  });

  it('a network failure yields an unavailable failure', async () => {
    const lookup = await lookupRegistryCompany(
      'oc_gb_01234567',
      options(networkError())
    );
    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_UNAVAILABLE');
  });

  it('unreadable JSON yields a malformed-response failure', async () => {
    const lookup = await lookupRegistryCompany('oc_gb_01234567', options(brokenJson()));
    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_MALFORMED_RESPONSE');
  });

  it('a response without a company record yields a malformed-response failure', async () => {
    const lookup = await lookupRegistryCompany(
      'oc_gb_01234567',
      options(okJson({ results: {} }))
    );
    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_MALFORMED_RESPONSE');
  });

  it('an invalid company id is rejected before any provider call', async () => {
    let called = false;
    const spy = (async () => {
      called = true;
      return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
    }) as unknown as typeof fetch;

    const lookup = await lookupRegistryCompany('c1', { fetchImpl: spy, token: TOKEN, now: () => NOW });
    assert.equal(lookup.ok, false);
    if (lookup.ok) return;
    assert.equal(lookup.code, 'REGISTRY_ID_INVALID');
    assert.equal(called, false);
  });
});

describe('search — a failure is distinguishable from zero results', () => {
  it('an empty result set is a successful search with zero results', async () => {
    const outcome = await searchRegistryCompanies(
      'nothing matches this',
      options(okJson({ results: { companies: [] } }))
    );
    assert.equal(outcome.status, 'ok');
    if (outcome.status !== 'ok') return;
    assert.deepEqual(outcome.results, []);
  });

  it('a provider failure is never reported as ok', async () => {
    const cases = [
      { impl: statusJson(500), expected: 'provider_unavailable' },
      { impl: statusJson(403), expected: 'provider_error' },
      { impl: networkError(), expected: 'provider_unavailable' },
      { impl: brokenJson(), expected: 'malformed_response' },
      { impl: okJson({ results: { companies: 'not-an-array' } }), expected: 'malformed_response' },
    ] as const;

    for (const testCase of cases) {
      const outcome = await searchRegistryCompanies('acme', options(testCase.impl));
      assert.notEqual(
        outcome.status,
        'ok',
        `a provider failure must not be reported as a successful search`
      );
      assert.equal(outcome.status, testCase.expected);
      assert.equal(typeof outcome.message, 'string');
      assert.ok(outcome.message.length > 0);
    }
  });

  it('a missing token reports not_configured rather than an empty search', async () => {
    const outcome = await searchRegistryCompanies('acme', {
      fetchImpl: okJson({ results: { companies: [] } }),
      token: '',
      now: () => NOW,
    });
    assert.equal(outcome.status, 'not_configured');
  });

  it('drops records with no usable identity instead of generating ids', async () => {
    const outcome = await searchRegistryCompanies(
      'acme',
      options(
        okJson({
          results: {
            companies: [
              { company: { name: 'NO NUMBER LTD', jurisdiction_code: 'gb' } },
              { company: COMPANY },
            ],
          },
        })
      )
    );

    assert.equal(outcome.status, 'ok');
    if (outcome.status !== 'ok') return;
    assert.equal(outcome.results.length, 1);
    assert.equal(outcome.results[0].id, 'oc_gb_01234567');
  });

  it('reports malformed_response when no returned record is usable', async () => {
    const outcome = await searchRegistryCompanies(
      'acme',
      options(
        okJson({
          results: { companies: [{ company: { name: 'NO NUMBER LTD', jurisdiction_code: 'gb' } }] },
        })
      )
    );
    assert.equal(outcome.status, 'malformed_response');
  });

  it('normalizes confirmed search results with stable ids', async () => {
    const outcome = await searchRegistryCompanies(
      'acme',
      options(okJson({ results: { companies: [{ company: COMPANY }] } }))
    );
    assert.equal(outcome.status, 'ok');
    if (outcome.status !== 'ok') return;
    assert.equal(outcome.results[0].id, 'oc_gb_01234567');
    assert.equal(outcome.results[0].source.verificationStatus, 'unverified');
  });
});
