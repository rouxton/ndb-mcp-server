# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial development planning

## [1.0.0] - 2024-12-21

### Added
- Initial release of NDB MCP Server
- Complete MCP server implementation for Nutanix Database Service
- Support for all major NDB operations:
  - Database management (list, provision, register, update, deregister)
  - Clone operations (create, refresh, delete)
  - Time machine management (monitor, pause, resume)
  - Snapshot management (create, list, delete)
  - Infrastructure monitoring (clusters, servers, profiles, alerts)
- Authentication support (token-based and basic auth)
- Auto-retry mechanism for token expiration
- SSL certificate verification options
- Comprehensive error handling and logging
- Claude Desktop integration with auto-configuration
- Cross-platform support (macOS, Windows, Linux)
- Automated setup scripts for easy installation
- Complete documentation suite:
  - Installation guide
  - Configuration guide
  - Usage examples
  - Troubleshooting guide
  - Security recommendations
  - API reference
- Environment-specific configuration templates
- Connection testing utilities
- GitHub Actions workflows for CI/CD
- Issue templates and PR templates
- MIT License

### Security
- Secure credential management via environment variables
- SSL/TLS support with configurable verification
- Input validation and sanitization
- Protection against credential exposure in logs

### Documentation
- Comprehensive README with quick start guide
- Detailed installation and configuration documentation
- 30+ usage examples with natural language interactions
- Complete troubleshooting guide with diagnostic procedures
- Security best practices and recommendations
- API reference for all 30+ available tools

### Infrastructure
- TypeScript implementation with full type safety
- Modular architecture for maintainability
- Automated build and test pipeline
- Cross-platform installation scripts
- Development and production environment templates
- Contributing guidelines and code of conduct

## [0.1.0] - 2024-12-21

### Added
- Project initialization
- Basic project structure
- Initial documentation planning
- Repository setup and configuration

---

## Version History Summary

- **v1.0.0**: Initial public release with complete functionality
- **v0.1.0**: Project initialization

## Upgrade Guide

### From v0.1.0 to v1.0.0
This is the first functional release. Follow the installation guide in the README.md for initial setup.

## Breaking Changes

None in this initial release.

## Migration Notes

This is the initial release, so no migration is needed.

## Known Issues

Please check the [GitHub Issues](https://github.com/rouxton/ndb-mcp-server/issues) for current known issues and their status.

## Contributors

Thank you to all contributors who helped make this release possible!

- Initial development and documentation
- Testing and validation
- Community feedback and suggestions

---

For more details about any release, please see the [full commit history](https://github.com/rouxton/ndb-mcp-server/commits/main) or [release notes](https://github.com/rouxton/ndb-mcp-server/releases).
