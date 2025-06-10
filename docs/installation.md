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
curl -fsSL https://raw.githubusercontent.com/rouxton/ndb-mcp-server/main/scripts/scripts_setup_unix.sh | bash

# Or clone and run locally
git clone https://github.com/rouxton/ndb-mcp-server.git
cd ndb-mcp-server
chmod +x scripts/scripts_setup_unix.sh
./scripts/scripts_setup_unix.sh
```

**For Windows PowerShell:**
```powershell
# Windows setup script coming soon
# For now, use manual installation method below
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
git clone https://github.com/rouxton/ndb-mcp-server.git
cd ndb-mcp-server
```

**Step 3: Install Dependencies**
```bash
npm install
```

**Step 4: Build Project**
```bash
npm run build
```

## Configuration Methods

There are two main ways to configure the NDB MCP Server, depending on your use case:

### Method 1: Claude Desktop Configuration (Recommended for Normal Use)

This is the recommended approach for regular usage with Claude Desktop. Configuration is done directly in Claude Desktop's configuration file.

**Configuration File Locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Basic Configuration:**
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

**Platform-Specific Examples:**

*macOS Configuration:*
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

*Windows Configuration:*
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

### Method 2: Local .env File (For Development and Testing)

This method is primarily for development, testing, and debugging. Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

**Edit `.env` with your configuration:**
```bash
# Required Configuration
NDB_BASE_URL=https://ndb-dev.company.local
NDB_USERNAME=dev-admin
NDB_PASSWORD=dev-password

# Optional Configuration
NDB_TIMEOUT=30000
NDB_VERIFY_SSL=false
```

**When to use .env file:**
- 🛠️ **Development and debugging**
- 🧪 **Running connection tests** (`npm run test:connection`)
- 🔧 **Manual server startup** (`npm start`)
- 🔄 **Frequent configuration changes**

**When to use Claude Desktop configuration:**
- 🎯 **Normal usage with Claude Desktop**
- 🏢 **Production environments**
- 🔒 **Enhanced security** (no local .env file)
- 👥 **Multi-user machines**

## Configuration Options

| Variable | Required | Description | Default | Example |
|----------|----------|-------------|---------|---------|
| `NDB_BASE_URL` | ✅ Yes | Base URL of your NDB server | - | `https://ndb.company.com` |
| `NDB_USERNAME` | ✅ Yes | NDB username | - | `admin` or `automation-user` |
| `NDB_PASSWORD` | ✅ Yes | NDB password | - | `SecurePass123!` |
| `NDB_TIMEOUT` | ❌ No | Request timeout (ms) | `30000` | `60000` |
| `NDB_VERIFY_SSL` | ❌ No | Verify SSL certificates | `true` | `false` for dev |

## Testing Your Installation

### Test NDB Connection

After installation, test your connection to NDB:

```bash
# Using npm script (recommended)
npm run test:connection

# Or run directly
node scripts/test-connection.js
```

**Expected Output for Successful Connection:**
```
=== Configuration Validation ===
✅ NDB_BASE_URL configured: https://ndb.company.com
✅ NDB_USERNAME configured: admin
✅ NDB_PASSWORD configured (hidden for security)
✅ Valid URL format: https://ndb.company.com

=== Network Connectivity ===
✅ Server is reachable (HTTP 401)
✅ NDB API endpoint detected (authentication required)

=== Authentication Test ===
✅ Authentication successful
✅ Valid NDB API response received

=== API Functionality Test ===
✅ Databases API endpoint working
✅ Profiles API endpoint working
✅ SLAs API endpoint working

🎉 All critical tests passed! NDB MCP Server should work correctly.
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

**Connection Test Failures:**

If the connection test fails, check the error messages:

- **DNS resolution failed**: Verify the NDB_BASE_URL is correct
- **Connection refused**: Check if NDB server is running and accessible
- **SSL certificate errors**: Set `NDB_VERIFY_SSL=false` for development
- **Authentication failed**: Verify username and password
- **Access forbidden**: Check user permissions in NDB

### Environment-Specific Troubleshooting

**Corporate Networks:**
- Configure proxy settings if required
- Add certificates to system trust store
- Ensure firewall rules allow HTTPS access

**Self-Signed Certificates:**
```bash
# For development environments
NDB_VERIFY_SSL=false
```

**Windows PowerShell Execution Policy:**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Security Considerations

### Credential Security
- **Never commit `.env` files** to version control
- **Use environment-specific configurations**
- **Rotate passwords regularly**
- **Use service accounts** with minimal required permissions

### Network Security
- **Always use HTTPS** in production
- **Verify SSL certificates** when possible
- **Consider VPN requirements** for remote access
- **Monitor access logs** for unusual activity

### File Permissions
```bash
# Secure .env file (if used)
chmod 600 .env

# Secure configuration directory
chmod 700 ~/.config/Claude
```

## Next Steps

After successful installation:

1. **Read the [Configuration Guide](configuration.md)** for advanced setup options
2. **Review [Usage Examples](usage-examples.md)** to learn common workflows
3. **Check [Security Guide](security.md)** for production deployment best practices
4. **Bookmark [Troubleshooting Guide](troubleshooting.md)** for future reference

## Getting Help

If you encounter issues during installation:

1. **Run the connection test** to diagnose problems
2. **Check the [Troubleshooting Guide](troubleshooting.md)**
3. **Review logs for error messages**
4. **Test each component individually**
5. **Open an issue on GitHub** with detailed information

## Uninstallation

To completely remove the NDB MCP Server:

```bash
# Remove project directory
rm -rf /path/to/ndb-mcp-server

# Remove Claude Desktop configuration
# Edit and remove "ndb" section from claude_desktop_config.json

# Restart Claude Desktop
```

**For .env file cleanup:**
```bash
# Remove any .env files created
rm .env
```
