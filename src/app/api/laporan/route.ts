import { db } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get report for specific month/year with RT breakdown
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const bulan = parseInt(searchParams.get('bulan') || String(new Date().getMonth() + 1));
    const tahun = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()));

    // Get all unique RTs
    const allPenduduk = await db.penduduk.findMany({
      select: { rt: true, rw: true },
      where: { status: 'aktif' },
    });
    const uniqueRTs = [...new Set(allPenduduk.map(p => p.rt))].sort();

    // Get reports for the specified month/year
    const reports = await db.laporanBulanan.findMany({
      where: { bulan, tahun },
      orderBy: { rt: 'asc' },
    });

    // Get events for the specified month/year
    const events = await db.eventKependudukan.findMany({
      where: { bulan, tahun },
    });

    // Aggregate events by RT and type
    const eventsByRT: Record<string, Record<string, { L: number; P: number }>> = {};
    for (const event of events) {
      const rt = event.rt || '000';
      const jenis = event.jenis;
      const gender = event.gender || 'L';

      if (!eventsByRT[rt]) {
        eventsByRT[rt] = {
          lahir: { L: 0, P: 0 },
          mati: { L: 0, P: 0 },
          datang: { L: 0, P: 0 },
          pindah: { L: 0, P: 0 },
        };
      }

      if (eventsByRT[rt][jenis]) {
        eventsByRT[rt][jenis][gender as 'L' | 'P']++;
      }
    }

    // Build report data for all RTs
    const reportData = uniqueRTs.map(rt => {
      const existingReport = reports.find(r => r.rt === rt);
      const rtEvents = eventsByRT[rt] || {
        lahir: { L: 0, P: 0 },
        mati: { L: 0, P: 0 },
        datang: { L: 0, P: 0 },
        pindah: { L: 0, P: 0 },
      };

      if (existingReport) {
        return {
          ...existingReport,
          eventsFromDB: rtEvents,
        };
      }

      // Create default report structure
      return {
        id: null,
        bulan,
        tahun,
        rt,
        jumlahLaluL: 0,
        jumlahLaluP: 0,
        jumlahLaluTotal: 0,
        lahirL: rtEvents.lahir.L,
        lahirP: rtEvents.lahir.P,
        lahirTotal: rtEvents.lahir.L + rtEvents.lahir.P,
        matiL: rtEvents.mati.L,
        matiP: rtEvents.mati.P,
        matiTotal: rtEvents.mati.L + rtEvents.mati.P,
        datangL: rtEvents.datang.L,
        datangP: rtEvents.datang.P,
        datangTotal: rtEvents.datang.L + rtEvents.datang.P,
        pindahL: rtEvents.pindah.L,
        pindahP: rtEvents.pindah.P,
        pindahTotal: rtEvents.pindah.L + rtEvents.pindah.P,
        jumlahIniL: 0,
        jumlahIniP: 0,
        jumlahIniTotal: 0,
        jumlahKK: 0,
        wajibKTP: 0,
        punyaKTP: 0,
        punyaKK: 0,
        belumKTP: 0,
        belumKK: 0,
        tanggalLaporan: null,
        eventsFromDB: rtEvents,
      };
    });

    // Calculate totals
    const totals = {
      jumlahLaluL: reportData.reduce((sum, r) => sum + r.jumlahLaluL, 0),
      jumlahLaluP: reportData.reduce((sum, r) => sum + r.jumlahLaluP, 0),
      jumlahLaluTotal: reportData.reduce((sum, r) => sum + r.jumlahLaluTotal, 0),
      lahirL: reportData.reduce((sum, r) => sum + r.lahirL, 0),
      lahirP: reportData.reduce((sum, r) => sum + r.lahirP, 0),
      lahirTotal: reportData.reduce((sum, r) => sum + r.lahirTotal, 0),
      matiL: reportData.reduce((sum, r) => sum + r.matiL, 0),
      matiP: reportData.reduce((sum, r) => sum + r.matiP, 0),
      matiTotal: reportData.reduce((sum, r) => sum + r.matiTotal, 0),
      datangL: reportData.reduce((sum, r) => sum + r.datangL, 0),
      datangP: reportData.reduce((sum, r) => sum + r.datangP, 0),
      datangTotal: reportData.reduce((sum, r) => sum + r.datangTotal, 0),
      pindahL: reportData.reduce((sum, r) => sum + r.pindahL, 0),
      pindahP: reportData.reduce((sum, r) => sum + r.pindahP, 0),
      pindahTotal: reportData.reduce((sum, r) => sum + r.pindahTotal, 0),
      jumlahIniL: reportData.reduce((sum, r) => sum + r.jumlahIniL, 0),
      jumlahIniP: reportData.reduce((sum, r) => sum + r.jumlahIniP, 0),
      jumlahIniTotal: reportData.reduce((sum, r) => sum + r.jumlahIniTotal, 0),
      jumlahKK: reportData.reduce((sum, r) => sum + r.jumlahKK, 0),
      wajibKTP: reportData.reduce((sum, r) => sum + r.wajibKTP, 0),
      punyaKTP: reportData.reduce((sum, r) => sum + r.punyaKTP, 0),
      punyaKK: reportData.reduce((sum, r) => sum + r.punyaKK, 0),
      belumKTP: reportData.reduce((sum, r) => sum + r.belumKTP, 0),
      belumKK: reportData.reduce((sum, r) => sum + r.belumKK, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        bulan,
        tahun,
        reports: reportData,
        totals,
        rts: uniqueRTs,
      },
    });
  } catch (error) {
    console.error('Get laporan error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data laporan' },
      { status: 500 }
    );
  }
}

