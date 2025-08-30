const fs = require('fs-extra');
const path = require('path');

class CommandsManager {
  async install(commands, config) {
    if (!commands || commands.length === 0) return;

    const claudeDir = path.join(process.cwd(), '.claude');
    const commandsDir = path.join(claudeDir, 'commands');
    await fs.ensureDir(commandsDir);

    for (const commandName of commands) {
      const commandContent = await this.getCommandContent(commandName, config);
      if (commandContent) {
        const commandPath = path.join(commandsDir, `${commandName}.md`);
        await fs.writeFile(commandPath, commandContent);
      }
    }
  }

  async getCommandContent(commandName, config) {
    switch (commandName) {
      case 'tdd-cycle':
        return this.getTddCycleCommand(config);
      case 'bdd-scenario':
        return this.getBddScenarioCommand(config);
      case 'project-health':
        return this.getProjectHealthCommand(config);
      case 'optimize-bundle':
        return this.getOptimizeBundleCommand(config);
      case 'security-audit':
        return this.getSecurityAuditCommand(config);
      case 'generate-docs':
        return this.getGenerateDocsCommand(config);
      case 'new-feature':
        return this.getNewFeatureCommand(config);
      case 'resume-feature':
        return this.getResumeFeatureCommand(config);
      default:
        console.warn(`Unknown command: ${commandName}`);
        return null;
    }
  }

  getNewFeatureCommand(config) {
    const projectType = config.framework || config.language || 'project';
    const testCommand = this.getTestCommand(config);
    const lintCommand = this.getLintCommand(config);

    return `# 🚀 New Feature Orchestrator

Run an end-to-end, multi-agent feature workflow with planning, research, Agent‑OS style tasks, gated execution, and persistent context logging for ${projectType}.

Usage:
/new-feature "<short feature name>" — optional description in $ARGUMENTS

Goals:
- Gather rich project context and external references
- Plan implementation as small, verifiable subtasks
- Confirm plan with the user before any code edits
- Track progress in persistent .ucw files with checklists
- Produce artifacts so future sessions can resume with full context

Core Phases:
1) Context Agent — Project context collection
2) Research Agent — Web/doc search for up-to-date info
3) Planner Agent — Plan + tasks spec with acceptance criteria
4) Executor/Tracker — Gated execution with checklists and logs

Required/Optional Tools:
- MCP: filesystem (required), git (recommended)
- MCP: web/browser/search (optional). If configured, use it for official docs, RFCs, changelogs.

File Conventions (create if missing):
- .ucw/features/index.json — catalog of features and statuses
- .ucw/features/<slug>/plan.md — high‑level plan (checkboxes)
- .ucw/features/<slug>/tasks.md — numbered parent tasks with decimal subtasks (Agent‑OS style)
- .ucw/features/<slug>/research.md — links and research notes
- .ucw/features/<slug>/context.md — project context summary for this feature
- .ucw/features/<slug>/mission-lite.md — 1–3 sentence mission for compact context
- .ucw/sessions/<slug>-<ISO>.md — per‑session activity log

Slug Rules:
- slug = lowercased feature name with dashes. Example: "Add OAuth Login" → add-oauth-login

Step-by-Step Protocol

Phase 0 — Intake
1. Ask the user to provide/confirm: name, goal, scope, constraints, success criteria. Do not modify code.
2. Generate slug and feature directory: .ucw/features/<slug>/
3. Initialize index entry in .ucw/features/index.json with status: planning

Phase 1 — Context Agent
1. Summarize local project context: framework, language, testing, build, key entry points, relevant modules. Prefer reading: README.md, CLAUDE.md, package.json, src/**. Keep concise.
2. Create mission-lite: .ucw/features/<slug>/mission-lite.md with a short pitch (problem, users, value).
3. Write .ucw/features/<slug>/context.md with the summary and links to files.

Phase 2 — Research Agent (web/doc search)
1. If an MCP web/search/browser server is available, search for up-to-date official docs, breaking changes, best practices, and security notes relevant to the feature.
2. Capture links and snippets with citations in .ucw/features/<slug>/research.md.
3. If no web server is configured, ask the user to provide links or skip with a note.

Phase 3 — Planner Agent
1. Propose a high-level plan in .ucw/features/<slug>/plan.md with:
   - Title and feature description
   - Assumptions and non-goals
   - Checklists grouped by phases: design, implementation, tests, docs, rollout
   - For each task: owner (optional), acceptance criteria, estimated impact
   - Validation commands: lint (\`${lintCommand}\`), tests (\`${testCommand}\`), build
2. Present the plan to the user and request explicit confirmation to proceed. Do not edit source files until confirmed.

Phase 3.1 — Tasks Spec (Agent‑OS style)
1. Create .ucw/features/<slug>/tasks.md using this structure:
   - Parent tasks: 1–5 items, each a top‑level checklist (e.g., "- [ ] 1. Implement OAuth login")
   - Subtasks: up to ~8 per parent task using decimal notation (1.1, 1.2, ...)
   - First subtask is typically “Write tests for [component/feature]”
   - Final subtask is “Verify all tests pass”
2. Ask for review/approval of tasks.md before execution.

Phase 4 — Executor/Tracker (Gated)
1. For each parent task in tasks.md:
   - Confirm with user to proceed on this parent task.
   - Execute subtasks in order (tests first, implementation, verification last).
   - Run focused tests for this parent task during the loop; mark subtasks as [x].
   - Update plan.md if applicable; keep notes concise.
   - Append a brief log entry to .ucw/sessions/<slug>-<ISO>.md.
2. After completing assigned parent tasks, run full-suite validations (lint/tests/build) as a post‑flight step.
3. Pause after each parent task and ask whether to continue to the next one.

Phase 5 — Wrap-up
1. Update .ucw/features/index.json: status completed or in‑progress with lastUpdated timestamp.
2. Add a "Where to resume" section to plan.md indicating next steps.
3. Optionally add a link to this feature in CLAUDE.md under a "Feature Work Index" section.

Quality Gates
- Keep diffs small and focused; prefer separate commits per subtask.
- Ensure tests exist for meaningful behavior; avoid testing implementation details.
- Do not introduce breaking changes without user sign-off.

MCP/Web Research Guidelines
- Prioritize official docs, RFCs, vendor blogs; capture URLs and short annotations.
- Note any version-specific caveats that apply to this project.

Resumption Protocol (next session)
1. Read .ucw/features/index.json for in‑progress features.
2. Prefer resuming from .ucw/features/<slug>/tasks.md: select the first parent task with an unchecked item, else fall back to plan.md.
3. Review mission-lite.md, context.md, and research.md to refresh memory.
4. Continue the gated Executor/Tracker loop.

Example
\`\`\`bash
/new-feature "Add OAuth login with PKCE"
\`\`\`
Then follow the protocol above, producing the .ucw feature folder and gated execution.
`;
  }

