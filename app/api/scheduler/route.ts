// app/api/scheduler/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { startReportScheduler, stopReportScheduler, getSchedulerStatus } from '@/lib/scheduler';

export async function GET(request: NextRequest) {
  try {
    const status = getSchedulerStatus();
    return NextResponse.json({
      success: true,
      status,
      schedules: {
        weekly: "Sundays at 23:59 WIB",
        monthly: "1st day of month at 00:01 WIB"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'start') {
      startReportScheduler();
      return NextResponse.json({
        success: true,
        message: 'Report scheduler started',
        status: getSchedulerStatus()
      });
    } else if (action === 'stop') {
      stopReportScheduler();
      return NextResponse.json({
        success: true,
        message: 'Report scheduler stopped',
        status: getSchedulerStatus()
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to control scheduler' },
      { status: 500 }
    );
  }
}
