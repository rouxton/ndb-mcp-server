#!/usr/bin/env node

/**
 * NDB MCP Server - Main Entry Point
 * 
 * A Model Context Protocol server for Nutanix Database Service (NDB)
 * that enables Claude Desktop and other MCP-compatible LLMs to manage
 * databases, clones, snapshots, and infrastructure through natural language.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { NDBClient, createNDBClient } from './ndb_client.js';
import { formatResponse, parseJsonArgument } from './utils.js';
import { tools } from './tools.js';
import type { ToolCallArgs } from './types.js';

// Create the MCP server
const server = new Server(
  {
    name: 'ndb-mcp-server',
    version: '1.0.0',
  }
);

// Initialize NDB client
let ndbClient: NDBClient;

try {
  ndbClient = createNDBClient();
  console.error('✅ NDB MCP Server initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize NDB client:', error);
  process.exit(1);
}

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(name, args as ToolCallArgs);
    return {
      content: [
        {
          type: 'text',
          text: formatResponse(result)
        }
      ]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = (error as any).response?.status;
    const responseData = (error as any).response?.data;
    
    let detailedError = `NDB API Error: ${errorMessage}`;
    if (statusCode) {
      detailedError += ` (HTTP ${statusCode})`;
    }
    if (responseData) {
      detailedError += `\nResponse: ${JSON.stringify(responseData, null, 2)}`;
    }
    
    throw new McpError(ErrorCode.InternalError, detailedError);
  }
});

/**
 * Handle tool calls by routing to appropriate handlers
 */
