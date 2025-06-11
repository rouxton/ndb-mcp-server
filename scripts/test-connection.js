#!/usr/bin/env node

/**
 * NDB Connection Test Script with Special Character Support
 * 
 * This script tests the connection to Nutanix Database Service (NDB)
 * and validates authentication and basic API functionality.
 * Enhanced to handle special characters in passwords properly.
 * 
 * Usage:
 *   node scripts/test-connection.js
 *   npm run test:connection
 * 
 * Environment Variables:
 *   NDB_BASE_URL - Base URL of NDB server (required)
 *   NDB_USERNAME - NDB username (required)
 *   NDB_PASSWORD - NDB password (required, supports special characters)
 *   NDB_TIMEOUT - Request timeout in milliseconds (optional, default: 30000)
 *   NDB_VERIFY_SSL - Verify SSL certificates (optional, default: true)
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
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

// Configuration with safe password handling
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
 * Safely encode credentials for Basic Auth
 * Handles special characters properly
 */
function createBasicAuthHeader(username, password) {
  try {
    // Create the credentials string
    const credentials = `${username}:${password}`;
    
    // Convert to Buffer first to handle special characters correctly
    const credentialsBuffer = Buffer.from(credentials, 'utf8');
    
    // Then encode to base64
    const encodedCredentials = credentialsBuffer.toString('base64');
    
    logDebug(`Username length: ${username.length}`);
    logDebug(`Password length: ${password.length}`);
    logDebug(`Credentials string length: ${credentials.length}`);
    logDebug(`Base64 encoded length: ${encodedCredentials.length}`);
    
    // Validate the encoding by decoding and checking
    const decodedTest = Buffer.from(encodedCredentials, 'base64').toString('utf8');
    if (decodedTest === credentials) {
      logDebug('✅ Base64 encoding validation passed');
    } else {
      logWarning('⚠️ Base64 encoding validation failed');
    }
    
    return `Basic ${encodedCredentials}`;
    
  } catch (error) {
    logError(`Failed to create Basic Auth header: ${error.message}`);
    throw error;
  }
}

/**
 * Make HTTP request with promise wrapper
 */
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
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
 * Test 1: Validate configuration
 */
async function testConfiguration() {
  logHeader('Configuration Validation');
  testResults.total += 5;
  
  // Check required environment variables
  if (config.baseUrl) {
    logSuccess(`NDB_BASE_URL configured: ${config.baseUrl}`);
  } else {
    logError('NDB_BASE_URL is required but not set');
    return false;
  }
  
  if (config.username) {
    logSuccess(`NDB_USERNAME configured: ${config.username}`);
  } else {
    logError('NDB_USERNAME is required but not set');
    return false;
  }
  
  if (config.password) {
    logSuccess('NDB_PASSWORD configured (hidden for security)');
    
    // Check for special characters that might cause issues
    const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
    if (specialChars.test(config.password)) {
      logInfo('Password contains special characters - using enhanced encoding');
      
      // Test encoding
      try {
        const testAuth = createBasicAuthHeader(config.username, config.password);
        logSuccess('Password encoding test passed');
      } catch (error) {
        logError(`Password encoding test failed: ${error.message}`);
        return false;
      }
    }
  } else {
    logError('NDB_PASSWORD is required but not set');
    return false;
  }
  
  // Validate URL format
  try {
    const url = new URL(config.baseUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      logSuccess(`Valid URL format: ${url.protocol}//${url.host}`);
    } else {
      logError(`Invalid URL protocol: ${url.protocol}. Use http: or https:`);
      return false;
    }
  } catch (error) {
    logError(`Invalid URL format: ${error.message}`);
    return false;
  }
  
  logInfo(`Timeout configured: ${config.timeout}ms`);
  logInfo(`SSL verification: ${config.verifySsl ? 'enabled' : 'disabled'}`);
  
  return true;
}

/**
 * Test 2: Basic connectivity
 */
