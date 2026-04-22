require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dt = new Date().toISOString().replace(/[T:]/g, '-').replace(/\..+/, '').slice(0, 19);
const backupDir = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const arquivo = path.join(backupDir, `backup_${dt}.sql`);

try {
  execSync(
    `mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${arquivo}"`,
    { shell: true }
  );
  console.log(`Backup criado: ${arquivo}`);
} catch (err) {
  console.error('Erro no backup:', err.message);
  process.exit(1);
}
