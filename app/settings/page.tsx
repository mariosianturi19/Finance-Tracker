'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, Moon, Bell, Smartphone, Shield, Trash2, Download, MessageCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { getTransactions } from '@/lib/transactions';
import { getWallets } from '@/lib/wallets';
import { formatCurrency } from '@/lib/utils';
import { useWhatsApp } from '@/hooks/use-whatsapp';
import { Input } from '@/components/ui/input';
import { getProfile, updateProfile } from '@/lib/profile';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // WhatsApp settings
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [deviceStatus, setDeviceStatus] = useState<{ connected: boolean; device?: string }>({ connected: false });
  const { sendNotification, checkDeviceStatus, sending } = useWhatsApp();

  // Check WhatsApp device status on component mount - ONLY ONCE
  useEffect(() => {
    let isMounted = true;
    
    const checkStatus = async () => {
      if (!isMounted) return;
      
      const status = await checkDeviceStatus();
      if (isMounted) {
        setDeviceStatus(status);
      }
    };
    
    // Hanya check satu kali saat component mount
    checkStatus();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - hanya run sekali

  // Load user profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const profile = await getProfile();
        if (profile) {
          // If WhatsApp number exists, consider notifications enabled
          const hasWhatsApp = !!(profile.whatsapp_number && profile.whatsapp_number.trim());
          setWhatsappEnabled(hasWhatsApp);
          setWhatsappNumber(profile.whatsapp_number || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  // Save WhatsApp settings to profile
  const saveWhatsAppSettings = async (enabled: boolean, number: string) => {
    if (!user) return;

    try {
      await updateProfile({
        whatsapp_number: enabled && number ? number : undefined,
      });
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('Gagal menyimpan pengaturan WhatsApp');
    }
  };

  const handleExportData = async () => {
    if (!user) {
      toast.error('Anda harus login untuk mengekspor data');
      return;
    }

    setExporting(true);
    try {
      // Ambil semua data transaksi dan wallets
      const [transactions, wallets] = await Promise.all([
        getTransactions(),
        getWallets()
      ]);

      // Buat mapping wallet ID ke nama wallet
      const walletMap = new Map();
      wallets.forEach(wallet => {
        walletMap.set(wallet.id, wallet.name);
      });

      // Konversi data ke format CSV yang rapi
      const csvHeaders = [
        'Tanggal',
        'Jenis',
        'Jumlah',
        'Kategori', 
        'Sumber Saldo',
        'Deskripsi'
      ];

      const csvData = transactions.map(transaction => {
        // Format tanggal yang konsisten
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        });

        // Format currency tanpa prefix Rp dan dengan pemisah yang jelas
        const amount = Math.abs(transaction.amount || 0);
        const formattedAmount = (amount / 100).toLocaleString('id-ID', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        // Clean data untuk menghindari masalah CSV
        const cleanText = (text: string | null | undefined) => {
          if (!text) return '';
          return text.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
        };

        return [
          formattedDate,
          transaction.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran', 
          formattedAmount,
          cleanText(transaction.category) || 'Tidak Dikategorikan',
          cleanText(walletMap.get(transaction.wallet_id)) || 'Unknown',
          cleanText(transaction.note) || ''
        ];
      });

      // Format CSV dengan proper escaping
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => {
          // Escape quotes dan wrap dengan quotes jika mengandung koma
          const fieldStr = String(field || '');
          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        }).join(','))
        .join('\n');

      // Generate filename dengan format yang lebih baik
      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');

      // Buat dan download file CSV
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `transaksi-keuangan-${dateStr}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Data berhasil diekspor!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.')) {
      toast.error('Fitur hapus akun akan segera tersedia');
    }
  };

  const handleWhatsappToggle = async () => {
    const newEnabled = !whatsappEnabled;
    setWhatsappEnabled(newEnabled);
    
    // Save to database
    await saveWhatsAppSettings(newEnabled, whatsappNumber);
    
    toast.success(`Notifikasi WhatsApp ${whatsappEnabled ? 'dimatikan' : 'diaktifkan'}`);
    
    // Jika diaktifkan, kirim notifikasi percobaan
    if (newEnabled && user && whatsappNumber) {
      try {
        const testMessage = `🔔 *Notifikasi Diaktifkan*

Anda telah mengaktifkan notifikasi WhatsApp untuk Finance Tracker.

✅ Sistem siap mengirim notifikasi transaksi
📱 Nomor terdaftar: ${whatsappNumber}

_Pesan otomatis dari Finance Tracker_`;
        
        await sendNotification(whatsappNumber, testMessage);
        toast.success('Notifikasi percobaan berhasil dikirim');
      } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        toast.error('Gagal mengirim notifikasi percobaan');
      }
    }
  };

  const handleWhatsappNumberChange = async (value: string) => {
    setWhatsappNumber(value);
    
    // Save to database with debouncing effect
    if (value.length >= 10 || value === '') {
      await saveWhatsAppSettings(whatsappEnabled, value);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pengaturan</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Kelola preferensi dan pengaturan aplikasi Anda
            </p>
          </div>

          <div className="grid gap-8">
            {/* Theme Settings */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  <Moon className="h-6 w-6" />
                  Tampilan
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Mode Tema</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Pilih tema yang Anda sukai
                  </p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[180px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">🌞 Terang</SelectItem>
                    <SelectItem value="dark">🌙 Gelap</SelectItem>
                    <SelectItem value="system">💻 Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                <Bell className="h-6 w-6" />
                Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Notifikasi Push</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Terima notifikasi untuk transaksi penting
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator className="bg-slate-200 dark:bg-slate-700" />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Laporan Mingguan</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Terima ringkasan keuangan via WhatsApp setiap minggu
                  </p>
                </div>
                <Switch
                  checked={weeklyReport}
                  onCheckedChange={setWeeklyReport}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Laporan Bulanan</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
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

          {/* WhatsApp Notifications */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                <MessageCircle className="h-6 w-6" />
                Notifikasi WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Device Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Status Device</Label>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    deviceStatus.connected 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${deviceStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    {deviceStatus.connected ? 'Terhubung' : 'Terputus'}
                  </div>
                </div>
                {deviceStatus.device && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Device: {deviceStatus.device}
                  </p>
                )}
              </div>

              <Separator />

              {/* WhatsApp Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Aktifkan Notifikasi WhatsApp</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Terima notifikasi transaksi via WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={whatsappEnabled}
                    onCheckedChange={handleWhatsappToggle}
                    disabled={!deviceStatus.connected}
                  />
                </div>

                {whatsappEnabled && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Nomor WhatsApp</Label>
                    <Input
                      type="tel"
                      placeholder="08123456789"
                      value={whatsappNumber}
                      onChange={(e) => handleWhatsappNumberChange(e.target.value)}
                      className="border-slate-200 dark:border-slate-700"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Format: 08xx atau 62xx (tanpa spasi atau tanda hubung)
                    </p>
                  </div>
                )}

                {whatsappEnabled && whatsappNumber && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const success = await sendNotification(
                        whatsappNumber,
                        `🎉 *Test Notifikasi Finance Tracker*

Halo! Notifikasi WhatsApp Anda telah berhasil dikonfigurasi.

Anda akan menerima notifikasi untuk:
✅ Transaksi baru
✅ Laporan harian (opsional)
✅ Peringatan penting

_Pesan test dari Finance Tracker_`
                      );
                      
                      if (success) {
                        toast.success('Pesan test berhasil dikirim!');
                      }
                    }}
                    disabled={sending || !deviceStatus.connected}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {sending ? 'Mengirim...' : 'Kirim Pesan Test'}
                  </Button>
                )}

                {!deviceStatus.connected && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ WhatsApp device belum terhubung. Hubungi administrator untuk mengonfigurasi device WhatsApp.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PWA Settings */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                <Smartphone className="h-6 w-6" />
                Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Install Aplikasi</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Install aplikasi ke perangkat Anda untuk akses yang lebih mudah
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // PWA install prompt will be handled by the browser
                      toast.info('Gunakan opsi "Tambah ke Layar Utama" di browser Anda');
                    }}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Install Aplikasi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                <Shield className="h-6 w-6" />
                Data & Privasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium">Ekspor Data</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Unduh semua data transaksi Anda dalam format CSV
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  disabled={exporting}
                  className="gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? 'Mengekspor...' : 'Ekspor Data'}
                </Button>
              </div>

              <Separator className="bg-slate-200 dark:bg-slate-700" />

              <div>
                <Label className="text-red-600 dark:text-red-400 font-medium">Hapus Akun</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Hapus akun dan semua data Anda secara permanen
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="gap-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Akun
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}