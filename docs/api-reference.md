# API Reference

This document provides comprehensive reference for all NDB MCP Server tools and their parameters.

## Overview

The NDB MCP Server provides 32 tools organized into the following categories:
- **Databases** (6 tools): Core database management operations
- **Database Servers** (3 tools): Database server management
- **Clones** (5 tools): Database cloning and refresh operations
- **Time Machines** (5 tools): Backup and recovery management
- **Snapshots** (4 tools): Point-in-time snapshot operations
- **Infrastructure** (9 tools): Clusters, profiles, SLAs, operations, and alerts

## Authentication

All tools require authentication via environment variables:

```bash
NDB_BASE_URL=https://your-ndb-server.com
NDB_USERNAME=your-username
NDB_PASSWORD=your-password
NDB_TIMEOUT=30000        # Optional, default 30s
NDB_VERIFY_SSL=true      # Optional, default true
```

## Database Tools

### `list_databases`
List all databases registered with NDB.

**Parameters:**
- `valueType` (optional): Filter type - `id`, `name`, `database-name`
- `value` (optional): Filter value corresponding to valueType
- `detailed` (optional): Load detailed information (boolean)
- `loadDbserverCluster` (optional): Include cluster information (boolean)

**Example Usage:**
```
List all PostgreSQL databases in production
Show me databases created this week
Get detailed info for database 'sales-prod'
```

**Response:** Array of database objects with properties:
- `id`: Database UUID
- `name`: Database display name
- `databaseName`: Actual database name
- `type`: Database engine (postgres_database, oracle_database, etc.)
- `status`: Current status
- `clustered`: Whether database is clustered
- `dateCreated`: Creation timestamp
- `timeMachineId`: Associated time machine ID

### `get_database`
Get detailed information for a specific database.

**Parameters:**
- `databaseId` (required): Database identifier
- `valueType` (optional): Type of identifier - `id`, `name`, `database-name`
- `detailed` (optional): Load full details (boolean)
- `loadDbserverCluster` (optional): Include cluster info (boolean)

**Example Usage:**
```
Show details for database sales-prod
Get complete info for database ID abc123
```

### `provision_database`
Create a new database instance.

**Parameters:**
- `databaseType` (required): Engine type - `postgres_database`, `mysql_database`, `oracle_database`, `sqlserver_database`, `mariadb_database`, `saphana_database`, `mongodb_database`
- `name` (required): Database instance name
- `softwareProfileId` (required): Software profile UUID
- `computeProfileId` (required): Compute profile UUID
- `networkProfileId` (required): Network profile UUID
- `nxClusterId` (required): Target cluster UUID
- `timeMachineInfo` (optional): Time machine configuration
- `actionArguments` (optional): Additional configuration parameters

**Example Usage:**
```
Provision a new PostgreSQL database named 'dev-analytics'
Create a MySQL database with compute profile 'medium'
```

### `register_database`
Register an existing database with NDB.

**Parameters:**
- `databaseType` (required): Database engine type
- `databaseName` (required): Name of existing database
- `vmIp` (required): Database server IP address
- `nxClusterId` (required): Target cluster UUID
- `actionArguments` (optional): Database connection and configuration details

**Example Usage:**
```
Register existing PostgreSQL database at 192.168.1.100
Add Oracle database 'legacy-system' to NDB management
```

### `update_database`
Update database properties like name, description, or tags.

**Parameters:**
- `databaseId` (required): Database UUID
- `name` (optional): New database name
- `description` (optional): New description
- `tags` (optional): Array of tag objects

**Example Usage:**
```
Rename database to 'sales-production'
Update database description and add environment tags
```

### `deregister_database`
Deregister and optionally delete a database.

**Parameters:**
- `databaseId` (required): Database UUID
- `delete` (optional): Delete database from server (boolean)
- `remove` (optional): Remove from cluster (boolean)
- `deleteTimeMachine` (optional): Delete associated time machine (boolean)

**Example Usage:**
```
Safely remove database 'test-env' including time machine
Delete database but keep backups
```

## Database Server Tools

### `list_dbservers`
Get list of all database servers.

**Parameters:**
- `valueType` (optional): Filter type - `ip`, `name`, `vm-cluster-name`, `vm-cluster-uuid`, `dbserver-cluster-id`, `nx-cluster-id`, `fqdn`
- `value` (optional): Filter value corresponding to valueType
- `loadDatabases` (optional): Load associated databases (boolean)
- `loadClones` (optional): Load associated clones (boolean)
- `detailed` (optional): Load entities with entire details (boolean)

**Example Usage:**
```
List all database servers in cluster
Show servers with their databases
```

### `get_dbserver`
Get database server details.

**Parameters:**
- `dbserverId` (required): Database server ID or other identifier
- `valueType` (optional): Type of identifier - `id`, `ip`, `name`, `vm-cluster-name`, `vm-cluster-uuid`, `dbserver-cluster-id`, `nx-cluster-id`, `fqdn`
- `loadDatabases` (optional): Load associated databases (boolean)
- `loadClones` (optional): Load associated clones (boolean)

