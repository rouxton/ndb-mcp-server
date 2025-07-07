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
// import "mcps-logger/console"; // Uncomment if you want to use console logging
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { NDBClient, createNDBClient } from './ndb_client.js';
import { formatResponse, parseJsonArgument, advancedFilter } from './utils.js';
import { tools } from './tools.js';
import type { ToolCallArgs } from './types.js';

// Create the MCP server
const server = new Server(
  {
    name: 'ndb-mcp-server',
    version: '1.1.3', // Updated version
    description: `NDB MCP Server for managing Nutanix Database Service (NDB). It provides mutliples tools to manage databases, clones, snapshots, and infrastructure through natural language commands.
    
    Hints:
    - Most of the request asking for information about databases will go either through list_databases or list_dbservers, the latter being able to provide information about databases running on a specific dbserver, and thus also aother information like the cluster
    - Use the most specific attributes first to reduce the result set.
    - Combine multiple filters in the same query to narrow down the results.
    - If the request fails, never try to fall back to a more generic tool, always try to fix the request by providing the missing parameters or correcting the syntax.
    - This MCP server does not provide tools to configure NDB itself, such as creating users or configuring profiles. It is focused on database management, clones, snapshots, and infrastructure operations. Configure NDB using the official NDB UI or CLI.

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
  // Map first, then apply advanced filtering
  let mapped = Array.isArray(allDatabases)
    ? allDatabases.map((db: any) => ({
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
      }))
    : [];
  let filtered = advancedFilter(mapped, args.valueType, args.value);
  return filtered;
}

async function handleGetDatabase(args: any) {
  const params: any = {
    'value-type': args.valueType || 'id',
    'detailed': args.detailed,
    'load-dbserver-cluster': args.loadDbserverCluster
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

  // Add optional parameters if they exist
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

  // Map actionArguments to the expected format
  if (args.actionArguments && Array.isArray(args.actionArguments)) {
    data.actionArguments = args.actionArguments.map((arg: any) => ({
      name: arg.name,
      value: typeof arg.value === 'string' ? arg.value : String(arg.value)
    }));
  }

  // Map nodes if provided
  if (args.nodes && Array.isArray(args.nodes)) {
    data.nodes = args.nodes.map((node: any) => ({
      properties: node.properties || [],
      vmName: node.vmName
    }));
  }

  // Map SLA at the timeMachineInfo level
  if (args.slaId) {
    data.timeMachineInfo = data.timeMachineInfo || {};
    data.timeMachineInfo.slaId = args.slaId;
  }

  return await ndbClient.post('/databases/provision', data);
}

async function validateAndCollectMissingParams(args: any) {
  const missing = [];

  // Check required common parameters
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

  // Check specific parameters based on database type
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
// Database Server Management Handlers
//////////////////////////////////////
async function handleListDbservers(args: any) {
  const params: any = {
    'load-databases': args.loadDatabases,
    'load-clones': args.loadClones
  };
  const fullList = await ndbClient.get('/dbservers', params);
  // Mapping d'abord, puis filtrage avancé
  let mapped = Array.isArray(fullList)
    ? fullList.map((srv: any) => {
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
      })
    : [];
  let filtered = advancedFilter(mapped, args.valueType, args.value);
  return filtered;
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
  // Mapping d'abord, puis filtrage avancé
  let mapped = Array.isArray(allClones)
    ? allClones.map((clone: any) => ({
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
      }))
    : [];
  let filtered = advancedFilter(mapped, args.valueType, args.value);
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
  // No params to API, always use defaults
  const allTms = await ndbClient.get('/tms', null);
  // Map first to the reduced schema to guarantee the presence of properties, then filter
  let mapped = Array.isArray(allTms)
    ? allTms.map((tm: any) => ({
        id: tm.id,
        name: tm.name,
        description: tm.description,
        databaseId: tm.databaseId,
        logDriveId: tm.logDriveId,
        type: tm.type,
        status: tm.status,
        slaId: tm.slaId,
        scheduleId: tm.scheduleId,
        ownerId: tm.ownerId,
        dateCreated: tm.dateCreated,
        dateModified: tm.dateModified,
        properties: Array.isArray(tm.properties)
          ? tm.properties.map((p: any) => ({
              ref_id: p.ref_id,
              name: p.name,
              value: p.value,
              secure: p.secure ?? false,
              description: p.description
            }))
          : [],
        zeroSla: tm.zeroSla ?? false,
        slaSet: tm.slaSet ?? false,
        continuousRecoveryEnabled: tm.continuousRecoveryEnabled ?? false,
        snapshotableState: tm.snapshotableState ?? false
      }))
    : [];
  let filtered = advancedFilter(mapped, args.valueType, args.value);
  return filtered;
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
  // Liste des valueType supportés côté API
  const apiKeys = [
    'type',
    'status',
    'protection-domain-id',
    'database-node',
    'snapshot-id',
    'time-machine',
    'latest'
  ];
  let apiValueTypes: string[] = [];
  let apiValues: string[] = [];
  let localValueTypes: string[] = [];
  let localValues: string[] = [];

  if (args.valueType && args.value) {
    const keys = args.valueType.split(',').map((k: string) => k.trim());
    const values = args.value.split(',').map((v: string) => v.trim());
    for (let i = 0; i < keys.length; i++) {
      if (apiKeys.includes(keys[i])) {
        apiValueTypes.push(keys[i]);
        apiValues.push(values[i]);
      } else {
        localValueTypes.push(keys[i]);
        localValues.push(values[i]);
      }
    }
  }

  // Prépare les paramètres API uniquement avec les filtres supportés
  const params: any = {
    'database-ids': args.databaseIds,
    limit: args.limit || 100
  };
  if (apiValueTypes.length > 0) {
    params['value-type'] = apiValueTypes.join(',');
    params['value'] = apiValues.join(',');
  }

  const snapshots = await ndbClient.get('/snapshots', params);
  // Mapping réduit selon le schéma fourni
  let mapped = Array.isArray(snapshots)
    ? snapshots.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        ownerId: s.ownerId,
        dateCreated: s.dateCreated,
        dateModified: s.dateModified,
        queryCount: s.queryCount,
        snapshotId: s.snapshotId,
        snapshotUuid: s.snapshotUuid,
        protectionDomainId: s.protectionDomainId,
        timeMachineId: s.timeMachineId,
        databaseNodeId: s.databaseNodeId,
        appInfoVersion: s.appInfoVersion,
        status: s.status,
        type: s.type,
        snapshotTimeStamp: s.snapshotTimeStamp,
        snapshotSize: s.snapshotSize,
        fromTimeStamp: s.fromTimeStamp,
        toTimeStamp: s.toTimeStamp
      }))
    : [];
  // Only local advanced filtering on valueType not supported by the API
  let filtered =
    localValueTypes.length > 0
      ? advancedFilter(mapped, localValueTypes.join(','), localValues.join(','))
      : mapped;
  return filtered;
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
  // Appel API sans paramètre
  const allClusters = await ndbClient.get('/clusters', null);
  // Mapping réduit selon le schéma demandé
  let mapped = Array.isArray(allClusters)
    ? allClusters.map((c: any) => ({
        id: c.id,
        name: c.name,
        uniqueName: c.uniqueName,
        ipAddresses: Array.isArray(c.ipAddresses) ? c.ipAddresses : [],
        fqdns: Array.isArray(c.fqdns) ? c.fqdns : [],
        description: c.description,
        cloudType: c.cloudType,
        dateCreated: c.dateCreated,
        dateModified: c.dateModified,
        ownerId: c.ownerId,
        status: c.status,
        version: c.version,
        hypervisorType: c.hypervisorType,
        hypervisorVersion: c.hypervisorVersion
      }))
    : [];
  let filtered = advancedFilter(mapped, args.valueType, args.value);
  return filtered;
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
  let profiles = await ndbClient.get('/profiles', params);
  // Mapping d'abord, puis filtrage avancé
  let mapped = Array.isArray(profiles)
    ? profiles.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        dateCreated: p.dateCreated,
        dateModified: p.dateModified,
        owner: p.owner,
        engineType: p.engineType,
        type: p.type,
        nxClusterId: p.nxClusterId,
        topology: p.topology,
        dbVersion: p.dbVersion,
        systemProfile: p.systemProfile ?? false,
        assocDbServers: Array.isArray(p.assocDbServers) ? p.assocDbServers : [],
        assocDatabases: Array.isArray(p.assocDatabases) ? p.assocDatabases : [],
        latestVersion: p.latestVersion,
        latestVersionId: p.latestVersionId,
        versions: Array.isArray(p.versions)
          ? p.versions.map((v: any) => ({
              id: v.id,
              name: v.name,
              description: v.description,
              dateCreated: v.dateCreated,
              dateModified: v.dateModified,
              owner: v.owner,
              engineType: v.engineType,
              type: v.type,
              nxClusterId: v.nxClusterId,
              topology: v.topology,
              dbVersion: v.dbVersion,
              systemProfile: v.systemProfile ?? false,
              assocDbServers: Array.isArray(v.assocDbServers) ? v.assocDbServers : [],
              assocDatabases: Array.isArray(v.assocDbServers) ? v.assocDbServers : [],
              version: v.version,
              profileId: v.profileId,
              published: v.published ?? false,
              deprecated: v.deprecated ?? false
            }))
          : []
      }))
    : [];
  let filtered = advancedFilter(mapped, args.valueType, args.value);
  return filtered;
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
  const params: any = {};
  if (args.dbserverId) params['dbserver-id'] = args.dbserverId;
  if (args['eraServer'] !== undefined) params['era-server'] = args['eraServer'];
  if (args.ip) params['ip'] = args.ip;
  if (args.clientId) params['client-id'] = args.clientId;
  if (args.status) params['status'] = args.status;
  if (args.type) params['type'] = args.type;
  if (args.hideSubops !== undefined) params['hide-subops'] = args.hideSubops;
  if (args.systemTriggered !== undefined) params['system-triggered'] = args.systemTriggered;
  if (args.userTriggered !== undefined) params['user-triggered'] = args.userTriggered;
  if (args.scheduled !== undefined) params['scheduled'] = args.scheduled;
  if (args.dateSubmitted) params['date-submitted'] = args.dateSubmitted;
  if (args.fromTime) params['from-time'] = args.fromTime;
  if (args.toTime) params['to-time'] = args.toTime;
  if (args.days) params['days'] = args.days;
  if (args.entityId) params['entity-id'] = args.entityId;
  if (args.entityName) params['entity-name'] = args.entityName;
  if (args.entityType) params['entity-type'] = args.entityType;
  if (args.timeZone) params['time-zone'] = args.timeZone;
  if (args.descending !== undefined) params['descending'] = args.descending;
  if (args.operationId) params['operation-id'] = args.operationId;
  if (args.timestamp) params['timestamp'] = args.timestamp;
  if (args.limit) params['limit'] = args.limit;
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
  const apiResult = await ndbClient.get('/alerts', params);
  // If the result has an 'entities' array, use it; otherwise, use the result directly
  const alerts = Array.isArray(apiResult?.entities) ? apiResult.entities : apiResult;
  // Reduced mapping (adapt to typical NDB alert fields)
  let mapped = Array.isArray(alerts)
    ? alerts.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        status: a.status,
        severity: a.severity,
        type: a.type,
        entityType: a.entityType,
        entityId: a.entityId,
        entityName: a.entityName,
        dateCreated: a.dateCreated,
        dateModified: a.dateModified,
        resolved: a.resolved,
        resolution: a.resolution,
        acknowledged: a.acknowledged,
        acknowledgedBy: a.acknowledgedBy,
        acknowledgedAt: a.acknowledgedAt
      }))
    : [];
  let filtered = advancedFilter(mapped, args.valueType, args.value);
  return filtered;
}

// Get full details for a single alert by alertId
async function handleGetAlert(args: any) {
  return await ndbClient.get(`/alerts/${args.alertId}`);
}

// List all NDB users with advanced filtering using valueType/value
async function handleListUsers(args: any) {
  const users = await ndbClient.get('/users');
  // Mapping réduit (garde les champs principaux)
  let mapped = Array.isArray(users)
    ? users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        isExternalAuth: user.isExternalAuth,
        passwordExpired: user.passwordExpired,
        roles: user.roles
      }))
    : [];
  // Filtrage avancé (supporte booléens, arrays, etc.)
  let filtered = advancedFilter(mapped, args.valueType, args.value);
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
