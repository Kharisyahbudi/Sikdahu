import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Helper to create a session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// GET - Check current session
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const session = await db.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt) {
      // Clean up expired session
      if (session) {
        await db.session.delete({ where: { id: sessionToken } });
      }
      return NextResponse.json({ authenticated: false, user: null });
    }

    const displayName = session.user?.name || 'Masyarakat';

    return NextResponse.json({
      authenticated: true,
      user: {
        name: displayName,
        role: session.role,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, publicAccess } = body;

    const cookieStore = await cookies();

    // Public access
    if (publicAccess) {
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION);

      // Create a public session (no user association)
      await db.session.create({
        data: {
          id: sessionToken,
          userId: null,
          role: 'public',
          expiresAt,
        },
      });

      cookieStore.set('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
      });

      return NextResponse.json({
        success: true,
        user: { name: 'Masyarakat', role: 'public' },
      });
    }

    // Admin login
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password diperlukan' },
        { status: 400 }
      );
    }

    const user = await db.adminUser.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    await db.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        role: 'admin',
        expiresAt,
      },
    });

    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    return NextResponse.json({
      success: true,
      user: { name: user.name, role: 'admin' },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// DELETE - Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (sessionToken) {
      await db.session.delete({ where: { id: sessionToken } }).catch(() => {});
    }

    cookieStore.delete('session_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true });
  }
}
