"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Users,
  UserCheck,
  UserX,
  Home,
  Search,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  LogIn,
  Globe,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Settings,
  BarChart3,
  ClipboardList,
  Calendar,
  Shield,
  Palette,
  Building2,
  Save,
  Eye,
  Printer,
  Mail,
  UserCog,
  Sun,
  Moon,
} from "lucide-react";

// Types
interface User {
  name: string;
  role: "admin" | "public";
}

interface Penduduk {
  id: string;
  nkk: string;
  nik: string;
  nama: string;
  shdk: string;
  gender: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  rt: string;
  rw: string;
  namaAyah: string | null;
  namaIbu: string | null;
  pendidikan: string;
  status?: string;
}

interface Statistik {
  total: number;
  male: number;
  female: number;
  totalRT: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  rts: string[];
}

interface LaporanBulananRT {
  id: string | null;
  rt: string;
  jumlahLaluL: number;
  jumlahLaluP: number;
  jumlahLaluTotal: number;
  lahirL: number;
  lahirP: number;
  lahirTotal: number;
  matiL: number;
  matiP: number;
  matiTotal: number;
  datangL: number;
  datangP: number;
  datangTotal: number;
  pindahL: number;
  pindahP: number;
  pindahTotal: number;
  jumlahIniL: number;
  jumlahIniP: number;
  jumlahIniTotal: number;
  jumlahKK: number;
  wajibKTP: number;
  punyaKTP: number;
  punyaKK: number;
  belumKTP: number;
  belumKK: number;
}

interface VillageSettings {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  alamat: string;
  kepalaDesa: string;
  sekretaris: string;
  kasiPemerintahan: string;
  themeColor: string;
  themeMode: 'light' | 'dark';
  logo?: string | null;
}

interface EventKependudukan {
  id: string;
  jenis: string;
  nama: string | null;
  nik: string | null;
  nkk?: string | null;
  gender: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  namaAyah?: string | null;
  namaIbu?: string | null;
  pendidikan?: string | null;
  tanggalEvent: string | null;
  keterangan: string | null;
  bulan: number;
  tahun: number;
  pendudukId?: string | null;
}

const SHDK_OPTIONS = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Menantu",
  "Cucu",
  "Orang Tua",
  "Mertua",
  "Famili Lain",
  "Pembantu",
  "Lainnya",
];

const PENDIDIKAN_OPTIONS = [
  "Tidak Sekolah",
  "SD",
  "SMP",
  "SMA",
  "D1",
  "D2",
  "D3",
  "S1",
  "S2",
  "S3",
];

const STATUS_OPTIONS = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];

const MONTHS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

// Utility functions
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getCurrentMonth(): string {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}

function getCurrentYear(): string {
  return String(new Date().getFullYear());
}