**Example Usage:**
```
Show details for database server by IP
Get server configuration and hosted databases
```

### `register_dbserver`
Register an existing database server with NDB.

**Parameters:**
- `vmIp` (required): IP address of the database server VM
- `nxClusterUuid` (required): Nutanix cluster UUID
- `databaseType` (required): Database engine type
- `username` (required): Username for VM access
- `password` (required): Password for VM access
- `actionArguments` (optional): Additional configuration arguments

**Example Usage:**
```
Register database server at 192.168.1.50
Add existing Oracle server to NDB management
```

## Clone Tools

### `list_clones`
List all database clones.

**Parameters:**
- `valueType` (optional): Filter type - `id`, `name`, `database-name`
- `value` (optional): Filter value
- `detailed` (optional): Load detailed information (boolean)

**Example Usage:**
```
List all clones created this month
Show test environment clones
```

### `get_clone`
Get detailed information for a specific clone.

**Parameters:**
- `cloneId` (required): Clone identifier
- `valueType` (optional): Type of identifier - `id`, `name`, `database-name`
- `detailed` (optional): Load full details (boolean)

**Example Usage:**
```
Show details for clone 'test-branch-1'
Get clone status and configuration
```

### `create_clone`
Create a new database clone from a time machine.

**Parameters:**
- `timeMachineId` (required): Source time machine UUID
- `name` (required): Clone name
- `description` (optional): Clone description
- `snapshotId` (optional): Specific snapshot to clone from
- `createDbserver` (optional): Create new database server for clone (boolean)
- `nxClusterId` (optional): Target Nutanix cluster ID
- `computeProfileId` (optional): Compute profile ID
- `networkProfileId` (optional): Network profile ID
- `actionArguments` (optional): Clone-specific arguments

**Example Usage:**
```
Create clone 'dev-test' from production database
Clone database to specific timestamp for debugging
```

### `refresh_clone`
Refresh a clone with latest data from source.

**Parameters:**
- `cloneId` (required): Clone ID
- `snapshotId` (optional): Specific snapshot to refresh from
- `latestSnapshot` (optional): Use latest available snapshot (boolean)

**Example Usage:**
```
Refresh test clone with latest production data
Update clone to yesterday's snapshot
```

### `delete_clone`
Delete/deregister a clone.

**Parameters:**
- `cloneId` (required): Clone ID
- `delete` (optional): Delete the clone database (boolean)
- `remove` (optional): Remove clone infrastructure (boolean)
- `deleteTimeMachine` (optional): Delete associated time machine (boolean)

**Example Usage:**
```
Remove test clone completely
Soft delete clone but keep snapshots
```

## Time Machine Tools

### `list_time_machines`
Get list of all time machines.

**Parameters:**
- `valueType` (optional): Filter type - `id`, `name`
- `value` (optional): Filter value
- `loadDatabase` (optional): Include database info (boolean)
- `loadClones` (optional): Include clone info (boolean)

**Example Usage:**
```
List all time machines for production databases
Show time machines with associated clones
```

### `get_time_machine`
Get time machine details.

**Parameters:**
- `timeMachineId` (required): Time machine ID or name
- `valueType` (optional): Type of identifier - `id`, `name`
- `detailed` (optional): Load entities with entire details (boolean)

**Example Usage:**
```
Show time machine details for 'sales-prod-tm'
Get recovery capability for time machine
```

### `get_time_machine_capability`
Get recovery capability of a time machine.

**Parameters:**
- `timeMachineId` (required): Time machine ID
- `timeZone` (optional): Time zone for timestamps (default: UTC)
- `loadHealth` (optional): Include health information (boolean)

**Example Usage:**
```
Check recovery options for production database
Show available restore points for last 7 days
```

### `pause_time_machine`
Pause a time machine.

**Parameters:**
- `timeMachineId` (required): Time machine ID
- `forced` (optional): Force pause operation (boolean)
- `reason` (optional): Reason for pausing

**Example Usage:**
```
Pause time machine for maintenance window
Temporarily stop backups for database migration
```

### `resume_time_machine`
Resume a paused time machine.

**Parameters:**
- `timeMachineId` (required): Time machine ID
- `resetCapability` (optional): Reset capability after resume (boolean)

**Example Usage:**
```
Resume time machine after maintenance
Restart backups and reset capability timeline
```

## Snapshot Tools

### `list_snapshots`
List all snapshots across time machines.

**Parameters:**
- `valueType` (optional): Filter type - `type`, `status`, `protection-domain-id`, `database-node`, `snapshot-id`, `time-machine`, `latest`
- `value` (optional): Filter value
- `databaseIds` (optional): Comma-separated database IDs
- `limit` (optional): Number of snapshots to return (default: 100)

**Example Usage:**
```
List all snapshots from last week
Show failed snapshots that need attention
```

### `get_snapshot`
Get detailed information for a specific snapshot.

**Parameters:**
- `snapshotId` (required): Snapshot UUID
- `timeZone` (optional): Time zone for timestamps (default: UTC)

**Example Usage:**
```
Show snapshot details and file list
Check snapshot replication status
```

