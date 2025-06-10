# Security Guide

This document outlines security best practices, considerations, and guidelines for deploying and using the NDB MCP Server safely in production environments.

## Security Overview

The NDB MCP Server acts as a bridge between Claude Desktop and Nutanix Database Service (NDB), handling sensitive database operations and credentials. Proper security implementation is critical to protect your database infrastructure.

## Authentication and Authorization

### 1. Credential Management

**Environment Variables (Recommended)**
```bash
# Use environment variables for credentials
export NDB_BASE_URL="https://ndb.example.com"
export NDB_USERNAME="service-account"
export NDB_PASSWORD="strong-password-here"

# Never hardcode credentials
❌ const password = "admin123";  // NEVER DO THIS
✅ const password = process.env.NDB_PASSWORD;
```

**Secure Storage Options:**
- **Production**: Use secret management systems (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault)
- **Development**: Use .env files (never commit to git)
- **CI/CD**: Use encrypted environment variables or secret stores

**Example with Secret Manager:**
```javascript
// Using AWS Secrets Manager
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getCredentials() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'ndb-credentials'
  }).promise();
  
  return JSON.parse(secret.SecretString);
}
```

### 2. NDB User Permissions

**Principle of Least Privilege:**
```bash
# Create dedicated service account with minimal required permissions
# NDB Role: Database Operator (not Administrator)
# Permissions needed:
# - Database: Read, Create, Update, Delete
# - Time Machine: Read, Manage
# - Clone: Read, Create, Delete
# - Snapshot: Read, Create, Delete
```

**Recommended NDB User Setup:**
1. Create dedicated service account for MCP Server
2. Assign role-based permissions (not user-based)
3. Enable audit logging for the service account
4. Regularly rotate credentials
5. Monitor access patterns

### 3. Token-Based Authentication

**If NDB supports API tokens:**
```bash
# Prefer tokens over username/password
export NDB_TOKEN="your-api-token-here"
export NDB_TOKEN_EXPIRY="2024-12-31T23:59:59Z"

# Implement token rotation
export NDB_TOKEN_REFRESH_URL="https://ndb.example.com/auth/refresh"
```

## Network Security

### 1. SSL/TLS Configuration

**Always Use HTTPS:**
```bash
# Production configuration
NDB_BASE_URL=https://ndb.example.com  # Always HTTPS
NDB_VERIFY_SSL=true                   # Always verify certificates

# Development only (self-signed certificates)
NDB_VERIFY_SSL=false  # Use only for development
```

**Certificate Validation:**
```javascript
// Custom certificate validation
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: true,  // Always true in production
  ca: fs.readFileSync('path/to/ca-cert.pem'),  // Custom CA if needed
  cert: fs.readFileSync('path/to/client-cert.pem'),  // Client cert if required
  key: fs.readFileSync('path/to/client-key.pem')
});
```

### 2. Network Access Control

**Firewall Configuration:**
```bash
# Allow only necessary outbound connections
# Port 443 (HTTPS) to NDB server
# Block all other unnecessary ports

# Example iptables rules
sudo iptables -A OUTPUT -p tcp --dport 443 -d ndb.example.com -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 80 -j DROP  # Block HTTP
```

**Network Segmentation:**
- Deploy MCP Server in isolated network segment
- Use VPN or private networks for NDB communication
- Implement network monitoring and intrusion detection

### 3. Proxy and Load Balancer Security

**Reverse Proxy Configuration:**
```nginx
# nginx example
server {
    listen 443 ssl;
    server_name ndb-proxy.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    location / {
        proxy_pass https://ndb.example.com;
        proxy_ssl_verify on;
        proxy_ssl_trusted_certificate /path/to/ca.pem;
    }
}
```

## Data Protection

### 1. Sensitive Data Handling

**Configuration Files:**
```json
// ❌ Never store credentials in config files
{
  "ndb": {
    "url": "https://ndb.example.com",
    "username": "admin",      // NEVER DO THIS
    "password": "secret123"   // NEVER DO THIS
  }
}

// ✅ Use environment variable references
{
  "ndb": {
    "url": "${NDB_BASE_URL}",
    "username": "${NDB_USERNAME}",
    "password": "${NDB_PASSWORD}"
  }
}
```

**Logging Security:**
```javascript
// Sanitize logs - never log sensitive data
function sanitizeForLog(data) {
  const sanitized = { ...data };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.credentials;
  
  // Mask partial data
  if (sanitized.username) {
    sanitized.username = sanitized.username.replace(/(.{2}).*(.{2})/, '$1***$2');
  }
  
  return sanitized;
}

console.log('Request:', sanitizeForLog(requestData));
```

