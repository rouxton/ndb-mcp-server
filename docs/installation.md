# Installation Guide

This guide provides detailed instructions for installing and setting up the NDB MCP Server.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or later
- **npm**: Version 8.0.0 or later (included with Node.js)
- **Operating System**: macOS, Windows 10/11, or Linux
- **Memory**: Minimum 512MB RAM available
- **Storage**: At least 100MB free disk space

### NDB Environment Requirements
- **Nutanix NDB**: Version 2.4 or later
- **API Access**: NDB REST API v0.9 accessible
- **Network Connectivity**: HTTPS access to NDB server
- **Credentials**: Valid NDB user account with appropriate permissions

### User Permissions
Your NDB user account needs the following minimum permissions:
- **Database Administrator** role or equivalent
- Read access to all database resources
- Write access for provisioning/cloning operations
- Access to clusters, profiles, and SLA policies

## Installation Methods

### Method 1: Automated Setup (Recommended)

The automated setup script handles all installation steps for you.

**For Unix/Linux/macOS:**
```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/your-username/ndb-mcp-server/main/scripts/setup.sh | bash

# Or clone and run locally
git clone https://github.com/your-username/ndb-mcp-server.git
cd ndb-mcp-server
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**For Windows PowerShell:**
```powershell
# Download and run setup script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-username/ndb-mcp-server/main/scripts/setup.ps1" -OutFile "setup.ps1"
PowerShell -ExecutionPolicy Bypass -File setup.ps1

# Or clone and run locally
git clone https://github.com/your-username/ndb-mcp-server.git
cd ndb-mcp-server
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

### Method 2: Manual Installation

**Step 1: Install Node.js**
```bash
# macOS with Homebrew
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows - Download from https://nodejs.org
# Or use Chocolatey: choco install nodejs
```

**Step 2: Clone Repository**
```bash
git clone https://github.com/your-username/ndb-mcp-server.git
cd ndb-mcp-server
```

**Step 3: Install Dependencies**
```bash
npm install
```

**Step 4: Configure Environment**
```bash
cp .env.example .env
# Edit .env with your NDB configuration
```

**Step 5: Build Project**
```bash
npm run build
```

**Step 6: Test Installation**
```bash
npm start
```

## Configuration

### Environment Variables

Create a `.env` file in the project root with your NDB configuration:

```bash
# Required Configuration
NDB_BASE_URL=https://your-ndb-server.domain.com
NDB_USERNAME=your-ndb-username
NDB_PASSWORD=your-secure-password

# Optional Configuration
NDB_TIMEOUT=30000
NDB_VERIFY_SSL=true
```

### Configuration Options

| Variable | Required | Description | Default | Example |
|----------|----------|-------------|---------|---------|
| `NDB_BASE_URL` | ✅ Yes | Base URL of your NDB server | - | `https://ndb.company.com` |
| `NDB_USERNAME` | ✅ Yes | NDB username | - | `admin` or `automation-user` |
| `NDB_PASSWORD` | ✅ Yes | NDB password | - | `SecurePass123!` |
| `NDB_TIMEOUT` | ❌ No | Request timeout (ms) | `30000` | `60000` |
| `NDB_VERIFY_SSL` | ❌ No | Verify SSL certificates | `true` | `false` for dev |

### Environment-Specific Configurations

**Development Environment:**
```bash
NDB_BASE_URL=https://ndb-dev.company.local
NDB_USERNAME=dev-admin
NDB_PASSWORD=dev-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=60000
```

**Production Environment:**
```bash
NDB_BASE_URL=https://ndb-prod.company.com
NDB_USERNAME=automation-service
NDB_PASSWORD=highly-secure-production-password
NDB_VERIFY_SSL=true
NDB_TIMEOUT=30000
```

## Claude Desktop Integration

### Configuration File Setup

Claude Desktop requires a configuration file to recognize MCP servers.

**Configuration File Locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Basic Configuration

