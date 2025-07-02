#!/usr/bin/env node

/**
 * NDB MCP Server - Main Entry Point
 * 
 * A Model Context Protocol server for Nutanix Database Service (NDB)
 * that enables Claude Desktop and other MCP-compatible LLMs to manage
 * databases, clones, snapshots, and infrastructure through natural language.
 */

// Load environment variables from .env file
import 'dotenv/config';
// import "mcps-logger/console";
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
    description: `NDB MCP Server for managing Nutanix Database Service (NDB). It provides mutliples tools to manage databases, clones, snapshots, and infrastructure through natural language commands.
    
    Hints:
    - Most of the request asking for information about databases will go either through list_databases or list_dbservers, the latter being able to provide information about databases running on a specific dbserver, and thus also aother information like the cluster
    - Use the most specific attributes first to reduce the result set.
    - Combine multiple filters in the same query to narrow down the results.
    - If the request fails, never try to fall back to a more generic tool, always try to fix the request by providing the missing parameters or correcting the syntax.

    `,
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
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2) // JSON brut formaté
      }]
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
    case 'get_provision_inputs':
      return handleGetProvisionInputs(args);
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
    case 'get_cluster_by_name':
      return handleGetClusterByName(args);
    case 'list_profiles':
      return handleListProfiles(args);
    case 'get_profile':
      return handleGetProfile(args);  
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

    // User Management
    case 'list_users':
      return handleListUsers(args);
    case 'get_user':
      return handleGetUser(args);

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
}

///////////////////////////////
// Database Management Handlers
///////////////////////////////
async function handleListDatabases(args: any) {
  const allDatabases = await ndbClient.get('/databases', null);

  let filtered = allDatabases;
  // Enhanced filtering: supports !, >, <, >=, <=, *partial*, and exact match
  if (Array.isArray(filtered) && args.valueType && args.value) {
    const keys = args.valueType.split(',').map((k: string) => k.trim());
    const values = args.value.split(',').map((v: string) => v.trim());
    filtered = filtered.filter((db: any) =>
      keys.every((key: string, idx: number) => {
        const val = values[idx];
        const dbVal = db[key];
        if (val.startsWith('!')) {
          // Negative match
          return String(dbVal) !== val.substring(1);
        } else if (val.startsWith('>=')) {
          return dbVal >= val.substring(2);
        } else if (val.startsWith('<=')) {
          return dbVal <= val.substring(2);
        } else if (val.startsWith('>')) {
          return dbVal > val.substring(1);
        } else if (val.startsWith('<')) {
          return dbVal < val.substring(1);
        } else if (val.startsWith('*') && val.endsWith('*')) {
          // Partial match (case-insensitive)
          const search = val.slice(1, -1).toLowerCase();
          return String(dbVal).toLowerCase().includes(search);
        } else {
          // Exact match
          return String(dbVal) === val;
        }
      })
    );
  }
  // Only keep the main properties as per the required schema
  if (Array.isArray(filtered)) {
    filtered = filtered.map((db: any) => ({
      id: db.id,
      name: db.name,
      description: db.description,
      ownerId: db.ownerId,
      dateCreated: db.dateCreated,
      dateModified: db.dateModified,
      clustered: db.clustered,      
      eraCreated: db.eraCreated,
      placeholder: db.placeholder,
      databaseName: db.databaseName,
      type: db.type,
      status: db.status,
      databaseStatus: db.databaseStatus,
      dbserverLogicalClusterId: db.dbserverLogicalClusterId,
      timeMachineId: db.timeMachineId,
      timeZone: db.timeZone
    }));
  }

  return filtered;
}

async function handleGetDatabase(args: any) {
  const params = {
    'value-type': args.valueType || 'id',
    detailed: args.detailed
  };
  return await ndbClient.get(`/databases/${args.databaseId}`, params);
}

async function handleGetProvisionInputs(args: any) {
  const category = 'db_server;database'; 
  return await ndbClient.get(`/app_types/${args.databaseEngine}/provision/input-file`, { category });
}

