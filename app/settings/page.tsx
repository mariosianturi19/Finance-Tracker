'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, Moon, Bell, Smartphone, Globe, Shield, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);

  const handleExportData = () => {
    toast.success('Fitur ekspor data akan segera tersedia');
  };

  const handleDeleteAccount = () => {
    if (confirm('Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.')) {
      toast.error('Fitur hapus akun akan segera tersedia');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-muted-foreground">
            Kelola preferensi dan pengaturan aplikasi
          </p>
        </div>

        <div className="grid gap-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Tampilan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode Tema</Label>
                  <p className="text-sm text-muted-foreground">
                    Pilih tema yang Anda sukai
                  </p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Terang</SelectItem>
                    <SelectItem value="dark">Gelap</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Terima notifikasi untuk transaksi penting
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Laporan Mingguan</Label>
                  <p className="text-sm text-muted-foreground">
                    Terima ringkasan keuangan via WhatsApp setiap minggu
                  </p>
                </div>
                <Switch
                  checked={weeklyReport}
                  onCheckedChange={setWeeklyReport}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Laporan Bulanan</Label>
                  <p className="text-sm text-muted-foreground">
                    Terima ringkasan keuangan via WhatsApp setiap bulan
                  </p>
                </div>
                <Switch
                  checked={monthlyReport}
                  onCheckedChange={setMonthlyReport}
                />
              </div>
            </CardContent>
          </Card>

          {/* PWA Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Install Aplikasi</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Install aplikasi ke perangkat Anda untuk akses yang lebih mudah
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // PWA install prompt will be handled by the browser
                      toast.info('Gunakan opsi "Tambah ke Layar Utama" di browser Anda');
                    }}
                  >
                    Install Aplikasi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Bahasa & Wilayah
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bahasa</Label>
                  <p className="text-sm text-muted-foreground">
                    Pilih bahasa aplikasi
                  </p>
                </div>
                <Select defaultValue="id">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Zona Waktu</Label>
                  <p className="text-sm text-muted-foreground">
                    Zona waktu untuk menampilkan tanggal dan waktu
                  </p>
                </div>
                <Select defaultValue="asia/jakarta">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia/jakarta">Asia/Jakarta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Format Mata Uang</Label>
                  <p className="text-sm text-muted-foreground">
                    Format tampilan mata uang
                  </p>
                </div>
                <Select defaultValue="idr">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idr">Rupiah (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data & Privasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Ekspor Data</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Unduh semua data transaksi Anda dalam format CSV
                </p>
                <Button variant="outline" onClick={handleExportData}>
                  Ekspor Data
                </Button>
              </div>

              <Separator />

              <div>
                <Label className="text-red-600">Hapus Akun</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Hapus akun dan semua data Anda secara permanen
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Akun
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informasi Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Versi</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Build</span>
                <span>2024.01.01</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform</span>
                <span>Web PWA</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}