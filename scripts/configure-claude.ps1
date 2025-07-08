# Claude Desktop Configuration Script for NDB MCP Server (Windows)
# Configures Claude Desktop to use the NDB MCP Server

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

# Function to check prerequisites
function Test-Prerequisites {
    # Check if .env file exists
    if (-not (Test-Path ".env")) {
        Write-Error "Configuration file .env not found"
        Write-Info "Please run '.\scripts\setup.ps1' or 'npm run configure' first"
        exit 1
    }
    
    # Check if dist/index.js exists
    if (-not (Test-Path "dist\index.js")) {
        Write-Error "Built server not found at dist\index.js"
        Write-Info "Please run 'npm run build' first"
        exit 1
    }
    
    Write-Success "Prerequisites met"
}

# Function to configure Claude Desktop
function Set-ClaudeDesktopConfig {
    Write-Info "Configuring Claude Desktop integration..."
    
    $projectPath = Get-Location
    $configDir = "$env:APPDATA\Claude"
    $configFile = "$configDir\claude_desktop_config.json"
    
    # Create config directory if it doesn't exist
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        Write-Info "Created Claude Desktop configuration directory"
    }
    
    # Read existing config or create new one
    $config = @{}
    if (Test-Path $configFile) {
        Write-Info "Updating existing Claude Desktop configuration..."
        # Backup existing config
        $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $backupFile = "$configFile.backup.$timestamp"
        Copy-Item $configFile $backupFile
        Write-Info "Backup created: $backupFile"
        
        try {
            $existingContent = Get-Content $configFile -Raw
            if ($existingContent.Trim()) {
                $config = $existingContent | ConvertFrom-Json -AsHashtable
            }
        }
        catch {
            Write-Warning "Could not parse existing configuration, creating new one"
            $config = @{}
        }
    }
    else {
        Write-Info "Creating new Claude Desktop configuration..."
    }
    
    if (-not $config.mcpServers) {
        $config.mcpServers = @{}
    }
    
    # Read environment variables from .env file
    $envVars = @{}
    $envPath = Join-Path $projectPath ".env"
    
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_.Trim() -and -not $_.StartsWith('#')) {
                $parts = $_.Split('=', 2)
                if ($parts.Length -eq 2) {
                    $envVars[$parts[0].Trim()] = $parts[1].Trim()
                }
            }
        }
        Write-Info "Loaded environment variables from .env file"
    }
    else {
        Write-Warning "No .env file found, configuration may be incomplete"
    }
    
    # Configure NDB MCP server
    $config.mcpServers.ndb = @{
        command = "node"
        args = @(Join-Path $projectPath "dist\index.js")
        env = $envVars
    }
    
    try {
        $config | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8
        Write-Success "Claude Desktop configuration updated"
        Write-Info "Configuration file: $configFile"
    }
    catch {
        Write-Error "Failed to update Claude Desktop configuration: $($_.Exception.Message)"
        Write-Info "Please configure manually using the documentation"
        exit 1
    }
}

# Function to display final instructions
function Show-FinalInstructions {
    Write-Host ""
    Write-Success "🎉 Claude Desktop configuration completed!"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "  1. 🔄 Restart Claude Desktop to load the new configuration"
    Write-Host "  2. 💬 Start a new conversation with Claude"
    Write-Host "  3. 🧪 Try: 'List all databases in NDB'"
    Write-Host "  4. 📖 Check the documentation for more examples"
    Write-Host ""
    Write-Warning "Important: You must restart Claude Desktop for changes to take effect"
    Write-Host ""
    Write-Info "Troubleshooting:"
    Write-Host "  • If tools don't appear: Check Claude Desktop settings"
    Write-Host "  • Test MCP server: npm run test:mcp"
    Write-Host "  • View logs: `$env:DEBUG='ndb:*'; npm start"
    Write-Host ""
}

# Main function
function Start-ClaudeConfiguration {
    Write-Host ""
    Write-Info "🔧 Configuring Claude Desktop for NDB MCP Server..."
    Write-Host ""
    
    try {
        # Check prerequisites
        Test-Prerequisites
        Write-Host ""
        
        # Configure Claude Desktop
        Set-ClaudeDesktopConfig
        Write-Host ""
        
        # Show final instructions
        Show-FinalInstructions
    }
    catch {
        Write-Error "Configuration failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Start-ClaudeConfiguration
