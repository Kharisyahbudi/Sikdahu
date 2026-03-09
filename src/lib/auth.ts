import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export interface AuthResult {
  authenticated: boolean;
  isAdmin: boolean;
  isPublic: boolean;
  session: {
    id: string;
    userId: string | null;
    role: string;
    user?: {
      id: string;
      name: string;
      username: string;
    } | null;
  } | null;
}

/**
 * Check authentication status from session cookie
 * @returns AuthResult with authentication details
 */
export async function getAuth(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return { authenticated: false, isAdmin: false, isPublic: false, session: null };
    }

    const session = await db.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt) {
      // Clean up expired session
      if (session) {
        await db.session.delete({ where: { id: sessionToken } }).catch(() => {});
      }
      return { authenticated: false, isAdmin: false, isPublic: false, session: null };
    }

    return {
      authenticated: true,
      isAdmin: session.role === 'admin',
      isPublic: session.role === 'public',
      session: {
        id: session.id,
        userId: session.userId,
        role: session.role,
        user: session.user,
      },
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false, isAdmin: false, isPublic: false, session: null };
  }
}

/**
 * Require admin authentication - returns error response if not admin
 */
export async function requireAdmin(): Promise<AuthResult | { error: boolean; response: Response }> {
  const auth = await getAuth();
  
  if (!auth.authenticated) {
    return {
      error: true,
      response: Response.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      ),
    };
  }

  if (!auth.isAdmin) {
    return {
      error: true,
      response: Response.json(
        { success: false, error: 'Tidak memiliki akses admin' },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Require any authentication (admin or public) - returns error response if not authenticated
 */
export async function requireAuth(): Promise<AuthResult | { error: boolean; response: Response }> {
  const auth = await getAuth();
  
  if (!auth.authenticated) {
    return {
      error: true,
      response: Response.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      ),
    };
  }

  return auth;
}
