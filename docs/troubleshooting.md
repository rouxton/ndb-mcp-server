# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the NDB MCP Server.

## Quick Diagnostics

### 1. Test Basic Connectivity
```bash
# Test if the server starts
node dist/index.js

# Test NDB connectivity (if you have a test script)
node scripts/test-connection.js
```

### 2. Check Configuration
```bash
# Verify environment variables
echo $NDB_BASE_URL
echo $NDB_USERNAME
echo $NDB_VERIFY_SSL

# Check Claude Desktop config
cat ~/.config/Claude\ Desktop/config.json
```

### 3. Enable Debug Logging
```bash
# Set debug environment variable
export DEBUG=ndb-mcp-server:*

# Run with debug output
node dist/index.js
```

## Common Issues and Solutions

### 🔐 Authentication Issues

#### Problem: "Authentication failed" or "Unauthorized"

**Symptoms:**
- Error messages mentioning invalid credentials
- 401 Unauthorized responses
- Connection refused errors

**Solutions:**

1. **Verify Credentials**
   ```bash
   # Check environment variables
   printenv | grep NDB_
   
   # Test credentials manually
   curl -u "$NDB_USERNAME:$NDB_PASSWORD" "$NDB_BASE_URL/era/v0.9/databases"
   ```

2. **Check Base URL Format**
   ```bash
   # Correct format
   NDB_BASE_URL=https://ndb.example.com
   # NOT: https://ndb.example.com/era/v0.9
   ```

3. **Verify SSL Settings**
   ```bash
   # For self-signed certificates
   NDB_VERIFY_SSL=false
   
   # For production (recommended)
   NDB_VERIFY_SSL=true
   ```

4. **Test Different Auth Methods**
   ```javascript
   // Try both token and basic auth in your environment
   // Basic auth (username/password)
   NDB_USERNAME=your-username
   NDB_PASSWORD=your-password
   
   // Token auth (if available)
   NDB_TOKEN=your-token
   ```

**Advanced Debugging:**
```bash
# Test with curl
curl -v -u "username:password" "https://ndb.example.com/era/v0.9/databases"

# Check certificate issues
openssl s_client -connect ndb.example.com:443 -servername ndb.example.com
```

### 🌐 Network Connectivity Issues

#### Problem: "Connection timeout" or "Network error"

**Symptoms:**
- Timeout errors
- DNS resolution failures
- Connection refused

**Solutions:**

1. **Check Network Access**
   ```bash
   # Test basic connectivity
   ping ndb.example.com
   
   # Test port access
   telnet ndb.example.com 443
   nc -zv ndb.example.com 443
   ```

2. **Verify Firewall Rules**
   ```bash
   # Check if ports are blocked
   sudo netstat -tulpn | grep :443
   
   # Test from different network
   curl -I https://ndb.example.com
   ```

3. **Proxy Configuration**
   ```bash
   # Set proxy if required
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   export NO_PROXY=localhost,127.0.0.1
   ```

4. **DNS Issues**
   ```bash
   # Test DNS resolution
   nslookup ndb.example.com
   dig ndb.example.com
   
   # Try different DNS
   echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
   ```

### 🖥️ Claude Desktop Integration Issues

#### Problem: Server not appearing in Claude Desktop

**Symptoms:**
- NDB tools not available in Claude
- "Server not responding" messages
- Configuration not recognized

**Solutions:**

1. **Verify Config File Location**
   ```bash
   # macOS
   ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   ls %APPDATA%\Claude\claude_desktop_config.json
   
   # Linux
   ls ~/.config/claude-desktop/claude_desktop_config.json
   ```

2. **Check JSON Syntax**
   ```bash
   # Validate JSON
   cat claude_desktop_config.json | jq .
   
   # Or use online validator
   python -m json.tool claude_desktop_config.json
   ```

3. **Correct Configuration Format**
   ```json
   {
     "mcpServers": {
       "ndb": {
         "command": "node",
         "args": ["/absolute/path/to/ndb-mcp-server/dist/index.js"],
         "env": {
           "NDB_BASE_URL": "https://ndb.example.com",
           "NDB_USERNAME": "your-username",
           "NDB_PASSWORD": "your-password"
         }
       }
     }
   }
   ```

