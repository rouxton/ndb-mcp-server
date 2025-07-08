#!/bin/bash

# Multi-Environment Validation Script for NDB MCP Server
# This script tests all configured environments and validates connectivity

echo "🌍 NDB MCP Server - Multi-Environment Validation"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test environment
test_environment() {
    local env_file=$1
    local env_name=${env_file#.env.}
    
    if [[ ! -f "$env_file" ]]; then
        echo -e "${YELLOW}⚠️  $env_file not found${NC}"
        return 1
    fi
    
    echo -e "\n🔧 Testing environment: ${YELLOW}$env_name${NC}"
    echo "   File: $env_file"
    
    # Extract NDB_BASE_URL for display
    ndb_url=$(grep "^NDB_BASE_URL=" "$env_file" 2>/dev/null | cut -d'=' -f2)
    if [[ -n "$ndb_url" ]]; then
        echo "   URL: $ndb_url"
    fi
    
    # Copy environment file to .env
    cp "$env_file" .env 2>/dev/null
    
    # Test connectivity
    echo "   Testing connection..."
    if npm run test:connection --silent > /tmp/ndb-test-$env_name.log 2>&1; then
        echo -e "   ${GREEN}✅ Connection successful${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Connection failed${NC}"
        # Show error details
        if [[ -f "/tmp/ndb-test-$env_name.log" ]]; then
            echo "   Error details:"
            tail -3 "/tmp/ndb-test-$env_name.log" | sed 's/^/     /'
        fi
        return 1
    fi
}

# Find all environment files
env_files=($(ls .env.* 2>/dev/null | grep -v ".env.example"))

if [[ ${#env_files[@]} -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  No environment files found (.env.*)${NC}"
    echo "   Run 'npm run configure' to create environment-specific configurations"
    echo ""
    echo "   Example:"
    echo "     npm run configure  # Enter 'dev' for environment name"
    echo "     npm run configure  # Enter 'prod' for environment name"
    exit 1
fi

echo "Found ${#env_files[@]} environment configuration(s):"
for env_file in "${env_files[@]}"; do
    env_name=${env_file#.env.}
    echo "  • $env_name ($env_file)"
done

# Test each environment
successful=0
failed=0

for env_file in "${env_files[@]}"; do
    if test_environment "$env_file"; then
        ((successful++))
    else
        ((failed++))
    fi
done

# Restore original .env if it existed
if [[ -f ".env.backup" ]]; then
    mv ".env.backup" ".env"
else
    rm -f ".env"
fi

# Summary
echo ""
echo "📊 Summary:"
echo -e "   ${GREEN}✅ Successful: $successful${NC}"
echo -e "   ${RED}❌ Failed: $failed${NC}"

if [[ $failed -eq 0 ]]; then
    echo -e "\n🎉 ${GREEN}All environments are configured and accessible!${NC}"
    echo ""
    echo "Claude Desktop Multi-Environment Setup:"
    echo "1. Configure multiple MCP servers in Claude Desktop:"
    echo "   {\"mcpServers\": {"
    for env_file in "${env_files[@]}"; do
        env_name=${env_file#.env.}
        echo "     \"ndb-$env_name\": {"
        echo "       \"command\": \"node\","
        echo "       \"args\": [\"/absolute/path/to/ndb-mcp-server/dist/index.js\"],"
        echo "       \"env\": { /* environment variables from $env_file */ }"
        echo "     },"
    done
    echo "   }}"
    echo ""
    echo "2. Restart Claude Desktop"
    echo "3. Use environment-specific conversations:"
    echo "   🗣️ \"Using ndb-dev, show me all databases\""
    echo "   🗣️ \"Using ndb-prod, check backup status\""
    
    exit 0
else
    echo -e "\n⚠️  ${YELLOW}Some environments failed connectivity tests${NC}"
    echo "Check the error details above and verify:"
    echo "  • NDB server URLs are accessible"
    echo "  • Credentials are correct and not expired"
    echo "  • Network connectivity (VPN, firewall rules)"
    echo "  • Service account permissions"
    
    exit 1
fi
