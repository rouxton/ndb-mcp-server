# Claude Desktop Integration Guide

Complete guide for integrating the NDB MCP Server with Claude Desktop, including multi-environment configurations and advanced usage patterns.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Automated Configuration](#automated-configuration)
- [Manual Configuration](#manual-configuration)
- [Multi-Environment Setup](#multi-environment-setup)
- [Advanced Configuration](#advanced-configuration)
- [Testing Integration](#testing-integration)
- [Troubleshooting](#troubleshooting)
- [Usage Patterns](#usage-patterns)

## Prerequisites

Before configuring Claude Desktop integration, ensure you have completed the basic setup:

- ✅ **NDB MCP Server installed**: Run `./scripts/setup.sh` (or `setup.ps1` on Windows)
- ✅ **Environment configured**: `.env` file exists with valid NDB credentials
- ✅ **Project built**: `dist/index.js` file exists (`npm run build`)
- ✅ **Connection tested**: `npm run test:connection` passes
- ✅ **Claude Desktop installed**: [Download from Anthropic](https://claude.ai/download)

## Automated Configuration

### Using Configuration Scripts

The easiest way to configure Claude Desktop is using the dedicated configuration scripts:

**For Unix/Linux/macOS:**
```bash
./scripts/configure-claude.sh
```

**For Windows (PowerShell):**
```powershell
.\scripts\configure-claude.ps1
```

**Alternative npm command:**
```bash
npm run configure:claude  # Unix/Linux/macOS only
```

### What the Configuration Script Does

1. **Prerequisites Validation**
   - Checks that `.env` configuration file exists
   - Verifies `dist/index.js` is built and current
   - Ensures setup has been completed successfully

2. **Claude Desktop Detection**
   - Automatically detects Claude Desktop configuration location
   - Creates configuration directory if it doesn't exist
   - Backs up existing configurations with timestamps

3. **Configuration Management**
   - Updates or creates `claude_desktop_config.json`
   - Preserves existing MCP server configurations
   - Loads environment variables from `.env` file
   - Uses absolute paths for reliable execution

4. **Validation and Instructions**
   - Confirms successful configuration update
   - Provides clear next steps and restart instructions
   - Shows troubleshooting guidance if issues occur

### Configuration File Locations

Claude Desktop configurations are stored in platform-specific locations:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Manual Configuration

If the automated configuration fails or you prefer manual control, edit your Claude Desktop configuration file directly:

### Basic Configuration

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/absolute/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://your-ndb-server.company.com",
        "NDB_USERNAME": "your-username",
        "NDB_PASSWORD": "your-password"
      }
    }
  }
}
```

### Token-Based Authentication

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/absolute/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://your-ndb-server.company.com",
        "NDB_TOKEN": "your-api-token",
        "NDB_VERIFY_SSL": "true"
      }
    }
  }
}
```

### Configuration with Debug Logging

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/absolute/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://your-ndb-server.company.com",
        "NDB_TOKEN": "your-api-token",
        "NDB_VERIFY_SSL": "false",
        "DEBUG": "ndb:*"
      }
    }
  }
}
```

### Important Configuration Notes

- **Use absolute paths**: Always provide full paths to avoid issues
- **Include all environment variables**: Copy from your `.env` file
- **Restart Claude Desktop**: Required after any configuration changes
- **Test independently**: Verify with `npm run test:mcp` before using with Claude

## Multi-Environment Setup

Claude Desktop can be configured to work with multiple NDB environments simultaneously, allowing you to switch between development, staging, and production instances.

### Method 1: Multiple MCP Server Entries

Configure separate MCP server entries for each environment:

```json
{
  "mcpServers": {
    "ndb-dev": {
      "command": "node",
      "args": ["/absolute/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "development",
        "NDB_BASE_URL": "https://ndb-dev.company.local",
        "NDB_USERNAME": "dev-automation",
        "NDB_PASSWORD": "dev-password",
        "NDB_VERIFY_SSL": "false",
        "DEBUG": "ndb:*"
      }
    },
    "ndb-staging": {
      "command": "node",
      "args": ["/absolute/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "staging",
        "NDB_BASE_URL": "https://ndb-staging.company.com",
        "NDB_USERNAME": "staging-user",
        "NDB_PASSWORD": "staging-password",
        "NDB_VERIFY_SSL": "true"
      }
    },
    "ndb-prod": {
      "command": "node",
      "args": ["/absolute/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "NDB_BASE_URL": "https://ndb-prod.company.com",
        "NDB_TOKEN": "your-production-api-token",
        "NDB_VERIFY_SSL": "true",
        "DEBUG": "ndb:error"
      }
    }
  }
}
```

### Method 2: Environment File References

Use shell commands to dynamically load environment files:

**For Unix/Linux/macOS:**
```json
{
  "mcpServers": {
    "ndb-dev": {
      "command": "bash",
      "args": ["-c", "cd /absolute/path/to/ndb-mcp-server && cp .env.dev .env && node dist/index.js"]
    },
    "ndb-staging": {
      "command": "bash",
      "args": ["-c", "cd /absolute/path/to/ndb-mcp-server && cp .env.staging .env && node dist/index.js"]
    },
    "ndb-prod": {
      "command": "bash",
      "args": ["-c", "cd /absolute/path/to/ndb-mcp-server && cp .env.prod .env && node dist/index.js"]
    }
  }
}
```

**For Windows:**
```json
{
  "mcpServers": {
    "ndb-dev": {
      "command": "cmd",
      "args": ["/c", "cd /d C:\\path\\to\\ndb-mcp-server && copy .env.dev .env && node dist/index.js"]
    },
    "ndb-prod": {
      "command": "cmd",
      "args": ["/c", "cd /d C:\\path\\to\\ndb-mcp-server && copy .env.prod .env && node dist/index.js"]
    }
  }
}
```

### Multi-Environment Configuration Script

For automatic multi-environment setup, you can create environment-specific configuration scripts:

```bash
#!/bin/bash
# configure-claude-multi.sh

