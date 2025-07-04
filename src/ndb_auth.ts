// Utility to load NDB credentials from .env
import fs from 'fs';
import path from 'path';

export function getNdbAuthConfig() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const env: Record<string, string> = {};
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      const [k, ...v] = line.split('=');
      env[k.trim()] = v.join('=').trim();
    }
  }
  return {
    token: env.NDB_TOKEN,
    username: env.NDB_USERNAME,
    password: env.NDB_PASSWORD
  };
}
