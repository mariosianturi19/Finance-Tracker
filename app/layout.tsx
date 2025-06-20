import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ThemeProvider = dynamic(() => import('@/components/providers/theme-provider').then(mod => ({ default: mod.ThemeProvider })), {
  ssr: false
});

const AuthProvider = dynamic(() => import('@/components/providers/auth-provider').then(mod => ({ default: mod.AuthProvider })), {
  ssr: false
});

const Toaster = dynamic(() => import('@/components/ui/sonner').then(mod => ({ default: mod.Toaster })), {
  ssr: false
});

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap'
});

// Pindahkan viewport ke export terpisah
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

// Bersihkan metadata dari properti yang deprecated
export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Track your personal finances with ease',
  keywords: ['finance', 'money', 'tracker', 'budget', 'expense'],
  authors: [{ name: 'Finance App' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Finance App',
  },
  // Hapus themeColor dan viewport dari sini
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={inter.className}>
        <Suspense fallback={<LoadingFallback />}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}