const chalk = require('chalk');
const ora = require('ora');
const hooksManager = require('./hooks-manager');
const commandsManager = require('./commands-manager');
const agentsManager = require('./agents-manager');
const mcpManager = require('./mcp-manager');

class ComponentManager {
  async add(type, name, options = {}) {
    console.log(chalk.blue.bold(`🔧 Adding ${type}: ${name}\n`));

    const spinner = ora(`Adding ${type} ${name}...`).start();

    try {
      switch (type.toLowerCase()) {
        case 'agent':
          await this.addAgent(name, options);
          break;
        case 'command':
          await this.addCommand(name, options);
          break;
        case 'hook':
          await this.addHook(name, options);
          break;
        case 'mcp':
          await this.addMCPServer(name, options);
          break;
        default:
          throw new Error(`Unknown component type: ${type}`);
      }

      spinner.succeed(`${type} ${name} added successfully`);
      console.log(chalk.green(`✅ ${type} "${name}" has been installed and configured`));
      
      // Show usage information
      await this.showUsageInformation(type, name);

    } catch (error) {
      spinner.fail(`Failed to add ${type} ${name}`);
      throw error;
    }
  }

  async addAgent(name, options) {
    const projectDetector = require('./project-detector');
    const projectInfo = await projectDetector.detect();

    const config = {
      projectType: projectInfo.type,
      language: projectInfo.language,
      framework: projectInfo.framework,
      ...options.config
    };

    await agentsManager.install([name], config);
  }

  async addCommand(name, options) {
    const projectDetector = require('./project-detector');
    const projectInfo = await projectDetector.detect();

    const config = {
      projectType: projectInfo.type,
      language: projectInfo.language,
      framework: projectInfo.framework,
      packageManager: projectInfo.packageManager,
      testingFramework: projectInfo.testingFramework,
      buildSystem: projectInfo.buildSystem,
      ...options.config
    };

    await commandsManager.install([name], config);
  }

  async addHook(name, options) {
    const projectDetector = require('./project-detector');
    const projectInfo = await projectDetector.detect();

    const config = {
      language: projectInfo.language,
      framework: projectInfo.framework,
      packageManager: projectInfo.packageManager,
      testingFramework: projectInfo.testingFramework,
      buildSystem: projectInfo.buildSystem,
      ...options.config
    };

    await hooksManager.install([name], config);
  }

  async addMCPServer(name, options) {
    const serverConfig = this.getMCPServerConfig(name, options);
    await mcpManager.addServer(name, serverConfig);
  }

