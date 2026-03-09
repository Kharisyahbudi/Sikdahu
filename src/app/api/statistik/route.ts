import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - Get population statistics
export async function GET() {
  try {
    // Get total population
    const total = await db.penduduk.count();

    // Get male count
    const male = await db.penduduk.count({
      where: { gender: 'L' },
    });

    // Get female count
    const female = await db.penduduk.count({
      where: { gender: 'P' },
    });

    // Get unique RTs count
    const allPenduduk = await db.penduduk.findMany({
      select: { rt: true },
    });
    const uniqueRTs = new Set(allPenduduk.map((p) => p.rt));

    // Get education distribution
    const educationDistribution = await db.penduduk.groupBy({
      by: ['pendidikan'],
      _count: {
        id: true,
      },
    });

    // Get SHDK distribution
    const shdkDistribution = await db.penduduk.groupBy({
      by: ['shdk'],
      _count: {
        id: true,
      },
    });

    // Get age distribution
    const allPendudukForAge = await db.penduduk.findMany({
      select: { tanggalLahir: true },
    });

    const now = new Date();
    const ageGroups: Record<string, number> = {
      '0-5': 0,
      '6-12': 0,
      '13-17': 0,
      '18-25': 0,
      '26-40': 0,
      '41-60': 0,
      '60+': 0,
    };

    allPendudukForAge.forEach((p) => {
      const birthDate = new Date(p.tanggalLahir);
      let age = now.getFullYear() - birthDate.getFullYear();
      const monthDiff = now.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age <= 5) ageGroups['0-5']++;
      else if (age <= 12) ageGroups['6-12']++;
      else if (age <= 17) ageGroups['13-17']++;
      else if (age <= 25) ageGroups['18-25']++;
      else if (age <= 40) ageGroups['26-40']++;
      else if (age <= 60) ageGroups['41-60']++;
      else ageGroups['60+']++;
    });

    return NextResponse.json({
      total,
      male,
      female,
      totalRT: uniqueRTs.size,
      rts: [...uniqueRTs].sort(),
      educationDistribution: educationDistribution.map((e) => ({
        pendidikan: e.pendidikan,
        count: e._count.id,
      })),
      shdkDistribution: shdkDistribution.map((s) => ({
        shdk: s.shdk,
        count: s._count.id,
      })),
      ageDistribution: Object.entries(ageGroups).map(([range, count]) => ({
        range,
        count,
      })),
    });
  } catch (error) {
    console.error('Get statistik error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data statistik' },
      { status: 500 }
    );
  }
}
