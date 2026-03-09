import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to calculate age from birthdate
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}

// Helper to check authentication and role
async function getAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    return { authenticated: false, isAdmin: false, session: null };
  }

  const session = await db.session.findUnique({
    where: { id: sessionToken },
    include: { user: true },
  });

  if (!session || new Date() > session.expiresAt) {
    return { authenticated: false, isAdmin: false, session: null };
  }

  return {
    authenticated: true,
    isAdmin: session.role === 'admin',
    session,
  };
}

// GET - Get single penduduk by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const penduduk = await db.penduduk.findUnique({
      where: { id },
    });

    if (!penduduk) {
      return NextResponse.json(
        { error: 'Data penduduk tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: penduduk });
  } catch (error) {
    console.error('Get penduduk error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data penduduk' },
      { status: 500 }
    );
  }
}

// PUT - Update penduduk
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth();

    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses untuk mengubah data' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      nkk,
      nik,
      nama,
      shdk,
      gender,
      tempatLahir,
      tanggalLahir,
      alamat,
      rt,
      rw,
      namaAyah,
      namaIbu,
      pendidikan,
    } = body;

    // Check if penduduk exists
    const existingPenduduk = await db.penduduk.findUnique({
      where: { id },
    });

    if (!existingPenduduk) {
      return NextResponse.json(
        { error: 'Data penduduk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validate NIK if changed
    if (nik !== existingPenduduk.nik) {
      const nikExists = await db.penduduk.findUnique({
        where: { nik },
      });
      if (nikExists) {
        return NextResponse.json(
          { error: 'NIK sudah digunakan oleh penduduk lain' },
          { status: 400 }
        );
      }
    }

    // Validate NIK and NKK length
    if (nkk.length !== 16 || !/^\d{16}$/.test(nkk)) {
      return NextResponse.json(
        { error: 'NKK harus 16 digit angka' },
        { status: 400 }
      );
    }

    if (nik.length !== 16 || !/^\d{16}$/.test(nik)) {
      return NextResponse.json(
        { error: 'NIK harus 16 digit angka' },
        { status: 400 }
      );
    }

    // Calculate age from birthdate
    const umur = calculateAge(tanggalLahir);

    const updatedPenduduk = await db.penduduk.update({
      where: { id },
      data: {
        nkk,
        nik,
        nama,
        shdk,
        gender,
        tempatLahir,
        tanggalLahir,
        umur,
        alamat,
        rt: rt.padStart(3, '0'),
        rw: rw.padStart(3, '0'),
        namaAyah: namaAyah || null,
        namaIbu: namaIbu || null,
        pendidikan,
      },
    });

    return NextResponse.json({ success: true, data: updatedPenduduk });
  } catch (error) {
    console.error('Update penduduk error:', error);
    return NextResponse.json(
      { error: 'Gagal mengubah data penduduk' },
      { status: 500 }
    );
  }
}

// DELETE - Delete penduduk
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth();

    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses untuk menghapus data' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if penduduk exists
    const existingPenduduk = await db.penduduk.findUnique({
      where: { id },
    });

    if (!existingPenduduk) {
      return NextResponse.json(
        { error: 'Data penduduk tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.penduduk.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete penduduk error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data penduduk' },
      { status: 500 }
    );
  }
}
