# 🧪 Complete NDB MCP Server Testing Guide

This guide presents all available methods to test the NDB MCP server without depending on Claude Desktop. These tests are essential for development, debugging, and feature validation.

## 📋 Table of Contents

- [Available Test Scripts](#available-test-scripts)
- [Testing Methods](#testing-methods)
- [Testing by Level](#testing-by-level)
- [Debugging and Troubleshooting](#debugging-and-troubleshooting)
- [Best Practices](#best-practices)

## 🔧 Available Test Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Connection Test** | `npm run test:connection` | Basic NDB connectivity test |
| **Connection Debug** | `npm run test:connection:debug` | Connection test with detailed logs |
| **MCP Test** | `npm run test:mcp` | Complete MCP functionality test |
| **MCP Inspector** | `npm run test:inspector` | Interactive web interface for testing |
| **All Tests** | `npm run test:all` | Complete tests (connection + MCP) |

## 🔍 Testing Methods

### 1. 🔧 MCP Inspector (Recommended Method)

The inspector provides an intuitive web interface for testing MCP tools:

```bash
# Launch interactive web interface
npm run test:inspector

# Or directly with npx
npx @modelcontextprotocol/inspector node dist/index.js
```

**Advantages:**
- ✅ Intuitive web interface
- ✅ Interactive tool testing
- ✅ JSON response visualization
- ✅ Real-time debugging
- ✅ Tool parameter testing

### 2. 📝 Integrated Test Scripts

#### NDB Connection Test
```bash
# Basic connectivity test
npm run test:connection

# Test with detailed debug logs
npm run test:connection:debug
```

#### Complete MCP Test
```bash
# Test MCP functionality
npm run test:mcp

# Complete test (connection + MCP)
npm run test:all
```

### 3. 🐍 Python Test Client

The Python script offers comprehensive testing of MCP functionality:

```bash
# Via npm script
npm run test:mcp

# Or directly
python3 scripts/test-mcp-client.py
```

**Python client features:**
- ✅ MCP tool testing
- ✅ JSON-RPC response validation
- ✅ Error handling testing
- ✅ Interactive menu
- ✅ Performance testing

### 4. 💻 Manual Command Line Testing

#### Server Startup
```bash
# With .env configuration
npm start

# Server listens on stdin/stdout
```

#### Manual JSON-RPC Tests
```bash
# Test 1: List available tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js

# Test 2: Call a specific tool
echo '{
  "jsonrpc": "2.0", 
  "id": 2, 
  "method": "tools/call", 
  "params": {
    "name": "ndb_list_databases", 
    "arguments": {}
  }
}' | node dist/index.js

# Test 3: Tool with parameters
echo '{
  "jsonrpc": "2.0", 
  "id": 3, 
  "method": "tools/call", 
  "params": {
    "name": "ndb_get_database", 
    "arguments": {"database_id": "your-db-id"}
  }
}' | node dist/index.js
```

## 🎯 Testing by Level

### Level 1: Basic Testing
```bash
# 1. Build the project
npm run build

# 2. Test NDB connection
npm run test:connection

# 3. If connection OK, test MCP
npm run test:mcp
```

### Level 2: Interactive Testing
```bash
# Graphical interface for manual tests
npm run test:inspector
```

### Level 3: Development Testing
```bash
# Terminal 1: Development mode
npm run dev

# Terminal 2: Parallel testing
npm run test:mcp
```

### Level 4: Advanced Testing with Debug
```bash
# Test with detailed logs
DEBUG=ndb:* npm run test:connection:debug
NODE_ENV=development npm run test:mcp
```

## 🔍 Types of Tests Covered

### Functional Tests
- ✅ Listing available tools (30+ tools)
- ✅ Tool calls with parameters
- ✅ JSON-RPC response validation
- ✅ Error handling and exceptions
- ✅ Complete workflow testing

### Performance Tests
- ✅ NDB API response times
- ✅ Timeout handling
- ✅ Load testing with multiple requests
- ✅ Latency measurement

### Integration Tests
- ✅ NDB connection (token and basic auth)
- ✅ Authentication and renewal
- ✅ Access to different NDB endpoints
- ✅ SSL validation and certificates

## 📊 Sample Test Output

### Complete MCP Test
```
🧪 Testing NDB MCP Server

📋 Test 1: List available tools
✅ Found 30 tools:
   - ndb_list_databases: List all databases in NDB environment
   - ndb_get_database: Get detailed information about a specific database
   - ndb_list_clones: List all database clones
   - ndb_create_clone: Create a new database clone
   - ndb_list_snapshots: List all snapshots
   ... and 25 more tools

🔧 Test 2: Call ndb_list_databases tool
✅ Database list retrieved successfully
   Response type: text
   Found 5 databases in NDB environment:
   • production-app-db (PostgreSQL) - Status: READY
   • staging-web-db (MySQL) - Status: READY

🔧 Test 3: Call ndb_list_clusters tool
✅ Cluster list retrieved successfully

🔧 Test 4: Test error handling with invalid tool
✅ Error handling works correctly
   Error: Tool not found: invalid_tool_name

⏱️ Performance Summary:
   - Average response time: 245ms
   - Fastest call: 89ms (ndb_list_clusters)
   - Slowest call: 423ms (ndb_list_databases)
```

### Connection Test
```
🔗 Testing NDB Connection

📡 Testing Basic Connectivity...
✅ NDB server is reachable at https://your-ndb.company.com

🔐 Testing Authentication...
✅ Authentication successful (Token-based)

🏥 Testing Health Check...
✅ NDB service is healthy

🎯 Testing API Endpoints...
✅ /clusters endpoint: OK
✅ /databases endpoint: OK
✅ /profiles endpoint: OK

🚀 Connection test completed successfully!
```

## 🛠️ Debugging and Troubleshooting

### Debug with Detailed Logs
```bash
# Complete debug variables
DEBUG=ndb:* npm run test:mcp
NODE_ENV=development npm run test:mcp

# API calls specific debug
DEBUG=ndb:api npm run test:connection
```

### Testing with Specific Configuration
```bash
# Test with custom environment
NDB_BASE_URL=https://test-ndb.company.com \
NDB_USERNAME=test-user \
NDB_PASSWORD=test-pass \
npm run test:mcp

# Test without SSL verification (development)
NDB_VERIFY_SSL=false npm run test:connection

# Test with custom timeout
NDB_TIMEOUT=10000 npm run test:mcp
```

### Common Problem Diagnosis

#### Connection Error
```bash
# Check network connectivity
ping your-ndb-server.com

# Test with curl
curl -k https://your-ndb-server.com/era/v0.9/clusters

# Debug test with complete logs
npm run test:connection:debug
```

#### Authentication Error
```bash
# Check environment variables
echo $NDB_USERNAME
echo $NDB_BASE_URL

# Test with different credentials
NDB_USERNAME=admin NDB_PASSWORD=newpass npm run test:connection
```

#### Performance Issues
```bash
# Test with extended timeout
NDB_TIMEOUT=30000 npm run test:mcp

# Monitor API calls
DEBUG=ndb:performance npm run test:all
```

## 🎯 Advanced Testing

### Stress Testing
```bash
# Multiple simultaneous calls
for i in {1..10}; do
  npm run test:mcp &
done
wait
```

### Testing with Different Environments
```bash
# Production
NODE_ENV=production npm run test:all

# Staging
NODE_ENV=staging npm run test:all

# Development with verbose
NODE_ENV=development DEBUG=* npm run test:all
```

### Specific Scenario Testing
```bash
# Complete workflow test: List → Get → Clone
python3 scripts/test-mcp-client.py --workflow database_management

# Error handling test
python3 scripts/test-mcp-client.py --test error_handling

# Performance test
python3 scripts/test-mcp-client.py --benchmark
```

## 🎯 Testing Best Practices

### 1. **Recommended Test Order**
1. `npm run test:connection` - Verify connectivity
2. `npm run test:inspector` - Interactive tests
3. `npm run test:mcp` - Complete automated tests
4. `npm run test:all` - Final validation

### 2. **Test Environment Variables**
```bash
# Recommended .env.test file
NDB_BASE_URL=https://test-ndb.company.com
NDB_USERNAME=test-user
NDB_PASSWORD=test-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=15000
DEBUG=ndb:*
```

### 3. **CI/CD Testing**
```bash
# Script for continuous integration
npm run build
npm run test:connection
npm run test:mcp
```

### 4. **Regression Testing**
- Test with different Node.js versions
- Verify dependency compatibility
- Test edge case error scenarios

### 5. **Monitoring and Metrics**
- Monitor response times
- Check error rates
- Monitor memory usage

## 🚀 Next Steps

After validating your MCP server with these tests, you can:

1. **Integrate with Claude Desktop**: Follow the installation guide
2. **Deploy to Production**: Use tested configurations
3. **Contribute**: Add new tests for your features
4. **Optimize**: Use performance metrics for optimization

## 🔧 Advanced Test Configuration

### Custom Test Environment
```bash
# Create custom test configuration
cat > .env.test << EOF
NDB_BASE_URL=https://test-ndb.example.com
NDB_USERNAME=test-user
NDB_PASSWORD=test-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=30000
DEBUG=ndb:*
EOF

# Run tests with custom config
env $(cat .env.test | xargs) npm run test:all
```

### Automated Test Suites
```bash
# Create test suite script
cat > scripts/test-suite.sh << 'EOF'
#!/bin/bash
echo "🧪 Running NDB MCP Server Test Suite"

echo "1️⃣ Building project..."
npm run build || exit 1

echo "2️⃣ Testing connection..."
npm run test:connection || exit 1

echo "3️⃣ Testing MCP functionality..."
npm run test:mcp || exit 1

echo "✅ All tests passed!"
EOF

chmod +x scripts/test-suite.sh
./scripts/test-suite.sh
```

### Performance Benchmarking
```bash
# Benchmark script
cat > scripts/benchmark.sh << 'EOF'
#!/bin/bash
echo "⚡ Performance Benchmark"

echo "Testing response times..."
for i in {1..10}; do
  echo "Run $i:"
  time npm run test:connection 2>&1 | grep "completed"
done
EOF

chmod +x scripts/benchmark.sh
./scripts/benchmark.sh
```

## 📝 Test Documentation

### Creating Test Reports
```bash
# Generate test report
npm run test:all > test-report-$(date +%Y%m%d).txt 2>&1
```

### Test Coverage Analysis
```bash
# Analyze which tools are tested
python3 scripts/test-mcp-client.py --analyze-coverage
```

---

**Note:** These tests allow you to fully validate your MCP server without depending on Claude Desktop, which is essential for robust development and efficient debugging! 🚀