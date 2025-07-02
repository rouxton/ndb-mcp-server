/**
 * MCP Tools definitions for NDB operations
 */

export const tools = [
  // Database Management
  {
    name: 'list_databases',
    description: `Get all registered and provisioned databases. Filtering is done using valueType and value fields, which are used to filter the response sent by the NDB API, for flexible filtering.
    You can filter by any of the following attribute names available in the database object:
    - name: name of the database, string
    - description: description of the database, string
    - ownerId: Id of the user, as any other Id, it needs to be reconciled with the username using the list_users tool
    - dateCreated: date when the database was created
    - dateModified: date when database was last modified
    - clustered: if the database is clustered, boolean    
    - eraCreated: if the database has been created through NDB (greenfield) or attached (brownfield), boolean
    - databaseName: same as name, string
    - type: type of the database engine (postgres_database, oracle_database, etc.)
    - status: current status of the database (e.g. "READY" when it's operational, "ERA_DAEMON_UNREACHABLE" when the agent is not reachable (and then the database is not managed by NDB), etc.)
    - dbserverLogicalClusterId: ID of the logical cluster the database is running on, can be reconciled with list_dbservers or get_dbserver tools
    - timeMachineId: ID of the time machine associated with the database, can be reconciled with list_time_machines or get_time_machine tools
    - timeZone: time zone of the database

    Examples:
    - To filter by database type: valueType = "type", value = "postgres_database"
    - To filter by type and owner: valueType = "type,ownerId", value = "postgres_database,12345"
    - To filter by status not READY: valueType = "status", value = "!READY"
    - To filter by creation date after June 1st, 2025: valueType = "dateCreated", value = ">2025-06-01"
    
    Hints:
    - list_databases doesn't not return details about the dbserver and thus the underlying cluster. If a query ask specifically to get database information on a specific cluster, use list_dbservers with loadDatabases set to true, and use additional filters if necessary.
    - You can combine any number of attributes in valueType and value to filter the results. Always try to use the most specific attributes first to reduce the result set.
    - You can use operators in value for advanced filtering: !value for negation, >value or <value for comparisons, and *value* for partial (substring) search.
    - ** Always use available filters ** to reduce the result set, as the NDB API can return a large number of databases, especially in large environments. This will help you find the specific database you are looking for quickly.
    - You can combine multiple filters in the same query to narrow down the results, such as filtering by type and status at the same time.
    

    `,
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Comma-separated list of attribute names to filter on (e.g. "databaseType", "databaseType,ownerId")',
        },
        value: {
          type: 'string',
          description: 'Comma-separated list of values corresponding to valueType (e.g. "postgres_database", "postgres_database,12345")',
        },

      },
      required: []
    }
  },
  {
    name: 'get_database',
    description: 'Get database details by ID, name, or database name',
    inputSchema: {
      type: 'object',
      properties: {
        databaseId: {
          type: 'string',
          description: 'Database ID, name, or database name'
        },
        valueType: {
          type: 'string',
          description: 'Type of identifier',
          enum: ['id', 'name', 'database-name'],
          default: 'id'
        },
        detailed: {
          type: 'boolean',
          description: 'Load entities with entire details',
          default: false
        }
      },
      required: ['databaseId']
    }
  },
  {
    name: 'get_provision_inputs',
    description: 'Get required input parameters for provisioning a specific database engine',
    inputSchema: {
      type: 'object',
      properties: {
        databaseEngine: {
          type: 'string',
          description: 'Database engine type',
          enum: ['oracle_database', 'postgres_database', 'sqlserver_database', 'mariadb_database', 'mysql_database', 'saphana_database', 'mongodb_database']
        }
      },
      required: ['databaseEngine']
    }
  },

  // Outil provision_database amélioré
  {
    name: 'provision_database',
    description: 'Provision a new database using NDB with intelligent parameter validation and assistance',
    inputSchema: {
      type: 'object',
      properties: {
        databaseType: {
          type: 'string',
          description: 'Type of database to provision',
          enum: ['oracle_database', 'postgres_database', 'sqlserver_database', 'mariadb_database', 'mysql_database', 'saphana_database', 'mongodb_database']
        },
        name: {
          type: 'string',
          description: 'Database instance name'
        },
        // Paramètres optionnels - seront proposés automatiquement si non fournis
        databaseDescription: {
          type: 'string',
          description: 'Database description (optional)'
        },
        softwareProfileId: {
          type: 'string',
          description: 'Software profile ID (will be suggested if not provided)'
        },
        softwareProfileVersionId: {
          type: 'string', 
          description: 'Software profile version ID (will be suggested if not provided)'
        },
        computeProfileId: {
          type: 'string',
          description: 'Compute profile ID (will be suggested if not provided)'
        },
        networkProfileId: {
          type: 'string',
          description: 'Network profile ID (will be suggested if not provided)'
        },
        dbParameterProfileId: {
          type: 'string',
          description: 'Database parameter profile ID (will be suggested if not provided)'
        },
        nxClusterId: {
          type: 'string',
          description: 'Nutanix cluster ID (will be suggested if not provided)'
        },
        newDbServerTimeZone: {
          type: 'string',
          description: 'Database server time zone (optional)'
        },
        createDbserver: {
          type: 'boolean',
          description: 'Create new database server for database',
          default: true
        },
        nodeCount: {
          type: 'integer',
          description: 'Number of nodes for clustered deployment',
          default: 1
        },
        clustered: {
          type: 'boolean',  
          description: 'Whether to create a clustered database',
          default: false
        },
        sshPublicKey: {
          type: 'string',
          description: 'SSH public key for server access (optional)'
        },
        autoTuneStagingDrive: {
          type: 'boolean',
          description: 'Auto-tune staging drive (optional)',
          default: false
        },
        nodes: {
          type: 'array',
          description: 'Node configuration for multi-node deployments (optional)',
          items: {
            type: 'object',
            properties: {
              vmName: { type: 'string' },
              properties: { 
                type: 'array',
                items: { type: 'object' }
              }
            }
          }
        },
        slaId: {
          type: 'string',
          description: 'SLA ID (optional)'
        },
        timeMachineInfo: {
          type: 'object',
          description: 'Time machine configuration (optional)'
        },
        actionArguments: {
          type: 'array',
          description: 'Engine-specific configuration arguments (will be prompted for based on database type)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' }
            }
          }
        },
        // Nouveau paramètre pour forcer le provisioning sans validation
        skipValidation: {
          type: 'boolean',
          description: 'Skip parameter validation and proceed directly',
          default: false
        }
      },
      required: ['databaseType', 'name']
    }
  },
  {
    name: 'register_database',
    description: 'Register an existing database with NDB',
    inputSchema: {
      type: 'object',
      properties: {
        databaseType: {
          type: 'string',
          enum: ['oracle_database', 'postgres_database', 'sqlserver_database', 'mariadb_database', 'mysql_database', 'saphana_database', 'mongodb_database']
        },
        databaseName: {
          type: 'string',
          description: 'Name of the database to register'
        },
        vmIp: {
          type: 'string',
          description: 'IP address of the VM hosting the database'
        },
        nxClusterId: {
          type: 'string',
          description: 'Nutanix cluster ID'
        },
        actionArguments: {
          type: 'array',
          description: 'Database-specific configuration arguments',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' }
            }
          }
        }
      },
      required: ['databaseType', 'databaseName', 'vmIp', 'nxClusterId']
    }
  },
  {
    name: 'update_database',
    description: 'Update database name, description, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        databaseId: {
          type: 'string',
          description: 'Database ID'
        },
        name: {
          type: 'string',
          description: 'New database name'
        },
        description: {
          type: 'string',
          description: 'New database description'
        },
        tags: {
          type: 'array',
          description: 'Database tags',
          items: {
            type: 'object',
            properties: {
              tagId: { type: 'string' },
              value: { type: 'string' }
            }
          }
        }
      },
      required: ['databaseId']
    }
  },
  {
    name: 'deregister_database',
    description: 'Deregister a database from NDB',
    inputSchema: {
      type: 'object',
      properties: {
        databaseId: {
          type: 'string',
          description: 'Database ID'
        },
        delete: {
          type: 'boolean',
          description: 'Delete the database from the dbserver',
          default: false
        },
        remove: {
          type: 'boolean',
          description: 'Cleanup/deletion operations should be submitted',
          default: false
        },
        deleteTimeMachine: {
          type: 'boolean',
          description: 'Delete associated time machine',
          default: false
        }
      },
      required: ['databaseId']
    }
  },

  // Database Server Management
  {
    name: 'list_dbservers',
    description: `Get all database servers. You can include information about databases and/or clones hosted on the db server by using the loadDatabases or loadClones parameters.
    Filtering is done using valueType and value fields, which are used to filter the response sent by the NDB API, for flexible filtering.
    You can filter by any of the following attribute names available in the dbserver object:
    - id: dbserver id, string
    - name: name of the dbserver, string
    - description: description of the dbserver, string
    - ipAddresses: array of IP addresses, string (partial match supported)
    - fqdns: array of FQDNs, string (partial match supported)
    - type: type of the dbserver, string
    - status: current status of the dbserver (e.g. "READY", etc.)
    - nxClusterId: Nutanix cluster ID, string
    - databaseType: type of the database engine (postgres_database, oracle_database, etc.)
    - dbserverClusterId: ID of the logical cluster
    - databases: number of databases (use valueType = "databases" and value = ">0" for dbservers with at least one database)
    - databases.<property>: filter on a property of at least one database (e.g. databases.status, etc.)

    Examples:
    - To filter by dbserver engine type: valueType = "type", value = "postgres_database"
    - To filter by status not READY: valueType = "status", value = "!READY"
    - To filter by name containing 'prod': valueType = "name", value = "*prod*"
    - To get dbservers with at least one database: valueType = "databases", value = ">0"
    - To get dbservers with exactly one database: valueType = "databases", value = "=1"
    - To get dbservers with at least one database in status READY: valueType = "databases.status", value = "READY"
    
    Hints:
    - You can combine any number of attributes in valueType and value to filter the results. Always try to use the most specific attributes first to reduce the result set.
    - You can use operators in value for advanced filtering: !value for negation, >value or <value for comparisons, and *value* for partial (substring) search.
    - Set loadDatabases or loadClones to false to avoid loading and returning the associated databases or clones arrays in the result.
    - Use list_dbservers with loadDatabases set to true if the request asks for databases on a specific cluster. list_databases does not provide information about the dbserver, only the databases themselves.
    - For advanced filtering on nested databases, use valueType like "databases.status" and the corresponding value.
    - ** Always use available filters ** to reduce the result set, as the NDB API can return a large number of databases, especially in large environments. This will help you find the specific database you are looking for quickly.
    - You can combine multiple filters in the same query to narrow down the results, such as filtering by type and status at the same time.
        

    `,
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Comma-separated list of attribute names to filter on (e.g. "type", "type,status")',
        },
        value: {
          type: 'string',
          description: 'Comma-separated list of values corresponding to valueType (e.g. "postgres_engine", "postgres_engine,!READY")',
        },
        loadDatabases: {
          type: 'boolean',
          description: 'Load associated databases',
          default: false
        },
        loadClones: {
          type: 'boolean',
          description: 'Load associated clones',
          default: false
        }
      },
      required: []
    }
  },
  {
    name: 'get_dbserver',
    description: 'Get database server details',
    inputSchema: {
      type: 'object',
      properties: {
        dbserverId: {
          type: 'string',
          description: 'Database server ID or other identifier'
        },
        valueType: {
          type: 'string',
          description: 'Type of identifier',
          enum: ['id', 'ip', 'name', 'vm-cluster-name', 'vm-cluster-uuid', 'dbserver-cluster-id', 'nx-cluster-id', 'fqdn'],
          default: 'id'
        },
        loadDatabases: {
          type: 'boolean',
          description: 'Load associated databases',
          default: false
        },
        loadClones: {
          type: 'boolean',
          description: 'Load associated clones',
          default: false
        }
      },
      required: ['dbserverId']
    }
  },
  {
    name: 'register_dbserver',
    description: 'Register an existing database server with NDB',
    inputSchema: {
      type: 'object',
      properties: {
        vmIp: {
          type: 'string',
          description: 'IP address of the database server VM'
        },
        nxClusterUuid: {
          type: 'string',
          description: 'Nutanix cluster UUID'
        },
        databaseType: {
          type: 'string',
          enum: ['oracle_database', 'postgres_database', 'sqlserver_database', 'mariadb_database', 'mysql_database', 'saphana_database', 'mongodb_database']
        },
        username: {
          type: 'string',
          description: 'Username for VM access'
        },
        password: {
          type: 'string',
          description: 'Password for VM access'
        },
        actionArguments: {
          type: 'array',
          description: 'Additional configuration arguments',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' }
            }
          }
        }
      },
      required: ['vmIp', 'nxClusterUuid', 'databaseType', 'username', 'password']
    }
  },

  // Clone Management
  {
    name: 'list_clones',
    description: `Get all database clones. Filtering is done using valueType and value fields, which are used to filter the response sent by the NDB API, for flexible filtering.
    You can filter by any of the following attribute names available in the clone object:
    - id: clone id, string
    - name: name of the clone, string
    - description: description of the clone, string
    - ownerId: Id of the user who created the clone, string
    - dateCreated: date when the clone was created
    - dateModified: date when the clone was last modified
    - databaseName: name of the source database, string
    - type: type of the database engine (postgres_engine, oracle_engine, etc.)
    - status: current status of the clone (e.g. "READY", etc.)
    - dbserverLogicalClusterId: ID of the logical cluster the clone is running on
    - timeMachineId: ID of the time machine associated with the clone
    - parentTimeMachineId: ID of the parent time machine (the time machine the clone was created from)
    - timeZone: time zone of the clone

    Examples:
    - To filter by clone type: valueType = "type", value = "postgres_database"
    - To filter by type and owner: valueType = "type,ownerId", value = "postgres_database,12345"
    - To filter by status not READY: valueType = "status", value = "!READY"
    - To filter by creation date after June 1st, 2025: valueType = "dateCreated", value = ">2025-06-01"
    
    Hints:
    - You can combine any number of attributes in valueType and value to filter the results. Always try to use the most specific attributes first to reduce the result set.
    - You can use operators in value for advanced filtering: !value for negation, >value or <value for comparisons, and *value* for partial (substring) search.
    

    `,
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Comma-separated list of attribute names to filter on (e.g. "type", "type,ownerId")',
        },
        value: {
          type: 'string',
          description: 'Comma-separated list of values corresponding to valueType (e.g. "postgres_database", "postgres_database,12345")',
        },
      },
      required: []
    }
  },
  {
    name: 'get_clone',
    description: 'Get clone details by ID, name, or database name',
    inputSchema: {
      type: 'object',
      properties: {
        cloneId: {
          type: 'string',
          description: 'Clone ID, name, or database name'
        },
        valueType: {
          type: 'string',
          description: 'Type of identifier',
          enum: ['id', 'name', 'database-name'],
          default: 'id'
        },
        detailed: {
          type: 'boolean',
          description: 'Load entities with entire details',
          default: false
        }
      },
      required: ['cloneId']
    }
  },
  {
    name: 'create_clone',
    description: 'Create a clone from a time machine',
    inputSchema: {
      type: 'object',
      properties: {
        timeMachineId: {
          type: 'string',
          description: 'Source time machine ID'
        },
        name: {
          type: 'string',
          description: 'Clone name'
        },
        description: {
          type: 'string',
          description: 'Clone description'
        },
        snapshotId: {
          type: 'string',
          description: 'Snapshot ID to clone from'
        },
        createDbserver: {
          type: 'boolean',
          description: 'Create new database server for clone',
          default: true
        },
        nxClusterId: {
          type: 'string',
          description: 'Target Nutanix cluster ID'
        },
        computeProfileId: {
          type: 'string',
          description: 'Compute profile ID'
        },
        networkProfileId: {
          type: 'string',
          description: 'Network profile ID'
        },
        actionArguments: {
          type: 'array',
          description: 'Clone-specific arguments',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' }
            }
          }
        }
      },
      required: ['timeMachineId', 'name']
    }
  },
  {
    name: 'refresh_clone',
    description: 'Refresh a clone with latest data',
    inputSchema: {
      type: 'object',
      properties: {
        cloneId: {
          type: 'string',
          description: 'Clone ID'
        },
        snapshotId: {
          type: 'string',
          description: 'Snapshot ID to refresh from'
        },
        latestSnapshot: {
          type: 'boolean',
          description: 'Use latest available snapshot',
          default: false
        }
      },
      required: ['cloneId']
    }
  },
  {
    name: 'delete_clone',
    description: 'Delete/deregister a clone',
    inputSchema: {
      type: 'object',
      properties: {
        cloneId: {
          type: 'string',
          description: 'Clone ID'
        },
        delete: {
          type: 'boolean',
          description: 'Delete the clone database',
          default: false
        },
        remove: {
          type: 'boolean',
          description: 'Remove clone infrastructure',
          default: false
        },
        deleteTimeMachine: {
          type: 'boolean',
          description: 'Delete associated time machine',
          default: false
        }
      },
      required: ['cloneId']
    }
  },

  // Time Machine Management
  {
    name: 'list_time_machines',
    description: 'Get list of all time machines',
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Filter type',
          enum: ['id', 'name']
        },
        value: {
          type: 'string',
          description: 'Filter value'
        },
        loadDatabase: {
          type: 'boolean',
          description: 'Load associated database info',
          default: false
        },
        loadClones: {
          type: 'boolean',
          description: 'Load associated clones',
          default: false
        }
      }
    }
  },
  {
    name: 'get_time_machine',
    description: 'Get time machine details',
    inputSchema: {
      type: 'object',
      properties: {
        timeMachineId: {
          type: 'string',
          description: 'Time machine ID or name'
        },
        valueType: {
          type: 'string',
          description: 'Type of identifier',
          enum: ['id', 'name'],
          default: 'id'
        },
        detailed: {
          type: 'boolean',
          description: 'Load entities with entire details',
          default: false
        }
      },
      required: ['timeMachineId']
    }
  },
  {
    name: 'get_time_machine_capability',
    description: 'Get recovery capability of a time machine',
    inputSchema: {
      type: 'object',
      properties: {
        timeMachineId: {
          type: 'string',
          description: 'Time machine ID'
        },
        timeZone: {
          type: 'string',
          description: 'Time zone for timestamps',
          default: 'UTC'
        },
        loadHealth: {
          type: 'boolean',
          description: 'Include health information',
          default: false
        }
      },
      required: ['timeMachineId']
    }
  },
  {
    name: 'pause_time_machine',
    description: 'Pause a time machine',
    inputSchema: {
      type: 'object',
      properties: {
        timeMachineId: {
          type: 'string',
          description: 'Time machine ID'
        },
        forced: {
          type: 'boolean',
          description: 'Force pause operation',
          default: false
        },
        reason: {
          type: 'string',
          description: 'Reason for pausing'
        }
      },
      required: ['timeMachineId']
    }
  },
  {
    name: 'resume_time_machine',
    description: 'Resume a paused time machine',
    inputSchema: {
      type: 'object',
      properties: {
        timeMachineId: {
          type: 'string',
          description: 'Time machine ID'
        },
        resetCapability: {
          type: 'boolean',
          description: 'Reset capability after resume',
          default: false
        }
      },
      required: ['timeMachineId']
    }
  },

  // Snapshot Management
  {
    name: 'list_snapshots',
    description: 'Get list of all snapshots',
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Filter type',
          enum: ['type', 'status', 'protection-domain-id', 'database-node', 'snapshot-id', 'time-machine', 'latest']
        },
        value: {
          type: 'string',
          description: 'Filter value'
        },
        databaseIds: {
          type: 'string',
          description: 'Comma-separated database IDs'
        },
        limit: {
          type: 'integer',
          description: 'Number of snapshots to return',
          default: 100
        }
      }
    }
  },
  {
    name: 'get_snapshot',
    description: 'Get snapshot details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        snapshotId: {
          type: 'string',
          description: 'Snapshot ID'
        },
        timeZone: {
          type: 'string',
          description: 'Time zone for timestamps',
          default: 'UTC'
        }
      },
      required: ['snapshotId']
    }
  },
  {
    name: 'take_snapshot',
    description: 'Take a snapshot of a time machine',
    inputSchema: {
      type: 'object',
      properties: {
        timeMachineId: {
          type: 'string',
          description: 'Time machine ID'
        },
        name: {
          type: 'string',
          description: 'Snapshot name'
        },
        expireInDays: {
          type: 'integer',
          description: 'Snapshot expiry in days'
        }
      },
      required: ['timeMachineId']
    }
  },
  {
    name: 'delete_snapshot',
    description: 'Delete a snapshot',
    inputSchema: {
      type: 'object',
      properties: {
        snapshotId: {
          type: 'string',
          description: 'Snapshot ID'
        }
      },
      required: ['snapshotId']
    }
  },

  // Cluster Management
  {
    name: 'list_clusters',
    description: 'Get list of all Nutanix clusters',
    inputSchema: {
      type: 'object',
      properties: {
        includeManagementServerInfo: {
          type: 'boolean',
          description: 'Include management server information',
          default: false
        }
      }
    }
  },
  {
    name: 'get_cluster',
    description: 'Get cluster details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        clusterId: {
          type: 'string',
          description: 'Cluster ID'
        }
      },
      required: ['clusterId']
    }
  },
  {
    name: 'get_cluster_by_name',
    description: 'Get cluster details by name',
    inputSchema: {
      type: 'object',
      properties: {
        clusterName: { type: 'string', description: 'Cluster name' }
      },
      required: ['clusterName']
    }
  },

  // Profile Management
  {
    name: 'list_profiles',
    description: 'Get list of all profiles',
    inputSchema: {
      type: 'object',
      properties: {
        engine: {
          type: 'string',
          description: 'Filter by database engine',
          enum: ['oracle_database', 'postgres_database', 'sqlserver_database', 'mariadb_database', 'mysql_database', 'saphana_database', 'mongodb_database']
        },
        type: {
          type: 'string',
          description: 'Filter by profile type',
          enum: ['Software', 'Compute', 'Network', 'Database_Parameter']
        }
      }
    }
  },
  {
    name: 'get_profile',
    description: 'Get profile details by ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'Profile ID or name'
        },
        byName: {
          type: 'boolean',
          description: 'Whether to search by name instead of ID',
          default: false
        },
        engine: {
          type: 'string',
          description: 'Filter by database engine (required when searching by name)',
          enum: ['oracle_database', 'postgres_database', 'sqlserver_database', 'mariadb_database', 'mysql_database', 'saphana_database', 'mongodb_database']
        },
        type: {
          type: 'string',
          description: 'Filter by profile type (required when searching by name)',
          enum: ['Software', 'Compute', 'Network', 'Database_Parameter']
        }
      },
      required: ['profileId']
    }
  },

  // SLA Management
  {
    name: 'list_slas',
    description: 'Get list of all SLAs',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_sla',
    description: 'Get SLA details by ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        slaId: {
          type: 'string',
          description: 'SLA ID or name'
        },
        byName: {
          type: 'boolean',
          description: 'Whether to search by name instead of ID',
          default: false
        }
      },
      required: ['slaId']
    }
  },

  // Operations and Monitoring
  {
    name: 'list_operations',
    description: 'Get list of operations',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'string',
          description: 'Number of days to look back'
        },
        entityId: {
          type: 'string',
          description: 'Filter by entity ID'
        },
        status: {
          type: 'string',
          description: 'Filter by operation status'
        },
        limit: {
          type: 'string',
          description: 'Limit number of results'
        }
      }
    }
  },
  {
    name: 'get_operation',
    description: 'Get operation details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        operationId: {
          type: 'string',
          description: 'Operation ID'
        },
        timeZone: {
          type: 'string',
          description: 'Time zone for timestamps',
          default: 'UTC'
        }
      },
      required: ['operationId']
    }
  },

  // Alerts
  {
    name: 'list_alerts',
    description: 'Get list of all alerts',
    inputSchema: {
      type: 'object',
      properties: {
        resolved: {
          type: 'string',
          description: 'Filter by resolution status'
        },
        timeInterval: {
          type: 'string',
          description: 'Time interval filter'
        }
      }
    }
  },
  {
    name: 'get_alert',
    description: 'Get alert details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'Alert ID'
        }
      },
      required: ['alertId']
    }
  },

  // User Management
  {
    name: 'list_users',
    description: `Get all NDB users. Filtering is done using valueType and value fields, which are used to filter the response sent by the NDB API, for flexible filtering.
    
    You can filter by any of the following attribute names available in the user object:
    - username: user login, string
    - email: user email, string
    - isExternalAuth: true if user is authenticated on an external directory (Active Directory), boolean
    - passwordExpired: true if password is expired, boolean
    
    Examples:
    - To filter by username: valueType = "username", value = "admin"
    - To filter by isExternalAuth: valueType = "isExternalAuth", value = "true"
    - To filter by username and passwordExpired: valueType = "username,passwordExpired", value = "admin,true"
`,
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Comma-separated list of attribute names to filter on (e.g. "username", "username,isExternalAuth")',
        },
        value: {
          type: 'string',
          description: 'Comma-separated list of values corresponding to valueType (e.g. "admin", "admin,true")',
        }
      },
      required: []
    }
  },
  {
    name: 'get_user',
    description: 'Get user details by user ID',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID'
        }
      },
      required: ['userId']
    }
  }
];