4. **Path Issues**
   ```bash
   # Use absolute paths
   which node  # Get node path
   pwd         # Get current directory
   
   # Test the exact command
   node /absolute/path/to/ndb-mcp-server/dist/index.js
   ```

5. **Restart Claude Desktop**
   ```bash
   # Kill all Claude processes
   pkill -f Claude
   
   # Restart Claude Desktop
   open /Applications/Claude\ Desktop.app
   ```

### 📦 Installation and Build Issues

#### Problem: "Module not found" or build failures

**Symptoms:**
- Missing dependency errors
- TypeScript compilation errors
- Permission denied errors

**Solutions:**

1. **Clean Installation**
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Rebuild project
   npm run build
   ```

2. **Node.js Version Issues**
   ```bash
   # Check Node.js version (requires 18.0.0+)
   node --version
   
   # Use Node Version Manager if needed
   nvm install 18
   nvm use 18
   ```

3. **Permission Issues**
   ```bash
   # Fix npm permissions (avoid sudo)
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   
   # Or use npx for one-time runs
   npx tsc
   ```

4. **TypeScript Compilation**
   ```bash
   # Check TypeScript installation
   npx tsc --version
   
   # Compile manually
   npx tsc
   
   # Check for syntax errors
   npx tsc --noEmit
   ```

### 🗄️ Database Operation Issues

#### Problem: Operations fail or timeout

**Symptoms:**
- Database operations hang
- Inconsistent results
- Resource not found errors

**Solutions:**

1. **Check NDB Status**
   ```bash
   # Test basic API access
   curl "$NDB_BASE_URL/era/v0.9/operations"
   
   # Check system status
   curl "$NDB_BASE_URL/era/v0.9/clusters"
   ```

2. **Operation Timeout Settings**
   ```bash
   # Increase timeout for long operations
   NDB_TIMEOUT=60000  # 60 seconds
   
   # For very long operations (provisioning)
   NDB_TIMEOUT=300000  # 5 minutes
   ```

3. **Resource State Issues**
   ```bash
   # Check if resources are in expected state
   # Databases should be "READY"
   # Clusters should be "UP"
   # Operations should be "COMPLETED"
   ```

4. **Concurrent Operation Limits**
   ```bash
   # Check for running operations
   curl "$NDB_BASE_URL/era/v0.9/operations?status=RUNNING"
   
   # Wait for operations to complete before starting new ones
   ```

### 🔧 Performance Issues

#### Problem: Slow response times

**Symptoms:**
- Long delays in responses
- Timeout errors
- Poor user experience

**Solutions:**

1. **Network Optimization**
   ```bash
   # Test network latency
   ping -c 10 ndb.example.com
   
   # Use faster DNS
   echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf
   ```

2. **Optimize API Calls**
   ```bash
   # Use pagination for large datasets
   curl "$NDB_BASE_URL/era/v0.9/databases?detailed=false"
   
   # Avoid detailed=true unless necessary
   # Cache frequently accessed data
   ```

3. **Increase Timeouts**
   ```javascript
   // In environment variables
   NDB_TIMEOUT=60000
   
   // Or programmatically
   const config = {
     timeout: 60000,
     retries: 3
   };
   ```

### 📝 Logging and Debug Issues

#### Problem: Insufficient logging or debug information

**Solutions:**

1. **Enable Comprehensive Logging**
   ```bash
   # Full debug output
   export DEBUG=ndb-mcp-server:*
   
   # Specific components only
   export DEBUG=ndb-mcp-server:client,ndb-mcp-server:auth
   ```

2. **Log File Management**
   ```bash
   # Redirect logs to file
   node dist/index.js 2>&1 | tee ndb-mcp-server.log
   
   # Rotate logs
   node dist/index.js 2>&1 | rotatelogs logs/ndb-mcp-%Y%m%d.log 86400
   ```

3. **Custom Logging Configuration**
   ```javascript
   // Set log level
   process.env.LOG_LEVEL = 'debug';
   
   // Enable request/response logging
   process.env.LOG_HTTP = 'true';
   ```

## Environment-Specific Issues

### macOS

**Common Issues:**
- Gatekeeper blocking execution
- Path issues with spaces
- Permission issues

**Solutions:**
```bash
# Allow unsigned binaries
sudo spctl --master-disable

