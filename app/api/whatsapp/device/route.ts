// app/api/whatsapp/device/route.ts - API endpoint khusus untuk cek status device
import { NextResponse } from 'next/server';
import { fontteService } from '@/lib/fonnte';

export async function GET() {
  try {
    const status = await fontteService.checkDeviceStatus();
    
    return NextResponse.json({
      success: true,
      connected: status.connected,
      device: status.device
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal cek status device' },
      { status: 500 }
    );
  }
}
