import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Get previous month's report data
function getPreviousMonth(bulan: number, tahun: number): { bulan: number; tahun: number } {
  if (bulan === 1) {
    return { bulan: 12, tahun: tahun - 1 };
  }
  return { bulan: bulan - 1, tahun };
}

// POST - Initialize/generate monthly report from current data
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const body = await request.json();
    const bulan = body.bulan || new Date().getMonth() + 1;
    const tahun = body.tahun || new Date().getFullYear();

    // Get all unique RTs from active population
    const allPenduduk = await db.penduduk.findMany({
      select: { rt: true, rw: true, nkk: true, nik: true, umur: true, gender: true, status: true },
      where: { status: 'aktif' },
    });

    const uniqueRTs = [...new Set(allPenduduk.map(p => p.rt))].sort();

    // Get previous month's reports
    const prevMonth = getPreviousMonth(bulan, tahun);
    const prevReports = await db.laporanBulanan.findMany({
      where: { bulan: prevMonth.bulan, tahun: prevMonth.tahun },
    });
    const prevReportsByRT = new Map(prevReports.map(r => [r.rt, r]));

    // Get events for current month
    const events = await db.eventKependudukan.findMany({
      where: { bulan, tahun },
    });

    // Group events by RT and type
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

    // Calculate current population by RT
    const populationByRT: Record<string, { L: number; P: number; kk: Set<string>; wajibKTP: number }> = {};
    for (const p of allPenduduk) {
      const rt = p.rt;
      if (!populationByRT[rt]) {
        populationByRT[rt] = { L: 0, P: 0, kk: new Set(), wajibKTP: 0 };
      }
      
      if (p.gender === 'L') {
        populationByRT[rt].L++;
      } else {
        populationByRT[rt].P++;
      }
      
      populationByRT[rt].kk.add(p.nkk);
      
      // Wajib KTP: age >= 17
      if (p.umur >= 17) {
        populationByRT[rt].wajibKTP++;
      }
    }

    // Generate reports for each RT
    const results = {
      created: 0,
      updated: 0,
      errors: [] as { rt: string; error: string }[],
    };

    for (const rt of uniqueRTs) {
      try {
        const rtEvents = eventsByRT[rt] || {
          lahir: { L: 0, P: 0 },
          mati: { L: 0, P: 0 },
          datang: { L: 0, P: 0 },
          pindah: { L: 0, P: 0 },
        };
        
        const rtPopulation = populationByRT[rt] || { L: 0, P: 0, kk: new Set(), wajibKTP: 0 };
        const prevReport = prevReportsByRT.get(rt);

        // Calculate previous month's data (from previous report or 0)
        const jumlahLaluL = prevReport?.jumlahIniL || 0;
        const jumlahLaluP = prevReport?.jumlahIniP || 0;
        const jumlahLaluTotal = jumlahLaluL + jumlahLaluP;

        // Current events
        const lahirL = rtEvents.lahir.L;
        const lahirP = rtEvents.lahir.P;
        const lahirTotal = lahirL + lahirP;
        const matiL = rtEvents.mati.L;
        const matiP = rtEvents.mati.P;
        const matiTotal = matiL + matiP;
        const datangL = rtEvents.datang.L;
        const datangP = rtEvents.datang.P;
        const datangTotal = datangL + datangP;
        const pindahL = rtEvents.pindah.L;
        const pindahP = rtEvents.pindah.P;
        const pindahTotal = pindahL + pindahP;

        // Current population
        const jumlahIniL = rtPopulation.L;
        const jumlahIniP = rtPopulation.P;
        const jumlahIniTotal = jumlahIniL + jumlahIniP;

        // KK and KTP stats
        const jumlahKK = rtPopulation.kk.size;
        const wajibKTP = rtPopulation.wajibKTP;

        // Check if report already exists
        const existingReport = await db.laporanBulanan.findUnique({
          where: {
            bulan_tahun_rt: { bulan, tahun, rt },
          },
        });

        if (existingReport) {
          // Update existing report
          await db.laporanBulanan.update({
            where: { id: existingReport.id },
            data: {
              jumlahLaluL,
              jumlahLaluP,
              jumlahLaluTotal,
              lahirL, lahirP, lahirTotal,
              matiL, matiP, matiTotal,
              datangL, datangP, datangTotal,
              pindahL, pindahP, pindahTotal,
              jumlahIniL, jumlahIniP, jumlahIniTotal,
              jumlahKK,
              wajibKTP,
            },
          });
          results.updated++;
        } else {
          // Create new report
          await db.laporanBulanan.create({
            data: {
              bulan,
              tahun,
              rt,
              jumlahLaluL,
              jumlahLaluP,
              jumlahLaluTotal,
              lahirL, lahirP, lahirTotal,
              matiL, matiP, matiTotal,
              datangL, datangP, datangTotal,
              pindahL, pindahP, pindahTotal,
              jumlahIniL, jumlahIniP, jumlahIniTotal,
              jumlahKK,
              wajibKTP,
            },
          });
          results.created++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ rt, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Laporan berhasil diinisialisasi: ${results.created} dibuat, ${results.updated} diperbarui`,
      results,
      data: {
        bulan,
        tahun,
        totalRT: uniqueRTs.length,
      },
    });
  } catch (error) {
    console.error('Init laporan error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menginisialisasi laporan' },
      { status: 500 }
    );
  }
}
