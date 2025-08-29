# Best Practices Guide

This guide outlines proven best practices for getting the most out of Universal Claude Workflow in your development projects.

## Project Setup Best Practices

### 1. Start with Project Detection

Always let UCW detect your project before customizing:

```bash
# ✅ Good: Let UCW detect your project
cd your-project
ucw init

# ❌ Avoid: Forcing wrong framework
ucw init --framework react  # when you have a Python project
```

**Why**: Automatic detection ensures optimal configuration for your specific stack.

### 2. Use Interactive Setup for New Projects

For new projects or major configuration changes:

```bash
ucw init --interactive
```

**Benefits**:
- Guided setup process
- Explains each option
- Prevents configuration mistakes
- Discovers relevant integrations

### 3. Hierarchical CLAUDE.md Files

Use multiple CLAUDE.md files for complex projects:

```
project-root/
├── CLAUDE.md                    # General project info
├── frontend/
│   └── CLAUDE.md               # Frontend-specific guidelines
├── backend/
│   └── CLAUDE.md               # Backend-specific guidelines
└── infrastructure/
    └── CLAUDE.md               # Infrastructure guidelines
```

**Benefits**:
- Context-specific guidance
- Cleaner organization
- Better AI understanding

## Development Workflow Best Practices

### 1. Start Every Session with Health Check

```bash
# Before starting development
ucw health

# Start Claude Code
claude
```

**Why**: Catches configuration drift and ensures all systems are operational.

### 2. Use Focus-Driven Development

Align UCW configuration with your current development phase:

```bash
# During feature development
ucw init --focus tdd

# During security review phase  
ucw init --focus security

# During performance optimization
ucw init --focus performance
```

### 3. Leverage TDD Workflow

Use the TDD cycle command for systematic development:

```bash
claude
# In Claude Code:
/tdd-cycle Implement user authentication validation

# Follow the red-green-refactor cycle automatically
```

**Best Practice Pattern**:
1. Start with `/tdd-cycle <feature>`
2. Let Claude guide you through red-green-refactor
3. Use hooks for automatic formatting and validation
4. Run `/project-health` periodically

### 4. Regular Health Monitoring

Incorporate health checks into your routine:

```bash
# Weekly health check with detailed report
ucw health --verbose

# Before major releases
ucw health --fix

# Track trends
ucw analytics --history
```

## AI Agent Best Practices

### 1. Agent Selection Strategy

Choose agents based on project phase and team needs:

**Early Development**:
```bash
ucw add agent code-reviewer
ucw add agent test-generator
```

**Pre-Production**:
```bash
ucw add agent security-auditor
ucw add agent performance-analyzer
ucw add agent documentation
```

**Maintenance Phase**:
```bash
ucw add agent refactoring
ucw add agent documentation
ucw add agent security-auditor
```

### 2. Agent Configuration

Customize agents for your specific needs:

```markdown
# In .claude/agents/code-reviewer.md

## Code Review Focus
- Security vulnerabilities (HIGH priority)
- Performance implications (MEDIUM priority)
- Code style consistency (LOW priority)

## Project-Specific Rules
- All API endpoints must have input validation
- Database queries must use parameterized statements
- React components must have PropTypes or TypeScript interfaces

## Skip Patterns
- Skip review for test files under 10 lines
- Skip style checks for generated code
```

### 3. Agent Interaction Patterns

**Effective Agent Usage**:
```bash
# ✅ Specific requests
"Review this authentication function for security vulnerabilities"

# ✅ Context-aware requests
"Generate tests for this React component following our testing conventions"

# ❌ Vague requests
"Look at this code"
```

## Hook Automation Best Practices

### 1. Layered Hook Strategy

Implement hooks in order of importance:

**Level 1: Essential**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {"type": "command", "command": "npm run format"}
        ]
      }
    ]
  }
}
```

**Level 2: Quality Gates**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "git commit",
        "hooks": [
          {"type": "command", "command": "npm run lint"},
          {"type": "command", "command": "npm test"}
        ]
      }
    ]
  }
}
```