async function handleProvisionDatabase(args: any) {
  // If skipValidation is true, use the executeProvisionDatabase function directly
  if (args.skipValidation) {
    return await executeProvisionDatabase(args);
  }

  // Step 1: Fetch engine-specific parameters
  const inputFile = await ndbClient.get(`/app_types/${args.databaseType}/provision/input-file`, {
    category: 'db_server;database'
  });

  // Step 2: Check and collect missing resources
  const missingParams = await validateAndCollectMissingParams(args);

  if (missingParams.length > 0) {
    // Return a help message with missing parameters and suggestions
    return {
      status: 'validation_required',
      message: 'Some required parameters are missing. Please provide the following:',
      missingParameters: missingParams,
      engineSpecificInputs: inputFile,
      suggestions: await generateSuggestions(args, missingParams)
    };
  }

  // If all parameters are present, proceed with provisioning
  return await executeProvisionDatabase(args);
}

// Function to execute provisioning with all parameters
async function executeProvisionDatabase(args: any) {
  const data: any = {
    databaseType: args.databaseType,
    name: args.name,
    softwareProfileId: args.softwareProfileId,
    computeProfileId: args.computeProfileId,
    networkProfileId: args.networkProfileId,
    nxClusterId: args.nxClusterId,
    timeMachineInfo: parseJsonArgument(args.timeMachineInfo),
    actionArguments: args.actionArguments || []
  };

  // add optional parameters if they exist
  if (args.databaseDescription) {
    data.databaseDescription = args.databaseDescription;
  }

  if (args.softwareProfileVersionId) {
    data.softwareProfileVersionId = args.softwareProfileVersionId;
  }

  if (args.dbParameterProfileId) {
    data.dbParameterProfileId = args.dbParameterProfileId;
  }

  if (args.newDbServerTimeZone) {
    data.newDbServerTimeZone = args.newDbServerTimeZone;
  }

  if (args.createDbserver !== undefined) {
    data.createDbServer = args.createDbServer;
  }

  if (args.nodeCount) {
    data.nodeCount = args.nodeCount;
  }

  if (args.clustered !== undefined) {
    data.clustered = args.clustered;
  }

  if (args.sshPublicKey) {
    data.sshPublicKey = args.sshPublicKey;
  }

  if (args.autoTuneStagingDrive !== undefined) {
    data.autoTuneStagingDrive = args.autoTuneStagingDrive;
  }

  // map actionArguments to the expected format
  if (args.actionArguments && Array.isArray(args.actionArguments)) {
    data.actionArguments = args.actionArguments.map((arg: any) => ({
      name: arg.name,
      value: typeof arg.value === 'string' ? arg.value : String(arg.value)
    }));
  }

  // map nodes if provided
  if (args.nodes && Array.isArray(args.nodes)) {
    data.nodes = args.nodes.map((node: any) => ({
      properties: node.properties || [],
      vmName: node.vmName
    }));
  }

  // map SLA at the timeMachineInfo level
  if (args.slaId) {
    data.timeMachineInfo = data.timeMachineInfo || {};
    data.timeMachineInfo.slaId = args.slaId;
  }

  return await ndbClient.post('/databases/provision', data);
}

