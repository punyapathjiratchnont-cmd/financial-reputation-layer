import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getCompanyById, toCompanyProfile } from '../realCompanyService';
import { normalizeOpenCorporatesCompany } from '../companyIdentityAdapter';

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
  opencorporates_url: 'https://opencorporates.com/companies/gb/01234567',
};

function fetchReturning(body: unknown, status = 200): typeof fetch {
  return (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }) as unknown as Response) as unknown as typeof fetch;
}

function failingFetch(): typeof fetch {
  return (async () => {
    throw new TypeError('fetch failed');
  }) as unknown as typeof fetch;
}

const opts = (fetchImpl: typeof fetch, token: string | undefined = TOKEN) => ({
  fetchImpl,
  token,
  now: () => NOW,
});

/**
 * Every one of these paths previously produced a fabricated company profile.
 * Each must now resolve to not_found or an explicit error.
 */
describe('getCompanyById — no fabricated company on any failure path', () => {
  const failureCases = [
    {
      name: 'provider 404 (company does not exist)',
      options: () => opts(fetchReturning({}, 404)),
      expected: 'not_found',
    },
    {
      name: 'provider 500',
      options: () => opts(fetchReturning({}, 500)),
      expected: 'REGISTRY_UNAVAILABLE',
    },
    {
      name: 'provider 401 (rejected credentials)',
      options: () => opts(fetchReturning({}, 401)),
      expected: 'REGISTRY_ERROR',
    },
    {
      name: 'network failure',
      options: () => opts(failingFetch()),
      expected: 'REGISTRY_UNAVAILABLE',
    },
    {
      name: 'malformed response (no company in payload)',
      options: () => opts(fetchReturning({ results: {} })),
      expected: 'REGISTRY_MALFORMED_RESPONSE',
    },
    {
      name: 'unreadable JSON',
      options: () =>
        opts((async () => {
          return {
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError('bad json');
            },
          } as unknown as Response;
        }) as unknown as typeof fetch),
      expected: 'REGISTRY_MALFORMED_RESPONSE',
    },
    {
      name: 'missing API token',
      options: () => opts(fetchReturning({ results: { company: COMPANY } }), ''),
      expected: 'REGISTRY_NOT_CONFIGURED',
    },
  ] as const;

  for (const testCase of failureCases) {
    it(`${testCase.name} produces no company`, async () => {
      const result = await getCompanyById('oc_gb_01234567', testCase.options());

      assert.notEqual(
        result.status,
        'found',
        `${testCase.name} must never produce a company profile`
      );

      if (testCase.expected === 'not_found') {
        assert.equal(result.status, 'not_found');
        return;
      }

      assert.equal(result.status, 'error');
      if (result.status !== 'error') return;
      assert.equal(result.code, testCase.expected);
      assert.ok(!('company' in result), 'an error result must not carry a company');
    });
  }

  it('an unknown non-registry id resolves to not_found', async () => {
    const result = await getCompanyById('does-not-exist', opts(fetchReturning({})));
    assert.equal(result.status, 'not_found');
  });
});

describe('getCompanyById — confirmed company', () => {
  it('returns a profile built only from confirmed registry fields', async () => {
    const result = await getCompanyById(
      'oc_gb_01234567',
      opts(fetchReturning({ results: { company: COMPANY } }))
    );

    assert.equal(result.status, 'found');
    if (result.status !== 'found') return;

    const company = result.company;
    assert.equal(company.id, 'oc_gb_01234567');
    assert.equal(company.name, 'EXAMPLE REGISTRY HOLDINGS PLC');
    assert.equal(company.registration_no, '01234567');
    assert.equal(company.jurisdictionCode, 'gb');
    assert.equal(company.companyStatus, 'Active');
    assert.equal(company.incorporationDate, '1998-03-12');
    // The registry reported no country, so none may be shown.
    assert.equal(company.country, undefined);

    // Provenance: registry retrieval, explicitly not FRL-verified.
    assert.equal(company.sourceInfo?.provider, 'OpenCorporates');
    assert.equal(company.sourceInfo?.sourceType, 'public_registry');
    assert.equal(company.sourceInfo?.verificationStatus, 'unverified');
    assert.equal(company.sourceInfo?.retrievedAt, NOW.toISOString());

    // Strict product rule: registry identity is not evidence.
    assert.equal(company.reputationScore, null);
    assert.equal(company.isClaimed, false);
    for (const dimension of Object.values(company.dimensions ?? {})) {
      assert.equal(dimension.score, null);
      assert.equal(dimension.isSufficient, false);
    }

    // History comes from the registry's own incorporation date.
    assert.equal(company.reputationHistory?.length, 1);
    assert.match(company.reputationHistory?.[0].event ?? '', /1998-03-12/);
  });

  it('resolves local demo companies from the development dataset', async () => {
    const result = await getCompanyById('c1', opts(fetchReturning({})));
    assert.equal(result.status, 'found');
    if (result.status !== 'found') return;
    assert.equal(result.company.id, 'c1');
  });
});

describe('toCompanyProfile — a sparse registry record', () => {
  it('leaves absent fields undefined and invents nothing', () => {
    const normalized = normalizeOpenCorporatesCompany(
      { company_number: '999', jurisdiction_code: 'sg', name: 'SPARSE RECORD PTE LTD' },
      { retrievedAt: NOW.toISOString() }
    );
    assert.equal(normalized.ok, true);
    if (!normalized.ok) return;

    const company = toCompanyProfile(normalized.company);

    assert.equal(company.id, 'oc_sg_999');
    assert.equal(company.registration_no, '999');
    assert.equal(company.jurisdictionCode, 'sg');
    assert.equal(company.country, undefined, 'no country may be invented from a jurisdiction');
    assert.equal(company.companyStatus, undefined);
    assert.equal(company.incorporationDate, undefined);
    assert.equal(company.founded_date, undefined);
    assert.equal(company.industry, undefined);
    assert.equal(company.officialWebsite, undefined);
    assert.deepEqual(company.reputationHistory, []);
    assert.deepEqual(company.trackRecord?.achievements, []);
  });

  it('uses the registration number as the label when no legal name exists', () => {
    const normalized = normalizeOpenCorporatesCompany(
      { company_number: '999', jurisdiction_code: 'sg' },
      { retrievedAt: NOW.toISOString() }
    );
    assert.equal(normalized.ok, true);
    if (!normalized.ok) return;
    const company = toCompanyProfile(normalized.company);
    assert.equal(company.name, '999 (sg)');
    assert.match(company.overview ?? '', /does not report a legal name/);
  });

  it('never claims FRL verification in the overview text', () => {
    const normalized = normalizeOpenCorporatesCompany(COMPANY, {
      retrievedAt: NOW.toISOString(),
    });
    assert.equal(normalized.ok, true);
    if (!normalized.ok) return;
    const company = toCompanyProfile(normalized.company);
    assert.match(company.overview ?? '', /has not been verified by FRL/);
    assert.match(company.quickSummary?.dataStatus ?? '', /not verified by FRL/);
  });
});
