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
      default:
        console.warn(`Unknown command: ${commandName}`);
        return null;
    }
  }

  getTddCycleCommand(config) {
    const testCommand = this.getTestCommand(config);
    
    return `# TDD Cycle Command

Execute a complete Test-Driven Development cycle:

1. **RED PHASE**: Write a failing test
   - Create a test for the functionality described in $ARGUMENTS
   - Ensure the test fails initially
   - Focus on the expected behavior and interface

2. **GREEN PHASE**: Make the test pass
   - Write minimal code to make the test pass
   - Don't worry about perfect code - just make it work
   - Run tests to ensure they pass

3. **REFACTOR PHASE**: Improve the code
   - Clean up the implementation
   - Remove duplication
   - Improve readability and structure
   - Ensure all tests still pass

## Usage
\`/tdd-cycle Add user authentication to the login form\`

## Test Command
Run tests using: \`${testCommand}\`

## Process
- Start by writing the test first
- Make the test fail (RED)
- Write minimal code to pass (GREEN)  
- Refactor while keeping tests green
- Commit after each successful cycle

## Guidelines
- Keep tests simple and focused
- Write only enough code to pass the test
- Refactor fearlessly with test coverage
- One functionality per TDD cycle
`;
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