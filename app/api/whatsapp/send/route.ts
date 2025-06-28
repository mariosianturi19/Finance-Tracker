// app/api/whatsapp/send/route.ts - API endpoint untuk mengirim WhatsApp
import { NextRequest, NextResponse } from 'next/server';
import { fontteService } from '@/lib/fonnte';

export async function POST(request: NextRequest) {
  try {
    const { target, message, type, data } = await request.json();

    // Validasi input
    if (!target || (!message && !data)) {
      return NextResponse.json(
        { success: false, message: 'Target dan message/data diperlukan' },
        { status: 400 }
      );
    }

    let finalMessage = message;

    // Generate message berdasarkan type
    if (type && data) {
      switch (type) {
        case 'transaction':
          finalMessage = fontteService.generateTransactionMessage(data);
          break;
        case 'daily-report':
          finalMessage = fontteService.generateDailyReportMessage(data);
          break;
        default:
          finalMessage = message;
      }
    }

    // Kirim pesan
    const result = await fontteService.sendMessage(target, finalMessage);

    if (result.status) {
      return NextResponse.json({
        success: true,
        message: 'Pesan WhatsApp berhasil dikirim',
        id: result.id
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in WhatsApp API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Gagal mengirim pesan' 
      },
      { status: 500 }
    );
  }
}
