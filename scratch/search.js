const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/dashboard/page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('["trade-ins"]') || line.includes("['trade-ins']") || line.includes("activeTab === 'trade-ins'")) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
