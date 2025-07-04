#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';
import https from 'https';
import http from 'http';
import url from 'url';
import path from 'path';
import { stdin as input, stdout as output } from 'process';
import readlineSync from 'readline-sync';

function ask(question, defaultValue, { mask = false } = {}) {
  return new Promise((resolve) => {
    if (!mask) {
      const rl = readline.createInterface({ input, output });
      rl.question(`${question}${defaultValue ? ` [${defaultValue}]` : ''}: `, (answer) => {
        rl.close();
        resolve(answer || defaultValue);
      });
    } else {
      // Masked input for password (no echo, only asterisks)
      const rl = readline.createInterface({ input, output });
      const prompt = `${question}: `;
      process.stdout.write(prompt);
      const wasRaw = process.stdin.isRaw;
      process.stdin.setRawMode(true);
      let value = '';
      process.stdin.resume();
      process.stdin.on('data', onData);
      function onData(char) {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            process.stdin.setRawMode(wasRaw);
            process.stdin.pause();
            process.stdin.removeListener('data', onData);
            rl.close();
            process.stdout.write('\n');
            resolve(value);
            break;
          case '\u0003': // Ctrl+C
            process.stdin.setRawMode(wasRaw);
            process.stdin.pause();
            process.stdin.removeListener('data', onData);
            rl.close();
            process.exit();
            break;
          case '\u007f': // Backspace
            if (value.length > 0) {
              value = value.slice(0, -1);
              process.stdout.clearLine(0);
              process.stdout.cursorTo(prompt.length);
              process.stdout.write('*'.repeat(value.length));
            }
            break;
          default:
            value += char;
            process.stdout.write('*');
            break;
        }
      }
    }
  });
}

function readEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      const [k, ...v] = line.split('=');
      env[k.trim()] = v.join('=').trim();
    }
  }
  return env;
}

async function getToken(baseUrl, username, password, expire, verifySSL) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(`${baseUrl.replace(/\/$/, '')}/era/v0.9/auth/token?expire=${expire}`);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.path,
      method: 'GET',
      rejectUnauthorized: verifySSL,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Content-Type': 'application/json'
      }
    };
    const req = (parsed.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json.token);
          } catch (e) {
            reject('Invalid token response');
          }
        } else {
          reject(`Token request failed: ${res.statusCode} ${data}`);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Ask for environment name
  const envName = await ask('Environment name (leave empty for default)', '');
  const envFile = envName ? `.env.${envName}` : '.env';
  const ENV_PATH = path.resolve(process.cwd(), envFile);

  // Use the rest of the logic as before, but with ENV_PATH
  const current = readEnv(ENV_PATH);
  console.log('--- NDB MCP Server Configuration ---');
  const baseUrl = await ask('NDB Base URL (e.g. https://ndb.example.com:443)', current.NDB_BASE_URL);
  const verifySSL = (await ask('Verify SSL certificate? (yes/no)', current.NDB_VERIFY_SSL === 'false' ? 'no' : 'yes')).toLowerCase() === 'yes';
  const authType = await ask('Authentication type (basic/token)', current.NDB_AUTH_TYPE || 'basic');
  const username = await ask('NDB Username', current.NDB_USERNAME);
  const password = readlineSync.question('NDB Password: ', { hideEchoBack: true });
  let token = '';
  if (authType === 'token') {
    const tokenExpire = await ask('Token expiration in minutes (-1 for unlimited)', '5');
    try {
      token = await getToken(baseUrl, username, password, tokenExpire, verifySSL);
      console.log('Token generated successfully.');
    } catch (e) {
      console.error('Failed to generate token:', e);
      process.exit(1);
    }
  }
  // Compose .env
  const env = [
    `NDB_BASE_URL=${baseUrl}`,
    `NDB_VERIFY_SSL=${verifySSL}`,
    authType === 'token' ? `NDB_TOKEN=${token}` : `NDB_USERNAME=${username}`,
    authType === 'token' ? '' : `NDB_PASSWORD=${password}`
  ].filter(Boolean).join('\n');
  fs.writeFileSync(ENV_PATH, env + '\n');
  console.log(`${envFile} file written to ${ENV_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
