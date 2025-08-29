# Configuration Guide

This guide covers how to configure Universal Claude Workflow for your specific needs and project requirements.

## Configuration Files

UCW uses several configuration files to customize behavior:

### CLAUDE.md
The main configuration file that Claude Code reads for project context.

**Location**: `./CLAUDE.md`

**Purpose**:
- Provides project-specific context to Claude
- Defines coding standards and conventions
- Lists important commands and workflows
- Configures AI agent behavior

**Example Structure**:
```markdown
# My Project - Claude Configuration

## Project Overview
React application with TypeScript and Jest testing.

## Development Guidelines
- Use functional components with hooks
- Follow TDD practices
- Maintain >90% test coverage

## Important Commands
- Start dev: `npm run dev`
- Run tests: `npm test`
- Build: `npm run build`

## AI Agents
- Code Reviewer: Automated code review
- Test Generator: Generate comprehensive tests

## Focus: TDD
This project emphasizes test-driven development practices.
```

### .claude/settings.json
Claude Code configuration with UCW enhancements.

**Location**: `./.claude/settings.json`

**Example**:
```json
{
  "version": "1.0.0",
  "skipPermissions": false,
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $FILE || true"
          }
        ]
      }
    ]
  },
  "agents": ["code-reviewer", "test-generator"],
  "customCommands": ["tdd-cycle", "project-health"],
  "projectConfig": {
    "type": "node",
    "framework": "react",
    "language": "typescript",
    "focus": "tdd"
  }
}
```

### .mcp.json
MCP (Model Context Protocol) server configurations.

**Location**: `./.mcp.json`

**Example**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "/path/to/project"
      }
    },
    "git": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-git"],
      "env": {
        "GIT_REPOSITORY": "/path/to/project"
      }
    },
    "postgresql": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgresql"],
      "env": {
        "DATABASE_URL": "postgresql://localhost:5432/devdb"
      }
    }
  },
  "version": "0.1.0"
}
```

## Configuration Options

### Project Focus Areas

Set the primary development focus for your project:

```bash
# Test-Driven Development
ucw init --focus tdd

# Behavior-Driven Development
ucw init --focus bdd

# Security-First Development
ucw init --focus security

# Performance Optimization
ucw init --focus performance

# Documentation & Maintenance
ucw init --focus documentation

# General Development
ucw init --focus general
```

Each focus area customizes:
- CLAUDE.md content and guidelines
- Default AI agents selection
- Automation hooks configuration
- Custom commands availability

### AI Agents Configuration

Configure which AI agents are active:

```bash
# Add specific agents
ucw add agent code-reviewer
ucw add agent test-generator
ucw add agent security-auditor

# Configure in settings.json
{
  "agents": [
    "code-reviewer",
    "test-generator", 
    "documentation",
    "security-auditor",
    "refactoring",
    "performance-analyzer"
  ]
}
```

**Available Agents**:
- `code-reviewer` - Automated code review and feedback
- `test-generator` - Generate comprehensive test suites
- `documentation` - Auto-generate and maintain docs
- `security-auditor` - Vulnerability scanning and analysis
- `refactoring` - Code optimization suggestions
- `performance-analyzer` - Performance insights

### Hooks Configuration

Automation hooks run at specific events in your development workflow:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "git commit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint"
          },
          {
            "type": "command", 
            "command": "npm test"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $FILE || true"
          }
        ]
      }
    ]
  }
}
```

**Hook Events**:
- `PreToolUse` - Before Claude executes a tool
- `PostToolUse` - After a tool completes successfully
- `UserPromptSubmit` - When user submits a prompt
- `SessionStart` - When Claude Code session begins
- `SessionEnd` - When Claude Code session ends

**Hook Matchers**:
- `Edit` - File edit operations
- `Write` - File write operations
- `git commit` - Git commit operations
- `*` - All operations

### Custom Commands Configuration

Add custom slash commands for your workflow:

```bash
# Add individual commands
ucw add command tdd-cycle
ucw add command bdd-scenario
ucw add command security-audit

# Commands are stored in .claude/commands/
ls .claude/commands/
# tdd-cycle.md
# bdd-scenario.md
# security-audit.md
```

**Command Structure** (`.claude/commands/example.md`):
```markdown
# Example Command

Execute an example workflow with the provided arguments.

## Usage
`/example <description of what to do>`

## Process
1. Analyze the requirements in $ARGUMENTS
2. Perform the necessary operations
3. Provide detailed feedback
4. Suggest next steps

## Guidelines
- Follow project conventions
- Maintain code quality standards
- Include appropriate tests
```

### MCP Integrations

Configure external service integrations:

```bash
# Add MCP servers
ucw add mcp postgresql --database-url "postgresql://localhost:5432/mydb"
ucw add mcp github
ucw add mcp sentry --sentry-dsn "your-dsn"

# Configure environment variables
echo "GITHUB_TOKEN=your-token" >> .env
echo "SENTRY_DSN=your-dsn" >> .env
```

**Common MCP Servers**:
- `postgresql` - PostgreSQL database integration
- `sqlite` - SQLite database integration  
- `github` - GitHub repository integration
- `sentry` - Error monitoring integration
- `slack` - Team communication integration
- `aws` - AWS services integration
- `docker` - Container management integration

## Framework-Specific Configuration

### React/Next.js Projects

