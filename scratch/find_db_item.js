const fs = require('fs');
const path = require('path');

const dbPath = path.resolve('src/lib/mock-db.json');
if (!fs.existsSync(dbPath)) {
  console.log('mock-db.json not found');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('--- Searching for M900282283 ---');
const itemsBySticker = (db.hongkongInventory || []).filter(x => 
  (x.sticker || '').includes('M900282283') || (x.imei || '').includes('M900282283')
);
console.log('Found by sticker:', JSON.stringify(itemsBySticker, null, 2));

console.log('--- Searching for 93441 ---');
const itemsByQuery = (db.hongkongInventory || []).filter(x => 
  (x.sticker || '').includes('93441') || (x.imei || '').includes('93441')
);
console.log('Found by query 93441:', JSON.stringify(itemsByQuery, null, 2));
