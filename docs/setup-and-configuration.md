# Setup and Configuration Guide

Complete installation and configuration guide for the NDB MCP Server.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Multi-Environment Setup](#multi-environment-setup)
- [Authentication & Security](#authentication--security)
- [Testing & Validation](#testing--validation)
- [Troubleshooting Setup](#troubleshooting-setup)

## System Requirements

### Software Requirements
- **Node.js**: 18.0.0 or later
- **npm**: 8.0.0 or later (included with Node.js)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### NDB Environment Requirements
- **NDB Version**: 2.4 or later (API v0.9)
- **Network Access**: HTTPS connectivity to your NDB server
- **Credentials**: Valid NDB user account or service account
- **Permissions**: Appropriate database management permissions

### Supported Database Engines
- Oracle Database (11g, 12c, 18c, 19c)
- PostgreSQL (10+)
- Microsoft SQL Server (2014+)
- MySQL (5.7+)
- MariaDB (10.x)
- SAP HANA
- MongoDB (4.0+)

## Installation Methods

### Method 1: Automated Setup (Recommended)

The automated setup scripts handle the entire installation process, from dependency installation to Claude Desktop integration.

**For Unix/Linux/macOS:**
```bash
git clone https://github.com/rouxton/ndb-mcp-server.git
cd ndb-mcp-server
./scripts/setup.sh
```

**For Windows (PowerShell):**
```powershell
git clone https://github.com/rouxton/ndb-mcp-server.git
cd ndb-mcp-server
PowerShell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

#### What the Setup Script Does

The automated setup performs these steps in sequence:

1. **System Requirements Check**
   - Verifies Node.js 18.0.0+ is installed
   - Checks npm availability and version
   - Validates system compatibility

2. **Dependency Installation**
   - Runs `npm install` to install all required packages
   - Handles TypeScript and MCP SDK dependencies
   - Installs development and runtime dependencies

3. **Project Build**
   - Executes `npm run build` to compile TypeScript
   - Generates the `dist/` directory with compiled JavaScript
   - Validates successful compilation

4. **Interactive Configuration**
   - Launches `npm run configure` wizard
   - Prompts for NDB server URL and credentials
   - Creates and validates `.env` configuration file

5. **Connection Testing**
   - Runs `npm run test:connection` to verify NDB connectivity
   - Validates authentication and API access
   - Confirms basic database operations work

6. **MCP Functionality Test**
   - Executes `npm run test:mcp` if Python is available
   - Verifies MCP server starts and tools are registered
   - Tests sample database queries

7. **Setup Completion**
   - Provides setup completion confirmation
   - Displays next steps for Claude Desktop integration
   - Shows documentation links and useful commands

**Note:** The setup script focuses on the core installation and testing. Claude Desktop integration is handled separately with dedicated scripts.

#### Setup Script Features

**Cross-Platform Support:**
- Bash script for Unix/Linux/macOS with POSIX compliance
- PowerShell script for Windows with proper error handling
- Automatic OS detection for Claude Desktop configuration

**Error Handling:**
- Exits immediately on any critical error
- Provides clear error messages with troubleshooting hints
- Creates configuration backups before making changes
- Validates each step before proceeding

**Safety Features:**
- Backs up existing Claude Desktop configuration
- Never overwrites working configurations without confirmation
- Validates Node.js and npm versions before starting
- Tests connections before declaring success

**User Experience:**
- Colored output with clear status indicators (✅❌⚠️ℹ️)
- Progress indicators for long-running operations
- Helpful next-steps guidance after completion
- Troubleshooting tips for common issues

#### Troubleshooting Automated Setup

**Script Won't Execute (Unix/Linux/macOS):**
```bash
# Make sure the script is executable
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**PowerShell Execution Policy (Windows):**
```powershell
# If you get execution policy errors
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
scripts/setup.ps1
```

**Setup Script Fails:**
```bash
# Run individual steps manually
npm install              # Install dependencies
npm run build           # Build TypeScript
npm run configure       # Configure environment
npm run test:connection # Test NDB connectivity
```

### Method 2: Manual Installation

If you prefer manual control or the automated script fails, you can perform each step individually:

```bash
# 1. Clone the repository
git clone https://github.com/rouxton/ndb-mcp-server.git
cd ndb-mcp-server

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Configure environment
npm run configure

# 5. Test the setup
npm run test:connection
npm run test:mcp
```

## Configuration

### Interactive Configuration

The easiest way to configure the server is using the interactive wizard:

```bash
npm run configure
```

This will prompt you for:
- **NDB Server URL**: Your NDB server endpoint
- **Authentication Method**: Token-based or basic authentication
- **Credentials**: Username/password or API token
- **SSL Settings**: Certificate validation options
- **Advanced Options**: Timeouts, retry settings, etc.

### Manual Configuration

Create a `.env` file in the project root (you can copy from `.env.example` as a template):

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
# Required Settings
NDB_BASE_URL=https://your-ndb-server.company.com
NDB_USERNAME=your-username
NDB_PASSWORD=your-password

# Optional Settings
NDB_VERIFY_SSL=true
NDB_TIMEOUT=30000
NDB_MAX_RETRIES=3
NDB_RETRY_DELAY=1000
DEBUG=ndb:*
```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NDB_BASE_URL` | NDB server endpoint | ✅ | - |
| `NDB_USERNAME` | NDB username | ✅ | - |
| `NDB_PASSWORD` | NDB password | ✅ | - |
| `NDB_TOKEN` | API token (alternative to username/password) | ➖ | - |
| `NDB_VERIFY_SSL` | Verify SSL certificates | ➖ | `true` |
| `NDB_TIMEOUT` | Request timeout in milliseconds | ➖ | `30000` |
| `NDB_MAX_RETRIES` | Maximum retry attempts | ➖ | `3` |
| `NDB_RETRY_DELAY` | Delay between retries in milliseconds | ➖ | `1000` |
| `DEBUG` | Debug logging level | ➖ | - |

## Multi-Environment Setup

The NDB MCP Server supports managing multiple NDB environments (development, staging, production) simultaneously. This allows you to work with different NDB instances by maintaining separate configuration files.

### Environment-Specific Configuration

#### Creating Environment Configurations

The interactive configuration wizard supports environment-specific setup:

```bash
# Configure for development environment
npm run configure
# When prompted for "Environment name", enter: dev
# This creates .env.dev file

# Configure for production environment
npm run configure  
# When prompted for "Environment name", enter: prod
# This creates .env.prod file

# Configure for staging environment
npm run configure
# When prompted for "Environment name", enter: staging
# This creates .env.staging file
```

#### Manual Environment Files

Alternatively, create environment files manually:

**`.env.dev` (Development Environment):**
```bash
NDB_BASE_URL=https://ndb-dev.company.local
NDB_USERNAME=dev-automation
NDB_PASSWORD=dev-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=60000
DEBUG=ndb:*
```

**`.env.prod` (Production Environment):**
```bash
NDB_BASE_URL=https://ndb-prod.company.com
NDB_TOKEN=prod-api-token-here
NDB_VERIFY_SSL=true
NDB_TIMEOUT=30000
DEBUG=ndb:error
```

**`.env.staging` (Staging Environment):**
```bash
NDB_BASE_URL=https://ndb-staging.company.com
NDB_USERNAME=staging-user
NDB_PASSWORD=staging-password
NDB_VERIFY_SSL=true
NDB_TIMEOUT=45000
DEBUG=ndb:warn,ndb:error
```

### Testing Multi-Environment Setup

#### Validate Each Environment

```bash
# Test development environment
cp .env.dev .env
npm run test:connection

# Test production environment
cp .env.prod .env
npm run test:connection

# Test staging environment
cp .env.staging .env
npm run test:connection
```

#### Environment-Specific Testing

```bash
# Test specific environment file directly
NODE_ENV=development npm run test:connection
NODE_ENV=production npm run test:connection
NODE_ENV=staging npm run test:connection
```

### Best Practices

#### Security Considerations

- **Separate Service Accounts**: Use different service accounts for each environment
- **Principle of Least Privilege**: Production accounts should have minimal necessary permissions
- **Token Rotation**: Implement different rotation policies per environment
- **Network Isolation**: Use VPNs or network segmentation between environments

#### Environment Naming Conventions

```bash
# Recommended naming patterns
.env.dev          # Development
.env.test         # Testing/QA
.env.staging      # Staging/Pre-production
.env.prod         # Production
.env.dr           # Disaster Recovery
.env.demo         # Demo/Training
```

#### Configuration Management

**Environment-Specific Settings:**

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| **SSL Verification** | `false` | `true` | `true` |
| **Debug Logging** | `ndb:*` | `ndb:warn,ndb:error` | `ndb:error` |
| **Request Timeout** | 60000ms | 45000ms | 30000ms |
| **Authentication** | Basic Auth | Token | Token |
| **Retry Attempts** | 5 | 3 | 3 |

**Credential Security:**
```bash
# Secure all environment files
chmod 600 .env.*

# Add to .gitignore
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### Troubleshooting Multi-Environment Issues

#### Common Problems

**Wrong Environment Selected:**
- Verify Claude Desktop configuration points to correct server entry
- Check environment variables are loaded correctly
- Restart Claude Desktop after configuration changes

**Authentication Failures:**
- Verify credentials are correct for each environment
- Check token expiration for production environments
- Ensure service accounts have proper permissions

**Network Connectivity:**
- Test each environment's network accessibility
- Verify firewall rules for different environment networks
- Check VPN connectivity for isolated environments

#### Debugging Commands

```bash
# Debug specific environment
cp .env.dev .env && DEBUG=ndb:* npm run test:connection

# Check which environment is active
echo "Current environment: $(grep NDB_BASE_URL .env | cut -d'=' -f2)"

# List all configured environments
ls -la .env.*
```

#### Environment Validation Script

Create a simple validation script:

```bash
#!/bin/bash
# validate-environments.sh

for env_file in .env.*; do
    if [[ -f "$env_file" ]]; then
        echo "Testing $env_file..."
        cp "$env_file" .env
        npm run test:connection --silent
        if [ $? -eq 0 ]; then
            echo "✅ $env_file: OK"
        else
            echo "❌ $env_file: Failed"
        fi
    fi
done
```

### Advanced Multi-Environment Features

#### Environment Auto-Detection

You can enhance the server to auto-detect environment based on hostname or other factors:

```bash
# In your startup script
HOSTNAME=$(hostname)
if [[ $HOSTNAME == *"dev"* ]]; then
    cp .env.dev .env
elif [[ $HOSTNAME == *"prod"* ]]; then
    cp .env.prod .env
fi
```

#### CI/CD Integration

```yaml
# Example GitHub Actions workflow
env:
  NDB_ENV: ${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}

steps:
  - name: Setup Environment
    run: cp .env.${{ env.NDB_ENV }} .env
  
  - name: Test NDB Connection
    run: npm run test:connection
```

#### Monitoring and Alerts

Set up environment-specific monitoring:

```bash
# Production: Alert on any errors
DEBUG=ndb:error npm start | logger -t ndb-prod

# Development: Full logging
DEBUG=ndb:* npm start | logger -t ndb-dev
```

This multi-environment setup enables teams to safely develop, test, and operate across different NDB instances while maintaining clear separation and security boundaries.

## Authentication & Security

### Authentication Methods

#### 1. Token-Based Authentication (Recommended)

Token-based authentication is more secure and supports automatic renewal:

```bash
# Set these in your .env file
NDB_BASE_URL=https://your-ndb-server.company.com
NDB_TOKEN=your-api-token
```

**To generate a token:**
1. Log into NDB web interface
2. Go to **Administration** → **Users**
3. Select your user → **Generate API Token**
4. Copy the token to your configuration

The interactive `npm run configure` script can also generate tokens automatically.

#### 2. Basic Authentication

Username and password authentication:

```bash
# Set these in your .env file
NDB_BASE_URL=https://your-ndb-server.company.com
NDB_USERNAME=your-username
NDB_PASSWORD=your-password
```

### Security Best Practices

#### Service Account Strategy

**Create dedicated service accounts** for the MCP server:

1. **Principle of Least Privilege**: Grant only the minimum permissions needed
2. **Separate Accounts**: Use different accounts for different environments
3. **Regular Rotation**: Rotate passwords/tokens regularly
4. **Audit Trail**: Enable logging for service account activities

**Example service account permissions for common use cases:**

| Use Case | Required Permissions |
|----------|---------------------|
| Read-only monitoring | Database Viewer, Snapshot Viewer |
| Development workflows | Database User, Clone Creator |
| Production support | Database Admin (limited), Time Machine Operator |
| Full operations | Database Admin, Infrastructure Admin |

#### Network Security

**SSL/TLS Configuration:**
```bash
# For production (recommended)
NDB_VERIFY_SSL=true

# For development/testing with self-signed certificates
NDB_VERIFY_SSL=false
```

**Firewall Considerations:**
- Ensure outbound HTTPS (443) access to NDB server
- No inbound ports required for the MCP server
- Consider using VPN/bastion hosts for additional security

#### Credential Protection

**Environment File Security:**
```bash
# Secure the .env file
chmod 600 .env
chown $USER:$USER .env

# Add to .gitignore to prevent accidental commits
echo ".env" >> .gitignore
```

**For production deployments:**
- Use environment variables instead of .env files
- Consider secrets management systems (HashiCorp Vault, AWS Secrets Manager)
- Implement credential rotation policies

## Testing & Validation

### Pre-Integration Testing

Before using with Claude Desktop, validate your setup:

```bash
# 1. Test NDB connectivity
npm run test:connection

# 2. Test MCP functionality
npm run test:mcp

# 3. Interactive testing with web interface
npm run test:inspector

# 4. Run all tests
npm run test:all
```

### Individual Test Commands

```bash
# Test basic connectivity and authentication
node scripts/test-connection.js

# Test with debug output
node scripts/test-connection-debug.js

# Test with specific debug output
DEBUG=ndb:api npm run test:connection
```

### Expected Test Output

**Successful connection test:**
```
✅ NDB Connection Test
✅ Authentication successful
✅ API version: 0.9
✅ Server version: 2.4.x
✅ Basic operations working
```

**Successful MCP test:**
```
✅ MCP Server Test
✅ Server starts successfully
✅ Tools registered: 30+
✅ Sample database query works
✅ MCP server ready for integration
```

### Validation Checklist

Before proceeding to Claude Desktop integration:

- [ ] **Environment**: `.env` file created and configured
- [ ] **Connection**: `npm run test:connection` passes
- [ ] **MCP**: `npm run test:mcp` passes
- [ ] **Build**: `dist/index.js` exists and is current
- [ ] **Permissions**: Service account has appropriate access
- [ ] **Network**: Connectivity to NDB server confirmed

## Troubleshooting Setup

### Common Issues

#### Automated Setup Script Issues

**Setup Script Permission Denied (Unix/Linux/macOS)**
```bash
# Error: Permission denied
sudo chmod +x scripts/setup.sh
./scripts/setup.sh
```

**PowerShell Execution Policy Error (Windows)**
```powershell
# Error: execution of scripts is disabled on this system
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then retry the setup
PowerShell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

**Node.js Version Too Old**
```bash
# Error: Node.js version X.X.X is too old
# Install Node.js 18.0.0 or later from https://nodejs.org/
node --version  # Should show 18.0.0 or higher
```

**Setup Script Interrupted**
```bash
# If setup was interrupted, clean up and retry
npm run clean    # Clean build artifacts
rm -f .env       # Remove partial configuration
./scripts/setup.sh  # Retry setup
```

**Claude Desktop Configuration Issues**
```bash
# Error: Configure Claude Desktop separately
./scripts/configure-claude.sh  # Unix/Linux/macOS
# or
.\scripts\configure-claude.ps1  # Windows
```

**Prerequisites Missing:**
```bash
# Error: .env not found or dist/index.js missing
npm run configure       # Create .env file
npm run build          # Build the project
```

#### Connection Issues
```bash
Error: connect ECONNREFUSED
```
**Solutions:**
- Verify NDB_BASE_URL is correct and accessible
- Check firewall/network connectivity
- Ensure NDB server is running and responding

#### Authentication Failed
```bash
Error: 401 Unauthorized
```
**Solutions:**
- Verify credentials are correct
- Check if account is locked or expired
- Ensure service account has necessary permissions
- Try regenerating API token

#### SSL Certificate Issues
```bash
Error: self signed certificate
```
**Solutions:**
```bash
# Temporary fix (development only)
NDB_VERIFY_SSL=false

# Proper fix (production)
# Add CA certificate to system trust store
# or configure proper SSL certificates on NDB server
```

#### Claude Desktop Not Finding Server
**Note**: Claude Desktop integration is handled separately. See the [Claude Desktop Integration Guide](claude-desktop-integration.md) for configuration help.

#### Permission Denied
```bash
Error: 403 Forbidden
```
**Solutions:**
- Review service account permissions
- Check database-specific access controls
- Verify cluster access permissions
- Contact NDB administrator for permission review

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Full debug output
DEBUG=ndb:* npm start

# API requests only
DEBUG=ndb:api npm start

# Authentication only
DEBUG=ndb:auth npm start
```

### Getting Help

If you encounter issues not covered here:

1. **Check logs**: Enable debug mode for detailed information
2. **Verify setup**: Run through the validation checklist
3. **Review documentation**: Check [troubleshooting guide](troubleshooting.md)
4. **Search issues**: Look for similar problems in [GitHub issues](https://github.com/rouxton/ndb-mcp-server/issues)
5. **Create issue**: Report bugs with debug logs and configuration details

### Next Steps

Once setup is complete:
- 🔧 Configure Claude Desktop integration with the [Claude Desktop Integration Guide](claude-desktop-integration.md)
- 📖 Read the [tools reference](tools-reference.md) to understand available capabilities
- 💡 Try the [usage examples](usage-examples.md) for practical scenarios
- 🧪 Explore advanced features in the [development guide](development.md)