async function handleToolCall(name: string, args: ToolCallArgs): Promise<any> {
  switch (name) {
    // Database Management
    case 'list_databases':
      return handleListDatabases(args);
    case 'get_database':
      return handleGetDatabase(args);
    case 'provision_database':
      return handleProvisionDatabase(args);
    case 'register_database':
      return handleRegisterDatabase(args);
    case 'update_database':
      return handleUpdateDatabase(args);
    case 'deregister_database':
      return handleDeregisterDatabase(args);

    // Database Server Management
    case 'list_dbservers':
      return handleListDbservers(args);
    case 'get_dbserver':
      return handleGetDbserver(args);
    case 'register_dbserver':
      return handleRegisterDbserver(args);

    // Clone Management
    case 'list_clones':
      return handleListClones(args);
    case 'get_clone':
      return handleGetClone(args);
    case 'create_clone':
      return handleCreateClone(args);
    case 'refresh_clone':
      return handleRefreshClone(args);
    case 'delete_clone':
      return handleDeleteClone(args);

    // Time Machine Management
    case 'list_time_machines':
      return handleListTimeMachines(args);
    case 'get_time_machine':
      return handleGetTimeMachine(args);
    case 'get_time_machine_capability':
      return handleGetTimeMachineCapability(args);
    case 'pause_time_machine':
      return handlePauseTimeMachine(args);
    case 'resume_time_machine':
      return handleResumeTimeMachine(args);

    // Snapshot Management
    case 'list_snapshots':
      return handleListSnapshots(args);
    case 'get_snapshot':
      return handleGetSnapshot(args);
    case 'take_snapshot':
      return handleTakeSnapshot(args);
    case 'delete_snapshot':
      return handleDeleteSnapshot(args);

    // Infrastructure
    case 'list_clusters':
      return handleListClusters(args);
    case 'get_cluster':
      return handleGetCluster(args);
    case 'list_profiles':
      return handleListProfiles(args);
    case 'list_slas':
      return handleListSlas(args);
    case 'get_sla':
      return handleGetSla(args);

    // Operations and Monitoring
    case 'list_operations':
      return handleListOperations(args);
    case 'get_operation':
      return handleGetOperation(args);
    case 'list_alerts':
      return handleListAlerts(args);
    case 'get_alert':
      return handleGetAlert(args);

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
}

// Database Management Handlers
async function handleListDatabases(args: any) {
  const params = {
    'value-type': args.valueType,
    value: args.value,
    detailed: args.detailed,
    'load-dbserver-cluster': args.loadDbserverCluster
  };
  return await ndbClient.get('/databases', params);
}

async function handleGetDatabase(args: any) {
  const params = {
    'value-type': args.valueType || 'id',
    detailed: args.detailed
  };
  return await ndbClient.get(`/databases/${args.databaseId}`, params);
}

async function handleProvisionDatabase(args: any) {
  const data = {
    databaseType: args.databaseType,
    name: args.name,
    softwareProfileId: args.softwareProfileId,
    computeProfileId: args.computeProfileId,
    networkProfileId: args.networkProfileId,
    nxClusterId: args.nxClusterId,
    timeMachineInfo: parseJsonArgument(args.timeMachineInfo),
    actionArguments: args.actionArguments || []
  };
  return await ndbClient.post('/databases/provision', data);
}

async function handleRegisterDatabase(args: any) {
  const data = {
    databaseType: args.databaseType,
    databaseName: args.databaseName,
    vmIp: args.vmIp,
    nxClusterId: args.nxClusterId,
    actionArguments: args.actionArguments || []
  };
  return await ndbClient.post('/databases/register', data);
}

async function handleUpdateDatabase(args: any) {
  const data = {
    name: args.name,
    description: args.description,
    tags: args.tags
  };
  return await ndbClient.patch(`/databases/${args.databaseId}`, data);
}

async function handleDeregisterDatabase(args: any) {
  const data = {
    delete: args.delete || false,
    remove: args.remove || false,
    deleteTimeMachine: args.deleteTimeMachine || false
  };
  return await ndbClient.delete(`/databases/${args.databaseId}`, data);
}

// Database Server Management Handlers
async function handleListDbservers(args: any) {
  const params = {
    'value-type': args.valueType,
    value: args.value,
    'load-databases': args.loadDatabases,
    'load-clones': args.loadClones,
    detailed: args.detailed
  };
  return await ndbClient.get('/dbservers', params);
}

async function handleGetDbserver(args: any) {
  const params = {
    'value-type': args.valueType || 'id',
    'load-databases': args.loadDatabases,
    'load-clones': args.loadClones
  };
  return await ndbClient.get(`/dbservers/${args.dbserverId}`, params);
}

async function handleRegisterDbserver(args: any) {
  const data = {
    vmIp: args.vmIp,
    nxClusterUuid: args.nxClusterUuid,
    databaseType: args.databaseType,
    username: args.username,
    password: args.password,
    actionArguments: args.actionArguments || []
  };
  return await ndbClient.post('/dbservers/register', data);
}

// Clone Management Handlers
async function handleListClones(args: any) {
  const params = {
    'value-type': args.valueType,
    value: args.value,
    detailed: args.detailed
  };
  return await ndbClient.get('/clones', params);
}

async function handleGetClone(args: any) {
  const params = {
    'value-type': args.valueType || 'id',
    detailed: args.detailed
  };
  return await ndbClient.get(`/clones/${args.cloneId}`, params);
}

async function handleCreateClone(args: any) {
  const data = {
    name: args.name,
    description: args.description,
    snapshotId: args.snapshotId,
    createDbserver: args.createDbserver !== false,
    nxClusterId: args.nxClusterId,
    computeProfileId: args.computeProfileId,
    networkProfileId: args.networkProfileId,
    actionArguments: args.actionArguments || []
  };
  return await ndbClient.post(`/tms/${args.timeMachineId}/clones`, data);
}

async function handleRefreshClone(args: any) {
  const data = {
    snapshotId: args.snapshotId,
    latestSnapshot: args.latestSnapshot || false
  };
  return await ndbClient.post(`/clones/${args.cloneId}/refresh`, data);
}

async function handleDeleteClone(args: any) {
  const data = {
    delete: args.delete || false,
    remove: args.remove || false,
    deleteTimeMachine: args.deleteTimeMachine || false
  };
  return await ndbClient.delete(`/clones/${args.cloneId}`, data);
}

// Time Machine Management Handlers
async function handleListTimeMachines(args: any) {
  const params = {
    'value-type': args.valueType,
    value: args.value,
    'load-database': args.loadDatabase,
    'load-clones': args.loadClones
  };
  return await ndbClient.get('/tms', params);
}

async function handleGetTimeMachine(args: any) {
  const params = {
    'value-type': args.valueType || 'id',
    detailed: args.detailed
  };
  return await ndbClient.get(`/tms/${args.timeMachineId}`, params);
}

async function handleGetTimeMachineCapability(args: any) {
  const params = {
    'time-zone': args.timeZone || 'UTC',
    'load-health': args.loadHealth || false
  };
  return await ndbClient.get(`/tms/${args.timeMachineId}/capability`, params);
}

async function handlePauseTimeMachine(args: any) {
  const data = {
    forced: args.forced || false,
    reason: args.reason
  };
  return await ndbClient.patch(`/tms/${args.timeMachineId}/pause`, data);
}

async function handleResumeTimeMachine(args: any) {
  const data = {
    resetCapability: args.resetCapability || false
  };
  return await ndbClient.patch(`/tms/${args.timeMachineId}/resume`, data);
}

// Snapshot Management Handlers
async function handleListSnapshots(args: any) {
  const params = {
    'value-type': args.valueType,
    value: args.value,
    'database-ids': args.databaseIds,
    limit: args.limit || 100
  };
  return await ndbClient.get('/snapshots', params);
}

async function handleGetSnapshot(args: any) {
  const params = {
    'time-zone': args.timeZone || 'UTC'
  };
  return await ndbClient.get(`/snapshots/${args.snapshotId}`, params);
}

async function handleTakeSnapshot(args: any) {
  const data = {
    name: args.name,
    lcmConfig: args.expireInDays ? {
      snapshotLCMConfig: {
        expiryDetails: {
          expireInDays: args.expireInDays
        }
      }
    } : undefined
  };
  return await ndbClient.post(`/tms/${args.timeMachineId}/snapshots`, data);
}

async function handleDeleteSnapshot(args: any) {
  return await ndbClient.delete(`/snapshots/${args.snapshotId}`);
}

// Infrastructure Handlers
async function handleListClusters(args: any) {
  const params = {
    'include-management-server-info': args.includeManagementServerInfo || false
  };
  return await ndbClient.get('/clusters', params);
}

async function handleGetCluster(args: any) {
  return await ndbClient.get(`/clusters/${args.clusterId}`);
}

async function handleListProfiles(args: any) {
  const params = {
    engine: args.engine,
    type: args.type
  };
  return await ndbClient.get('/profiles', params);
}

async function handleListSlas(args: any) {
  return await ndbClient.get('/slas');
}

async function handleGetSla(args: any) {
  const endpoint = args.byName ? `/slas/name/${args.slaId}` : `/slas/${args.slaId}`;
  return await ndbClient.get(endpoint);
}

// Operations and Monitoring Handlers
async function handleListOperations(args: any) {
  const params = {
    days: args.days,
    'entity-id': args.entityId,
    status: args.status,
    limit: args.limit
  };
  return await ndbClient.get('/operations/short-info', params);
}

async function handleGetOperation(args: any) {
  const params = {
    'time-zone': args.timeZone || 'UTC'
  };
  return await ndbClient.get(`/operations/${args.operationId}`, params);
}

async function handleListAlerts(args: any) {
  const params = {
    resolved: args.resolved,
    timeInterval: args.timeInterval
  };
  return await ndbClient.get('/alerts', params);
}

async function handleGetAlert(args: any) {
  return await ndbClient.get(`/alerts/${args.alertId}`);
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 NDB MCP Server running on stdio');
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});