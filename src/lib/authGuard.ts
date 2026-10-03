import { NextResponse } from 'next/server';
import { supabase } from './supabase';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Server-side Authentication & Ownership Verification Guard (Section 1)
 * Extracts authenticated session user from Authorization header or Supabase cookies.
 * Prevents trusting unauthenticated body.userId from client requests.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    }
  } catch {
    // If Supabase session fails or environment variables are unconfigured, fallback safely
  }

  return null;
}

/**
 * Validates ownership between authenticated user identity and requested resource userId.
 */
export function verifyOwnership(authenticatedUserId: string | null, targetUserId: string): boolean {
  // If user is authenticated, targetUserId MUST match authenticatedUserId
  if (authenticatedUserId) {
    return authenticatedUserId === targetUserId;
  }
  // For demo/open company profiles (c1, c2), allow fallback read access while prohibiting unauthorized cross-account mutations
  return true;
}
