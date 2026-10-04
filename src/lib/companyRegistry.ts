/**
 * OpenCorporates transport for real company identity.
 *
 * ABSOLUTE RULE (FRL): REAL DATA ONLY.
 * A company record exists in FRL only when the registry provider actually
 * confirmed it. There is NO fallback that synthesizes a company, and NO path
 * that turns an error into a fake company. Every failure is reported with a
 * stable, non-secret error code.
 *
 * `fetch`, the API token and the clock are injectable so every failure branch
 * is testable without network access or a mocking framework.
 */

import {
  normalizeOpenCorporatesCompany,
  parseCompanyId,
  type NormalizedRegistryCompany,
  type RegistryErrorCode,
} from './companyIdentityAdapter';

const API_BASE = 'https://api.opencorporates.com/v0.2';
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_SEARCH_RESULTS = 10;

/**
 * Placeholder values that are commonly copied out of the env template and
 * would otherwise be treated as a real credential.
 */
const PLACEHOLDER_TOKENS = new Set([
  'your_opencorporates_api_token_here',
  'your_api_token_here',
  'changeme',
  'todo',
]);

export interface RegistryClientOptions {
  /** Defaults to OPENCORPORATES_API_TOKEN. Pass '' to simulate an unset token. */
  token?: string | undefined;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => Date;
}

export type RegistryFailure = {
  ok: false;
  code: RegistryErrorCode;
  message: string;
};

export type RegistryLookup =
  | { ok: true; company: NormalizedRegistryCompany }
  | RegistryFailure;

/**
 * Result statuses for a registry search. These are deliberately distinct so a
 * provider failure can never be rendered as "no results found".
 */
export type RegistrySearchStatus =
  | 'ok'
  | 'not_configured'
  | 'provider_unavailable'
  | 'provider_error'
  | 'malformed_response';

export type RegistrySearchOutcome =
  | { status: 'ok'; results: NormalizedRegistryCompany[] }
  | {
      status: Exclude<RegistrySearchStatus, 'ok'>;
      code: RegistryErrorCode;
      message: string;
    };

/**
 * Reads the server-side token. Returns null when absent or still a template
 * placeholder, so the caller reports a configuration error rather than
 * silently degrading to synthetic data.
 */
export function normalizeToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  if (token.length === 0) return null;
  // A copied template placeholder must never be treated as a live credential.
  if (PLACEHOLDER_TOKENS.has(token.toLowerCase())) return null;
  return token;
}

export function getRegistryToken(): string | null {
  return normalizeToken(process.env.OPENCORPORATES_API_TOKEN);
}

function resolveOptions(options: RegistryClientOptions): {
  token: string | null;
  fetchImpl: typeof fetch;
  timeoutMs: number;
  now: () => Date;
} {
  return {
    // The placeholder guard applies to every token, not only env-sourced ones.
    token:
      options.token === undefined
        ? getRegistryToken()
        : normalizeToken(options.token),
    fetchImpl: options.fetchImpl ?? fetch,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    now: options.now ?? (() => new Date()),
  };
}

function buildUrl(path: string, token: string, params: Record<string, string>): string {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('api_token', token);
  return url.toString();
}

const NOT_CONFIGURED: RegistryFailure = {
  ok: false,
  code: 'REGISTRY_NOT_CONFIGURED',
  message:
    'The company registry provider is not configured. Set OPENCORPORATES_API_TOKEN to enable real company records.',
};

const UNAVAILABLE: RegistryFailure = {
  ok: false,
  code: 'REGISTRY_UNAVAILABLE',
  message: 'The company registry provider could not be reached. Please try again later.',
};

function error(code: RegistryErrorCode, message: string): RegistryFailure {
  return { ok: false, code, message };
}

/** Maps a provider HTTP status onto a stable, non-secret failure. */
function failureForStatus(status: number, notFound: RegistryFailure): RegistryFailure {
  if (status === 404) return notFound;
  if (status >= 500) return UNAVAILABLE;
  if (status === 401 || status === 403) {
    return error(
      'REGISTRY_ERROR',
      'The company registry provider rejected the configured API credentials.'
    );
  }
  return error(
    'REGISTRY_ERROR',
    'The company registry provider returned an error for this request.'
  );
}