Create or edit the Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/absolute/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://your-ndb-server.com",
        "NDB_USERNAME": "your-username",
        "NDB_PASSWORD": "your-password",
        "NDB_VERIFY_SSL": "true"
      }
    }
  }
}
```

### Platform-Specific Examples

**macOS Configuration:**
```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/Users/username/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.company.com",
        "NDB_USERNAME": "admin",
        "NDB_PASSWORD": "password123",
        "NDB_VERIFY_SSL": "true"
      }
    }
  }
}
```

**Windows Configuration:**
```json
{
  "mcpServers": {
    "ndb": {
      "command": "node.exe",
      "args": ["C:\\Users\\Username\\ndb-mcp-server\\dist\\index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.company.com",
        "NDB_USERNAME": "admin",
        "NDB_PASSWORD": "password123",
        "NDB_VERIFY_SSL": "true"
      }
    }
  }
}
```

### Advanced Configuration

**With Custom Node.js Path:**
```json
{
  "mcpServers": {
    "ndb": {
      "command": "/usr/local/bin/node",
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.company.com",
        "NDB_USERNAME": "service-account",
        "NDB_PASSWORD": "service-password",
        "NDB_TIMEOUT": "45000",
        "NDB_VERIFY_SSL": "true"
      }
    }
  }
}
```

## Verification

### Test NDB Connection

```bash
# Test connection using built-in script
node scripts/test-connection.js

# Or test manually
npm start
```

**Expected Output:**
```
✅ NDB MCP Server initialized successfully
✅ Token authentication successful
🚀 NDB MCP Server running on stdio
```

### Test Claude Desktop Integration

1. **Restart Claude Desktop** completely
2. **Open a new conversation**
3. **Test with a simple query:**
   ```
   List all databases in the NDB environment
   ```

**Expected Behavior:**
- Claude should recognize the NDB server
- You should see database information returned
- No error messages about missing tools

### Verify Available Tools

Test that all tools are properly loaded:
```
What NDB tools are available?
```

You should see a list of all available database management tools.

## Troubleshooting Installation

### Common Issues

**Node.js Version Issues:**
```bash
# Check Node.js version
node --version

# Should output v18.0.0 or later
# If not, upgrade Node.js
```

**Permission Issues on macOS/Linux:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm for user-local installation
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Build Failures:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild project
npm run build
```

**Connection Issues:**
```bash
# Test basic connectivity
curl -k https://your-ndb-server.com/era/v0.9/clusters

# Test with credentials
curl -u "username:password" -k https://your-ndb-server.com/era/v0.9/clusters
```

### Environment-Specific Troubleshooting

**Corporate Networks:**
- Configure proxy settings if required
- Add certificates to system trust store
- Ensure firewall rules allow HTTPS access

**Self-Signed Certificates:**
```bash
# Disable SSL verification for development
export NDB_VERIFY_SSL=false
```

**Windows PowerShell Execution Policy:**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Security Considerations

### Credential Security
- Never commit `.env` files to version control
- Use environment-specific configurations
- Rotate passwords regularly
- Use service accounts with minimal required permissions

### Network Security
- Always use HTTPS in production
- Verify SSL certificates when possible
- Consider VPN requirements for remote access
- Monitor access logs for unusual activity

### File Permissions
```bash
# Secure .env file
chmod 600 .env

# Secure configuration directory
chmod 700 ~/.config/Claude
```

## Next Steps

After successful installation:

1. **Read the [Configuration Guide](configuration.md)** for advanced setup
2. **Review [Usage Examples](usage-examples.md)** to get started
3. **Check [Security Guide](security.md)** for production deployment
4. **Bookmark [Troubleshooting Guide](troubleshooting.md)** for future reference

## Getting Help

If you encounter issues during installation:

1. **Check the [Troubleshooting Guide](troubleshooting.md)**
2. **Review logs for error messages**
3. **Test each component individually**
4. **Open an issue on GitHub** with detailed information

## Uninstallation

To completely remove the NDB MCP Server:

```bash
# Remove project directory
rm -rf /path/to/ndb-mcp-server

# Remove Claude Desktop configuration
# Edit and remove "ndb" section from claude_desktop_config.json

# Restart Claude Desktop
```