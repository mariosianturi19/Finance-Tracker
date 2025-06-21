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
import { User, Phone, Mail, Calendar, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ProfileFormData {
  full_name: string;
  whatsapp_number: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      fetchProfile();
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
        setValue('full_name', data.full_name);
        setValue('whatsapp_number', data.whatsapp_number);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: data.full_name,
          whatsapp_number: data.whatsapp_number,
        });

      if (error) throw error;

      toast.success('Profil berhasil diperbarui');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setSaving(false);
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
              <Card>
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                      <div className="h-10 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </CardContent>
              </Card>
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
                    {...register('full_name', { required: 'Nama lengkap harus diisi' })}
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
                        value: /^[0-9+]+$/,
                        message: 'Nomor WhatsApp hanya boleh berisi angka dan tanda +'
                      }
                    })}
                  />
                  {errors.whatsapp_number && (
                    <p className="text-sm text-red-500">{errors.whatsapp_number.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Informasi Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status Akun</Label>
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium">Aktif</span>
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
                <p className="text-2xl font-bold text-emerald-600">-</p>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">-</p>
                <p className="text-sm text-muted-foreground">Bulan Aktif</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">-</p>
                <p className="text-sm text-muted-foreground">Kategori Terbanyak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}