# API Reference

This document provides comprehensive reference for all NDB MCP Server tools and their parameters.

## Overview

The NDB MCP Server provides 30+ tools organized into the following categories:
- **Databases** (8 tools): Core database management operations
- **Clones** (6 tools): Database cloning and refresh operations
- **Time Machines** (7 tools): Backup and recovery management
- **Snapshots** (4 tools): Point-in-time snapshot operations
- **Infrastructure** (5+ tools): Clusters, servers, profiles, and operations

## Authentication

All tools require authentication via environment variables:

```bash
NDB_BASE_URL=https://your-ndb-server.com
NDB_USERNAME=your-username
NDB_PASSWORD=your-password
NDB_TIMEOUT=30000         # Optional, default 30s
NDB_VERIFY_SSL=true       # Optional, default true
```

## Database Tools

### `ndb-list-databases`
List all databases registered with NDB.

**Parameters:**
- `value_type` (optional): Filter type - `id`, `name`, `database-name`
- `value` (optional): Filter value corresponding to value_type
- `detailed` (optional): Load detailed information (boolean)
- `load_cluster` (optional): Include cluster information (boolean)

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

### `ndb-get-database`
Get detailed information for a specific database.

**Parameters:**
- `database_id` (required): Database identifier
- `value_type` (optional): Type of identifier - `id`, `name`, `database-name`
- `detailed` (optional): Load full details (boolean)
- `load_cluster` (optional): Include cluster info (boolean)

**Example Usage:**
```
Show details for database sales-prod
Get complete info for database ID abc123
```

### `ndb-provision-database`
Create a new database instance.

**Parameters:**
- `database_type` (required): Engine type - `postgres_database`, `mysql_database`, `oracle_database`, `sqlserver_database`, `mariadb_database`, `saphana_database`, `mongodb_database`
- `name` (required): Database instance name
- `software_profile_id` (required): Software profile UUID
- `compute_profile_id` (required): Compute profile UUID
- `network_profile_id` (required): Network profile UUID
- `cluster_id` (required): Target cluster UUID
- `provision_info` (required): Database-specific configuration parameters

**Example Usage:**
```
Provision a new PostgreSQL database named 'dev-analytics'
Create a MySQL database with compute profile 'medium'
```

### `ndb-register-database`
Register an existing database with NDB.

**Parameters:**
- `database_type` (required): Database engine type
- `vm_ip` (required): Database server IP address
- `database_name` (required): Name of existing database
- `cluster_id` (required): Target cluster UUID
- `application_info` (required): Database connection and configuration details

**Example Usage:**
```
Register existing PostgreSQL database at 192.168.1.100
Add Oracle database 'legacy-system' to NDB management
```

### `ndb-update-database`
Update database properties like name, description, or tags.

**Parameters:**
- `database_id` (required): Database UUID
- `name` (optional): New database name
- `description` (optional): New description
- `tags` (optional): Array of tag objects

**Example Usage:**
```
Rename database to 'sales-production'
Update database description and add environment tags
```

### `ndb-delete-database`
Deregister and optionally delete a database.

**Parameters:**
- `database_id` (required): Database UUID
- `delete` (optional): Delete database from server (boolean)
- `remove` (optional): Remove from cluster (boolean)
- `soft_remove` (optional): Soft delete only (boolean)
- `delete_time_machine` (optional): Delete associated time machine (boolean)

**Example Usage:**
```
Safely remove database 'test-env' including time machine
Delete database but keep backups
```

### `ndb-restore-database`
Restore database to a specific point in time.

**Parameters:**
- `database_id` (required): Target database UUID
- `snapshot_id` (optional): Specific snapshot to restore from
- `pitr_timestamp` (optional): Point-in-time recovery timestamp
- `latest_snapshot` (optional): Use latest available snapshot (boolean)

**Example Usage:**
```
Restore database to yesterday at 2 PM
Restore from latest snapshot
Restore database to specific snapshot ID abc123
```

### `ndb-get-database-inputs`
Get input parameters required for provisioning a specific database type.

**Parameters:**
- `database_engine` (required): Database engine type
- `operation` (required): Operation type - `provision` or `register`

**Example Usage:**
```
Get provisioning parameters for PostgreSQL
Show registration inputs for Oracle database
```

## Clone Tools

### `ndb-list-clones`
List all database clones.

**Parameters:**
- `value_type` (optional): Filter type - `id`, `name`, `database-name`
- `value` (optional): Filter value
- `detailed` (optional): Load detailed information (boolean)

**Example Usage:**
```
List all clones created this month
Show test environment clones
```

### `ndb-get-clone`
Get detailed information for a specific clone.

**Parameters:**
- `clone_id` (required): Clone identifier
- `value_type` (optional): Type of identifier
- `detailed` (optional): Load full details (boolean)

**Example Usage:**
```
Show details for clone 'test-branch-1'
Get clone status and configuration
```

### `ndb-create-clone`
Create a new database clone from a time machine.

**Parameters:**
- `time_machine_id` (required): Source time machine UUID
- `name` (required): Clone name
- `snapshot_id` (optional): Specific snapshot to clone from
- `pitr_timestamp` (optional): Point-in-time for clone
- `cluster_id` (required): Target cluster UUID
- `latest_snapshot` (optional): Use latest snapshot (boolean)

**Example Usage:**
```
Create clone 'dev-test' from production database
Clone database to specific timestamp for debugging
```

### `ndb-refresh-clone`
Refresh a clone with recent data from source.

**Parameters:**
- `clone_id` (required): Clone UUID
- `snapshot_id` (optional): Specific snapshot to refresh from
- `pitr_timestamp` (optional): Point-in-time for refresh
- `latest_snapshot` (optional): Use latest snapshot (boolean)