async function validateAndCollectMissingParams(args: any) {
  const missing = [];

  // Vérifier les paramètres communs requis
  if (!args.softwareProfileId) {
    missing.push({
      parameter: 'softwareProfileId',
      description: 'Software profile ID required for database provisioning',
      type: 'required'
    });
  }

  if (!args.computeProfileId) {
    missing.push({
      parameter: 'computeProfileId', 
      description: 'Compute profile ID required for resource allocation',
      type: 'required'
    });
  }

  if (!args.networkProfileId) {
    missing.push({
      parameter: 'networkProfileId',
      description: 'Network profile ID required for network configuration', 
      type: 'required'
    });
  }

  if (!args.dbParameterProfileId) {
    missing.push({
      parameter: 'dbParameterProfileId',
      description: 'Database parameter profile ID required for database configuration',
      type: 'required'
    });
  }

  if (!args.nxClusterId) {
    missing.push({
      parameter: 'nxClusterId',
      description: 'Nutanix cluster ID required for placement',
      type: 'required'
    });
  }

  // check specific parameters based on database type
  const engineInputs = await ndbClient.get(`/app_types/${args.databaseType}/provision/input-file`, { 
    category: 'db_server;database' 
  });

  if (engineInputs?.properties) {
    for (const prop of engineInputs.properties) {
      if (prop.required === 'true' || prop.required === true) {
        const hasValue = args.actionArguments?.some((arg: any) => arg.name === prop.name);
        if (!hasValue) {
          missing.push({
            parameter: prop.name,
            description: prop.description || prop.display_name,
            type: 'engine_specific',
            engineProperty: true,
            defaultValue: prop.default_value
          });
        }
      }
    }
  }

  return missing;
}

// Function to generate suggestions
async function generateSuggestions(args: any, missingParams: any[]) {
  const suggestions: any = {};

  for (const param of missingParams) {
    try {
      switch (param.parameter) {
        case 'nxClusterId':
          const clusters = await ndbClient.get('/clusters');
          suggestions.clusters = clusters.map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status
          }));
          break;

        case 'softwareProfileId':
          const swProfiles = await ndbClient.get('/profiles', { 
            engine: args.databaseType, 
            type: 'Software' 
          });
          suggestions.softwareProfiles = swProfiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            engineType: p.engineType,
            dbVersion: p.dbVersion
          }));
          break;

        case 'computeProfileId':
          const compProfiles = await ndbClient.get('/profiles', { 
            type: 'Compute' 
          });
          suggestions.computeProfiles = compProfiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description
          }));
          break;

        case 'networkProfileId':
          const netProfiles = await ndbClient.get('/profiles', { 
            type: 'Network' 
          });
          suggestions.networkProfiles = netProfiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description
          }));
          break;

        case 'dbParameterProfileId':
          const dbParamProfiles = await ndbClient.get('/profiles', { 
            engine: args.databaseType,
            type: 'Database_Parameter' 
          });
          suggestions.dbParameterProfiles = dbParamProfiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            engineType: p.engineType
          }));
          break;
      }
    } catch (error) {
      console.warn(`Failed to fetch suggestions for ${param.parameter}:`, error);
    }
  }

  // Add suggestions for SLAs if requested
  try {
    const slas = await ndbClient.get('/slas');
    suggestions.availableSLAs = slas.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description
    }));
  } catch (error) {
    console.warn('Failed to fetch SLA suggestions:', error);
  }

  return suggestions;
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

///////////////////////////////////


