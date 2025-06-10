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
  private authToken?: string;

  constructor(config: NDBConfig) {
    this.config = config;
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: `${config.baseUrl}/era/v0.9`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.verifySsl !== false
      })
    });

    // Add request interceptor to handle authentication
    this.client.interceptors.request.use(async (config) => {
      if (!this.authToken) {
        await this.authenticate();
      }
      
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      } else {
        // Fallback to basic auth
        const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
        config.headers.Authorization = `Basic ${auth}`;
      }
      
      return config;
    });

    // Add response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.authToken) {
          // Token expired, try to re-authenticate
          this.authToken = undefined;
          await this.authenticate();
          // Retry the original request
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with NDB server
   * Attempts token-based auth first, falls back to basic auth
   */
  private async authenticate(): Promise<void> {
    try {
      // NDB typically uses basic auth, but this structure allows for token-based auth if available
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      const response = await axios.post(`${this.config.baseUrl}/era/v0.9/auth/login`, {}, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: this.config.verifySsl !== false
        })
      });
      
      if (response.data?.token) {
        this.authToken = response.data.token;
        console.error('✅ Token authentication successful');
      }
    } catch (error) {
      // If token auth fails, fall back to basic auth
      console.error('⚠️ Token authentication failed, using basic auth');
    }
  }

  /**
   * Perform GET request
   */
  async get(endpoint: string, params?: any): Promise<any> {
    const response = await this.client.get(endpoint, { params });
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
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
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
      throw new Error(`Failed to get server info: ${error}`);
    }
  }
}

/**
 * Create NDB client from environment variables
 */
export function createNDBClient(): NDBClient {
  const baseUrl = process.env.NDB_BASE_URL;
  const username = process.env.NDB_USERNAME;
  const password = process.env.NDB_PASSWORD;
  const timeout = process.env.NDB_TIMEOUT ? parseInt(process.env.NDB_TIMEOUT) : 30000;
  const verifySsl = process.env.NDB_VERIFY_SSL !== 'false';

  if (!baseUrl || !username || !password) {
    throw new Error('Missing required environment variables: NDB_BASE_URL, NDB_USERNAME, NDB_PASSWORD');
  }

  return new NDBClient({
    baseUrl,
    username,
    password,
    timeout,
    verifySsl
  });
}