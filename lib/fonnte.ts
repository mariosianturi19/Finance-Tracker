// lib/fonnte.ts - Service untuk integrasi Fonnte WhatsApp API

interface FontteMessage {
  target: string;
  message: string;
  countryCode?: string;
}

interface FontteResponse {
  status: boolean;
  message: string;
  id?: string;
}

class FontteService {
  private token: string;
  private baseUrl = 'https://api.fonnte.com';

  constructor() {
    this.token = process.env.FONNTE_TOKEN || '';
    if (!this.token) {
      console.warn('FONNTE_TOKEN tidak ditemukan di environment variables');
    }
  }

  /**
   * Format nomor WhatsApp ke format internasional
   */
  private formatPhoneNumber(phone: string): string {
    // Hapus karakter non-digit
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Jika dimulai dengan 0, ganti dengan 62
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }
    
    // Jika belum ada kode negara, tambahkan 62
    if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }
    
    return cleanPhone;
  }

  /**
   * Kirim pesan WhatsApp
   */
  async sendMessage(target: string, message: string): Promise<FontteResponse> {
    if (!this.token) {
      throw new Error('Fonnte token tidak tersedia');
    }

    const formattedTarget = this.formatPhoneNumber(target);
    
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: formattedTarget,
          message: message,
          countryCode: '62'
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.reason || 'Gagal mengirim pesan');
      }

      return {
        status: true,
        message: 'Pesan berhasil dikirim',
        id: result.id
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Gagal mengirim pesan'
      };
    }
  }

  /**
   * Template pesan untuk notifikasi transaksi
   */
  generateTransactionMessage(data: {
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    category: string;
    wallet: string;
    note?: string;
    date: Date;
  }): string {
    const { type, amount, category, wallet, note, date } = data;
    
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount / 100);

    const formattedDate = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emoji = type === 'pemasukan' ? '💰' : '💸';
    const typeText = type === 'pemasukan' ? 'PEMASUKAN' : 'PENGELUARAN';

    return `${emoji} *NOTIFIKASI ${typeText}*

📅 Tanggal: ${formattedDate}
💵 Jumlah: ${formattedAmount}
📂 Kategori: ${category}
👛 Dompet: ${wallet}
${note ? `📝 Catatan: ${note}` : ''}

_Pesan otomatis dari Finance Tracker_`;
  }

  /**
   * Template pesan untuk laporan harian
   */
  generateDailyReportMessage(data: {
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
    date: Date;
  }): string {
    const { totalIncome, totalExpense, transactionCount, date } = data;
    
    const formattedIncome = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(totalIncome / 100);

    const formattedExpense = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(totalExpense / 100);

    const balance = totalIncome - totalExpense;
    const formattedBalance = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(balance / 100);

    const formattedDate = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const balanceEmoji = balance >= 0 ? '✅' : '⚠️';

    return `📊 *LAPORAN HARIAN KEUANGAN*

📅 Tanggal: ${formattedDate}

💰 Total Pemasukan: ${formattedIncome}
💸 Total Pengeluaran: ${formattedExpense}
${balanceEmoji} Saldo Bersih: ${formattedBalance}

📈 Total Transaksi: ${transactionCount}

_Laporan otomatis dari Finance Tracker_`;
  }

  /**
   * Cek status device/koneksi
   */
  async checkDeviceStatus(): Promise<{ connected: boolean; device?: string }> {
    if (!this.token) {
      return { connected: false };
    }

    try {
      // Gunakan endpoint validate dengan target dummy untuk cek token
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': this.token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'target=6285173435655' // Dummy target untuk validasi token
      });

      const result = await response.text();
      
      // Jika response OK, berarti token aktif dan device terhubung
      if (response.ok) {
        return {
          connected: true,
          device: 'WhatsApp Business API'
        };
      } else {
        console.log('Device validation response:', result);
        return { connected: false };
      }
    } catch (error) {
      console.error('Error checking device status:', error);
      return { connected: false };
    }
  }
}

// Export singleton instance
export const fontteService = new FontteService();
export default FontteService;
