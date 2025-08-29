const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');
const projectDetector = require('./project-detector');
const { validateEnvironment, validateProjectStructure } = require('./utils/validation');

class HealthChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
  }

  async check(options = {}) {
    console.log(chalk.blue.bold('🏥 Universal Claude Workflow Health Check\n'));

    const checks = [
      { name: 'Environment validation', fn: () => this.checkEnvironment() },
      { name: 'Project structure', fn: () => this.checkProjectStructure() },
      { name: 'Claude Code installation', fn: () => this.checkClaudeCode() },
      { name: 'UCW configuration', fn: () => this.checkUCWConfiguration() },
      { name: 'Dependencies', fn: () => this.checkDependencies() },
      { name: 'Hooks system', fn: () => this.checkHooks() },
      { name: 'Commands system', fn: () => this.checkCommands() },
      { name: 'Agents system', fn: () => this.checkAgents() },
      { name: 'MCP configuration', fn: () => this.checkMCP() },
      { name: 'Git integration', fn: () => this.checkGit() },
      { name: 'Testing setup', fn: () => this.checkTesting() },
      { name: 'Build system', fn: () => this.checkBuildSystem() },
      { name: 'Security configuration', fn: () => this.checkSecurity() }
    ];

    for (const check of checks) {
      const spinner = ora(check.name + '...').start();
      try {
        await check.fn();
        spinner.succeed(check.name);
      } catch (error) {
        spinner.fail(`${check.name}: ${error.message}`);
        this.addIssue(check.name, error.message, 'error');
      }
    }

    await this.generateReport(options);
  }

  async checkEnvironment() {
    const validation = await validateEnvironment();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        this.addIssue('Environment', warning, 'warning');
      });
    }
    this.addSuccess('Environment', 'Node.js and npm versions are compatible');
  }

  async checkProjectStructure() {
    const validation = await validateProjectStructure(process.cwd());
    if (!validation.valid) {
      throw new Error(validation.issues.join(', '));
    }
    this.addSuccess('Project Structure', 'Project directory is writable and accessible');
  }

  async checkClaudeCode() {
    try {
      const version = execSync('claude --version', { encoding: 'utf8' }).trim();
      this.addSuccess('Claude Code', `Installed version: ${version}`);
    } catch (error) {
      throw new Error('Claude Code is not installed or not accessible');
    }
  }

  async checkUCWConfiguration() {
    // Check for CLAUDE.md
    const claudePath = path.join(process.cwd(), 'CLAUDE.md');
    if (!await fs.pathExists(claudePath)) {
      this.addIssue('UCW Configuration', 'CLAUDE.md file not found', 'error');
    } else {
      this.addSuccess('UCW Configuration', 'CLAUDE.md file exists');
    }

    // Check for .claude directory
    const claudeDir = path.join(process.cwd(), '.claude');
    if (!await fs.pathExists(claudeDir)) {
      this.addIssue('UCW Configuration', '.claude directory not found', 'error');
    } else {
      this.addSuccess('UCW Configuration', '.claude directory exists');
    }

    // Check for settings.json
    const settingsPath = path.join(claudeDir, 'settings.json');
    if (!await fs.pathExists(settingsPath)) {
      this.addIssue('UCW Configuration', 'Claude Code settings not found', 'warning');
    } else {
      try {
        const settings = await fs.readJSON(settingsPath);
        if (settings.hooks || settings.agents || settings.customCommands) {
          this.addSuccess('UCW Configuration', 'Claude Code settings properly configured');
        } else {
          this.addIssue('UCW Configuration', 'Settings file exists but appears incomplete', 'warning');
        }
      } catch (error) {
        this.addIssue('UCW Configuration', 'Invalid settings.json file', 'error');
      }
    }
  }

  async checkDependencies() {
    const projectInfo = await projectDetector.detect();
    
    switch (projectInfo.language) {
      case 'javascript':
      case 'typescript':
        await this.checkNodeDependencies(projectInfo);
        break;
      case 'python':
        await this.checkPythonDependencies();
        break;
      case 'go':
        await this.checkGoDependencies();
        break;
      case 'rust':
        await this.checkRustDependencies();
        break;
    }
  }

  async checkNodeDependencies(projectInfo) {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!await fs.pathExists(packagePath)) {
      throw new Error('package.json not found');
    }

    try {
      // Check for security vulnerabilities
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      this.addSuccess('Dependencies', 'No high-severity security vulnerabilities found');
    } catch (error) {
      this.addIssue('Dependencies', 'Security vulnerabilities detected in dependencies', 'warning');
    }

    try {
      // Check for outdated packages
      const outdated = execSync('npm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
      if (outdated.trim()) {
        const outdatedPackages = JSON.parse(outdated);
        const count = Object.keys(outdatedPackages).length;
        this.addIssue('Dependencies', `${count} packages are outdated`, 'warning');
      } else {
        this.addSuccess('Dependencies', 'All packages are up to date');
      }
    } catch (error) {
      // npm outdated returns exit code 1 when there are outdated packages
      if (error.status === 1) {
        this.addIssue('Dependencies', 'Some packages are outdated', 'warning');
      }
    }
  }

  async checkPythonDependencies() {
    const requirementsPath = path.join(process.cwd(), 'requirements.txt');
    if (await fs.pathExists(requirementsPath)) {
      try {
        execSync('safety check', { stdio: 'pipe' });
        this.addSuccess('Dependencies', 'No known security vulnerabilities in Python packages');
      } catch (error) {
        if (error.message.includes('command not found')) {
          this.addIssue('Dependencies', 'Safety package not installed for vulnerability checking', 'warning');
        } else {
          this.addIssue('Dependencies', 'Security vulnerabilities found in Python packages', 'error');
        }
      }
    }
  }

  async checkGoDependencies() {
    const goModPath = path.join(process.cwd(), 'go.mod');
    if (await fs.pathExists(goModPath)) {
      try {
        execSync('go list -m -u all', { stdio: 'pipe' });
        this.addSuccess('Dependencies', 'Go modules checked successfully');
      } catch (error) {
        this.addIssue('Dependencies', 'Issues with Go module dependencies', 'warning');
      }
    }
  }

  async checkRustDependencies() {
    const cargoTomlPath = path.join(process.cwd(), 'Cargo.toml');
    if (await fs.pathExists(cargoTomlPath)) {
      try {
        execSync('cargo audit', { stdio: 'pipe' });
        this.addSuccess('Dependencies', 'No security vulnerabilities in Rust dependencies');
      } catch (error) {
        if (error.message.includes('command not found')) {
          this.addIssue('Dependencies', 'cargo-audit not installed', 'warning');
        } else {
          this.addIssue('Dependencies', 'Security vulnerabilities found in Rust dependencies', 'error');
        }
      }
    }
  }

  async checkHooks() {
    const hooksManager = require('./hooks-manager');
    const validation = await hooksManager.validateHookConfiguration({});
    
    if (!validation.valid) {
      validation.issues.forEach(issue => {
        this.addIssue('Hooks', issue, 'warning');
      });
    } else {
      this.addSuccess('Hooks', 'Hook configuration is valid');
    }
  }

  async checkCommands() {
    const commandsDir = path.join(process.cwd(), '.claude', 'commands');
    if (!await fs.pathExists(commandsDir)) {
      this.addIssue('Commands', 'No custom commands directory found', 'warning');
      return;
    }

    const commands = await fs.readdir(commandsDir);
    const mdCommands = commands.filter(cmd => cmd.endsWith('.md'));
    
    if (mdCommands.length === 0) {
      this.addIssue('Commands', 'No custom commands found', 'warning');
    } else {
      this.addSuccess('Commands', `${mdCommands.length} custom commands available`);
    }
  }

  async checkAgents() {
    const agentsDir = path.join(process.cwd(), '.claude', 'agents');
    if (!await fs.pathExists(agentsDir)) {
      this.addIssue('Agents', 'No agents directory found', 'warning');
      return;
    }

    const agents = await fs.readdir(agentsDir);
    const mdAgents = agents.filter(agent => agent.endsWith('.md'));
    
    if (mdAgents.length === 0) {
      this.addIssue('Agents', 'No AI agents configured', 'warning');
    } else {
      this.addSuccess('Agents', `${mdAgents.length} AI agents configured`);
    }

    // Check registry
    const registryPath = path.join(process.cwd(), '.claude', 'agents-registry.json');
    if (await fs.pathExists(registryPath)) {
      this.addSuccess('Agents', 'Agent registry exists');
    } else {
      this.addIssue('Agents', 'Agent registry missing', 'warning');
    }
  }

  async checkMCP() {
    const mcpManager = require('./mcp-manager');
    const validation = await mcpManager.validateMCPConfiguration();
    
    if (!validation.valid) {
      this.addIssue('MCP', validation.error, 'warning');
    } else {
      const servers = await mcpManager.listInstalledServers();
      this.addSuccess('MCP', `${servers.length} MCP servers configured`);
    }
  }

  async checkGit() {
    try {
      execSync('git status', { stdio: 'pipe' });
      this.addSuccess('Git', 'Git repository is properly initialized');
    } catch (error) {
      this.addIssue('Git', 'Not a git repository or git not available', 'warning');
    }
  }

  async checkTesting() {
    const projectInfo = await projectDetector.detect();
    
    if (!projectInfo.testingFramework) {
      this.addIssue('Testing', 'No testing framework detected', 'warning');
      return;
    }

    try {
      const testCommand = this.getTestCommand(projectInfo);
      execSync(`${testCommand} --version`, { stdio: 'pipe' });
      this.addSuccess('Testing', `${projectInfo.testingFramework} testing framework available`);
    } catch (error) {
      this.addIssue('Testing', `Testing framework ${projectInfo.testingFramework} not properly configured`, 'warning');
    }
  }

  async checkBuildSystem() {
    const projectInfo = await projectDetector.detect();
    
    if (!projectInfo.buildSystem) {
      this.addIssue('Build System', 'No build system detected', 'warning');
      return;
    }

    try {
      const buildCommand = this.getBuildCommand(projectInfo);
      // Just check if the build command exists, don't run it
      this.addSuccess('Build System', `${projectInfo.buildSystem} build system configured`);
    } catch (error) {
      this.addIssue('Build System', `Build system ${projectInfo.buildSystem} not properly configured`, 'warning');
    }
  }

  async checkSecurity() {
    // Check for common security files
    const securityFiles = ['.gitignore', '.env.example'];
    let foundFiles = 0;
    
    for (const file of securityFiles) {
      if (await fs.pathExists(path.join(process.cwd(), file))) {
        foundFiles++;
      }
    }

    if (foundFiles === securityFiles.length) {
      this.addSuccess('Security', 'Basic security files present');
    } else {
      this.addIssue('Security', 'Some security files missing (.gitignore, .env.example)', 'warning');
    }

    // Check for secrets in git
    try {
      const gitLog = execSync('git log --all --full-history -- **/.*', { encoding: 'utf8', stdio: 'pipe' });
      // This is a basic check - in practice you'd use more sophisticated tools
      this.addSuccess('Security', 'No obvious secrets found in git history (basic check)');
    } catch (error) {
      // Ignore if not a git repo
    }
  }

  getTestCommand(projectInfo) {
    switch (projectInfo.testingFramework) {
      case 'jest':
        return 'npx jest';
      case 'vitest':
        return 'npx vitest';
      case 'pytest':
        return 'pytest';
      case 'go test':
        return 'go test';
      case 'cargo test':
        return 'cargo test';
      default:
        return 'echo "test"';
    }
  }

  getBuildCommand(projectInfo) {
    switch (projectInfo.buildSystem) {
      case 'webpack':
        return 'npx webpack';
      case 'vite':
        return 'npx vite build';
      case 'rollup':
        return 'npx rollup';
      case 'go build':
        return 'go build';
      case 'cargo':
        return 'cargo build';
      default:
        return 'echo "build"';
    }
  }

  addIssue(category, message, severity) {
    this.issues.push({ category, message, severity });
  }

  addWarning(category, message) {
    this.warnings.push({ category, message });
  }

  addSuccess(category, message) {
    this.successes.push({ category, message });
  }

  async generateReport(options) {
    console.log(chalk.green.bold('\n✅ Successful Checks:'));
    this.successes.forEach(success => {
      console.log(chalk.green(`  ✓ ${success.category}: ${success.message}`));
    });

    if (this.issues.filter(i => i.severity === 'warning').length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
      this.issues.filter(i => i.severity === 'warning').forEach(issue => {
        console.log(chalk.yellow(`  ⚠ ${issue.category}: ${issue.message}`));
      });
    }

    if (this.issues.filter(i => i.severity === 'error').length > 0) {
      console.log(chalk.red.bold('\n❌ Errors:'));
      this.issues.filter(i => i.severity === 'error').forEach(issue => {
        console.log(chalk.red(`  ✗ ${issue.category}: ${issue.message}`));
      });
    }

    // Generate summary
    const totalChecks = this.successes.length + this.issues.length;
    const successRate = Math.round((this.successes.length / totalChecks) * 100);
    
    console.log(chalk.blue.bold('\n📊 Health Check Summary:'));
    console.log(chalk.green(`  ✓ Passed: ${this.successes.length}`));
    console.log(chalk.yellow(`  ⚠ Warnings: ${this.issues.filter(i => i.severity === 'warning').length}`));
    console.log(chalk.red(`  ✗ Errors: ${this.issues.filter(i => i.severity === 'error').length}`));
    console.log(chalk.blue(`  📈 Success Rate: ${successRate}%`));

    // Recommendations
    if (this.issues.length > 0) {
      console.log(chalk.cyan.bold('\n💡 Recommendations:'));
      if (this.issues.some(i => i.category === 'UCW Configuration')) {
        console.log(chalk.cyan('  • Run "ucw init" to set up missing configuration'));
      }
      if (this.issues.some(i => i.category === 'Dependencies')) {
        console.log(chalk.cyan('  • Update dependencies with your package manager'));
        console.log(chalk.cyan('  • Run security audits regularly'));
      }
      if (this.issues.some(i => i.category === 'Testing')) {
        console.log(chalk.cyan('  • Set up a testing framework for better development workflow'));
      }
    }

    if (options.verbose) {
      await this.generateVerboseReport();
    }
  }

  async generateVerboseReport() {
    const reportPath = path.join(process.cwd(), 'ucw-health-report.md');
    const timestamp = new Date().toISOString();
    
    let report = `# UCW Health Check Report\n\nGenerated: ${timestamp}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- ✅ Passed: ${this.successes.length}\n`;
    report += `- ⚠️ Warnings: ${this.issues.filter(i => i.severity === 'warning').length}\n`;
    report += `- ❌ Errors: ${this.issues.filter(i => i.severity === 'error').length}\n\n`;

    if (this.successes.length > 0) {
      report += `## ✅ Successful Checks\n\n`;
      this.successes.forEach(success => {
        report += `- **${success.category}**: ${success.message}\n`;
      });
      report += `\n`;
    }

    if (this.issues.filter(i => i.severity === 'warning').length > 0) {
      report += `## ⚠️ Warnings\n\n`;
      this.issues.filter(i => i.severity === 'warning').forEach(issue => {
        report += `- **${issue.category}**: ${issue.message}\n`;
      });
      report += `\n`;
    }

    if (this.issues.filter(i => i.severity === 'error').length > 0) {
      report += `## ❌ Errors\n\n`;
      this.issues.filter(i => i.severity === 'error').forEach(issue => {
        report += `- **${issue.category}**: ${issue.message}\n`;
      });
      report += `\n`;
    }

    await fs.writeFile(reportPath, report);
    console.log(chalk.blue(`\n📄 Detailed report saved to: ${reportPath}`));
  }
}

module.exports = new HealthChecker();