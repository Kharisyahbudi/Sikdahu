import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get current admin credentials info
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const session = await db.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });

    if (!session || !session.user || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Hanya admin yang dapat mengakses' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        username: session.user.username,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error('Get admin info error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mendapatkan info admin' },
      { status: 500 }
    );
  }
}

// PUT - Update admin credentials (name, username, password)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const session = await db.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });

    if (!session || !session.user || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Hanya admin yang dapat mengubah data' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, username, currentPassword, newPassword } = body;

    // Validate current password if changing username or password
    if (username || newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Password saat ini diperlukan untuk mengubah username atau password' },
          { status: 400 }
        );
      }

      if (session.user.password !== currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Password saat ini salah' },
          { status: 400 }
        );
      }
    }

    // Check if username already exists (if changing username)
    if (username && username !== session.user.username) {
      const existingUser = await db.adminUser.findUnique({
        where: { username },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Username sudah digunakan' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: { name?: string; username?: string; password?: string } = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (username && username.trim()) {
      updateData.username = username.trim();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password baru minimal 6 karakter' },
          { status: 400 }
        );
      }
      updateData.password = newPassword;
    }

    // Update admin
    const updatedUser = await db.adminUser.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: { name: updatedUser.name, role: 'admin' },
      data: {
        username: updatedUser.username,
        name: updatedUser.name,
      },
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengubah data admin' },
      { status: 500 }
    );
  }
}
