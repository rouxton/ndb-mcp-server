# Development Guide

This guide provides comprehensive information for developers who want to contribute to, extend, or understand the NDB MCP Server codebase.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude        │    │   NDB MCP       │    │   Nutanix       │
│   Desktop       │◄──►│   Server        │◄──►│   NDB           │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
    MCP Protocol           NDB REST API              Database
    (stdio/websocket)         (HTTP/HTTPS)           Operations
```

### Core Components

1. **MCP Server Core** (`src/index.ts`)
   - Protocol handling and tool registration
   - Request/response management
   - Error handling and logging

2. **NDB Client** (`src/ndb-client.ts`)
   - HTTP client for NDB API
   - Authentication management
   - Request retries and error handling

3. **Tool Definitions** (`src/tools.ts`)
   - 30+ tool implementations
   - Parameter validation
   - Response formatting

4. **Type Definitions** (`src/types.ts`)
   - TypeScript interfaces
   - API response types
   - Configuration schemas

5. **Utilities** (`src/utils.ts`)
   - Helper functions
   - Data transformations
   - Validation logic

## Project Structure

```
ndb-mcp-server/
├── src/                     # Source code
│   ├── index.ts            # Main server entry point
│   ├── ndb-client.ts       # NDB API client
│   ├── tools.ts            # MCP tool implementations
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Utility functions
├── docs/                    # Documentation
├── examples/                # Usage examples
├── scripts/                 # Setup and utility scripts
├── tests/                   # Test files (when implemented)
├── dist/                    # Compiled JavaScript (build output)
├── .env.example            # Environment template
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project overview
```

## Development Environment Setup

### Prerequisites

- Node.js 18.0.0 or later
- npm 9.0.0 or later
- TypeScript 5.0 or later
- Access to Nutanix NDB environment (for testing)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/rouxton/ndb-mcp-server.git
cd ndb-mcp-server

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your NDB credentials

# Build the project
npm run build

# Test the build
node dist/index.js
```

### Development Workflow

```bash
# Watch mode for development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm test

# Build for production
npm run build
```

## Code Organization

### MCP Server Implementation

**Main Server (`src/index.ts`)**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Server initialization
const server = new Server(
  {
    name: 'ndb-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool registration
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Tool definitions
    ],
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Tool execution logic
});
```

**NDB Client (`src/ndb-client.ts`)**
```typescript
export class NDBClient {
  private baseURL: string;
  private auth: AuthConfig;
  private timeout: number;

  constructor(config: NDBConfig) {
    this.baseURL = config.baseUrl;
    this.auth = config.auth;
    this.timeout = config.timeout || 30000;
  }

  async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    // HTTP request implementation with retry logic
  }

  // Specific API methods
  async getDatabases(params?: DatabaseQueryParams): Promise<Database[]> {
    return this.request('GET', '/databases', params);
  }
}
```

### Tool Implementation Pattern

Each tool follows a consistent pattern:

```typescript
// Tool definition
const toolDefinition: Tool = {
  name: 'ndb-list-databases',
  description: 'List all databases registered with NDB',
  inputSchema: {
    type: 'object',
    properties: {
      value_type: {
        type: 'string',
        enum: ['id', 'name', 'database-name'],
        description: 'Type of filter to apply'
      },
      // ... other parameters
    }
  }
};

