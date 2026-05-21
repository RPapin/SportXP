const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:3000';
const wsUrl = process.env.WS_URL || apiUrl;

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  wsUrl: '${wsUrl}',
};
`;

const outDir = path.join(__dirname, '..', 'src', 'environments');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'environment.prod.ts'), content);
console.log(`Generated environment.prod.ts with apiUrl=${apiUrl}`);
