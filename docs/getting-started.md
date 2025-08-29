# Getting Started with Universal Claude Workflow

Welcome to Universal Claude Workflow (UCW) - the complete solution for enhancing your Claude Code experience across any project type.

## Quick Start

### Installation

```bash
# Install globally
npm install -g universal-claude-workflow

# Or run directly in your project
npx universal-claude-workflow@latest

# Short alias
npx ucw@latest
```

### Basic Setup

1. **Navigate to your project directory**
   ```bash
   cd your-project
   ```

2. **Initialize UCW**
   ```bash
   ucw init
   ```

3. **Start using Claude Code with enhanced capabilities**
   ```bash
   claude
   ```

## What Gets Installed

### Core Files
- **`CLAUDE.md`** - Project-specific AI context and guidelines
- **`.claude/settings.json`** - Claude Code configuration with UCW enhancements
- **`.claude/commands/`** - Custom slash commands directory
- **`.claude/agents/`** - AI sub-agents configuration
- **`.mcp.json`** - External service integrations

### Instant Capabilities
- 🤖 **AI Sub-Agents** - Specialized assistants for code review, testing, documentation
- ⚡ **Automation Hooks** - Pre/post-processing workflows
- 💻 **Custom Commands** - Slash commands for TDD/BDD workflows
- 🔌 **MCP Integrations** - Connect to databases, CI/CD, external services
- 📊 **Health Monitoring** - Project diagnostics and analytics

## First Steps

### 1. Project Health Check
After installation, verify everything is working:

```bash
ucw health
```

This command checks:
- Environment compatibility
- UCW configuration
- Claude Code integration
- Dependencies status
- Security setup

### 2. Explore Custom Commands
Try these powerful slash commands in Claude Code:

```bash
claude
# Then in Claude Code:
/tdd-cycle Add user login validation
/project-health
/bdd-scenario User authentication flow
```

### 3. Check Your CLAUDE.md
UCW automatically generates a `CLAUDE.md` file tailored to your project. Review and customize it:

```bash
cat CLAUDE.md
```

## Interactive Setup

For a guided setup experience:

```bash
ucw init --interactive
```

This will ask you about:
- **Development Focus** (TDD, BDD, Security, Performance)
- **AI Agents** to install
- **Automation Hooks** to enable
- **Custom Commands** to add
- **External Integrations** to configure

## Project Types Supported

UCW automatically detects and configures for:

| Framework | Language | Package Manager | Testing | Build System |
|-----------|----------|----------------|---------|--------------|
| React | JavaScript/TypeScript | npm/yarn/pnpm | Jest/Vitest | Vite/Webpack |
| Next.js | TypeScript | npm/yarn/pnpm | Jest/Vitest | Next.js |
| Vue | JavaScript/TypeScript | npm/yarn/pnpm | Vitest | Vite |
| Node.js | JavaScript/TypeScript | npm/yarn/pnpm | Jest/Mocha | Node |
| Python | Python | pip/poetry | pytest | setuptools |
| Go | Go | go mod | go test | go build |
| Rust | Rust | cargo | cargo test | cargo |

## Key Features

### 🤖 AI Sub-Agents
Specialized AI assistants that enhance Claude Code:

- **Code Reviewer** - Automated code review with best practices
- **Test Generator** - Comprehensive test suite generation
- **Documentation Agent** - Auto-generate and maintain docs
- **Security Auditor** - Vulnerability scanning and security analysis
- **Refactoring Assistant** - Code optimization suggestions
- **Performance Analyzer** - Performance insights and optimization

### ⚡ Automation Hooks
Smart automation that runs at key moments:

- **Pre-commit** - Validation before git commits
- **Post-tool** - Formatting after file changes
- **Test Trigger** - Automatic test execution
- **Build Validation** - Ensure builds succeed
- **Security Scan** - Regular vulnerability checks
- **Session Analytics** - Development session tracking

### 💻 Custom Commands
Powerful slash commands for development workflows:

- `/tdd-cycle` - Red-green-refactor TDD automation
- `/bdd-scenario` - Generate behavior-driven scenarios
- `/project-health` - Comprehensive diagnostics
- `/optimize-bundle` - Bundle analysis and optimization
- `/security-audit` - Security vulnerability scanning
- `/generate-docs` - Documentation generation

### 🔌 MCP Integrations
Connect Claude Code to external services:

- **Databases** - PostgreSQL, SQLite, MongoDB
- **Version Control** - Git, GitHub integration
- **CI/CD** - GitHub Actions, Jenkins
- **Monitoring** - Sentry, DataDog
- **Communication** - Slack, Discord
- **Cloud** - AWS, GCP, Azure

## Configuration Examples

### TDD-Focused Setup
```bash
ucw init --focus tdd --agents code-reviewer,test-generator --commands tdd-cycle
```

### Security-First Setup
```bash
ucw init --focus security --agents security-auditor --hooks security-scan
```

### Full-Stack Setup
```bash
ucw init --template nextjs-fullstack --mcp postgresql,github,sentry
```

## Usage Patterns

### Daily Development Workflow
1. Start Claude Code in your project: `claude`
2. Use `/project-health` to check project status
3. Develop with TDD: `/tdd-cycle <feature>`
4. Let hooks handle formatting and validation automatically
5. Check analytics: `ucw analytics --session`

### Code Review Process
1. The Code Reviewer agent automatically analyzes your changes
2. Get instant feedback on code quality and security
3. Receive suggestions for improvements
4. Track code quality metrics over time

### Testing Workflow
1. Use `/tdd-cycle` for test-driven development
2. Generate additional tests with Test Generator agent
3. Automatic test execution via hooks
4. Comprehensive test coverage reporting

## Troubleshooting

### Common Issues

**"Claude Code not found"**
```bash
npm install -g @anthropic-ai/claude-code
```

**"Permission errors"**
```bash
ucw init --skip-permissions
```

**"MCP servers not loading"**
```bash
claude --mcp-debug
```

**"Hooks not working"**
```bash
ucw health --verbose
```

### Getting Help

- **Health Check**: `ucw health` - Diagnose configuration issues
- **Component List**: `ucw add --help` - See available components
- **Update Check**: `ucw update --check-only` - Check for updates
- **Remove Setup**: `ucw remove --all` - Clean removal if needed

### Debug Mode
Enable detailed logging for troubleshooting:

```bash
DEBUG=ucw:* ucw init
```

## Next Steps

Once you have UCW set up:

1. **[Configuration Guide](configuration.md)** - Customize your setup
2. **[Commands Reference](commands.md)** - Master all slash commands
3. **[Agents Guide](agents.md)** - Work with AI sub-agents
4. **[Hooks Documentation](hooks.md)** - Set up automation
5. **[MCP Integration](mcp.md)** - Connect external services
6. **[Best Practices](best-practices.md)** - Optimize your workflow

## Support

- 📚 [Documentation](https://universal-claude-workflow.dev/docs)
- 💬 [Discord Community](https://discord.gg/ucw)
- 🐛 [Issue Tracker](https://github.com/universal-claude-workflow/universal-claude-workflow/issues)
- 📧 [Email Support](mailto:support@universal-claude-workflow.dev)

---

**Ready to supercharge your development workflow?** Start with `ucw init` and discover the power of AI-enhanced development!