  getResumeFeatureCommand(config) {
    return `# 🔁 Resume Feature

Quickly resume in-progress feature work by reloading context and continuing from the next unchecked task.

Usage
- \`/resume-feature\` — Resume the most recent in-progress feature
- \`/resume-feature <slug>\` — Resume a specific feature by slug

Where UCW stores state
- \`.ucw/features/index.json\` — Feature catalog with status and timestamps
- \`.ucw/features/<slug>/plan.md\` — High‑level plan checklist
- \`.ucw/features/<slug>/tasks.md\` — Numbered parent tasks with decimal subtasks
- \`.ucw/features/<slug>/context.md\` — Local project context summary
- \`.ucw/features/<slug>/research.md\` — Links + citations for reference
- \`.ucw/sessions/<slug>-<ISO>.md\` — Append-only session log

Resume Protocol
1) Identify target feature:
   - If an argument is provided, use it as the slug.
   - Else, read index.json for status=\"in-progress\" and pick the most recently updated.
   - If index.json is missing, scan \`.ucw/features/*\` for the latest folder with a \`plan.md\`.
2) Load context:
   - Prefer \`tasks.md\`: find the first parent with an unchecked item; then its next unchecked subtask if present.
   - Else, fall back to \`plan.md\` and find the first unchecked checklist item.
   - Read \`mission-lite.md\` (if present), \`context.md\`, and \`research.md\` to refresh.
3) Confirm next step:
   - Propose the next unchecked task with acceptance criteria and ask for confirmation before edits.
4) Execute with gates:
   - Implement minimal changes to satisfy the task; run lint/tests/build; mark task as done; append session log; ask to continue.

Tips
- If multiple features are in progress, the command should list them and ask which to resume.
- If no features found, instruct how to start with \`/new-feature\`.
 - Keep context compact by quoting only relevant snippets from standards/docs.

This command assumes the filesystem MCP is available so Claude can read \`.ucw/*\` files during the session.`;
  }

