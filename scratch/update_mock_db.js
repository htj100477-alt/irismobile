const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/mock-db.json');
if (fs.existsSync(filePath)) {
  const db = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log('Members count:', db.members?.length);
  if (db.members) {
    db.members.forEach(m => {
      console.log(`- ID: ${m.id}, Phone: ${m.phone_number}, Name: ${m.name}, Role: ${m.role}`);
    });
  }
} else {
  console.log('mock-db.json does not exist');
}