### 2. Data Encryption

**At Rest:**
```bash
# Encrypt configuration files
gpg --symmetric --cipher-algo AES256 config.json

# Use encrypted filesystems
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup open /dev/sdb1 encrypted-volume
```

**In Transit:**
```javascript
// Ensure all communications are encrypted
const config = {
  baseURL: process.env.NDB_BASE_URL,  // Must be HTTPS
  httpsAgent: new https.Agent({
    rejectUnauthorized: true,
    secureProtocol: 'TLSv1_3_method'  // Use TLS 1.3
  })
};
```

### 3. Backup Security

**Secure Backup Practices:**
```bash
# Encrypt backups
tar -czf - /path/to/ndb-mcp-server | gpg --symmetric --cipher-algo AES256 > backup.tar.gz.gpg

# Secure backup storage
aws s3 cp backup.tar.gz.gpg s3://secure-backup-bucket/ --sse AES256

# Regular backup testing
gpg --decrypt backup.tar.gz.gpg | tar -tz > backup-contents.txt
```

## Access Control

### 1. File System Permissions

**Secure File Permissions:**
```bash
# Configuration files - owner read only
chmod 600 .env
chmod 600 config.json

# Script files - owner read/execute
chmod 700 scripts/setup.sh

# Application directory
chmod 755 dist/
chmod 644 dist/*.js

# Log files - restricted access
chmod 640 logs/ndb-mcp-server.log
chown app:app logs/ndb-mcp-server.log
```

### 2. User Account Security

**Service Account Configuration:**
```bash
# Create dedicated user for NDB MCP Server
sudo useradd -r -s /bin/false -d /opt/ndb-mcp-server ndb-mcp

# Run service as non-root user
sudo systemctl edit ndb-mcp-server
```

```ini
[Service]
User=ndb-mcp
Group=ndb-mcp
WorkingDirectory=/opt/ndb-mcp-server
```

### 3. Container Security

**Docker Security Best Practices:**
```dockerfile
# Use non-root user
FROM node:18-alpine
RUN addgroup -g 1001 -S ndb-mcp && \
    adduser -S ndb-mcp -u 1001

# Set secure permissions
COPY --chown=ndb-mcp:ndb-mcp . /app
USER ndb-mcp

# Use read-only filesystem
docker run --read-only --tmpfs /tmp ndb-mcp-server
```

## Monitoring and Auditing

### 1. Security Monitoring

**Log Security Events:**
```javascript
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'security.log',
      level: 'warn'
    })
  ]
});

// Log security events
securityLogger.warn('Authentication attempt', {
  event: 'auth_attempt',
  source_ip: req.ip,
  username: sanitizedUsername,
  success: false,
  timestamp: new Date().toISOString()
});
```

**Key Security Metrics:**
- Failed authentication attempts
- Unusual access patterns
- Configuration changes
- Error rates and types
- Network connections

### 2. Audit Trail

**Enable NDB Audit Logging:**
```bash
# Ensure NDB audit logging is enabled
# Monitor the following events:
# - User login/logout
# - Database operations
# - Configuration changes
# - Failed access attempts
```

**Application Audit Logging:**
```javascript
function auditLog(action, resource, user, details = {}) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    resource,
    user: sanitizeForLog({ username: user }),
    details: sanitizeForLog(details),
    source: 'ndb-mcp-server'
  };
  
  auditLogger.info('AUDIT', auditEntry);
}

// Usage
auditLog('DATABASE_CREATE', 'sales-prod', 'service-account', {
  database_type: 'postgresql',
  cluster_id: 'cluster-123'
});
```

### 3. Alerting

**Security Alert Configuration:**
```javascript
// Configure alerts for security events
const alerts = {
  multiple_auth_failures: {
    threshold: 5,
    window: '5m',
    action: 'notify_security_team'
  },
  unusual_operations: {
    threshold: 10,
    window: '1h',
    action: 'require_approval'
  },
  privileged_operations: {
    threshold: 1,
    action: 'immediate_notification'
  }
};
```

## Vulnerability Management

### 1. Dependency Security

**Regular Security Updates:**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Use security scanning tools
npx snyk test
npx safety-check
```

**Automated Dependency Updates:**
```yaml
# GitHub Dependabot configuration
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    reviewers:
      - "security-team"
```

### 2. Security Scanning

**Static Analysis:**
```bash
# ESLint security plugin
npm install eslint-plugin-security --save-dev

# SonarQube analysis
sonar-scanner -Dsonar.projectKey=ndb-mcp-server
```

**Container Scanning:**
```bash
# Scan Docker images
trivy image ndb-mcp-server:latest