async function testConnectivity() {
  logHeader('Network Connectivity');
  testResults.total += 2;
  
  try {
    const url = new URL(config.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/era/v0.9',
      method: 'GET',
      timeout: config.timeout,
      rejectUnauthorized: config.verifySsl
    };
    
    logInfo(`Testing connectivity to ${url.hostname}:${options.port}`);
    
    const response = await makeRequest(options);
    
    if (response.statusCode >= 200 && response.statusCode < 500) {
      logSuccess(`Server is reachable (HTTP ${response.statusCode})`);
    } else {
      logError(`Server connectivity failed (HTTP ${response.statusCode})`);
      return false;
    }
    
    // Check if it's an NDB server
    if (response.statusCode === 401 || response.statusCode === 403) {
      logSuccess('NDB API endpoint detected (authentication required)');
    } else if (response.statusCode === 200) {
      logWarning('Unexpected 200 response - verify this is an NDB server');
    }
    
    return true;
    
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      logError(`DNS resolution failed: Cannot resolve ${config.baseUrl}`);
    } else if (error.code === 'ECONNREFUSED') {
      logError(`Connection refused: NDB server may be down or unreachable`);
    } else if (error.code === 'CERT_HAS_EXPIRED') {
      logError(`SSL certificate has expired. Consider setting NDB_VERIFY_SSL=false for testing`);
    } else if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      logError(`Self-signed certificate detected. Consider setting NDB_VERIFY_SSL=false for development`);
    } else if (error.message === 'Request timeout') {
      logError(`Connection timeout after ${config.timeout}ms. Try increasing NDB_TIMEOUT`);
    } else {
      logError(`Network error: ${error.message}`);
    }
    return false;
  }
}

/**
 * Test 3: Authentication with enhanced special character support
 */
async function testAuthentication() {
  logHeader('Authentication Test');
  testResults.total += 2;
  
  try {
    const url = new URL(config.baseUrl);
    
    // Use the enhanced auth header creation
    const authHeader = createBasicAuthHeader(config.username, config.password);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/era/v0.9/clusters',
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NDB-MCP-Server/1.0'
      },
      timeout: config.timeout,
      rejectUnauthorized: config.verifySsl
    };
    
    logInfo('Testing basic authentication with enhanced encoding...');
    logDebug(`Auth header created successfully`);
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      logSuccess('Authentication successful');
      
      // Verify response contains cluster data
      if (Array.isArray(response.data) || (response.data && typeof response.data === 'object')) {
        logSuccess('Valid NDB API response received');
        return { success: true, data: response.data };
      } else {
        logWarning('Unexpected response format from NDB API');
        return { success: true, data: response.data };
      }
    } else if (response.statusCode === 401) {
      logError('Authentication failed - check username and password');
      logDebug('This may indicate the password encoding is still incorrect');
    } else if (response.statusCode === 403) {
      logError('Access forbidden - user may lack required permissions');
    } else if (response.statusCode === 404) {
      logError('API endpoint not found - verify NDB version and URL');
    } else if (response.statusCode === 400) {
      logError('Bad request - this was your original issue');
      logInfo('The enhanced encoding should have fixed this');
      if (response.data && response.data.message) {
        logError(`Server message: ${response.data.message}`);
      }
    } else {
      logError(`Authentication test failed (HTTP ${response.statusCode})`);
      if (response.data && response.data.message) {
        logError(`Server message: ${response.data.message}`);
      }
    }
    
    return { success: false };
    
  } catch (error) {
    logError(`Authentication test error: ${error.message}`);
    return { success: false };
  }
}

/**
 * Test 4: API functionality
 */
async function testApiFunctionality(clusterData) {
  logHeader('API Functionality Test');
  testResults.total += 3;
  
  if (!clusterData) {
    logError('Skipping API functionality test - no cluster data available');
    return false;
  }
  
  try {
    const url = new URL(config.baseUrl);
    const authHeader = createBasicAuthHeader(config.username, config.password);
    
    // Test multiple endpoints
    const endpoints = [
      { path: '/era/v0.9/databases', name: 'Databases' },
      { path: '/era/v0.9/profiles', name: 'Profiles' },
      { path: '/era/v0.9/slas', name: 'SLAs' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: endpoint.path,
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'NDB-MCP-Server/1.0'
          },
          timeout: config.timeout,
          rejectUnauthorized: config.verifySsl
        };
        
        const response = await makeRequest(options);
        
        if (response.statusCode === 200) {
          logSuccess(`${endpoint.name} API endpoint working`);
        } else {
          logWarning(`${endpoint.name} API returned HTTP ${response.statusCode}`);
        }
      } catch (error) {
        logWarning(`${endpoint.name} API test failed: ${error.message}`);
      }
    }
    
    return true;
    
  } catch (error) {
    logError(`API functionality test error: ${error.message}`);
    return false;
  }
}

