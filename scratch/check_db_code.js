const fs = require('fs');
const path = require('path');

const dbPath = path.resolve('src/lib/db.ts');
const content = fs.readFileSync(dbPath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('function get') || line.includes('function save') || line.includes('getHongkongInventory') || line.includes('saveHongkongInventory')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
