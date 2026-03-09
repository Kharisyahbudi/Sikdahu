import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Get public settings (no auth required) for login page
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

    // Return only public-facing settings
    return NextResponse.json({
      success: true,
      data: {
        desaName: settings.desaName,
        kecamatanName: settings.kecamatanName,
        kabupatenName: settings.kabupatenName,
        alamatDesa: settings.alamatDesa,
        logo: settings.logo,
        themeColor: settings.themeColor,
        themeMode: settings.themeMode,
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
