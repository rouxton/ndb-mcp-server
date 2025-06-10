# Configuration Guide

This guide covers advanced configuration options for the NDB MCP Server, including environment-specific setups, security configurations, and optimization settings.

## Table of Contents

- [Configuration Methods Overview](#configuration-methods-overview)
- [Environment-Specific Configurations](#environment-specific-configurations)
- [Advanced Claude Desktop Configuration](#advanced-claude-desktop-configuration)
- [Development Configuration](#development-configuration)
- [Security Configuration](#security-configuration)
- [Performance Optimization](#performance-optimization)
- [Multi-Environment Setup](#multi-environment-setup)
- [Troubleshooting Configuration](#troubleshooting-configuration)

## Configuration Methods Overview

### Method 1: Claude Desktop Configuration (Production)

**Best for:**
- 🎯 Regular usage with Claude Desktop
- 🏢 Production environments
- 🔒 Enhanced security (no local files)
- 👥 Multi-user machines

**Configuration Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Method 2: Local .env File (Development)

**Best for:**
- 🛠️ Development and debugging
- 🧪 Running tests and diagnostics
- 🔄 Frequent configuration changes
- 🔧 Manual server operations

**Configuration Location:**
- Project root: `ndb-mcp-server/.env`

### Priority Order

The server reads configuration in this order:
1. **Environment variables** (set by Claude Desktop or system)
2. **Local .env file** (if present and development mode)
3. **Default values** (hardcoded fallbacks)

## Environment-Specific Configurations

### Development Environment

**Claude Desktop Configuration:**
```json
{
  "mcpServers": {
    "ndb-dev": {
      "command": "node",
      "args": ["/Users/developer/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb-dev.company.local",
        "NDB_USERNAME": "dev-admin",
        "NDB_PASSWORD": "dev-password",
        "NDB_VERIFY_SSL": "false",
        "NDB_TIMEOUT": "60000"
      }
    }
  }
}
```

**Or .env file:**
```bash
# Development Environment
NDB_BASE_URL=https://ndb-dev.company.local
NDB_USERNAME=dev-admin
NDB_PASSWORD=dev-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=60000

# Development-specific settings
NODE_ENV=development
DEBUG=true
```

### Staging Environment

```json
{
  "mcpServers": {
    "ndb-staging": {
      "command": "node",
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb-staging.company.com",
        "NDB_USERNAME": "staging-service",
        "NDB_PASSWORD": "staging-secure-password",
        "NDB_VERIFY_SSL": "true",
        "NDB_TIMEOUT": "45000"
      }
    }
  }
}
```

### Production Environment

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.company.com",
        "NDB_USERNAME": "automation-service",
        "NDB_PASSWORD": "highly-secure-production-password",
        "NDB_VERIFY_SSL": "true",
        "NDB_TIMEOUT": "30000"
      }
    }
  }
}
```

## Advanced Claude Desktop Configuration

### Multiple NDB Environments

Configure multiple NDB servers for different environments:

```json
{
  "mcpServers": {
    "ndb-prod": {
      "command": "node",
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb-prod.company.com",
        "NDB_USERNAME": "prod-service",
        "NDB_PASSWORD": "prod-password"
      }
    },
    "ndb-dev": {
      "command": "node", 
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb-dev.company.com",
        "NDB_USERNAME": "dev-service",
        "NDB_PASSWORD": "dev-password",
        "NDB_VERIFY_SSL": "false"
      }
    }
  }
}
```

### Custom Node.js Path

For systems with multiple Node.js versions:

```json
{
  "mcpServers": {
    "ndb": {
      "command": "/usr/local/bin/node",
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.company.com",
        "NDB_USERNAME": "service-account",
        "NDB_PASSWORD": "service-password"
      }
    }
  }
}
```

### Performance Tuning

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": [
        "--max-old-space-size=2048",
        "/opt/ndb-mcp-server/dist/index.js"
      ],
      "env": {
        "NDB_BASE_URL": "https://ndb.company.com",
        "NDB_USERNAME": "service-account", 
        "NDB_PASSWORD": "service-password",
        "NDB_TIMEOUT": "45000"
      }
    }
  }
}
```

## Development Configuration

### Local Development Setup

**1. Create development .env file:**
```bash
cp .env.example .env.development
```

**2. Configure for local development:**
```bash
# .env.development
NDB_BASE_URL=https://ndb-dev.company.local
NDB_USERNAME=developer
NDB_PASSWORD=dev-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=60000

# Development features
NODE_ENV=development
DEBUG=ndb:*
LOG_LEVEL=debug
```

**3. Use development configuration:**
```bash
# Load development environment
export NODE_ENV=development
cp .env.development .env

# Run tests
npm run test:connection

# Start development server
npm run dev
```

### Testing Configuration

**For automated testing:**
```bash
# .env.test
NDB_BASE_URL=https://ndb-test.company.local
NDB_USERNAME=test-user
NDB_PASSWORD=test-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=30000

# Test-specific settings
NODE_ENV=test
LOG_LEVEL=error
```

## Security Configuration

### Credential Management

**1. Use Service Accounts:**
```bash
# Production service account
NDB_USERNAME=ndb-automation-service
NDB_PASSWORD=complex-service-password-123!
```

**2. Rotate Credentials Regularly:**
```bash
# Update credentials monthly
# Use password managers for generation
# Document rotation schedule
```

### SSL/TLS Configuration

**Production (Always verify SSL):**
```json
{
  "env": {
    "NDB_VERIFY_SSL": "true"
  }
}
```

**Development (Self-signed certificates):**
```json
{
  "env": {
    "NDB_VERIFY_SSL": "false"
  }
}
```

**Custom Certificate Authority:**
```bash
# Add custom CA certificate to system trust store
# Then use standard SSL verification
NDB_VERIFY_SSL=true
```

### Network Security

**Corporate Proxy Configuration:**
```json
{
  "env": {
    "HTTP_PROXY": "http://proxy.company.com:8080",
    "HTTPS_PROXY": "https://proxy.company.com:8080",
    "NO_PROXY": "localhost,127.0.0.1,.company.local"
  }
}
```

**Firewall Considerations:**
- Ensure outbound HTTPS (443) access to NDB server
- Consider VPN requirements for remote access
- Monitor connection logs for security events

## Performance Optimization

### Timeout Configuration

**For slow networks:**
```bash
NDB_TIMEOUT=60000  # 60 seconds
```

**For fast local networks:**
```bash
NDB_TIMEOUT=15000  # 15 seconds
```

**For production:**
```bash
NDB_TIMEOUT=30000  # 30 seconds (default)
```

### Connection Pooling

The server automatically manages connections, but you can optimize:

```json
{
  "env": {
    "NDB_MAX_RETRIES": "3",
    "NDB_RETRY_DELAY": "1000",
    "NDB_KEEP_ALIVE": "true"
  }
}
```

### Memory Optimization

**For large environments:**
```json
{
  "command": "node",
  "args": [
    "--max-old-space-size=4096",
    "--optimize-for-size",
    "/opt/ndb-mcp-server/dist/index.js"
  ]
}
```

## Multi-Environment Setup

### Environment Variables Pattern

```bash
# Development
NDB_BASE_URL_DEV=https://ndb-dev.company.local
NDB_USERNAME_DEV=dev-user
NDB_PASSWORD_DEV=dev-password

# Staging  
NDB_BASE_URL_STAGING=https://ndb-staging.company.com
NDB_USERNAME_STAGING=staging-user
NDB_PASSWORD_STAGING=staging-password

# Production
NDB_BASE_URL_PROD=https://ndb.company.com
NDB_USERNAME_PROD=prod-service
NDB_PASSWORD_PROD=prod-password
```

### Switching Environments

**Using environment selector:**
```bash
# Set environment
export NDB_ENV=development
# or
export NDB_ENV=staging
# or  
export NDB_ENV=production

# Configuration will auto-select based on NDB_ENV
```

### Configuration Templates

**Create template files:**
```bash
# config/claude-desktop-dev.json
# config/claude-desktop-staging.json
# config/claude-desktop-prod.json
```

**Deploy appropriate template:**
```bash
# Deploy development config
cp config/claude-desktop-dev.json ~/.config/Claude/claude_desktop_config.json

# Restart Claude Desktop
```

## Troubleshooting Configuration

### Verify Configuration Loading

**Test configuration with connection script:**
```bash
npm run test:connection
```

**Debug configuration loading:**
```bash
# Enable debug logging
DEBUG=ndb:config npm run test:connection
```

### Common Configuration Issues

**1. Wrong path in Claude Desktop config:**
```bash
# Verify path exists
ls -la /path/to/ndb-mcp-server/dist/index.js

# Check permissions
file /path/to/ndb-mcp-server/dist/index.js
```

**2. Environment variables not loading:**
```bash
# Test environment variable access
node -e "console.log(process.env.NDB_BASE_URL)"
```

**3. SSL certificate issues:**
```bash
# Test SSL connectivity
openssl s_client -connect ndb.company.com:443 -servername ndb.company.com

# Bypass SSL for testing
NDB_VERIFY_SSL=false npm run test:connection
```

### Configuration Validation

**Validate JSON syntax:**
```bash
# Check Claude Desktop config syntax
python -m json.tool ~/.config/Claude/claude_desktop_config.json
```

**Validate .env syntax:**
```bash
# Check .env file
cat .env | grep -v '^#' | grep -v '^$'
```

### Debug Mode

**Enable comprehensive debugging:**
```bash
# .env or environment variables
DEBUG=ndb:*
LOG_LEVEL=debug
NODE_ENV=development
```

**View debug output:**
```bash
DEBUG=ndb:* npm run test:connection
```

## Configuration Examples by Use Case

### Corporate Environment

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.corp.company.com",
        "NDB_USERNAME": "DOMAIN\\service-account",
        "NDB_PASSWORD": "complex-domain-password",
        "NDB_VERIFY_SSL": "true",
        "NDB_TIMEOUT": "45000",
        "HTTP_PROXY": "http://proxy.corp.company.com:8080",
        "HTTPS_PROXY": "http://proxy.corp.company.com:8080"
      }
    }
  }
}
```

### Cloud Environment

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.cloud.nutanix.com",
        "NDB_USERNAME": "cloud-api-user",
        "NDB_PASSWORD": "cloud-api-key",
        "NDB_VERIFY_SSL": "true",
        "NDB_TIMEOUT": "30000"
      }
    }
  }
}
```

