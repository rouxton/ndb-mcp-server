#!/bin/bash

# Claude Desktop Configuration Script for NDB MCP Server
# Configures Claude Desktop to use the NDB MCP Server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to check prerequisites
check_prerequisites() {
    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        print_error "Configuration file .env not found"
        print_info "Please run './scripts/setup.sh' or 'npm run configure' first"
        exit 1
    fi
    
    # Check if dist/index.js exists
    if [[ ! -f "dist/index.js" ]]; then
        print_error "Built server not found at dist/index.js"
        print_info "Please run 'npm run build' first"
        exit 1
    fi
    
    print_success "Prerequisites met"
}

# Function to configure Claude Desktop
configure_claude_desktop() {
    print_info "Configuring Claude Desktop integration..."
    
    local project_path=$(pwd)
    local config_dir=""
    local config_file=""
    
    # Detect operating system and set config path
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        config_dir="$HOME/Library/Application Support/Claude"
        config_file="$config_dir/claude_desktop_config.json"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        config_dir="$HOME/.config/Claude"
        config_file="$config_dir/claude_desktop_config.json"
    else
        print_error "Unsupported operating system: $OSTYPE"
        print_info "Please configure Claude Desktop manually using the documentation"
        exit 1
    fi
    
    # Create config directory if it doesn't exist
    mkdir -p "$config_dir"
    
    # Read existing config or create new one
    if [[ -f "$config_file" ]]; then
        print_info "Updating existing Claude Desktop configuration..."
        # Backup existing config
        cp "$config_file" "$config_file.backup.$(date +%Y%m%d_%H%M%S)"
        print_info "Backup created: $config_file.backup.$(date +%Y%m%d_%H%M%S)"
    else
        print_info "Creating new Claude Desktop configuration..."
        echo '{"mcpServers": {}}' > "$config_file"
    fi
    
    # Create a temporary node script to update the JSON configuration
    cat > /tmp/update_claude_config.js << 'EOF'
const fs = require('fs');
const path = require('path');

const configFile = process.argv[2];
const projectPath = process.argv[3];

try {
    let config = {};
    if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        if (content.trim()) {
            config = JSON.parse(content);
        }
    }
    
    if (!config.mcpServers) {
        config.mcpServers = {};
    }
    
    // Get environment variables from .env file
    const envPath = path.join(projectPath, '.env');
    const envVars = {};
    
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
    }
    
    config.mcpServers.ndb = {
        command: "node",
        args: [path.join(projectPath, "dist", "index.js")],
        env: envVars
    };
    
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('Claude Desktop configuration updated successfully');
} catch (error) {
    console.error('Failed to update Claude Desktop configuration:', error.message);
    process.exit(1);
}
EOF
    
    if node /tmp/update_claude_config.js "$config_file" "$project_path"; then
        print_success "Claude Desktop configuration updated"
        print_info "Configuration file: $config_file"
    else
        print_error "Failed to update Claude Desktop configuration"
        print_info "Please configure manually using the documentation"
        exit 1
    fi
    
    # Clean up temporary script
    rm -f /tmp/update_claude_config.js
}

# Function to display final instructions
show_final_instructions() {
    echo
    print_success "🎉 Claude Desktop configuration completed!"
    echo
    print_info "Next steps:"
    echo "  1. 🔄 Restart Claude Desktop to load the new configuration"
    echo "  2. 💬 Start a new conversation with Claude"
    echo "  3. 🧪 Try: 'List all databases in NDB'"
    echo "  4. 📖 Check the documentation for more examples"
    echo
    print_warning "Important: You must restart Claude Desktop for changes to take effect"
    echo
    print_info "Troubleshooting:"
    echo "  • If tools don't appear: Check Claude Desktop settings"
    echo "  • Test MCP server: npm run test:mcp"
    echo "  • View logs: DEBUG=ndb:* npm start"
    echo
}

# Main function
main() {
    echo
    print_info "🔧 Configuring Claude Desktop for NDB MCP Server..."
    echo
    
    # Check prerequisites
    check_prerequisites
    echo
    
    # Configure Claude Desktop
    configure_claude_desktop
    echo
    
    # Show final instructions
    show_final_instructions
}

# Run main function
main "$@"
