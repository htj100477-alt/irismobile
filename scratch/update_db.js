const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/db.ts');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('admin_menu_permissions')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
