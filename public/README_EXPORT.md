# SIKDAHU - Sistem Informasi Kependudukan Desa Cidahu

## Deskripsi
Aplikasi Sistem Informasi Kependudukan untuk mengelola data penduduk, laporan bulanan, dan surat pengantar di tingkat desa.

## Tech Stack
- **Framework**: Next.js 16+ dengan App Router
- **Database**: SQLite (Prisma ORM)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Language**: TypeScript 5

## Fitur Utama
1. ✅ Dashboard Statistik Kependudukan
2. ✅ CRUD Data Penduduk dengan Import/Export Excel
3. ✅ Laporan Bulanan per RT
4. ✅ Data Kelahiran, Kematian, Kedatangan, Kepindahan
5. ✅ Surat Pengantar (DOCX)
6. ✅ Pengaturan Desa dan Tema
7. ✅ Dark/Light Mode

## Quick Start

```bash
# Install dependencies
bun install

# Setup database
bun run db:push

# Run development server
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Default Login
- **Username**: admin
- **Password**: admin123

## Struktur Folder

```
src/
├── app/
│   ├── api/           # API Routes
│   ├── page.tsx       # Main page (semua komponen)
│   ├── layout.tsx     # Root layout
│   └── globals.css    # Global styles
├── components/ui/     # shadcn/ui components
├── hooks/             # Custom hooks
└── lib/               # Utilities
```

## Deployment

### Vercel (Recommended)
1. Push ke GitHub
2. Connect di Vercel
3. Set environment variables
4. Deploy

### Base44 / Platform Lain
1. Copy semua file dari folder `src/`
2. Copy `prisma/schema.prisma`
3. Copy `package.json`
4. Set DATABASE_URL sesuai platform
5. Run `prisma db push`
6. Build dan deploy

## Environment Variables

```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="https://your-domain.com"
```

## License
MIT License - Desa Cidahu
