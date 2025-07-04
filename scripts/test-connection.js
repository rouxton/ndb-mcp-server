#!/usr/bin/env node

/**
 * NDB Connection Test Script
 * Tests connectivity to Nutanix Database Service (NDB) API
 * Based on diagnostic results showing working authentication
 */

import https from 'https';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import readline from 'readline';

// ES6 equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for output formatting
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Prompt for environment name (sync)
 */
function promptEnvironment() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Environnement à tester (laisser vide pour ".env") : ', (env) => {
      rl.close();
      resolve(env.trim());
    });
  });
}

/**
 * Load environment configuration
 */
function loadConfig(envName = '') {
  // Try to load .env or .env.<env> file
  let envFile = '.env';
  if (envName) {
    envFile = `.env.${envName}`;
  }
  const envPath = join(process.cwd(), envFile);
  
  if (existsSync(envPath)) {
    console.log(`${colors.blue}\u2139\ufe0f  Chargement de la configuration depuis ${envFile}...${colors.reset}`);
    const envContent = readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^\"|\"$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    });
  } else {
    console.log(`${colors.yellow}\u26a0\ufe0f  Fichier ${envFile} introuvable, vérifiez le nom d'environnement.${colors.reset}`);
  }

  const config = {
    baseUrl: process.env.NDB_BASE_URL,
    username: process.env.NDB_USERNAME,
    password: process.env.NDB_PASSWORD,
    token: process.env.NDB_TOKEN,
    verifySSL: process.env.NDB_VERIFY_SSL !== 'false',
    timeout: parseInt(process.env.NDB_TIMEOUT || '30000')
  };

  // Validate required configuration
  const missing = [];
  if (!config.baseUrl) missing.push('NDB_BASE_URL');
  if (!config.token && !config.username) missing.push('NDB_USERNAME');
  if (!config.token && !config.password) missing.push('NDB_PASSWORD');
  if (missing.length > 0) {
    console.error(`${colors.red}\u274c Variables d'environnement manquantes: ${missing.join(', ')}${colors.reset}`);
    console.error(`${colors.yellow}Merci de renseigner ces variables ou de créer le fichier ${envFile}.${colors.reset}`);
    process.exit(1);
  }

  return config;
}

/**
 * Create Basic Authentication header
 */
function createAuthHeader(username, password, token) {
  if (token) {
    return `Bearer ${token}`;
  }
  const credentials = `${username}:${password}`;
  const base64Credentials = Buffer.from(credentials, 'utf8').toString('base64');
  return `Basic ${base64Credentials}`;
}

/**
 * Make HTTPS request with proper error handling
 */
function makeRequest(config, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    // Parse URL
    const url = new URL(`${config.baseUrl}${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      timeout: config.timeout,
      rejectUnauthorized: config.verifySSL,
      headers: {
        'Authorization': createAuthHeader(config.username, config.password, config.token),
        'Accept': 'application/json',
        'User-Agent': 'NDB-MCP-Server/1.0'
      }
    };

    console.log(`${colors.cyan}🔍 Testing: ${method} ${url.href}${colors.reset}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });

    req.end();
  });
}

/**
 * Test specific endpoints to verify functionality
 */
