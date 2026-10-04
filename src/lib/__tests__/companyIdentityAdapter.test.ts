import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCompanyId,
  parseCompanyId,
  normalizeJurisdiction,
  normalizeOpenCorporatesCompany,
  partitionSearchResults,
  isRegistryCompanyId,
} from '../companyIdentityAdapter';

const NOW = '2026-10-04T00:00:00.000Z';

const VALID_PAYLOAD = {
  id: 'opencorporates_abc',
  company_number: '01234567',
  jurisdiction_code: 'gb',
  name: 'EXAMPLE REGISTRY HOLDINGS PLC',
  current_status: 'Active',
  company_type: 'PLC',
  incorporation_date: '1998-03-12',
  dissolution_date: '',
  website_url: 'https://example-holdings.example',
  opencorporates_url: 'https://opencorporates.com/companies/gb/01234567',
};

describe('normalization — valid registry company', () => {
  it('normalizes a valid OpenCorporates company', () => {
    const result = normalizeOpenCorporatesCompany(VALID_PAYLOAD, { retrievedAt: NOW });
    assert.equal(result.ok, true);
    if (!result.ok) return;

    const c = result.company;
    assert.equal(c.legalName, 'EXAMPLE REGISTRY HOLDINGS PLC');
    assert.equal(c.registrationNumber, '01234567');
    assert.equal(c.jurisdictionCode, 'gb');
    assert.equal(c.companyStatus, 'Active');
    assert.equal(c.entityType, 'PLC');
    assert.equal(c.incorporationDate, '1998-03-12');
    assert.equal(c.officialWebsite, 'https://example-holdings.example');
    assert.equal(c.openCorporatesId, 'opencorporates_abc');
  });

  it('marks the record as a public registry record that FRL has not verified', () => {
    const result = normalizeOpenCorporatesCompany(VALID_PAYLOAD, { retrievedAt: NOW });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.company.source.provider, 'OpenCorporates');
    assert.equal(result.company.source.sourceType, 'public_registry');
    assert.equal(result.company.source.verificationStatus, 'unverified');
    assert.equal(result.company.source.retrievedAt, NOW);
  });

  it('leaves fields the registry omitted as null rather than defaulting them', () => {
    const result = normalizeOpenCorporatesCompany(VALID_PAYLOAD, { retrievedAt: NOW });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.company.dissolutionDate, null, 'empty date must not become a date');
  });
});

describe('normalization — malformed and unusable records', () => {
  it('rejects a non-object payload', () => {
    for (const bad of [null, undefined, 'a string', 42, ['x']]) {
      const result = normalizeOpenCorporatesCompany(bad, { retrievedAt: NOW });
      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.equal(result.code, 'REGISTRY_MALFORMED_RESPONSE');
    }
  });

  it('rejects a record with no company number instead of inventing an id', () => {
    const result = normalizeOpenCorporatesCompany(
      { name: 'NO NUMBER COMPANY', jurisdiction_code: 'gb' },
      { retrievedAt: NOW }
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, 'REGISTRY_IDENTITY_UNUSABLE');
  });

  it('rejects a record whose company number is unusable', () => {
    const result = normalizeOpenCorporatesCompany(
      { name: 'BAD NUMBER', jurisdiction_code: 'gb', company_number: 'has spaces' },
      { retrievedAt: NOW }
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, 'REGISTRY_IDENTITY_UNUSABLE');
  });
});

describe('deterministic company ids', () => {
  it('produces the same id for the same registry identity', () => {
    const a = buildCompanyId('gb', '01234567');
    const b = buildCompanyId('GB', '01234567');
    assert.equal(a, 'oc_gb_01234567');
    assert.equal(a, b, 'id must not depend on casing or call order');
  });

  it('round-trips through parseCompanyId', () => {
    const id = buildCompanyId('us_de', '1234567');
    assert.equal(id, 'oc_us-de_1234567');
    assert.deepEqual(parseCompanyId(id), {
      jurisdictionCode: 'us_de',
      companyNumber: '1234567',
    });
  });

  it('refuses to build an id without a usable jurisdiction or number', () => {
    assert.equal(buildCompanyId('', '01234567'), null);
    assert.equal(buildCompanyId('gb', ''), null);
    assert.equal(buildCompanyId(null, '01234567'), null);
    assert.equal(buildCompanyId('gb', null), null);
    assert.equal(buildCompanyId('gb', 'bad number'), null);
  });

  it('rejects malformed ids, including local demo ids', () => {
    assert.equal(parseCompanyId('c1'), null);
    assert.equal(parseCompanyId('oc_'), null);
    assert.equal(parseCompanyId('oc_gb'), null);
    assert.equal(parseCompanyId('oc_gb_'), null);
    assert.equal(parseCompanyId('oc_!!!_12345'), null);
    assert.equal(isRegistryCompanyId('c1'), false);
    assert.equal(isRegistryCompanyId('oc_gb_01234567'), true);
  });
});

describe('jurisdiction is not country', () => {
  it('keeps the jurisdiction code separate and does not invent a country', () => {
    const result = normalizeOpenCorporatesCompany(VALID_PAYLOAD, { retrievedAt: NOW });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.company.jurisdictionCode, 'gb');
    assert.equal(
      result.company.country,
      null,
      'a jurisdiction code must never be relabelled as a country'
    );
  });

  it('records a country only when the source explicitly provides one', () => {
    const result = normalizeOpenCorporatesCompany(
      { ...VALID_PAYLOAD, country_code: 'GB' },
      { retrievedAt: NOW }
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.company.jurisdictionCode, 'gb');
    assert.equal(result.company.country, 'GB');
  });

  it('rejects an implausible jurisdiction rather than passing it through', () => {
    assert.equal(normalizeJurisdiction('GB'), 'gb');
    assert.equal(normalizeJurisdiction('not a jurisdiction'), null);
  });
});

describe('real registry results always beat demo data', () => {
  const real = normalizeOpenCorporatesCompany(VALID_PAYLOAD, { retrievedAt: NOW });
  assert.equal(real.ok, true);
  if (!real.ok) throw new Error('fixture failed');

  it('drops a demo record that shares a name with a confirmed real record', () => {
    const demo = [
      { name: 'Example Registry Holdings PLC', registrationNumber: 'demo-1' },
      { name: 'Unrelated Demo Freight Ltd', registrationNumber: 'demo-2' },
    ];
    const { results, demoResults } = partitionSearchResults([real.company], demo);
    assert.equal(results.length, 1);
    assert.equal(demoResults.length, 1);
    assert.equal(demoResults[0].name, 'Unrelated Demo Freight Ltd');
  });

  it('drops a demo record that shares a registration number with a real record', () => {
    const demo = [{ name: 'Totally Different Name Ltd', registrationNumber: '01234567' }];
    const { demoResults } = partitionSearchResults([real.company], demo);
    assert.equal(demoResults.length, 0);
  });

  it('matches names case- and whitespace-insensitively', () => {
    const demo = [{ name: '  example   registry holdings plc ', registrationNumber: null }];
    const { demoResults } = partitionSearchResults([real.company], demo);
    assert.equal(demoResults.length, 0);
  });
});