// Tool implementation
async function listDatabases(args: any): Promise<ToolResult> {
  try {
    // Validate parameters
    const params = validateDatabaseParams(args);
    
    // Call NDB API
    const databases = await ndbClient.getDatabases(params);
    
    // Format response
    return {
      content: [
        {
          type: 'text',
          text: formatDatabaseList(databases)
        }
      ]
    };
  } catch (error) {
    // Error handling
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}
```

## Adding New Tools

### 1. Define Tool Schema

```typescript
// In src/tools.ts
const newToolDefinition: Tool = {
  name: 'ndb-new-operation',
  description: 'Description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      required_param: {
        type: 'string',
        description: 'Required parameter description'
      },
      optional_param: {
        type: 'boolean',
        description: 'Optional parameter description',
        default: false
      }
    },
    required: ['required_param']
  }
};
```

### 2. Implement Tool Function

```typescript
async function newOperation(args: any): Promise<ToolResult> {
  try {
    // Parameter validation
    const { required_param, optional_param = false } = args;
    
    if (!required_param) {
      throw new Error('required_param is missing');
    }

    // NDB API call
    const result = await ndbClient.performNewOperation({
      param1: required_param,
      param2: optional_param
    });

    // Response formatting
    return {
      content: [
        {
          type: 'text',
          text: `Operation completed successfully: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return handleToolError(error, 'new-operation');
  }
}
```

### 3. Register Tool

```typescript
// Add to tools array
export const tools: Tool[] = [
  // ... existing tools
  newToolDefinition
];

// Add to execution map
export async function executeTool(name: string, args: any): Promise<ToolResult> {
  switch (name) {
    // ... existing cases
    case 'ndb-new-operation':
      return newOperation(args);
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

### 4. Add Type Definitions

```typescript
// In src/types.ts
export interface NewOperationParams {
  required_param: string;
  optional_param?: boolean;
}

export interface NewOperationResponse {
  success: boolean;
  data: any;
  message: string;
}
```

### 5. Add Tests

```typescript
// In tests/tools.test.ts
describe('ndb-new-operation', () => {
  it('should execute successfully with valid parameters', async () => {
    const args = {
      required_param: 'test-value',
      optional_param: true
    };

    const result = await executeTool('ndb-new-operation', args);
    
    expect(result.content[0].type).toBe('text');
    expect(result.isError).toBeFalsy();
  });

  it('should handle missing required parameters', async () => {
    const args = {};

    const result = await executeTool('ndb-new-operation', args);
    
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('required_param is missing');
  });
});
```

## API Integration

### NDB API Patterns

**List Operations:**
```typescript
async function listResources<T>(
  endpoint: string,
  params?: QueryParams
): Promise<T[]> {
  const queryString = params ? `?${new URLSearchParams(params)}` : '';
  return this.request('GET', `${endpoint}${queryString}`);
}
```

**Get Single Resource:**
```typescript
async function getResource<T>(
  endpoint: string,
  id: string,
  valueType: string = 'id'
): Promise<T> {
  const params = valueType !== 'id' ? `?value-type=${valueType}` : '';
  return this.request('GET', `${endpoint}/${id}${params}`);
}
```

**Create Operations:**
```typescript
async function createResource<T>(
  endpoint: string,
  data: any
): Promise<TaskInfo> {
  return this.request('POST', endpoint, data);
}
```

**Update Operations:**
```typescript
async function updateResource<T>(
  endpoint: string,
  id: string,
  data: any
): Promise<T> {
  return this.request('PATCH', `${endpoint}/${id}`, data);
}
```

### Error Handling

```typescript
class NDBError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NDBError';
  }
}

function handleNDBError(error: any): NDBError {
  if (error.response) {
    // HTTP error response
    return new NDBError(
      error.response.data.message || 'NDB API error',
      error.response.status,
      error.response.data.errorCode,
      error.response.data
    );
  } else if (error.request) {
    // Network error
    return new NDBError('Network error connecting to NDB', 0, 'NETWORK_ERROR');
  } else {
    // Other error
    return new NDBError(error.message || 'Unknown error', 0, 'UNKNOWN_ERROR');
  }
}
```

### Retry Logic

```typescript
async function requestWithRetry<T>(
  method: string,
  endpoint: string,
  data?: any,
  retries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await this.makeRequest(method, endpoint, data);
    } catch (error) {
      if (attempt === retries || !isRetryableError(error)) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

function isRetryableError(error: any): boolean {
  // Retry on network errors and 5xx responses
  return !error.response || 
         error.response.status >= 500 || 
         error.code === 'ECONNRESET' ||
         error.code === 'ETIMEDOUT';
}
```

## Testing

### Test Structure

```typescript
// tests/setup.ts
import { NDBClient } from '../src/ndb-client';

// Mock NDB client for testing
export const mockNDBClient = {
  getDatabases: jest.fn(),
  getDatabase: jest.fn(),
  createDatabase: jest.fn(),
  // ... other methods
};

// Test utilities
export function createMockDatabase(overrides: Partial<Database> = {}): Database {
  return {
    id: 'test-db-id',
    name: 'test-database',
    type: 'postgres_database',
    status: 'READY',
    ...overrides
  };
}
```

```typescript
// tests/tools.test.ts
import { executeTool } from '../src/tools';
import { mockNDBClient, createMockDatabase } from './setup';

describe('Database Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ndb-list-databases', () => {
    it('should return formatted database list', async () => {
      const mockDatabases = [
        createMockDatabase({ name: 'db1' }),
        createMockDatabase({ name: 'db2' })
      ];
      
      mockNDBClient.getDatabases.mockResolvedValue(mockDatabases);

      const result = await executeTool('ndb-list-databases', {});

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('db1');
      expect(result.content[0].text).toContain('db2');
      expect(result.isError).toBeFalsy();
    });

    it('should handle API errors gracefully', async () => {
      mockNDBClient.getDatabases.mockRejectedValue(
        new Error('NDB connection failed')
      );

      const result = await executeTool('ndb-list-databases', {});

      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('NDB connection failed');
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration.test.ts
describe('NDB Integration Tests', () => {
  let ndbClient: NDBClient;

  beforeAll(() => {
    // Use test NDB environment
    ndbClient = new NDBClient({
      baseUrl: process.env.TEST_NDB_URL!,
      username: process.env.TEST_NDB_USERNAME!,
      password: process.env.TEST_NDB_PASSWORD!
    });
  });

  it('should connect to NDB and list databases', async () => {
    const databases = await ndbClient.getDatabases();
    expect(Array.isArray(databases)).toBeTruthy();
  });

  it('should handle authentication properly', async () => {
    // Test with invalid credentials
    const invalidClient = new NDBClient({
      baseUrl: process.env.TEST_NDB_URL!,
      username: 'invalid',
      password: 'invalid'
    });

    await expect(invalidClient.getDatabases()).rejects.toThrow();
  });
});
```

## Performance Optimization

### Caching Strategies

```typescript
class CachedNDBClient extends NDBClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    
    return data;
  }

  async getDatabases(params?: DatabaseQueryParams): Promise<Database[]> {
    const cacheKey = `databases:${JSON.stringify(params)}`;
    return this.getCachedData(cacheKey, () => super.getDatabases(params));
  }
}
```

### Connection Pooling

```typescript
import { Agent } from 'https';

class OptimizedNDBClient extends NDBClient {
  private agent: Agent;

  constructor(config: NDBConfig) {
    super(config);
    
    // Connection pooling
    this.agent = new Agent({
      keepAlive: true,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 60000
    });
  }

  protected getRequestConfig() {
    return {
      ...super.getRequestConfig(),
      httpsAgent: this.agent
    };
  }
}
```

### Request Batching

```typescript
class BatchedNDBClient extends NDBClient {
  private batchQueue: Array<{
    resolve: Function;
    reject: Function;
    request: RequestConfig;
  }> = [];
  
  private batchTimeout: NodeJS.Timeout | null = null;

  async batchRequest<T>(config: RequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ resolve, reject, request: config });
      
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, 100); // 100ms batch window
      }
    });
  }

  private async processBatch() {
    const batch = this.batchQueue.splice(0);
    this.batchTimeout = null;

    // Process requests in parallel
    const promises = batch.map(async ({ resolve, reject, request }) => {
      try {
        const result = await this.makeRequest(request);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    await Promise.allSettled(promises);
  }
}
```

## Debugging and Monitoring

### Debug Logging

```typescript
import debug from 'debug';

const log = debug('ndb-mcp-server');
const logClient = debug('ndb-mcp-server:client');
const logAuth = debug('ndb-mcp-server:auth');

// Usage
log('Server starting...');
logClient('Making request to %s', endpoint);
logAuth('Authentication successful for user %s', username);
```

### Performance Monitoring

```typescript
class MonitoredNDBClient extends NDBClient {
  private metrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    slowRequests: 0
  };

  async request<T>(method: string, endpoint: string, data?: any): Promise<T> {
    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      const result = await super.request<T>(method, endpoint, data);
      
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;
      
      if (responseTime > 5000) { // 5 second threshold
        this.metrics.slowRequests++;
        log(`Slow request detected: ${method} ${endpoint} took ${responseTime}ms`);
      }

      return result;
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageResponseTime: this.metrics.totalResponseTime / this.metrics.requestCount,
      errorRate: this.metrics.errorCount / this.metrics.requestCount
    };
  }
}
```

### Health Checks

```typescript
export class HealthChecker {
  constructor(private ndbClient: NDBClient) {}

  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkNDBConnectivity(),
      this.checkAuthentication(),
      this.checkBasicOperations()
    ]);

    const results = checks.map((check, index) => ({
      name: ['connectivity', 'authentication', 'operations'][index],
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      error: check.status === 'rejected' ? check.reason.message : undefined
    }));

    return {
      overall: results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy',
      checks: results,
      timestamp: new Date().toISOString()
    };
  }

  private async checkNDBConnectivity(): Promise<void> {
    const response = await fetch(`${this.ndbClient.baseURL}/era/v0.9/clusters`);
    if (!response.ok) {
      throw new Error(`NDB not accessible: ${response.status}`);
    }
  }

  private async checkAuthentication(): Promise<void> {
    await this.ndbClient.getDatabases({ limit: 1 });
  }

  private async checkBasicOperations(): Promise<void> {
    // Test basic read operations
    await Promise.all([
      this.ndbClient.getClusters(),
      this.ndbClient.getProfiles(),
      this.ndbClient.getSLAs()
    ]);
  }
}
```

## Deployment Considerations

### Production Configuration

```typescript
// config/production.ts
export const productionConfig = {
  ndb: {
    timeout: 60000,
    retries: 3,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    destination: '/var/log/ndb-mcp-server.log'
  },
  monitoring: {
    enabled: true,
    metricsInterval: 30000,
    healthCheckInterval: 60000
  }
};
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S ndb-mcp && \
    adduser -S ndb-mcp -u 1001