async function testEndpoints(config) {
  const endpoints = [
    {
      name: 'Databases',
      path: '/era/v0.9/databases',
      description: 'List all databases'
    },
    {
      name: 'Clusters',
      path: '/era/v0.9/clusters',
      description: 'List all clusters'
    },
    {
      name: 'Operations',
      path: '/era/v0.9/operations/short-info?limit=5',
      description: 'Recent operations'
    }
  ];

  console.log(`\n${colors.bold}=== Testing API Endpoints ===${colors.reset}`);
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n${colors.blue}Testing ${endpoint.name} (${endpoint.description})...${colors.reset}`);
      
      const response = await makeRequest(config, endpoint.path);
      
      if (response.status === 200) {
        console.log(`${colors.green}✅ ${endpoint.name}: SUCCESS${colors.reset}`);
        
        // Try to parse and show brief summary
        try {
          const data = JSON.parse(response.data);
          if (Array.isArray(data)) {
            console.log(`   Found ${data.length} items`);
          } else if (data && typeof data === 'object') {
            const keys = Object.keys(data);
            console.log(`   Response contains: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
          }
        } catch (parseError) {
          console.log(`   Response received (${response.data.length} characters)`);
        }
      } else {
        console.log(`${colors.yellow}⚠️  ${endpoint.name}: HTTP ${response.status} ${response.statusMessage}${colors.reset}`);
      }
      
    } catch (error) {
      console.log(`${colors.red}❌ ${endpoint.name}: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Test authentication specifically
 */
async function testAuthentication(config) {
  console.log(`\n${colors.bold}=== Testing Authentication ===${colors.reset}`);
  
  try {
    // Test with a simple endpoint that requires authentication
    const response = await makeRequest(config, '/era/v0.9/databases?limit=1');
    
    if (response.status === 200) {
      console.log(`${colors.green}✅ Authentication: SUCCESS${colors.reset}`);
      console.log(`   Status: ${response.status} ${response.statusMessage}`);
      
      // Check for session cookie
      const setCookie = response.headers['set-cookie'];
      if (setCookie && setCookie.some(cookie => cookie.includes('JSESSIONID'))) {
        console.log(`   Session established: JSESSIONID received`);
      }
      
      return true;
    } else if (response.status === 401) {
      console.log(`${colors.red}❌ Authentication: FAILED (Invalid credentials)${colors.reset}`);
      return false;
    } else if (response.status === 410) {
      console.log(`${colors.red}❌ Authentication: FAILED (Token expired or invalid)${colors.reset}`);
      console.log(`${colors.yellow}Your NDB_TOKEN is expired or invalid. Please re-run 'npm run configure' to generate a new token.${colors.reset}`);
      return false;
    } else {
      console.log(`${colors.yellow}⚠️  Authentication: Unexpected response ${response.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Authentication: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🚀 NDB Connection Test${colors.reset}`);
  console.log(`${colors.cyan}Testing connectivity to Nutanix Database Service API${colors.reset}\n`);

  try {
    // Demander l'environnement à tester
    const envName = await promptEnvironment();
    // Charger la configuration de l'environnement choisi
    const config = loadConfig(envName);
    
    console.log(`${colors.blue}ℹ️  Configuration:${colors.reset}`);
    console.log(`   NDB URL: ${config.baseUrl}`);
    if (config.token) {
      console.log(`   Authentication: Token (Bearer)`);
    } else {
      console.log(`   Username: ${config.username}`);
      console.log(`   Password: ${'*'.repeat(config.password.length)}`);
    }
    console.log(`   SSL Verify: ${config.verifySSL}`);
    console.log(`   Timeout: ${config.timeout}ms`);

    // Test authentication first
    const authSuccess = await testAuthentication(config);
    
    if (authSuccess) {
      // Test additional endpoints
      await testEndpoints(config);
      
      console.log(`\n${colors.bold}${colors.green}🎉 Connection test completed successfully!${colors.reset}`);
      console.log(`${colors.green}Your NDB MCP Server should work correctly with these settings.${colors.reset}`);
    } else {
      console.log(`\n${colors.bold}${colors.red}❌ Connection test failed!${colors.reset}`);
      console.log(`${colors.red}Please check your credentials and NDB server configuration.${colors.reset}`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n${colors.red}❌ Test failed with error: ${error.message}${colors.reset}`);
    console.error(`${colors.yellow}Stack trace:${colors.reset}`, error.stack);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Test interrupted by user${colors.reset}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}Test terminated${colors.reset}`);
  process.exit(0);
});

// Run the test (only if this is the main module)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  main().catch(error => {
    console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

// Export functions for potential use as module
export { loadConfig, createAuthHeader, makeRequest };
