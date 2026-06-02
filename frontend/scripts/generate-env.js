const fs = require('fs');
const path = require('path');

// Trim trailing slashes so a misconfigured env var never produces //api/ URLs
const apiUrl = (process.env.API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const wsUrl  = (process.env.WS_URL  || 'http://localhost:3000').replace(/\/+$/, '');

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  wsUrl: '${wsUrl}',
};
`;

const outPath = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(outPath, content, 'utf8');
console.log(`environment.prod.ts generated — apiUrl: ${apiUrl}`);