/**
 * Looks up one real company by its FRL company id.
 *
 * Returns `null`-equivalent failures rather than a synthesized company for
 * every unhappy path: invalid id, missing token, 404, provider error, network
 * failure, and malformed payload all resolve to an explicit error.
 */
export async function lookupRegistryCompany(
  id: string,
  options: RegistryClientOptions = {}
): Promise<RegistryLookup> {
  const parts = parseCompanyId(id);
  if (!parts) {
    return error(
      'REGISTRY_ID_INVALID',
      'This is not a valid real-company identifier.'
    );
  }

  const { token, fetchImpl, timeoutMs, now } = resolveOptions(options);
  if (!token) return NOT_CONFIGURED;

  const url = buildUrl(
    `/companies/${encodeURIComponent(parts.jurisdictionCode)}/${encodeURIComponent(
      parts.companyNumber
    )}`,
    token,
    {}
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch {
    return UNAVAILABLE;
  } finally {
    clearTimeout(timeoutId);
  }

  const notFound = error(
    'REGISTRY_COMPANY_NOT_FOUND',
    'The company registry provider does not have a record for this company.'
  );

  if (!response.ok) return failureForStatus(response.status, notFound);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return error(
      'REGISTRY_MALFORMED_RESPONSE',
      'The company registry provider returned a response FRL could not read.'
    );
  }

  const container = payload as { results?: { company?: unknown } } | null;
  const rawCompany = container?.results?.company;
  if (!rawCompany || typeof rawCompany !== 'object') {
    return error(
      'REGISTRY_MALFORMED_RESPONSE',
      'The company registry provider returned no company record for this identifier.'
    );
  }

  const normalized = normalizeOpenCorporatesCompany(rawCompany, {
    jurisdictionCode: parts.jurisdictionCode,
    companyNumber: parts.companyNumber,
    retrievedAt: now().toISOString(),
  });

  if (!normalized.ok) return error(normalized.code, normalized.message);
  return { ok: true, company: normalized.company };
}

/**
 * Searches the registry for real companies.
 *
 * A provider failure is reported through `status` and never collapses into an
 * empty result set.
 */
export async function searchRegistryCompanies(
  query: string,
  options: RegistryClientOptions = {}
): Promise<RegistrySearchOutcome> {
  const { token, fetchImpl, timeoutMs, now } = resolveOptions(options);
  if (!token) {
    return {
      status: 'not_configured',
      code: NOT_CONFIGURED.code,
      message: NOT_CONFIGURED.message,
    };
  }

  const url = buildUrl('/companies/search', token, { q: query });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch {
    return {
      status: 'provider_unavailable',
      code: UNAVAILABLE.code,
      message: UNAVAILABLE.message,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const failure = failureForStatus(
      response.status,
      error('REGISTRY_ERROR', 'The company registry provider returned an error.')
    );
    const status =
      failure.code === 'REGISTRY_UNAVAILABLE' ? 'provider_unavailable' : 'provider_error';
    return { status, code: failure.code, message: failure.message };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      status: 'malformed_response',
      code: 'REGISTRY_MALFORMED_RESPONSE',
      message: 'The company registry provider returned a response FRL could not read.',
    };
  }

  const results = (payload as { results?: { companies?: unknown } } | null)?.results
    ?.companies;
  if (!Array.isArray(results)) {
    return {
      status: 'malformed_response',
      code: 'REGISTRY_MALFORMED_RESPONSE',
      message: 'The company registry provider returned an unexpected response shape.',
    };
  }

  const retrievedAt = now().toISOString();
  const companies: NormalizedRegistryCompany[] = [];
  let rejected = 0;

  for (const entry of results.slice(0, MAX_SEARCH_RESULTS)) {
    const rawCompany =
      typeof entry === 'object' && entry !== null
        ? (entry as { company?: unknown }).company
        : undefined;
    const normalized = normalizeOpenCorporatesCompany(rawCompany, { retrievedAt });
    if (normalized.ok) {
      companies.push(normalized.company);
    } else {
      // A record without a usable registry identity is dropped, never given a
      // generated identifier.
      rejected += 1;
    }
  }

  if (companies.length === 0 && rejected > 0) {
    return {
      status: 'malformed_response',
      code: 'REGISTRY_MALFORMED_RESPONSE',
      message:
        'The company registry provider returned records without a usable company identity.',
    };
  }

  return { status: 'ok', results: companies };
}
