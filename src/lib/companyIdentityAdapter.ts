/**
 * Pure company identity rules for real registry data.
 *
 * ABSOLUTE RULE (FRL): REAL DATA ONLY.
 * Every value produced here is either taken verbatim from the provider payload
 * or left `null`. This module NEVER invents, infers, defaults, or guesses an
 * identity value, and NEVER fabricates provenance or a retrieval timestamp.
 *
 * There is deliberately no `fetch()` and no `process.env` in this file, so
 * every identity rule below is testable in isolation.
 */

import type { CompanySourceInfo } from './types';

export const REGISTRY_PROVIDER = 'OpenCorporates';

/** Jurisdiction codes: 2-3 lowercase letters, optional `_suffix` (e.g. `us_de`). */
const JURISDICTION_PATTERN = /^[a-z]{2,3}(?:_[a-z0-9]{2,6})?$/;
/** Same, but as it appears inside a company id segment (`us-de`). */
const JURISDICTION_ID_SEGMENT_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,6})?$/;
/** Registry company numbers. Deliberately excludes `_` and whitespace. */
const COMPANY_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]{0,63}$/;

export const COMPANY_ID_PREFIX = 'oc';

/** Stable, non-secret error codes. Safe to return to the browser. */
export type RegistryErrorCode =
  | 'REGISTRY_ID_INVALID'
  | 'REGISTRY_NOT_CONFIGURED'
  | 'REGISTRY_COMPANY_NOT_FOUND'
  | 'REGISTRY_UNAVAILABLE'
  | 'REGISTRY_ERROR'
  | 'REGISTRY_MALFORMED_RESPONSE'
  | 'REGISTRY_IDENTITY_UNUSABLE';

/**
 * A registry company after normalization.
 *
 * Every field except `id` and `source` is nullable on purpose: a registry
 * record routinely omits values, and omission must stay visible rather than
 * being papered over with a placeholder.
 */
export interface NormalizedRegistryCompany {
  id: string;
  legalName: string | null;
  registrationNumber: string | null;
  /** Registry jurisdiction code, e.g. `gb`, `us_de`. Never a country name. */
  jurisdictionCode: string | null;
  /** Present ONLY when the payload explicitly provides a country. */
  country: string | null;
  companyStatus: string | null;
  entityType: string | null;
  incorporationDate: string | null;
  dissolutionDate: string | null;
  registeredAddress: string | null;
  officialWebsite: string | null;
  /** Provider-native record id. */
  openCorporatesId: string | null;
  source: CompanySourceInfo;
}

export type NormalizationResult =
  | { ok: true; company: NormalizedRegistryCompany }
  | { ok: false; code: RegistryErrorCode; message: string };

export interface CompanyIdParts {
  jurisdictionCode: string;
  companyNumber: string;
}

/** Returns a trimmed, non-empty string, or null. Never coerces other types. */
export function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Normalizes a registry jurisdiction code, or null when it is not usable. */
export function normalizeJurisdiction(value: unknown): string | null {
  const raw = pickString(value);
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  return JURISDICTION_PATTERN.test(lowered) ? lowered : null;
}

/** `us_de` -> `us-de`, so the id stays unambiguously splittable. */
function jurisdictionToIdSegment(jurisdictionCode: string): string {
  return jurisdictionCode.replace('_', '-');
}

/** Inverse of {@link jurisdictionToIdSegment}. */
function jurisdictionFromIdSegment(segment: string): string | null {
  if (!JURISDICTION_ID_SEGMENT_PATTERN.test(segment)) return null;
  return segment.replace('-', '_');
}

/**
 * Builds a deterministic, registry-derived company id.
 *
 * Returns null when the supplied identity is not usable. It MUST NOT fall back
 * to a random or time-based identifier: an unstable id cannot be resolved
 * again, so it would be a fabricated identity.
 */
export function buildCompanyId(
  jurisdictionCode: unknown,
  companyNumber: unknown
): string | null {
  const jurisdiction = normalizeJurisdiction(jurisdictionCode);
  if (!jurisdiction) return null;

  const number = pickString(companyNumber);
  if (!number || !COMPANY_NUMBER_PATTERN.test(number)) return null;

  return `${COMPANY_ID_PREFIX}_${jurisdictionToIdSegment(jurisdiction)}_${number.toLowerCase()}`;
}

/**
 * Parses a company id back into its registry parts, or null when the id is
 * not a well-formed real-company id.
 */
