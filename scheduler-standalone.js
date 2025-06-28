// scheduler-standalone.js
// Standalone scheduler untuk menjalankan laporan mingguan dan bulanan

const cron = require('node-cron');
const http = require('http');
require('dotenv').config();

console.log('🕐 Starting Finance Tracker Report Scheduler');
console.log('=============================================');
console.log(`Started at: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

async function callEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    console.log(`📊 ${description} - calling ${url.toString()}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`✅ ${description} completed:`, result.summary || result.message);
            resolve(result);
          } else {
            console.error(`❌ ${description} failed:`, result.error);
            reject(new Error(result.error));
          }
        } catch (parseError) {
          console.error(`❌ ${description} parse error:`, parseError.message);
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${description} request error:`, error.message);
      reject(error);
    });

    req.end();
  });
}

// Weekly report scheduler - Every Sunday at 23:59 WIB
console.log('📅 Setting up weekly report scheduler (Sundays at 23:59 WIB)');
cron.schedule('59 23 * * 0', async () => {
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`\n📊 Weekly Report Job Started at ${now}`);
  
  try {
    await callEndpoint('/api/reports/weekly', 'Weekly Report');
    console.log('✅ Weekly report job completed successfully');
  } catch (error) {
    console.error('❌ Weekly report job failed:', error.message);
  }
}, {
  timezone: 'Asia/Jakarta'
});

// Monthly report scheduler - 1st day of every month at 00:01 WIB  
console.log('📅 Setting up monthly report scheduler (1st day at 00:01 WIB)');
cron.schedule('1 0 1 * *', async () => {
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`\n📊 Monthly Report Job Started at ${now}`);
  
  try {
    await callEndpoint('/api/reports/monthly', 'Monthly Report');
    console.log('✅ Monthly report job completed successfully');
  } catch (error) {
    console.error('❌ Monthly report job failed:', error.message);
  }
}, {
  timezone: 'Asia/Jakarta'
});

// Test scheduler (uncomment for testing every minute)
// console.log('🧪 Setting up test scheduler (every minute)');
// cron.schedule('* * * * *', async () => {
//   const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
//   console.log(`\n🧪 Test Job at ${now}`);
//   
//   try {
//     await callEndpoint('/api/reports/weekly', 'Test Weekly Report');
//   } catch (error) {
//     console.error('❌ Test job failed:', error.message);
//   }
// }, {
//   timezone: 'Asia/Jakarta'
// });

console.log('\n✅ Scheduler setup completed!');
console.log('📋 Schedule summary:');
console.log('   📅 Weekly reports: Sundays at 23:59 WIB');
console.log('   📅 Monthly reports: 1st day at 00:01 WIB');
console.log('   🌍 Timezone: Asia/Jakarta');
console.log('\n🚀 Scheduler is now running...');
console.log('   Press Ctrl+C to stop\n');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Scheduler stopping...');
  console.log('✅ Scheduler stopped');
  process.exit(0);
});
