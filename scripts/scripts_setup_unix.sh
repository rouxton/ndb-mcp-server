#!/bin/bash

# NDB MCP Server Setup Script for Unix/Linux/macOS
# This script automates the installation and configuration of the NDB MCP Server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_VERSION="1.0.0"
REQUIRED_NODE_VERSION="18.0.0"
PROJECT_NAME="ndb-mcp-server"

# Helper functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    NDB MCP Server Setup                     ║"
    echo "║              Model Context Protocol for Nutanix NDB         ║"
    echo "║                     Version $SCRIPT_VERSION                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Version comparison function
version_compare() {
    if [[ $1 == $2 ]]; then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z ${ver2[i]} ]]; then
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 2
        fi
    done
    return 0
}

# Check if Node.js is installed and meets version requirements
check_node() {
    print_info "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed."
        print_info "Please install Node.js $REQUIRED_NODE_VERSION or later from:"
        print_info "  - https://nodejs.org"
        print_info "  - Using package manager: brew install node (macOS) or apt install nodejs (Ubuntu)"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    version_compare $NODE_VERSION $REQUIRED_NODE_VERSION
    
    case $? in
        0|1)
            print_success "Node.js version $NODE_VERSION is compatible"
            ;;
        2)
            print_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_NODE_VERSION or later"
            print_info "Please upgrade Node.js from https://nodejs.org"
            exit 1
            ;;
    esac
}

# Check if npm is available
check_npm() {
    print_info "Checking npm installation..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm version $NPM_VERSION is available"
}

# Check if we're in the right directory or need to clone
setup_project_directory() {
    if [ -f "package.json" ] && grep -q "ndb-mcp-server" package.json; then
        print_info "Already in NDB MCP Server project directory"
        PROJECT_DIR=$(pwd)
    else
        print_info "Setting up project directory..."
        
        if [ -d "$PROJECT_NAME" ]; then
            print_warning "Directory $PROJECT_NAME already exists"
            read -p "Do you want to remove it and start fresh? (y/N): " REMOVE_EXISTING
            if [[ $REMOVE_EXISTING =~ ^[Yy]$ ]]; then
                rm -rf "$PROJECT_NAME"
                print_info "Removed existing directory"
            else
                print_info "Using existing directory"
            fi
        fi
        
        if [ ! -d "$PROJECT_NAME" ]; then
            # Check if we can clone from git
            if command -v git &> /dev/null; then
                print_info "Cloning repository..."
                if git clone https://github.com/your-username/ndb-mcp-server.git; then
                    print_success "Repository cloned successfully"
                else
                    print_warning "Failed to clone repository, creating project structure manually"
                    create_project_structure
                fi
            else
                print_info "Git not available, creating project structure manually"
                create_project_structure
            fi
        fi
        
        cd "$PROJECT_NAME"
        PROJECT_DIR=$(pwd)
        print_success "Project directory: $PROJECT_DIR"
    fi
}

# Create basic project structure if cloning fails
create_project_structure() {
    print_info "Creating project structure..."
    
    mkdir -p "$PROJECT_NAME"/{src,docs,scripts,examples}
    cd "$PROJECT_NAME"
    
    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "ndb-mcp-server",
  "version": "1.0.0",
  "description": "Model Context Protocol server for Nutanix Database Service",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

    # Create tsconfig.json
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

    print_success "Project structure created"
}

# Install npm dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        print_info "Trying with clean cache..."
        npm cache clean --force
        npm install
    fi
}

