import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Get public application settings (no auth required)
export async function GET() {
  try {
    // Get settings (there should only be one record)
    let settings = await db.settings.findFirst();

    // Create default settings if not exists
    if (!settings) {
      settings = await db.settings.create({
        data: {},
      });
    }

    // Return only public-safe settings
    return NextResponse.json({
      success: true,
      data: {
        desaName: settings.desaName,
        kecamatanName: settings.kecamatanName,
        kabupatenName: settings.kabupatenName,
        alamatDesa: settings.alamatDesa,
        themeColor: settings.themeColor,
        themeMode: settings.themeMode,
        logo: settings.logo,
        kepalaDesa: settings.kepalaDesa,
      },
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil pengaturan' },
      { status: 500 }
    );
  }
}
