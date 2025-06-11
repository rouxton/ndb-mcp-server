# NDB MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

A comprehensive Model Context Protocol (MCP) server for **Nutanix Database Service (NDB)**. This server enables Claude Desktop and other MCP-compatible LLMs to manage databases, clones, snapshots, and infrastructure through natural language interactions.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or later
- Access to a Nutanix NDB environment
- Valid NDB credentials with appropriate permissions

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rouxton/ndb-mcp-server.git
   cd ndb-mcp-server
   ```

2. **Run the setup script:**
   ```bash
   # For Unix/Linux/macOS
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   
   # For Windows PowerShell
   powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
   ```

3. **Configure your NDB connection:**
   ```bash
   cp .env.example .env
   # Edit .env with your NDB server details
   ```

4. **Build and test:**
   ```bash
   npm run build
   npm start
   ```

### Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://your-ndb-server.com",
        "NDB_USERNAME": "your-username",
        "NDB_PASSWORD": "your-password"
      }
    }
  }
}
```

**Configuration file locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## 🧪 Testing

Before integrating with Claude Desktop, test your server directly:

```bash
# Test NDB connectivity
npm run test:connection

# Test MCP functionality
npm run test:mcp

# Interactive testing with web interface
npm run test:inspector

# Run all tests
npm run test:all
```

For comprehensive testing documentation, see **[Testing Guide](docs/TESTING.md)**.

## 🎯 Features

### Database Management
- 📋 **List and monitor** all databases across your NDB environment
- 🔧 **Provision new databases** with custom configurations
- 📝 **Register existing databases** into NDB management
- ✏️ **Update database properties** and lifecycle settings
- 🗑️ **Deregister databases** with cleanup options

### Clone Operations
- 🔄 **Create database clones** from snapshots or point-in-time
- 🔃 **Refresh clones** with latest production data
- 📊 **Manage clone lifecycle** and resource allocation
- 🧹 **Cleanup and remove** unnecessary clones

### Time Machine & Backup
- ⏰ **Monitor time machine status** and health
- ⏸️ **Pause and resume** time machines for maintenance
- 📈 **View recovery capabilities** and timeline analysis
- 🔍 **Health monitoring** with gap analysis

### Snapshot Management
- 📸 **Take manual snapshots** with custom retention
- 📅 **Schedule automated snapshots** via SLA policies
- 🗂️ **List and filter snapshots** by date, type, or database
- 🧹 **Delete expired snapshots** to free storage

### Infrastructure Monitoring
- 🖥️ **Database server management** and health monitoring
- 🏗️ **Cluster resource utilization** and capacity planning
- 📊 **Profile management** (Software, Compute, Network)
- 🚨 **Alert monitoring** and operation tracking

## 💬 Usage Examples

Once configured, interact with your NDB environment using natural language:

```
🗣️ "Show me all PostgreSQL databases in production"
🗣️ "Create a clone of the sales database for testing"  
🗣️ "Take a snapshot of the critical app database"
🗣️ "List all failed operations from yesterday"
🗣️ "Provision a new MySQL database with medium compute"
🗣️ "Check the backup status of all time machines"
🗣️ "Show cluster resource utilization"
```

## 📚 Documentation

- 📖 **[Installation Guide](docs/installation.md)** - Detailed setup instructions
- ⚙️ **[Configuration Guide](docs/configuration.md)** - Environment and security setup
- 💡 **[Usage Examples](docs/usage-examples.md)** - Comprehensive usage scenarios
- 🔧 **[Testing Guide](docs/TESTING.md)** - Complete testing documentation
- 🔧 **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions
- 🔒 **[Security Guide](docs/security.md)** - Security best practices
- 📝 **[API Reference](docs/api-reference.md)** - Complete tool documentation

## 🛠️ Available Tools

### Core Database Operations
| Tool | Description |
|------|-------------|
| `list_databases` | Get all databases with filtering options |
| `get_database` | Get specific database details |
| `provision_database` | Create a new database |
| `register_database` | Register existing database |
| `update_database` | Update database properties |
| `deregister_database` | Remove database from NDB |

### Clone & Snapshot Management
| Tool | Description |
|------|-------------|
| `list_clones` | Get all database clones |
| `create_clone` | Create new clone from snapshot/PITR |
| `refresh_clone` | Refresh clone with latest data |
| `delete_clone` | Remove clone and resources |
| `list_snapshots` | Get all snapshots with filtering |
| `take_snapshot` | Create manual snapshot |
| `delete_snapshot` | Remove snapshot |

### Infrastructure & Monitoring
| Tool | Description |
|------|-------------|
| `list_clusters` | Get all Nutanix clusters |
| `list_dbservers` | Get all database servers |
| `list_time_machines` | Get all time machines |
| `get_time_machine_capability` | Check recovery capabilities |
| `list_operations` | Get operation history |
| `list_alerts` | Get system alerts |

*See [API Reference](docs/api-reference.md) for complete tool documentation.*

## 🔧 Development

### Building from Source
```bash
git clone https://github.com/rouxton/ndb-mcp-server.git
cd ndb-mcp-server
npm install
npm run build
```

### Development Mode
```bash
npm run dev  # Watch mode with auto-rebuild
```

### Testing Connection
```bash
node scripts/test-connection.js
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Requirements

- **Node.js**: 18.0.0 or later
- **NDB Version**: 2.4+ (API v0.9)
- **Supported Databases**: Oracle, PostgreSQL, SQL Server, MySQL, MariaDB, SAP HANA, MongoDB
- **Operating Systems**: macOS, Windows, Linux

## 🐛 Issues & Support

- 🐞 **Bug Reports**: [Create an issue](https://github.com/rouxton/ndb-mcp-server/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Request a feature](https://github.com/rouxton/ndb-mcp-server/issues/new?template=feature_request.md)
- ❓ **Questions**: [Get support](https://github.com/rouxton/ndb-mcp-server/issues/new?template=support.md)
- 📖 **Documentation**: Check our [troubleshooting guide](docs/troubleshooting.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Nutanix](https://www.nutanix.com/) for the powerful NDB platform
- [Anthropic](https://www.anthropic.com/) for Claude and the MCP protocol
- The open source community for inspiration and best practices

## 🔗 Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol) - The MCP specification and SDK
- [Claude Desktop](https://claude.ai/desktop) - Anthropic's desktop application
- [Nutanix Developer Portal](https://www.nutanix.dev/) - NDB API documentation

---

**Ready to transform your database management with AI?** 🚀

[Get Started](docs/installation.md) • [View Examples](docs/usage-examples.md) • [Join Discussions](https://github.com/rouxton/ndb-mcp-server/discussions)
