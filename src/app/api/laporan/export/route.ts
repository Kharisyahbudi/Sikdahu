import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const MONTHS = [
  '', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

// GET - Export monthly report to Excel
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const bulan = parseInt(searchParams.get('bulan') || String(new Date().getMonth() + 1));
    const tahun = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()));

    // Get settings
    const settings = await db.settings.findFirst();

    // Get reports for the specified month/year
    const reports = await db.laporanBulanan.findMany({
      where: { bulan, tahun },
      orderBy: { rt: 'asc' },
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const wsData: (string | number | null)[][] = [];

    // Row 1: Title
    wsData.push([`LAPORAN REGISTRASI KEPENDUDUKAN DESA ${settings?.desaName || 'CIDAHU'}`]);

    // Row 2: Month/Year
    wsData.push([`BULAN : ${MONTHS[bulan]} ${tahun}`]);

    // Row 3: Empty
    wsData.push([]);

    // Row 4: Main headers (row 3 in Excel, index 3 in array)
    wsData.push([
      'NO.', 'RUKUN TETANGGA', 'JUMLAH PENDUDUK BULAN LALU', '', '',
      'BULAN INI', '', '', '', '', '', '', '', '', '', '',
      'JUMLAH PENDUDUK S/D BULAN INI', '', '',
      'JUMLAH KK', 'JUMLAH WAJIB KTP',
      'JUMLAH YANG SUDAH MEMILIKI', '',
      'JUMLAH YANG BELUM MEMILIKI', ''
    ]);

    // Row 5: Sub headers (LAHIR, MATI, DATANG, PINDAH)
    wsData.push([
      '', '', 'L', 'P', 'JML',
      'LAHIR', '', '', 'MATI', '', '', 'DATANG', '', '', 'PINDAH', '', '',
      'L', 'P', 'JML',
      '', '', 'KTP', 'KK', 'KTP', 'KK'
    ]);

    // Row 6: L/P/JML headers
    wsData.push([
      '', '', '', '', '',
      'L', 'P', 'JML', 'L', 'P', 'JML', 'L', 'P', 'JML', 'L', 'P', 'JML',
      '', '', '', '', '', '', '', '', ''
    ]);

    // Data rows
    let no = 1;
    let totalJumlahLaluL = 0, totalJumlahLaluP = 0, totalJumlahLaluTotal = 0;
    let totalLahirL = 0, totalLahirP = 0, totalLahirTotal = 0;
    let totalMatiL = 0, totalMatiP = 0, totalMatiTotal = 0;
    let totalDatangL = 0, totalDatangP = 0, totalDatangTotal = 0;
    let totalPindahL = 0, totalPindahP = 0, totalPindahTotal = 0;
    let totalJumlahIniL = 0, totalJumlahIniP = 0, totalJumlahIniTotal = 0;
    let totalKK = 0, totalWajibKTP = 0, totalPunyaKTP = 0, totalPunyaKK = 0;
    let totalBelumKTP = 0, totalBelumKK = 0;

    for (const report of reports) {
      wsData.push([
        no++,
        `RT. ${report.rt}`,
        report.jumlahLaluL,
        report.jumlahLaluP,
        report.jumlahLaluTotal || (report.jumlahLaluL + report.jumlahLaluP),
        report.lahirL,
        report.lahirP,
        report.lahirTotal || (report.lahirL + report.lahirP),
        report.matiL,
        report.matiP,
        report.matiTotal || (report.matiL + report.matiP),
        report.datangL,
        report.datangP,
        report.datangTotal || (report.datangL + report.datangP),
        report.pindahL,
        report.pindahP,
        report.pindahTotal || (report.pindahL + report.pindahP),
        report.jumlahIniL,
        report.jumlahIniP,
        report.jumlahIniTotal || (report.jumlahIniL + report.jumlahIniP),
        report.jumlahKK,
        report.wajibKTP,
        report.punyaKTP,
        report.punyaKK,
        report.belumKTP || (report.wajibKTP - report.punyaKTP),
        report.belumKK || (report.jumlahKK - report.punyaKK),
      ]);

      totalJumlahLaluL += report.jumlahLaluL;
      totalJumlahLaluP += report.jumlahLaluP;
      totalJumlahLaluTotal += report.jumlahLaluTotal || (report.jumlahLaluL + report.jumlahLaluP);
      totalLahirL += report.lahirL;
      totalLahirP += report.lahirP;
      totalLahirTotal += report.lahirTotal || (report.lahirL + report.lahirP);
      totalMatiL += report.matiL;
      totalMatiP += report.matiP;
      totalMatiTotal += report.matiTotal || (report.matiL + report.matiP);
      totalDatangL += report.datangL;
      totalDatangP += report.datangP;
      totalDatangTotal += report.datangTotal || (report.datangL + report.datangP);
      totalPindahL += report.pindahL;
      totalPindahP += report.pindahP;
      totalPindahTotal += report.pindahTotal || (report.pindahL + report.pindahP);
      totalJumlahIniL += report.jumlahIniL;
      totalJumlahIniP += report.jumlahIniP;
      totalJumlahIniTotal += report.jumlahIniTotal || (report.jumlahIniL + report.jumlahIniP);
      totalKK += report.jumlahKK;
      totalWajibKTP += report.wajibKTP;
      totalPunyaKTP += report.punyaKTP;
      totalPunyaKK += report.punyaKK;
      totalBelumKTP += report.belumKTP || (report.wajibKTP - report.punyaKTP);
      totalBelumKK += report.belumKK || (report.jumlahKK - report.punyaKK);
    }

    // Total row
    wsData.push([
      '', 'JUMLAH',
      totalJumlahLaluL, totalJumlahLaluP, totalJumlahLaluTotal,
      totalLahirL, totalLahirP, totalLahirTotal,
      totalMatiL, totalMatiP, totalMatiTotal,
      totalDatangL, totalDatangP, totalDatangTotal,
      totalPindahL, totalPindahP, totalPindahTotal,
      totalJumlahIniL, totalJumlahIniP, totalJumlahIniTotal,
      totalKK, totalWajibKTP,
      totalPunyaKTP, totalPunyaKK,
      totalBelumKTP, totalBelumKK
    ]);

    // Empty rows
    wsData.push([]);
    wsData.push([]);

    // Signature section
    const dateStr = `${settings?.desaName || 'CIDAHU'}, ${String(new Date().getDate()).padStart(2, '0')} ${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;
    wsData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', dateStr]);

    wsData.push(['', 'Kasi Pemerintahan,', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'a.n KEPALA DESA,']);

    wsData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Sekretaris Desa']);

    wsData.push([]);
    wsData.push([]);
    wsData.push([]);

    wsData.push(['', settings?.kasiPemerintahan || 'M. ARIEF KHARISYAHBUDI', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', settings?.sekretarisDesa || 'WAWAN HERMANSYAH']);

    wsData.push([]);

    wsData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', `Kepala Desa ${settings?.desaName || 'CIDAHU'}`]);

    wsData.push([]);
    wsData.push([]);
    wsData.push([]);

    wsData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', settings?.kepalaDesa || 'ENJANG HELIGAOS']);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },   // NO
      { wch: 15 },  // RT
      { wch: 8 }, { wch: 8 }, { wch: 8 },  // Jumlah Lalu
      { wch: 6 }, { wch: 6 }, { wch: 6 },  // Lahir
      { wch: 6 }, { wch: 6 }, { wch: 6 },  // Mati
      { wch: 6 }, { wch: 6 }, { wch: 6 },  // Datang
      { wch: 6 }, { wch: 6 }, { wch: 6 },  // Pindah
      { wch: 8 }, { wch: 8 }, { wch: 8 },  // Jumlah Ini
      { wch: 10 }, // KK
      { wch: 12 }, // Wajib KTP
      { wch: 8 }, { wch: 8 },  // Punya
      { wch: 8 }, { wch: 8 },  // Belum
    ];

    // Merge cells for headers
    worksheet['!merges'] = [
      // Title
      { s: { r: 0, c: 0 }, e: { r: 0, c: 25 } },
      // Month
      { s: { r: 1, c: 0 }, e: { r: 1, c: 25 } },
      // Jumlah Penduduk Bulan Lalu
      { s: { r: 3, c: 2 }, e: { r: 3, c: 4 } },
      // Bulan Ini (main)
      { s: { r: 3, c: 5 }, e: { r: 3, c: 16 } },
      // Lahir
      { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } },
      // Mati
      { s: { r: 4, c: 8 }, e: { r: 4, c: 10 } },
      // Datang
      { s: { r: 4, c: 11 }, e: { r: 4, c: 13 } },
      // Pindah
      { s: { r: 4, c: 14 }, e: { r: 4, c: 16 } },
      // Jumlah Penduduk S/D Bulan Ini
      { s: { r: 3, c: 17 }, e: { r: 3, c: 19 } },
      // Jumlah Yang Sudah Memiliki
      { s: { r: 3, c: 22 }, e: { r: 3, c: 23 } },
      // Jumlah Yang Belum Memiliki
      { s: { r: 3, c: 24 }, e: { r: 3, c: 25 } },
      // NO and RT spanning 3 rows
      { s: { r: 3, c: 0 }, e: { r: 5, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 5, c: 1 } },
      // L, P, JML for Jumlah Lalu
      { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
      { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },
      { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },
      // L, P, JML for Jumlah Ini
      { s: { r: 4, c: 17 }, e: { r: 5, c: 17 } },
      { s: { r: 4, c: 18 }, e: { r: 5, c: 18 } },
      { s: { r: 4, c: 19 }, e: { r: 5, c: 19 } },
      // Jumlah KK
      { s: { r: 3, c: 20 }, e: { r: 5, c: 20 } },
      // Wajib KTP
      { s: { r: 3, c: 21 }, e: { r: 5, c: 21 } },
      // Punya KTP, KK
      { s: { r: 4, c: 22 }, e: { r: 5, c: 22 } },
      { s: { r: 4, c: 23 }, e: { r: 5, c: 23 } },
      // Belum KTP, KK
      { s: { r: 4, c: 24 }, e: { r: 5, c: 24 } },
      { s: { r: 4, c: 25 }, e: { r: 5, c: 25 } },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Laporan_Kependudukan_${MONTHS[bulan]}_${tahun}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export laporan error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengekspor laporan' },
      { status: 500 }
    );
  }
}