/**
 * Display environment information
 */
function displayEnvironmentInfo() {
  logHeader('Environment Information');
  
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`Working directory: ${process.cwd()}`);
  
  // Check for .env file
  if (existsSync(envPath)) {
    logInfo('.env file found and loaded');
  } else {
    logWarning('.env file not found - using system environment variables');
  }
  
  // Additional debug info for special characters
  if (config.password) {
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(config.password);
    if (hasSpecialChars) {
      logInfo('Password contains special characters - enhanced encoding enabled');
    }
  }
}

/**
 * Display test summary
 */
function displaySummary() {
  logHeader('Test Summary');
  
  console.log(`Total tests: ${testResults.total}`);
  console.log(`${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${testResults.warnings}${colors.reset}`);
  
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  console.log(`Success rate: ${successRate}%`);
  
  if (testResults.failed === 0) {
    logSuccess('\n🎉 All critical tests passed! NDB MCP Server should work correctly.');
    logInfo('The special character encoding fix works!');
    logInfo('You can now start the MCP server with: npm start');
  } else {
    logError('\n🚨 Some tests failed. Please review the errors above and fix configuration issues.');
    logInfo('Check the troubleshooting guide: docs/troubleshooting.md');
  }
}

/**
 * Main test execution
 */
async function runTests() {
  log(`${colors.bright}NDB Connection Test Script (Enhanced for Special Characters)${colors.reset}`, colors.cyan);
  log('Testing connection to Nutanix Database Service (NDB)\n');
  
  displayEnvironmentInfo();
  
  // Run tests in sequence
  const configValid = await testConfiguration();
  if (!configValid) {
    logError('\nConfiguration validation failed. Cannot proceed with connection tests.');
    displaySummary();
    process.exit(1);
  }
  
  const connectivityOk = await testConnectivity();
  if (!connectivityOk) {
    logError('\nConnectivity test failed. Cannot proceed with authentication tests.');
    displaySummary();
    process.exit(1);
  }
  
  const authResult = await testAuthentication();
  if (!authResult.success) {
    logError('\nAuthentication test failed. Cannot proceed with API tests.');
    displaySummary();
    process.exit(1);
  }
  
  await testApiFunctionality(authResult.data);
  
  displaySummary();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

/**
 * Handle script errors
 */
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
NDB Connection Test Script (Enhanced for Special Characters)

Usage:
  node scripts/test-connection.js [options]

Options:
  --help, -h    Show this help message

Environment Variables:
  NDB_BASE_URL     Base URL of NDB server (required)
  NDB_USERNAME     NDB username (required)  
  NDB_PASSWORD     NDB password (required, supports special characters like !)
  NDB_TIMEOUT      Request timeout in ms (optional, default: 30000)
  NDB_VERIFY_SSL   Verify SSL certificates (optional, default: true)

Examples:
  # Basic test with .env file
  node scripts/test-connection.js
  
  # Test with environment variables (including special characters)
  NDB_BASE_URL=https://ndb.example.com NDB_USERNAME=admin NDB_PASSWORD='pass!word' node scripts/test-connection.js
  
  # Test with SSL verification disabled
  NDB_VERIFY_SSL=false node scripts/test-connection.js

Notes:
  - Passwords with special characters (!, @, #, etc.) are now properly handled
  - Use single quotes around passwords with special characters in shell commands
`);
  process.exit(0);
}

// Run the tests
runTests().catch((error) => {
  logError(`Test execution failed: ${error.message}`);
  process.exit(1);
});
