---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

## Bug Description
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Configure with '...'
2. Run command '...'
3. Execute tool '...'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Actual Behavior**
What actually happened instead.

## Environment Information
**System Environment:**
- OS: [e.g. macOS 13.0, Windows 11, Ubuntu 22.04]
- Node.js version: [e.g. 18.15.0]
- npm version: [e.g. 9.5.0]
- NDB MCP Server version: [e.g. 1.0.0]

**NDB Environment:**
- NDB version: [e.g. 2.5.1]
- NDB API version: [e.g. 0.9]
- Database engines involved: [e.g. PostgreSQL, Oracle]

**Claude Desktop:**
- Claude Desktop version: [if applicable]
- Operating System: [if different from above]

## Error Details
**Error Messages**
```
Paste any error messages here
```

**Log Output**
```
Paste relevant log output here (remove sensitive information)
```

**Stack Trace** (if available)
```
Paste stack trace here
```

## Configuration
**Environment Variables** (remove sensitive values)
```bash
NDB_BASE_URL=https://ndb.example.com
NDB_USERNAME=username
NDB_PASSWORD=***
NDB_TIMEOUT=30000
NDB_VERIFY_SSL=true
```

**Claude Desktop Config** (remove sensitive values)
```json
{
  "mcpServers": {
    "ndb": {
      "command": "node",
      "args": ["/path/to/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.example.com",
        "NDB_USERNAME": "***",
        "NDB_PASSWORD": "***"
      }
    }
  }
}
```

## Additional Context
**Screenshots**
If applicable, add screenshots to help explain your problem.

**Additional Information**
Add any other context about the problem here:
- Network configuration (proxy, VPN, etc.)
- Firewall settings
- Recent changes to environment
- Workarounds attempted

## Troubleshooting Attempted
**What have you tried?**
- [ ] Checked the troubleshooting guide
- [ ] Verified NDB connectivity manually
- [ ] Restarted Claude Desktop
- [ ] Rebuilt the project
- [ ] Checked environment variables
- [ ] Reviewed logs for additional details

**Diagnostic Results**
If you ran any diagnostic commands, please share the results:
```bash
# Example: Connection test results
node scripts/test-connection.js
```

## Impact Assessment
**Severity:**
- [ ] Critical - Blocks all functionality
- [ ] High - Significant feature impact
- [ ] Medium - Some functionality affected
- [ ] Low - Minor issue or inconvenience

**Frequency:**
- [ ] Always - Happens every time
- [ ] Often - Happens frequently
- [ ] Sometimes - Happens occasionally
- [ ] Rarely - Hard to reproduce

## Suggested Solution
If you have ideas on how to fix this issue, please describe them here.

---

**Note:** Please ensure you've removed any sensitive information (passwords, tokens, internal URLs) before submitting this issue.