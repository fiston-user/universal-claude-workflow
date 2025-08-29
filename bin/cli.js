#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const packageJson = require('../package.json');

// Import UCW modules
const installer = require('../src/installer');
const health = require('../src/health');
const mcpManager = require('../src/mcp-manager');
const agentsManager = require('../src/agents-manager');
const updater = require('../src/updater');
const remover = require('../src/remover');
const projectDetector = require('../src/project-detector');
const analytics = require('../src/analytics');

program
  .name('ucw')
  .description('Universal Claude Workflow - Intelligent development automation for Claude Code')
  .version(packageJson.version);

// Initialize UCW in a project
program
  .command('init')
  .description('Initialize UCW in the current project')
  .option('--no-interactive', 'Skip interactive setup')
  .option(
    '-f, --focus <focus>',
    'Development focus (tdd, bdd, security, performance, documentation, general)'
  )
  .option('--force', 'Force reinitialize even if already set up')
  .option('--no-mcp', 'Skip MCP integration setup')
  .option('--agents <agents>', 'Comma-separated list of agents to install')
  .option('--hooks <hooks>', 'Comma-separated list of hooks to enable')
  .action(async options => {
    try {
      console.log(chalk.blue.bold('🚀 Universal Claude Workflow Initialization\n'));

      // Default to interactive mode unless explicitly disabled
      if (options.interactive !== false) {
        options.interactive = true;
      }

      // Convert comma-separated strings to arrays
      if (options.agents && typeof options.agents === 'string') {
        options.agents = options.agents.split(',').map(a => a.trim());
      }
      if (options.hooks && typeof options.hooks === 'string') {
        options.hooks = options.hooks.split(',').map(h => h.trim());
      }

      await installer.init(options);

      // Track installation
      await analytics.track('ucw:init', {
        focus: options.focus || 'general',
        interactive: options.interactive || false,
        agentsCount: options.agents ? options.agents.length : 0
      });
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), error.message);
      process.exit(1);
    }
  });

// Health check
program
  .command('health')
  .description('Check UCW system health and configuration')
  .option('-v, --verbose', 'Show detailed health information')
  .option('-f, --fix', 'Attempt to fix issues automatically')
  .action(async options => {
    try {
      await health.check(options);

      await analytics.track('ucw:health', {
        verbose: options.verbose || false,
        autoFix: options.fix || false
      });
    } catch (error) {
      console.error(chalk.red('❌ Health check failed:'), error.message);
      process.exit(1);
    }
  });

// Install agents
program
  .command('install-agents')
  .description('Install or update AI agents')
  .option('-l, --list', 'List available agents')
  .action(async options => {
    try {
      // agentsManager is already an instance

      if (options.list) {
        console.log(chalk.cyan('\n📦 Available AI Agents:\n'));
        const agents = [
          { name: 'code-reviewer', desc: 'Automated code review and suggestions' },
          { name: 'test-generator', desc: 'Generate comprehensive test suites' },
          { name: 'documentation', desc: 'Auto-generate and maintain documentation' },
          { name: 'security-auditor', desc: 'Security vulnerability scanning' },
          { name: 'refactoring', desc: 'Code optimization and refactoring' },
          { name: 'performance-analyzer', desc: 'Performance analysis and optimization' }
        ];

        agents.forEach(agent => {
          console.log(`  ${chalk.bold(agent.name)}: ${agent.desc}`);
        });
        return;
      }

      // Interactive agent selection
      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'agents',
          message: 'Select agents to install:',
          choices: [
            { name: 'Code Reviewer', value: 'code-reviewer' },
            { name: 'Test Generator', value: 'test-generator' },
            { name: 'Documentation', value: 'documentation' },
            { name: 'Security Auditor', value: 'security-auditor' },
            { name: 'Refactoring', value: 'refactoring' },
            { name: 'Performance Analyzer', value: 'performance-analyzer' }
          ]
        }
      ]);

      if (answers.agents.length === 0) {
        console.log(chalk.yellow('No agents selected'));
        return;
      }

      const spinner = ora('Installing agents...').start();
      const projectInfo = await projectDetector.detect(process.cwd());
      await agentsManager.install(answers.agents, projectInfo);
      spinner.succeed(`Installed ${answers.agents.length} agents`);

      console.log(chalk.green('\n✅ Agents installed successfully'));
      console.log(chalk.cyan('Agent configurations saved to .claude/agents/'));
    } catch (error) {
      console.error(chalk.red('❌ Agent installation failed:'), error.message);
      process.exit(1);
    }
  });

// Setup MCP
program
  .command('setup-mcp')
  .description('Configure MCP (Model Context Protocol) integration')
  .option('-s, --servers <servers>', 'Comma-separated list of MCP servers to configure')
  .action(async options => {
    try {
      console.log(chalk.blue('🔗 Setting up MCP integration...\n'));

      const projectInfo = await projectDetector.detect(process.cwd());

      if (options.servers) {
        projectInfo.mcpServers = options.servers.split(',').map(s => s.trim());
      }

      await mcpManager.setup(projectInfo);

      console.log(chalk.green('\n✅ MCP integration configured successfully'));
      console.log(chalk.cyan('MCP configuration saved to claude_config.json'));
    } catch (error) {
      console.error(chalk.red('❌ MCP setup failed:'), error.message);
      process.exit(1);
    }
  });

