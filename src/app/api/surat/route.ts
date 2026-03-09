import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';

// Helper to format date to Indonesian
function formatDateIndonesian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Helper to get month name in Indonesian
function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1] || '';
}

// POST - Generate Surat Pengantar DOCX
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const body = await request.json();
    const { bulan, tahun } = body;

    const reportMonth = bulan || new Date().getMonth() + 1;
    const reportYear = tahun || new Date().getFullYear();

    // Get settings
    const settings = await db.settings.findFirst();

    // Get or create surat pengantar record
    let suratPengantar = await db.suratPengantar.findFirst({
      where: { bulanLaporan: String(reportMonth), tahunLaporan: reportYear },
    });

    // Generate nomor surat
    const today = new Date();
    const suratDate = formatDateIndonesian(today);
    const suratMonth = getMonthName(today.getMonth() + 1);
    const suratYear = today.getFullYear();

    let nomorSurat: string;
    if (suratPengantar) {
      nomorSurat = suratPengantar.nomor;
    } else {
      // Generate new nomor surat
      const count = await db.suratPengantar.count({
        where: { tahun: suratYear },
      });
      nomorSurat = `${String(count + 1).padStart(3, '0')}/SP/CIDAHU/${suratMonth}/${suratYear}`;
      
      suratPengantar = await db.suratPengantar.create({
        data: {
          nomor: nomorSurat,
          bulan: today.getMonth() + 1,
          tahun: suratYear,
          tanggalSurat: suratDate,
          bulanLaporan: String(reportMonth),
          tahunLaporan: reportYear,
        },
      });
    }

    // Get laporan data
    const laporan = await db.laporanBulanan.findMany({
      where: { bulan: reportMonth, tahun: reportYear },
      orderBy: { rt: 'asc' },
    });

    // Calculate totals
    const totals = {
      jumlahLaluL: laporan.reduce((sum, r) => sum + r.jumlahLaluL, 0),
      jumlahLaluP: laporan.reduce((sum, r) => sum + r.jumlahLaluP, 0),
      jumlahLaluTotal: laporan.reduce((sum, r) => sum + r.jumlahLaluTotal, 0),
      lahirL: laporan.reduce((sum, r) => sum + r.lahirL, 0),
      lahirP: laporan.reduce((sum, r) => sum + r.lahirP, 0),
      lahirTotal: laporan.reduce((sum, r) => sum + r.lahirTotal, 0),
      matiL: laporan.reduce((sum, r) => sum + r.matiL, 0),
      matiP: laporan.reduce((sum, r) => sum + r.matiP, 0),
      matiTotal: laporan.reduce((sum, r) => sum + r.matiTotal, 0),
      datangL: laporan.reduce((sum, r) => sum + r.datangL, 0),
      datangP: laporan.reduce((sum, r) => sum + r.datangP, 0),
      datangTotal: laporan.reduce((sum, r) => sum + r.datangTotal, 0),
      pindahL: laporan.reduce((sum, r) => sum + r.pindahL, 0),
      pindahP: laporan.reduce((sum, r) => sum + r.pindahP, 0),
      pindahTotal: laporan.reduce((sum, r) => sum + r.pindahTotal, 0),
      jumlahIniL: laporan.reduce((sum, r) => sum + r.jumlahIniL, 0),
      jumlahIniP: laporan.reduce((sum, r) => sum + r.jumlahIniP, 0),
      jumlahIniTotal: laporan.reduce((sum, r) => sum + r.jumlahIniTotal, 0),
      jumlahKK: laporan.reduce((sum, r) => sum + r.jumlahKK, 0),
      wajibKTP: laporan.reduce((sum, r) => sum + r.wajibKTP, 0),
      punyaKTP: laporan.reduce((sum, r) => sum + r.punyaKTP, 0),
      punyaKK: laporan.reduce((sum, r) => sum + r.punyaKK, 0),
      belumKTP: laporan.reduce((sum, r) => sum + r.belumKTP, 0),
      belumKK: laporan.reduce((sum, r) => sum + r.belumKK, 0),
    };

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Header - KOP SURAT
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `PEMERINTAH DESA ${settings?.desaName || 'CIDAHU'}`,
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `KECAMATAN ${settings?.kecamatanName || 'PASAWAHAN'}`,
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `KABUPATEN ${settings?.kabupatenName || 'PURWAKARTA'}`,
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: settings?.alamatDesa || 'Jl. Kholik Winata I Desa Cidahu Kec. Pasawahan - Purwakarta (41172)',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            text: '',
            border: {
              bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000' },
            },
          }),
          new Paragraph({ text: '' }),
          
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'SURAT PENGANTAR',
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Nomor: ${nomorSurat}`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          
          // Body
          new Paragraph({
            children: [
              new TextRun({
                text: `Yang bertanda tangan di bawah ini, Kepala Desa ${settings?.desaName || 'Cidahu'}, Kecamatan ${settings?.kecamatanName || 'Pasawahan'}, Kabupaten ${settings?.kabupatenName || 'PURWAKARTA'}, menerangkan bahwa data kependudukan bulan ${getMonthName(reportMonth)} tahun ${reportYear} adalah sebagai berikut:`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          
          // Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header row
              new TableRow({
                children: [
                  createTableCell('NO', true),
                  createTableCell('URAIAN', true),
                  createTableCell('L', true),
                  createTableCell('P', true),
                  createTableCell('JUMLAH', true),
                ],
              }),
              // Data rows
              createDataRow('1', 'Penduduk bulan lalu', totals.jumlahLaluL, totals.jumlahLaluP, totals.jumlahLaluTotal),
              createDataRow('2', 'Kelahiran bulan ini', totals.lahirL, totals.lahirP, totals.lahirTotal),
              createDataRow('3', 'Kematian bulan ini', totals.matiL, totals.matiP, totals.matiTotal),
              createDataRow('4', 'Kedatangan bulan ini', totals.datangL, totals.datangP, totals.datangTotal),
              createDataRow('5', 'Kepindahan bulan ini', totals.pindahL, totals.pindahP, totals.pindahTotal),
              createDataRow('6', 'Penduduk bulan ini', totals.jumlahIniL, totals.jumlahIniP, totals.jumlahIniTotal),
              createDataRow('7', 'Jumlah Kepala Keluarga', '-', '-', totals.jumlahKK),
              createDataRow('8', 'Wajib KTP', '-', '-', totals.wajibKTP),
              createDataRow('9', 'Punya KTP', '-', '-', totals.punyaKTP),
              createDataRow('10', 'Belum KTP', '-', '-', totals.belumKTP),
              createDataRow('11', 'Punya KK', '-', '-', totals.punyaKK),
              createDataRow('12', 'Belum KK', '-', '-', totals.belumKK),
            ],
          }),
          new Paragraph({ text: '' }),
          
          // Closing
          new Paragraph({
            children: [
              new TextRun({
                text: 'Demikian Surat Pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.',
                size: 24,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          
          // Signature section
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `${settings?.desaName || 'Cidahu'}, ${suratDate}`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Kepala Desa',
                size: 24,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: settings?.kepalaDesa || 'ENJANG HELIGAOS',
                bold: true,
                size: 24,
                underline: {},
              }),
            ],
          }),
        ],
      }],
    });

    // Generate document buffer
    const buffer = await doc.toBuffer();

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="surat_pengantar_${getMonthName(reportMonth)}_${reportYear}.docx"`,
      },
    });
  } catch (error) {
    console.error('Generate surat error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat surat pengantar: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// Helper function to create table cell
function createTableCell(text: string, isHeader = false): TableCell {
  return new TableCell({
    width: { size: text === 'NO' ? 10 : text === 'URAIAN' ? 40 : text === 'JUMLAH' ? 20 : 15, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: isHeader,
            size: 22,
          }),
        ],
      }),
    ],
  });
}

// Helper function to create data row
function createDataRow(no: string, uraian: string, l: number | string, p: number | string, jumlah: number | string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: no, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: uraian, size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(l), size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(p), size: 22 })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(jumlah), size: 22 })],
          }),
        ],
      }),
    ],
  });
}