  getTddCycleCommand(config) {
    const testCommand = this.getTestCommand(config);
    const projectType = config.framework || config.language || 'generic';
    
    return `# 🧪 TDD Cycle Command - Enhanced for ${projectType}

Execute a complete Test-Driven Development cycle with intelligent Claude Code assistance:

## 🔴 RED PHASE: Write a failing test
1. **Analyze Requirements**: Break down the feature described in $ARGUMENTS
2. **Design Test Cases**: Consider edge cases and expected behaviors
3. **Write Failing Test**: Create a test that captures the intended functionality
   - Use descriptive test names that explain behavior
   - Follow ${this.getTestingConventions(config)} conventions
   - Ensure the test fails for the right reason

## 🟢 GREEN PHASE: Make it pass with minimal code
1. **Implement Minimally**: Write just enough code to make the test pass
2. **Avoid Over-Engineering**: Don't add features not covered by tests
3. **Focus on Functionality**: Make it work, don't make it perfect yet

## 🔵 REFACTOR PHASE: Improve while keeping tests green
1. **Clean Up Code**: Improve readability and structure
2. **Remove Duplication**: Apply DRY principles
3. **Optimize Performance**: Only if needed and measurable
4. **Update Documentation**: Keep inline comments current

## 💡 Usage Examples
\`\`\`bash
# Basic feature implementation
/tdd-cycle "implement user login validation"

# API endpoint development  
/tdd-cycle "create POST /api/users endpoint with validation"

# Complex business logic
/tdd-cycle "calculate shipping costs based on weight and distance"
\`\`\`

## 🛠 Project-Specific Configuration
- **Test Runner**: \`${testCommand}\`
- **Test Framework**: ${config.testingFramework || 'Not configured - recommend Jest/Vitest'}
- **Coverage Target**: 80%+ for new code
- **Test Location**: ${this.getTestPath(config)}

## 🎯 Quality Gates
Before moving to next phase, ensure:
- ✅ Test is meaningful and tests behavior, not implementation
- ✅ Test fails for the expected reason (RED)
- ✅ Implementation makes test pass without breaking others (GREEN)  
- ✅ Code is clean, readable, and follows project conventions (REFACTOR)

## 🔄 Automation Integration
- **Pre-commit Hook**: Runs tests automatically
- **CI/CD Pipeline**: Validates TDD cycle in pull requests
- **Coverage Reporting**: Tracks test coverage improvements

*Enhanced TDD workflow powered by Universal Claude Workflow*`;
  }

  getBddScenarioCommand(config) {
    return `# BDD Scenario Generator

Generate Behavior-Driven Development scenarios in Gherkin format for the feature described in $ARGUMENTS.

## Process
1. **Feature Definition**: Define the high-level feature
2. **Scenario Creation**: Create specific scenarios with Given-When-Then
3. **Step Implementation**: Prepare step definitions
4. **Example Data**: Include realistic test data

## Template
\`\`\`gherkin
Feature: [Feature Name]
  As a [user role]
  I want to [functionality]
  So that [business value]

  Scenario: [Scenario Name]
    Given [initial context]
    And [additional context]
    When [action is performed]
    And [additional action]
    Then [expected outcome]
    And [additional outcome]

  Scenario Outline: [Scenario with examples]
    Given [context with <parameter>]
    When [action with <parameter>]
    Then [outcome with <parameter>]

    Examples:
      | parameter | expected_result |
      | value1    | result1        |
      | value2    | result2        |
\`\`\`

## Usage
\`/bdd-scenario User login with different credentials\`

## Focus Areas
- User behavior and business value
- Clear acceptance criteria
- Edge cases and error scenarios
- Realistic test data
- Maintainable scenario structure

## Best Practices
- Use business language, not technical jargon
- Keep scenarios independent
- Focus on one behavior per scenario
- Include both positive and negative test cases
`;
  }

