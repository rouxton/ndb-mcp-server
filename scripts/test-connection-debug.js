#!/usr/bin/env node

/**
 * Enhanced NDB Connection Test Script with Detailed Diagnostics
 * 
 * This enhanced version provides detailed debugging information
 * for HTTP 400 and other authentication issues.
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

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

/**
 * Print colored console messages
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
  testResults.passed++;
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
  testResults.failed++;
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
  testResults.warnings++;
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
 * Enhanced HTTP request with detailed logging
 */
function makeRequest(options, postData = null, logDetails = false) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    if (logDetails) {
      logDebug(`Request details:`);
      console.log(`  Method: ${options.method}`);
      console.log(`  URL: ${options.protocol}//${options.hostname}:${options.port}${options.path}`);
      console.log(`  Headers: ${JSON.stringify(options.headers, null, 2)}`);
      if (postData) console.log(`  Body: ${postData}`);
    }
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      if (logDetails) {
        logDebug(`Response details:`);
        console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`  Headers: ${JSON.stringify(res.headers, null, 2)}`);
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (logDetails && data) {
          console.log(`  Body: ${data.substring(0, 500)}${data.length > 500 ? '...' : ''}`);
        }
        
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: data,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      if (logDetails) {
        logDebug(`Request error: ${error.message}`);
      }
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(config.timeout);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Test different API endpoints to find the correct one
 */
async function discoverApiEndpoints() {
  logHeader('API Endpoint Discovery');
  
  const url = new URL(config.baseUrl);
  const authString = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  
  // Common NDB API endpoints to test
  const endpointsToTest = [
    '/era/v0.9',
    '/era/v0.9/clusters',
    '/era/v1.0/clusters', 
    '/era/v2.0/clusters',
    '/era/api/nutanix/v0.9/clusters',
    '/era/api/nutanix/v1.0/clusters',
    '/api/nutanix/v0.9/clusters',
    '/api/nutanix/v1.0/clusters',
    '/era',
    '/api'
  ];
  
  logInfo(`Testing ${endpointsToTest.length} common API endpoints...`);
  
  for (const endpoint of endpointsToTest) {
    try {
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: endpoint,
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'NDB-MCP-Server/1.0'
        },
        timeout: config.timeout,
        rejectUnauthorized: config.verifySsl
      };
      
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        logSuccess(`Working endpoint found: ${endpoint}`);
        logInfo(`Response type: ${response.headers['content-type']}`);
        return endpoint;
      } else if (response.statusCode === 401) {
        logWarning(`${endpoint} - Authentication required (401)`);
      } else if (response.statusCode === 403) {
        logWarning(`${endpoint} - Access forbidden (403)`);
      } else if (response.statusCode === 404) {
        logInfo(`${endpoint} - Not found (404)`);
      } else if (response.statusCode === 400) {
        logWarning(`${endpoint} - Bad request (400): ${response.statusMessage}`);
        if (response.rawData) {
          console.log(`    Error details: ${response.rawData.substring(0, 200)}`);
        }
      } else {
        logInfo(`${endpoint} - HTTP ${response.statusCode}: ${response.statusMessage}`);
      }
      
    } catch (error) {
      logInfo(`${endpoint} - Error: ${error.message}`);
    }
  }
  
  logWarning('No working endpoint found');
  return null;
}

/**
 * Enhanced authentication test with multiple methods
 */
