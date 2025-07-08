# NDB MCP Server Setup Script for Windows
# Automates the basic installation and configuration process

# Set error handling
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-Info { 
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue 
}

function Write-Success { 
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green 
}

function Write-Warning { 
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow 
}

function Write-Error { 
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red 
}

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to compare version numbers
function Compare-Version {
    param($Version1, $Version2)
    $v1 = [System.Version]::Parse($Version1)
    $v2 = [System.Version]::Parse($Version2)
    return $v1.CompareTo($v2)
}

# Function to check Node.js version
function Test-NodeVersion {
    if (-not (Test-Command "node")) {
        Write-Error "Node.js is not installed"
        Write-Info "Please install Node.js 18.0.0 or later from https://nodejs.org/"
        exit 1
    }
    
    $nodeVersion = (node --version).TrimStart('v')
    $requiredVersion = "18.0.0"
    
    if ((Compare-Version $nodeVersion $requiredVersion) -lt 0) {
        Write-Error "Node.js version $nodeVersion is too old"
        Write-Info "Please upgrade to Node.js $requiredVersion or later"
        exit 1
    }
    
    Write-Success "Node.js version $nodeVersion is compatible"
}

# Function to check npm version
function Test-NpmVersion {
    if (-not (Test-Command "npm")) {
        Write-Error "npm is not installed"
        Write-Info "npm should be included with Node.js installation"
        exit 1
    }
    
    $npmVersion = npm --version
    Write-Success "npm version $npmVersion found"
}

# Function to install dependencies
function Install-Dependencies {
    Write-Info "Installing Node.js dependencies..."
    
    try {
        npm install
        Write-Success "Dependencies installed successfully"
    }
    catch {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Function to build the project
function Build-Project {
    Write-Info "Building TypeScript project..."
    
    try {
        npm run build
        Write-Success "Project built successfully"
    }
    catch {
        Write-Error "Failed to build project"
        exit 1
    }
}

# Function to run configuration
function Start-Configuration {
    Write-Info "Starting interactive configuration..."
    Write-Warning "You'll be prompted for your NDB server details and credentials"
    
    try {
        npm run configure
        Write-Success "Configuration completed"
    }
    catch {
        Write-Error "Configuration failed"
        exit 1
    }
}

# Function to test NDB connection
function Test-NdbConnection {
    Write-Info "Testing NDB connection..."
    
    try {
        npm run test:connection
        Write-Success "NDB connection test passed"
        return $true
    }
    catch {
        Write-Error "NDB connection test failed"
        Write-Warning "Please check your configuration and try again"
        return $false
    }
}

# Function to test MCP functionality
function Test-McpFunctionality {
    Write-Info "Testing MCP server functionality..."
    
    # Check if Python is available for MCP test
    if (Test-Command "python3") {
        try {
            npm run test:mcp
            Write-Success "MCP test passed"
        }
        catch {
            Write-Warning "MCP test failed - but the server should still work with Claude Desktop"
        }
    }
    elseif (Test-Command "python") {
        try {
            # Try with 'python' command
            $env:PYTHON_CMD = "python"
            npm run test:mcp
            Write-Success "MCP test passed"
        }
        catch {
            Write-Warning "MCP test failed - but the server should still work with Claude Desktop"
        }
    }
    else {
        Write-Warning "Python not found - skipping MCP test"
        Write-Info "This doesn't affect Claude Desktop integration"
    }
}

# Function to display final instructions
function Show-FinalInstructions {
    Write-Host ""
    Write-Success "🎉 Setup completed successfully!"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "  1. 🔧 Configure Claude Desktop integration:"
    Write-Host "     Run: .\scripts\configure-claude.ps1"
    Write-Host "  2. 🔄 Restart Claude Desktop to load the new configuration"
    Write-Host "  3. 💬 Start a new conversation with Claude"
    Write-Host "  4. 🧪 Try: 'List all databases in NDB'"
    Write-Host "  5. 📖 Check the documentation for more examples"
    Write-Host ""
    Write-Info "Useful commands:"
    Write-Host "  • Test connection: npm run test:connection"
    Write-Host "  • Test MCP server: npm run test:mcp"
    Write-Host "  • Reconfigure: npm run configure"
    Write-Host "  • View logs: `$env:DEBUG='ndb:*'; npm start"
    Write-Host ""
    Write-Info "Documentation: https://github.com/rouxton/ndb-mcp-server/blob/main/docs/"
    Write-Host ""
}

# Main setup function
function Start-Setup {
    Write-Host ""
    Write-Info "🚀 Starting NDB MCP Server setup..."
    Write-Host ""
    
    try {
        # Check system requirements
        Write-Info "Checking system requirements..."
        Test-NodeVersion
        Test-NpmVersion
        Write-Success "System requirements met"
        Write-Host ""
        
        # Install dependencies
        Install-Dependencies
        Write-Host ""
        
        # Build project
        Build-Project
        Write-Host ""
        
        # Run configuration
        Start-Configuration
        Write-Host ""
        
        # Test NDB connection
        if (Test-NdbConnection) {
            Write-Host ""
            
            # Test MCP functionality
            Test-McpFunctionality
            Write-Host ""
            
            # Show final instructions
            Show-FinalInstructions
        }
        else {
            Write-Host ""
            Write-Error "Setup failed due to connection issues"
            Write-Info "Please check your NDB configuration and try again"
            Write-Info "You can run 'npm run configure' to reconfigure"
            exit 1
        }
    }
    catch {
        Write-Error "Setup failed: $($_.Exception.Message)"
        exit 1
    }
}

# Check if running with appropriate permissions
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Running without administrator privileges"
    Write-Info "This is fine for most operations, but some Node.js packages might require admin rights"
}

# Run main setup
Start-Setup
