const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

class Remover {
  async remove(component, options = {}) {
    if (options.all) {
      await this.removeAll(options.force);
    } else if (component) {
      await this.removeComponent(component, options.force);
    } else {
      await this.removeInteractive();
    }
  }

  async removeAll(force = false) {
    console.log(chalk.red.bold('🗑️  Remove Universal Claude Workflow\n'));

    if (!force) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Are you sure you want to remove the entire UCW setup?',
          default: false
        }
      ]);

      if (!confirmed) {
        console.log(chalk.yellow('Removal cancelled.'));
        return;
      }

      const { doubleConfirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'doubleConfirmed',
          message: 'This will delete all UCW configuration, agents, commands, and hooks. Continue?',
          default: false
        }
      ]);

      if (!doubleConfirmed) {
        console.log(chalk.yellow('Removal cancelled.'));
        return;
      }
    }

    console.log(chalk.cyan('🧹 Removing UCW configuration...\n'));

    const itemsToRemove = [
      { name: 'CLAUDE.md', path: 'CLAUDE.md', type: 'file' },
      { name: '.claude directory', path: '.claude', type: 'directory' },
      { name: 'MCP configuration', path: '.mcp.json', type: 'file' },
      { name: 'UCW analytics', path: '.ucw-analytics.log', type: 'file' },
      { name: 'UCW session data', path: '.ucw-session.json', type: 'file' },
      { name: 'UCW update history', path: '.ucw-update-history.json', type: 'file' },
      { name: 'UCW health reports', path: 'ucw-health-report.md', type: 'file' },
      { name: 'MCP documentation', path: 'docs/mcp-configuration.md', type: 'file' }
    ];

    for (const item of itemsToRemove) {
      const spinner = ora(`Removing ${item.name}...`).start();
      try {
        const fullPath = path.join(process.cwd(), item.path);
        if (await fs.pathExists(fullPath)) {
          await fs.remove(fullPath);
          spinner.succeed(`Removed ${item.name}`);
        } else {
          spinner.succeed(`${item.name} (not found)`);
        }
      } catch (error) {
        spinner.fail(`Failed to remove ${item.name}: ${error.message}`);
      }
    }

    // Clean up empty docs directory
    const docsDir = path.join(process.cwd(), 'docs');
    if (await fs.pathExists(docsDir)) {
      try {
        const files = await fs.readdir(docsDir);
        if (files.length === 0) {
          await fs.remove(docsDir);
          console.log(chalk.green('✓ Removed empty docs directory'));
        }
      } catch (error) {
        // Ignore errors when cleaning up docs directory
      }
    }

    console.log(chalk.green.bold('\n✅ UCW removal completed!'));
    console.log(chalk.gray('Claude Code will continue to work normally without UCW enhancements.'));
  }

  async removeComponent(componentName, force = false) {
    console.log(chalk.red.bold(`🗑️  Remove Component: ${componentName}\n`));

    // Detect component type
    const componentType = await this.detectComponentType(componentName);
    
    if (!componentType) {
      console.log(chalk.red(`❌ Component "${componentName}" not found.`));
      return;
    }

    if (!force) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Remove ${componentType} "${componentName}"?`,
          default: false
        }
      ]);

      if (!confirmed) {
        console.log(chalk.yellow('Removal cancelled.'));
        return;
      }
    }

    const spinner = ora(`Removing ${componentType} ${componentName}...`).start();

    try {
      switch (componentType) {
        case 'agent':
          await this.removeAgent(componentName);
          break;
        case 'command':
          await this.removeCommand(componentName);
          break;
        case 'hook':
          await this.removeHook(componentName);
          break;
        case 'mcp':
          await this.removeMCPServer(componentName);
          break;
        default:
          throw new Error(`Unknown component type: ${componentType}`);
      }

      spinner.succeed(`Removed ${componentType} ${componentName}`);
      console.log(chalk.green(`✅ ${componentType} "${componentName}" has been removed`));

    } catch (error) {
      spinner.fail(`Failed to remove ${componentType} ${componentName}`);
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  }

  async removeInteractive() {
    console.log(chalk.blue.bold('🗑️  Interactive Component Removal\n'));

    const installedComponents = await this.getInstalledComponents();

    if (installedComponents.length === 0) {
      console.log(chalk.yellow('No UCW components found to remove.'));
      return;
    }

    const choices = installedComponents.map(component => ({
      name: `${component.type}: ${component.name}`,
      value: component
    }));

    choices.push(new inquirer.Separator());
    choices.push({
      name: chalk.red('🗑️  Remove entire UCW setup'),
      value: { type: 'all', name: 'all' }
    });

    const { selectedComponents } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedComponents',
        message: 'Select components to remove:',
        choices: choices
      }
    ]);

    if (selectedComponents.length === 0) {
      console.log(chalk.yellow('No components selected for removal.'));
      return;
    }

    // Check if user wants to remove everything
    const removeAll = selectedComponents.some(c => c.type === 'all');
    
    if (removeAll) {
      await this.removeAll(false);
      return;
    }

    console.log(chalk.cyan(`\n🗑️  Removing ${selectedComponents.length} components...\n`));

    for (const component of selectedComponents) {
      await this.removeComponent(component.name, true);
    }

    console.log(chalk.green.bold('\n✅ Component removal completed!'));
  }

  async detectComponentType(componentName) {
    // Check agents
    const agentPath = path.join(process.cwd(), '.claude', 'agents', `${componentName}.md`);
    if (await fs.pathExists(agentPath)) {
      return 'agent';
    }

    // Check commands
    const commandPath = path.join(process.cwd(), '.claude', 'commands', `${componentName}.md`);
    if (await fs.pathExists(commandPath)) {
      return 'command';
    }

    // Check MCP servers
    const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
    if (await fs.pathExists(mcpConfigPath)) {
      try {
        const mcpConfig = await fs.readJSON(mcpConfigPath);
        if (mcpConfig.mcpServers && mcpConfig.mcpServers[componentName]) {
          return 'mcp';
        }
      } catch (error) {
        // Invalid MCP config
      }
    }

    // Check hooks (more complex as they're embedded in settings)
    const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      try {
        const settings = await fs.readJSON(settingsPath);
        if (settings.hooks) {
          // Check if any hook configuration mentions this component
          const hooksContent = JSON.stringify(settings.hooks);
          if (hooksContent.includes(componentName)) {
            return 'hook';
          }
        }
      } catch (error) {
        // Invalid settings
      }
    }

    return null;
  }

  async removeAgent(agentName) {
    // Remove agent file
    const agentPath = path.join(process.cwd(), '.claude', 'agents', `${agentName}.md`);
    if (await fs.pathExists(agentPath)) {
      await fs.remove(agentPath);
    }

    // Update agent registry
    const registryPath = path.join(process.cwd(), '.claude', 'agents-registry.json');
    if (await fs.pathExists(registryPath)) {
      try {
        const registry = await fs.readJSON(registryPath);
        if (registry.agents) {
          registry.agents = registry.agents.filter(agent => agent.name !== agentName);
          await fs.writeJSON(registryPath, registry, { spaces: 2 });
        }
      } catch (error) {
        // Registry might be corrupted, continue anyway
      }
    }

    // Remove from settings
    await this.removeFromSettings('agents', agentName);
  }

  async removeCommand(commandName) {
    // Remove command file
    const commandPath = path.join(process.cwd(), '.claude', 'commands', `${commandName}.md`);
    if (await fs.pathExists(commandPath)) {
      await fs.remove(commandPath);
    }

    // Remove from settings
    await this.removeFromSettings('customCommands', commandName);
  }

  async removeHook(hookName) {
    const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
    
    if (!await fs.pathExists(settingsPath)) {
      return;
    }

    try {
      const settings = await fs.readJSON(settingsPath);
      
      if (settings.hooks) {
        // Remove hook configurations that match the hook name
        Object.keys(settings.hooks).forEach(eventName => {
          if (Array.isArray(settings.hooks[eventName])) {
            settings.hooks[eventName] = settings.hooks[eventName].filter(hookConfig => {
              // This is a simplified removal - in practice you'd need more sophisticated matching
              return !JSON.stringify(hookConfig).includes(hookName);
            });
            
            // Remove empty event arrays
            if (settings.hooks[eventName].length === 0) {
              delete settings.hooks[eventName];
            }
          }
        });
        
        await fs.writeJSON(settingsPath, settings, { spaces: 2 });
      }
    } catch (error) {
      throw new Error(`Failed to update hooks configuration: ${error.message}`);
    }
  }

  async removeMCPServer(serverName) {
    const mcpManager = require('./mcp-manager');
    const removed = await mcpManager.removeServer(serverName);
    
    if (!removed) {
      throw new Error(`MCP server "${serverName}" not found in configuration`);
    }
  }

  async removeFromSettings(settingsKey, itemName) {
    const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
    
    if (!await fs.pathExists(settingsPath)) {
      return;
    }

    try {
      const settings = await fs.readJSON(settingsPath);
      
      if (settings[settingsKey] && Array.isArray(settings[settingsKey])) {
        settings[settingsKey] = settings[settingsKey].filter(item => item !== itemName);
        await fs.writeJSON(settingsPath, settings, { spaces: 2 });
      }
    } catch (error) {
      // Settings file might be corrupted, continue anyway
    }
  }

  async getInstalledComponents() {
    const components = [];

    // Get agents
    const agentsDir = path.join(process.cwd(), '.claude', 'agents');
    if (await fs.pathExists(agentsDir)) {
      try {
        const agentFiles = await fs.readdir(agentsDir);
        agentFiles.filter(file => file.endsWith('.md')).forEach(file => {
          components.push({
            type: 'agent',
            name: path.basename(file, '.md')
          });
        });
      } catch (error) {
        // Directory might not be accessible
      }
    }

    // Get commands
    const commandsDir = path.join(process.cwd(), '.claude', 'commands');
    if (await fs.pathExists(commandsDir)) {
      try {
        const commandFiles = await fs.readdir(commandsDir);
        commandFiles.filter(file => file.endsWith('.md')).forEach(file => {
          components.push({
            type: 'command',
            name: path.basename(file, '.md')
          });
        });
      } catch (error) {
        // Directory might not be accessible
      }
    }

    // Get MCP servers
    const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
    if (await fs.pathExists(mcpConfigPath)) {
      try {
        const mcpConfig = await fs.readJSON(mcpConfigPath);
        if (mcpConfig.mcpServers) {
          Object.keys(mcpConfig.mcpServers).forEach(serverName => {
            components.push({
              type: 'mcp',
              name: serverName
            });
          });
        }
      } catch (error) {
        // MCP config might be corrupted
      }
    }

    // Get hooks (simplified - just list known hook types)
    const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      try {
        const settings = await fs.readJSON(settingsPath);
        if (settings.hooks && Object.keys(settings.hooks).length > 0) {
          // Add generic hook entries
          const knownHooks = ['pre-commit', 'post-tool', 'test-trigger', 'build-validation', 'security-scan', 'session-analytics'];
          const hooksContent = JSON.stringify(settings.hooks);
          
          knownHooks.forEach(hookName => {
            if (hooksContent.includes(hookName) || hooksContent.includes(hookName.replace('-', '_'))) {
              components.push({
                type: 'hook',
                name: hookName
              });
            }
          });
        }
      } catch (error) {
        // Settings might be corrupted
      }
    }

    return components;
  }

  async createBackup() {
    console.log(chalk.blue('📦 Creating backup before removal...\n'));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), `ucw-backup-${timestamp}`);
    
    await fs.ensureDir(backupDir);

    const filesToBackup = [
      'CLAUDE.md',
      '.claude',
      '.mcp.json',
      '.ucw-analytics.log',
      '.ucw-session.json',
      '.ucw-update-history.json'
    ];

    for (const file of filesToBackup) {
      const sourcePath = path.join(process.cwd(), file);
      const destPath = path.join(backupDir, file);
      
      if (await fs.pathExists(sourcePath)) {
        try {
          await fs.copy(sourcePath, destPath);
          console.log(chalk.green(`✓ Backed up ${file}`));
        } catch (error) {
          console.log(chalk.yellow(`⚠ Failed to backup ${file}: ${error.message}`));
        }
      }
    }

    console.log(chalk.cyan(`\n📁 Backup created at: ${backupDir}`));
    return backupDir;
  }
}

module.exports = new Remover();