environments=("dev" "staging" "prod")
project_path=$(pwd)

for env in "${environments[@]}"; do
    if [[ -f ".env.$env" ]]; then
        echo "Configuring environment: $env"
        # Use the configure-claude script with environment-specific settings
        ENV_FILE=".env.$env" ./scripts/configure-claude.sh "$env"
    fi
done
```

## Advanced Configuration

### Custom Server Names and Organization

Organize multiple environments with descriptive names:

```json
{
  "mcpServers": {
    "ndb-company-dev": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb-dev.company.local",
        "NDB_USERNAME": "dev-automation",
        "NDB_PASSWORD": "dev-password"
      }
    },
    "ndb-company-prod": {
      "command": "node", 
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb-prod.company.com",
        "NDB_TOKEN": "prod-token"
      }
    },
    "ndb-customer-demo": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://demo.customer.com",
        "NDB_TOKEN": "demo-token"
      }
    }
  }
}
```

### Environment-Specific Debug Levels

Configure different debug levels for each environment:

```json
{
  "mcpServers": {
    "ndb-dev": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "DEBUG": "ndb:*",
        "NDB_BASE_URL": "https://ndb-dev.company.local"
      }
    },
    "ndb-staging": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "DEBUG": "ndb:warn,ndb:error",
        "NDB_BASE_URL": "https://ndb-staging.company.com"
      }
    },
    "ndb-prod": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "DEBUG": "ndb:error",
        "NDB_BASE_URL": "https://ndb-prod.company.com"
      }
    }
  }
}
```

### Security-Focused Configuration

For production environments, use token-based authentication and secure settings:

```json
{
  "mcpServers": {
    "ndb-secure": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb-prod.company.com",
        "NDB_TOKEN": "your-secure-api-token",
        "NDB_VERIFY_SSL": "true",
        "NDB_TIMEOUT": "30000",
        "NDB_MAX_RETRIES": "3",
        "DEBUG": "ndb:error"
      }
    }
  }
}
```

## Testing Integration

### Verify Configuration

After configuring Claude Desktop:

1. **Restart Claude Desktop** completely
2. **Start a new conversation** with Claude
3. **Test basic functionality**:
   ```
   🗣️ "List all databases in NDB"
   🗣️ "Show me the NDB server status"
   🗣️ "What tools are available for database management?"
   ```

### Multi-Environment Testing

For multi-environment setups:

1. **Test environment selection**:
   ```
   🗣️ "Using ndb-dev, show me all test databases"
   🗣️ "Switch to ndb-prod and list production databases"
   ```

2. **Verify environment isolation**:
   ```
   🗣️ "Compare database counts between ndb-dev and ndb-prod"
   🗣️ "Show me staging databases that don't exist in production"
   ```

3. **Test environment-specific operations**:
   ```
   🗣️ "Create a clone in the development environment"
   🗣️ "Take a snapshot in production before the upgrade"
   ```

### Integration Health Check

Run these commands to verify integration health:

```bash
# Test MCP server independently
npm run test:mcp

# Check if Claude Desktop can see the server
# (Look for ndb tools in Claude's interface)

