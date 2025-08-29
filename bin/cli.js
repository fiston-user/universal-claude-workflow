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

// Import advanced UCW intelligence modules
const workflowEngine = require('../src/workflow-engine');
const instructionsEngine = require('../src/instructions-engine');
const subagentOrchestrator = require('../src/subagent-orchestrator');

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

// Intelligent workflow management
program
  .command('workflow <intent>')
  .description('Start an intelligent AI-powered workflow')
  .option('-c, --complexity <level>', 'Project complexity (simple, medium, complex, enterprise)')
  .option('-t, --team-size <size>', 'Team size (solo, small, medium, large)')
  .option('--agents <agents>', 'Comma-separated list of specific agents to use')
  .action(async (intent, options) => {
    try {
      console.log(chalk.blue.bold('🧠 Starting Intelligent Workflow Engine\n'));
      
      const workflowOptions = {
        complexity: options.complexity,
        teamSize: options.teamSize
      };
      
      if (options.agents) {
        workflowOptions.preferredAgents = options.agents.split(',').map(a => a.trim());
      }
      
      const workflow = await workflowEngine.startWorkflow(intent, workflowOptions);
      
      console.log(chalk.green.bold('\n🎉 Workflow completed successfully!'));
      console.log(chalk.cyan(`Workflow ID: ${workflow.id}`));
      console.log(chalk.cyan(`Duration: ${((workflow.completedAt - workflow.startTime) / 1000).toFixed(1)}s`));
      
    } catch (error) {
      console.error(chalk.red('❌ Workflow failed:'), error.message);
      process.exit(1);
    }
  });

