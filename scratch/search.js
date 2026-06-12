const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/dashboard/page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('Storage') || line.includes('admin_') || line.includes('role') || line.includes('user') || line.includes('Token') || line.includes('login') || line.includes('redirect')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
