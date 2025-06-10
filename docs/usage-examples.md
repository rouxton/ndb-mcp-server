# Usage Examples

This guide provides practical examples of using the NDB MCP Server with Claude Desktop for common database management tasks. Each example includes the natural language query and expected results.

## Table of Contents

- [Getting Started](#getting-started)
- [Database Management](#database-management)
- [Clone Operations](#clone-operations)
- [Snapshot Management](#snapshot-management)
- [Time Machine Operations](#time-machine-operations)
- [Infrastructure Management](#infrastructure-management)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
- [Advanced Workflows](#advanced-workflows)
- [Best Practices](#best-practices)

## Getting Started

### Verify NDB Connection

**Query:**
```
Check if the NDB server is accessible and list available tools
```

**Expected Response:**
Claude will confirm connection and list all available NDB tools including databases, clones, snapshots, clusters, etc.

### Environment Overview

**Query:**
```
Give me an overview of the NDB environment including clusters, databases, and current operations
```

**Expected Response:**
- List of clusters with status
- Count of databases by type
- Recent operations summary
- Any active alerts or issues

## Database Management

### List All Databases

**Query:**
```
Show me all databases in the NDB environment
```

**What it does:**
- Lists all registered databases
- Shows database types (PostgreSQL, MySQL, Oracle, etc.)
- Displays current status and cluster information

**Query:**
```
List only PostgreSQL databases with their current status
```

**Expected Response:**
- Filtered list showing only PostgreSQL databases
- Status information (running, stopped, etc.)
- Associated cluster and server details

### Get Database Details

**Query:**
```
Show me detailed information about the database named "production-app-db"
```

**What it does:**
- Retrieves comprehensive database information
- Shows configuration details, resource usage
- Lists associated time machines and clones

**Query:**
```
What's the current status and configuration of database ID abc123-def456?
```

**Expected Response:**
- Database status, engine version, size
- Current performance metrics
- Backup and time machine configuration

### Database Provisioning

**Query:**
```
I need to provision a new PostgreSQL database called "test-env-db" for development
```

**What it does:**
- Shows available provisioning options
- Lists required configuration parameters
- Explains the provisioning process

**Follow-up Query:**
```
Provision a PostgreSQL database with these specifications:
- Name: test-env-db
- Size: 100GB
- Cluster: development-cluster
- Profile: small-compute
```

**Expected Response:**
- Starts provisioning operation
- Returns task ID for monitoring
- Estimated completion time

### Database Registration

**Query:**
```
Register an existing PostgreSQL database running on server 10.1.1.100
```

**What it does:**
- Shows registration requirements
- Lists necessary connection details
- Explains the registration process

## Clone Operations

### List Clones

**Query:**
```
Show me all database clones and their source databases
```

**Expected Response:**
- List of all clones with source database information
- Clone status and creation dates
- Resource usage for each clone

### Create a Clone

**Query:**
```
Create a clone of the "production-sales-db" database for testing
```

**What it does:**
- Shows available clone options
- Lists snapshots available for cloning
- Explains clone creation process

**Follow-up Query:**
```
Create a clone from the latest snapshot of production-sales-db:
- Clone name: sales-test-clone
- Target server: test-server-01
- Use latest snapshot
```

**Expected Response:**
- Initiates clone creation
- Returns task information
- Estimated completion time

### Refresh a Clone

**Query:**
```
Refresh the "sales-test-clone" with the latest data from production
```

**What it does:**
- Refreshes clone with latest snapshot
- Maintains clone configuration
- Minimal downtime refresh

**Query:**
```
Refresh clone "dev-environment" with data from yesterday at 6 PM
```

**Expected Response:**
- Point-in-time refresh operation
- Uses specific timestamp for refresh
- Returns refresh task details

## Snapshot Management

### List Snapshots

**Query:**
```
Show me all snapshots for the production-app-db database
```

**Expected Response:**
- List of snapshots with timestamps
- Snapshot types (manual, automatic, policy-based)
- Size and status information

### Create Manual Snapshot

**Query:**
```
Take a manual snapshot of the "critical-app-db" database before maintenance
```

**What it does:**
- Creates immediate snapshot
- Useful before major changes
- Returns snapshot details

**Query:**
```
Create a snapshot named "pre-migration-backup" for database "legacy-system"
```

**Expected Response:**
- Initiates snapshot creation
- Custom snapshot name applied
- Task tracking information

### Delete Old Snapshots

**Query:**
```
Delete snapshots older than 30 days for the development databases
```

**What it does:**
- Identifies old snapshots
- Shows deletion candidates
- Confirms deletion operation

## Time Machine Operations

### List Time Machines

**Query:**
```
Show me all time machines and their current status
```

**Expected Response:**
- List of all time machines
- Associated databases
- Current status and health

### Check Time Machine Capability

**Query:**
```
What is the point-in-time recovery capability for the "production-orders-db" time machine?
```

**What it does:**
- Shows recovery time range
- Lists available snapshots
- Displays continuous backup status

**Expected Response:**
- Recovery capability details
- Available time ranges for PITR
- Last successful backup timestamp

### Pause/Resume Time Machine

**Query:**
```
Pause the time machine for "maintenance-db" during the upgrade window
```

**What it does:**
- Temporarily stops backup operations
- Useful during maintenance
- Preserves existing backups

**Query:**
```
Resume the paused time machine for "maintenance-db" after upgrade completion
```

**Expected Response:**
- Resumes backup operations
- May trigger catch-up operations
- Returns to normal schedule

## Infrastructure Management

### List Clusters

**Query:**
```
Show me all clusters with their current status and resource usage
```

**Expected Response:**
- List of clusters (physical and logical)
- Resource utilization metrics
- Health status indicators

### List Database Servers

**Query:**
```
What database servers are available and what databases are running on each?
```

**What it does:**
- Lists all registered database servers
- Shows hosted databases per server
- Resource allocation information

### Check Profiles

**Query:**
```
Show me available compute and software profiles for PostgreSQL
```

**Expected Response:**
- List of compute profiles (CPU, memory configurations)
- Software profiles (PostgreSQL versions)
- Network profiles available

### SLA Policies

**Query:**
```
What SLA policies are configured and which databases use them?
```

**What it does:**
- Lists all SLA policies
- Shows retention settings
- Maps policies to databases

## Monitoring and Troubleshooting

### Check Recent Operations

**Query:**
```
Show me all operations from the last 24 hours and their status
```

**Expected Response:**
- Recent operations list
- Success/failure status
- Operation duration and details

### View Alerts

**Query:**
```
Are there any active alerts or issues I should be aware of?
```

**What it does:**
- Lists active alerts
- Shows alert severity levels
- Provides resolution suggestions

### Failed Operations

**Query:**
```
Show me any failed operations from the last week
```

**Expected Response:**
- List of failed operations
- Error messages and causes
- Suggested resolution steps

### Database Health Check

**Query:**
```
Check the health status of all production databases
```

**What it does:**
- Checks database availability
- Reviews backup status
- Identifies potential issues

## Advanced Workflows

### Development Environment Setup

**Query:**
```
I need to set up a complete development environment. Clone the production-app-db, production-users-db, and production-analytics-db to a development cluster with reduced resources.
```

**What it does:**
- Plans multi-database clone operation
- Suggests appropriate resource sizing
- Coordinates related operations

**Expected Response:**
- Step-by-step plan for environment setup
- Resource recommendations
- Estimated timeline and dependencies

### Disaster Recovery Test

**Query:**
```
I want to test our disaster recovery procedure. Show me how to restore the "critical-app-db" to a point in time from 2 hours ago on a different cluster.
```

**What it does:**
- Demonstrates restore procedure
- Shows available recovery points
- Explains cross-cluster restore process

### Database Migration Workflow

**Query:**
```
Plan a database migration from PostgreSQL 12 to PostgreSQL 15 for "legacy-app-db"
```

**Expected Response:**
- Migration strategy recommendations
- Required steps and prerequisites
- Risk mitigation suggestions

### Automated Maintenance

**Query:**
```
Schedule regular maintenance for all development databases: weekly snapshots, monthly profile updates, and quarterly cleanup of old clones
```

**What it does:**
- Plans automated maintenance schedule
- Shows policy configuration options
- Estimates resource impact

## Best Practices

### Daily Operations

**Morning Checklist Query:**
```
Give me a daily status report: any failed backups, alerts, running operations, and databases needing attention
```

**Expected Response:**
- Comprehensive health dashboard
- Priority items requiring attention
- Routine maintenance reminders

### Weekly Review

**Query:**
```
Provide a weekly summary: resource usage trends, backup status, clone usage, and recommendations for optimization
```

**What it does:**
- Analyzes usage patterns
- Identifies optimization opportunities
- Provides capacity planning insights

### Resource Management

**Query:**
```
Show me databases that haven't been accessed in 30 days and their resource consumption
```

**Expected Response:**
- List of inactive databases
- Resource usage analysis
- Recommendations for cleanup

### Capacity Planning

**Query:**
```
Analyze storage growth trends for the last 3 months and predict when we'll need additional capacity
```

**What it does:**
- Reviews historical growth data
- Projects future requirements
- Suggests scaling strategies

## Common Query Patterns

### Filtering and Searching

```
Show me all PostgreSQL databases in the production cluster that are larger than 500GB
```

```
List clones created in the last 7 days that are still active
```

```
Find all snapshots tagged with "pre-migration" across all databases
```

### Status and Health Queries

```
Which databases have backup issues or are missing recent snapshots?
```

```
Show me any time machines that are paused or have failed operations
```

```
List all databases with high resource utilization
```

### Operational Queries

```
What maintenance windows are scheduled for this week?
```

```
Show me the progress of all currently running operations
```

```
Which databases are due for profile updates or patching?
```

## Troubleshooting Common Issues

### Connection Problems

**Query:**
```
I'm getting connection errors. Test the NDB connectivity and show me cluster status
```

**What it does:**
- Tests NDB server connectivity
- Checks cluster health
- Identifies network issues

### Performance Issues

**Query:**
```
Database "app-prod-db" is running slowly. Show me its current resource usage and recent operations
```

**Expected Response:**
- Current performance metrics
- Recent operations that might impact performance
- Resource utilization analysis

### Backup Failures

**Query:**
```
The time machine for "critical-db" shows backup failures. What's the issue and how do I fix it?
```

**What it does:**
- Analyzes backup failure causes
- Shows error details
- Suggests resolution steps

### Clone Issues

**Query:**
```
Clone "test-env-clone" failed to refresh. Show me the error details and possible solutions
```

**Expected Response:**
- Specific error messages
- Common causes and solutions
- Steps to retry or resolve

## Integration Examples

### DevOps Workflows

**Query:**
```
Before deploying version 2.1, create snapshots of all production databases and prepare rollback clones
```

**What it does:**
- Creates pre-deployment snapshots
- Prepares rollback environment
- Documents recovery procedures

### Testing Workflows

**Query:**
```
Set up a testing environment with production data from last Friday for the QA team
```

**Expected Response:**
- Creates point-in-time clones
- Sets up isolated test environment
- Provides access information

### Data Analytics

**Query:**
```
Create an analytics clone of the "sales-db" with data from the last quarter for the business intelligence team
```

**What it does:**
- Creates time-bounded clone
- Optimizes for read-only analytics
- Sets up appropriate access controls

## Tips for Effective Usage

### Be Specific

Instead of: "Show me databases"
Use: "Show me all PostgreSQL databases in the production cluster with their backup status"

### Use Natural Language

The MCP server understands context, so you can ask follow-up questions:
```
1. "Show me all clones"
2. "Which ones are using the most storage?"
3. "Delete the ones older than 60 days that aren't being used"
```

### Combine Operations

```
"Create a snapshot of prod-db, then clone it to the test environment, and set up a 7-day retention policy"
```

### Ask for Explanations

```
"Explain the difference between snapshots and clones, and when I should use each"
```

### Request Recommendations

```
"What's the best practice for setting up disaster recovery for a critical PostgreSQL database?"
```

## Getting Help

If you need assistance with specific operations:

1. **Ask for available options**: "What can I do with time machines?"
2. **Request step-by-step guidance**: "Walk me through creating a database clone"
3. **Get troubleshooting help**: "Why did my snapshot operation fail?"
4. **Ask for best practices**: "What's the recommended backup strategy for production databases?"

The NDB MCP Server is designed to understand natural language queries and provide helpful, contextual responses for all your database management needs.
