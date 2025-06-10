# Sample Workflows

This document provides complete workflow examples for common NDB management scenarios using the MCP server with Claude Desktop.

## 🚀 Database Provisioning Workflow

### Scenario: Provision a new PostgreSQL database for development

**Step 1: Check available resources**
```
Show me all available compute profiles for PostgreSQL databases
```

**Step 2: Get cluster information**
```
List all clusters and show me their current resource utilization
```

**Step 3: Provision the database**
```
Provision a new PostgreSQL database with these specifications:
- Name: "dev-app-db"
- Software Profile: "postgres-13-standard"
- Compute Profile: "medium-compute"
- Network Profile: "dev-network"
- Target Cluster: "dev-cluster-01"
- Time Machine: Enable with daily snapshots at 2 AM
- Database Parameters: Default PostgreSQL settings
```

**Step 4: Monitor provisioning**
```
Show me the status of all operations from the last hour
```

**Step 5: Verify deployment**
```
Get details for database "dev-app-db" including time machine status
```

## 🔄 Clone Management Workflow

### Scenario: Create development clone from production database

**Step 1: Check source database**
```
Get details for database "prod-ecommerce-db" including recent snapshots
```

**Step 2: Review available snapshots**
```
Show me all snapshots for the production e-commerce database from the last 7 days
```

**Step 3: Create clone**
```
Create a clone of "prod-ecommerce-db" with these settings:
- Clone name: "dev-ecommerce-clone"
- Description: "Development clone for feature testing"
- Use latest snapshot
- Target cluster: "dev-cluster"
- Compute profile: "small-compute"
- Create new database server: yes
```

**Step 4: Monitor clone creation**
```
Get the status of clone creation operation for "dev-ecommerce-clone"
```

**Step 5: Set up refresh schedule**
```
Update clone "dev-ecommerce-clone" to automatically refresh weekly from production
```

## 📸 Backup and Recovery Workflow

### Scenario: Implement comprehensive backup strategy

**Step 1: Audit current backup coverage**
```
Show me all time machines and their current status, including any health issues
```

**Step 2: Check SLA compliance**
```
List all SLA policies and show which databases are assigned to each
```

**Step 3: Take emergency snapshot**
```
Take a manual snapshot of database "critical-app-db" named "pre-upgrade-backup" that expires in 30 days
```

**Step 4: Verify backup capability**
```
Show the recovery capabilities for time machine "critical-app-tm" including point-in-time recovery timeline
```

**Step 5: Test recovery process**
```
Create a test clone from the emergency snapshot to verify data integrity
```

## 🔧 Maintenance Window Workflow

### Scenario: Perform scheduled maintenance on production database

**Step 1: Prepare for maintenance**
```
Pause time machine "prod-db-tm" with reason "Scheduled maintenance window - OS patching"
```

**Step 2: Take pre-maintenance snapshot**
```
Take a snapshot named "pre-maintenance-backup" of the production database
```

**Step 3: Monitor system during maintenance**
```
Show me all active operations and alerts in the system
```

**Step 4: Resume operations**
```
Resume time machine "prod-db-tm" and reset capability if needed
```

**Step 5: Verify post-maintenance**
```
Check the status and capabilities of all time machines to ensure everything is working correctly
```

## 📊 Monitoring and Alerting Workflow

### Scenario: Daily health check and monitoring

**Step 1: System overview**
```
Show me a summary of all databases, their status, and any current alerts
```

**Step 2: Check failed operations**
```
List all failed operations from the last 24 hours and their error details
```

**Step 3: Review storage usage**
```
Show cluster resource utilization and identify any capacity issues
```

**Step 4: Alert management**
```
List all unresolved alerts and their severity levels
```

**Step 5: Generate health report**
```
Create a comprehensive health report including:
- Database status summary
- Time machine health
- Recent operation success rates
- Storage and compute utilization
- Outstanding alerts and recommendations
```

## 🏗️ Infrastructure Management Workflow

### Scenario: Add new database server to environment

**Step 1: Check cluster capacity**
```
Show me all clusters with their current database server count and resource utilization
```

**Step 2: Register new server**
```
Register a new database server with these details:
- IP address: "192.168.1.100"
- Cluster: "prod-cluster-01"
- Database type: PostgreSQL
- Username: "era"
- Working directory: "/tmp"
```

**Step 3: Verify registration**
```
Get details for the newly registered database server including its status and capabilities
```

**Step 4: Update profiles if needed**
```
Show me all network profiles available for the new cluster
```

## 🔄 Environment Refresh Workflow

### Scenario: Refresh development environment with latest production data

**Step 1: Inventory development clones**
```
List all clones in the development environment and their last refresh dates
```

**Step 2: Check production snapshots**
```
Show me the latest snapshots from all production databases
```

**Step 3: Refresh development databases**
```
Refresh all development clones with the latest production snapshots:
- "dev-app-clone" from "prod-app-db"
- "dev-analytics-clone" from "prod-analytics-db"
- "dev-user-clone" from "prod-user-db"
```

**Step 4: Monitor refresh operations**
```
Show the status of all refresh operations currently running
```

**Step 5: Verify data consistency**
```
Get details for all refreshed development databases to verify successful updates
```

## 🧹 Cleanup and Optimization Workflow

### Scenario: Clean up old resources and optimize storage

**Step 1: Identify cleanup candidates**
```
List all snapshots older than 90 days that can be safely deleted
```

**Step 2: