'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const fetchProfile = useCallback(async () => {
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
  }, [user?.id, setValue]);

  const fetchStats = useCallback(async () => {
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
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user, fetchProfile, fetchStats]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return;
    }

    setSaving(true);
    try {
      // Cek apakah profile sudah ada
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Update profile yang sudah ada
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: data.full_name.trim(),
            whatsapp_number: data.whatsapp_number.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Insert profile baru dengan email
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: data.full_name.trim(),
            whatsapp_number: data.whatsapp_number.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

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
        <div className="p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-3">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
                        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
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
      <div className="p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-900/40 dark:to-slate-800/30 min-h-screen">
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Profil</h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Kelola informasi pribadi dan pengaturan akun Anda
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Profile Form */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  <User className="h-6 w-6" />
                  Informasi Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="full_name" className="text-slate-700 dark:text-slate-300">Nama Lengkap</Label>
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
                      className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800"
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-500">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="whatsapp_number" className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
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
                      className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800"
                    />
                    {errors.whatsapp_number && (
                      <p className="text-sm text-red-500">{errors.whatsapp_number.message}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Format: 628123456789 (tanpa spasi atau tanda hubung)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={saving || !isDirty} 
                      className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
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
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  <Shield className="h-6 w-6" />
                  Informasi Akun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Mail className="h-4 w-4" />
                    Email
                    <Lock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  </Label>
                  <div className="flex items-center gap-3 p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm flex-1 text-slate-900 dark:text-slate-100">{user?.email}</span>
                    <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Tidak dapat diubah
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Email tidak dapat diubah untuk menjaga keamanan akun
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-700 dark:text-slate-300">Status Akun</Label>
                  <div className="flex items-center gap-3 p-4 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium">Aktif</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-700 dark:text-slate-300">Verifikasi Email</Label>
                  <div className="flex items-center gap-3 p-4 bg-blue-50/80 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {user?.email_confirmed_at ? 'Terverifikasi' : 'Belum Terverifikasi'}
                    </span>
                  </div>
                </div>

                {profile && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Calendar className="h-4 w-4" />
                      Bergabung Sejak
                    </Label>
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {formatDateTime(profile.created_at)}
                      </span>
                    </div>
                  </div>
                )}

                {profile?.updated_at && (
                  <div className="space-y-3">
                    <Label className="text-slate-700 dark:text-slate-300">Terakhir Diperbarui</Label>
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {formatDateTime(profile.updated_at)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics Card */}
          <Card className="border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Ringkasan Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalTransactions}</div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Total Transaksi</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.activeMonths}</div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">Bulan Aktif</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.topCategory}</div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">Kategori Terfavorit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}