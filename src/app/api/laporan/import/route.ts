import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// POST - Import monthly report from Excel
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bulan = parseInt(formData.get('bulan') as string) || new Date().getMonth() + 1;
    const tahun = parseInt(formData.get('tahun') as string) || new Date().getFullYear();

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    // Parse the data - looking for RT data rows
    // Format from Excel: NO, RT, JUMLAH PENDUDUK BULAN LALU (L,P,JML), BULAN INI (LAHIR, MATI, DATANG, PINDAH each with L,P,JML), etc.
    const reports: Array<{
      rt: string;
      jumlahLaluL: number;
      jumlahLaluP: number;
      lahirL: number;
      lahirP: number;
      matiL: number;
      matiP: number;
      datangL: number;
      datangP: number;
      pindahL: number;
      pindahP: number;
      jumlahIniL: number;
      jumlahIniP: number;
      jumlahKK: number;
      wajibKTP: number;
      punyaKTP: number;
      punyaKK: number;
    }> = [];

    // Data starts at row 7 (index 6) based on the sample Excel format
    for (let i = 6; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length < 5) continue;

      // Check if this is a data row (has RT number)
      const rtValue = row[1];
      if (!rtValue || String(rtValue).toString().toUpperCase().includes('JUMLAH')) continue;

      // Extract RT number from "RT. 001" format
      let rtNum = '';
      const rtStr = String(rtValue).toString();
      const rtMatch = rtStr.match(/RT\.?\s*(\d+)/i);
      if (rtMatch) {
        rtNum = rtMatch[1].padStart(3, '0');
      } else {
        // Try to extract just the number
        const numMatch = rtStr.match(/(\d+)/);
        if (numMatch) {
          rtNum = numMatch[1].padStart(3, '0');
        } else {
          continue;
        }
      }

      // Column mapping based on the Excel format:
      // 0: NO
      // 1: RT
      // 2: Jumlah Lalu L
      // 3: Jumlah Lalu P
      // 4: Jumlah Lalu Total
      // 5: Lahir L
      // 6: Lahir P
      // 7: Lahir Total
      // 8: Mati L
      // 9: Mati P
      // 10: Mati Total
      // 11: Datang L
      // 12: Datang P
      // 13: Datang Total
      // 14: Pindah L
      // 15: Pindah P
      // 16: Pindah Total
      // 17: Jumlah Ini L
      // 18: Jumlah Ini P
      // 19: Jumlah Ini Total
      // 20: Jumlah KK
      // 21: Jumlah Wajib KTP
      // 22: Punya KTP
      // 23: Punya KK
      // 24: Belum KTP
      // 25: Belum KK

      const toNumber = (val: unknown): number => {
        if (val === null || val === undefined || val === '') return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      };

      reports.push({
        rt: rtNum,
        jumlahLaluL: toNumber(row[2]),
        jumlahLaluP: toNumber(row[3]),
        lahirL: toNumber(row[5]),
        lahirP: toNumber(row[6]),
        matiL: toNumber(row[8]),
        matiP: toNumber(row[9]),
        datangL: toNumber(row[11]),
        datangP: toNumber(row[12]),
        pindahL: toNumber(row[14]),
        pindahP: toNumber(row[15]),
        jumlahIniL: toNumber(row[17]),
        jumlahIniP: toNumber(row[18]),
        jumlahKK: toNumber(row[20]),
        wajibKTP: toNumber(row[21]),
        punyaKTP: toNumber(row[22]),
        punyaKK: toNumber(row[23]),
      });
    }

    if (reports.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada data valid ditemukan dalam file' },
        { status: 400 }
      );
    }

    // Save to database
    let successCount = 0;
    for (const report of reports) {
      const jumlahLaluTotal = report.jumlahLaluL + report.jumlahLaluP;
      const lahirTotal = report.lahirL + report.lahirP;
      const matiTotal = report.matiL + report.matiP;
      const datangTotal = report.datangL + report.datangP;
      const pindahTotal = report.pindahL + report.pindahP;
      const jumlahIniTotal = report.jumlahIniL + report.jumlahIniP;
      const belumKTP = report.wajibKTP - report.punyaKTP;
      const belumKK = report.jumlahKK - report.punyaKK;

      await db.laporanBulanan.upsert({
        where: {
          bulan_tahun_rt: {
            bulan,
            tahun,
            rt: report.rt,
          },
        },
        update: {
          jumlahLaluL: report.jumlahLaluL,
          jumlahLaluP: report.jumlahLaluP,
          jumlahLaluTotal,
          lahirL: report.lahirL,
          lahirP: report.lahirP,
          lahirTotal,
          matiL: report.matiL,
          matiP: report.matiP,
          matiTotal,
          datangL: report.datangL,
          datangP: report.datangP,
          datangTotal,
          pindahL: report.pindahL,
          pindahP: report.pindahP,
          pindahTotal,
          jumlahIniL: report.jumlahIniL,
          jumlahIniP: report.jumlahIniP,
          jumlahIniTotal,
          jumlahKK: report.jumlahKK,
          wajibKTP: report.wajibKTP,
          punyaKTP: report.punyaKTP,
          punyaKK: report.punyaKK,
          belumKTP,
          belumKK,
        },
        create: {
          bulan,
          tahun,
          rt: report.rt,
          jumlahLaluL: report.jumlahLaluL,
          jumlahLaluP: report.jumlahLaluP,
          jumlahLaluTotal,
          lahirL: report.lahirL,
          lahirP: report.lahirP,
          lahirTotal,
          matiL: report.matiL,
          matiP: report.matiP,
          matiTotal,
          datangL: report.datangL,
          datangP: report.datangP,
          datangTotal,
          pindahL: report.pindahL,
          pindahP: report.pindahP,
          pindahTotal,
          jumlahIniL: report.jumlahIniL,
          jumlahIniP: report.jumlahIniP,
          jumlahIniTotal,
          jumlahKK: report.jumlahKK,
          wajibKTP: report.wajibKTP,
          punyaKTP: report.punyaKTP,
          punyaKK: report.punyaKK,
          belumKTP,
          belumKK,
        },
      });
      successCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${successCount} data laporan RT`,
      count: successCount,
    });
  } catch (error) {
    console.error('Import laporan error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengimpor file laporan' },
      { status: 500 }
    );
  }
}