  getProjectHealthCommand(config) {
    const testCommand = this.getTestCommand(config);
    const lintCommand = this.getLintCommand(config);
    const buildCommand = this.getBuildCommand(config);
    
    return `# Project Health Check

Perform comprehensive diagnostics on the project to identify issues and optimization opportunities.

## Health Check Areas

### 1. Code Quality
- Run linting: \`${lintCommand}\`
- Check code formatting
- Analyze complexity metrics
- Review code patterns and best practices

### 2. Testing
- Run test suite: \`${testCommand}\`
- Check test coverage
- Identify missing tests
- Review test quality and structure

### 3. Build System
- Verify build process: \`${buildCommand}\`
- Check build performance
- Analyze bundle size (if applicable)
- Review build configuration

### 4. Dependencies
- Check for outdated packages
- Identify security vulnerabilities
- Review dependency tree
- Find unused dependencies

### 5. Performance
- Bundle size analysis
- Asset optimization
- Code splitting opportunities
- Performance bottlenecks

### 6. Security
- Vulnerability scanning
- Security best practices review
- Secrets detection
- Access control analysis

### 7. Documentation
- README completeness
- Code comments quality
- API documentation
- Setup instructions

## Usage
\`/project-health\`

## Output Format
- ✅ **Passing**: Areas working well
- ⚠️  **Warnings**: Issues that should be addressed
- ❌ **Errors**: Critical problems requiring immediate attention
- 💡 **Suggestions**: Optimization opportunities

## Actions
After running the health check:
1. Fix critical errors first
2. Address warnings
3. Implement suggested optimizations
4. Update documentation as needed
5. Re-run health check to verify fixes
`;
  }

  getOptimizeBundleCommand(config) {
    if (config.language !== 'javascript' && config.language !== 'typescript') {
      return this.getGenericOptimizeCommand(config);
    }

    return `# Bundle Optimization

Analyze and optimize the project bundle size and performance.

## Analysis Areas

### 1. Bundle Size Analysis
- Analyze bundle composition
- Identify large dependencies
- Find duplicate code
- Review asset sizes

### 2. Code Splitting
- Implement route-based splitting
- Optimize component lazy loading
- Review dynamic imports
- Split vendor bundles

### 3. Asset Optimization
- Image compression and formats
- CSS optimization
- Font loading strategy
- Static asset caching

### 4. Dependency Management
- Remove unused dependencies
- Replace heavy libraries with lighter alternatives
- Review polyfills necessity
- Optimize tree shaking

## Tools Integration
${config.buildSystem === 'webpack' ? '- webpack-bundle-analyzer' : ''}
${config.buildSystem === 'vite' ? '- vite-bundle-analyzer' : ''}
${config.buildSystem === 'rollup' ? '- rollup-plugin-analyzer' : ''}

## Commands
\`\`\`bash
# Analyze bundle
${config.packageManager || 'npm'} run build -- --analyze

# Size limit check
${config.packageManager || 'npm'} run size-limit

# Performance audit
lighthouse --only-categories=performance --chrome-flags="--headless" http://localhost:3000
\`\`\`

## Usage
\`/optimize-bundle\`

## Optimization Targets
- Bundle size < 250KB (gzipped)
- First Contentful Paint < 2s
- Time to Interactive < 5s
- Cumulative Layout Shift < 0.1

## Steps
1. Generate bundle analysis report
2. Identify optimization opportunities
3. Implement optimizations
4. Measure performance impact
5. Document changes
`;
  }

  getGenericOptimizeCommand(config) {
    return `# Performance Optimization

Analyze and optimize project performance for ${config.language} applications.

## Analysis Areas

### 1. Code Performance
- Algorithm efficiency
- Memory usage patterns
- CPU-intensive operations
- I/O optimization

### 2. Database Optimization (if applicable)
- Query performance
- Index optimization
- Connection pooling
- Caching strategies

### 3. Resource Management
- Memory leaks detection
- Resource cleanup
- Garbage collection optimization
- Connection management

## Usage
\`/optimize-bundle\`

## Tools
${config.language === 'python' ? '- cProfile for performance profiling' : ''}
${config.language === 'go' ? '- go tool pprof for profiling' : ''}
${config.language === 'rust' ? '- cargo flamegraph for performance analysis' : ''}
${config.language === 'java' ? '- JProfiler or similar tools' : ''}

## Steps
1. Profile application performance
2. Identify bottlenecks
3. Implement optimizations
4. Measure improvements
5. Document performance gains
`;
  }

