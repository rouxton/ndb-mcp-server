#!/usr/bin/env node

/**
 * Enhanced NDB Connection Debug Script
 * 
 * Ultra-verbose debugging to match the working curl command:
 * curl -u "stephen.roux@ndbspc.local:MyPWD#1@LAB\!" 'https://10.54.86.231/era/v0.9/databases' -H 'accept: application/json' -k
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

// ES6 equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file if it exists
const projectRoot = join(__dirname, '..');
const envPath = join(projectRoot, '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const config = {
  baseUrl: process.env.NDB_BASE_URL,
  username: process.env.NDB_USERNAME,
  password: process.env.NDB_PASSWORD,
  timeout: parseInt(process.env.NDB_TIMEOUT) || 30000,
  verifySsl: process.env.NDB_VERIFY_SSL !== 'false'
};

/**
 * Print colored console messages
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logDebug(message) {
  log(`🔍 ${message}`, colors.magenta);
}

function logHeader(message) {
  log(`\n${colors.bright}=== ${message} ===${colors.reset}`, colors.cyan);
}

/**
 * Ultra-verbose HTTP request logging
 */
function makeVerboseRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    logDebug('=== REQUEST DETAILS ===');
    console.log(`Protocol: ${options.protocol === 'https:' ? 'HTTPS' : 'HTTP'}`);
    console.log(`Method: ${options.method}`);
    console.log(`Hostname: ${options.hostname}`);
    console.log(`Port: ${options.port}`);
    console.log(`Path: ${options.path}`);
    console.log(`Full URL: ${options.protocol}//${options.hostname}:${options.port}${options.path}`);
    console.log(`Timeout: ${options.timeout}ms`);
    console.log(`SSL Verification: ${options.rejectUnauthorized}`);
    
    console.log('\nHeaders sent:');
    Object.entries(options.headers || {}).forEach(([key, value]) => {
      if (key.toLowerCase() === 'authorization') {
        const [type, credentials] = value.split(' ');
        console.log(`  ${key}: ${type} [${credentials.length} chars base64]`);
        
        // Decode and verify credentials (for debugging)
        try {
          const decoded = Buffer.from(credentials, 'base64').toString('utf8');
          const [user, pass] = decoded.split(':');
          console.log(`    Decoded username: "${user}" (${user.length} chars)`);
          console.log(`    Decoded password: "${pass}" (${pass.length} chars)`);
          console.log(`    Password chars: ${pass.split('').map(c => c.charCodeAt(0)).join(', ')}`);
        } catch (e) {
          console.log(`    Decode error: ${e.message}`);
        }
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });
    
    if (postData) {
      console.log(`\nRequest body: ${postData}`);
    }
    
    const req = protocol.request(options, (res) => {
      logDebug('\n=== RESPONSE DETAILS ===');
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`HTTP Version: ${res.httpVersion}`);
      
      console.log('\nResponse headers:');
      Object.entries(res.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      let data = '';
      let rawData = Buffer.alloc(0);
      
      res.on('data', (chunk) => {
        data += chunk;
        rawData = Buffer.concat([rawData, chunk]);
      });
      
      res.on('end', () => {
        console.log(`\nResponse body length: ${data.length} characters`);
        console.log(`Response body (first 500 chars): ${data.substring(0, 500)}`);
        if (data.length > 500) {
          console.log('... [truncated]');
        }
        
        // Try to parse as JSON
        let jsonData;
        let parseError = null;
        try {
          jsonData = data ? JSON.parse(data) : {};
        } catch (error) {
          parseError = error.message;
          jsonData = data;
        }
        
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: jsonData,
          rawData: data,
          rawBuffer: rawData,
          parseError: parseError
        });
      });
    });
    
    req.on('error', (error) => {
      logError(`Request error: ${error.message}`);
      logDebug(`Error code: ${error.code}`);
      logDebug(`Error stack: ${error.stack}`);
      reject(error);
    });
    
    req.on('timeout', () => {
      logError('Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(options.timeout);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Test different encoding methods to match curl behavior
 */
async function testEncodingMethods() {
  logHeader('Testing Different Encoding Methods');
  
  const username = config.username;
  const password = config.password;
  
  logInfo(`Testing with username: "${username}"`);
  logInfo(`Testing with password: "${password}"`);
  
  // Method 1: Standard Buffer.from approach
  console.log('\n--- Method 1: Standard Buffer.from (current) ---');
  const method1 = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  console.log(`Result: ${method1}`);
  console.log(`Decoded: ${Buffer.from(method1, 'base64').toString('utf8')}`);
  
  // Method 2: Manual string concatenation
  console.log('\n--- Method 2: Manual string concatenation ---');
  const credentials2 = username + ':' + password;
  const method2 = Buffer.from(credentials2).toString('base64');
  console.log(`Credentials string: "${credentials2}"`);
  console.log(`Result: ${method2}`);
  console.log(`Decoded: ${Buffer.from(method2, 'base64').toString('utf8')}`);
  
  // Method 3: Escape special characters first
  console.log('\n--- Method 3: With character analysis ---');
  console.log('Username character codes:', username.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
  console.log('Password character codes:', password.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
  
  // Method 4: Try encoding each part separately
  console.log('\n--- Method 4: Separate encoding ---');
  const userB64 = Buffer.from(username, 'utf8').toString('base64');
  const passB64 = Buffer.from(password, 'utf8').toString('base64');
  console.log(`Username base64: ${userB64}`);
  console.log(`Password base64: ${passB64}`);
  
  return method1; // Return the standard method for now
}

/**
 * Test the exact endpoint that works with curl
 */
async function testWorkingEndpoint() {
  logHeader('Testing Known Working Endpoint: /era/v0.9/databases');
  
  const url = new URL(config.baseUrl);
  const authEncoded = await testEncodingMethods();
  
  // Test different header combinations
  const headerVariations = [
    {
      name: 'Exact curl match',
      headers: {
        'Authorization': `Basic ${authEncoded}`,
        'accept': 'application/json'
      }
    },
    {
      name: 'With Accept (capital A)',
      headers: {
        'Authorization': `Basic ${authEncoded}`,
        'Accept': 'application/json'
      }
    },
    {
      name: 'With Content-Type',
      headers: {
        'Authorization': `Basic ${authEncoded}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'With User-Agent',
      headers: {
        'Authorization': `Basic ${authEncoded}`,
        'Accept': 'application/json',
        'User-Agent': 'NDB-MCP-Server/1.0'
      }
    },
    {
      name: 'Minimal headers',
      headers: {
        'Authorization': `Basic ${authEncoded}`
      }
    }
  ];
  
  for (const variation of headerVariations) {
    logInfo(`\nTesting: ${variation.name}`);
    
    try {
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: '/era/v0.9/databases',
        method: 'GET',
        headers: variation.headers,
        timeout: config.timeout,
        rejectUnauthorized: config.verifySsl,
        protocol: url.protocol
      };
      
      const response = await makeVerboseRequest(options);
      
      if (response.statusCode === 200) {
        logSuccess(`✅ SUCCESS with "${variation.name}"!`);
        logInfo('This header combination works!');
        return response;
      } else if (response.statusCode === 400) {
        logError(`❌ HTTP 400 with "${variation.name}"`);
        if (response.rawData) {
          console.log(`Error details: ${response.rawData}`);
        }
      } else {
        logWarning(`⚠️ HTTP ${response.statusCode} with "${variation.name}"`);
      }
      
    } catch (error) {
      logError(`Error with "${variation.name}": ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
  
  return null;
}

/**
 * Compare our request with the working curl command
 */
async function compareToCurl() {
  logHeader('Curl Command Analysis');
  
  const curlCommand = `curl -u "stephen.roux@ndbspc.local:MyPWD#1@LAB\\!" 'https://10.54.86.231/era/v0.9/databases' -H 'accept: application/json' -k`;
  
  console.log('Working curl command:');
  console.log(curlCommand);
  console.log('');
  
  // Parse the curl command
  const curlUsername = 'stephen.roux@ndbspc.local';
  const curlPassword = 'MyPWD#1@LAB!'; // Note: unescaped for analysis
  const curlUrl = 'https://10.54.86.231/era/v0.9/databases';
  
  console.log('Curl parameters:');
  console.log(`  Username: "${curlUsername}"`);
  console.log(`  Password: "${curlPassword}"`);
  console.log(`  URL: ${curlUrl}`);
  console.log(`  Headers: accept: application/json`);
  console.log(`  SSL: -k (ignore certificate errors)`);
  
  // Compare with our config
  console.log('\nOur configuration:');
  console.log(`  Username: "${config.username}"`);
  console.log(`  Password: "${config.password}"`);
  console.log(`  URL: ${config.baseUrl}`);
  console.log(`  SSL Verify: ${config.verifySsl}`);
  
  // Check for differences
  console.log('\nDifferences:');
  if (config.username !== curlUsername) {
    logWarning(`Username mismatch: "${config.username}" vs "${curlUsername}"`);
  } else {
    logSuccess('Username matches');
  }
  
  if (config.password !== curlPassword) {
    logWarning(`Password mismatch: "${config.password}" vs "${curlPassword}"`);
  } else {
    logSuccess('Password matches');
  }
  
  const configUrl = new URL(config.baseUrl);
  const curlUrlParsed = new URL(curlUrl);
  if (configUrl.origin !== curlUrlParsed.origin) {
    logWarning(`Base URL mismatch: "${configUrl.origin}" vs "${curlUrlParsed.origin}"`);
  } else {
    logSuccess('Base URL matches');
  }
}

/**
 * Test with the exact credentials from curl
 */
async function testWithCurlCredentials() {
  logHeader('Testing with Exact Curl Credentials');
  
  // Use the exact credentials from the working curl command
  const curlUsername = 'stephen.roux@ndbspc.local';
  const curlPassword = 'MyPWD#1@LAB!';
  
  logInfo('Using exact curl credentials for comparison...');
  
  const authString = Buffer.from(`${curlUsername}:${curlPassword}`, 'utf8').toString('base64');
  console.log(`Auth string: Basic ${authString}`);
  
  const url = new URL(config.baseUrl);
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: '/era/v0.9/databases',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authString}`,
      'accept': 'application/json'
    },
    timeout: config.timeout,
    rejectUnauthorized: config.verifySsl,
    protocol: url.protocol
  };
  
  try {
    const response = await makeVerboseRequest(options);
    
    if (response.statusCode === 200) {
      logSuccess('✅ SUCCESS with exact curl credentials!');
      return true;
    } else {
      logError(`❌ Failed with exact curl credentials: HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logError(`Error with curl credentials: ${error.message}`);
    return false;
  }
}

/**
 * Main diagnostic function
 */
async function runDetailedDiagnostics() {
  log(`${colors.bright}Ultra-Verbose NDB Connection Diagnostics${colors.reset}`, colors.cyan);
  log('Debugging HTTP 400 error by comparing to working curl command\n');
  
  // Validate configuration
  if (!config.baseUrl || !config.username || !config.password) {
    logError('Missing required configuration. Please check NDB_BASE_URL, NDB_USERNAME, and NDB_PASSWORD');
    return;
  }
  
  logInfo(`Configuration loaded:`);
  console.log(`  NDB_BASE_URL: ${config.baseUrl}`);
  console.log(`  NDB_USERNAME: ${config.username}`);
  console.log(`  NDB_PASSWORD: ${config.password}`);
  console.log(`  NDB_VERIFY_SSL: ${config.verifySsl}`);
  console.log(`  NDB_TIMEOUT: ${config.timeout}`);
  
  // Compare to curl
  await compareToCurl();
  
  // Test with curl credentials
  await testWithCurlCredentials();
  
  // Test the working endpoint
  const result = await testWorkingEndpoint();
  
  // Summary
  logHeader('Diagnostic Summary');
  if (result) {
    logSuccess('Found a working configuration!');
    console.log('The server MCP can now be updated with the correct authentication method.');
  } else {
    logError('No working configuration found.');
    console.log('The issue may be in the Node.js HTTP implementation vs curl behavior.');
    console.log('Next steps:');
    console.log('1. Check if .env file has correct credentials');
    console.log('2. Verify character encoding issues');
    console.log('3. Test with different Node.js versions');
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Ultra-Verbose NDB Connection Diagnostics

Usage:
  node scripts/test-connection-debug.js

This script provides ultra-verbose debugging to match curl behavior.
It focuses on the /era/v0.9/databases endpoint that works with curl.

Environment Variables:
  NDB_BASE_URL     Base URL of NDB server (required)
  NDB_USERNAME     NDB username (required)  
  NDB_PASSWORD     NDB password (required)
  NDB_TIMEOUT      Request timeout in ms (optional, default: 30000)
  NDB_VERIFY_SSL   Verify SSL certificates (optional, default: true)

Working curl command for reference:
curl -u "stephen.roux@ndbspc.local:MyPWD#1@LAB\\!" 'https://10.54.86.231/era/v0.9/databases' -H 'accept: application/json' -k
`);
  process.exit(0);
}

// Run the detailed diagnostics
runDetailedDiagnostics().catch((error) => {
  logError(`Diagnostics failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