# Handle paths with spaces
"/Applications/Claude Desktop.app/Contents/MacOS/Claude Desktop"

# Fix permissions
chmod +x scripts/setup.sh
```

### Windows

**Common Issues:**
- PowerShell execution policy
- Path separator issues
- Environment variable scope

**Solutions:**
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Use forward slashes in paths
"C:/path/to/ndb-mcp-server/dist/index.js"

# Set environment variables permanently
[Environment]::SetEnvironmentVariable("NDB_BASE_URL", "https://ndb.example.com", "User")
```

### Linux

**Common Issues:**
- SELinux restrictions
- User permission issues
- Service management

**Solutions:**
```bash
# Check SELinux status
sestatus

# Disable if causing issues
sudo setenforce 0

# Run as service
sudo systemctl enable ndb-mcp-server
sudo systemctl start ndb-mcp-server
```

## Advanced Diagnostics

### 1. Memory and Resource Usage

```bash
# Check memory usage
ps aux | grep node
top -p $(pgrep -f "ndb-mcp-server")

# Monitor file descriptors
lsof -p $(pgrep -f "ndb-mcp-server")
```

### 2. Network Analysis

```bash
# Monitor network connections
netstat -an | grep :443
ss -tuln | grep :443

# Analyze traffic
sudo tcpdump -i any host ndb.example.com
```

### 3. System Logs

```bash
# Check system logs
journalctl -u ndb-mcp-server -f

# Application logs
tail -f logs/ndb-mcp-server.log

# Claude Desktop logs (macOS)
tail -f ~/Library/Logs/Claude\ Desktop/main.log
```

## Error Code Reference

| Error Code | Description | Common Causes | Solutions |
|------------|-------------|---------------|-----------|
| `ECONNREFUSED` | Connection refused | Service down, wrong port | Verify service status and port |
| `ENOTFOUND` | DNS resolution failed | Wrong hostname, DNS issues | Check hostname and DNS |
| `ETIMEDOUT` | Operation timed out | Network latency, server overload | Increase timeout, check network |
| `EPROTO` | Protocol error | SSL/TLS issues | Check SSL configuration |
| `EACCES` | Permission denied | File permissions, user privileges | Fix permissions, check user access |

## Performance Monitoring

### Key Metrics to Monitor

1. **Response Time**: API call duration
2. **Error Rate**: Failed operations percentage
3. **Memory Usage**: Server memory consumption
4. **Network Latency**: Round-trip time to NDB
5. **Operation Queue**: Pending operations count

### Monitoring Tools

```bash
# Simple performance test
time node dist/index.js --test-connection

# Memory monitoring
ps -o pid,vsz,rss,comm -p $(pgrep -f ndb-mcp-server)

# Network monitoring
ping -i 0.2 -c 100 ndb.example.com | tail -n 3
```

## Getting Help

### 1. Gather Information

Before reporting issues, collect:
- Error messages and stack traces
- Environment details (OS, Node.js version, NDB version)
- Configuration files (remove sensitive data)
- Logs with debug enabled
- Steps to reproduce

### 2. Check Known Issues

- Review [GitHub Issues](https://github.com/rouxton/ndb-mcp-server/issues)
- Check [Changelog](../CHANGELOG.md) for recent fixes
- Search documentation for similar problems

### 3. Report Issues

When creating an issue:
- Use the bug report template
- Include all diagnostic information
- Provide minimal reproduction case
- Remove sensitive information

### 4. Community Support

- GitHub Discussions for general questions
- GitHub Issues for bugs and feature requests
- Documentation for common solutions

## Prevention Best Practices

### 1. Configuration Management
- Use environment files for different environments
- Validate configuration before deployment
- Document environment-specific settings

### 2. Monitoring and Alerting
- Implement health checks
- Set up monitoring for key metrics
- Configure alerts for failures

### 3. Testing
- Test in staging environment first
- Validate NDB connectivity regularly
- Keep test data separate from production

### 4. Maintenance
- Regular updates to dependencies
- Monitor NDB version compatibility
- Backup configuration files

---

**Note**: If you can't resolve an issue using this guide, please create a detailed bug report using our [issue template](../.github/ISSUE_TEMPLATE/bug_report.md).
