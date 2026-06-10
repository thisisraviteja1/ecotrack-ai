const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const envPath = path.join(__dirname, '../.env');

const mode = process.argv[2];

if (mode !== 'sqlite' && mode !== 'postgresql') {
  console.error('Usage: node toggle-db.js <sqlite|postgresql>');
  process.exit(1);
}

try {
  // 1. Toggle schema.prisma provider
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  if (mode === 'sqlite') {
    schemaContent = schemaContent.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    console.log('✔ Toggled Prisma schema provider to SQLite.');
  } else {
    schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    console.log('✔ Toggled Prisma schema provider to PostgreSQL.');
  }
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');

  // 2. Toggle .env connection string
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (mode === 'sqlite') {
    if (!envContent.includes('DATABASE_URL="file:./dev.db"')) {
      // Comment out postgresql URL if present, add sqlite URL
      envContent = envContent.replace(/DATABASE_URL="postgresql:[^"]*"/g, '# DATABASE_URL="postgresql://..."');
      envContent = envContent.replace(/DATABASE_URL="file:[^"]*"/g, '# DATABASE_URL="file:..."');
      envContent += '\nDATABASE_URL="file:./dev.db"\n';
    }
    console.log('✔ Configured local SQLite database file path in .env.');
  } else {
    // Restore postgresql
    envContent = envContent.replace(/DATABASE_URL="file:.*"/g, '# DATABASE_URL="file:./dev.db"');
    if (!envContent.includes('postgresql://')) {
      envContent += '\nDATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecotrack?schema=public"\n';
    }
    console.log('✔ Configured PostgreSQL connection string placeholder in .env.');
  }
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log(`Database configuration toggled to [${mode.toUpperCase()}] successfully!`);
} catch (err) {
  console.error('Error toggling database configurations:', err.message);
  process.exit(1);
}
