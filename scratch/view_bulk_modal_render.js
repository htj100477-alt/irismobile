const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/admin/dashboard/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Search between 7767 and 8235 for map or list rendering
for (let i = 7767; i < 8235; i++) {
  if (lines[i].includes('.map(')) {
    console.log(`${i + 1}: ${lines[i].trim()}`);
  }
}
