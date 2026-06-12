const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/dashboard/page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if ((line.includes('const ') && line.includes(' = memo(')) || (line.includes('function ') && index < 300)) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