async function testAuthenticationMethods() {
  logHeader('Authentication Methods Test');
  
  const url = new URL(config.baseUrl);
  
  // Test different authentication methods
  const authMethods = [
    {
      name: 'Basic Auth (current)',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Basic Auth with User-Agent',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'NDB-MCP-Server/1.0'
      }
    },
    {
      name: 'Basic Auth minimal headers',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`
      }
    },
    {
      name: 'Basic Auth with different Accept header',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
        'Accept': '*/*'
      }
    }
  ];
  
  for (const authMethod of authMethods) {
    logInfo(`Testing: ${authMethod.name}`);
    
    try {
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: '/era/v0.9/clusters',
        method: 'GET',
        headers: authMethod.headers,
        timeout: config.timeout,
        rejectUnauthorized: config.verifySsl
      };
      
      const response = await makeRequest(options, null, true);
      
      if (response.statusCode === 200) {
        logSuccess(`✅ ${authMethod.name} works!`);
        return true;
      } else {
        logWarning(`${authMethod.name} failed: HTTP ${response.statusCode}`);
        if (response.rawData && response.statusCode === 400) {
          console.log(`    Error details: ${response.rawData.substring(0, 300)}`);
        }
      }
      
    } catch (error) {
      logWarning(`${authMethod.name} error: ${error.message}`);
    }
  }
  
  return false;
}

/**
 * Test raw HTTP connection without authentication
 */
async function testRawConnection() {
  logHeader('Raw Connection Test (No Auth)');
  
  const url = new URL(config.baseUrl);
  
  try {
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/era/v0.9',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NDB-MCP-Server/1.0'
      },
      timeout: config.timeout,
      rejectUnauthorized: config.verifySsl
    };
    
    logInfo('Testing raw connection without authentication...');
    const response = await makeRequest(options, null, true);
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      logSuccess('Server requires authentication (expected)');
      logInfo(`Server response: ${response.statusMessage}`);
      if (response.headers['www-authenticate']) {
        logInfo(`Auth methods: ${response.headers['www-authenticate']}`);
      }
      return true;
    } else if (response.statusCode === 404) {
      logWarning('Endpoint not found - may need different API path');
    } else if (response.statusCode === 400) {
      logError('Bad request - check URL format and API version');
      if (response.rawData) {
        console.log(`Error details: ${response.rawData}`);
      }
    } else {
      logInfo(`Unexpected response: HTTP ${response.statusCode} ${response.statusMessage}`);
    }
    
    return false;
    
  } catch (error) {
    logError(`Raw connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  log(`${colors.bright}Enhanced NDB Connection Diagnostics${colors.reset}`, colors.cyan);
  log('Detailed analysis for HTTP 400 and authentication issues\n');
  
  // Validate configuration first
  if (!config.baseUrl || !config.username || !config.password) {
    logError('Missing required configuration. Please check NDB_BASE_URL, NDB_USERNAME, and NDB_PASSWORD');
    return;
  }
  
  logInfo(`Testing connection to: ${config.baseUrl}`);
  logInfo(`Username: ${config.username}`);
  logInfo(`SSL verification: ${config.verifySsl}`);
  
  // Test 1: Raw connection
  await testRawConnection();
  
  // Test 2: Discover working endpoints
  const workingEndpoint = await discoverApiEndpoints();
  
  // Test 3: Try different authentication methods
  await testAuthenticationMethods();
  
  // Summary and recommendations
  logHeader('Recommendations');
  
  if (workingEndpoint) {
    logSuccess(`Use this endpoint: ${workingEndpoint}`);
  } else {
    logError('No working endpoint found. Possible issues:');
    console.log('  1. Incorrect NDB server URL');
    console.log('  2. Different API version than expected');
    console.log('  3. NDB server not running or accessible');
    console.log('  4. Network/firewall issues');
  }
  
  console.log('\nTroubleshooting steps:');
  console.log('  1. Verify NDB server is accessible in browser');
  console.log('  2. Check NDB API documentation for correct endpoints');
  console.log('  3. Try connecting with different API versions');
  console.log('  4. Contact NDB administrator for correct API endpoints');
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Enhanced NDB Connection Diagnostics

Usage:
  node scripts/test-connection-debug.js

This script provides detailed diagnostics for HTTP 400 and authentication issues.
It tests multiple API endpoints and authentication methods to identify the problem.

Environment Variables:
  NDB_BASE_URL     Base URL of NDB server (required)
  NDB_USERNAME     NDB username (required)  
  NDB_PASSWORD     NDB password (required)
  NDB_TIMEOUT      Request timeout in ms (optional, default: 30000)
  NDB_VERIFY_SSL   Verify SSL certificates (optional, default: true)
`);
  process.exit(0);
}

// Run the diagnostics
runDiagnostics().catch((error) => {
  logError(`Diagnostics failed: ${error.message}`);
  process.exit(1);
});
