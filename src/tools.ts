/**
 * MCP Tools definitions for NDB operations
 */

export const tools = [
  ////////////////////////
  // Database Management
  ////////////////////////
  {
    name: 'list_databases',
    description: `Get all registered and provisioned database instances with comprehensive filtering options. Returns a list of database objects with summarized information including status, type, ownership, etc. 
    Use get_database tool to get detailed information about a specific database instance.

    **Available Filters (valueType/value pairs):**
    - **name**: Database instance name in NDB (supports partial matching with *pattern*)
    - **description**: Database instance description text
    - **ownerId**: User ID who owns the database instance (use list_users to resolve usernames)
    - **dateCreated/dateModified**: Date filters (use >YYYY-MM-DD, <YYYY-MM-DD for comparisons)
    - **clustered**: true/false - whether database instance is clustered
    - **eraCreated**: true/false - NDB-provisioned (greenfield) vs registered (brownfield)
    - **databaseName**: Database instance name on the VM (may differ from instance name)
    - **type**: Database engine type (postgres_database, oracle_database, sqlserver_database, mariadb_database, mysql_database, saphana_database, mongodb_database)
    - **status**: Operational status (READY=operational, ERA_DAEMON_UNREACHABLE=agent issues, PROVISIONING=in progress, FAILED=error state)
    - **dbserverLogicalClusterId**: Logical cluster hosting the database
    - **timeMachineId**: Associated time machine for backups
    - **timeZone**: Database timezone setting

    **Advanced Filtering:**
    - Operators: !value (not), >value/<value (comparison), *value* (contains)
    - Multiple filters: combine with comma-separated valueType/value pairs
    - Example: Find PostgreSQL production databases: valueType=\"type,name\", value=\"postgres_database,*prod*\"

    **Performance Note:** Always use specific filters to reduce result set size in large environments.

    **Use Cases:**
    - Find databases by engine type or status
    - Locate databases owned by specific users
    - Search for databases with naming patterns
    - Identify problematic databases (non-READY status)
    - Get overview of database infrastructure

    **Hint:** For databases on specific clusters, use list_dbservers with loadDatabases=true instead.

    `,
inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Comma-separated list of attribute names to filter on (e.g. \"type\" for engine type, \"type,status\" for multiple filters, \"name\" for database name search)',
        },
        value: {
          type: 'string',
          description: 'Comma-separated list of values corresponding to valueType. Use operators: !value (not), >value/<value (comparison), *value* (contains). Examples: \"postgres_database\", \"READY\", \"*prod*\", \"!READY\"',
        },

      },
      required: []
    }
  },
  {
    name: 'get_database',
    description: `Get detailed (not filtered) information for a specific database. Returns comprehensive database details including configuration, status, cluster information, and associated resources.

    **Returned Information:**
    - Database configuration and properties (properties are database engine specific, for instance, Oracle has properties about PDBs/CDBs configuration, PostgreSQL has properties about extensions, etc.)
    - Current operational status and health
    - Associated time machine and backup details (only timeMachineId if detailed=false)
    - Infrastructure details in the databaseNodes array of objects, which contains in turn a dbServers collection. 
    - Database hosted on this instance details in the linkedDatabases array of objects. The info.created_by attribute in the info sub object is useful to identify the user who created the database: if it's "user" it means the database was created by a user (as part of the provisioning process), if it's "system" it means it was created by NDB.
    - Resource utilization and metadata
    - Tags and lifecycle configuration

    **Options:**
    - detailed: Set to true to load complete entity details including timeMachine details. Usefull if you want to get extra info like the number of clones related to this database instance.
    - loadDbserverCluster: Set to true to include cluster information for the associated dbserver.

    **Search Options:**
    - By ID: Internal NDB database identifier (most precise)
    - By name: Database instance name as shown in NDB
    - By database-name: Internal database name (may differ from instance name)
    `,
    inputSchema: {
      type: 'object',
      properties: {
        databaseId: {
          type: 'string',
          description: 'Database identifier - can be NDB database ID, instance name, or internal database name'
        },
        valueType: {
          type: 'string',
          description: 'Type of identifier provided',
          enum: ['id', 'name', 'database-name'],
          default: 'id'
        },
        detailed: {
          type: 'boolean',
          description: 'Load complete entity details including extended metadata and properties',
          default: false
        },
        loadDbserverCluster: {
          type: 'boolean',
          description: 'Include cluster information for the associated dbserver',
          default: false
        }
      },
      required: ['databaseId']
    }
  },
  {
    name: 'get_provision_inputs',
    description: `Get required and optional parameters for provisioning a specific database engine type. Returns metadata about all configuration options including descriptions, default values, and validation requirements.

    **Supported Database Engines:**
    - **postgres_database**: PostgreSQL (versions 10+)
    - **oracle_database**: Oracle Database (11g, 12c, 18c, 19c)
    - **sqlserver_database**: Microsoft SQL Server (2014+)
    - **mysql_database**: MySQL (5.7+)
    - **mariadb_database**: MariaDB (10.x)
    - **saphana_database**: SAP HANA
    - **mongodb_database**: MongoDB (4.0+)

    **Use this tool before provision_database to understand required parameters for each engine type.**`,
    inputSchema: {
      type: 'object',
      properties: {
        databaseEngine: {
          type: 'string',
          description: 'Database engine type to get provisioning parameters for',
          enum: ['oracle_database', 'postgres_database', 'sqlserver_database', 'mariadb_database', 'mysql_database', 'saphana_database', 'mongodb_database']
        }
      },
      required: ['databaseEngine']
    }
  },
  {
    name: 'provision_database',
    description: `Provision a new database instance using NDB with intelligent parameter validation and guided configuration. Creates a database with associated time machine for backups and recovery.

    **Key Features:**
    - Automatic parameter validation and suggestions for missing required fields
    - Support for both standalone and clustered deployments
    - Integrated time machine creation for data protection
    - Flexible profile assignment (software, compute, network, database parameter)

    **Common Configuration Patterns:**
    - **Quick Start**: Provide only databaseType and name - other parameters will be suggested
    - **Production**: Specify all profiles, cluster settings, and SLA requirements
    - **Development**: Use default profiles with minimal configuration

    **Profile Types:**
    - **Software Profile**: Database engine version and configuration
    - **Compute Profile**: CPU, memory, and storage sizing
    - **Network Profile**: Network settings and VLAN assignment
    - **Database Parameter Profile**: Engine-specific tuning parameters

    **Time Machine**: Automatically created for backup and recovery capabilities.`,
    inputSchema: {
      type: 'object',
      properties: {
        databaseType: {
          type: 'string',
          description: 'Database engine type to provision',
          enum: ['oracle_database', 'postgres_database', 'sqlserver_database', 'mariadb_database', 'mysql_database', 'saphana_database', 'mongodb_database']
        },
        name: {
          type: 'string',
          description: 'Database instance name (will be visible in NDB interface)'
        },
        databaseDescription: {
          type: 'string',
          description: 'Database description for identification and documentation (optional)'
        },
        softwareProfileId: {
          type: 'string',
          description: 'Software profile ID defining database version and base configuration (will be suggested if not provided)'
        },
        softwareProfileVersionId: {
          type: 'string', 
          description: 'Software profile version ID for specific database version (will be suggested if not provided)'
        },
        computeProfileId: {
          type: 'string',
          description: 'Compute profile ID defining CPU, memory, and storage resources (will be suggested if not provided)'
        },
        networkProfileId: {
          type: 'string',
          description: 'Network profile ID defining VLAN and network configuration (will be suggested if not provided)'
        },
        dbParameterProfileId: {
          type: 'string',
          description: 'Database parameter profile ID for engine-specific tuning (will be suggested if not provided)'
        },
        nxClusterId: {
          type: 'string',
          description: 'Nutanix cluster ID where database will be deployed (will be suggested if not provided)'
        },
        newDbServerTimeZone: {
          type: 'string',
          description: 'Database server timezone (e.g. \"UTC\", \"America/New_York\", \"Europe/London\") - optional'
        },
        createDbserver: {
          type: 'boolean',
          description: 'Create new database server VM for this database (true) or use existing server (false)',
          default: true
        },
        nodeCount: {
          type: 'integer',
          description: 'Number of nodes for clustered deployment (1 for standalone)',
          default: 1
        },
        clustered: {
          type: 'boolean',  
          description: 'Deploy as clustered database for high availability (requires nodeCount > 1)',
          default: false
        },
        sshPublicKey: {
          type: 'string',
          description: 'SSH public key for server access and administration (optional)'
        },
        autoTuneStaging_drive: {
          type: 'boolean',
          description: 'Enable automatic staging drive optimization (recommended for most deployments)',
          default: false
        },
        nodes: {
          type: 'array',
          description: 'Node configuration for multi-node clustered deployments (required for clustered=true)',
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
          description: 'SLA ID for backup and retention policies (optional - default SLA will be used)'
        },
        timeMachineInfo: {
          type: 'object',
          description: 'Time machine configuration for backup and recovery policies (optional - defaults will be applied)'
        },
        actionArguments: {
          type: 'array',
          description: 'Engine-specific configuration parameters (use get_provision_inputs to see available options for each database type)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' }
            }
          }
        },
        skipValidation: {
          type: 'boolean',
          description: 'Skip parameter validation and proceed directly with provided values (use with caution)',
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
    
    **Available Filters (valueType/value pairs):**
    - **name**: name of the dbserver VM
    - **description**: description of the dbserver
    - **ipAddresses**: array of IP addresses (partial match supported)
    - **fqdns**: array of FQDNs (partial match supported)
    - **status**: Operational status (UP=DbServer VM is up and running, DOWN=DbServer VM is down, PROVISIONING=in progress, FAILED=error state)
    - **nxClusterId**: Nutanix cluster ID
    - **databaseType**: type of the database engine (postgres_database, oracle_database, etc.)
    - **dbserverClusterId**: ID of the logical cluster
    - **databases**: number of databases (use valueType = "databases" and value = ">0" for dbservers with at least one database)
    - **databases.<property>**: filter on a property of at least one database (e.g. databases.status, etc.)

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
    description: `Get list of all time machines. Returns a summarized list of time machines with key fields only.

**Returned fields:**
- id, name, description, databaseId, logDriveId, type, status, slaId, scheduleId, ownerId, dateCreated, dateModified, properties (array of {ref_id, name, value, secure, description}), zeroSla, slaSet, continuousRecoveryEnabled, snapshotableState

**Advanced Filtering:**
- You can use operators in value for advanced filtering: !value for negation, >value or <value for comparisons, and *value* for partial (substring) search.
- Multiple filters: combine with comma-separated valueType/value pairs (e.g. valueType="status,type", value="READY,CONTINUOUS")
- You can filter on the number of elements in an array property by using the property name (e.g. valueType="properties", value=">1" for time machines with more than one property)
- You can filter on a property of a nested array by using dot notation (e.g. valueType="properties.name", value="*retention*")
- Examples:
  - Find all time machines in READY status: valueType="status", value="READY"
  - Find time machines with more than one property: valueType="properties", value=">1"
  - Find time machines with a property whose name contains 'retention': valueType="properties.name", value="*retention*"
  - Find time machines not in CONTINUOUS type: valueType="type", value="!CONTINUOUS"
  - Find time machines created after 2024-01-01: valueType="dateCreated", value=">2024-01-01"

**Performance Note:** Always use specific filters to reduce result set size in large environments.
`,
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Comma-separated list of attribute names to filter on (e.g. "status", "type", "properties.name")',
        },
        value: {
          type: 'string',
          description: 'Comma-separated list of values corresponding to valueType. Use operators: !value (not), >value/<value (comparison), *value* (contains).',
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
    description: `Get list of all Nutanix clusters with advanced filtering and reduced schema mapping. Returns only the most relevant fields for each cluster.

**Returned fields:**
- id: string
- name: string
- uniqueName: string
- ipAddresses: string[]
- fqdns: string[]
- description: string
- cloudType: string
- dateCreated: string
- dateModified: string
- ownerId: string
- status: string
- version: string
- hypervisorType: string
- hypervisorVersion: string

**Advanced Filtering:**
- Use valueType/value to filter the result set after mapping. Supports all returned fields, including array length (e.g. ipAddresses, fqdns).
- Operators: !value (not), >value/<value (comparison), *value* (contains)
- Multiple filters: combine with comma-separated valueType/value pairs
- Examples:
  - Find clusters with name containing 'prod': valueType="name", value="*prod*"
  - Find clusters with more than one IP: valueType="ipAddresses", value=">1"
  - Find clusters not in READY status: valueType="status", value="!READY"
  - Find clusters created after 2024-01-01: valueType="dateCreated", value=">2024-01-01"

**Performance Note:** Always use specific filters to reduce result set size in large environments.
`,
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Comma-separated list of attribute names to filter on (e.g. "name", "status,cloudType")',
        },
        value: {
          type: 'string',
          description: 'Comma-separated list of values corresponding to valueType. Use operators: !value (not), >value/<value (comparison), *value* (contains).',
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
    description: `Get a list of all profiles with advanced filtering options.

**Profile types:**
- **Software**: The image that will be used to create the database (e.g. a specific version of PostgreSQL, Oracle, etc.).
- **Compute**: The resources that will be allocated to the database (CPU, RAM, etc.). Compute profiles are database engine agnostic, meaning they can be used for any database engine.
- **Network**: The network configuration that will be applied to the database (VLAN, subnet, etc.).
- **Database_Parameter**: The database parameters that will be applied to the database (init parameters, tuning, etc.).

**API-side filtering parameters:**
- **engine**: Filter by database engine (e.g. postgres_database, oracle_database, etc.)
- **type**: Filter by profile type (Software, Compute, Network, Database_Parameter)

These parameters are sent directly to the NDB API to reduce the result set before advanced filtering is applied.

**Advanced Filtering (MCP server-side):**
- Use valueType/value to filter the result set returned by the API before sending to the LLM.
- Supports filtering on top-level profile fields and nested properties of versions (e.g. versions.name, versions.published, versions.length).
- Operators: !value (not), >value/<value (comparison), *value* (contains)
- Multiple filters: combine with comma-separated valueType/value pairs
- Example: Find all user-defined PostgreSQL software profiles with at least 2 published versions: valueType="engineType,type,systemProfile,versions.length,versions.published", value="postgres_database,Software,false,>=2,true"

**Available valueType fields:**
- **id, name, description, owner, engineType, type, nxClusterId, dbVersion, systemProfile, dateCreated, dateModified** (top-level)
- **versions.length**: Number of versions
- **versions.<property>**: Any property of a version (e.g. versions.name, versions.published)

**Returned fields:**
- Only the following fields are included: id, name, description, dateCreated, dateModified, owner, engineType, type, nxClusterId, topology, dbVersion, systemProfile, assocDbServers, assocDatabases, latestVersion, latestVersionId, versions (with the same fields for each version).

**Use Cases:**
- List all available software or compute profiles for a given engine
- Filter profiles by owner, type, or cluster
- Search for profiles with specific naming patterns
- Filter on the number or properties of versions (e.g. only profiles with published versions)
- Get a concise overview of profile versions and their publication status
`,
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
        },
        valueType: {
          type: 'string',
          description: 'Comma-separated list of fields to filter on (e.g. "name,type,systemProfile")'
        },
        value: {
          type: 'string',
          description: 'Comma-separated list of values to filter by (e.g. "*prod*,Software,false")'
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
    description: `Get list of operations (short info) with all supported filters from the NDB API.

**Available parameters:**
- dbserverId: Filter by database server ID
- eraServer: Filter by era server (boolean)
- ip: Filter by IP address
- clientId: Filter by client ID
- status: Filter by operation status
- type: Filter by operation type
- hideSubops: Hide sub-operations (boolean)
- systemTriggered: Filter by system-triggered operations (boolean)
- userTriggered: Filter by user-triggered operations (boolean)
- scheduled: Filter by scheduled operations (boolean)
- dateSubmitted: Filter by submission date (string)
- fromTime: Filter by start time (string)
- toTime: Filter by end time (string)
- days: Number of days to look back (string)
- entityId: Filter by entity ID
- entityName: Filter by entity name
- entityType: Filter by entity type
- timeZone: Time zone for timestamps (default: UTC)
- descending: Sort descending (boolean)
- operationId: Filter by operation ID
- timestamp: Filter by timestamp (string)
- limit: Limit number of results (string)

**Example usage:**
- List all failed operations in the last 7 days: status="FAILED", days="7"
- List operations for a specific database: entityId="<db-id>"
- List only user-triggered operations: userTriggered=true
`,
    inputSchema: {
      type: 'object',
      properties: {
        dbserverId: { type: 'string', description: 'Filter by database server ID' },
        eraServer: { type: 'boolean', description: 'Filter by era server' },
        ip: { type: 'string', description: 'Filter by IP address' },
        clientId: { type: 'string', description: 'Filter by client ID' },
        status: { type: 'string', description: 'Filter by operation status' },
        type: { type: 'string', description: 'Filter by operation type' },
        hideSubops: { type: 'boolean', description: 'Hide sub-operations' },
        systemTriggered: { type: 'boolean', description: 'Filter by system-triggered operations' },
        userTriggered: { type: 'boolean', description: 'Filter by user-triggered operations' },
        scheduled: { type: 'boolean', description: 'Filter by scheduled operations' },
        dateSubmitted: { type: 'string', description: 'Filter by submission date' },
        fromTime: { type: 'string', description: 'Filter by start time' },
        toTime: { type: 'string', description: 'Filter by end time' },
        days: { type: 'string', description: 'Number of days to look back' },
        entityId: { type: 'string', description: 'Filter by entity ID' },
        entityName: { type: 'string', description: 'Filter by entity name' },
        entityType: { type: 'string', description: 'Filter by entity type' },
        timeZone: { type: 'string', description: 'Time zone for timestamps (default: UTC)' },
        descending: { type: 'boolean', description: 'Sort descending' },
        operationId: { type: 'string', description: 'Filter by operation ID' },
        timestamp: { type: 'string', description: 'Filter by timestamp' },
        limit: { type: 'string', description: 'Limit number of results' }
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
    description: `Get list of all alerts with advanced filtering options. Returns a reduced set of fields for each alert.

**API-side filters:**
- resolved: Filter by resolution status
- timeInterval: Time interval filter

**Advanced Filtering (MCP server-side):**
- Use valueType/value to filter the result set after mapping. Supports all returned fields, including status, severity, type, entityType, entityId, entityName, dateCreated, resolved, acknowledged, etc.
- Operators: !value (not), >value/<value (comparison), *value* (contains)
- Multiple filters: combine with comma-separated valueType/value pairs
- Examples:
  - Find unresolved critical alerts: valueType="status,severity,resolved", value="OPEN,CRITICAL,false"
  - Find alerts for a specific entity: valueType="entityId", value="<id>"
  - Find alerts acknowledged by a user: valueType="acknowledgedBy", value="*admin*"
`,
    inputSchema: {
      type: 'object',
      properties: {
        resolved: { type: 'string', description: 'Filter by resolution status' },
        timeInterval: { type: 'string', description: 'Time interval filter' },
        valueType: { type: 'string', description: 'Comma-separated list of attribute names to filter on (e.g. "status,severity")' },
        value: { type: 'string', description: 'Comma-separated list of values corresponding to valueType' }
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