// Get AI-powered guidance
program
  .command('guide <task>')
  .description('Get intelligent, context-aware guidance for development tasks')
  .option('-v, --verbose', 'Show detailed instructions')
  .option('-s, --skill-level <level>', 'Your skill level (beginner, intermediate, expert)')
  .action(async (task, options) => {
    try {
      console.log(chalk.blue.bold('🧭 UCW Intelligent Guidance System\n'));
      
      const context = {
        skillLevel: options.skillLevel || 'intermediate',
        verbosity: options.verbose ? 'detailed' : 'standard',
        projectInfo: await projectDetector.detect(process.cwd())
      };
      
      const instructions = await instructionsEngine.getInstructions(task, context);
      
      console.log(chalk.cyan.bold(`📋 ${instructions.name}\n`));
      console.log(chalk.gray(instructions.description));
      console.log();
      
      for (let i = 0; i < instructions.steps.length; i++) {
        const step = instructions.steps[i];
        console.log(chalk.blue.bold(`${i + 1}. ${step.name}`));
        console.log(chalk.gray(`   ${step.description}`));
        
        if (step.substeps && step.substeps.length > 0) {
          for (let j = 0; j < step.substeps.length; j++) {
            console.log(chalk.cyan(`   ${i + 1}.${j + 1} ${step.substeps[j]}`));
          }
        }
        console.log();
      }
      
      // Show contextual adaptations
      if (instructions.adaptations && instructions.adaptations.length > 0) {
        console.log(chalk.yellow.bold('🔧 Context Adaptations Applied:'));
        instructions.adaptations.forEach(adaptation => {
          console.log(chalk.yellow(`  • ${adaptation.type}: ${adaptation.changes || adaptation.level || adaptation.framework}`));
        });
        console.log();
      }
      
      // Get next step recommendations
      const recommendations = await instructionsEngine.getNextStepRecommendations(context);
      if (recommendations.length > 0) {
        console.log(chalk.magenta.bold('🔮 Intelligent Recommendations:'));
        recommendations.forEach(rec => {
          const priorityColor = rec.priority === 'high' ? chalk.red : rec.priority === 'medium' ? chalk.yellow : chalk.green;
          console.log(priorityColor(`  • ${rec.description} (${rec.estimatedTime})`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Guidance failed:'), error.message);
      process.exit(1);
    }
  });

// Multi-agent orchestration
program
  .command('orchestrate <task>')
  .description('Orchestrate multiple AI agents for complex development tasks')
  .option('-a, --agents <agents>', 'Specific agents to include (architect,coder,reviewer,tester)')
  .option('-p, --parallel', 'Execute agents in parallel when possible')
  .option('-q, --quality-level <level>', 'Quality requirements (basic, standard, high, enterprise)')
  .action(async (task, options) => {
    try {
      console.log(chalk.blue.bold('🎭 Multi-Agent Orchestration System\n'));
      
      const taskConfig = {
        name: task,
        type: 'development',
        requiresQA: options.qualityLevel !== 'basic',
        qualityRequirements: {
          level: options.qualityLevel || 'standard',
          testCoverage: options.qualityLevel === 'enterprise' ? 0.95 : 0.8,
          codeReview: true
        },
        executionMode: options.parallel ? 'parallel' : 'intelligent'
      };
      
      if (options.agents) {
        taskConfig.preferredAgents = options.agents.split(',').map(a => a.trim());
      }
      
      const context = {
        projectInfo: await projectDetector.detect(process.cwd()),
        timeConstraints: { maxDuration: 3600000 }, // 1 hour
        userPreferences: { parallel: options.parallel }
      };
      
      const result = await subagentOrchestrator.orchestrateTask(taskConfig, context);
      
      console.log(chalk.green.bold('\n🎉 Multi-agent orchestration completed!'));
      console.log(chalk.cyan(`Task: ${taskConfig.name}`));
      console.log(chalk.cyan(`Phases completed: ${result.phases}`));
      console.log(chalk.cyan(`Duration: ${(result.duration / 1000).toFixed(1)}s`));
      
    } catch (error) {
      console.error(chalk.red('❌ Orchestration failed:'), error.message);
      process.exit(1);
    }
  });

// Intelligent feature creation
program
  .command('create-feature <name>')
  .description('Intelligently create a new feature with full AI orchestration')
  .option('-d, --description <desc>', 'Feature description')
  .option('-c, --complexity <level>', 'Feature complexity (simple, medium, complex)')
  .option('--with-tests', 'Include comprehensive test suite')
  .option('--with-docs', 'Include documentation generation')
  .action(async (name, options) => {
    try {
      console.log(chalk.blue.bold(`🚀 Creating Feature: ${name}\n`));
      
      // Start intelligent workflow for feature creation
      const workflow = await workflowEngine.startWorkflow('create-feature', {
        featureName: name,
        description: options.description || `New feature: ${name}`,
        complexity: options.complexity || 'medium',
        includeTests: options.withTests || true,
        includeDocumentation: options.withDocs || false,
        fullOrchestration: true
      });
      
      // Orchestrate multiple agents for comprehensive feature development
      const orchestrationTask = {
        name: `feature-${name}`,
        type: 'feature-development',
        primarySkill: 'coding',
        requiresQA: true,
        qualityRequirements: {
          level: 'high',
          testCoverage: 0.9,
          codeReview: true,
          securityScan: true
        }
      };
      
      const context = {
        feature: { name, description: options.description },
        projectInfo: await projectDetector.detect(process.cwd()),
        workflow: workflow
      };
      
      await subagentOrchestrator.orchestrateTask(orchestrationTask, context);
      
      console.log(chalk.green.bold(`\n🎉 Feature '${name}' created successfully!`));
      console.log(chalk.cyan('The feature has been implemented with:'));
      console.log(chalk.cyan('  ✓ Intelligent architecture design'));
      console.log(chalk.cyan('  ✓ Comprehensive code implementation'));  
      console.log(chalk.cyan('  ✓ Full test suite with high coverage'));
      console.log(chalk.cyan('  ✓ Code review and quality assurance'));
      console.log(chalk.cyan('  ✓ Security validation'));
      
      if (options.withDocs) {
        console.log(chalk.cyan('  ✓ Complete documentation'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Feature creation failed:'), error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