// POST - Update report data for specific RT/month/year
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const body = await request.json();
    const {
      bulan,
      tahun,
      rt,
      jumlahLaluL,
      jumlahLaluP,
      lahirL,
      lahirP,
      matiL,
      matiP,
      datangL,
      datangP,
      pindahL,
      pindahP,
      jumlahIniL,
      jumlahIniP,
      jumlahKK,
      wajibKTP,
      punyaKTP,
      punyaKK,
      tanggalLaporan,
    } = body;

    // Validate required fields
    if (!bulan || !tahun || !rt) {
      return NextResponse.json(
        { success: false, error: 'Bulan, tahun, dan RT wajib diisi' },
        { status: 400 }
      );
    }

    // Calculate totals
    const jumlahLaluTotal = (jumlahLaluL || 0) + (jumlahLaluP || 0);
    const lahirTotal = (lahirL || 0) + (lahirP || 0);
    const matiTotal = (matiL || 0) + (matiP || 0);
    const datangTotal = (datangL || 0) + (datangP || 0);
    const pindahTotal = (pindahL || 0) + (pindahP || 0);
    const jumlahIniTotal = (jumlahIniL || 0) + (jumlahIniP || 0);
    const belumKTP = (wajibKTP || 0) - (punyaKTP || 0);
    const belumKK = (jumlahKK || 0) - (punyaKK || 0);

    // Upsert report
    const report = await db.laporanBulanan.upsert({
      where: {
        bulan_tahun_rt: {
          bulan,
          tahun,
          rt,
        },
      },
      update: {
        jumlahLaluL: jumlahLaluL || 0,
        jumlahLaluP: jumlahLaluP || 0,
        jumlahLaluTotal,
        lahirL: lahirL || 0,
        lahirP: lahirP || 0,
        lahirTotal,
        matiL: matiL || 0,
        matiP: matiP || 0,
        matiTotal,
        datangL: datangL || 0,
        datangP: datangP || 0,
        datangTotal,
        pindahL: pindahL || 0,
        pindahP: pindahP || 0,
        pindahTotal,
        jumlahIniL: jumlahIniL || 0,
        jumlahIniP: jumlahIniP || 0,
        jumlahIniTotal,
        jumlahKK: jumlahKK || 0,
        wajibKTP: wajibKTP || 0,
        punyaKTP: punyaKTP || 0,
        punyaKK: punyaKK || 0,
        belumKTP,
        belumKK,
        tanggalLaporan: tanggalLaporan || null,
      },
      create: {
        bulan,
        tahun,
        rt,
        jumlahLaluL: jumlahLaluL || 0,
        jumlahLaluP: jumlahLaluP || 0,
        jumlahLaluTotal,
        lahirL: lahirL || 0,
        lahirP: lahirP || 0,
        lahirTotal,
        matiL: matiL || 0,
        matiP: matiP || 0,
        matiTotal,
        datangL: datangL || 0,
        datangP: datangP || 0,
        datangTotal,
        pindahL: pindahL || 0,
        pindahP: pindahP || 0,
        pindahTotal,
        jumlahIniL: jumlahIniL || 0,
        jumlahIniP: jumlahIniP || 0,
        jumlahIniTotal,
        jumlahKK: jumlahKK || 0,
        wajibKTP: wajibKTP || 0,
        punyaKTP: punyaKTP || 0,
        punyaKK: punyaKK || 0,
        belumKTP,
        belumKK,
        tanggalLaporan: tanggalLaporan || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data laporan berhasil disimpan',
      data: report,
    });
  } catch (error) {
    console.error('Update laporan error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan data laporan' },
      { status: 500 }
    );
  }
}
