const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const projectDetector = require('./project-detector');
const templateEngine = require('./template-engine');
const hooksManager = require('./hooks-manager');
const commandsManager = require('./commands-manager');
const agentsManager = require('./agents-manager');
const mcpManager = require('./mcp-manager');
const { validateEnvironment, checkClaudeCode } = require('./utils/validation');

class Installer {
  constructor() {
    this.spinner = null;
    this.projectRoot = process.cwd();
  }

  async init(options = {}) {
    console.log(chalk.blue.bold('🚀 Universal Claude Workflow Installer\n'));

    // Validate environment
    const validation = await validateEnvironment();
    if (!validation.valid) {
      console.error(chalk.red('❌ Environment validation failed:'));
      validation.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
      process.exit(1);
    }

    // Check for Claude Code
    const claudeCodeCheck = await checkClaudeCode();
    if (!claudeCodeCheck.installed) {
      console.log(chalk.yellow('⚠️  Claude Code not found. Installing...'));
      await this.installClaudeCode();
    }

    // Interactive setup if requested
    if (options.interactive) {
      options = await this.runInteractiveSetup(options);
    }

    // Detect project
    this.spinner = ora('Detecting project structure...').start();
    const projectInfo = (await projectDetector.detect(this.projectRoot)) || {};
    this.spinner.succeed(`Detected ${projectInfo.type || 'unknown'} project`);

    // Apply options and project detection
    const config = this.mergeConfiguration(options, projectInfo);

    // Install components
    await this.installWorkflow(config);

    console.log(chalk.green.bold('\n✅ Universal Claude Workflow installed successfully!'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.cyan('  1. Review the generated CLAUDE.md file'));
    console.log(chalk.cyan('  2. Run "claude" in your project directory'));
    console.log(chalk.cyan('  3. Try "/tdd-cycle" or "/project-health" commands'));
    console.log(chalk.cyan('  4. Check workflow health with "ucw health"'));
  }

  async runInteractiveSetup(options) {
    const questions = [
      {
        type: 'list',
        name: 'focus',
        message: 'What is your primary focus?',
        choices: [
          { name: 'Test-Driven Development (TDD)', value: 'tdd' },
          { name: 'Behavior-Driven Development (BDD)', value: 'bdd' },
          { name: 'Security-First Development', value: 'security' },
          { name: 'Performance Optimization', value: 'performance' },
          { name: 'Documentation & Maintenance', value: 'documentation' },
          { name: 'General Development', value: 'general' }
        ],
        default: options.focus || 'general'
      },
      {
        type: 'checkbox',
        name: 'agents',
        message: 'Which AI agents would you like to install?',
        choices: [
          { name: 'Code Reviewer - Automated code review', value: 'code-reviewer', checked: true },
          { name: 'Test Generator - Generate comprehensive tests', value: 'test-generator', checked: true },
          { name: 'Documentation - Auto-generate docs', value: 'documentation' },
          { name: 'Security Auditor - Vulnerability scanning', value: 'security-auditor' },
          { name: 'Refactoring - Code optimization', value: 'refactoring' },
          { name: 'Performance Analyzer - Performance insights', value: 'performance-analyzer' }
        ]
      },
      {
        type: 'checkbox',
        name: 'hooks',
        message: 'Which automation hooks would you like?',
        choices: [
      { name: 'Pre-commit validation', value: 'pre-commit', checked: true },
      { name: 'Post-tool formatting', value: 'post-tool', checked: true },
      { name: 'Test execution triggers', value: 'test-trigger' },
      { name: 'Build validation', value: 'build-validation' },
      { name: 'Security scanning', value: 'security-scan' },
      { name: 'Session analytics', value: 'session-analytics', checked: true },
      { name: 'Session resume primer (adds resume hints to CLAUDE.md on start)', value: 'resume-primer' }
      ]
    },
      {
        type: 'checkbox',
        name: 'commands',
        message: 'Which custom commands would you like?',
        choices: [
          { name: '/new-feature - Multi-agent feature workflow', value: 'new-feature', checked: true },
          { name: '/resume-feature - Resume in-progress feature', value: 'resume-feature', checked: true }
        ]
      },
      {
        type: 'confirm',
        name: 'mcpIntegrations',
        message: 'Would you like to set up external integrations (databases, CI/CD)?',
        default: false
      }
    ];

    const answers = await inquirer.prompt(questions);
    return { ...options, ...answers };
  }

  mergeConfiguration(options, projectInfo) {
    return {
      projectType: projectInfo.type,
      framework: options.framework || projectInfo.framework,
      language: projectInfo.language,
      packageManager: projectInfo.packageManager,
      testingFramework: options.testing || projectInfo.testingFramework,
      buildSystem: projectInfo.buildSystem,
      focus: options.focus || 'general',
      agents: options.agents || ['code-reviewer', 'test-generator'],
      hooks: options.hooks || ['pre-commit', 'post-tool', 'session-analytics'],
      commands: options.commands || ['new-feature', 'resume-feature'],
      mcpIntegrations: options.mcpIntegrations || false,
      skipPermissions: options.skipPermissions || false
    };
  }

  async installWorkflow(config) {
    const steps = [
      { name: 'Creating CLAUDE.md', fn: () => this.createClaudeMd(config) },
      { name: 'Setting up Claude Code configuration', fn: () => this.setupClaudeConfig(config) },
      { name: 'Installing hooks system', fn: () => hooksManager.install(config.hooks, config) },
      { name: 'Installing custom commands', fn: () => commandsManager.install(config.commands, config) },
      { name: 'Installing AI agents', fn: () => agentsManager.install(config.agents, config) }
    ];

    if (config.mcpIntegrations) {
      steps.push({ name: 'Setting up MCP integrations', fn: () => mcpManager.setup(config) });
    }

    for (const step of steps) {
      this.spinner = ora(step.name + '...').start();
      try {
        await step.fn();
        this.spinner.succeed(step.name);
      } catch (error) {
        this.spinner.fail(`${step.name} failed: ${error.message}`);
        throw error;
      }
    }
  }

  async createClaudeMd(config) {
    const claudeContent = await templateEngine.generateClaudeMd(config);
    await fs.writeFile(path.join(this.projectRoot, 'CLAUDE.md'), claudeContent);
  }

  async setupClaudeConfig(config) {
    const claudeDir = path.join(this.projectRoot, '.claude');
    await fs.ensureDir(claudeDir);

    const settings = {
      version: '1.0.0',
      skipPermissions: config.skipPermissions,
      hooks: {},
      agents: config.agents,
      customCommands: config.commands,
      projectConfig: {
        type: config.projectType,
        framework: config.framework,
        language: config.language,
        focus: config.focus
      }
    };

    await fs.writeJSON(path.join(claudeDir, 'settings.json'), settings, { spaces: 2 });
  }

  async installClaudeCode() {
    this.spinner = ora('Installing Claude Code...').start();
    try {
      const { execSync } = require('child_process');
      execSync('npm install -g @anthropic-ai/claude-code', { stdio: 'pipe' });
      this.spinner.succeed('Claude Code installed');
    } catch (error) {
      this.spinner.fail('Failed to install Claude Code');
      throw new Error('Please install Claude Code manually: npm install -g @anthropic-ai/claude-code');
    }
  }

  async listTemplates(options = {}) {
    const templates = (await templateEngine.listAvailableTemplates()) || [];
    
    console.log(chalk.blue.bold('📋 Available Templates\n'));
    
    const filteredTemplates = options.framework 
      ? templates.filter ? templates.filter(t => t.framework === options.framework) : []
      : templates;

    if (filteredTemplates.length === 0) {
      console.log(chalk.yellow('No templates found matching criteria'));
      return;
    }

    filteredTemplates.forEach(template => {
      console.log(chalk.green(`${template.name}`));
      console.log(chalk.gray(`  Framework: ${template.framework}`));
      console.log(chalk.gray(`  Focus: ${template.focus}`));
      console.log(chalk.gray(`  Description: ${template.description}`));
      console.log();
    });
  }
}

module.exports = new Installer();
