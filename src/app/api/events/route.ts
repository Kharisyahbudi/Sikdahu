import { db } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - List events by month/year
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const bulan = parseInt(searchParams.get('bulan') || String(new Date().getMonth() + 1));
    const tahun = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()));
    const jenis = searchParams.get('jenis') || '';
    const rt = searchParams.get('rt') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: Record<string, unknown> = { bulan, tahun };
    
    if (jenis) {
      where.jenis = jenis;
    }
    
    if (rt) {
      where.rt = rt;
    }

    // Get total count
    const total = await db.eventKependudukan.count({ where });

    // Get paginated events
    const skip = (page - 1) * limit;
    const events = await db.eventKependudukan.findMany({
      where,
      include: {
        penduduk: {
          select: {
            nik: true,
            nama: true,
            gender: true,
            rt: true,
            rw: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data kejadian' },
      { status: 500 }
    );
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const body = await request.json();
    const {
      jenis,
      pendudukId,
      nama,
      nik,
      nkk,
      gender,
      tempatLahir,
      tanggalLahir,
      alamat,
      rt,
      rw,
      namaAyah,
      namaIbu,
      pendidikan,
      tanggalEvent,
      keterangan,
      bulan,
      tahun,
    } = body;

    // Validate required fields
    if (!jenis) {
      return NextResponse.json(
        { success: false, error: 'Jenis kejadian wajib diisi' },
        { status: 400 }
      );
    }

    if (!['lahir', 'mati', 'datang', 'pindah'].includes(jenis)) {
      return NextResponse.json(
        { success: false, error: 'Jenis kejadian tidak valid' },
        { status: 400 }
      );
    }

    // Set bulan and tahun from tanggalEvent or use current
    const eventDate = tanggalEvent ? new Date(tanggalEvent) : new Date();
    const eventBulan = bulan || eventDate.getMonth() + 1;
    const eventTahun = tahun || eventDate.getFullYear();

    // Create event
    const event = await db.eventKependudukan.create({
      data: {
        jenis,
        pendudukId: pendudukId || null,
        nama: nama || null,
        nik: nik || null,
        nkk: nkk || null,
        gender: gender || null,
        tempatLahir: tempatLahir || null,
        tanggalLahir: tanggalLahir || null,
        alamat: alamat || null,
        rt: rt || null,
        rw: rw || null,
        namaAyah: namaAyah || null,
        namaIbu: namaIbu || null,
        pendidikan: pendidikan || null,
        tanggalEvent: tanggalEvent || null,
        keterangan: keterangan || null,
        bulan: eventBulan,
        tahun: eventTahun,
      },
      include: {
        penduduk: true,
      },
    });

    // Update penduduk status for death or migration
    if (pendudukId && (jenis === 'mati' || jenis === 'pindah')) {
      await db.penduduk.update({
        where: { id: pendudukId },
        data: { status: jenis === 'mati' ? 'meninggal' : 'pindah' },
      });
    }

    // For birth or arrival, create new penduduk if not linked
    if ((jenis === 'lahir' || jenis === 'datang') && !pendudukId && nik && nama) {
      // Check if NIK already exists
      const existingPenduduk = await db.penduduk.findUnique({
        where: { nik },
      });

      if (!existingPenduduk) {
        await db.penduduk.create({
          data: {
            nkk: nkk || '',
            nik,
            nama,
            shdk: jenis === 'lahir' ? 'ANAK' : '-',
            gender: gender || 'L',
            tempatLahir: tempatLahir || '-',
            tanggalLahir: tanggalLahir || '-',
            umur: jenis === 'lahir' ? 0 : 0,
            alamat: alamat || '-',
            rt: rt || '000',
            rw: rw || '000',
            namaAyah: namaAyah || null,
            namaIbu: namaIbu || null,
            pendidikan: pendidikan || '-',
            status: 'aktif',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kejadian berhasil ditambahkan',
      data: event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan kejadian' },
      { status: 500 }
    );
  }
}

// PUT - Update event
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const body = await request.json();
    const {
      id,
      jenis,
      pendudukId,
      nama,
      nik,
      nkk,
      gender,
      tempatLahir,
      tanggalLahir,
      alamat,
      rt,
      rw,
      namaAyah,
      namaIbu,
      pendidikan,
      tanggalEvent,
      keterangan,
      bulan,
      tahun,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID kejadian wajib diisi' },
        { status: 400 }
      );
    }

    // Get existing event
    const existingEvent = await db.eventKependudukan.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Kejadian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Set bulan and tahun from tanggalEvent or use existing
    const eventDate = tanggalEvent ? new Date(tanggalEvent) : new Date();
    const eventBulan = bulan || eventDate.getMonth() + 1;
    const eventTahun = tahun || eventDate.getFullYear();

    // Update event
    const event = await db.eventKependudukan.update({
      where: { id },
      data: {
        jenis: jenis || existingEvent.jenis,
        pendudukId: pendudukId !== undefined ? pendudukId || null : existingEvent.pendudukId,
        nama: nama !== undefined ? nama || null : existingEvent.nama,
        nik: nik !== undefined ? nik || null : existingEvent.nik,
        nkk: nkk !== undefined ? nkk || null : existingEvent.nkk,
        gender: gender !== undefined ? gender || null : existingEvent.gender,
        tempatLahir: tempatLahir !== undefined ? tempatLahir || null : existingEvent.tempatLahir,
        tanggalLahir: tanggalLahir !== undefined ? tanggalLahir || null : existingEvent.tanggalLahir,
        alamat: alamat !== undefined ? alamat || null : existingEvent.alamat,
        rt: rt !== undefined ? rt || null : existingEvent.rt,
        rw: rw !== undefined ? rw || null : existingEvent.rw,
        namaAyah: namaAyah !== undefined ? namaAyah || null : existingEvent.namaAyah,
        namaIbu: namaIbu !== undefined ? namaIbu || null : existingEvent.namaIbu,
        pendidikan: pendidikan !== undefined ? pendidikan || null : existingEvent.pendidikan,
        tanggalEvent: tanggalEvent !== undefined ? tanggalEvent || null : existingEvent.tanggalEvent,
        keterangan: keterangan !== undefined ? keterangan || null : existingEvent.keterangan,
        bulan: eventBulan,
        tahun: eventTahun,
      },
      include: {
        penduduk: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kejadian berhasil diperbarui',
      data: event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui kejadian' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID kejadian wajib diisi' },
        { status: 400 }
      );
    }

    // Get event before deleting
    const event = await db.eventKependudukan.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Kejadian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete event
    await db.eventKependudukan.delete({
      where: { id },
    });

    // Restore penduduk status if it was death or migration
    if (event.pendudukId && (event.jenis === 'mati' || event.jenis === 'pindah')) {
      await db.penduduk.update({
        where: { id: event.pendudukId },
        data: { status: 'aktif' },
      }).catch(() => {}); // Ignore if penduduk doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: 'Kejadian berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus kejadian' },
      { status: 500 }
    );
  }
}
