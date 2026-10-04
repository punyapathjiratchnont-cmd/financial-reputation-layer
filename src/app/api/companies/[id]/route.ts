import { NextResponse } from 'next/server';
import { getCompanyById } from '@/lib/realCompanyService';
import type { RegistryErrorCode } from '@/lib/companyIdentityAdapter';

const MAX_ID_LENGTH = 120;

/**
 * Maps a registry failure onto an honest HTTP status.
 * A missing configuration or an unreachable provider is 503; anything else the
 * provider got wrong is 502. Neither ever returns a fabricated company.
 */
function httpStatusFor(code: RegistryErrorCode): number {
  switch (code) {
    case 'REGISTRY_NOT_CONFIGURED':
    case 'REGISTRY_UNAVAILABLE':
      return 503;
    case 'REGISTRY_ERROR':
    case 'REGISTRY_MALFORMED_RESPONSE':
    case 'REGISTRY_IDENTITY_UNUSABLE':
      return 502;
    case 'REGISTRY_COMPANY_NOT_FOUND':
    case 'REGISTRY_ID_INVALID':
    default:
      return 404;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length > MAX_ID_LENGTH) {
      return NextResponse.json(
        { error: 'A company id is required.', code: 'COMPANY_ID_REQUIRED' },
        { status: 400 }
      );
    }

    const result = await getCompanyById(id);

    if (result.status === 'found') {
      return NextResponse.json({ company: result.company });
    }

    if (result.status === 'not_found') {
      return NextResponse.json(
        {
          error: 'No company record was found for this identifier.',
          code: 'COMPANY_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: result.message, code: result.code },
      { status: httpStatusFor(result.code) }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve company profile.', code: 'COMPANY_LOOKUP_FAILED' },
      { status: 500 }
    );
  }
}