  getSecurityAuditCommand(config) {
    return `# Security Audit

Comprehensive security analysis of the project to identify vulnerabilities and security best practices violations.

## Security Check Areas

### 1. Dependency Vulnerabilities
- Known security vulnerabilities in dependencies
- Outdated packages with security patches
- License compliance issues
- Supply chain security

### 2. Code Security Analysis
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Authentication and authorization
- Secrets detection

### 3. Configuration Security
- Environment variable security
- Database configuration
- API endpoint security
- CORS configuration

### 4. Infrastructure Security (if applicable)
- Container security
- Network security
- SSL/TLS configuration
- Access controls

## Tools
${config.language === 'javascript' || config.language === 'typescript' ? `
- npm audit for dependency vulnerabilities
- eslint-plugin-security for code analysis
- snyk for comprehensive scanning` : ''}
${config.language === 'python' ? `
- safety for dependency vulnerabilities
- bandit for code security analysis
- pip-audit for package vulnerabilities` : ''}
${config.language === 'rust' ? `
- cargo audit for dependency vulnerabilities
- cargo clippy for security linting` : ''}
${config.language === 'go' ? `
- gosec for security analysis
- go mod audit for vulnerabilities` : ''}

## Usage
\`/security-audit $ARGUMENTS\`

## Commands
\`\`\`bash
${this.getSecurityCommands(config)}
\`\`\`

## Security Checklist
- [ ] All dependencies are up to date
- [ ] No known vulnerabilities in dependencies  
- [ ] Input validation is implemented
- [ ] Authentication is secure
- [ ] Authorization checks are in place
- [ ] Sensitive data is encrypted
- [ ] Secrets are not hardcoded
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Error messages don't leak information

## Severity Levels
- 🔴 **Critical**: Immediate action required
- 🟡 **High**: Fix within 24 hours
- 🟠 **Medium**: Fix within 1 week
- 🟢 **Low**: Fix in next development cycle

## Response Plan
1. Identify and catalog all security issues
2. Prioritize by severity and impact
3. Create fix plan with timelines
4. Implement fixes
5. Test security improvements
6. Update security documentation
`;
  }

  getGenerateDocsCommand(config) {
    return `# Documentation Generator

Automatically generate comprehensive documentation for the project based on code analysis and best practices.

## Documentation Types

### 1. API Documentation
- Endpoint documentation
- Request/response schemas
- Authentication methods
- Error codes and handling

### 2. Code Documentation
- Function and class documentation
- Module overviews
- Architecture decisions
- Design patterns used

### 3. User Documentation
- Installation instructions
- Getting started guide
- Configuration options
- Usage examples

### 4. Developer Documentation
- Development setup
- Contributing guidelines
- Testing procedures
- Deployment process

## Generation Process
1. **Code Analysis**: Parse code for functions, classes, and modules
2. **Comment Extraction**: Extract existing documentation
3. **Schema Generation**: Generate API schemas and types
4. **Example Creation**: Create usage examples
5. **Format Output**: Generate in multiple formats (Markdown, HTML, etc.)

## Usage
\`/generate-docs $ARGUMENTS\`

## Supported Formats
- Markdown files
- HTML documentation sites
- OpenAPI/Swagger specs (for APIs)
- README files
- Wiki pages

## Tools Integration
${config.language === 'javascript' || config.language === 'typescript' ? '- JSDoc for code documentation\n- OpenAPI generators for API docs' : ''}
${config.language === 'python' ? '- Sphinx for comprehensive documentation\n- autodoc for automatic generation' : ''}
${config.language === 'go' ? '- godoc for package documentation\n- go doc for inline docs' : ''}
${config.language === 'rust' ? '- rustdoc for crate documentation\n- cargo doc for generation' : ''}

## Best Practices
- Keep documentation close to code
- Include practical examples
- Update docs with code changes
- Use consistent formatting
- Provide multiple complexity levels

## Output Structure
\`\`\`
docs/
├── README.md
├── api/
│   ├── endpoints.md
│   └── schemas.md
├── guides/
│   ├── getting-started.md
│   └── deployment.md
└── reference/
    ├── functions.md
    └── classes.md
\`\`\`
`;
  }

