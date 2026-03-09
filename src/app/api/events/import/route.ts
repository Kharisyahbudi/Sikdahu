import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// POST - Import events (Lahir, Mati, Datang, Pindah) from Excel
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jenis = formData.get('jenis') as string; // 'lahir', 'mati', 'datang', 'pindah'
    const bulan = parseInt(formData.get('bulan') as string) || new Date().getMonth() + 1;
    const tahun = parseInt(formData.get('tahun') as string) || new Date().getFullYear();

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    if (!['lahir', 'mati', 'datang', 'pindah'].includes(jenis)) {
      return NextResponse.json(
        { success: false, error: 'Jenis event tidak valid' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    const results = {
      total: 0,
      success: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Find the header row (contains "NO.", "NIK", "NAMA")
    let dataStartRow = 5; // Default
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (row && String(row[0]).toString().toUpperCase() === 'NO.') {
        dataStartRow = i + 2; // Data starts after header row
        break;
      }
    }

    // Process each row
    for (let i = dataStartRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length < 3) continue;

      results.total++;

      try {
        // Extract values based on observed format:
        // 0: NO, 1: NIK, 2: NAMA, 3: L (gender), 4: P (gender), 
        // 5: TEMPAT TANGGAL LAHIR, 6: ALAMAT, 7: RT, 8: RW, 9: TANGGAL EVENT/KETERANGAN
        
        const nik = String(row[1] || '').trim();
        const nama = String(row[2] || '').trim();
        
        // Gender: check column 3 for L, column 4 for P
        const jkL = String(row[3] || '').trim().toUpperCase();
        const jkP = String(row[4] || '').trim().toUpperCase();
        let gender = '';
        if (jkL === 'L') {
          gender = 'L';
        } else if (jkP === 'P') {
          gender = 'P';
        } else if (row[3] !== undefined && row[4] === undefined) {
          gender = jkL === 'P' ? 'P' : 'L';
        }

        // Parse tempat tanggal lahir
        const ttlStr = String(row[5] || '').trim();
        let tempatLahir = '';
        let tanggalLahir = '';
        
        // Parse format like "PURWAKARTA, 18/01/1972" or "Purwakarta, 12/06/1945"
        const ttlMatch = ttlStr.match(/^(.+?),?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})$/i);
        if (ttlMatch) {
          tempatLahir = ttlMatch[1].trim();
          const dateStr = ttlMatch[2];
          // Parse date
          const parts = dateStr.split(/[\/\-]/);
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            let year = parts[2];
            if (year.length === 2) {
              year = parseInt(year) > 50 ? '19' + year : '20' + year;
            }
            tanggalLahir = `${year}-${month}-${day}`;
          }
        } else {
          tempatLahir = ttlStr;
        }

        const alamat = String(row[6] || '').trim();
        const rt = String(row[7] || '001').trim().padStart(3, '0');
        const rw = String(row[8] || '001').trim().padStart(3, '0');
        
        // Last column: tanggal event or keterangan
        const lastCol = String(row[9] || '').trim();
        let tanggalEvent = '';
        let keterangan = '';
        
        // Try to parse as date
        if (jenis === 'mati' || jenis === 'datang' || jenis === 'pindah') {
          // Parse tanggal like "11 Februari 2026" or "09 FEBRUARI 2026"
          const dateMatch = lastCol.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const monthName = dateMatch[2].toLowerCase();
            const year = dateMatch[3];
            const months: Record<string, string> = {
              'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
              'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
              'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
            };
            const month = months[monthName] || '01';
            tanggalEvent = `${year}-${month}-${day}`;
          } else if (lastCol) {
            keterangan = lastCol;
          }
        } else {
          keterangan = lastCol;
        }

        // Skip if no name
        if (!nama) {
          results.errors.push({ row: i + 1, error: 'Nama tidak boleh kosong' });
          continue;
        }

        // Create event record
        await db.eventKependudukan.create({
          data: {
            jenis,
            nik: nik || null,
            nama,
            gender: gender || null,
            tempatLahir: tempatLahir || null,
            tanggalLahir: tanggalLahir || null,
            alamat: alamat || null,
            rt,
            rw,
            tanggalEvent: tanggalEvent || null,
            keterangan: keterangan || null,
            bulan,
            tahun,
          },
        });

        results.success++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ row: i + 1, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import ${jenis} selesai: ${results.success} data berhasil, ${results.errors.length} error`,
      results,
    });
  } catch (error) {
    console.error('Import events error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengimpor data event' },
      { status: 500 }
    );
  }
}