# Configure NDB connection
configure_ndb() {
    print_info "Configuring NDB connection..."
    
    if [ -f ".env" ]; then
        print_warning "Configuration file .env already exists"
        read -p "Do you want to reconfigure? (y/N): " RECONFIGURE
        if [[ ! $RECONFIGURE =~ ^[Yy]$ ]]; then
            print_info "Keeping existing configuration"
            return 0
        fi
    fi
    
    echo ""
    echo -e "${CYAN}Please provide your NDB connection details:${NC}"
    echo ""
    
    # Get NDB URL
    while true; do
        read -p "NDB Base URL (e.g., https://ndb.company.com): " NDB_BASE_URL
        if [[ $NDB_BASE_URL =~ ^https?:// ]]; then
            break
        else
            print_warning "Please include the protocol (https://)"
        fi
    done
    
    # Get username
    read -p "NDB Username: " NDB_USERNAME
    
    # Get password securely
    read -s -p "NDB Password: " NDB_PASSWORD
    echo ""
    
    # SSL verification
    read -p "Verify SSL certificates? (Y/n): " VERIFY_SSL
    VERIFY_SSL=${VERIFY_SSL:-Y}
    if [[ $VERIFY_SSL =~ ^[Yy]$ ]]; then
        NDB_VERIFY_SSL="true"
    else
        NDB_VERIFY_SSL="false"
        print_warning "SSL verification disabled - use only for development!"
    fi
    
    # Timeout
    read -p "API Timeout in milliseconds [30000]: " NDB_TIMEOUT
    NDB_TIMEOUT=${NDB_TIMEOUT:-30000}
    
    # Create .env file
    cat > .env << EOF
# NDB MCP Server Configuration
# Generated on $(date)

# Required: NDB Server Configuration
NDB_BASE_URL=$NDB_BASE_URL
NDB_USERNAME=$NDB_USERNAME
NDB_PASSWORD=$NDB_PASSWORD

# Optional: Connection Settings
NDB_TIMEOUT=$NDB_TIMEOUT
NDB_VERIFY_SSL=$NDB_VERIFY_SSL
EOF
    
    # Secure the .env file
    chmod 600 .env
    
    print_success "NDB configuration saved to .env"
    print_warning "Keep your .env file secure and never commit it to version control!"
}

# Test NDB connection
test_ndb_connection() {
    print_info "Testing NDB connection..."
    
    # Source environment variables
    set -a
    source .env
    set +a
    
    # Create test script
    cat > test_connection.js << 'EOF'
import axios from 'axios';
import https from 'https';

const config = {
  baseURL: process.env.NDB_BASE_URL + '/era/v0.9',
  timeout: parseInt(process.env.NDB_TIMEOUT) || 30000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: process.env.NDB_VERIFY_SSL !== 'false'
  })
};

const auth = Buffer.from(`${process.env.NDB_USERNAME}:${process.env.NDB_PASSWORD}`).toString('base64');

try {
  console.log('Testing connection to:', process.env.NDB_BASE_URL);
  const response = await axios.get('/clusters', {
    ...config,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('✅ Connection successful!');
  console.log(`📊 Found ${response.data?.length || 0} clusters`);
  
  if (response.data?.length > 0) {
    console.log('🏗️ Available clusters:');
    response.data.slice(0, 3).forEach(cluster => {
      console.log(`   - ${cluster.name} (${cluster.status})`);
    });
    if (response.data.length > 3) {
      console.log(`   ... and ${response.data.length - 3} more`);
    }
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Connection test failed:');
  if (error.response) {
    console.error(`   HTTP ${error.response.status}: ${error.response.statusText}`);
    if (error.response.data?.message) {
      console.error(`   Message: ${error.response.data.message}`);
    }
  } else if (error.request) {
    console.error('   No response received - check network connectivity');
    console.error(`   Target: ${error.config?.baseURL || 'unknown'}`);
  } else {
    console.error(`   Error: ${error.message}`);
  }
  
  console.error('\n🔧 Troubleshooting tips:');
  console.error('   1. Verify NDB server URL is correct and accessible');
  console.error('   2. Check username and password');
  console.error('   3. Ensure network connectivity to NDB server');
  console.error('   4. Check firewall and proxy settings');
  console.error('   5. Verify SSL certificate configuration');
  
  process.exit(1);
}
EOF
    
    if node test_connection.js; then
        print_success "NDB connection test passed!"
    else
        print_error "NDB connection test failed"
        print_info "Please check your configuration in .env file"
        echo ""
        read -p "Do you want to reconfigure NDB settings? (y/N): " RECONFIG
        if [[ $RECONFIG =~ ^[Yy]$ ]]; then
            configure_ndb
            test_ndb_connection
        fi
    fi
    
    # Clean up test file
    rm -f test_connection.js
}

# Build the project
build_project() {
    print_info "Building the project..."
    
    if [ ! -f "src/index.ts" ]; then
        print_warning "Main TypeScript files not found in src/"
        print_info "Creating placeholder files..."
        
        mkdir -p src
        cat > src/index.ts << 'EOF'
// NDB MCP Server - Main entry point
// This is a placeholder file. Please copy the complete TypeScript implementation here.

console.error('❌ Main implementation not found');
console.error('Please copy the complete TypeScript code to src/index.ts');
process.exit(1);
EOF
        
        print_warning "Placeholder files created. You need to:"
        print_warning "1. Copy the main TypeScript implementation to src/"
        print_warning "2. Run 'npm run build' to compile"
        print_warning "3. Run 'npm start' to test"
        return 0
    fi
    
    if npm run build; then
        print_success "Project built successfully"
    else
        print_error "Build failed"
        print_info "Check TypeScript compilation errors above"
        return 1
    fi
}

# Configure Claude Desktop
configure_claude_desktop() {
    print_info "Configuring Claude Desktop integration..."
    
    # Get absolute path to the built server
    SERVER_PATH="$PROJECT_DIR/dist/index.js"
    
    # Detect OS and set config path
    case "$OSTYPE" in
        darwin*)
            # macOS
            CONFIG_DIR="$HOME/Library/Application Support/Claude"
            CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
            OS_NAME="macOS"
            NODE_CMD="node"
            ;;
        linux*)
            # Linux
            CONFIG_DIR="$HOME/.config/Claude"
            CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
            OS_NAME="Linux"
            NODE_CMD="node"
            ;;
        msys*|cygwin*|mingw*)
            # Windows
            CONFIG_DIR="$APPDATA/Claude"
            CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
            OS_NAME="Windows"
            NODE_CMD="node.exe"
            ;;
        *)
            print_warning "Unknown OS type: $OSTYPE"
            print_info "Please manually configure Claude Desktop"
            OS_NAME="Unknown"
            ;;
    esac
    
    # Create configuration directory if needed
    if [[ "$OS_NAME" != "Unknown" ]]; then
        mkdir -p "$CONFIG_DIR"
    fi
    
    # Read environment variables for config
    set -a
    source .env 2>/dev/null || true
    set +a
    
    # Generate Claude Desktop configuration
    TEMP_CONFIG="claude_desktop_config.json"
    cat > "$TEMP_CONFIG" << EOF
{
  "mcpServers": {
    "ndb": {
      "command": "$NODE_CMD",
      "args": ["$SERVER_PATH"],
      "env": {
        "NDB_BASE_URL": "$NDB_BASE_URL",
        "NDB_USERNAME": "$NDB_USERNAME",
        "NDB_PASSWORD": "$NDB_PASSWORD",
        "NDB_TIMEOUT": "$NDB_TIMEOUT",
        "NDB_VERIFY_SSL": "$NDB_VERIFY_SSL"
      }
    }
  }
}
EOF
    
    print_info "Generated Claude Desktop configuration:"
    echo ""
    cat "$TEMP_CONFIG"
    echo ""
    
    if [[ "$OS_NAME" != "Unknown" ]]; then
        # Check if config file already exists
        if [ -f "$CONFIG_FILE" ]; then
            print_warning "Claude Desktop configuration already exists at:"
            print_warning "$CONFIG_FILE"
            echo ""
            read -p "Do you want to backup and replace it? (y/N): " REPLACE_CONFIG
            if [[ $REPLACE_CONFIG =~ ^[Yy]$ ]]; then
                cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
                cp "$TEMP_CONFIG" "$CONFIG_FILE"
                print_success "Configuration updated (backup created)"
            else
                print_info "Configuration file saved as: $TEMP_CONFIG"
                print_info "Please manually merge into: $CONFIG_FILE"
            fi
        else
            cp "$TEMP_CONFIG" "$CONFIG_FILE"
            print_success "Claude Desktop configuration installed:"
            print_success "$CONFIG_FILE"
        fi
    else
        print_info "Configuration saved as: $TEMP_CONFIG"
        print_info "Please manually install for your platform"
    fi
}

