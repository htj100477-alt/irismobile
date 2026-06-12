const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/dashboard/page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('displayLang') && (line.includes('const ') || line.includes('let ') || line.includes('state') || line.includes('State'))) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