// Login Screen Component
function LoginScreen({
  onLogin,
  onPublicAccess,
  villageSettings,
}: {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onPublicAccess: () => void;
  villageSettings: VillageSettings;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onLogin(username, password);
    if (!success) {
      toast({
        title: "Login Gagal",
        description: "Nama pengguna atau kata sandi salah!",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {villageSettings.logo ? (
            <img 
              src={villageSettings.logo} 
              alt="Logo Desa" 
              className="w-20 h-20 mx-auto rounded-2xl object-contain bg-secondary/50 p-2"
            />
          ) : (
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-emerald-600">
              <Users className="w-10 h-10 text-primary-foreground" />
            </div>
          )}
          <div>
            <CardTitle className="font-display text-2xl">SIKDAHU</CardTitle>
            <CardDescription>Sistem Informasi Kependudukan {villageSettings.namaDesa}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Nama Pengguna</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan nama pengguna"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Masuk sebagai Admin
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={onPublicAccess}
            >
              <Globe className="w-4 h-4 mr-2" />
              Akses sebagai Masyarakat Umum
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Stats Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  badge,
  badgeVariant,
  iconBgColor,
  iconColor,
  delay,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "male" | "female";
  iconBgColor: string;
  iconColor: string;
  delay: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const start = 0;
    const increment = value / (duration / 16);
    let current = start;

    const animate = () => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
      } else {
        setDisplayValue(Math.round(current));
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <Card
      className="stat-card border-border/50 hover:border-primary/50 transition-colors"
      style={{ animationDelay: delay }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgColor}`}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          {badge && (
            <Badge
              variant="secondary"
              className={`${badgeVariant === "male" ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" : badgeVariant === "female" ? "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30" : ""}`}
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-3xl font-display font-bold">{displayValue}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}

// Quick Action Button
function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto flex-col gap-2 py-4 px-6 border-border/50 hover:border-primary/50"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs">{label}</span>
    </Button>
  );
}

// Dashboard Section
function DashboardSection({
  statistik,
  onNavigate,
}: {
  statistik: Statistik;
  onNavigate: (tab: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jiwa Terdaftar"
          value={statistik.total}
          icon={Users}
          badge="Total"
          iconBgColor="bg-primary/15"
          iconColor="text-primary"
          delay="0.1s"
        />
        <StatCard
          title="Laki-laki"
          value={statistik.male}
          icon={UserCheck}
          badge="L"
          badgeVariant="male"
          iconBgColor="bg-blue-500/15"
          iconColor="text-blue-400"
          delay="0.2s"
        />
        <StatCard
          title="Perempuan"
          value={statistik.female}
          icon={UserX}
          badge="P"
          badgeVariant="female"
          iconBgColor="bg-pink-500/15"
          iconColor="text-pink-400"
          delay="0.3s"
        />
        <StatCard
          title="Rukun Tetangga"
          value={statistik.totalRT}
          icon={Home}
          badge="RT"
          iconBgColor="bg-yellow-500/15"
          iconColor="text-yellow-400"
          delay="0.4s"
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          <CardDescription>Akses fitur utama dengan cepat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickActionButton
              icon={Users}
              label="Data Penduduk"
              onClick={() => onNavigate("data-penduduk")}
              color="bg-primary/15 text-primary"
            />
            <QuickActionButton
              icon={BarChart3}
              label="Laporan Bulanan"
              onClick={() => onNavigate("laporan-bulanan")}
              color="bg-blue-500/15 text-blue-400"
            />
            <QuickActionButton
              icon={FileText}
              label="Surat Pengantar"
              onClick={() => onNavigate("surat-pengantar")}
              color="bg-purple-500/15 text-purple-400"
            />
            <QuickActionButton
              icon={Settings}
              label="Pengaturan"
              onClick={() => onNavigate("pengaturan")}
              color="bg-orange-500/15 text-orange-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Population Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Distribusi Jenis Kelamin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                    <UserCheck className="w-10 h-10 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold">{statistik.male}</p>
                  <p className="text-sm text-muted-foreground">Laki-laki</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-pink-500/20 flex items-center justify-center mb-2">
                    <UserX className="w-10 h-10 text-pink-400" />
                  </div>
                  <p className="text-2xl font-bold">{statistik.female}</p>
                  <p className="text-sm text-muted-foreground">Perempuan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Statistik Kependudukan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">Total KK</span>
                <span className="font-semibold">{Math.ceil(statistik.total / 4)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">Rata-rata Jiwa/RT</span>
                <span className="font-semibold">
                  {statistik.totalRT > 0 ? Math.round(statistik.total / statistik.totalRT) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">Rasio L/P</span>
                <span className="font-semibold">
                  {statistik.female > 0 ? (statistik.male / statistik.female * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Data Penduduk Section
function DataPendudukSection({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  const { toast } = useToast();
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({ rts: [] });
  const [search, setSearch] = useState("");
  const [filterRT, setFilterRT] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterEducation, setFilterEducation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortField, setSortField] = useState("nama");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPenduduk, setEditingPenduduk] = useState<Penduduk | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewRT, setViewRT] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nkk: "",
    nik: "",
    nama: "",
    shdk: "",
    gender: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    rt: "",
    rw: "",
    namaAyah: "",
    namaIbu: "",
    pendidikan: "",
    status: "",
  });

  const fetchPenduduk = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filterRT && { rt: filterRT }),
        ...(filterGender && { gender: filterGender }),
        ...(filterEducation && { pendidikan: filterEducation }),
        sortField,
        sortOrder,
      });

      const res = await fetch(`/api/penduduk?${params}`);
      const data = await res.json();
      setPendudukList(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
      setFilters(data.filters);
    } catch (error) {
      console.error("Error fetching penduduk:", error);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    filterRT,
    filterGender,
    filterEducation,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetch("/api/seed").catch(console.error);
  }, []);

  useEffect(() => {
    fetchPenduduk();
  }, [fetchPenduduk]);

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const openModal = (penduduk?: Penduduk) => {
    if (penduduk) {
      setEditingPenduduk(penduduk);
      setFormData({
        nkk: penduduk.nkk,
        nik: penduduk.nik,
        nama: penduduk.nama,
        shdk: penduduk.shdk,
        gender: penduduk.gender,
        tempatLahir: penduduk.tempatLahir,
        tanggalLahir: penduduk.tanggalLahir,
        alamat: penduduk.alamat,
        rt: penduduk.rt,
        rw: penduduk.rw,
        namaAyah: penduduk.namaAyah || "",
        namaIbu: penduduk.namaIbu || "",
        pendidikan: penduduk.pendidikan,
        status: penduduk.status || "",
      });
    } else {
      setEditingPenduduk(null);
      setFormData({
        nkk: "",
        nik: "",
        nama: "",
        shdk: "",
        gender: "",
        tempatLahir: "",
        tanggalLahir: "",
        alamat: "",
        rt: "",
        rw: "",
        namaAyah: "",
        namaIbu: "",
        pendidikan: "",
        status: "",
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingPenduduk
        ? `/api/penduduk/${editingPenduduk.id}`
        : "/api/penduduk";
      const method = editingPenduduk ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: editingPenduduk ? "Data Diperbarui" : "Data Ditambahkan",
          description: editingPenduduk
            ? "Data penduduk berhasil diperbarui!"
            : "Data penduduk berhasil ditambahkan!",
        });
        setModalOpen(false);
        fetchPenduduk();
      } else {
        toast({
          title: "Gagal",
          description: data.error || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan pada server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/penduduk/${deletingId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Data Dihapus",
          description: "Data penduduk berhasil dihapus!",
        });
        setDeleteDialogOpen(false);
        setDeletingId(null);
        fetchPenduduk();
      } else {
        toast({
          title: "Gagal",
          description: data.error || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan pada server",
        variant: "destructive",
      });
    }
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch("/api/penduduk/import", {
        method: "POST",
        body: formDataUpload,
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid response");
      }

      if (data.success) {
        toast({
          title: "Upload Berhasil",
          description: data.message || `${data.results?.success || 0} data penduduk berhasil diimpor!`,
        });
        fetchPenduduk();
      } else {
        toast({
          title: "Upload Gagal",
          description: data.error || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading:", error);
      toast({
        title: "Error",
        description: "Gagal mengunggah file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filterRT && { rt: filterRT }),
        ...(filterGender && { gender: filterGender }),
        ...(filterEducation && { pendidikan: filterEducation }),
      });

      const res = await fetch(`/api/penduduk/export?${params}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data_penduduk_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Berhasil",
        description: "File Excel berhasil diunduh",
      });
    } catch (error) {
      console.error("Error exporting:", error);
      toast({
        title: "Export Gagal",
        description: "Gagal mengekspor data",
        variant: "destructive",
      });
    }
  };

  const filteredList = viewRT
    ? pendudukList.filter((p) => p.rt === viewRT)
    : pendudukList;

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama, NIK, NKK..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="pl-10 bg-secondary border-border"
                />
              </div>

              {/* RT Filter */}
              <Select
                value={filterRT}
                onValueChange={(value) => {
                  setFilterRT(value === "all" ? "" : value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-auto bg-secondary border-border">
                  <SelectValue placeholder="Semua RT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {filters.rts.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      RT {rt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Gender Filter */}
              <Select
                value={filterGender}
                onValueChange={(value) => {
                  setFilterGender(value === "all" ? "" : value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-auto bg-secondary border-border">
                  <SelectValue placeholder="Jenis Kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua JK</SelectItem>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>

              {/* Education Filter */}
              <Select
                value={filterEducation}
                onValueChange={(value) => {
                  setFilterEducation(value === "all" ? "" : value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-auto bg-secondary border-border">
                  <SelectValue placeholder="Pendidikan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Pendidikan</SelectItem>
                  {PENDIDIKAN_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={filterStatus}
                onValueChange={(value) => {
                  setFilterStatus(value === "all" ? "" : value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-auto bg-secondary border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* View per RT */}
              <Select
                value={viewRT}
                onValueChange={(value) => setViewRT(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-auto bg-secondary border-border">
                  <SelectValue placeholder="Tampil RT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {filters.rts.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      RT {rt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isAdmin && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleUploadExcel}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Import Excel
                  </Button>
                </>
              )}

              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>

              {isAdmin && (
                <Button
                  className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground font-semibold"
                  onClick={() => openModal()}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Data
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead
                  className="cursor-pointer hover:text-primary whitespace-nowrap"
                  onClick={() => handleSort("nkk")}
                >
                  NKK
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary whitespace-nowrap"
                  onClick={() => handleSort("nik")}
                >
                  NIK
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary whitespace-nowrap"
                  onClick={() => handleSort("nama")}
                >
                  NAMA
                </TableHead>
                <TableHead className="whitespace-nowrap">SHDK</TableHead>
                <TableHead className="whitespace-nowrap">JK</TableHead>
                <TableHead className="whitespace-nowrap">TEMPAT LAHIR</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary whitespace-nowrap"
                  onClick={() => handleSort("tanggalLahir")}
                >
                  TGL LAHIR
                </TableHead>
                <TableHead className="whitespace-nowrap">UMUR</TableHead>
                <TableHead className="whitespace-nowrap">ALAMAT</TableHead>
                <TableHead className="whitespace-nowrap">RT</TableHead>
                <TableHead className="whitespace-nowrap">RW</TableHead>
                <TableHead className="whitespace-nowrap">AYAH</TableHead>
                <TableHead className="whitespace-nowrap">IBU</TableHead>
                <TableHead className="whitespace-nowrap">PENDIDIKAN</TableHead>
                <TableHead className="whitespace-nowrap">STATUS</TableHead>
                {isAdmin && <TableHead className="whitespace-nowrap">AKSI</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 16 : 15}
                    className="text-center py-12"
                  >
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Tidak ada data ditemukan</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Coba ubah filter atau kata kunci pencarian
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => (
                  <TableRow key={item.id} className="hover:bg-card/50">
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {item.nkk}
                    </TableCell>
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {item.nik}
                    </TableCell>
                    <TableCell className="font-semibold whitespace-nowrap">
                      {item.nama}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {item.shdk}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="secondary"
                        className={
                          item.gender === "L"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-pink-500/20 text-pink-400"
                        }
                      >
                        {item.gender}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{item.tempatLahir}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(item.tanggalLahir)}</TableCell>
                    <TableCell className="whitespace-nowrap">{calculateAge(item.tanggalLahir)} th</TableCell>
                    <TableCell className="max-w-xs truncate whitespace-nowrap">
                      {item.alamat}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">{item.rt}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">{item.rw}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{item.namaAyah || "-"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{item.namaIbu || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.pendidikan}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.status || "-"}</TableCell>
                    {isAdmin && (
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-blue-500/15 hover:bg-blue-500/25"
                            onClick={() => openModal(item)}
                          >
                            <Pencil className="w-4 h-4 text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-destructive/15 hover:bg-destructive/25"
                            onClick={() => {
                              setDeletingId(item.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Menampilkan {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
              {pagination.total} data
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      size="icon"
                      onClick={() => goToPage(pageNum)}
                      className={
                        pagination.page === pageNum
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingPenduduk ? "Edit Data Penduduk" : "Tambah Data Penduduk"}
            </DialogTitle>
            <DialogDescription>
              {editingPenduduk
                ? "Perbarui informasi penduduk di bawah ini"
                : "Lengkapi informasi penduduk baru di bawah ini"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nkk">
                  NKK <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nkk"
                  placeholder="16 digit nomor KK"
                  maxLength={16}
                  value={formData.nkk}
                  onChange={(e) =>
                    setFormData({ ...formData, nkk: e.target.value })
                  }
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik">
                  NIK <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nik"
                  placeholder="16 digit NIK"
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) =>
                    setFormData({ ...formData, nik: e.target.value })
                  }
                  className="bg-secondary border-border"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nama"
                  placeholder="Nama lengkap sesuai KTP"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shdk">
                  SHDK <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.shdk}
                  onValueChange={(value) =>
                    setFormData({ ...formData, shdk: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Pilih SHDK" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHDK_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Jenis Kelamin <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempatLahir">
                  Tempat Lahir <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tempatLahir"
                  placeholder="Kota/Kabupaten"
                  value={formData.tempatLahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tempatLahir: e.target.value })
                  }
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalLahir">
                  Tanggal Lahir <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggalLahir: e.target.value })
                  }
                  className="bg-secondary border-border"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alamat">
                  Alamat <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="alamat"
                  placeholder="Alamat lengkap"
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat: e.target.value })
                  }
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rt">
                    RT <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rt"
                    placeholder="001"
                    maxLength={3}
                    value={formData.rt}
                    onChange={(e) =>
                      setFormData({ ...formData, rt: e.target.value })
                    }
                    className="bg-secondary border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rw">
                    RW <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rw"
                    placeholder="001"
                    maxLength={3}
                    value={formData.rw}
                    onChange={(e) =>
                      setFormData({ ...formData, rw: e.target.value })
                    }
                    className="bg-secondary border-border"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="namaAyah">Nama Ayah</Label>
                <Input
                  id="namaAyah"
                  placeholder="Nama ayah kandung"
                  value={formData.namaAyah}
                  onChange={(e) =>
                    setFormData({ ...formData, namaAyah: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="namaIbu">Nama Ibu</Label>
                <Input
                  id="namaIbu"
                  placeholder="Nama ibu kandung"
                  value={formData.namaIbu}
                  onChange={(e) =>
                    setFormData({ ...formData, namaIbu: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pendidikan">
                  Pendidikan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.pendidikan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, pendidikan: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Pilih Pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {PENDIDIKAN_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status Perkawinan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingPenduduk ? "Perbarui" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data penduduk ini? Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Laporan Bulanan Section
function LaporanBulananSection({
  isAdmin,
  rts,
}: {
  isAdmin: boolean;
  rts: string[];
}) {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [laporanData, setLaporanData] = useState<LaporanBulananRT[]>([]);
  const [totals, setTotals] = useState<LaporanBulananRT | null>(null);
  const [editingRT, setEditingRT] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<LaporanBulananRT | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Event management state
  const [activeEventTab, setActiveEventTab] = useState<string>("laporan");
  const [events, setEvents] = useState<EventKependudukan[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventKependudukan | null>(null);
  const [eventImporting, setEventImporting] = useState(false);
  const eventImportRef = useRef<HTMLInputElement>(null);
  const [eventFormData, setEventFormData] = useState({
    jenis: "",
    nama: "",
    nik: "",
    nkk: "",
    gender: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    rt: "",
    rw: "",
    namaAyah: "",
    namaIbu: "",
    pendidikan: "",
    tanggalEvent: "",
    keterangan: "",
  });

  // Fetch laporan data from API
  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan?bulan=${selectedMonth}&tahun=${selectedYear}`);
      const data = await res.json();
      
      if (data.success) {
        setLaporanData(data.data.reports);
        setTotals(data.data.totals);
      } else {
        // Initialize with empty data for each RT
        const emptyData: LaporanBulananRT[] = rts.map((rt) => ({
          id: null,
          rt,
          jumlahLaluL: 0,
          jumlahLaluP: 0,
          jumlahLaluTotal: 0,
          lahirL: 0,
          lahirP: 0,
          lahirTotal: 0,
          matiL: 0,
          matiP: 0,
          matiTotal: 0,
          datangL: 0,
          datangP: 0,
          datangTotal: 0,
          pindahL: 0,
          pindahP: 0,
          pindahTotal: 0,
          jumlahIniL: 0,
          jumlahIniP: 0,
          jumlahIniTotal: 0,
          jumlahKK: 0,
          wajibKTP: 0,
          punyaKTP: 0,
          punyaKK: 0,
          belumKTP: 0,
          belumKK: 0,
        }));
        setLaporanData(emptyData);
        setTotals(null);
      }
    } catch (error) {
      console.error("Error fetching laporan:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, rts, toast]);

  // Initialize laporan from current population data
  const handleInitialize = async () => {
    setInitializing(true);
    try {
      const res = await fetch("/api/laporan/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulan: parseInt(selectedMonth), tahun: parseInt(selectedYear) }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Berhasil",
          description: data.message,
        });
        fetchLaporan();
      } else {
        toast({
          title: "Gagal",
          description: data.error || "Gagal menginisialisasi laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error initializing laporan:", error);
      toast({
        title: "Error",
        description: "Gagal menginisialisasi laporan",
        variant: "destructive",
      });
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // Fetch events
  const fetchEvents = useCallback(async (jenis?: string) => {
    setEventsLoading(true);
    try {
      const params = new URLSearchParams({
        bulan: selectedMonth,
        tahun: selectedYear,
        limit: "100",
      });
      if (jenis) {
        params.append("jenis", jenis);
      }
      
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setEvents(data.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Fetch events when tab changes
  useEffect(() => {
    if (activeEventTab !== "laporan") {
      fetchEvents(activeEventTab);
    }
  }, [activeEventTab, fetchEvents]);

  // Open event modal for edit
  const openEventModal = (event?: EventKependudukan) => {
    if (event) {
      setEditingEvent(event);
      setEventFormData({
        jenis: event.jenis,
        nama: event.nama || "",
        nik: event.nik || "",
        nkk: event.nkk || "",
        gender: event.gender || "",
        tempatLahir: event.tempatLahir || "",
        tanggalLahir: event.tanggalLahir || "",
        alamat: event.alamat || "",
        rt: event.rt || "",
        rw: event.rw || "",
        namaAyah: event.namaAyah || "",
        namaIbu: event.namaIbu || "",
        pendidikan: event.pendidikan || "",
        tanggalEvent: event.tanggalEvent || "",
        keterangan: event.keterangan || "",
      });
    } else {
      setEditingEvent(null);
      setEventFormData({
        jenis: activeEventTab !== "laporan" ? activeEventTab : "lahir",
        nama: "",
        nik: "",
        nkk: "",
        gender: "",
        tempatLahir: "",
        tanggalLahir: "",
        alamat: "",
        rt: "",
        rw: "",
        namaAyah: "",
        namaIbu: "",
        pendidikan: "",
        tanggalEvent: new Date().toISOString().split("T")[0],
        keterangan: "",
      });
    }
    setEventModalOpen(true);
  };

  // Handle save event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const url = "/api/events";
      const method = editingEvent ? "PUT" : "POST";
      const body = editingEvent
        ? { id: editingEvent.id, ...eventFormData, bulan: parseInt(selectedMonth), tahun: parseInt(selectedYear) }
        : { ...eventFormData, bulan: parseInt(selectedMonth), tahun: parseInt(selectedYear) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: editingEvent ? "Data Diperbarui" : "Data Ditambahkan",
          description: editingEvent
            ? "Data kejadian berhasil diperbarui!"
            : "Data kejadian berhasil ditambahkan!",
        });
        setEventModalOpen(false);
        fetchEvents(activeEventTab);
        fetchLaporan(); // Refresh laporan too
      } else {
        throw new Error(data.error || "Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Gagal",
        description: error instanceof Error ? error.message : "Gagal menyimpan data kejadian",
        variant: "destructive",
      });
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (id: string) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/events?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Data Dihapus",
          description: "Data kejadian berhasil dihapus!",
        });
        fetchEvents(activeEventTab);
        fetchLaporan(); // Refresh laporan too
      } else {
        throw new Error(data.error || "Gagal menghapus data");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Gagal",
        description: "Gagal menghapus data kejadian",
        variant: "destructive",
      });
    }
  };

  // Handle import events from Excel
  const handleImportEvents = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeEventTab === "laporan") return;

    setEventImporting(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("jenis", activeEventTab);
    formDataUpload.append("bulan", selectedMonth);
    formDataUpload.append("tahun", selectedYear);

    try {
      const res = await fetch("/api/events/import", {
        method: "POST",
        body: formDataUpload,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid response");
      }

      if (data.success) {
        toast({
          title: "Import Berhasil",
          description: data.message || `${data.results?.success || 0} data berhasil diimpor!`,
        });
        fetchEvents(activeEventTab);
        fetchLaporan();
      } else {
        toast({
          title: "Import Gagal",
          description: data.error || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing events:", error);
      toast({
        title: "Error",
        description: "Gagal mengimpor data event",
        variant: "destructive",
      });
    } finally {
      setEventImporting(false);
      if (eventImportRef.current) {
        eventImportRef.current.value = "";
      }
    }
  };

  const handleEdit = (rt: string) => {
    const data = laporanData.find((l) => l.rt === rt);
    if (data) {
      setEditFormData({ ...data });
      setEditingRT(rt);
    }
  };

  const handleSaveEdit = async () => {
    if (editFormData) {
      try {
        const res = await fetch("/api/laporan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bulan: parseInt(selectedMonth),
            tahun: parseInt(selectedYear),
            rt: editFormData.rt,
            jumlahLaluL: editFormData.jumlahLaluL,
            jumlahLaluP: editFormData.jumlahLaluP,
            lahirL: editFormData.lahirL,
            lahirP: editFormData.lahirP,
            matiL: editFormData.matiL,
            matiP: editFormData.matiP,
            datangL: editFormData.datangL,
            datangP: editFormData.datangP,
            pindahL: editFormData.pindahL,
            pindahP: editFormData.pindahP,
            jumlahIniL: editFormData.jumlahIniL,
            jumlahIniP: editFormData.jumlahIniP,
            jumlahKK: editFormData.jumlahKK,
            wajibKTP: editFormData.wajibKTP,
            punyaKTP: editFormData.punyaKTP,
            punyaKK: editFormData.punyaKK,
          }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          toast({
            title: "Data Diperbarui",
            description: "Data laporan berhasil disimpan",
          });
          setEditingRT(null);
          setEditFormData(null);
          fetchLaporan();
        } else {
          toast({
            title: "Gagal",
            description: data.error || "Gagal menyimpan data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error saving laporan:", error);
        toast({
          title: "Error",
          description: "Gagal menyimpan data laporan",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadExcel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan/export?bulan=${selectedMonth}&tahun=${selectedYear}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Kependudukan_${MONTHS.find((m) => m.value === selectedMonth)?.label}_${selectedYear}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Berhasil",
        description: "File laporan Excel berhasil diunduh",
      });
    } catch (error) {
      console.error("Error downloading:", error);
      toast({
        title: "Gagal",
        description: "Gagal mengunduh laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("bulan", selectedMonth);
    formDataUpload.append("tahun", selectedYear);

    try {
      const res = await fetch("/api/laporan/import", {
        method: "POST",
        body: formDataUpload,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid response");
      }

      if (data.success) {
        toast({
          title: "Upload Berhasil",
          description: data.message || `${data.count || 0} data laporan berhasil diimpor!`,
        });
        fetchLaporan();
      } else {
        toast({
          title: "Upload Gagal",
          description: data.error || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading:", error);
      toast({
        title: "Error",
        description: "Gagal mengunggah file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const renderEditableCell = (
    field: keyof LaporanBulananRT,
    value: number,
    rt: string
  ) => {
    if (editingRT === rt && editFormData) {
      return (
        <Input
          type="number"
          value={editFormData[field] as number}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              [field]: parseInt(e.target.value) || 0,
            })
          }
          className="w-16 h-8 text-center bg-secondary border-border"
        />
      );
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <Card className="border-border/50">
        <CardContent className="p-4 lg:p-6 text-center">
          <h2 className="font-display text-xl font-bold mb-2">
            LAPORAN REGISTRASI KEPENDUDUKAN DESA CIDAHU
          </h2>
          <p className="text-lg">
            BULAN : {MONTHS.find((m) => m.value === selectedMonth)?.label?.toUpperCase()} {selectedYear}
          </p>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeEventTab} onValueChange={setActiveEventTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-card border border-border">
          <TabsTrigger value="laporan">Laporan</TabsTrigger>
          <TabsTrigger value="lahir" className="text-green-500 data-[state=active]:text-green-600">Kelahiran</TabsTrigger>
          <TabsTrigger value="mati" className="text-red-500 data-[state=active]:text-red-600">Kematian</TabsTrigger>
          <TabsTrigger value="datang" className="text-blue-500 data-[state=active]:text-blue-600">Kedatangan</TabsTrigger>
          <TabsTrigger value="pindah" className="text-yellow-500 data-[state=active]:text-yellow-600">Kepindahan</TabsTrigger>
        </TabsList>

        {/* Event Tabs Content */}
        {activeEventTab !== "laporan" && (
          <TabsContent value={activeEventTab} className="mt-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Data {activeEventTab === "lahir" && "Kelahiran"}
                      {activeEventTab === "mati" && "Kematian"}
                      {activeEventTab === "datang" && "Kedatangan"}
                      {activeEventTab === "pindah" && "Kepindahan"}
                    </CardTitle>
                    <CardDescription>
                      Bulan {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <input
                        ref={eventImportRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleImportEvents}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => eventImportRef.current?.click()}
                        disabled={eventImporting}
                      >
                        {eventImporting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Import Excel
                      </Button>
                      <Button onClick={() => openEventModal()} className="bg-primary text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Data
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">Belum ada data</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead>No</TableHead>
                          <TableHead>NIK</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>JK</TableHead>
                          <TableHead>Tempat/Tgl Lahir</TableHead>
                          <TableHead>Alamat</TableHead>
                          <TableHead>RT/RW</TableHead>
                          <TableHead>Tanggal Event</TableHead>
                          <TableHead>Keterangan</TableHead>
                          {isAdmin && <TableHead>Aksi</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event, index) => (
                          <TableRow key={event.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-mono text-sm">{event.nik || "-"}</TableCell>
                            <TableCell className="font-semibold">{event.nama || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={event.gender === "L" ? "bg-blue-500/20 text-blue-400" : "bg-pink-500/20 text-pink-400"}>
                                {event.gender || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {event.tempatLahir}{event.tempatLahir && event.tanggalLahir ? ", " : ""}{event.tanggalLahir ? formatDate(event.tanggalLahir) : "-"}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">{event.alamat || "-"}</TableCell>
                            <TableCell>{event.rt}/{event.rw}</TableCell>
                            <TableCell>{event.tanggalEvent ? formatDate(event.tanggalEvent) : "-"}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{event.keterangan || "-"}</TableCell>
                            {isAdmin && (
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-blue-500/15 hover:bg-blue-500/25"
                                    onClick={() => openEventModal(event)}
                                  >
                                    <Pencil className="w-4 h-4 text-blue-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-destructive/15 hover:bg-destructive/25"
                                    onClick={() => handleDeleteEvent(event.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Laporan Table - only show when laporan tab is active */}
      {activeEventTab === "laporan" && (
      <>
      {/* Header with selectors */}
      <Card className="border-border/50">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <Label>Bulan:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-36 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label>Tahun:</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-28 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isAdmin && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleUploadExcel}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Import Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleInitialize}
                    disabled={initializing}
                  >
                    {initializing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Init dari Data
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={handleDownloadExcel}
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Laporan Table */}
      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              {/* Row 1 - Main headers */}
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead rowSpan={3} className="align-middle text-center whitespace-nowrap border border-border">
                  NO.
                </TableHead>
                <TableHead rowSpan={3} className="align-middle text-center whitespace-nowrap border border-border">
                  RUKUN TETANGGA
                </TableHead>
                <TableHead colSpan={3} className="text-center whitespace-nowrap border border-border">
                  JUMLAH PENDUDUK BULAN LALU
                </TableHead>
                <TableHead colSpan={12} className="text-center whitespace-nowrap border border-border bg-blue-500/10">
                  BULAN INI
                </TableHead>
                <TableHead colSpan={3} className="text-center whitespace-nowrap border border-border">
                  JUMLAH PENDUDUK S/D BULAN INI
                </TableHead>
                <TableHead rowSpan={3} className="align-middle text-center whitespace-nowrap border border-border">
                  JUMLAH KK
                </TableHead>
                <TableHead rowSpan={3} className="align-middle text-center whitespace-nowrap border border-border">
                  JUMLAH WAJIB KTP
                </TableHead>
                <TableHead colSpan={2} className="text-center whitespace-nowrap border border-border bg-green-500/10">
                  JUMLAH YANG SUDAH MEMILIKI
                </TableHead>
                <TableHead colSpan={2} className="text-center whitespace-nowrap border border-border bg-red-500/10">
                  JUMLAH YANG BELUM MEMILIKI
                </TableHead>
                {isAdmin && (
                  <TableHead rowSpan={3} className="align-middle text-center whitespace-nowrap border border-border">
                    Aksi
                  </TableHead>
                )}
              </TableRow>
              {/* Row 2 - Sub headers */}
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead rowSpan={2} className="text-center border border-border">L</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border">P</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border">JML</TableHead>
                <TableHead colSpan={3} className="text-center border border-border bg-green-500/5">LAHIR</TableHead>
                <TableHead colSpan={3} className="text-center border border-border bg-red-500/5">MATI</TableHead>
                <TableHead colSpan={3} className="text-center border border-border bg-blue-500/5">DATANG</TableHead>
                <TableHead colSpan={3} className="text-center border border-border bg-yellow-500/5">PINDAH</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border">L</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border">P</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border">JML</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border bg-green-500/10">KTP</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border bg-green-500/10">KK</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border bg-red-500/10">KTP</TableHead>
                <TableHead rowSpan={2} className="text-center border border-border bg-red-500/10">KK</TableHead>
              </TableRow>
              {/* Row 3 - L/P/JML */}
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="text-center border border-border w-10">L</TableHead>
                <TableHead className="text-center border border-border w-10">P</TableHead>
                <TableHead className="text-center border border-border w-10">JML</TableHead>
                <TableHead className="text-center border border-border w-10">L</TableHead>
                <TableHead className="text-center border border-border w-10">P</TableHead>
                <TableHead className="text-center border border-border w-10">JML</TableHead>
                <TableHead className="text-center border border-border w-10">L</TableHead>
                <TableHead className="text-center border border-border w-10">P</TableHead>
                <TableHead className="text-center border border-border w-10">JML</TableHead>
                <TableHead className="text-center border border-border w-10">L</TableHead>
                <TableHead className="text-center border border-border w-10">P</TableHead>
                <TableHead className="text-center border border-border w-10">JML</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanData.map((row, index) => (
                <TableRow key={row.rt} className="hover:bg-card/50">
                  <TableCell className="text-center border border-border">{index + 1}</TableCell>
                  <TableCell className="text-center font-semibold whitespace-nowrap border border-border">
                    RT. {row.rt}
                  </TableCell>
                  {/* Jumlah Bulan Lalu */}
                  <TableCell className="text-center border border-border">
                    {renderEditableCell("jumlahLaluL", row.jumlahLaluL, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border">
                    {renderEditableCell("jumlahLaluP", row.jumlahLaluP, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border font-semibold">
                    {row.jumlahLaluTotal || (row.jumlahLaluL + row.jumlahLaluP)}
                  </TableCell>
                  {/* Lahir */}
                  <TableCell className="text-center border border-border bg-green-500/5">
                    {renderEditableCell("lahirL", row.lahirL, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-green-500/5">
                    {renderEditableCell("lahirP", row.lahirP, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-green-500/5 font-semibold">
                    {row.lahirTotal || (row.lahirL + row.lahirP)}
                  </TableCell>
                  {/* Mati */}
                  <TableCell className="text-center border border-border bg-red-500/5">
                    {renderEditableCell("matiL", row.matiL, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-red-500/5">
                    {renderEditableCell("matiP", row.matiP, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-red-500/5 font-semibold">
                    {row.matiTotal || (row.matiL + row.matiP)}
                  </TableCell>
                  {/* Datang */}
                  <TableCell className="text-center border border-border bg-blue-500/5">
                    {renderEditableCell("datangL", row.datangL, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-blue-500/5">
                    {renderEditableCell("datangP", row.datangP, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-blue-500/5 font-semibold">
                    {row.datangTotal || (row.datangL + row.datangP)}
                  </TableCell>
                  {/* Pindah */}
                  <TableCell className="text-center border border-border bg-yellow-500/5">
                    {renderEditableCell("pindahL", row.pindahL, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-yellow-500/5">
                    {renderEditableCell("pindahP", row.pindahP, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-yellow-500/5 font-semibold">
                    {row.pindahTotal || (row.pindahL + row.pindahP)}
                  </TableCell>
                  {/* Jumlah Bulan Ini */}
                  <TableCell className="text-center border border-border font-semibold">
                    {row.jumlahIniL}
                  </TableCell>
                  <TableCell className="text-center border border-border font-semibold">
                    {row.jumlahIniP}
                  </TableCell>
                  <TableCell className="text-center border border-border font-bold">
                    {row.jumlahIniTotal || (row.jumlahIniL + row.jumlahIniP)}
                  </TableCell>
                  {/* KK & KTP */}
                  <TableCell className="text-center border border-border">
                    {renderEditableCell("jumlahKK", row.jumlahKK, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border">
                    {renderEditableCell("wajibKTP", row.wajibKTP, row.rt)}
                  </TableCell>
                  {/* Punya */}
                  <TableCell className="text-center border border-border bg-green-500/10">
                    {renderEditableCell("punyaKTP", row.punyaKTP, row.rt)}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-green-500/10">
                    {renderEditableCell("punyaKK", row.punyaKK, row.rt)}
                  </TableCell>
                  {/* Belum */}
                  <TableCell className="text-center border border-border bg-red-500/10">
                    {row.belumKTP}
                  </TableCell>
                  <TableCell className="text-center border border-border bg-red-500/10">
                    {row.belumKK}
                  </TableCell>
                  {/* Aksi */}
                  {isAdmin && (
                    <TableCell className="text-center border border-border">
                      {editingRT === row.rt ? (
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleSaveEdit}
                            className="h-7 px-2 bg-primary text-primary-foreground"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRT(null);
                              setEditFormData(null);
                            }}
                            className="h-7 px-2"
                          >
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(row.rt)}
                          className="h-7 px-2"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Total Row */}
              {totals && (
                <TableRow className="bg-secondary/70 hover:bg-secondary/70 font-bold">
                  <TableCell colSpan={2} className="text-center border border-border">JUMLAH</TableCell>
                  <TableCell className="text-center border border-border">{totals.jumlahLaluL}</TableCell>
                  <TableCell className="text-center border border-border">{totals.jumlahLaluP}</TableCell>
                  <TableCell className="text-center border border-border">{totals.jumlahLaluTotal}</TableCell>
                  <TableCell className="text-center border border-border bg-green-500/5">{totals.lahirL}</TableCell>
                  <TableCell className="text-center border border-border bg-green-500/5">{totals.lahirP}</TableCell>
                  <TableCell className="text-center border border-border bg-green-500/5">{totals.lahirTotal}</TableCell>
                  <TableCell className="text-center border border-border bg-red-500/5">{totals.matiL}</TableCell>
                  <TableCell className="text-center border border-border bg-red-500/5">{totals.matiP}</TableCell>
                  <TableCell className="text-center border border-border bg-red-500/5">{totals.matiTotal}</TableCell>
                  <TableCell className="text-center border border-border bg-blue-500/5">{totals.datangL}</TableCell>
                  <TableCell className="text-center border border-border bg-blue-500/5">{totals.datangP}</TableCell>
                  <TableCell className="text-center border border-border bg-blue-500/5">{totals.datangTotal}</TableCell>
                  <TableCell className="text-center border border-border bg-yellow-500/5">{totals.pindahL}</TableCell>
                  <TableCell className="text-center border border-border bg-yellow-500/5">{totals.pindahP}</TableCell>
                  <TableCell className="text-center border border-border bg-yellow-500/5">{totals.pindahTotal}</TableCell>
                  <TableCell className="text-center border border-border">{totals.jumlahIniL}</TableCell>
                  <TableCell className="text-center border border-border">{totals.jumlahIniP}</TableCell>
                  <TableCell className="text-center border border-border">{totals.jumlahIniTotal}</TableCell>
                  <TableCell className="text-center border border-border">{totals.jumlahKK}</TableCell>
                  <TableCell className="text-center border border-border">{totals.wajibKTP}</TableCell>
                  <TableCell className="text-center border border-border bg-green-500/10">{totals.punyaKTP}</TableCell>
                  <TableCell className="text-center border border-border bg-green-500/10">{totals.punyaKK}</TableCell>
                  <TableCell className="text-center border border-border bg-red-500/10">{totals.belumKTP}</TableCell>
                  <TableCell className="text-center border border-border bg-red-500/10">{totals.belumKK}</TableCell>
                  {isAdmin && <TableCell className="border border-border"></TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      </>
      )}

      {/* Event Modal */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Data " : "Tambah Data "}
              {eventFormData.jenis === "lahir" && "Kelahiran"}
              {eventFormData.jenis === "mati" && "Kematian"}
              {eventFormData.jenis === "datang" && "Kedatangan"}
              {eventFormData.jenis === "pindah" && "Kepindahan"}
            </DialogTitle>
            <DialogDescription>
              Isi data dengan lengkap dan benar
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIK</Label>
                <Input
                  value={eventFormData.nik}
                  onChange={(e) => setEventFormData({ ...eventFormData, nik: e.target.value })}
                  placeholder="16 digit NIK"
                  maxLength={16}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input
                  value={eventFormData.nama}
                  onChange={(e) => setEventFormData({ ...eventFormData, nama: e.target.value })}
                  placeholder="Nama lengkap"
                  className="bg-secondary border-border"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select 
                  value={eventFormData.gender} 
                  onValueChange={(v) => setEventFormData({ ...eventFormData, gender: v })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Pilih JK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tempat Lahir</Label>
                <Input
                  value={eventFormData.tempatLahir}
                  onChange={(e) => setEventFormData({ ...eventFormData, tempatLahir: e.target.value })}
                  placeholder="Tempat lahir"
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={eventFormData.tanggalLahir}
                  onChange={(e) => setEventFormData({ ...eventFormData, tanggalLahir: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Event</Label>
                <Input
                  type="date"
                  value={eventFormData.tanggalEvent}
                  onChange={(e) => setEventFormData({ ...eventFormData, tanggalEvent: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input
                value={eventFormData.alamat}
                onChange={(e) => setEventFormData({ ...eventFormData, alamat: e.target.value })}
                placeholder="Alamat lengkap"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RT</Label>
                <Input
                  value={eventFormData.rt}
                  onChange={(e) => setEventFormData({ ...eventFormData, rt: e.target.value })}
                  placeholder="RT"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>RW</Label>
                <Input
                  value={eventFormData.rw}
                  onChange={(e) => setEventFormData({ ...eventFormData, rw: e.target.value })}
                  placeholder="RW"
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            {(eventFormData.jenis === "lahir" || eventFormData.jenis === "datang") && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Ayah</Label>
                    <Input
                      value={eventFormData.namaAyah}
                      onChange={(e) => setEventFormData({ ...eventFormData, namaAyah: e.target.value })}
                      placeholder="Nama ayah"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Ibu</Label>
                    <Input
                      value={eventFormData.namaIbu}
                      onChange={(e) => setEventFormData({ ...eventFormData, namaIbu: e.target.value })}
                      placeholder="Nama ibu"
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                value={eventFormData.keterangan}
                onChange={(e) => setEventFormData({ ...eventFormData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan"
                className="bg-secondary border-border"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEventModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                {editingEvent ? "Simpan Perubahan" : "Tambah Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Surat Pengantar Section
function SuratPengantarSection({
  villageSettings,
}: {
  villageSettings: VillageSettings;
}) {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [letterNumber, setLetterNumber] = useState("");
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split("T")[0]);
  const [letterType, setLetterType] = useState("domisili");
  const [recipientName, setRecipientName] = useState("");
  const [recipientNIK, setRecipientNIK] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [letterPurpose, setLetterPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [paperSize, setPaperSize] = useState<"A4" | "F4">("A4");
  const [showPreview, setShowPreview] = useState(false);

  const getLetterTitle = () => {
    const titles: Record<string, string> = {
      domisili: "Surat Keterangan Domisili",
      tidak_mampu: "Surat Keterangan Tidak Mampu",
      usaha: "Surat Keterangan Usaha",
      pengantar: "Surat Pengantar",
      kelahiran: "Surat Keterangan Kelahiran",
      kematian: "Surat Keterangan Kematian",
    };
    return titles[letterType] || "Surat Pengantar";
  };

  const handleDownloadDOCX = async () => {
    if (!letterNumber || !letterDate || !recipientName) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon lengkapi nomor surat, tanggal, dan nama penerima",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/surat/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterType,
          letterNumber,
          letterDate,
          recipientName,
          recipientNIK,
          recipientAddress,
          letterPurpose,
          paperSize,
          villageSettings,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${getLetterTitle().replace(/\s/g, "_")}_${letterNumber}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Surat Berhasil Dibuat",
          description: "File DOCX berhasil diunduh",
        });
      } else {
        throw new Error("Failed to generate letter");
      }
    } catch (error) {
      console.error("Error generating letter:", error);
      toast({
        title: "Gagal",
        description: "Gagal membuat surat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Form Surat Pengantar
            </CardTitle>
            <CardDescription>
              Isi data untuk membuat surat pengantar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bulan Laporan</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2022, 2023, 2024, 2025].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Jenis Surat</Label>
              <Select value={letterType} onValueChange={setLetterType}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domisili">Surat Keterangan Domisili</SelectItem>
                  <SelectItem value="tidak_mampu">Surat Keterangan Tidak Mampu</SelectItem>
                  <SelectItem value="usaha">Surat Keterangan Usaha</SelectItem>
                  <SelectItem value="pengantar">Surat Pengantar</SelectItem>
                  <SelectItem value="kelahiran">Surat Keterangan Kelahiran</SelectItem>
                  <SelectItem value="kematian">Surat Keterangan Kematian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor Surat</Label>
                <Input
                  placeholder="Contoh: 001/SK/I/2024"
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Surat</Label>
                <Input
                  type="date"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Nama Penerima</Label>
              <Input
                placeholder="Nama lengkap penerima surat"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>NIK Penerima</Label>
              <Input
                placeholder="16 digit NIK"
                maxLength={16}
                value={recipientNIK}
                onChange={(e) => setRecipientNIK(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Alamat</Label>
              <Textarea
                placeholder="Alamat lengkap penerima"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="bg-secondary border-border"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Keperluan</Label>
              <Textarea
                placeholder="Keperluan pembuatan surat"
                value={letterPurpose}
                onChange={(e) => setLetterPurpose(e.target.value)}
                className="bg-secondary border-border"
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Ukuran Kertas</Label>
              <div className="flex gap-2">
                <Button
                  variant={paperSize === "A4" ? "default" : "outline"}
                  onClick={() => setPaperSize("A4")}
                  className={paperSize === "A4" ? "bg-primary text-primary-foreground" : ""}
                >
                  A4
                </Button>
                <Button
                  variant={paperSize === "F4" ? "default" : "outline"}
                  onClick={() => setPaperSize("F4")}
                  className={paperSize === "F4" ? "bg-primary text-primary-foreground" : ""}
                >
                  F4 (Folio)
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? "Sembunyikan" : "Preview"}
              </Button>
              <Button
                onClick={handleDownloadDOCX}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download DOCX
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Preview Surat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white text-black p-6 rounded-lg text-sm leading-relaxed">
                <div className="text-center mb-6">
                  <h2 className="font-bold text-lg">PEMERINTAH KABUPATEN {villageSettings.kabupaten.toUpperCase()}</h2>
                  <h2 className="font-bold text-lg">KECAMATAN {villageSettings.kecamatan.toUpperCase()}</h2>
                  <h2 className="font-bold text-lg">DESA {villageSettings.namaDesa.toUpperCase()}</h2>
                  <p className="text-sm">{villageSettings.alamat}</p>
                </div>

                <Separator className="my-4 bg-gray-300" />

                <div className="text-center mb-6">
                  <h3 className="font-bold text-lg underline">{getLetterTitle().toUpperCase()}</h3>
                  <p className="text-sm">Nomor: {letterNumber || "........................."}</p>
                </div>

                <div className="mb-6">
                  <p className="mb-4">Yang bertanda tangan di bawah ini, {villageSettings.kepalaDesa}, Kepala Desa {villageSettings.namaDesa}, Kecamatan {villageSettings.kecamatan}, Kabupaten {villageSettings.kabupaten}, menerangkan bahwa:</p>

                  <table className="w-full mb-4">
                    <tbody>
                      <tr>
                        <td className="w-32">Nama</td>
                        <td className="w-4">:</td>
                        <td>{recipientName || "................................."}</td>
                      </tr>
                      <tr>
                        <td>NIK</td>
                        <td>:</td>
                        <td>{recipientNIK || "................................."}</td>
                      </tr>
                      <tr>
                        <td>Alamat</td>
                        <td>:</td>
                        <td>{recipientAddress || "................................."}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="mb-4">Adalah benar warga Desa {villageSettings.namaDesa} yang tersebut di atas.</p>

                  <p>Surat keterangan ini dibuat untuk keperluan: {letterPurpose || "...................................................."}</p>
                </div>

                <div className="flex justify-end mt-12">
                  <div className="text-center">
                    <p>{villageSettings.namaDesa}, {formatFullDate(letterDate)}</p>
                    <p>Kepala Desa {villageSettings.namaDesa}</p>
                    <div className="h-20" />
                    <p className="font-bold underline">{villageSettings.kepalaDesa}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Pengaturan Section
function PengaturanSection({
  isAdmin,
  villageSettings,
  onUpdateSettings,
  user,
  onUserUpdate,
}: {
  isAdmin: boolean;
  villageSettings: VillageSettings;
  onUpdateSettings: (settings: VillageSettings) => void;
  user: User | null;
  onUserUpdate: (user: User) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(villageSettings);
  const [adminData, setAdminData] = useState({
    username: "",
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync formData with villageSettings when it changes
  useEffect(() => {
    setFormData(villageSettings);
  }, [villageSettings]);

  // Fetch admin data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/name");
      const data = await res.json();
      if (data.success && data.data) {
        setAdminData(prev => ({
          ...prev,
          username: data.data.username,
          name: data.data.name,
        }));
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Terlalu Besar",
        description: "Ukuran file maksimal 2MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "File Tidak Valid",
        description: "Hanya file gambar yang diizinkan",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData({ ...formData, logo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    if (!isAdmin) {
      toast({
        title: "Akses Ditolak",
        description: "Hanya admin yang dapat mengubah pengaturan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kepalaDesa: formData.kepalaDesa,
          sekretarisDesa: formData.sekretaris,
          kasiPemerintahan: formData.kasiPemerintahan,
          themeColor: formData.themeColor,
          themeMode: formData.themeMode,
          desaName: formData.namaDesa,
          kecamatanName: formData.kecamatan,
          kabupatenName: formData.kabupaten,
          alamatDesa: formData.alamat,
          logo: formData.logo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onUpdateSettings(formData);
        // Apply theme color to CSS variable
        document.documentElement.style.setProperty('--primary', formData.themeColor);
        // Apply theme mode
        if (formData.themeMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        toast({
          title: "Pengaturan Disimpan",
          description: "Pengaturan desa berhasil diperbarui",
        });
      } else {
        throw new Error(data.error || "Gagal menyimpan pengaturan");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Gagal",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    // Validate passwords match if changing password
    if (adminData.newPassword && adminData.newPassword !== adminData.confirmPassword) {
      toast({
        title: "Password Tidak Cocok",
        description: "Konfirmasi password tidak sesuai",
        variant: "destructive",
      });
      return;
    }

    // Validate current password if changing username or password
    if ((adminData.newPassword || adminData.username !== user?.name?.toLowerCase().replace(/\s/g, '')) && !adminData.currentPassword) {
      toast({
        title: "Password Diperlukan",
        description: "Masukkan password saat ini untuk mengubah username atau password",
        variant: "destructive",
      });
      return;
    }

    setAdminLoading(true);
    try {
      const res = await fetch("/api/admin/name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminData.name,
          username: adminData.username,
          currentPassword: adminData.currentPassword || undefined,
          newPassword: adminData.newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onUserUpdate(data.user);
        // Reset password fields
        setAdminData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        toast({
          title: "Akun Diperbarui",
          description: "Data akun admin berhasil diubah. Gunakan kredensial baru untuk login selanjutnya.",
        });
      } else {
        throw new Error(data.error || "Gagal mengubah data akun");
      }
    } catch (error) {
      console.error("Error updating admin credentials:", error);
      toast({
        title: "Gagal",
        description: error instanceof Error ? error.message : "Gagal mengubah data akun",
        variant: "destructive",
      });
    } finally {
      setAdminLoading(false);
    }
  };

  const themeColors = [
    { name: "Emerald", value: "#00d4aa" },
    { name: "Blue", value: "#4da6ff" },
    { name: "Purple", value: "#a855f7" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Cyan", value: "#06b6d4" },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Account Settings */}
      {isAdmin && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Pengaturan Akun Admin
            </CardTitle>
            <CardDescription>
              Ubah nama, username, dan password akun admin. Kredensial baru dapat digunakan saat login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateAdminCredentials} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Tampilan</Label>
                  <Input
                    type="text"
                    placeholder="Nama tampilan"
                    value={adminData.name}
                    onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username (untuk login)</Label>
                  <Input
                    type="text"
                    placeholder="Username login"
                    value={adminData.username}
                    onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-base font-medium">Ubah Password (Opsional)</Label>
                <p className="text-xs text-muted-foreground">
                  Masukkan password saat ini jika ingin mengubah username atau password
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Password Saat Ini</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={adminData.currentPassword}
                    onChange={(e) => setAdminData({ ...adminData, currentPassword: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password Baru</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={adminData.newPassword}
                    onChange={(e) => setAdminData({ ...adminData, newPassword: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={adminData.confirmPassword}
                    onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <Button type="submit" disabled={adminLoading}>
                {adminLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan Perubahan Akun
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Village Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informasi Desa
          </CardTitle>
          <CardDescription>
            Data profil desa untuk dokumen dan surat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Logo Desa</Label>
            <p className="text-xs text-muted-foreground">
              Logo akan ditampilkan di halaman login dan header aplikasi
            </p>
            <div className="flex items-center gap-4">
              {formData.logo ? (
                <div className="relative">
                  <img 
                    src={formData.logo} 
                    alt="Logo Desa" 
                    className="w-20 h-20 rounded-xl object-contain bg-secondary border border-border"
                  />
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => setFormData({ ...formData, logo: null })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {isAdmin && (
                <>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Format: JPG, PNG, GIF. Maksimal 2MB. Disarankan gambar persegi.
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Desa</Label>
              <Input
                value={formData.namaDesa}
                onChange={(e) => setFormData({ ...formData, namaDesa: e.target.value })}
                className="bg-secondary border-border"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Kecamatan</Label>
              <Input
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="bg-secondary border-border"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Kabupaten</Label>
              <Input
                value={formData.kabupaten}
                onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                className="bg-secondary border-border"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="bg-secondary border-border"
                disabled={!isAdmin}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kepala Desa</Label>
              <Input
                value={formData.kepalaDesa}
                onChange={(e) => setFormData({ ...formData, kepalaDesa: e.target.value })}
                className="bg-secondary border-border"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Sekretaris</Label>
              <Input
                value={formData.sekretaris}
                onChange={(e) => setFormData({ ...formData, sekretaris: e.target.value })}
                className="bg-secondary border-border"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Kasi Pemerintahan</Label>
              <Input
                value={formData.kasiPemerintahan}
                onChange={(e) => setFormData({ ...formData, kasiPemerintahan: e.target.value })}
                className="bg-secondary border-border"
                disabled={!isAdmin}
              />
            </div>
          </div>

          {isAdmin && (
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan Pengaturan
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Tema Aplikasi
          </CardTitle>
          <CardDescription>
            Pilih mode dan warna tema untuk tampilan aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Mode Toggle */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Mode Tampilan</Label>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (isAdmin) {
                    const newSettings = { ...formData, themeMode: 'light' as const };
                    setFormData(newSettings);
                    document.documentElement.classList.remove('dark');
                    onUpdateSettings(newSettings);
                    // Auto-save theme mode
                    try {
                      await fetch("/api/settings", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ themeMode: 'light' }),
                      });
                    } catch (e) { console.error(e); }
                  }
                }}
                disabled={!isAdmin}
                className={`flex items-center gap-3 px-5 py-4 rounded-lg border transition-all ${
                  formData.themeMode === 'light'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                } ${!isAdmin ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <Sun className="w-5 h-5 text-yellow-500" />
                <div className="text-left">
                  <p className="font-medium">Terang</p>
                  <p className="text-xs text-muted-foreground">Tampilan cerah</p>
                </div>
              </button>
              <button
                onClick={async () => {
                  if (isAdmin) {
                    const newSettings = { ...formData, themeMode: 'dark' as const };
                    setFormData(newSettings);
                    document.documentElement.classList.add('dark');
                    onUpdateSettings(newSettings);
                    // Auto-save theme mode
                    try {
                      await fetch("/api/settings", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ themeMode: 'dark' }),
                      });
                    } catch (e) { console.error(e); }
                  }
                }}
                disabled={!isAdmin}
                className={`flex items-center gap-3 px-5 py-4 rounded-lg border transition-all ${
                  formData.themeMode === 'dark'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                } ${!isAdmin ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <Moon className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <p className="font-medium">Gelap</p>
                  <p className="text-xs text-muted-foreground">Tampilan gelap</p>
                </div>
              </button>
            </div>
          </div>

          <Separator />

          {/* Theme Colors */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Warna Tema</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={async () => {
                    if (isAdmin) {
                      const newSettings = { ...formData, themeColor: color.value };
                      setFormData(newSettings);
                      document.documentElement.style.setProperty('--primary', color.value);
                      onUpdateSettings(newSettings);
                      // Auto-save theme color
                      try {
                        await fetch("/api/settings", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ themeColor: color.value }),
                        });
                      } catch (e) { console.error(e); }
                    }
                  }}
                  disabled={!isAdmin}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                    formData.themeColor === color.value
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  } ${!isAdmin ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-xs">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {isAdmin && (
            <Button onClick={handleSaveSettings} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan Pengaturan Tema
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Main App Component
export default function PendudukApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statistik, setStatistik] = useState<Statistik>({
    total: 0,
    male: 0,
    female: 0,
    totalRT: 0,
  });
  const [rts, setRts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [villageSettings, setVillageSettings] = useState<VillageSettings>({
    namaDesa: "Cidahu",
    kecamatan: "Cidahu",
    kabupaten: "Sukabumi",
    alamat: "Jl. Raya Cidahu No. 1",
    kepalaDesa: "H. Asep Suparman",
    sekretaris: "Iis Siti Aminah",
    kasiPemerintahan: "Dadang Hermawan",
    themeColor: "#00d4aa",
    themeMode: "dark",
    logo: null,
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.data) {
        const settings: VillageSettings = {
          namaDesa: data.data.desaName || "Cidahu",
          kecamatan: data.data.kecamatanName || "Cidahu",
          kabupaten: data.data.kabupatenName || "Sukabumi",
          alamat: data.data.alamatDesa || "Jl. Raya Cidahu No. 1",
          kepalaDesa: data.data.kepalaDesa || "H. Asep Suparman",
          sekretaris: data.data.sekretarisDesa || "Iis Siti Aminah",
          kasiPemerintahan: data.data.kasiPemerintahan || "Dadang Hermawan",
          themeColor: data.data.themeColor || "#00d4aa",
          themeMode: (data.data.themeMode as 'light' | 'dark') || "dark",
          logo: data.data.logo || null,
        };
        setVillageSettings(settings);
        // Apply theme color to CSS variable
        document.documentElement.style.setProperty('--primary', settings.themeColor);
        // Apply theme mode
        if (settings.themeMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  const fetchStatistik = useCallback(async () => {
    try {
      const res = await fetch("/api/statistik");
      const data = await res.json();
      setStatistik({
        total: data.total,
        male: data.male,
        female: data.female,
        totalRT: data.totalRT,
      });
      if (data.rts) {
        setRts(data.rts);
      }
    } catch (error) {
      console.error("Error fetching statistik:", error);
    }
  }, []);

  const fetchPublicSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/public");
      const data = await res.json();
      if (data.success && data.data) {
        const settings: VillageSettings = {
          namaDesa: data.data.desaName || "Cidahu",
          kecamatan: data.data.kecamatanName || "Cidahu",
          kabupaten: data.data.kabupatenName || "Sukabumi",
          alamat: data.data.alamatDesa || "Jl. Raya Cidahu No. 1",
          kepalaDesa: data.data.kepalaDesa || "H. Asep Suparman",
          sekretaris: "Iis Siti Aminah",
          kasiPemerintahan: "Dadang Hermawan",
          themeColor: data.data.themeColor || "#00d4aa",
          themeMode: (data.data.themeMode as 'light' | 'dark') || "dark",
          logo: data.data.logo || null,
        };
        setVillageSettings(settings);
        // Apply theme color to CSS variable
        document.documentElement.style.setProperty('--primary', settings.themeColor);
        // Apply theme mode
        if (settings.themeMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error("Error fetching public settings:", error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetch("/api/seed").catch(console.error);
    fetchPublicSettings(); // Fetch public settings early for login screen
  }, [checkAuth, fetchPublicSettings]);

  useEffect(() => {
    if (user) {
      fetchStatistik();
      fetchSettings();
    }
  }, [user, fetchStatistik, fetchSettings]);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const handlePublicAccess = () => {
    setUser({ name: "Masyarakat Umum", role: "public" });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          onPublicAccess={handlePublicAccess}
          villageSettings={villageSettings}
        />
        <Toaster />
      </>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {villageSettings.logo ? (
                <img 
                  src={villageSettings.logo} 
                  alt="Logo Desa" 
                  className="w-10 h-10 rounded-xl object-contain bg-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-emerald-600">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="font-display text-lg font-bold">SIKDAHU</h1>
                <p className="text-xs text-muted-foreground">
                  Sistem Informasi Kependudukan {villageSettings.namaDesa}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  const newMode = villageSettings.themeMode === 'dark' ? 'light' : 'dark';
                  const newSettings = { ...villageSettings, themeMode: newMode };
                  setVillageSettings(newSettings);
                  if (newMode === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  // Save to backend
                  try {
                    await fetch("/api/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ themeMode: newMode }),
                    });
                  } catch (e) { console.error(e); }
                }}
                className="h-9 w-9"
                title={villageSettings.themeMode === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              >
                {villageSettings.themeMode === 'dark' ? (
                  <Sun className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-400" />
                )}
              </Button>

              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                <UserCheck className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{user.name}</span>
                {isAdmin && (
                  <Badge className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground text-xs">
                    Admin
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                className="text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-card border border-border">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="data-penduduk" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Data Penduduk</span>
            </TabsTrigger>
            <TabsTrigger value="laporan-bulanan" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Laporan Bulanan</span>
            </TabsTrigger>
            <TabsTrigger value="surat-pengantar" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Surat Pengantar</span>
            </TabsTrigger>
            <TabsTrigger value="pengaturan" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Pengaturan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardSection statistik={statistik} onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="data-penduduk">
            <DataPendudukSection isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="laporan-bulanan">
            <LaporanBulananSection isAdmin={isAdmin} rts={rts} />
          </TabsContent>

          <TabsContent value="surat-pengantar">
            <SuratPengantarSection villageSettings={villageSettings} />
          </TabsContent>

          <TabsContent value="pengaturan">
            <PengaturanSection
              isAdmin={isAdmin}
              villageSettings={villageSettings}
              onUpdateSettings={setVillageSettings}
              user={user}
              onUserUpdate={setUser}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            SIKDAHU - Sistem Informasi Kependudukan {villageSettings.namaDesa} &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
