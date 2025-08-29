# Contributing to Universal Claude Workflow

Thank you for your interest in contributing to Universal Claude Workflow! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@universal-claude-workflow.dev](mailto:conduct@universal-claude-workflow.dev).

## Getting Started

### Types of Contributions

We welcome several types of contributions:

- 🐛 **Bug Reports**: Report issues and bugs
- ✨ **Feature Requests**: Suggest new features or improvements
- 🛠️ **Bug Fixes**: Submit fixes for reported issues
- 📈 **New Features**: Implement new functionality
- 📝 **Documentation**: Improve or add documentation
- 🎨 **Templates**: Add new project templates
- 🤖 **Agents**: Create new AI agents
- 💻 **Commands**: Add custom slash commands
- 🔌 **MCP Servers**: Integrate new external services

### Before You Start

1. **Check existing issues**: Look for existing issues or discussions
2. **Create an issue**: For significant changes, create an issue to discuss the approach
3. **Fork the repository**: Create a fork for your contributions
4. **Read the documentation**: Familiarize yourself with the project structure

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git
- Claude Code CLI

### Installation

1. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/universal-claude-workflow.git
   cd universal-claude-workflow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install Claude Code** (if not already installed):
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

### Project Structure

```
universal-claude-workflow/
├── bin/                    # CLI entry point
├── src/                    # Source code
│   ├── installer.js        # Main installation logic
│   ├── project-detector.js # Project type detection
│   ├── template-engine.js  # CLAUDE.md generation
│   ├── hooks-manager.js    # Automation hooks
│   ├── commands-manager.js # Custom commands
│   ├── agents-manager.js   # AI agents
│   ├── mcp-manager.js      # MCP integrations
│   ├── health.js           # Health checking
│   ├── analytics.js        # Usage analytics
│   ├── updater.js          # Update management
│   └── utils/              # Utility functions
├── tests/                  # Test files
├── docs/                   # Documentation
├── templates/              # Project templates
│   └── claude/             # CLAUDE.md templates
└── examples/               # Usage examples
```

## Contributing Process

### 1. Issue Creation

For new features or significant changes:

1. **Search existing issues**: Check if the issue already exists
2. **Create a new issue**: Use the appropriate issue template
3. **Provide details**: Include use cases, mockups, or examples
4. **Discussion**: Engage in discussion to refine the approach

### 2. Development Workflow

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number
   ```

2. **Make changes**: Implement your feature or fix
3. **Add tests**: Write tests for your changes
4. **Update documentation**: Update relevant documentation
5. **Test thoroughly**: Run all tests and manual testing

### 3. Pull Request Process

1. **Push your branch**:
   ```bash
   git push origin your-branch-name
   ```

2. **Create Pull Request**: Use the PR template
3. **Description**: Provide a clear description of changes
4. **Link issues**: Reference related issues
5. **Request review**: Wait for maintainer review

### 4. Review Process

- **Automated checks**: Ensure CI passes
- **Code review**: Address reviewer feedback
- **Testing**: Verify functionality works as expected
- **Documentation**: Ensure docs are updated
- **Approval**: Get approval from maintainers

## Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Coding Standards

- **ES6+ Features**: Use modern JavaScript features
- **Async/Await**: Prefer async/await over promises
- **Error Handling**: Always handle errors appropriately
- **Comments**: Add comments for complex logic
- **Constants**: Use constants for magic numbers and strings

### Example Code Style

```javascript
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class ExampleManager {
  constructor(options = {}) {
    this.options = {
      timeout: 30000,
      retries: 3,
      ...options
    };
  }

  async processFile(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await fs.readFile(filePath, 'utf8');
      return this.processContent(content);
    } catch (error) {
      console.error(chalk.red(`Error processing file: ${error.message}`));
      throw error;
    }
  }

  processContent(content) {
    // Implementation details
    return content.trim();
  }
}

module.exports = ExampleManager;
```

### Git Commit Messages

Follow conventional commit format:

```
type(scope): description

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tool changes

**Examples**:
```
feat(installer): add Python project detection
fix(hooks): resolve pre-commit hook execution issue
docs(readme): update installation instructions
test(detector): add unit tests for Go project detection
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/installer.test.js

# Run tests in watch mode
npm run test:watch
```

### Test Structure

Follow this test structure:

```javascript
const { jest } = require('@jest/globals');
const ExampleManager = require('../src/example-manager');

// Mock external dependencies
jest.mock('fs-extra');

describe('ExampleManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processFile', () => {
    test('should process file successfully', async () => {
      // Arrange
      const manager = new ExampleManager();
      const mockContent = 'test content';
      
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(mockContent);

      // Act
      const result = await manager.processFile('/test/file.txt');

      // Assert
      expect(result).toBe('test content');
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
    });

    test('should handle file not found error', async () => {
      // Arrange
      const manager = new ExampleManager();
      fs.pathExists.mockResolvedValue(false);

      // Act & Assert
      await expect(manager.processFile('/nonexistent/file.txt'))
        .rejects.toThrow('File not found');
    });
  });
});
```

