import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// POST - Import Excel file with population data
export async function POST(request: Request) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'File harus berformat Excel (.xlsx atau .xls)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: 'Sheet tidak ditemukan dalam file' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON array for easier processing
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    
    // Results tracking
    const results = {
      total: 0,
      success: 0,
      skipped: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Get all existing NIKs for duplicate check
    const existingNIKs = new Set(
      (await db.penduduk.findMany({
        select: { nik: true },
      })).map(p => p.nik)
    );

    // Find the header row (contains "NKK", "NIK", "NAMA" etc)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (row && String(row[0]).toString().toUpperCase() === 'NKK') {
        headerRowIndex = i;
        break;
      }
    }

    // If header not found, assume it's row 2 (index 2)
    const dataStartRow = headerRowIndex >= 0 ? headerRowIndex + 2 : 4;

    // Process each row starting from data start row
    for (let i = dataStartRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length < 3) continue;
      
      results.total++;
      
      try {
        // Extract values based on observed format:
        // 0: NKK, 1: NIK, 2: NAMA, 3: SHDK, 4: L (gender), 5: P (gender), 
        // 6: TEMPAT, 7: TTL, 8: UMUR, 9: ALAMAT, 10: RT, 11: RW, 12: AYAH, 13: IBU, 14: PENDIDIKAN
        
        const nkk = String(row[0] || '').trim();
        const nik = String(row[1] || '').trim();
        const nama = String(row[2] || '').trim();
        const shdk = String(row[3] || '').trim();
        
        // Gender: check column 4 for L, column 5 for P
        const jkL = String(row[4] || '').trim().toUpperCase();
        const jkP = String(row[5] || '').trim().toUpperCase();
        let gender = '';
        if (jkL === 'L' || jkL === '1') {
          gender = 'L';
        } else if (jkP === 'P' || jkP === '1') {
          gender = 'P';
        } else if (row[4] !== undefined && row[5] === undefined) {
          // If only column 4 has value
          gender = jkL === 'P' ? 'P' : 'L';
        } else if (row[4] === undefined && row[5] !== undefined) {
          gender = 'P';
        }
        
        const tempatLahir = String(row[6] || '').trim();
        const ttlValue = row[7];
        const alamat = String(row[9] || '').trim();
        const rt = String(row[10] || '001').trim().padStart(3, '0');
        const rw = String(row[11] || '001').trim().padStart(3, '0');
        const namaAyah = String(row[12] || '').trim() || null;
        const namaIbu = String(row[13] || '').trim() || null;
        const pendidikan = String(row[14] || '').trim() || null;

        // Skip empty rows (rows without NIK)
        if (!nik || nik === '' || nik === 'undefined' || nik === 'null' || nik.length < 10) {
          results.skipped++;
          continue;
        }

        // Validate NIK (16 digits)
        const cleanNik = nik.replace(/\D/g, '');
        if (cleanNik.length !== 16) {
          results.errors.push({ row: i + 1, error: `NIK tidak valid (harus 16 digit): ${nik}` });
          continue;
        }

        // Validate gender
        if (!gender) {
          results.errors.push({ row: i + 1, error: `Jenis kelamin tidak valid` });
          continue;
        }

        // Parse TTL (could be Date object, string, or Excel serial number)
        let tanggalLahir = '';
        if (ttlValue instanceof Date) {
          tanggalLahir = ttlValue.toISOString().split('T')[0];
        } else if (typeof ttlValue === 'number') {
          // Excel date serial number
          try {
            const date = XLSX.SSF.parse_date_code(ttlValue);
            if (date) {
              tanggalLahir = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            }
          } catch {
            tanggalLahir = String(ttlValue);
          }
        } else if (typeof ttlValue === 'string') {
          // Try to parse string date
          const dateStr = ttlValue.trim();
          // Handle format like "1983-11-08 00:00:00"
          if (dateStr.includes('T') || dateStr.includes(' ')) {
            tanggalLahir = dateStr.split('T')[0].split(' ')[0];
          } else {
            tanggalLahir = dateStr;
          }
        }

        // Calculate age from birth date if not provided
        let umur = 0;
        if (tanggalLahir) {
          const birthDate = new Date(tanggalLahir);
          const today = new Date();
          umur = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            umur--;
          }
        }

        // Check for duplicate
        if (existingNIKs.has(cleanNik)) {
          results.skipped++;
          continue;
        }

        // Create penduduk record
        await db.penduduk.create({
          data: {
            nkk: nkk || cleanNik.substring(0, 16),
            nik: cleanNik,
            nama: nama || '-',
            shdk: shdk || 'Lainnya',
            gender,
            tempatLahir: tempatLahir || '-',
            tanggalLahir: tanggalLahir || '1970-01-01',
            umur: umur > 0 ? umur : 0,
            alamat: alamat || '-',
            rt,
            rw,
            namaAyah,
            namaIbu,
            pendidikan,
            status: 'aktif',
          },
        });

        existingNIKs.add(cleanNik); // Prevent duplicates within the same file
        results.success++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ row: i + 1, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${results.success} data berhasil, ${results.skipped} dilewati, ${results.errors.length} error`,
      results,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengimpor data: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