```bash
ucw init --framework react --testing jest --hooks post-tool,pre-commit
```

**Recommended Setup**:
- **Agents**: code-reviewer, test-generator
- **Commands**: tdd-cycle, optimize-bundle
- **Hooks**: post-tool (Prettier), pre-commit (linting)
- **MCP**: github, sentry (for production apps)

### Node.js API Projects

```bash
ucw init --framework express --testing jest --focus security
```

**Recommended Setup**:
- **Agents**: security-auditor, test-generator
- **Commands**: security-audit, generate-docs
- **Hooks**: pre-commit (security scan), test-trigger
- **MCP**: postgresql, github, sentry

### Python Projects

```bash
ucw init --framework fastapi --testing pytest --focus tdd
```

**Recommended Setup**:
- **Agents**: code-reviewer, test-generator
- **Commands**: tdd-cycle, security-audit
- **Hooks**: post-tool (Black formatting), pre-commit
- **MCP**: postgresql, github

### Go Projects

```bash
ucw init --framework gin --testing "go test" --focus performance
```

**Recommended Setup**:
- **Agents**: performance-analyzer, code-reviewer
- **Commands**: optimize-bundle, project-health
- **Hooks**: post-tool (go fmt), build-validation
- **MCP**: postgresql, github

### Rust Projects

```bash
ucw init --framework actix-web --testing "cargo test" --focus performance
```

**Recommended Setup**:
- **Agents**: performance-analyzer, security-auditor
- **Commands**: optimize-bundle, security-audit
- **Hooks**: post-tool (rustfmt), pre-commit (clippy)
- **MCP**: postgresql, github

## Environment-Specific Configuration

### Development Environment

```json
{
  "skipPermissions": false,
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {"type": "command", "command": "npm run format"},
          {"type": "command", "command": "npm run lint:fix"}
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {"type": "command", "command": "echo 'Development session started'"}
        ]
      }
    ]
  }
}
```

### CI/CD Environment

```json
{
  "skipPermissions": true,
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {"type": "command", "command": "npm run lint"},
          {"type": "command", "command": "npm test"},
          {"type": "command", "command": "npm run build"}
        ]
      }
    ]
  }
}
```

### Team Configuration

Use `.claude/settings.json` for team-shared configuration and `.claude/settings.local.json` for personal preferences:

**Team settings** (`.claude/settings.json`):
```json
{
  "projectConfig": {
    "type": "node",
    "framework": "react",
    "language": "typescript"
  },
  "agents": ["code-reviewer", "test-generator"],
  "customCommands": ["tdd-cycle", "project-health"]
}
```

**Personal settings** (`.claude/settings.local.json`):
```json
{
  "skipPermissions": true,
  "personalAgents": ["documentation"],
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {"type": "command", "command": "echo 'Personal cleanup done'"}
        ]
      }
    ]
  }
}
```

## Advanced Configuration

### Custom Agent Development

Create custom agents by adding markdown files to `.claude/agents/`:

```markdown
# My Custom Agent

## Role
You are a specialized assistant for [specific domain].

## Expertise
- Domain-specific knowledge
- Best practices for [technology]
- Integration patterns

## Guidelines
- Follow project conventions
- Provide actionable suggestions
- Include examples when helpful

## Tools
- Available development tools
- Testing frameworks
- Deployment systems
```

### Custom Hook Scripts

Create sophisticated hooks using shell scripts:

```bash
#!/bin/bash
# .claude/scripts/pre-commit-check.sh

set -e

echo "Running pre-commit checks..."

# Run linting
npm run lint

# Run tests
npm test

# Check for security vulnerabilities
npm audit --audit-level=high

# Check for uncommitted changes in package-lock.json
if ! git diff --quiet package-lock.json; then
  echo "package-lock.json has uncommitted changes"
  exit 1
fi

echo "All checks passed!"
```

**Hook Configuration**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "git commit",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/scripts/pre-commit-check.sh"
          }
        ]
      }
    ]
  }
}
```

### Performance Optimization

Optimize UCW performance for large projects:

```json
{
  "performance": {
    "cacheEnabled": true,
    "cacheSize": "100MB",
    "parallelHooks": true,
    "skipLargeFiles": true,
    "maxFileSize": "1MB"
  },
  "filters": {
    "ignorePatterns": [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".git/**"
    ]
  }
}
```

## Validation and Testing

### Configuration Validation

Validate your configuration:

```bash
# Check overall health
ucw health

# Validate specific components
ucw health --component hooks
ucw health --component agents
ucw health --component mcp
```

### Test Configuration

Test your hooks and agents:

```bash
# Test hooks manually
claude --test-hooks

# Test MCP connections
claude --mcp-debug

# Simulate agent interactions
claude --agent-debug
```

## Migration and Updates

### Updating Configuration

When updating UCW, migrate your configuration:

```bash
# Backup current configuration
ucw backup

# Update UCW
ucw update

# Migrate configuration if needed
ucw migrate --from 1.0.0 --to 2.0.0
```

### Configuration Backup

Regular backups of your configuration:

```bash
# Create backup
ucw backup --include-settings --include-agents --include-commands

# Restore from backup
ucw restore --from ucw-backup-2024-01-15.tar.gz
```

This comprehensive configuration system allows you to tailor UCW to your exact development needs while maintaining consistency across team members and projects.