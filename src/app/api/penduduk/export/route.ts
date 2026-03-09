import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// GET - Export population data to Excel
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const filterRT = searchParams.get('rt') || '';
    const filterStatus = searchParams.get('status') || '';

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (filterRT) {
      where.rt = filterRT;
    }
    
    if (filterStatus) {
      where.status = filterStatus;
    }

    // Get all penduduk data
    const penduduk = await db.penduduk.findMany({
      where,
      orderBy: [
        { rt: 'asc' },
        { nama: 'asc' },
      ],
    });

    if (penduduk.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada data untuk diekspor' },
        { status: 400 }
      );
    }

    // Transform data for Excel
    const excelData = penduduk.map((p, index) => ({
      'NO': index + 1,
      'NKK': p.nkk,
      'NIK': p.nik,
      'NAMA': p.nama,
      'SHDK': p.shdk,
      'JENIS KELAMIN (L/P)': p.gender,
      'TEMPAT LAHIR': p.tempatLahir,
      'TANGGAL LAHIR': p.tanggalLahir,
      'UMUR': p.umur,
      'ALAMAT': p.alamat,
      'RT': p.rt,
      'RW': p.rw,
      'NAMA AYAH': p.namaAyah || '-',
      'NAMA IBU': p.namaIbu || '-',
      'PENDIDIKAN': p.pendidikan || '-',
      'STATUS': p.status.toUpperCase(),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // NO
      { wch: 20 },  // NKK
      { wch: 20 },  // NIK
      { wch: 30 },  // NAMA
      { wch: 15 },  // SHDK
      { wch: 10 },  // JENIS KELAMIN
      { wch: 15 },  // TEMPAT LAHIR
      { wch: 15 },  // TANGGAL LAHIR
      { wch: 8 },   // UMUR
      { wch: 30 },  // ALAMAT
      { wch: 5 },   // RT
      { wch: 5 },   // RW
      { wch: 25 },  // NAMA AYAH
      { wch: 25 },  // NAMA IBU
      { wch: 15 },  // PENDIDIKAN
      { wch: 10 },  // STATUS
    ];
    worksheet['!cols'] = columnWidths;

    // Add title row at the top
    const title = 'DATA PENDUDUK DESA CIDAHU';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Insert title rows
    XLSX.utils.sheet_add_aoa(worksheet, [[title], [`Diekspor pada: ${dateStr}`], []], { origin: 0 });
    
    // Shift the data down by 3 rows (title + date + empty row)
    const dataStartRow = 4;
    const newDataRange = XLSX.utils.encode_range({
      s: { r: dataStartRow, c: 0 },
      e: { r: dataStartRow + excelData.length - 1, c: Object.keys(excelData[0]).length - 1 }
    });
    worksheet['!ref'] = newDataRange;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Penduduk');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="data_penduduk_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengekspor data' },
      { status: 500 }
    );
  }
}
