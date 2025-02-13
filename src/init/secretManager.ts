const fs = require('fs');
const path = require('path');

export async function fetchSecret() {
  try {
    const filePath = path.resolve(process.cwd(), 'secrets.json');
    const secretsData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(secretsData);
  } catch (error) {
    console.error('Error reading secrets file:', error);
    throw error;
  }
}