**Level 3: Advanced Automation**
```json
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {"type": "command", "command": "npm run analyze"},
          {"type": "command", "command": "ucw analytics --log"}
        ]
      }
    ]
  }
}
```

### 2. Hook Performance

Keep hooks fast and reliable:

```json
{
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
  }
}
```

**Key Principles**:
- Use `|| true` for non-critical hooks
- Timeout long-running operations
- Parallelize independent operations
- Cache results when possible

### 3. Hook Error Handling

Implement graceful error handling:

```bash
#!/bin/bash
# .claude/scripts/safe-hook.sh

set -e
trap 'echo "Hook failed at line $LINENO"' ERR

# Your hook logic here
npm run lint 2>/dev/null || echo "Linting skipped due to errors"
```

## Custom Command Best Practices

### 1. Command Naming

Use clear, consistent naming:

```bash
# ✅ Good names
/tdd-cycle
/bdd-scenario
/security-audit
/project-health

# ❌ Avoid unclear names
/tc
/check
/do-stuff
```

### 2. Command Documentation

Document commands thoroughly:

```markdown
# TDD Cycle Command

Execute a complete Test-Driven Development cycle for the specified functionality.

## Usage
`/tdd-cycle <functionality description>`

## Arguments
- `functionality description`: Clear description of what to implement

## Examples
- `/tdd-cycle Add user email validation`
- `/tdd-cycle Implement shopping cart total calculation`

## Process
1. **Red Phase**: Write failing test
2. **Green Phase**: Implement minimal code to pass
3. **Refactor Phase**: Improve code quality

## Prerequisites
- Testing framework configured
- Test files structure in place
- Basic test utilities available
```

### 3. Command Composition

Create commands that work together:

```bash
# Workflow: Feature development
/tdd-cycle Implement feature
/security-audit
/project-health

# Workflow: Pre-release
/optimize-bundle
/security-audit
/generate-docs
```

## MCP Integration Best Practices

### 1. Gradual Integration

Add MCP servers incrementally:

**Phase 1: Core Services**
```bash
ucw add mcp filesystem
ucw add mcp git
```

**Phase 2: Development Services**
```bash
ucw add mcp postgresql  # or your database
ucw add mcp github
```

**Phase 3: Production Services**
```bash
ucw add mcp sentry
ucw add mcp slack
ucw add mcp aws
```

### 2. Environment Variable Management

Use secure environment variable practices:

```bash
# .env.example (commit this)
GITHUB_TOKEN=your_github_token_here
SENTRY_DSN=your_sentry_dsn_here
DATABASE_URL=postgresql://localhost:5432/devdb

# .env (never commit this)
GITHUB_TOKEN=actual_token_value
SENTRY_DSN=actual_dsn_value
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
```

### 3. MCP Testing

Test MCP integrations regularly:

```bash
# Test MCP connections
claude --mcp-debug

# Test specific server
ucw test mcp postgresql

# Monitor MCP health
ucw health --component mcp
```

## Team Collaboration Best Practices

### 1. Shared Configuration

Use version-controlled configuration:

```bash
# Commit to repository
git add .claude/settings.json
git add .claude/commands/
git add .claude/agents/
git add .mcp.json
git add CLAUDE.md

# Personal preferences only
echo ".claude/settings.local.json" >> .gitignore
```

### 2. Team Onboarding

Create team onboarding documentation:

```markdown
# Team UCW Setup

## Prerequisites
1. Install Node.js 18+
2. Install Claude Code: `npm install -g @anthropic-ai/claude-code`
3. Install UCW: `npm install -g universal-claude-workflow`

## Setup
1. Clone repository
2. Run `ucw init` (will use team configuration)
3. Set environment variables from team password manager
4. Run `ucw health` to verify setup

## Team Conventions
- Use `/tdd-cycle` for all feature development
- Run `/project-health` before pull requests
- Security focus: always run `/security-audit` for API changes
```

