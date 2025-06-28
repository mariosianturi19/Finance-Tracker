// manual-scheduler.js
// Manual scheduler - hanya untuk trigger manual, TIDAK otomatis

const http = require('http');
require('dotenv').config();

console.log('📋 Manual Scheduler for Finance Reports');
console.log('======================================');
console.log('⚠️  CATATAN: Ini adalah manual scheduler');
console.log('   Tidak ada jadwal otomatis yang berjalan');
console.log('   Laporan hanya dikirim ketika dipanggil manual\n');

const baseUrl = 'http://localhost:3000';

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

// Manual commands
console.log('🔧 Available Commands:');
console.log('   npm run report:weekly   - Send weekly report now');
console.log('   npm run report:monthly  - Send monthly report now');
console.log('\n📋 Production Schedule (when enabled):');
console.log('   📅 Weekly:  Sundays at 23:59 WIB');
console.log('   📅 Monthly: 1st day at 00:01 WIB');

// Export functions for manual use
async function sendWeeklyReport() {
  console.log('\n📊 Sending Weekly Report Manually...');
  try {
    await callEndpoint('/api/reports/weekly', 'Manual Weekly Report');
    console.log('✅ Manual weekly report completed');
  } catch (error) {
    console.error('❌ Manual weekly report failed:', error.message);
  }
}

async function sendMonthlyReport() {
  console.log('\n📊 Sending Monthly Report Manually...');
  try {
    await callEndpoint('/api/reports/monthly', 'Manual Monthly Report');
    console.log('✅ Manual monthly report completed');
  } catch (error) {
    console.error('❌ Manual monthly report failed:', error.message);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'weekly') {
  sendWeeklyReport();
} else if (command === 'monthly') {
  sendMonthlyReport();
} else {
  console.log('\n❌ Usage:');
  console.log('   node manual-scheduler.js weekly   - Send weekly report');
  console.log('   node manual-scheduler.js monthly  - Send monthly report');
  console.log('\n⚠️  Untuk jadwal otomatis, gunakan: node scheduler-standalone.js');
}
