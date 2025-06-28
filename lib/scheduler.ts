// lib/scheduler.ts
import * as cron from 'node-cron';

let weeklyJobActive = false;
let monthlyJobActive = false;
let weeklyTask: any = null;
let monthlyTask: any = null;

export function startReportScheduler() {
  console.log('🕐 Starting report scheduler...');

  // Weekly report - Every Sunday at 23:59
  if (!weeklyJobActive) {
    weeklyTask = cron.schedule('59 23 * * 0', async () => {
      console.log('📊 Triggered weekly report job at', new Date().toISOString());
      try {
        const response = await fetch('http://localhost:3001/api/reports/weekly', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Weekly report job completed:', result.summary);
        } else {
          console.error('❌ Weekly report job failed:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Weekly report job error:', error);
      }
    }, {
      timezone: "Asia/Jakarta"
    });
    
    weeklyJobActive = true;
    console.log('✅ Weekly report scheduler started (Sundays at 23:59 WIB)');
  }

  // Monthly report - 1st day of every month at 00:01
  if (!monthlyJobActive) {
    monthlyTask = cron.schedule('1 0 1 * *', async () => {
      console.log('📊 Triggered monthly report job at', new Date().toISOString());
      try {
        const response = await fetch('http://localhost:3001/api/reports/monthly', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Monthly report job completed:', result.summary);
        } else {
          console.error('❌ Monthly report job failed:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Monthly report job error:', error);
      }
    }, {
      timezone: "Asia/Jakarta"
    });
    
    monthlyJobActive = true;
    console.log('✅ Monthly report scheduler started (1st day at 00:01 WIB)');
  }
}

export function stopReportScheduler() {
  console.log('🛑 Stopping report scheduler...');
  
  if (weeklyTask) {
    weeklyTask.stop();
    weeklyTask = null;
  }
  
  if (monthlyTask) {
    monthlyTask.stop();
    monthlyTask = null;
  }
  
  weeklyJobActive = false;
  monthlyJobActive = false;
  console.log('✅ Report scheduler stopped');
}

export function getSchedulerStatus() {
  return {
    weeklyJobActive,
    monthlyJobActive,
    currentTime: new Date().toISOString(),
    timezone: 'Asia/Jakarta'
  };
}