  getTestCommand(config) {
    switch (config.testingFramework) {
      case 'jest':
        return `${config.packageManager || 'npm'} test`;
      case 'vitest':
        return `${config.packageManager || 'npm'} run test`;
      case 'pytest':
        return 'pytest';
      case 'go test':
        return 'go test ./...';
      case 'cargo test':
        return 'cargo test';
      case 'phpunit':
        return 'vendor/bin/phpunit';
      default:
        return 'echo "No test command configured"';
    }
  }

  getTestingConventions(config) {
    const conventions = {
      'jest': 'Jest naming conventions (describe/it blocks)',
      'vitest': 'Vitest testing patterns with describe/test',
      'pytest': 'pytest naming (test_* functions)',
      'go test': 'Go testing conventions (Test* functions)',
      'cargo test': 'Rust testing with #[test] attribute',
      'phpunit': 'PHPUnit testing conventions'
    };

    return conventions[config.testingFramework] || 'standard testing conventions';
  }

  getTestPath(config) {
    const testPaths = {
      'jest': 'src/__tests__/ or *.test.js files',
      'vitest': 'src/**/*.{test,spec}.{js,ts}',
      'pytest': 'tests/ directory or test_*.py files',
      'go test': '*_test.go files alongside source',
      'cargo test': 'src/lib.rs or tests/ directory',
      'phpunit': 'tests/ directory'
    };

    return testPaths[config.testingFramework] || 'tests/ directory';
  }

  getLintCommand(config) {
    if (config.language === 'javascript' || config.language === 'typescript') {
      return `${config.packageManager || 'npm'} run lint`;
    } else if (config.language === 'python') {
      return 'flake8 .';
    } else if (config.language === 'rust') {
      return 'cargo clippy';
    } else if (config.language === 'go') {
      return 'go vet ./...';
    }
    return 'echo "No lint command configured"';
  }

  getBuildCommand(config) {
    if (config.language === 'javascript' || config.language === 'typescript') {
      return `${config.packageManager || 'npm'} run build`;
    } else if (config.language === 'python') {
      return 'python -m py_compile **/*.py';
    } else if (config.language === 'go') {
      return 'go build ./...';
    } else if (config.language === 'rust') {
      return 'cargo build';
    }
    return 'echo "No build command configured"';
  }

  getSecurityCommands(config) {
    if (config.language === 'javascript' || config.language === 'typescript') {
      return `# Check for vulnerabilities
npm audit --audit-level=high
npx snyk test

# Security linting
npx eslint --ext .js,.ts . --config .eslintrc-security.js`;
    } else if (config.language === 'python') {
      return `# Check dependencies
safety check
pip-audit

# Security analysis
bandit -r .`;
    } else if (config.language === 'rust') {
      return `# Check for vulnerabilities
cargo audit

# Security linting
cargo clippy -- -W clippy::all`;
    } else if (config.language === 'go') {
      return `# Security analysis
gosec ./...

# Vulnerability check
go list -json -m all | nancy sleuth`;
    }
    return '# No security commands configured for this language';
  }

  async listAvailableCommands() {
    return [
      {
        name: 'tdd-cycle',
        description: 'Automated red-green-refactor TDD cycle',
        usage: '/tdd-cycle <functionality description>',
        category: 'testing'
      },
      {
        name: 'bdd-scenario',
        description: 'Generate BDD scenarios from requirements',
        usage: '/bdd-scenario <feature description>',
        category: 'testing'
      },
      {
        name: 'project-health',
        description: 'Comprehensive project diagnostics',
        usage: '/project-health',
        category: 'maintenance'
      },
      {
        name: 'optimize-bundle',
        description: 'Bundle analysis and optimization',
        usage: '/optimize-bundle',
        category: 'performance'
      },
      {
        name: 'security-audit',
        description: 'Security vulnerability scanning',
        usage: '/security-audit [focus area]',
        category: 'security'
      },
      {
        name: 'generate-docs',
        description: 'Auto-generate project documentation',
        usage: '/generate-docs [documentation type]',
        category: 'documentation'
      }
    ];
  }
}

module.exports = new CommandsManager();