# Set permissions
RUN chown -R ndb-mcp:ndb-mcp /app
USER ndb-mcp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment Management

```bash
# Development
NODE_ENV=development
DEBUG=ndb-mcp-server:*
NDB_TIMEOUT=30000

# Staging
NODE_ENV=staging
DEBUG=ndb-mcp-server:error,ndb-mcp-server:warn
NDB_TIMEOUT=45000

# Production
NODE_ENV=production
DEBUG=ndb-mcp-server:error
NDB_TIMEOUT=60000
```

## Contributing Guidelines

### Code Style

```typescript
// Use explicit types
function processDatabase(database: Database): ProcessedDatabase {
  return {
    id: database.id,
    name: database.name,
    status: database.status
  };
}

// Use meaningful names
const databasesByStatus = databases.reduce((acc, db) => {
  if (!acc[db.status]) {
    acc[db.status] = [];
  }
  acc[db.status].push(db);
  return acc;
}, {} as Record<string, Database[]>);

// Handle errors explicitly
try {
  const result = await risky_operation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  throw new ApplicationError('Failed to process request', error);
}
```

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added for new functionality
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Type definitions updated
- [ ] Security review completed
- [ ] Performance impact assessed

### Release Process

1. **Version Update**
   ```bash
   npm version patch|minor|major
   ```

2. **Build and Test**
   ```bash
   npm run build
   npm test
   npm run lint
   ```

3. **Create Release**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

4. **Deploy**
   ```bash
   npm publish
   docker build -t ndb-mcp-server:1.0.0 .
   docker push ndb-mcp-server:1.0.0
   ```

## Resources

### Documentation
- [MCP Protocol Specification](https://modelcontextprotocol.io/docs)
- [Nutanix NDB API Documentation](https://www.nutanix.dev/reference/ndb/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools and Libraries
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/) - Testing framework
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting
- [Debug](https://www.npmjs.com/package/debug) - Debugging utility

### Development Environment
- [VS Code](https://code.visualstudio.com/) with TypeScript extension
- [Node.js](https://nodejs.org/) version manager (nvm)
- [Docker](https://www.docker.com/) for containerization
- [Postman](https://www.postman.com/) for API testing

---

For questions about development, please create an issue or start a discussion in the GitHub repository.
