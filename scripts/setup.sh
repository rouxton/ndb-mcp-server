#!/bin/bash

# NDB MCP Server Setup Script
# Automates the basic installation and configuration process

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if ! command_exists node; then
        print_error "Node.js is not installed"
        print_info "Please install Node.js 18.0.0 or later from https://nodejs.org/"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"
    
    if ! npx semver -r ">=$required_version" "$node_version" >/dev/null 2>&1; then
        print_error "Node.js version $node_version is too old"
        print_info "Please upgrade to Node.js $required_version or later"
        exit 1
    fi
    
    print_success "Node.js version $node_version is compatible"
}

# Function to check npm version
check_npm_version() {
    if ! command_exists npm; then
        print_error "npm is not installed"
        print_info "npm should be included with Node.js installation"
        exit 1
    fi
    
    local npm_version=$(npm --version)
    print_success "npm version $npm_version found"
}

# Function to install dependencies
install_dependencies() {
    print_info "Installing Node.js dependencies..."
    
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Function to build the project
build_project() {
    print_info "Building TypeScript project..."
    
    if npm run build; then
        print_success "Project built successfully"
    else
        print_error "Failed to build project"
        exit 1
    fi
}

# Function to run configuration
run_configuration() {
    print_info "Starting interactive configuration..."
    print_warning "You'll be prompted for your NDB server details and credentials"
    
    if npm run configure; then
        print_success "Configuration completed"
    else
        print_error "Configuration failed"
        exit 1
    fi
}

# Function to test NDB connection
test_connection() {
    print_info "Testing NDB connection..."
    
    if npm run test:connection; then
        print_success "NDB connection test passed"
    else
        print_error "NDB connection test failed"
        print_warning "Please check your configuration and try again"
        return 1
    fi
}

# Function to test MCP functionality
test_mcp() {
    print_info "Testing MCP server functionality..."
    
    # Check if Python is available for MCP test
    if command_exists python3; then
        if npm run test:mcp; then
            print_success "MCP test passed"
        else
            print_warning "MCP test failed - but the server should still work with Claude Desktop"
        fi
    else
        print_warning "Python3 not found - skipping MCP test"
        print_info "This doesn't affect Claude Desktop integration"
    fi
}

# Function to display final instructions
show_final_instructions() {
    echo
    print_success "🎉 Setup completed successfully!"
    echo
    print_info "Next steps:"
    echo "  1. 🔧 Configure Claude Desktop integration:"
    echo "     Run: ./scripts/configure-claude.sh"
    echo "  2. 🔄 Restart Claude Desktop to load the new configuration"
    echo "  3. 💬 Start a new conversation with Claude"
    echo "  4. 🧪 Try: 'List all databases in NDB'"
    echo "  5. 📖 Check the documentation for more examples"
    echo
    print_info "Useful commands:"
    echo "  • Test connection: npm run test:connection"
    echo "  • Test MCP server: npm run test:mcp"
    echo "  • Reconfigure: npm run configure"
    echo "  • View logs: DEBUG=ndb:* npm start"
    echo
    print_info "Documentation: https://github.com/rouxton/ndb-mcp-server/blob/main/docs/"
    echo
}

# Main setup function
main() {
    echo
    print_info "🚀 Starting NDB MCP Server setup..."
    echo
    
    # Check system requirements
    print_info "Checking system requirements..."
    check_node_version
    check_npm_version
    print_success "System requirements met"
    echo
    
    # Install dependencies
    install_dependencies
    echo
    
    # Build project
    build_project
    echo
    
    # Run configuration
    run_configuration
    echo
    
    # Test NDB connection
    if test_connection; then
        echo
        
        # Test MCP functionality
        test_mcp
        echo
        
        # Show final instructions
        show_final_instructions
    else
        echo
        print_error "Setup failed due to connection issues"
        print_info "Please check your NDB configuration and try again"
        print_info "You can run 'npm run configure' to reconfigure"
        exit 1
    fi
}

# Run main function
main "$@"