# Display next steps
show_next_steps() {
    echo ""
    print_success "🎉 Installation completed successfully!"
    echo ""
    print_info "📋 Next steps:"
    echo ""
    
    if [ ! -f "dist/index.js" ]; then
        print_warning "1. ⚠️  Copy the complete TypeScript implementation to src/"
        print_info "2. 🔨 Build the project: npm run build"
        print_info "3. 🧪 Test the server: npm start"
    else
        print_info "1. ✅ Server is built and ready"
        print_info "2. 🧪 Test the server: npm start"
    fi
    
    print_info "3. 🔄 Restart Claude Desktop completely"
    print_info "4. 💬 Test with Claude: 'List all databases in NDB'"
    print_info "5. 📖 Read the documentation in docs/ folder"
    echo ""
    
    print_info "📁 Project structure:"
    print_info "├── $PROJECT_DIR"
    print_info "├── .env                  - Your NDB configuration (keep secure!)"
    print_info "├── package.json          - Node.js project configuration"
    print_info "├── tsconfig.json         - TypeScript settings"
    print_info "├── src/                  - Source code directory"
    print_info "├── dist/                 - Compiled JavaScript (after build)"
    print_info "├── docs/                 - Documentation"
    print_info "└── scripts/              - Utility scripts"
    echo ""
    
    print_info "🔧 Useful commands:"
    print_info "npm run build             - Compile TypeScript to JavaScript"
    print_info "npm run dev               - Watch mode for development"
    print_info "npm start                 - Run the MCP server"
    print_info "node scripts/test-connection.js - Test NDB connectivity"
    echo ""
    
    print_info "📚 Documentation:"
    print_info "docs/configuration.md     - Advanced configuration options"
    print_info "docs/usage-examples.md    - Example interactions with Claude"
    print_info "docs/troubleshooting.md   - Common issues and solutions"
    print_info "docs/security.md          - Security best practices"
    echo ""
    
    print_warning "🔒 Security reminders:"
    print_warning "• Never commit the .env file to version control"
    print_warning "• Keep your NDB credentials secure"
    print_warning "• Use SSL verification in production environments"
    print_warning "• Regularly rotate passwords and review access"
    echo ""
    
    print_info "❓ Need help?"
    print_info "• Check docs/troubleshooting.md for common issues"
    print_info "• Review logs for error messages"
    print_info "• Open an issue on GitHub for support"
    echo ""
}

