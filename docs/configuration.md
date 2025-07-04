# Configuration Guide

This guide explains how to configure the NDB MCP Server for Claude and other LLMs, including initial setup, multi-environment management, security best practices, and advanced optimizations.

## 1. Initial Configuration

To quickly set up your environment, use the interactive configuration script:

```bash
npm run configure
```

This script will prompt you for all required fields (NDB URL, authentication, SSL, etc.) and generate a `.env` file in your project root. This `.env` file can be used directly by Claude Desktop or any LLM that supports environment variable configuration.

**Authentication options:**
- You will be asked to choose between two authentication methods:
  - **Basic authentication** (username and password)
  - **Token-based authentication** (recommended for production)
- If you choose token-based authentication, the script will prompt you for your username and password only to generate the token, then save the resulting token as `NDB_TOKEN` in your `.env` file. Your username and password will not be stored. If you choose basic authentication, your username and password will be saved in the `.env` file.

**Example `.env` file with basic authentication:**
```env
NDB_BASE_URL=https://ndb-dev.company.local
NDB_USERNAME=dev-admin
NDB_PASSWORD=dev-password
NDB_VERIFY_SSL=false
NDB_TIMEOUT=60000
```

**Example `.env` file with token authentication:**
```env
NDB_BASE_URL=https://ndb.company.com
NDB_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NDB_VERIFY_SSL=true
NDB_TIMEOUT=30000
```

You can then reference these variables in your Claude Desktop configuration or other LLM integrations.

## 2. Multi-Environment Configuration

The configuration script also supports multiple environments. When prompted, specify an environment name (e.g., `prod`, `staging`, `dev`). The script will create or update a corresponding `.env.<env>` file (e.g., `.env.prod`). If you leave the environment blank, it will use `.env` by default.

**Example usage:**
```bash
npm run configure
# When prompted: Environment to configure?  prod
# => creates/updates .env.prod
```

**Switching environments for testing:**
When running the connection test or other scripts, you will be prompted for the environment to use. The script will load the correct `.env.<env>` file.

**Example: Development with login/password, Production with token**

- `.env.dev`:
  ```env
  NDB_BASE_URL=https://ndb-dev.company.local
  NDB_USERNAME=dev-user
  NDB_PASSWORD=dev-password
  NDB_VERIFY_SSL=false
  NDB_TIMEOUT=60000
  ```
- `.env.prod`:
  ```env
  NDB_BASE_URL=https://ndb.company.com
  NDB_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  NDB_VERIFY_SSL=true
  NDB_TIMEOUT=30000
  ```

**Claude Desktop multi-environment example:**

You can simply copy the values from your generated `.env` files into the corresponding `env` sections of your `claude_desktop_config.json`. This allows you to keep your environment-specific settings consistent between your CLI tools and Claude Desktop.

```json
{
  "mcpServers": {
    "ndb-dev": {
      "command": "node",
      "args": ["/Users/developer/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb-dev.company.local",
        "NDB_USERNAME": "dev-user",
        "NDB_PASSWORD": "dev-password",
        "NDB_VERIFY_SSL": "false"
      }
    },
    "ndb-prod": {
      "command": "node",
      "args": ["/opt/ndb-mcp-server/dist/index.js"],
      "env": {
        "NDB_BASE_URL": "https://ndb.company.com",
        "NDB_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "NDB_VERIFY_SSL": "true"
      }
    }
  }
}
```

## 3. Advanced Optimizations

- **Custom Node.js Path:**
  Specify a custom Node.js binary if needed:
  ```json
  {
    "command": "/usr/local/bin/node",
    "args": ["/opt/ndb-mcp-server/dist/index.js"]
  }
  ```
- **Performance Tuning:**
  Increase memory or adjust timeouts for large environments:
  ```json
  {
    "args": ["--max-old-space-size=4096", "/opt/ndb-mcp-server/dist/index.js"],
    "env": { "NDB_TIMEOUT": "60000" }
  }
  ```
- **Connection Pooling and Retries:**
  ```json
  {
    "env": {
      "NDB_MAX_RETRIES": "3",
      "NDB_RETRY_DELAY": "1000",
      "NDB_KEEP_ALIVE": "true"
    }
  }
  ```

## 4. Security Best Practices

- **Token-based authentication is strongly recommended.**
  - Using a token (`NDB_TOKEN`) avoids storing passwords in cleartext in your `.env` files.
  - If you must use username/password, be aware that these are stored in cleartext.
- **Always rotate your token or password regularly.**
  - Set a schedule for credential rotation (e.g., monthly).
- **Use a dedicated service account for automation.**
  - Do not use a personal or admin account.
  - Limit the service account's roles/permissions to only what the LLM or automation needs.
- **Enable SSL verification in production.**
  - Set `NDB_VERIFY_SSL=true` for all production environments.
- **Never commit credentials to version control.**
  - Use template files and environment variables for secrets.

