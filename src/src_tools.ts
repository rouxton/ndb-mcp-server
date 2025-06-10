/**
 * MCP Tools definitions for NDB operations
 */

export const tools = [
  // Database Management
  {
    name: 'list_databases',
    description: 'Get all registered and provisioned databases',
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Filter type: id, name, database-name',
          enum: ['id', 'name', 'database-name']
        },
        value: {
          type: 'string',
          description: 'Filter value corresponding to valueType'
        },
        detailed: {
          type: 'boolean',
          description: 'Load entities with entire details',
          default: false
        },
        loadDbserverCluster: {
          type: 'boolean',
          description: 'Load cluster info',
          default: false
        }
      }
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
    name: 'provision_database',
    description: 'Provision a new database using NDB',
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
        softwareProfileId: {
          type: 'string',
          description: 'Software profile ID'
        },
        computeProfileId: {
          type: 'string',
          description: 'Compute profile ID'
        },
        networkProfileId: {
          type: 'string',
          description: 'Network profile ID'
        },
        nxClusterId: {
          type: 'string',
          description: 'Nutanix cluster ID'
        },
        timeMachineInfo: {
          type: 'object',
          description: 'Time machine configuration'
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
      required: ['databaseType', 'name', 'softwareProfileId', 'computeProfileId', 'networkProfileId', 'nxClusterId']
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
    description: 'Get list of all database servers',
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Filter type',
          enum: ['ip', 'name', 'vm-cluster-name', 'vm-cluster-uuid', 'dbserver-cluster-id', 'nx-cluster-id', 'fqdn']
        },
        value: {
          type: 'string',
          description: 'Filter value corresponding to valueType'
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
        },
        detailed: {
          type: 'boolean',
          description: 'Load entities with entire details',
          default: false
        }
      }
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
    description: 'Get list of all database clones',
    inputSchema: {
      type: 'object',
      properties: {
        valueType: {
          type: 'string',
          description: 'Filter type',
          enum: ['id', 'name', 'database-name']
        },
        value: {
          type: 'string',
          description: 'Filter value'
        },
        detailed: {
          type: 'boolean',
          description: 'Load entities with entire details',
          default: false
        }
      }
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
  }
];