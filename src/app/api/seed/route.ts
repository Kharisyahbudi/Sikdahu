import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Helper function to calculate age from birthdate
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}

const sampleDataRaw = [
  { nkk: "3201010101010001", nik: "3201010101010001", nama: "Ahmad Suryadi", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "1975-05-15", alamat: "Jl. Cidahu Indah No. 1", rt: "001", rw: "002", namaAyah: "Surya Wijaya", namaIbu: "Siti Aminah", pendidikan: "S1" },
  { nkk: "3201010101010001", nik: "3201010101010002", nama: "Siti Nurhaliza", shdk: "Istri", gender: "P", tempatLahir: "Bogor", tanggalLahir: "1978-08-22", alamat: "Jl. Cidahu Indah No. 1", rt: "001", rw: "002", namaAyah: "Nur Hidayat", namaIbu: "Aisyah", pendidikan: "SMA" },
  { nkk: "3201010101010001", nik: "3201010101010003", nama: "Rizki Pratama", shdk: "Anak", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "2000-03-10", alamat: "Jl. Cidahu Indah No. 1", rt: "001", rw: "002", namaAyah: "Ahmad Suryadi", namaIbu: "Siti Nurhaliza", pendidikan: "S1" },
  { nkk: "3201010101010002", nik: "3201010101010004", nama: "Budi Santoso", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Jakarta", tanggalLahir: "1980-12-01", alamat: "Jl. Mekar Jaya No. 5", rt: "002", rw: "002", namaAyah: "Santoso", namaIbu: "Mariam", pendidikan: "D3" },
  { nkk: "3201010101010002", nik: "3201010101010005", nama: "Dewi Lestari", shdk: "Istri", gender: "P", tempatLahir: "Bandung", tanggalLahir: "1982-07-18", alamat: "Jl. Mekar Jaya No. 5", rt: "002", rw: "002", namaAyah: "Lestari", namaIbu: "Rina", pendidikan: "SMA" },
  { nkk: "3201010101010003", nik: "3201010101010006", nama: "Hendra Gunawan", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "1970-01-25", alamat: "Kp. Cidahu Hilir", rt: "003", rw: "001", namaAyah: "Gunawan", namaIbu: "Sumiati", pendidikan: "SMP" },
  { nkk: "3201010101010003", nik: "3201010101010007", nama: "Ratna Sari", shdk: "Istri", gender: "P", tempatLahir: "Cianjur", tanggalLahir: "1972-11-30", alamat: "Kp. Cidahu Hilir", rt: "003", rw: "001", namaAyah: "Sari", namaIbu: "Wati", pendidikan: "SD" },
  { nkk: "3201010101010003", nik: "3201010101010008", nama: "Andi Pratama", shdk: "Anak", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "1995-06-12", alamat: "Kp. Cidahu Hilir", rt: "003", rw: "001", namaAyah: "Hendra Gunawan", namaIbu: "Ratna Sari", pendidikan: "SMA" },
  { nkk: "3201010101010003", nik: "3201010101010009", nama: "Maya Putri", shdk: "Anak", gender: "P", tempatLahir: "Sukabumi", tanggalLahir: "1998-09-05", alamat: "Kp. Cidahu Hilir", rt: "003", rw: "001", namaAyah: "Hendra Gunawan", namaIbu: "Ratna Sari", pendidikan: "S1" },
  { nkk: "3201010101010004", nik: "3201010101010010", nama: "Joko Widodo", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Surabaya", tanggalLahir: "1965-04-20", alamat: "Jl. Pahlawan No. 10", rt: "001", rw: "003", namaAyah: "Widodo", namaIbu: "Sukini", pendidikan: "S2" },
  { nkk: "3201010101010004", nik: "3201010101010011", nama: "Sri Mulyani", shdk: "Istri", gender: "P", tempatLahir: "Jakarta", tanggalLahir: "1968-10-15", alamat: "Jl. Pahlawan No. 10", rt: "001", rw: "003", namaAyah: "Mulyani", namaIbu: "Kartini", pendidikan: "S2" },
  { nkk: "3201010101010005", nik: "3201010101010012", nama: "Agus Salim", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "1985-02-28", alamat: "Kp. Cidahu Udik", rt: "004", rw: "001", namaAyah: "Salim", namaIbu: "Ningsih", pendidikan: "S1" },
  { nkk: "3201010101010005", nik: "3201010101010013", nama: "Fitri Handayani", shdk: "Istri", gender: "P", tempatLahir: "Bogor", tanggalLahir: "1987-06-14", alamat: "Kp. Cidahu Udik", rt: "004", rw: "001", namaAyah: "Handaya", namaIbu: "Yanti", pendidikan: "S1" },
  { nkk: "3201010101010005", nik: "3201010101010014", nama: "Dimas Aditya", shdk: "Anak", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "2010-12-25", alamat: "Kp. Cidahu Udik", rt: "004", rw: "001", namaAyah: "Agus Salim", namaIbu: "Fitri Handayani", pendidikan: "SMP" },
  { nkk: "3201010101010005", nik: "3201010101010015", nama: "Anisa Putri", shdk: "Anak", gender: "P", tempatLahir: "Sukabumi", tanggalLahir: "2015-07-08", alamat: "Kp. Cidahu Udik", rt: "004", rw: "001", namaAyah: "Agus Salim", namaIbu: "Fitri Handayani", pendidikan: "SD" },
  { nkk: "3201010101010006", nik: "3201010101010016", nama: "Eko Prasetyo", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Cianjur", tanggalLahir: "1990-09-03", alamat: "Jl. Raya Cidahu No. 25", rt: "002", rw: "003", namaAyah: "Prasetyo", namaIbu: "Rahayu", pendidikan: "SMA" },
  { nkk: "3201010101010007", nik: "3201010101010017", nama: "Wati Susilowati", shdk: "Kepala Keluarga", gender: "P", tempatLahir: "Sukabumi", tanggalLahir: "1955-03-17", alamat: "Kp. Pasir Eurih", rt: "005", rw: "002", namaAyah: "Susilo", namaIbu: "Parti", pendidikan: "Tidak Sekolah" },
  { nkk: "3201010101010007", nik: "3201010101010018", nama: "Yusuf Maulana", shdk: "Anak", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "1988-11-22", alamat: "Kp. Pasir Eurih", rt: "005", rw: "002", namaAyah: "Sukirman", namaIbu: "Wati Susilowati", pendidikan: "S1" },
  { nkk: "3201010101010008", nik: "3201010101010019", nama: "Rudi Hartono", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Bandung", tanggalLahir: "1978-05-30", alamat: "Jl. Melati No. 8", rt: "003", rw: "002", namaAyah: "Hartono", namaIbu: "Siti", pendidikan: "D3" },
  { nkk: "3201010101010008", nik: "3201010101010020", nama: "Linda Permata", shdk: "Istri", gender: "P", tempatLahir: "Jakarta", tanggalLahir: "1980-08-12", alamat: "Jl. Melati No. 8", rt: "003", rw: "002", namaAyah: "Permata", namaIbu: "Dewi", pendidikan: "S1" },
  { nkk: "3201010101010009", nik: "3201010101010021", nama: "Sri Rahayu", shdk: "Kepala Keluarga", gender: "P", tempatLahir: "Sukabumi", tanggalLahir: "1960-01-01", alamat: "Kp. Gunung Batu", rt: "001", rw: "004", namaAyah: "Rahmat", namaIbu: "Sri", pendidikan: "SD" },
  { nkk: "3201010101010010", nik: "3201010101010022", nama: "Deni Kurniawan", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "1992-07-19", alamat: "Jl. Kenanga No. 3", rt: "004", rw: "001", namaAyah: "Kurnia", namaIbu: "Dewi", pendidikan: "S1" },
  { nkk: "3201010101010010", nik: "3201010101010023", nama: "Indah Permatasari", shdk: "Istri", gender: "P", tempatLahir: "Bogor", tanggalLahir: "1994-04-25", alamat: "Jl. Kenanga No. 3", rt: "004", rw: "001", namaAyah: "Permana", namaIbu: "Sari", pendidikan: "S1" },
  { nkk: "3201010101010011", nik: "3201010101010024", nama: "Komarudin", shdk: "Kepala Keluarga", gender: "L", tempatLahir: "Sukabumi", tanggalLahir: "1958-06-10", alamat: "Kp. Cidahu Tengah", rt: "002", rw: "004", namaAyah: "Rudin", namaIbu: "Karsi", pendidikan: "SMP" },
  { nkk: "3201010101010011", nik: "3201010101010025", nama: "Euis Komariah", shdk: "Istri", gender: "P", tempatLahir: "Cianjur", tanggalLahir: "1962-12-05", alamat: "Kp. Cidahu Tengah", rt: "002", rw: "004", namaAyah: "Komar", namaIbu: "Enok", pendidikan: "SD" }
];

// Add umur field to each record
const sampleData = sampleDataRaw.map(item => ({
  ...item,
  umur: calculateAge(item.tanggalLahir)
}));

export async function GET() {
  try {
    // Check if admin user exists
    const existingAdmin = await db.adminUser.findUnique({
      where: { username: 'admin' },
    });

    // Create admin user if not exists
    if (!existingAdmin) {
      await db.adminUser.create({
        data: {
          username: 'admin',
          password: 'admin123',
          name: 'Admin Desa',
        },
      });
    }

    // Check if data already exists
    const existingCount = await db.penduduk.count();
    
    if (existingCount === 0) {
      // Seed sample data
      await db.penduduk.createMany({
        data: sampleData,
      });
    }

    return NextResponse.json({
      success: true,
      message: existingCount === 0 ? 'Data berhasil di-seed' : 'Data sudah ada',
      adminCreated: !existingAdmin,
      dataSeeded: existingCount === 0,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan seed data' },
      { status: 500 }
    );
  }
}
