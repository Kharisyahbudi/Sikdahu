import { db } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get application settings
export async function GET() {
  try {
    const authCheck = await requireAuth();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    // Get settings (there should only be one record)
    let settings = await db.settings.findFirst();

    // Create default settings if not exists
    if (!settings) {
      settings = await db.settings.create({
        data: {},
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil pengaturan' },
      { status: 500 }
    );
  }
}

// PUT - Update application settings
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await requireAdmin();
    if ('error' in authCheck) {
      return authCheck.response;
    }

    const body = await request.json();
    const {
      kepalaDesa,
      sekretarisDesa,
      kasiPemerintahan,
      themeColor,
      themeMode,
      desaName,
      kecamatanName,
      kabupatenName,
      alamatDesa,
      logo,
    } = body;

    // Get existing settings
    let settings = await db.settings.findFirst();

    if (!settings) {
      // Create new settings
      settings = await db.settings.create({
        data: {
          kepalaDesa: kepalaDesa || 'ENJANG HELIGAOS',
          sekretarisDesa: sekretarisDesa || 'WAWAN HERMANSYAH',
          kasiPemerintahan: kasiPemerintahan || 'M. ARIEF KHARISYAHBUDI',
          themeColor: themeColor || '#00d4aa',
          themeMode: themeMode || 'dark',
          desaName: desaName || 'CIDAHU',
          kecamatanName: kecamatanName || 'PASAWAHAN',
          kabupatenName: kabupatenName || 'PURWAKARTA',
          alamatDesa: alamatDesa || 'Jl. Kholik Winata I Desa Cidahu Kec. Pasawahan - Purwakarta (41172)',
        },
      });
    } else {
      // Update existing settings
      settings = await db.settings.update({
        where: { id: settings.id },
        data: {
          ...(kepalaDesa !== undefined && { kepalaDesa }),
          ...(sekretarisDesa !== undefined && { sekretarisDesa }),
          ...(kasiPemerintahan !== undefined && { kasiPemerintahan }),
          ...(themeColor !== undefined && { themeColor }),
          ...(themeMode !== undefined && { themeMode }),
          ...(desaName !== undefined && { desaName }),
          ...(kecamatanName !== undefined && { kecamatanName }),
          ...(kabupatenName !== undefined && { kabupatenName }),
          ...(alamatDesa !== undefined && { alamatDesa }),
          ...(logo !== undefined && { logo }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil disimpan',
      data: settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan pengaturan' },
      { status: 500 }
    );
  }
}
