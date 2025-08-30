# Universal Claude Workflow

🚀 A comprehensive, installable Claude Code workflow system that works across any project, combining modern development best practices (BDD/TDD), automation, and AI-enhanced workflows.

## Features

- 🎯 **One-Command Installation** - Works in any project type
- 🤖 **AI Sub-Agents** - Specialized agents for code review, testing, documentation
- 🔧 **Smart Hooks System** - Automated pre/post-processing workflows
- 📝 **Custom Commands** - Slash commands for TDD/BDD workflows
- 🔌 **MCP Integrations** - Connect to databases, CI/CD, and external services
- 📊 **Project Health Monitoring** - Comprehensive diagnostics and analytics
- 🎨 **Framework Agnostic** - Adapts to React, Node.js, Python, and more

## Quick Start

```bash
# Install globally
npm install -g universal-claude-workflow

# Or run directly in any project
npx universal-claude-workflow@latest

# Short alias
npx ucw@latest
```

## What Gets Installed

### Core Files
- `CLAUDE.md` - Project-specific AI context and guidelines
- `.claude/settings.json` - Claude Code configuration
- `.claude/commands/` - Custom slash commands
- `.mcp.json` - External service integrations

### Hooks System
- Pre-commit validation
- Code formatting automation
- Test execution triggers
- Build validation
- Security scanning
- Session resume primer (updates CLAUDE.md with a resume hint on session start)

### Sub-Agents
- **Code Reviewer** - Automated code review and feedback
- **Test Generator** - Comprehensive test suite generation
- **Documentation** - Auto-generate and maintain docs
- **Refactoring** - Code optimization and cleanup
- **Security** - Vulnerability assessment and fixes

### Custom Commands
- `/new-feature` - Multi-agent feature planning + execution
- `/resume-feature` - Resume in-progress feature from the next task

## Project Detection

Automatically detects and configures for:

| Framework | Package Manager | Build System | Testing |
|-----------|----------------|--------------|---------|
| React | npm/yarn/pnpm | Vite/Webpack | Jest/Vitest |
| Node.js | npm/yarn/pnpm | tsc/babel | Jest/Mocha |
| Python | pip/poetry | setuptools | pytest |
| Go | go mod | go build | go test |
| Rust | cargo | cargo | cargo test |

## Configuration

### Interactive Setup
```bash
ucw init --interactive
```

### Custom Configuration
```bash
ucw init --framework react --testing jest --hooks pre-commit,post-tool
```

### Framework-Specific Setup
```bash
ucw init --template react-typescript-tdd
ucw init --template node-express-bdd
ucw init --template python-fastapi-tdd
```

## Advanced Features

### BDD/TDD Workflows
- Automated test-first development cycles
- Behavior-driven scenario generation
- Continuous test execution
- Coverage reporting and optimization

### AI-Enhanced Development
- Context-aware code suggestions
- Automated refactoring recommendations
- Intelligent error detection and fixes
- Performance optimization suggestions

### Team Collaboration
- Shared workflow configurations
- Team-specific conventions
- Automated onboarding for new developers
- Consistent AI behavior across team members

## Commands

```bash
# Initialize workflow in current project
ucw init

# Add specific components
ucw add agent code-reviewer
ucw add command tdd-cycle
ucw add hook pre-commit
ucw add mcp postgresql

# Project health check
ucw health

# Analytics and monitoring
ucw analytics

# Update workflow
ucw update

# Remove workflow
ucw remove
```

## Examples

### React + TypeScript + TDD
```bash
cd my-react-app
npx ucw@latest
# Automatically detects React, sets up TypeScript support, Jest testing, and TDD workflows
```

### Node.js + Express + BDD
```bash
cd my-api
npx ucw@latest --template node-express-bdd
# Sets up BDD scenarios, API testing, and documentation generation
```

### Python + FastAPI + Security
```bash
cd my-python-api
npx ucw@latest --focus security
# Emphasizes security scanning, vulnerability detection, and secure coding practices
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📚 [Documentation](https://universal-claude-workflow.dev/docs)
- 💬 [Discord Community](https://discord.gg/ucw)
- 🐛 [Issue Tracker](https://github.com/universal-claude-workflow/universal-claude-workflow/issues)
- 📧 [Email Support](mailto:support@universal-claude-workflow.dev)
