const fs = require('fs');
const path = require('path');

const dbPath = path.resolve('src/lib/db.ts');
const content = fs.readFileSync(dbPath, 'utf8');
const lines = content.split('\n');

for (let i = 989; i < 1040; i++) {
  if (i < lines.length) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