# Scan for secrets
truffleHog --regex --entropy=False .
```

### 3. Penetration Testing

**Regular Security Assessment:**
- Conduct regular penetration testing
- Test authentication mechanisms
- Verify access controls
- Check for information disclosure
- Test network security

## Incident Response

### 1. Security Incident Plan

**Incident Categories:**
- **Critical**: Unauthorized access to production databases
- **High**: Credential compromise or data exposure
- **Medium**: Authentication failures or suspicious activity
- **Low**: Configuration issues or minor vulnerabilities

**Response Procedures:**
1. **Immediate**: Isolate affected systems
2. **Assessment**: Determine scope and impact
3. **Containment**: Prevent further damage
4. **Recovery**: Restore secure operations
5. **Lessons Learned**: Update security measures

### 2. Incident Detection

**Automated Detection:**
```javascript
// Security monitoring
const securityMonitor = {
  detectAnomalies: function(metrics) {
    // Detect unusual patterns
    if (metrics.failed_auth_rate > 0.1) {
      this.triggerAlert('HIGH_AUTH_FAILURE_RATE');
    }
    
    if (metrics.privileged_ops_count > threshold) {
      this.triggerAlert('UNUSUAL_PRIVILEGED_ACTIVITY');
    }
  },
  
  triggerAlert: function(alertType) {
    // Send immediate notification
    // Escalate based on severity
    // Log security event
  }
};
```

## Compliance and Regulations

### 1. Data Privacy Regulations

**GDPR Compliance:**
- Implement data minimization
- Provide data access controls
- Enable data deletion capabilities
- Maintain audit trails
- Implement privacy by design

**HIPAA Compliance (if applicable):**
- Encrypt all PHI data
- Implement access controls
- Maintain audit logs
- Use signed business associate agreements
- Regular risk assessments

### 2. Industry Standards

**ISO 27001 Controls:**
- Information security policies
- Risk management procedures
- Access control management
- Cryptography controls
- Security incident management

**SOC 2 Compliance:**
- Security controls
- Availability controls
- Processing integrity
- Confidentiality controls
- Privacy controls

## Security Checklist

### Pre-Deployment Security Review

- [ ] **Authentication**
  - [ ] Using strong, unique credentials
  - [ ] Implementing proper credential storage
  - [ ] Service account with minimal permissions
  - [ ] Multi-factor authentication enabled

- [ ] **Network Security**
  - [ ] HTTPS enforced for all communications
  - [ ] SSL certificate validation enabled
  - [ ] Network access properly restricted
  - [ ] Firewall rules configured

- [ ] **Data Protection**
  - [ ] No credentials in code or config files
  - [ ] Sensitive data properly encrypted
  - [ ] Secure logging practices implemented
  - [ ] Backup encryption configured

- [ ] **Access Control**
  - [ ] File permissions properly set
  - [ ] Running as non-privileged user
  - [ ] Access controls implemented
  - [ ] Regular access reviews scheduled

- [ ] **Monitoring**
  - [ ] Security logging enabled
  - [ ] Audit trail configured
  - [ ] Alerting rules defined
  - [ ] Monitoring dashboard setup

- [ ] **Vulnerability Management**
  - [ ] Dependencies regularly updated
  - [ ] Security scanning enabled
  - [ ] Vulnerability remediation process
  - [ ] Regular security assessments

### Ongoing Security Maintenance

- [ ] **Regular Tasks**
  - [ ] Weekly dependency updates
  - [ ] Monthly security scans
  - [ ] Quarterly access reviews
  - [ ] Annual penetration testing

- [ ] **Incident Response**
  - [ ] Response plan documented
  - [ ] Team contact information current
  - [ ] Regular response drills
  - [ ] Post-incident review process

## Security Resources

### Documentation
- [NDB Security Guide](https://portal.nutanix.com/page/documents/details?targetId=Nutanix-Database-Service-User-Guide)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Tools
- **Static Analysis**: ESLint Security, SonarQube, Snyk
- **Dependency Scanning**: npm audit, Dependabot, WhiteSource
- **Secret Detection**: TruffleHog, GitLeaks, detect-secrets
- **Container Security**: Trivy, Clair, Anchore

### Support
- **Security Issues**: Report to [security@yourproject.com]
- **Vulnerability Disclosure**: Follow responsible disclosure process
- **Security Advisory**: Subscribe to security notifications

---

**Note**: Security is an ongoing process. Regularly review and update your security posture based on new threats, vulnerabilities, and best practices. When in doubt, consult with security professionals and follow the principle of least privilege.
