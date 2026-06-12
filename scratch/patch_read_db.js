const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/db.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Normalize CRLF to LF to make search reliable
const normalized = content.replace(/\r\n/g, '\n');

const targetPart = `    if (!parsed.model_pet_names) {
      parsed.model_pet_names = DEFAULT_MODEL_PET_NAMES;
      writeMockDB(parsed);
    }
    return parsed;`;

const replacementPart = `    if (!parsed.model_pet_names) {
      parsed.model_pet_names = DEFAULT_MODEL_PET_NAMES;
      writeMockDB(parsed);
    }
    if (!parsed.admin_menu_permissions) {
      parsed.admin_menu_permissions = [
        { role: 'admin', permissions: { home: true, 'trade-ins': true, products: true, orders: true, prices: true, categories: true, 'hongkong-inventory': true, 'completed-sales': true, 'margin-settlement': true, 'model-pet-names': true, scanner: true, permissions: true, members: true } },
        { role: 'manager', permissions: { home: true, 'trade-ins': true, products: true, orders: true, prices: false, categories: false, 'hongkong-inventory': true, 'completed-sales': true, 'margin-settlement': true, 'model-pet-names': true, scanner: true, permissions: false, members: false } },
        { role: 'staff', permissions: { home: true, 'trade-ins': true, products: false, orders: false, prices: false, categories: false, 'hongkong-inventory': true, 'completed-sales': false, 'margin-settlement': false, 'model-pet-names': false, scanner: true, permissions: false, members: false } },
        { role: 'general', permissions: { home: true, 'trade-ins': false, products: false, orders: false, prices: false, categories: false, 'hongkong-inventory': false, 'completed-sales': false, 'margin-settlement': false, 'model-pet-names': false, scanner: true, permissions: false, members: false } }
      ];
      writeMockDB(parsed);
    }
    return parsed;`;

if (normalized.includes(targetPart)) {
  const index = normalized.indexOf(targetPart);
  const before = content.substring(0, index); // In normalized but index is close. Wait, let's just do it directly on content by stripping \r
  content = normalized.replace(targetPart, replacementPart);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Successfully patched readMockDB in db.ts!');
} else {
  console.log('Target string not found in db.ts');
}
