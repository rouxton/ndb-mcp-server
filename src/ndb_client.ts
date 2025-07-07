/**
 * NDB API Client
 * 
 * Provides a TypeScript client for interacting with Nutanix Database Service API
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import https from 'https';
import type { NDBConfig } from './types.js';

export class NDBClient {
  private client: AxiosInstance;
  private config: NDBConfig;

  constructor(config: NDBConfig) {
    this.config = config;
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: `${config.baseUrl}/era/v0.9`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NDB-MCP-Server/1.0'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.verifySsl !== false
      })
    });

    // Add request interceptor to handle authentication
    this.client.interceptors.request.use((config) => {
      if (this.config.token) {
        config.headers.Authorization = `Bearer ${this.config.token}`;
      } else if (this.config.username && this.config.password) {
        const credentials = `${this.config.username}:${this.config.password}`;
        const base64Credentials = Buffer.from(credentials, 'utf8').toString('base64');
        config.headers.Authorization = `Basic ${base64Credentials}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.error('❌ Authentication failed - check NDB credentials');
        } else if (error.response?.status === 410) {
          console.error('❌ Token expired or invalid - please re-run `npm run configure` to generate a new token.');
        } else if (error.response?.status === 403) {
          console.error('❌ Access forbidden - user may lack required permissions');
        } else if (error.response?.status === 404) {
          console.error('❌ API endpoint not found - verify NDB version and URL');
        } else if (error.code === 'ECONNREFUSED') {
          console.error('❌ Connection refused - NDB server may be down or unreachable');
        } else if (error.code === 'ENOTFOUND') {
          console.error('❌ DNS resolution failed - cannot resolve NDB server hostname');
        } else if (error.code === 'CERT_HAS_EXPIRED') {
          console.error('❌ SSL certificate has expired - consider setting NDB_VERIFY_SSL=false for testing');
        } else if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
          console.error('❌ Self-signed certificate detected - consider setting NDB_VERIFY_SSL=false for development');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Perform GET request
   */
  async get(endpoint: string, params?: any): Promise<any> {
    const response = await this.client.get(endpoint, { params });
    //console.log('GET', endpoint, params, response.request);
    return response.data;
  }

  /**
   * Perform POST request
   */
  async post(endpoint: string, data?: any): Promise<any> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  /**
   * Perform PUT request
   */
  async put(endpoint: string, data?: any): Promise<any> {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  /**
   * Perform PATCH request
   */
  async patch(endpoint: string, data?: any): Promise<any> {
    const response = await this.client.patch(endpoint, data);
    return response.data;
  }

  /**
   * Perform DELETE request
   */
  async delete(endpoint: string, data?: any): Promise<any> {
    const config: AxiosRequestConfig = {};
    if (data) {
      config.data = data;
    }
    const response = await this.client.delete(endpoint, config);
    return response.data;
  }

  /**
   * Test connection to NDB server
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.get('/clusters');
      console.log('✅ NDB connection test successful');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ NDB connection test failed:', errorMessage);
      return false;
    }
  }

  /**
   * Get server info
   */
  async getServerInfo(): Promise<any> {
    try {
      return await this.get('/clusters');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get server info: ${errorMessage}`);
    }
  }
}

/**
 * Create NDB client from environment variables
 */
export function createNDBClient(): NDBClient {
  const baseUrl = process.env.NDB_BASE_URL;
  const token = process.env.NDB_TOKEN;
  const username = process.env.NDB_USERNAME;
  const password = process.env.NDB_PASSWORD;
  const timeout = process.env.NDB_TIMEOUT ? parseInt(process.env.NDB_TIMEOUT) : 30000;
  const verifySsl = process.env.NDB_VERIFY_SSL !== 'false';

  if (!baseUrl) {
    throw new Error('Missing required environment variable: NDB_BASE_URL');
  }

  if (token) {
    // Token-based authentication
    return new NDBClient({ baseUrl, token, timeout, verifySsl });
  } else if (username && password) {
    // Basic authentication
    return new NDBClient({ baseUrl, username, password, timeout, verifySsl });
  } else {
    throw new Error('Missing required environment variables: NDB_TOKEN or (NDB_USERNAME and NDB_PASSWORD)');
  }
}