### `take_snapshot`
Take an on-demand snapshot.

**Parameters:**
- `timeMachineId` (required): Time machine UUID
- `name` (optional): Snapshot name
- `expireInDays` (optional): Snapshot expiry in days

**Example Usage:**
```
Take snapshot before major deployment
Create named snapshot 'pre-migration-backup'
```

### `delete_snapshot`
Delete a specific snapshot.

**Parameters:**
- `snapshotId` (required): Snapshot UUID

**Example Usage:**
```
Remove old test snapshots to free space
Delete corrupted snapshot
```

## Infrastructure Tools

### `list_clusters`
List all Nutanix clusters.

**Parameters:**
- `includeManagementServerInfo` (optional): Include management server information (boolean)

**Example Usage:**
```
Show all available clusters
List clusters with their capacity
```

### `get_cluster`
Get cluster details by ID.

**Parameters:**
- `clusterId` (required): Cluster ID

**Example Usage:**
```
Show details for cluster 'prod-cluster-1'
Get cluster capacity and configuration
```

### `list_profiles`
List all profiles (software, compute, network, database parameter).

**Parameters:**
- `engine` (optional): Filter by database engine
- `type` (optional): Profile type - `Software`, `Compute`, `Network`, `Database_Parameter`

**Example Usage:**
```
List all PostgreSQL software profiles
Show available compute profiles
```

### `list_slas`
List all SLA policies.

**Example Usage:**
```
Show backup retention policies
List all available SLA templates
```

### `get_sla`
Get SLA details by ID or name.

**Parameters:**
- `slaId` (required): SLA ID or name
- `byName` (optional): Whether to search by name instead of ID (boolean)

**Example Usage:**
```
Show details for SLA policy 'production-backup'
Get retention settings for specific SLA
```

### `list_operations`
List recent NDB operations.

**Parameters:**
- `days` (optional): Number of days to look back
- `entityId` (optional): Filter by entity ID
- `status` (optional): Filter by operation status
- `limit` (optional): Limit number of results

**Example Usage:**
```
Show failed operations from last 24 hours
List all operations for specific database
```

### `get_operation`
Get detailed information for a specific operation.

**Parameters:**
- `operationId` (required): Operation UUID
- `timeZone` (optional): Time zone for timestamps (default: UTC)

**Example Usage:**
```
Check status of database provisioning operation
Get error details for failed clone operation
```

### `list_alerts`
Get list of all alerts.

**Parameters:**
- `resolved` (optional): Filter by resolution status
- `timeInterval` (optional): Time interval filter

**Example Usage:**
```
Show unresolved alerts
List all alerts from last week
```

### `get_alert`
Get alert details by ID.

**Parameters:**
- `alertId` (required): Alert ID

**Example Usage:**
```
Show details for critical alert
Get alert resolution history
```

## Response Formats

### Success Response
```json
{
  \"success\": true,
  \"data\": {
    // Tool-specific response data
  },
  \"message\": \"Operation completed successfully\"
}
```

### Error Response
```json
{
  \"success\": false,
  \"error\": {
    \"code\": \"ERROR_CODE\",
    \"message\": \"Human-readable error message\",
    \"details\": {
      // Additional error context
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_FAILED` | Invalid credentials or token expired |
| `AUTHORIZATION_DENIED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `INVALID_PARAMETERS` | Missing or invalid parameters |
| `OPERATION_FAILED` | NDB operation failed |
| `NETWORK_ERROR` | Connection or network issue |
| `TIMEOUT_ERROR` | Operation timed out |
| `INTERNAL_ERROR` | Server or parsing error |

## Rate Limiting

The NDB MCP Server implements automatic retry with exponential backoff for failed requests. Default settings:
- Initial retry delay: 1 second
- Maximum retries: 3
- Backoff multiplier: 2

## Best Practices

### Performance
- Use `detailed=false` for list operations when full details aren't needed
- Implement pagination for large result sets
- Cache cluster and profile information

### Security
- Store credentials in environment variables, never in code
- Use SSL/TLS verification in production
- Rotate passwords regularly
- Monitor for unauthorized access

### Error Handling
- Always check operation status for async operations
- Implement proper timeout handling
- Log errors with sufficient context for debugging
- Provide meaningful error messages to users

### Natural Language Usage
The MCP server is designed for natural language interactions:

```
✅ Good: \"Create a PostgreSQL clone from production for testing\"
✅ Good: \"Show me all failed operations from yesterday\"
✅ Good: \"Pause the time machine for maintenance\"

❌ Avoid: Complex technical parameters in natural language
❌ Avoid: Multiple operations in single request
```

## Troubleshooting

### Common Issues
1. **Authentication failures**: Check environment variables and NDB connectivity
2. **Permission errors**: Verify user has required NDB privileges
3. **Network timeouts**: Increase timeout or check network connectivity
4. **Resource conflicts**: Ensure resources aren't in use by other operations

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=ndb-mcp-server:*
```

For more troubleshooting information, see [Troubleshooting Guide](troubleshooting.md).