export function parseCompanyId(id: unknown): CompanyIdParts | null {
  const raw = pickString(id);
  if (!raw) return null;

  const prefix = `${COMPANY_ID_PREFIX}_`;
  if (!raw.startsWith(prefix)) return null;

  const rest = raw.slice(prefix.length);
  const separator = rest.indexOf('_');
  if (separator <= 0) return null;

  const jurisdictionCode = jurisdictionFromIdSegment(rest.slice(0, separator));
  if (!jurisdictionCode) return null;

  const companyNumber = rest.slice(separator + 1);
  if (!COMPANY_NUMBER_PATTERN.test(companyNumber)) return null;

  return { jurisdictionCode, companyNumber };
}

/** True when `id` is a real-company id this service can attempt to resolve. */
export function isRegistryCompanyId(id: unknown): boolean {
  return parseCompanyId(id) !== null;
}

export interface NormalizeContext {
  /**
   * Registry parts already known from the requested id. Used only when the
   * payload omits them; the payload always wins when it supplies a value.
   */
  jurisdictionCode?: string | undefined;
  companyNumber?: string | undefined;
  /** Actual wall-clock time of THIS retrieval. */
  retrievedAt: string;
}

/**
 * Normalizes one OpenCorporates company payload.
 *
 * Rejects the record (rather than guessing) when the payload is not an object
 * or carries no usable registry identity.
 */
export function normalizeOpenCorporatesCompany(
  raw: unknown,
  context: NormalizeContext
): NormalizationResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      code: 'REGISTRY_MALFORMED_RESPONSE',
      message: 'Registry provider returned an unusable company record.',
    };
  }

  const company = raw as Record<string, unknown>;

  const jurisdictionCode =
    normalizeJurisdiction(company.jurisdiction_code) ??
    normalizeJurisdiction(context.jurisdictionCode);

  const registrationNumber =
    pickString(company.company_number) ?? pickString(context.companyNumber);

  const id = buildCompanyId(jurisdictionCode, registrationNumber);
  if (!id) {
    return {
      ok: false,
      code: 'REGISTRY_IDENTITY_UNUSABLE',
      message:
        'Registry provider did not supply a usable jurisdiction and registration number for this company.',
    };
  }

  return {
    ok: true,
    company: {
      id,
      legalName: pickString(company.name),
      registrationNumber,
      jurisdictionCode,
      // A country is only recorded when the payload states one. A jurisdiction
      // code is never relabelled as a country.
      country: pickString(company.country_code),
      companyStatus: pickString(company.current_status),
      entityType: pickString(company.company_type),
      incorporationDate: pickString(company.incorporation_date),
      dissolutionDate: pickString(company.dissolution_date),
      registeredAddress: normalizeAddress(company.registry_address),
      officialWebsite: pickString(company.website_url),
      openCorporatesId: pickString(company.id),
      source: {
        provider: REGISTRY_PROVIDER,
        sourceType: 'public_registry',
        // Retrieval from a registry is NOT an FRL verification.
        verificationStatus: 'unverified',
        url: pickString(company.opencorporates_url) ?? undefined,
        retrievedAt: context.retrievedAt,
      },
    },
  };
}

/** Flattens a registry address object, or passes a string through. Null if absent. */
function normalizeAddress(value: unknown): string | null {
  const direct = pickString(value);
  if (direct) return direct;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const address = value as Record<string, unknown>;
  const parts = [
    pickString(address.street_address),
    pickString(address.city),
    pickString(address.region),
    pickString(address.postal_code),
    pickString(address.country),
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(', ') : null;
}

/** Case/whitespace-insensitive key used to match real records against demo ones. */
export function identityMatchKey(value: string | null | undefined): string | null {
  const normalized = pickString(value);
  if (!normalized) return null;
  return normalized.toLowerCase().replace(/\s+/g, ' ').trim();
}

export interface SearchPartition<TDemo> {
  /** Confirmed real registry results, in provider order. */
  results: NormalizedRegistryCompany[];
  /** Demo records that do not collide with any confirmed real record. */
  demoResults: TDemo[];
}

/**
 * Splits results so real registry data always wins.
 *
 * A demo record is suppressed when a confirmed real record shares its
 * normalized company name or its registration number. Demo data is never
 * allowed to hide a real registry result.
 */
export function partitionSearchResults<
  TDemo extends { name?: string; registrationNumber?: string | null },
>(real: NormalizedRegistryCompany[], demo: TDemo[]): SearchPartition<TDemo> {
  const realNames = new Set<string>();
  const realNumbers = new Set<string>();

  for (const company of real) {
    const name = identityMatchKey(company.legalName);
    if (name) realNames.add(name);
    const number = identityMatchKey(company.registrationNumber);
    if (number) realNumbers.add(number);
  }

  const demoResults = demo.filter((item) => {
    const name = identityMatchKey(item.name);
    if (name && realNames.has(name)) return false;
    const number = identityMatchKey(item.registrationNumber ?? null);
    if (number && realNumbers.has(number)) return false;
    return true;
  });

  return { results: real, demoResults };
}