# Test with debug logging
DEBUG=ndb:* npm start
```

## Troubleshooting

### Common Issues

#### Tools Not Appearing in Claude

**Symptoms**: Claude doesn't show NDB tools or responds with "I don't have access to those tools"

**Solutions**:
1. **Check Claude Desktop restart**: Completely close and reopen Claude Desktop
2. **Verify configuration file**: Ensure `claude_desktop_config.json` is valid JSON
3. **Test paths**: Verify absolute paths to `dist/index.js` are correct
4. **Check permissions**: Ensure Claude Desktop can execute the node command
5. **Validate server**: Run `npm run test:mcp` to confirm server works independently

#### Configuration File Issues

**Invalid JSON**:
```bash
# Validate your JSON configuration
python -m json.tool ~/.config/Claude/claude_desktop_config.json
# or
jq . ~/.config/Claude/claude_desktop_config.json
```

**Backup corrupted**:
```bash
# Restore from backup (created by configure-claude script)
ls -la ~/.config/Claude/claude_desktop_config.json.backup.*
cp ~/.config/Claude/claude_desktop_config.json.backup.YYYYMMDD_HHMMSS ~/.config/Claude/claude_desktop_config.json
```

#### Environment Variable Issues

**Missing environment variables**:
```bash
# Check your .env file exists and has required variables
cat .env | grep -E "^NDB_"

# Test environment loading
node -e "require('dotenv').config(); console.log(process.env.NDB_BASE_URL)"
```

**Environment conflicts**:
```bash
# Check for conflicting environment variables
env | grep NDB_
```

#### Multi-Environment Issues

**Wrong environment selected**:
- Verify Claude Desktop configuration points to correct server entry
- Check environment variables are loaded correctly
- Restart Claude Desktop after configuration changes

**Authentication failures**:
- Verify credentials are correct for each environment
- Check token expiration for production environments
- Ensure service accounts have proper permissions

**Network connectivity**:
- Test each environment's network accessibility
- Verify firewall rules for different environment networks
- Check VPN connectivity for isolated environments

### Debug Mode

Enable debug mode for troubleshooting:

```json
{
  "mcpServers": {
    "ndb-debug": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "DEBUG": "ndb:*",
        "NDB_BASE_URL": "https://your-ndb-server.com",
        "NDB_TOKEN": "your-token"
      }
    }
  }
}
```

### Getting Help

If you encounter issues not covered here:

1. **Check logs**: Enable debug mode and review console output
2. **Verify setup**: Run through the [setup guide](setup-and-configuration.md) again
3. **Test independently**: Ensure `npm run test:mcp` works before integrating with Claude
4. **Search issues**: Look for similar problems in [GitHub issues](https://github.com/rouxton/ndb-mcp-server/issues)
5. **Create issue**: Report bugs with debug logs and configuration details

## Usage Patterns

### Environment-Specific Workflows

Once configured with multiple environments, you can use environment-specific language in your conversations:

#### Development Workflow
```
🗣️ "Using ndb-dev, show me all test databases"
🗣️ "Create a clone of customer-data in the dev environment"
🗣️ "List failed operations in development from yesterday"
🗣️ "Show me development database resource utilization"
```

#### Staging Operations
```
🗣️ "Using ndb-staging, check backup status of staging databases"
🗣️ "Compare staging database performance with last week"
🗣️ "Refresh the test-customer-data clone in staging"
```

#### Production Support
```
🗣️ "Using ndb-prod, show critical database alerts"
🗣️ "Check backup status of all production databases"
🗣️ "Take a snapshot of sales-db before the upgrade"
🗣️ "Show production database resource utilization"
```

#### Cross-Environment Analysis
```
🗣️ "Compare database counts between ndb-dev and ndb-prod"
🗣️ "Show me staging databases that don't exist in production"
🗣️ "List databases that exist in all environments"
🗣️ "Compare backup policies across dev, staging, and prod"
```

### Best Practices

#### Security
- **Use tokens instead of passwords** for production environments
- **Implement least privilege access** for each environment
- **Rotate credentials regularly** and update configurations
- **Monitor access logs** for unusual activity

#### Organization
- **Use descriptive server names** (`ndb-company-prod` vs `ndb-prod`)
- **Implement consistent naming** across environments
- **Document environment purposes** and access patterns
- **Maintain configuration backups** before making changes

#### Maintenance
- **Test configurations regularly** after Claude Desktop updates
- **Keep environment files in sync** with actual environment changes
- **Monitor for deprecated features** in Claude Desktop
- **Update scripts and documentation** as needed

### Advanced Usage

#### Conditional Operations
```
🗣️ "If the production database CPU usage is above 80%, create an alert"
🗣️ "Only proceed with the clone if the source database is healthy"
```

#### Automated Workflows
```
🗣️ "Create a development clone of the customer database every Monday"
🗣️ "Check all production database backups and send me a summary"
```

#### Complex Queries
```
🗣️ "Show me all databases across all environments that haven't been backed up in 24 hours"
🗣️ "Find all clones older than 30 days in non-production environments"
```

This integration guide enables you to leverage the full power of the NDB MCP Server through Claude Desktop's conversational interface, with the flexibility to manage multiple environments safely and efficiently.
