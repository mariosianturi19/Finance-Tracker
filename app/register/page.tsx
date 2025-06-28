'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signUp } from '@/lib/auth';
import { toast } from 'sonner';
import { Eye, EyeOff, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
 fullName: z.string().min(2, 'Nama minimal 2 karakter'),
 email: z.string().email('Email tidak valid'),
 password: z.string().min(6, 'Password minimal 6 karakter'),
 whatsappNumber: z.string().min(10, 'Nomor WhatsApp tidak valid').regex(/^[0-9+]+$/, 'Nomor WhatsApp hanya boleh berisi angka dan tanda +'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
   resolver: zodResolver(registerSchema),
 });

 const onSubmit = async (data: RegisterFormData) => {
   setLoading(true);
   try {
     await signUp(data.email, data.password, data.fullName, data.whatsappNumber);
     toast.success('Berhasil mendaftar! Silakan atur sumber saldo Anda.');
     router.push('/wallet-setup');
   } catch (error: any) {
     toast.error(error.message || 'Gagal mendaftar');
   } finally {
     setLoading(false);
   }
 };

 return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50/80 to-gray-100/50 dark:from-slate-900/60 dark:to-slate-800/40 p-4 relative overflow-hidden">
     {/* Background Overlay */}
     <div className="absolute inset-0 bg-slate-100/20 dark:bg-slate-800/20"></div>
     
     <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
       <CardHeader className="text-center space-y-6 pb-8">
         <div className="flex justify-center">
           <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 shadow-lg">
             <Wallet className="h-8 w-8 text-white dark:text-slate-900" />
           </div>
         </div>
         <div className="space-y-2">
           <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bergabung</CardTitle>
           <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
             Buat akun baru untuk mulai mengelola keuangan dengan mudah
           </CardDescription>
         </div>
       </CardHeader>
       <form onSubmit={handleSubmit(onSubmit)}>
         <CardContent className="space-y-6 px-8">
           <div className="space-y-3">
             <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300 font-medium">Nama Lengkap</Label>
             <Input
               id="fullName"
               type="text"
               placeholder="Masukkan nama lengkap"
               {...register('fullName')}
               className={cn(
                 "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 h-12 text-base",
                 errors.fullName && 'border-red-500 dark:border-red-400'
               )}
             />
             {errors.fullName && (
               <p className="text-sm text-red-600 dark:text-red-400">{errors.fullName.message}</p>
             )}
           </div>

           <div className="space-y-3">
             <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email</Label>
             <Input
               id="email"
               type="email"
               placeholder="contoh@email.com"
               {...register('email')}
               className={cn(
                 "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 h-12 text-base",
                 errors.email && 'border-red-500 dark:border-red-400'
               )}
             />
             {errors.email && (
               <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
             )}
           </div>

           <div className="space-y-3">
             <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
             <div className="relative">
               <Input
                 id="password"
                 type={showPassword ? 'text' : 'password'}
                 placeholder="Masukkan password"
                 {...register('password')}
                 className={cn(
                   "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 h-12 text-base pr-12",
                   errors.password && 'border-red-500 dark:border-red-400'
                 )}
               />
               <Button
                 type="button"
                 variant="ghost"
                 size="sm"
                 className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                 onClick={() => setShowPassword(!showPassword)}
               >
                 {showPassword ? (
                   <EyeOff className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                 ) : (
                   <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                 )}
               </Button>
             </div>
             {errors.password && (
               <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
             )}
           </div>

           <div className="space-y-3">
             <Label htmlFor="whatsappNumber" className="text-slate-700 dark:text-slate-300 font-medium">Nomor WhatsApp</Label>
             <Input
               id="whatsappNumber"
               type="text"
               placeholder="+628123456789"
               {...register('whatsappNumber')}
               className={cn(
                 "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 h-12 text-base",
                 errors.whatsappNumber && 'border-red-500 dark:border-red-400'
               )}
             />
             {errors.whatsappNumber && (
               <p className="text-sm text-red-600 dark:text-red-400">{errors.whatsappNumber.message}</p>
             )}
           </div>
         </CardContent>
         <CardFooter className="flex flex-col space-y-6 px-8 pb-8">
           <Button 
             type="submit" 
             className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold text-base shadow-lg" 
             disabled={loading}
           >
             {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
           </Button>
           <p className="text-sm text-center text-slate-600 dark:text-slate-400">
             Sudah punya akun?{' '}
             <Link 
               href="/login" 
               className="text-slate-900 dark:text-slate-100 hover:underline font-semibold transition-colors"
             >
               Masuk di sini
             </Link>
           </p>
         </CardFooter>
       </form>
     </Card>
   </div>
 );
}