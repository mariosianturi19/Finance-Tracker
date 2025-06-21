'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { supabase, Profile } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { formatDateTime } from '@/lib/timezone';
import { User, Phone, Mail, Calendar, Save, Lock, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ProfileFormData {
  full_name: string;
  whatsapp_number: string;
}

interface ProfileStats {
  totalTransactions: number;
  activeMonths: number;
  topCategory: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalTransactions: 0,
    activeMonths: 0,
    topCategory: '-'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch,
    formState: { errors, isDirty } 
  } = useForm<ProfileFormData>();

  const watchedValues = watch();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setValue('full_name', data.full_name || '');
        setValue('whatsapp_number', data.whatsapp_number || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch transaction statistics
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('category, created_at')
        .eq('user_id', user?.id);

      if (transactionError) throw transactionError;

      if (transactions) {
        // Calculate total transactions
        const totalTransactions = transactions.length;

        // Calculate active months
        const months = new Set(
          transactions.map(t => new Date(t.created_at).toISOString().slice(0, 7))
        );
        const activeMonths = months.size;

        // Calculate top category
        const categoryCount: { [key: string]: number } = {};
        transactions.forEach(t => {
          categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
        });
        
        const topCategory = Object.keys(categoryCount).reduce((a, b) => 
          categoryCount[a] > categoryCount[b] ? a : b, '-'
        );

        setStats({ totalTransactions, activeMonths, topCategory });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: data.full_name.trim(),
          whatsapp_number: data.whatsapp_number.trim(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Profil berhasil diperbarui');
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (profile) {
      setValue('full_name', profile.full_name || '');
      setValue('whatsapp_number', profile.whatsapp_number || '');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                        <div className="h-10 bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
          <p className="text-muted-foreground">
            Kelola informasi pribadi Anda
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    placeholder="Masukkan nama lengkap"
                    {...register('full_name', { 
                      required: 'Nama lengkap harus diisi',
                      minLength: {
                        value: 2,
                        message: 'Nama lengkap minimal 2 karakter'
                      },
                      maxLength: {
                        value: 100,
                        message: 'Nama lengkap maksimal 100 karakter'
                      }
                    })}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-500">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Nomor WhatsApp
                  </Label>
                  <Input
                    id="whatsapp_number"
                    placeholder="628123456789"
                    {...register('whatsapp_number', { 
                      required: 'Nomor WhatsApp harus diisi',
                      pattern: {
                        value: /^(\+62|62|0)8[1-9][0-9]{6,10}$/,
                        message: 'Format nomor WhatsApp tidak valid (contoh: 628123456789)'
                      }
                    })}
                  />
                  {errors.whatsapp_number && (
                    <p className="text-sm text-red-500">{errors.whatsapp_number.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Format: 628123456789 (tanpa spasi atau tanda hubung)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={saving || !isDirty} 
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                  
                  {isDirty && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleReset}
                      disabled={saving}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informasi Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{user?.email}</span>
                  <Badge variant="secondary" className="text-xs">
                    Tidak dapat diubah
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email tidak dapat diubah untuk menjaga keamanan akun
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status Akun</Label>
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium">Aktif</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Verifikasi Email</Label>
                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {user?.email_confirmed_at ? 'Terverifikasi' : 'Belum Terverifikasi'}
                  </span>
                </div>
              </div>

              {profile && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Bergabung Sejak
                  </Label>
                  <div className="p-3 bg-muted rounded-md">
                    <span className="text-sm">
                      {formatDateTime(profile.created_at)}
                    </span>
                  </div>
                </div>
              )}

              {profile?.updated_at && (
                <div className="space-y-2">
                  <Label>Terakhir Diperbarui</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <span className="text-sm">
                      {formatDateTime(profile.updated_at)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.totalTransactions}
                </p>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.activeMonths}
                </p>
                <p className="text-sm text-muted-foreground">Bulan Aktif</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.topCategory}
                </p>
                <p className="text-sm text-muted-foreground">Kategori Terbanyak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}