  getMCPServerConfig(name, options) {
    const commonConfigs = {
      postgresql: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-postgresql'],
        env: {
          DATABASE_URL: options.databaseUrl || 'postgresql://localhost:5432/devdb'
        }
      },
      sqlite: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-sqlite'],
        env: {
          DATABASE_PATH: options.databasePath || './database.sqlite'
        }
      },
      github: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_TOKEN}'
        }
      },
      sentry: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-sentry'],
        env: {
          SENTRY_DSN: '${SENTRY_DSN}'
        }
      },
      slack: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-slack'],
        env: {
          SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}'
        }
      },
      aws: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-aws'],
        env: {
          AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
          AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
          AWS_REGION: options.region || 'us-east-1'
        }
      },
      docker: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-docker'],
        env: {
          DOCKER_HOST: 'unix:///var/run/docker.sock'
        }
      }
    };

    return commonConfigs[name] || {
      command: 'npx',
      args: [`@modelcontextprotocol/server-${name}`],
      env: options.env || {}
    };
  }

  async showUsageInformation(type, name) {
    console.log(chalk.cyan.bold('\n📖 Usage Information:'));

    switch (type.toLowerCase()) {
      case 'agent':
        this.showAgentUsage(name);
        break;
      case 'command':
        this.showCommandUsage(name);
        break;
      case 'hook':
        this.showHookUsage(name);
        break;
      case 'mcp':
        this.showMCPUsage(name);
        break;
    }
  }

  showAgentUsage(name) {
    const agentInfo = {
      'code-reviewer': {
        description: 'Automatically reviews code for quality, security, and best practices',
        activation: 'Activate by running Claude Code in your project directory',
        features: ['Code quality analysis', 'Security review', 'Best practices enforcement']
      },
      'test-generator': {
        description: 'Generates comprehensive test suites for your code',
        activation: 'Use "/generate-tests" command or activate via Claude Code',
        features: ['Unit test generation', 'Integration test creation', 'Mock generation']
      },
      'documentation': {
        description: 'Auto-generates and maintains project documentation',
        activation: 'Use "/generate-docs" command or activate automatically',
        features: ['API documentation', 'README generation', 'Code comments']
      },
      'security-auditor': {
        description: 'Performs security audits and vulnerability scanning',
        activation: 'Use "/security-audit" command or activate via hooks',
        features: ['Vulnerability scanning', 'Security best practices', 'Compliance checking']
      },
      'refactoring': {
        description: 'Provides code refactoring suggestions and improvements',
        activation: 'Activate during code review sessions',
        features: ['Code smell detection', 'Refactoring suggestions', 'Architecture improvements']
      },
      'performance-analyzer': {
        description: 'Analyzes and optimizes application performance',
        activation: 'Use "/optimize-bundle" command or activate during profiling',
        features: ['Performance profiling', 'Bottleneck identification', 'Optimization recommendations']
      }
    };

    const info = agentInfo[name] || {
      description: 'Custom agent for specialized tasks',
      activation: 'Activate via Claude Code interface',
      features: ['Custom functionality']
    };

    console.log(chalk.cyan(`📋 Description: ${info.description}`));
    console.log(chalk.cyan(`🚀 Activation: ${info.activation}`));
    console.log(chalk.cyan('✨ Features:'));
    info.features.forEach(feature => {
      console.log(chalk.cyan(`   • ${feature}`));
    });
  }

  showCommandUsage(name) {
    const commandInfo = {
      'tdd-cycle': {
        usage: '/tdd-cycle <functionality description>',
        description: 'Executes a complete TDD red-green-refactor cycle',
        example: '/tdd-cycle Add user authentication validation'
      },
      'bdd-scenario': {
        usage: '/bdd-scenario <feature description>',
        description: 'Generates BDD scenarios in Gherkin format',
        example: '/bdd-scenario User login with different credentials'
      },
      'project-health': {
        usage: '/project-health',
        description: 'Runs comprehensive project diagnostics',
        example: '/project-health'
      },
      'optimize-bundle': {
        usage: '/optimize-bundle',
        description: 'Analyzes and optimizes project bundle size',
        example: '/optimize-bundle'
      },
      'security-audit': {
        usage: '/security-audit [focus area]',
        description: 'Performs security vulnerability scanning',
        example: '/security-audit dependencies'
      },
      'generate-docs': {
        usage: '/generate-docs [documentation type]',
        description: 'Auto-generates project documentation',
        example: '/generate-docs api'
      }
    };

    const info = commandInfo[name] || {
      usage: `/${name} [arguments]`,
      description: 'Custom command for specialized tasks',
      example: `/${name}`
    };

    console.log(chalk.cyan(`💻 Usage: ${info.usage}`));
    console.log(chalk.cyan(`📋 Description: ${info.description}`));
    console.log(chalk.cyan(`💡 Example: ${info.example}`));
  }

  showHookUsage(name) {
    const hookInfo = {
      'pre-commit': {
        description: 'Runs validation and formatting before git commits',
        triggers: ['Before git commit operations'],
        actions: ['Code linting', 'Formatting', 'Test execution']
      },
      'post-tool': {
        description: 'Runs formatting after file modifications',
        triggers: ['After Edit tool', 'After Write tool'],
        actions: ['Code formatting', 'Linting fixes']
      },
      'test-trigger': {
        description: 'Automatically runs tests when files change',
        triggers: ['After file modifications'],
        actions: ['Test execution', 'Coverage reporting']
      },
      'build-validation': {
        description: 'Ensures builds succeed after changes',
        triggers: ['After significant file changes'],
        actions: ['Build execution', 'Error reporting']
      },
      'security-scan': {
        description: 'Performs security scans during development',
        triggers: ['Session start', 'On demand'],
        actions: ['Vulnerability scanning', 'Dependency checking']
      },
      'session-analytics': {
        description: 'Tracks development session analytics',
        triggers: ['Session start/end'],
        actions: ['Usage logging', 'Performance tracking']
      }
    };

    const info = hookInfo[name] || {
      description: 'Custom hook for automated tasks',
      triggers: ['Custom triggers'],
      actions: ['Custom actions']
    };

    console.log(chalk.cyan(`📋 Description: ${info.description}`));
    console.log(chalk.cyan('🔔 Triggers:'));
    info.triggers.forEach(trigger => {
      console.log(chalk.cyan(`   • ${trigger}`));
    });
    console.log(chalk.cyan('⚡ Actions:'));
    info.actions.forEach(action => {
      console.log(chalk.cyan(`   • ${action}`));
    });
  }

  showMCPUsage(name) {
    const mcpInfo = {
      postgresql: {
        description: 'PostgreSQL database integration for queries and operations',
        setup: ['Set DATABASE_URL environment variable'],
        capabilities: ['Database queries', 'Schema inspection', 'Data operations']
      },
      sqlite: {
        description: 'SQLite database integration for lightweight data operations',
        setup: ['Set DATABASE_PATH environment variable'],
        capabilities: ['Local database queries', 'File-based storage', 'Development testing']
      },
      github: {
        description: 'GitHub integration for repository operations',
        setup: ['Set GITHUB_TOKEN environment variable', 'Configure repository access'],
        capabilities: ['Repository access', 'Issue management', 'Pull request operations']
      },
      sentry: {
        description: 'Sentry integration for error monitoring and tracking',
        setup: ['Set SENTRY_DSN environment variable', 'Configure error tracking'],
        capabilities: ['Error monitoring', 'Performance tracking', 'Issue management']
      },
      slack: {
        description: 'Slack integration for team communication',
        setup: ['Set SLACK_BOT_TOKEN environment variable', 'Configure bot permissions'],
        capabilities: ['Message sending', 'Channel management', 'Notification delivery']
      },
      aws: {
        description: 'AWS services integration for cloud operations',
        setup: ['Set AWS credentials', 'Configure IAM permissions'],
        capabilities: ['S3 operations', 'Lambda functions', 'CloudWatch monitoring']
      },
      docker: {
        description: 'Docker integration for container management',
        setup: ['Ensure Docker daemon is running', 'Configure Docker socket access'],
        capabilities: ['Container management', 'Image operations', 'Service orchestration']
      }
    };

    const info = mcpInfo[name] || {
      description: 'Custom MCP server for external integrations',
      setup: ['Configure environment variables as needed'],
      capabilities: ['Custom integration capabilities']
    };

    console.log(chalk.cyan(`📋 Description: ${info.description}`));
    console.log(chalk.cyan('⚙️  Setup Requirements:'));
    info.setup.forEach(requirement => {
      console.log(chalk.cyan(`   • ${requirement}`));
    });
    console.log(chalk.cyan('🔧 Capabilities:'));
    info.capabilities.forEach(capability => {
      console.log(chalk.cyan(`   • ${capability}`));
    });

    if (name !== 'filesystem' && name !== 'git') {
      console.log(chalk.yellow('\n⚠️  Remember to restart Claude Code after adding MCP servers'));
      console.log(chalk.gray('   Use: claude --mcp-debug for troubleshooting'));
    }
  }

  async listAvailableComponents() {
    console.log(chalk.blue.bold('📦 Available Components\n'));

    // List agents
    const agents = await agentsManager.listAvailableAgents();
    console.log(chalk.green.bold('🤖 AI Agents:'));
    agents.forEach(agent => {
      console.log(chalk.cyan(`  • ${agent.name}: ${agent.description}`));
      console.log(chalk.gray(`    Languages: ${agent.languages.join(', ')}`));
    });

    // List commands
    const commands = await commandsManager.listAvailableCommands();
    console.log(chalk.green.bold('\n💻 Custom Commands:'));
    commands.forEach(command => {
      console.log(chalk.cyan(`  • ${command.name}: ${command.description}`));
      console.log(chalk.gray(`    Usage: ${command.usage}`));
    });

    // List hooks
    const hooks = await hooksManager.listAvailableHooks();
    console.log(chalk.green.bold('\n🔗 Automation Hooks:'));
    hooks.forEach(hook => {
      console.log(chalk.cyan(`  • ${hook.name}: ${hook.description}`));
      console.log(chalk.gray(`    Events: ${hook.events.join(', ')}`));
    });

    // List MCP servers
    const mcpServers = await mcpManager.getAvailableServers();
    console.log(chalk.green.bold('\n🔌 MCP Servers:'));
    mcpServers.forEach(server => {
      console.log(chalk.cyan(`  • ${server.name}: ${server.description}`));
      const recommended = server.recommended ? chalk.green('(Recommended)') : '';
      console.log(chalk.gray(`    ${recommended}`));
    });

    console.log(chalk.blue.bold('\n📖 Usage:'));
    console.log(chalk.cyan('  ucw add agent code-reviewer'));
    console.log(chalk.cyan('  ucw add command tdd-cycle'));
    console.log(chalk.cyan('  ucw add hook pre-commit'));
    console.log(chalk.cyan('  ucw add mcp postgresql'));
  }

  async removeComponent(type, name) {
    console.log(chalk.blue.bold(`🗑️  Removing ${type}: ${name}\n`));

    const spinner = ora(`Removing ${type} ${name}...`).start();

    try {
      switch (type.toLowerCase()) {
        case 'mcp':
          const removed = await mcpManager.removeServer(name);
          if (!removed) {
            throw new Error(`MCP server "${name}" not found`);
          }
          break;
        default:
          throw new Error(`Removal not implemented for ${type}`);
      }

      spinner.succeed(`${type} ${name} removed successfully`);
      console.log(chalk.green(`✅ ${type} "${name}" has been removed`));

    } catch (error) {
      spinner.fail(`Failed to remove ${type} ${name}`);
      throw error;
    }
  }
}

module.exports = new ComponentManager();