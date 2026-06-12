const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse env files
function loadEnv() {
  const paths = ['.env', '.env.local', '.env.production', '.env.development'];
  for (const p of paths) {
    const fullPath = path.join(__dirname, '..', p);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value.trim();
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl ? 'Defined' : 'Undefined');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('Supabase credentials not found in env.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  try {
    const { data, error } = await supabase
      .from('admin_menu_permissions')
      .select('*');
    
    if (error) {
      console.log('Error querying admin_menu_permissions:', error.message);
    } else {
      console.log('Successfully queried table. Data:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('Exceptions occurred:', e.message);
  }
}

checkTable();