### 3. Configuration Standards

Establish team configuration standards:

```json
{
  "teamStandards": {
    "requiredAgents": ["code-reviewer", "test-generator"],
    "requiredHooks": ["pre-commit", "post-tool"],
    "requiredCommands": ["tdd-cycle", "project-health"],
    "codeStyle": {
      "formatter": "prettier",
      "linter": "eslint",
      "maxLineLength": 100
    }
  }
}
```

## Performance Best Practices

### 1. Optimize for Speed

Keep UCW operations fast:

```json
{
  "performance": {
    "skipLargeFiles": true,
    "maxFileSize": "1MB",
    "parallelHooks": true,
    "cacheResults": true
  }
}
```

### 2. Selective Processing

Use file filtering to improve performance:

```json
{
  "filters": {
    "ignorePatterns": [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".git/**",
      "*.log",
      "*.tmp"
    ],
    "processOnly": [
      "src/**",
      "tests/**",
      "*.js",
      "*.ts",
      "*.jsx",
      "*.tsx"
    ]
  }
}
```

### 3. Session Management

Optimize Claude Code sessions:

```bash
# ✅ Good: One task per session
claude  # Work on feature A
# Exit and restart
claude  # Work on feature B

# ❌ Avoid: Long sessions with context drift
claude  # Work on features A, B, C, D, E...
```

## Security Best Practices

### 1. Secure Configuration

Never commit secrets:

```bash
# ✅ Use environment variables
DATABASE_URL=${DATABASE_URL}
GITHUB_TOKEN=${GITHUB_TOKEN}

# ❌ Never commit secrets
DATABASE_URL=postgresql://user:password123@localhost/db
GITHUB_TOKEN=ghp_actualTokenValue
```

### 2. Regular Security Audits

Implement regular security checks:

```bash
# Daily: Dependency vulnerabilities
ucw add hook security-scan

# Weekly: Full security audit
/security-audit

# Before releases: Comprehensive check
/security-audit dependencies,code,configuration
```

### 3. Access Control

Limit MCP server permissions:

```json
{
  "mcpServers": {
    "filesystem": {
      "env": {
        "ALLOWED_DIRECTORIES": "./src:./tests",
        "READONLY_MODE": "true"
      }
    }
  }
}
```

## Maintenance Best Practices

### 1. Regular Updates

Keep everything up to date:

```bash
# Weekly: Check for updates
ucw update --check-only

# Monthly: Apply updates
ucw update

# After updates: Verify health
ucw health --verbose
```

### 2. Configuration Maintenance

Review and clean configuration regularly:

```bash
# Quarterly: Review configuration
ucw health --verbose
ucw analytics --export json

# Remove unused components
ucw remove command unused-command
ucw remove agent unused-agent
```

### 3. Performance Monitoring

Track performance over time:

```bash
# Track session analytics
ucw analytics --session

# Monitor trends
ucw analytics --history

# Export for analysis
ucw analytics --export csv
```

## Troubleshooting Best Practices

### 1. Systematic Diagnosis

Follow a systematic approach:

```bash
# Step 1: Health check
ucw health --verbose

# Step 2: Component-specific checks
ucw health --component hooks
ucw health --component agents
ucw health --component mcp

# Step 3: Debug mode
DEBUG=ucw:* claude --mcp-debug
```

### 2. Common Issue Resolution

**Permission Issues**:
```bash
ucw init --skip-permissions
```

**Hook Failures**:
```bash
# Test hooks individually
./.claude/scripts/test-hook.sh

# Simplify hooks temporarily
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {"type": "command", "command": "echo 'Hook working'"}
        ]
      }
    ]
  }
}
```

**MCP Connection Issues**:
```bash
# Test MCP servers
claude --mcp-debug

# Check environment variables
env | grep -E "(GITHUB|SENTRY|DATABASE)"
```

By following these best practices, you'll create a robust, efficient, and maintainable development workflow that scales with your project and team needs.