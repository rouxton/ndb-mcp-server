#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const https = require('https');
const http = require('http');
const url = require('url');
const path = require('path');

const ENV_PATH = path.resolve(process.cwd(), '.env');

function ask(question, defaultValue) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question}${defaultValue ? ` [${defaultValue}]` : ''}: `, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const lines = fs.readFileSync(ENV_PATH, 'utf-8').split('\n');
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
  const current = readEnv();
  console.log('--- NDB MCP Server Configuration ---');
  const baseUrl = await ask('NDB Base URL (e.g. https://ndb.example.com:443)', current.NDB_BASE_URL);
  const verifySSL = (await ask('Verify SSL certificate? (yes/no)', current.NDB_VERIFY_SSL === 'false' ? 'no' : 'yes')).toLowerCase() === 'yes';
  const authType = await ask('Authentication type (basic/token)', current.NDB_AUTH_TYPE || 'basic');
  const username = await ask('NDB Username', current.NDB_USERNAME);
  const password = await ask('NDB Password', '');
  let token = '';
  let tokenExpire = '';
  if (authType === 'token') {
    tokenExpire = await ask('Token expiration in hours', current.NDB_TOKEN_EXPIRE || '5');
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
    `NDB_AUTH_TYPE=${authType}`,
    `NDB_USERNAME=${username}`,
    authType === 'token' ? `NDB_TOKEN=${token}` : '',
    authType === 'token' ? `NDB_TOKEN_EXPIRE=${tokenExpire}` : '',
    authType === 'basic' ? `NDB_PASSWORD=${password}` : ''
  ].filter(Boolean).join('\n');
  fs.writeFileSync(ENV_PATH, env + '\n');
  console.log(`.env file written to ${ENV_PATH}`);
}

if (require.main === module) {
  main();
}