### Test Coverage Requirements

- Minimum 80% code coverage
- All public methods must be tested
- Error cases must be tested
- Integration tests for major workflows

## Documentation

### Documentation Requirements

- **README updates**: Update if functionality changes
- **API documentation**: Document all public methods
- **Configuration docs**: Document new configuration options
- **Examples**: Provide usage examples
- **Migration guides**: For breaking changes

### Documentation Style

- **Clear and concise**: Write for developers of all skill levels
- **Code examples**: Include practical examples
- **Step-by-step**: Break down complex procedures
- **Screenshots**: Use screenshots for UI-related features

### Adding Documentation

1. **Update existing docs**: Modify relevant existing documentation
2. **Create new docs**: Add new documentation files as needed
3. **Link documentation**: Update navigation and links
4. **Test examples**: Verify all code examples work

## Specific Contribution Types

### Adding New Project Templates

1. **Create template file**:
   ```bash
   touch templates/claude/your-framework.md
   ```

2. **Define template content**:
   ```markdown
   # {{PROJECT_NAME}} - Your Framework

   ## Project Overview
   Framework-specific project description.

   ## Development Guidelines
   - Framework-specific guidelines
   - Best practices
   
   ## Important Commands
   - Framework-specific commands
   ```

3. **Update template engine**:
   ```javascript
   // In src/template-engine.js
   const templateMap = {
     'your-framework': 'your-framework.md',
     // ... existing templates
   };
   ```

4. **Add tests**:
   ```javascript
   test('should generate template for your-framework', async () => {
     // Test implementation
   });
   ```

### Creating New AI Agents

1. **Define agent role**:
   ```markdown
   # Your Agent Name

   ## Role
   Specialized assistant for [specific domain].

   ## Expertise
   - Domain knowledge
   - Specific skills
   - Tools and technologies

   ## Guidelines
   - How to behave
   - What to focus on
   - Response style
   ```

2. **Update agents manager**:
   ```javascript
   // In src/agents-manager.js
   getYourAgentConfig(config) {
     return `# Your Agent configuration content`;
   }
   ```

3. **Add to available agents list**:
   ```javascript
   async listAvailableAgents() {
     return [
       // ... existing agents
       {
         name: 'your-agent',
         description: 'Your agent description',
         capabilities: ['capability1', 'capability2']
       }
     ];
   }
   ```

### Adding Custom Commands

1. **Create command template**:
   ```markdown
   # Your Command

   Description of what the command does.

   ## Usage
   `/your-command <arguments>`

   ## Process
   1. Step one
   2. Step two
   3. Step three

   ## Examples
   `/your-command example usage`
   ```

2. **Update commands manager**:
   ```javascript
   // In src/commands-manager.js
   getYourCommandContent(config) {
     return 'Command template content';
   }
   ```

### Adding MCP Server Support

1. **Define server configuration**:
   ```javascript
   // In src/mcp-manager.js
   async addYourServerConfig(mcpConfig, config) {
     mcpConfig.mcpServers.yourServer = {
       command: 'your-mcp-server',
       args: ['--option', 'value'],
       env: {
         YOUR_ENV_VAR: '${YOUR_ENV_VAR}'
       }
     };
   }
   ```

2. **Add to available servers**:
   ```javascript
   async getAvailableServers() {
     return [
       // ... existing servers
       {
         key: 'your-server',
         name: 'Your Server Name',
         description: 'Server description',
         recommended: false
       }
     ];
   }
   ```

## Release Process

### Version Management

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update version**: `npm version [major|minor|patch]`
2. **Update changelog**: Document changes
3. **Create release branch**: `git checkout -b release/vX.Y.Z`
4. **Final testing**: Comprehensive testing
5. **Create pull request**: For release branch
6. **Tag release**: After merge to main
7. **Publish to npm**: `npm publish`

### Pre-release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Examples tested
- [ ] Breaking changes documented
- [ ] Migration guide created (if needed)

## Getting Help

- **Discord**: [Join our Discord community](https://discord.gg/ucw)
- **Discussions**: [GitHub Discussions](https://github.com/universal-claude-workflow/universal-claude-workflow/discussions)
- **Issues**: [GitHub Issues](https://github.com/universal-claude-workflow/universal-claude-workflow/issues)
- **Email**: [contribute@universal-claude-workflow.dev](mailto:contribute@universal-claude-workflow.dev)

## Recognition

Contributors are recognized in:
- **README**: Contributors section
- **Changelog**: Release notes
- **Documentation**: Author attribution
- **Discord**: Contributor role

Thank you for contributing to Universal Claude Workflow! Your contributions help make AI-enhanced development accessible to developers worldwide.