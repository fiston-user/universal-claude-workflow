const fs = require('fs-extra');
const path = require('path');

class TemplateEngine {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
    this.claudeTemplatesDir = path.join(__dirname, '../templates/claude');
  }

  async generateClaudeMd(config) {
    const template = await this.selectTemplate(config);
    return this.populateTemplate(template, config);
  }

  async selectTemplate(config) {
    const templateMap = {
      'react': 'react-typescript-tdd.md',
      'nextjs': 'nextjs-fullstack.md',
      'node': 'node-express-api.md',
      'python': 'python-fastapi-tdd.md',
      'go': 'go-web-service.md',
      'rust': 'rust-actix-web.md',
      'vue': 'vue-composition-api.md',
      'angular': 'angular-enterprise.md',
      'svelte': 'svelte-modern.md',
      'default': 'universal-base.md'
    };

    const templateName = templateMap[config.framework] || templateMap['default'];
    const templatePath = path.join(this.claudeTemplatesDir, templateName);

    if (await fs.pathExists(templatePath)) {
      return fs.readFile(templatePath, 'utf8');
    }

    // Fallback to base template
    return this.getBaseTemplate(config);
  }

  async populateTemplate(template, config) {
    let content = template;

    // Replace placeholders
    const replacements = {
      '{{PROJECT_TYPE}}': config.projectType || 'project',
      '{{FRAMEWORK}}': config.framework || 'unknown',
      '{{LANGUAGE}}': config.language || 'unknown',
      '{{PACKAGE_MANAGER}}': config.packageManager || 'npm',
      '{{TESTING_FRAMEWORK}}': config.testingFramework || 'jest',
      '{{BUILD_SYSTEM}}': config.buildSystem || 'webpack',
      '{{FOCUS}}': config.focus || 'general',
      '{{PROJECT_NAME}}': path.basename(process.cwd()),
      '{{AGENTS_LIST}}': this.generateAgentsList(config.agents),
      '{{COMMANDS_LIST}}': this.generateCommandsList(config.commands),
      '{{HOOKS_LIST}}': this.generateHooksList(config.hooks),
      '{{TDD_SECTION}}': config.focus === 'tdd' ? this.getTddSection() : '',
      '{{BDD_SECTION}}': config.focus === 'bdd' ? this.getBddSection() : '',
      '{{SECURITY_SECTION}}': config.focus === 'security' ? this.getSecuritySection() : '',
      '{{PERFORMANCE_SECTION}}': config.focus === 'performance' ? this.getPerformanceSection() : ''
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }

    return content;
  }

  getBaseTemplate(config) {
    return `# {{PROJECT_NAME}} - Claude Code Configuration

## Project Overview
This is a {{PROJECT_TYPE}} project using {{FRAMEWORK}} with {{LANGUAGE}}.

**Tech Stack:**
- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Package Manager: {{PACKAGE_MANAGER}}
- Testing: {{TESTING_FRAMEWORK}}
- Build System: {{BUILD_SYSTEM}}

## Development Guidelines

### Code Style
- Follow consistent naming conventions
- Use TypeScript for type safety where applicable
- Maintain clean, readable code with proper documentation
- Follow the existing project structure and patterns

### Testing Strategy
- Write tests first (TDD approach)
- Maintain high test coverage (>80%)
- Use {{TESTING_FRAMEWORK}} for unit and integration tests
- Mock external dependencies appropriately

### Git Workflow
- Use feature branches for new development
- Write descriptive commit messages
- Squash commits before merging
- Ensure all tests pass before merging

## Important Commands

### Development
- Start development: \`{{PACKAGE_MANAGER}} run dev\`
- Build project: \`{{PACKAGE_MANAGER}} run build\`
- Run tests: \`{{PACKAGE_MANAGER}} test\`
- Lint code: \`{{PACKAGE_MANAGER}} run lint\`

### Universal Claude Workflow
{{COMMANDS_LIST}}

## AI Agents
{{AGENTS_LIST}}

## Automation Hooks
{{HOOKS_LIST}}

{{TDD_SECTION}}
{{BDD_SECTION}}
{{SECURITY_SECTION}}
{{PERFORMANCE_SECTION}}

## Project Structure
Follow the established directory structure and naming conventions.

## Best Practices
- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic
- Handle errors gracefully
- Optimize for readability and maintainability

## Focus: {{FOCUS}}
This project emphasizes {{FOCUS}} development practices and workflows.
`;
  }

  generateAgentsList(agents) {
    if (!agents || agents.length === 0) return 'No AI agents configured.';
    
    const agentDescriptions = {
      'code-reviewer': '- **Code Reviewer**: Automated code review and feedback',
      'test-generator': '- **Test Generator**: Generate comprehensive test suites',
      'documentation': '- **Documentation**: Auto-generate and maintain docs',
      'security-auditor': '- **Security Auditor**: Vulnerability scanning and security analysis',
      'refactoring': '- **Refactoring**: Code optimization and cleanup suggestions',
      'performance-analyzer': '- **Performance Analyzer**: Performance insights and optimization'
    };

    return agents.map(agent => agentDescriptions[agent] || `- **${agent}**: Custom agent`).join('\n');
  }

  generateCommandsList(commands) {
    if (!commands || commands.length === 0) return 'No custom commands configured.';
    
    const commandDescriptions = {
      'tdd-cycle': '- `/tdd-cycle` - Automated red-green-refactor TDD cycle',
      'bdd-scenario': '- `/bdd-scenario` - Generate BDD scenarios from requirements',
      'project-health': '- `/project-health` - Comprehensive project diagnostics',
      'optimize-bundle': '- `/optimize-bundle` - Bundle analysis and optimization',
      'security-audit': '- `/security-audit` - Security vulnerability scanning',
      'generate-docs': '- `/generate-docs` - Auto-generate project documentation'
    };

    return commands.map(cmd => commandDescriptions[cmd] || `- \`/${cmd}\` - Custom command`).join('\n');
  }

  generateHooksList(hooks) {
    if (!hooks || hooks.length === 0) return 'No automation hooks configured.';
    
    const hookDescriptions = {
      'pre-commit': '- **Pre-commit**: Validation and formatting before commits',
      'post-tool': '- **Post-tool**: Automatic formatting after file modifications',
      'test-trigger': '- **Test Trigger**: Automatic test execution on changes',
      'build-validation': '- **Build Validation**: Ensure builds succeed after changes',
      'security-scan': '- **Security Scan**: Automatic vulnerability scanning',
      'session-analytics': '- **Session Analytics**: Track and analyze coding sessions'
    };

    return hooks.map(hook => hookDescriptions[hook] || `- **${hook}**: Custom hook`).join('\n');
  }

  getTddSection() {
    return `
## Test-Driven Development (TDD)

### TDD Workflow
1. **Red**: Write a failing test first
2. **Green**: Write minimal code to pass the test
3. **Refactor**: Improve code while keeping tests green

### TDD Commands
- Use \`/tdd-cycle\` to automate the TDD process
- Tests should be written before implementation
- Maintain high test coverage (>90% for TDD projects)

### Test Structure
- Unit tests for individual functions/components
- Integration tests for component interactions
- End-to-end tests for critical user flows
`;
  }

  getBddSection() {
    return `
## Behavior-Driven Development (BDD)

### BDD Workflow
1. Define behavior in plain language
2. Write scenarios using Given-When-Then format
3. Implement step definitions
4. Write code to make scenarios pass

### BDD Commands
- Use \`/bdd-scenario\` to generate new scenarios
- Follow Gherkin syntax for scenario definitions
- Focus on user behavior and business value

### Scenario Structure
\`\`\`gherkin
Feature: User Authentication
  Scenario: Successful login
    Given a user with valid credentials
    When they attempt to log in
    Then they should be redirected to the dashboard
\`\`\`
`;
  }

  getSecuritySection() {
    return `
## Security-First Development

### Security Practices
- Input validation and sanitization
- Proper authentication and authorization
- Secure data handling and storage
- Regular dependency updates

### Security Commands
- Use \`/security-audit\` for vulnerability scanning
- Regular security reviews of code changes
- Implement security testing in CI/CD pipeline

### Security Checklist
- [ ] All inputs are validated
- [ ] Sensitive data is properly encrypted
- [ ] Authentication is implemented correctly
- [ ] Authorization checks are in place
- [ ] Dependencies are up to date
`;
  }

  getPerformanceSection() {
    return `
## Performance Optimization

### Performance Practices
- Measure before optimizing
- Focus on critical path performance
- Implement efficient algorithms and data structures
- Monitor and profile regularly

### Performance Commands
- Use \`/optimize-bundle\` for bundle analysis
- Regular performance testing and monitoring
- Implement performance budgets

### Performance Checklist
- [ ] Critical rendering path is optimized
- [ ] Assets are properly compressed
- [ ] Caching strategies are implemented
- [ ] Database queries are optimized
- [ ] Memory usage is monitored
`;
  }

  async listAvailableTemplates() {
    return [
      {
        name: 'react-typescript-tdd',
        framework: 'react',
        focus: 'tdd',
        description: 'React with TypeScript and TDD workflow'
      },
      {
        name: 'nextjs-fullstack',
        framework: 'nextjs',
        focus: 'fullstack',
        description: 'Next.js full-stack application with API routes'
      },
      {
        name: 'node-express-api',
        framework: 'node',
        focus: 'api',
        description: 'Node.js Express API with comprehensive testing'
      },
      {
        name: 'python-fastapi-tdd',
        framework: 'python',
        focus: 'tdd',
        description: 'Python FastAPI with TDD and async support'
      },
      {
        name: 'go-web-service',
        framework: 'go',
        focus: 'microservices',
        description: 'Go web service with clean architecture'
      },
      {
        name: 'rust-actix-web',
        framework: 'rust',
        focus: 'performance',
        description: 'Rust Actix-web high-performance service'
      },
      {
        name: 'vue-composition-api',
        framework: 'vue',
        focus: 'frontend',
        description: 'Vue 3 with Composition API and modern tooling'
      },
      {
        name: 'universal-base',
        framework: 'any',
        focus: 'general',
        description: 'Universal template for any project type'
      }
    ];
  }
}

module.exports = new TemplateEngine();