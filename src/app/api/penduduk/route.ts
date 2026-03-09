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

// GET - List penduduk with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const filterRT = searchParams.get('rt') || '';
    const filterGender = searchParams.get('gender') || '';
    const filterEducation = searchParams.get('pendidikan') || '';
    const sortField = searchParams.get('sortField') || 'nama';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nik: { contains: search } },
        { nkk: { contains: search } },
        { alamat: { contains: search } },
      ];
    }

    if (filterRT) {
      where.rt = filterRT;
    }

    if (filterGender) {
      where.gender = filterGender;
    }

    if (filterEducation) {
      where.pendidikan = filterEducation;
    }

    // Get total count
    const total = await db.penduduk.count({ where });

    // Get paginated data
    const skip = (page - 1) * limit;
    const penduduk = await db.penduduk.findMany({
      where,
      orderBy: {
        [sortField]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Get unique RTs for filter
    const allPenduduk = await db.penduduk.findMany({
      select: { rt: true },
    });
    const uniqueRTs = [...new Set(allPenduduk.map((p) => p.rt))].sort();

    return NextResponse.json({
      data: penduduk,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        rts: uniqueRTs,
      },
    });
  } catch (error) {
    console.error('Get penduduk error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data penduduk' },
      { status: 500 }
    );
  }
}

// POST - Create new penduduk
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth();

    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses untuk menambah data' },
        { status: 403 }
      );
    }

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

    // Validate required fields
    if (!nkk || !nik || !nama || !shdk || !gender || !tempatLahir || 
        !tanggalLahir || !alamat || !rt || !rw || !pendidikan) {
      return NextResponse.json(
        { error: 'Semua field wajib harus diisi' },
        { status: 400 }
      );
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

    // Check if NIK already exists
    const existingPenduduk = await db.penduduk.findUnique({
      where: { nik },
    });

    if (existingPenduduk) {
      return NextResponse.json(
        { error: 'NIK sudah terdaftar' },
        { status: 400 }
      );
    }

    // Calculate age from birthdate
    const umur = calculateAge(tanggalLahir);

    const newPenduduk = await db.penduduk.create({
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

    return NextResponse.json({ success: true, data: newPenduduk });
  } catch (error) {
    console.error('Create penduduk error:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan data penduduk' },
      { status: 500 }
    );
  }
}