### Home Lab Environment

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/Users/homelab/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://192.168.1.100",
        "NDB_USERNAME": "admin",
        "NDB_PASSWORD": "homelab-password",
        "NDB_VERIFY_SSL": "false",
        "NDB_TIMEOUT": "60000"
      }
    }
  }
}
```

## Best Practices

### Configuration Management

1. **Use version control for configuration templates**
2. **Never commit actual credentials**
3. **Document environment-specific requirements**
4. **Implement configuration validation**
5. **Use configuration management tools for deployment**

### Security Best Practices

1. **Use service accounts with minimal permissions**
2. **Rotate credentials regularly**
3. **Enable SSL verification in production**
4. **Monitor access logs**
5. **Use secure credential storage**

### Development Best Practices

1. **Use .env files for local development**
2. **Maintain separate configurations per environment**
3. **Test configuration changes thoroughly**
4. **Document custom configuration requirements**
5. **Use consistent naming conventions**

## Getting Help

For configuration issues:

1. **Run the connection test**: `npm run test:connection`
2. **Check the logs** for specific error messages
3. **Verify network connectivity** to NDB server
4. **Review the [Troubleshooting Guide](troubleshooting.md)**
5. **Check [Security Guide](security.md)** for security-related config
6. **Open an issue** with configuration details (sanitized)
