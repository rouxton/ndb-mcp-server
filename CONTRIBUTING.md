# Contributing to NDB MCP Server

Thank you for your interest in contributing to the NDB MCP Server! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

We welcome contributions of all kinds:
- 🐛 Bug reports and fixes
- 💡 Feature requests and implementations
- 📚 Documentation improvements
- 🧪 Tests and test coverage
- 🔍 Code reviews
- 💬 Community support

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0.0 or later
- Git
- Access to a Nutanix NDB environment for testing (optional but recommended)

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/ndb-mcp-server.git
   cd ndb-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your development environment**
   ```bash
   cp .env.example .env
   # Edit .env with your NDB test environment details
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Test your setup**
   ```bash
   npm start
   ```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-number
   ```

2. **Make your changes**
   - Write clear, concise code
   - Follow the existing code style
   - Add/update tests as needed
   - Update documentation

3. **Test your changes**
   ```bash
   npm run build
   npm start
   # Test with Claude Desktop if possible
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve issue description"
   ```

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

## 📝 Coding Standards

### TypeScript Style Guide

- Use TypeScript strict mode
- Follow existing naming conventions
- Add type annotations for public APIs
- Use meaningful variable and function names
- Keep functions focused and small

### Code Style
```typescript
// Good
interface NDBConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout?: number;
}

// Function with clear purpose
async function authenticateWithNDB(config: NDBConfig): Promise<string> {
  // Implementation
}

// Bad
interface Config {
  url: string;
  u: string;
  p: string;
  t?: number;
}
```

### Error Handling
- Always handle errors appropriately
- Provide meaningful error messages
- Use consistent error patterns
- Log errors with appropriate detail

```typescript
// Good
try {
  const result = await ndbClient.get('/databases');
  return result;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new McpError(ErrorCode.InternalError, `Failed to fetch databases: ${errorMessage}`);
}
```

### Documentation
- Document all public APIs
- Include usage examples for new features
- Update README.md for significant changes
- Add JSDoc comments for functions

```typescript
/**
 * Creates a new database clone from a snapshot
 * @param timeMachineId - ID of the source time machine
 * @param options - Clone configuration options
 * @returns Promise resolving to the clone creation task
 */
async function createClone(timeMachineId: string, options: CloneOptions): Promise<TaskInfo> {
  // Implementation
}
```

## 🧪 Testing

### Testing Guidelines
- Write tests for new features
- Ensure existing tests pass
- Test error conditions
- Include integration tests when possible

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
```typescript
describe('NDB Client', () => {
  describe('authentication', () => {
    it('should authenticate with valid credentials', async () => {
      // Test implementation
    });

    it('should handle authentication failures', async () => {
      // Test implementation
    });
  });
});
```

## 📚 Documentation

### Documentation Standards
- Write clear, concise documentation
- Include code examples
- Update all relevant docs for changes
- Use proper markdown formatting

### Documentation Types
- **API Reference**: Document all tools and their parameters
- **Usage Examples**: Show real-world usage scenarios
- **Troubleshooting**: Help users resolve common issues
- **Installation**: Keep setup instructions current

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Verify the bug in the latest version
3. Test with minimal reproduction case
4. Gather relevant information

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Configure with '...'
2. Run command '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g. macOS 12.0]
- Node.js version: [e.g. 18.15.0]
- NDB version: [e.g. 2.5.1]
- Server version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

## 💡 Feature Requests

### Before Requesting
1. Check existing feature requests
2. Consider if it fits the project scope
3. Think about implementation complexity
4. Consider backwards compatibility

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request.
```

## 🔍 Code Review Process

### For Contributors
- Ensure CI passes
- Respond to feedback promptly
- Keep PRs focused and small
- Write clear PR descriptions

### For Reviewers
- Be constructive and respectful
- Focus on code quality and maintainability
- Check for security implications
- Verify documentation updates

### PR Guidelines
- **Title**: Clear, descriptive title
- **Description**: Explain what and why
- **Breaking Changes**: Highlight any breaking changes
- **Testing**: Describe how it was tested
- **Documentation**: Note any doc updates needed

## 🏷️ Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(auth): add token refresh mechanism
fix(clone): resolve snapshot selection issue
docs(readme): update installation instructions
test(database): add integration tests for provisioning
```

## 🔒 Security

### Reporting Security Issues
Please report security vulnerabilities privately to [security@yourproject.com] rather than using public issues.

### Security Guidelines
- Never commit credentials or sensitive data
- Validate all user inputs
- Use secure communication protocols
- Follow security best practices for dependencies

## 📋 Release Process

### Versioning
We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Checklist
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release PR
4. Tag release after merge
5. Update GitHub release notes
6. Announce release

## 🌟 Recognition

### Contributors
All contributors are recognized in:
- GitHub contributors list
- Release notes
- Annual contributor highlights

### Hall of Fame
Outstanding contributors may be invited to:
- Maintainer team
- Special recognition in project
- Conference speaking opportunities

## 📞 Getting Help

### Community Support
- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Check our comprehensive docs first

### Maintainer Contact
- Create an issue for project-related questions
- Use discussions for general questions
- Email security@yourproject.com for security issues

## 📋 Contributor License Agreement

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

## Thank You! 🙏

Your contributions make this project better for everyone. Whether you're fixing a typo or adding a major feature, we appreciate your effort and involvement in the community.

Happy coding! 🚀