# Cleanup function
cleanup() {
    print_info "Cleaning up temporary files..."
    rm -f test_connection.js claude_desktop_config.json 2>/dev/null || true
}

# Error handler
error_handler() {
    print_error "An error occurred during setup!"
    print_info "Check the output above for details"
    cleanup
    exit 1
}

# Main setup function
main() {
    # Set error handler
    trap error_handler ERR
    
    print_banner
    
    print_info "Starting NDB MCP Server setup..."
    echo ""
    
    # Check prerequisites
    check_node
    check_npm
    
    # Setup project
    setup_project_directory
    install_dependencies
    
    # Configure NDB
    configure_ndb
    test_ndb_connection
    
    # Build project (if source files exist)
    build_project
    
    # Configure Claude Desktop
    configure_claude_desktop
    
    # Show completion info
    show_next_steps
    
    # Cleanup
    cleanup
    
    print_success "🚀 Setup completed! Enjoy using NDB with Claude!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "NDB MCP Server Setup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h        Show this help message"
        echo "  --version, -v     Show script version"
        echo "  --test-only       Only test NDB connection"
        echo ""
        echo "This script will:"
        echo "1. Check Node.js and npm installation"
        echo "2. Set up the project directory and dependencies"
        echo "3. Configure NDB connection settings"
        echo "4. Test connectivity to your NDB server"
        echo "5. Build the project (if source code is available)"
        echo "6. Configure Claude Desktop integration"
        echo ""
        exit 0
        ;;
    --version|-v)
        echo "NDB MCP Server Setup Script v$SCRIPT_VERSION"
        exit 0
        ;;
    --test-only)
        print_info "Testing NDB connection only..."
        if [ -f ".env" ]; then
            test_ndb_connection
        else
            print_error "No .env file found. Run setup first."
            exit 1
        fi
        exit 0
        ;;
    "")
        # No arguments, run main setup
        main
        ;;
    *)
        print_error "Unknown option: $1"
        print_info "Use --help for usage information"
        exit 1
        ;;
esac