//////////////////////////////////////
// Database Server Management Handlers
//////////////////////////////////////
async function handleListDbservers(args: any) {
  // Only pass load-databases and load-clones to the API
  const params: any = {
    'load-databases': args.loadDatabases,
    'load-clones': args.loadClones
  };
  const fullList = await ndbClient.get('/dbservers', params);

  let filtered = fullList;
  // Advanced filtering for dbserver and nested databases array
  if (Array.isArray(filtered) && args.valueType && args.value) {
    const keys = args.valueType.split(',').map((k: string) => k.trim());
    const values = args.value.split(',').map((v: string) => v.trim());
    filtered = filtered.filter((srv: any) =>
      keys.every((key: string, idx: number) => {
        const val = values[idx];
        // Nested filter for databases.*
        if (key.startsWith('databases.')) {
          const dbKey = key.split('.').slice(1).join('.');
          if (!Array.isArray(srv.databases)) return false;
          // If filter is on databases.length
          if (dbKey === '' || dbKey === 'length') {
            const count = srv.databases.length;
            if (val.startsWith('>=')) return count >= Number(val.substring(2));
            if (val.startsWith('<=')) return count <= Number(val.substring(2));
            if (val.startsWith('>')) return count > Number(val.substring(1));
            if (val.startsWith('<')) return count < Number(val.substring(1));
            if (val.startsWith('=')) return count === Number(val.substring(1));
            return count === Number(val);
          }
          // Otherwise, filter on a property of at least one database
          return srv.databases.some((db: any) => {
            if (val.startsWith('!')) return String(db[dbKey]) !== val.substring(1);
            if (val.startsWith('>=')) return db[dbKey] >= val.substring(2);
            if (val.startsWith('<=')) return db[dbKey] <= val.substring(2);
            if (val.startsWith('>')) return db[dbKey] > val.substring(1);
            if (val.startsWith('<')) return db[dbKey] < val.substring(1);
            if (val.startsWith('*') && val.endsWith('*')) {
              const search = val.slice(1, -1).toLowerCase();
              return String(db[dbKey]).toLowerCase().includes(search);
            }
            return String(db[dbKey]) === val;
          });
        } else {
          // Standard dbserver property
          const srvVal = srv[key];
          if (val.startsWith('!')) return String(srvVal) !== val.substring(1);
          if (val.startsWith('>=')) return srvVal >= val.substring(2);
          if (val.startsWith('<=')) return srvVal <= val.substring(2);
          if (val.startsWith('>')) return srvVal > val.substring(1);
          if (val.startsWith('<')) return srvVal < val.substring(1);
          if (val.startsWith('*') && val.endsWith('*')) {
            const search = val.slice(1, -1).toLowerCase();
            return String(srvVal).toLowerCase().includes(search);
          }
          return String(srvVal) === val;
        }
      })
    );
  }

  // Map to main properties, remove databases/clones if not loaded
  return filtered.map((srv: any) => {
    const mapped: any = {
      id: srv.id,
      eraCreated: srv.eraCreated,
      dbserverClusterId: srv.dbserverClusterId,
      name: srv.name,
      description: srv.description,
      ipAddresses: srv.ipAddresses,
      fqdns: srv.fqdns,
      type: srv.type,
      status: srv.status,
      nxClusterId: srv.nxClusterId,
      databaseType: srv.databaseType,
      eraVersion: srv.eraVersion,
      ownerId: srv.ownerId,
      dateCreated: srv.dateCreated,
      dateModified: srv.dateModified
    };
    if (args.loadDatabases !== false || args.loadClones !== false) {
      mapped.databases = Array.isArray(srv.databases)
        ? srv.databases.map((db: any) => ({
            id: db.id,
            name: db.name,
            description: db.description,
            ownerId: db.ownerId,
            dateCreated: db.dateCreated,
            dateModified: db.dateModified,
            clustered: db.clustered,
            clone: db.clone,
            databaseName: db.databaseName,
            type: db.type,
            status: db.status,
            dbserverLogicalClusterId: db.dbserverLogicalClusterId,
            timeMachineId: db.timeMachineId,
            parentTimeMachineId: db.parentTimeMachineId,
            timeZone: db.timeZone
          }))
        : [];
    }
   
    return mapped;
  });
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

///////////////////////////////////
// Clone Management Handlers
///////////////////////////////////
async function handleListClones(args: any) {
  // Get all clones from NDB
  const allClones = await ndbClient.get('/clones', null);

  let filtered = allClones;
  // Enhanced filtering: supports !, >, <, >=, <=, *partial*, and exact match
  if (Array.isArray(filtered) && args.valueType && args.value) {
    const keys = args.valueType.split(',').map((k: string) => k.trim());
    const values = args.value.split(',').map((v: string) => v.trim());
    filtered = filtered.filter((clone: any) =>
      keys.every((key: string, idx: number) => {
        const val = values[idx];
        const cloneVal = clone[key];
        if (val.startsWith('!')) {
          // Negative match
          return String(cloneVal) !== val.substring(1);
        } else if (val.startsWith('>=')) {
          return cloneVal >= val.substring(2);
        } else if (val.startsWith('<=')) {
          return cloneVal <= val.substring(2);
        } else if (val.startsWith('>')) {
          return cloneVal > val.substring(1);
        } else if (val.startsWith('<')) {
          return cloneVal < val.substring(1);
        } else if (val.startsWith('*') && val.endsWith('*')) {
          // Partial match (case-insensitive)
          const search = val.slice(1, -1).toLowerCase();
          return String(cloneVal).toLowerCase().includes(search);
        } else {
          // Exact match
          return String(cloneVal) === val;
        }
      })
    );
  }
  // Only keep the main properties as per the required schema
  if (Array.isArray(filtered)) {
    filtered = filtered.map((clone: any) => ({
      id: clone.id,
      name: clone.name,
      description: clone.description,
      ownerId: clone.ownerId,
      dateCreated: clone.dateCreated,
      dateModified: clone.dateModified,
      databaseName: clone.databaseName,
      type: clone.type,
      status: clone.status,
      dbserverLogicalClusterId: clone.dbserverLogicalClusterId,
      timeMachineId: clone.timeMachineId,
      parentTimeMachineId: clone.parentTimeMachineId,
      timeZone: clone.timeZone
    }));
  }
  return filtered;
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

///////////////////////////////////
//   End of Clone tools section  //
///////////////////////////////////

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

async function handleGetClusterByName(args: any) {
  if (!args.clusterName) {
    throw new Error('clusterName is required');
  }
  return await ndbClient.get(`/clusters/name/${encodeURIComponent(args.clusterName)}`);
}

async function handleListProfiles(args: any) {
  const params = {
    engine: args.engine,
    type: args.type
  };
  return await ndbClient.get('/profiles', params);
}

async function handleGetProfile(args: any) {
  const params = {
    id: args.byName ? undefined : args.profileId,
    name: args.byName ? args.profileId : undefined,
    engine: args.engine,
    type: args.type
  };
  
  // Filter out undefined values
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined)
  );
  
  const profiles = await ndbClient.get('/profiles', filteredParams);

  // Always return the full object(s) as received from the API
  if (Array.isArray(profiles)) {
    if (profiles.length === 1) {
      return profiles[0]; // full details, including versions
    } else if (profiles.length === 0) {
      throw new McpError(ErrorCode.InvalidRequest, `Profile not found: ${args.profileId}`);
    } else {
      // Multiple matches - return all for user to choose, with full details
      return profiles;
    }
  }
  return profiles; // full details if not an array
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

// List all NDB users with filtering on scalar properties using valueType/value
async function handleListUsers(args: any) {
  // Only pass supported params to the NDB API
  const users = await ndbClient.get('/users');
  let filtered = users;
  // Apply filtering using valueType and value on the result JSON
  if (Array.isArray(filtered) && args.valueType && args.value) {
    const keys = args.valueType.split(',').map((k: string) => k.trim());
    const values = args.value.split(',').map((v: string) => v.trim());
    filtered = filtered.filter((user: any) =>
      keys.every((key: string, idx: number) => {
        // Accept both top-level and nested keys
        // For roles (array), do an exact match
        if (key === 'roles' && Array.isArray(user[key])) {
          return JSON.stringify(user[key]) === JSON.stringify(values[idx]);
        }
        // For booleans, allow string 'true'/'false' to match boolean values
        if (typeof user[key] === 'boolean') {
          return String(user[key]) === values[idx];
        }
        return user[key] == values[idx];
      })
    );
  }
  // Only keep the main properties as per the required schema
  if (Array.isArray(filtered)) {
    filtered = filtered.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isExternalAuth: user.isExternalAuth,
      passwordExpired: user.passwordExpired,
      roles: user.roles
    }));
  }
  return filtered;
}

// Get full details for a single user by userId
async function handleGetUser(args: any) {
  return await ndbClient.get(`/users/${args.userId}`);
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
