// app/api/reports/monthly/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMonthlyReport, generateMonthlyReportMessage } from '@/lib/reports';

// Use service role key for admin access to all users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Monthly report generation started');

    // Get all users who have WhatsApp notifications enabled
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, whatsapp_number')
      .not('whatsapp_number', 'is', null);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No users found with WhatsApp numbers');
      return NextResponse.json({ message: 'No users to send reports to' }, { status: 200 });
    }

    console.log(`👥 Found ${profiles.length} users with WhatsApp enabled`);

    // Calculate last month
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;

    console.log(`📅 Generating reports for ${month}/${year}`);

    const results = [];

    for (const profile of profiles) {
      try {
        // Generate monthly report for user
        const report = await getMonthlyReport(profile.id, year, month);
        const message = generateMonthlyReportMessage(report);

        // Send WhatsApp message
        const response = await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: profile.whatsapp_number,
            message: message
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Monthly report sent to ${profile.whatsapp_number}`);
          results.push({
            userId: profile.id,
            phone: profile.whatsapp_number,
            status: 'sent',
            reportData: {
              month: report.month,
              year: report.year,
              totalIncome: report.totalIncome,
              totalExpense: report.totalExpense,
              netAmount: report.netAmount,
              transactionCount: report.transactionCount
            }
          });
        } else {
          const errorData = await response.json();
          console.error(`❌ Failed to send monthly report to ${profile.whatsapp_number}:`, errorData);
          results.push({
            userId: profile.id,
            phone: profile.whatsapp_number,
            status: 'failed',
            error: errorData.error
          });
        }

        // Add small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (userError) {
        console.error(`❌ Error generating report for user ${profile.id}:`, userError);
        results.push({
          userId: profile.id,
          phone: profile.whatsapp_number,
          status: 'error',
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failureCount = results.filter(r => r.status !== 'sent').length;

    console.log(`📊 Monthly report summary: ${successCount} sent, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Monthly reports processed`,
      summary: {
        total: profiles.length,
        sent: successCount,
        failed: failureCount
      },
      results
    });

  } catch (error: any) {
    console.error('❌ Monthly report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send monthly reports' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/manual trigger
export async function GET(request: NextRequest) {
  return POST(request);
}