// Update workflow
program
  .command('update')
  .description('Update UCW configuration and templates')
  .option('--check', 'Check for available updates without applying them')
  .action(async options => {
    try {
      if (options.check) {
        console.log(chalk.blue('🔍 Checking for updates...\n'));
        const hasUpdates = await updater.checkForUpdates();

        if (hasUpdates) {
          console.log(chalk.yellow('📦 Updates available!'));
          console.log(chalk.cyan('Run "ucw update" to apply them'));
        } else {
          console.log(chalk.green('✅ UCW is up to date'));
        }
      } else {
        const spinner = ora('Updating UCW configuration...').start();
        await updater.update();
        spinner.succeed('UCW updated successfully');
      }
    } catch (error) {
      console.error(chalk.red('❌ Update failed:'), error.message);
      process.exit(1);
    }
  });

// Remove UCW
program
  .command('remove')
  .description('Remove UCW from the current project')
  .option('--keep-claude', 'Keep CLAUDE.md file')
  .option('--force', 'Skip confirmation prompt')
  .action(async options => {
    try {
      if (!options.force) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to remove UCW from this project?',
            default: false
          }
        ]);

        if (!answers.confirm) {
          console.log(chalk.yellow('Removal cancelled'));
          return;
        }
      }

      const spinner = ora('Removing UCW...').start();
      await remover.remove(options);
      spinner.succeed('UCW removed successfully');

      if (options.keepClaude) {
        console.log(chalk.cyan('CLAUDE.md file was preserved'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Removal failed:'), error.message);
      process.exit(1);
    }
  });

// Interactive configuration
program
  .command('config')
  .description('Interactive UCW configuration')
  .action(async () => {
    try {
      console.log(chalk.blue.bold('⚙️  UCW Configuration\n'));

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to configure?',
          choices: [
            { name: 'Development Focus', value: 'focus' },
            { name: 'AI Agents', value: 'agents' },
            { name: 'Automation Hooks', value: 'hooks' },
            { name: 'Custom Commands', value: 'commands' },
            { name: 'MCP Integration', value: 'mcp' },
            { name: 'Project Settings', value: 'project' }
          ]
        }
      ]);

      switch (answers.action) {
      case 'focus': {
        const focusAnswers = await inquirer.prompt([
          {
            type: 'list',
            name: 'focus',
            message: 'Select your development focus:',
            choices: [
              { name: 'Test-Driven Development (TDD)', value: 'tdd' },
              { name: 'Behavior-Driven Development (BDD)', value: 'bdd' },
              { name: 'Security-First Development', value: 'security' },
              { name: 'Performance Optimization', value: 'performance' },
              { name: 'Documentation & Maintenance', value: 'documentation' },
              { name: 'General Development', value: 'general' }
            ]
          }
        ]);

        // Update configuration
        await installer.updateFocus(focusAnswers.focus);
        console.log(chalk.green('✅ Development focus updated'));
        break;
      }

      case 'agents':
        await program.parseAsync(['node', 'cli.js', 'install-agents']);
        break;

      case 'mcp':
        await program.parseAsync(['node', 'cli.js', 'setup-mcp']);
        break;

      default:
        console.log(chalk.yellow('Configuration for', answers.action, 'coming soon!'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Configuration failed:'), error.message);
      process.exit(1);
    }
  });

// Show status
program
  .command('status')
  .description('Show UCW installation status')
  .action(async () => {
    try {
      console.log(chalk.blue.bold('📊 UCW Status\n'));

      const projectInfo = await projectDetector.detect(process.cwd());

      console.log(chalk.cyan('Project Information:'));
      console.log(`  Type: ${projectInfo.type}`);
      console.log(`  Language: ${projectInfo.language}`);
      console.log(`  Framework: ${projectInfo.framework || 'None detected'}`);
      console.log(`  Test Framework: ${projectInfo.testingFramework || 'None detected'}`);

      // Check for CLAUDE.md
      const fs = require('fs-extra');
      const claudePath = require('path').join(process.cwd(), 'CLAUDE.md');
      const hasClaudeFile = await fs.pathExists(claudePath);

      console.log(chalk.cyan('\nUCW Configuration:'));
      console.log(
        `  CLAUDE.md: ${hasClaudeFile ? chalk.green('✓ Present') : chalk.red('✗ Missing')}`
      );

      // Check for .claude directory
      const claudeDir = require('path').join(process.cwd(), '.claude');
      const hasClaudeDir = await fs.pathExists(claudeDir);
      console.log(
        `  .claude directory: ${hasClaudeDir ? chalk.green('✓ Present') : chalk.red('✗ Missing')}`
      );

      if (hasClaudeDir) {
        // Count agents
        const agentsDir = require('path').join(claudeDir, 'agents');
        if (await fs.pathExists(agentsDir)) {
          const agents = await fs.readdir(agentsDir);
          console.log(`  Installed agents: ${agents.length}`);
        }

        // Check for hooks
        const hooksDir = require('path').join(claudeDir, 'hooks');
        if (await fs.pathExists(hooksDir)) {
          const hooks = await fs.readdir(hooksDir);
          console.log(`  Active hooks: ${hooks.length}`);
        }
      }

      if (!hasClaudeFile && !hasClaudeDir) {
        console.log(chalk.yellow('\n⚠️  UCW is not installed in this project'));
        console.log(chalk.cyan('Run "ucw init" to set it up'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Status check failed:'), error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