**Example Usage:**
```
Refresh test clone with latest production data
Update clone to yesterday's snapshot
```

### `ndb-delete-clone`
Delete a database clone.

**Parameters:**
- `clone_id` (required): Clone UUID
- `delete` (optional): Delete VM and storage (boolean)
- `remove` (optional): Remove from cluster (boolean)
- `soft_remove` (optional): Soft delete only (boolean)

**Example Usage:**
```
Remove test clone completely
Soft delete clone but keep snapshots
```

### `ndb-get-clone-inputs`
Get input parameters for clone operations.

**Parameters:**
- `database_engine` (required): Database engine type

**Example Usage:**
```
Get clone parameters for PostgreSQL
Show required inputs for MySQL clone
```

## Time Machine Tools

### `ndb-list-time-machines`
List all time machines.

**Parameters:**
- `value_type` (optional): Filter type - `id`, `name`
- `value` (optional): Filter value
- `load_database` (optional): Include database info (boolean)
- `load_clones` (optional): Include clone info (boolean)

**Example Usage:**
```
List all time machines for production databases
Show time machines with associated clones
```

### `ndb-get-time-machine`
Get detailed information for a specific time machine.

**Parameters:**
- `time_machine_id` (required): Time machine identifier
- `value_type` (optional): Type of identifier
- `detailed` (optional): Load full details (boolean)

**Example Usage:**
```
Show time machine details for 'sales-prod-tm'
Get recovery capability for time machine
```

### `ndb-get-time-machine-capability`
Get recovery capabilities and available restore points.

**Parameters:**
- `time_machine_id` (required): Time machine UUID
- `load_snapshots` (optional): Include snapshot list (boolean)
- `load_logs` (optional): Include log information (boolean)

**Example Usage:**
```
Check recovery options for production database
Show available restore points for last 7 days
```

### `ndb-pause-time-machine`
Pause time machine operations.

**Parameters:**
- `time_machine_id` (required): Time machine UUID
- `reason` (optional): Reason for pausing

**Example Usage:**
```
Pause time machine for maintenance window
Temporarily stop backups for database migration
```

### `ndb-resume-time-machine`
Resume time machine operations.

**Parameters:**
- `time_machine_id` (required): Time machine UUID
- `reset_capability` (optional): Reset recovery capability (boolean)

**Example Usage:**
```
Resume time machine after maintenance
Restart backups and reset capability timeline
```

### `ndb-update-time-machine`
Update time machine properties.

**Parameters:**
- `time_machine_id` (required): Time machine UUID
- `name` (optional): New name
- `description` (optional): New description
- `sla_id` (optional): New SLA policy UUID
- `schedule_id` (optional): New schedule UUID

**Example Usage:**
```
Update time machine SLA policy
Change backup schedule for weekend maintenance
```

### `ndb-perform-log-catchup`
Manually trigger log catchup operation.

**Parameters:**
- `time_machine_id` (required): Time machine UUID
- `switch_log` (optional): Force log switch (boolean)

**Example Usage:**
```
Force log catchup before creating clone
Ensure latest logs are captured
```

## Snapshot Tools

### `ndb-list-snapshots`
List all snapshots across time machines.

**Parameters:**
- `value_type` (optional): Filter type - `type`, `status`, `time-machine`
- `value` (optional): Filter value
- `database_ids` (optional): Comma-separated database IDs

**Example Usage:**
```
List all snapshots from last week
Show failed snapshots that need attention
```

### `ndb-get-snapshot`
Get detailed information for a specific snapshot.

**Parameters:**
- `snapshot_id` (required): Snapshot UUID
- `load_replicated_snapshots` (optional): Include replication info (boolean)

**Example Usage:**
```
Show snapshot details and file list
Check snapshot replication status
```

### `ndb-create-snapshot`
Take an on-demand snapshot.

**Parameters:**
- `time_machine_id` (required): Time machine UUID
- `name` (optional): Snapshot name
- `lcm_config` (optional): Lifecycle management configuration

**Example Usage:**
```
Take snapshot before major deployment
Create named snapshot 'pre-migration-backup'
```

### `ndb-delete-snapshot`
Delete a specific snapshot.

**Parameters:**
- `snapshot_id` (required): Snapshot UUID

**Example Usage:**
```
Remove old test snapshots to free space
Delete corrupted snapshot
```

## Infrastructure Tools

### `ndb-list-clusters`
List all NDB clusters.

**Example Usage:**
```
Show all available clusters
List clusters with their capacity
```

### `ndb-list-profiles`
List all profiles (software, compute, network, database parameter).

**Parameters:**
- `engine` (optional): Filter by database engine
- `type` (optional): Profile type - `Software`, `Compute`, `Network`, `Database_Parameter`

**Example Usage:**
```
List all PostgreSQL software profiles
Show available compute profiles
```

### `ndb-list-slas`
List all SLA policies.

**Example Usage:**
```
Show backup retention policies
List all available SLA templates
```

### `ndb-list-operations`
List recent NDB operations.

**Parameters:**
- `days` (optional): Number of days to look back
- `status` (optional): Filter by operation status

**Example Usage:**
```
Show failed operations from last 24 hours
List all operations for specific database
```

### `ndb-get-operation`
Get detailed information for a specific operation.

**Parameters:**
- `operation_id` (required): Operation UUID

**Example Usage:**
```
Check status of database provisioning operation
Get error details for failed clone operation
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Tool-specific response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
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
✅ Good: "Create a PostgreSQL clone from production for testing"
✅ Good: "Show me all failed operations from yesterday"
✅ Good: "Pause the time machine for maintenance"

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
